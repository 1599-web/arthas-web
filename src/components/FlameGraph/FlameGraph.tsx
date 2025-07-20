// @ts-nocheck
// eslint-disable-next-line
import React, { useState, useImperativeHandle, forwardRef } from 'react';
import { colorForName } from '../../utils/color';
import { toReadableValue } from '../../utils/format';

// FlameGraph数据结构示例
type FlameNode = {
  name: string;
  value: number;
  children?: FlameNode[];
};

interface FlameGraphProps {
  data: FlameNode | null;
  width?: number;
  height?: number;
  search?: string;
  total?: number;
  onZoomChange?: (zoomNode: FlameNode | null) => void;
}

const COLORS = [
  '#FFB74D', '#4FC3F7', '#81C784', '#BA68C8', '#E57373', '#FFD54F', '#A1887F', '#90A4AE', '#64B5F6', '#F06292',
  '#537e8b', '#c12561', '#fec91b', '#3f7350', '#408118', '#3ea9da', '#9fb036', '#b671c1', '#faa938'
];

const BAR_HEIGHT = 32;
const BAR_GAP = 4;
const TEXT_PADDING = 8;
const MIN_TEXT_WIDTH = 60; // 最小文本显示宽度

// 截断文本函数
function truncateText(text: string, maxWidth: number, fontSize: number = 12): string {
  if (maxWidth <= MIN_TEXT_WIDTH) {
    return '';
  }
  
  // 更精确的字符宽度估算
  const getCharWidth = (char: string) => {
    // 中文字符、全角字符
    if (/[\u4e00-\u9fa5\u3000-\u303f\uff00-\uffef]/.test(char)) {
      return 14;
    }
    // 数字和英文字符
    if (/[0-9a-zA-Z]/.test(char)) {
      return 8;
    }
    // 其他字符
    return 6;
  };
  
  // 计算文本总宽度
  const textWidth = text.split('').reduce((width, char) => width + getCharWidth(char), 0);
  const availableWidth = maxWidth - TEXT_PADDING * 2;
  
  if (textWidth <= availableWidth) {
    return text;
  }
  
  // 智能截断：优先保留方法名和类名
  const parts = text.split('.');
  if (parts.length >= 2) {
    const className = parts[parts.length - 2];
    const methodName = parts[parts.length - 1];
    
    // 如果只有类名和方法名，尝试显示完整的方法名
    if (parts.length === 2) {
      const methodWidth = methodName.split('').reduce((width, char) => width + getCharWidth(char), 0);
      if (methodWidth + 3 <= availableWidth) { // 3是省略号长度
        return `...${methodName}`;
      }
    }
    
    // 显示类名.方法名的形式
    const shortName = `${className}.${methodName}`;
    const shortWidth = shortName.split('').reduce((width, char) => width + getCharWidth(char), 0);
    if (shortWidth <= availableWidth) {
      return shortName;
    }
  }
  
  // 通用截断逻辑
  let currentWidth = 0;
  let truncatedText = '';
  const suffix = '...';
  const suffixWidth = 3 * 6; // 省略号宽度
  
  for (let i = 0; i < text.length; i++) {
    const charWidth = getCharWidth(text[i]);
    if (currentWidth + charWidth + suffixWidth <= availableWidth) {
      truncatedText += text[i];
      currentWidth += charWidth;
    } else {
      break;
    }
  }
  
  return truncatedText + suffix;
}

// 获取方法名的简短版本
function getShortMethodName(name: string): string {
  // 如果是完整的类名+方法名，提取方法名
  if (name.includes('.')) {
    const parts = name.split('.');
    if (parts.length >= 2) {
      const methodName = parts[parts.length - 1];
      const className = parts[parts.length - 2];
      return `${className}.${methodName}`;
    }
  }
  return name;
}

// 格式化方法名用于工具提示显示
function formatMethodName(name: string): string {
  if (!name.includes('.')) {
    return name;
  }
  
  const parts = name.split('.');
  if (parts.length === 2) {
    // 简单的类名.方法名格式
    return `${parts[0]}.${parts[1]}`;
  } else if (parts.length > 2) {
    // 复杂的包名.类名.方法名格式
    const className = parts[parts.length - 2];
    const methodName = parts[parts.length - 1];
    const packageName = parts.slice(0, -2).join('.');
    
    // 如果包名太长，只显示最后一部分
    if (packageName.length > 30) {
      const shortPackage = '...' + packageName.substring(packageName.length - 25);
      return `${shortPackage}.${className}.${methodName}`;
    }
    
    return `${packageName}.${className}.${methodName}`;
  }
  
  return name;
}

function FlameRect({ node, x, y, width, height, depth, onHover, isActive, onClick, isZoomed, isHighlighted }: any) {
  const displayText = width > MIN_TEXT_WIDTH ? truncateText(node.name, width) : '';
  const showText = displayText.length > 0;
  
  // 根据宽度调整字体大小
  const fontSize = width < 100 ? 10 : width < 150 ? 11 : 12;
  
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={colorForName(node.name, COLORS)}
        opacity={isActive ? 1 : 0.7}
        stroke={isHighlighted ? '#ff8200' : '#fff'}
        strokeWidth={isHighlighted ? 3 : 1}
        rx={4}
        onMouseEnter={e => onHover(node, e, true)}
        onMouseLeave={e => onHover(node, e, false)}
        onClick={e => { e.stopPropagation(); onClick(node); }}
        style={{ cursor: 'pointer' }}
      />
      {showText && (
        <text
          x={x + TEXT_PADDING}
          y={y + height / 2 + 4}
          fontSize={fontSize}
          fill="#222"
          pointerEvents="none"
          style={{ userSelect: 'none' }}
          textAnchor="start"
          dominantBaseline="middle"
        >
          {displayText}
        </text>
      )}
    </g>
  );
}

function renderFlame(node: FlameNode, x: number, y: number, width: number, depth: number, total: number, onHover: any, activeNode: any, onClick: any, zoomNode: any, search: string): any[] {
  if (!node) return [];
  const isHighlighted = search && node.name.toLowerCase().includes(search.toLowerCase());
  const rects = [
    <FlameRect
      key={node.name + '-' + y}
      node={node}
      x={x}
      y={y}
      width={width}
      height={BAR_HEIGHT}
      depth={depth}
      onHover={onHover}
      isActive={activeNode === node}
      onClick={onClick}
      isZoomed={zoomNode === node}
      isHighlighted={isHighlighted}
    />
  ];
  if (node.children && node.children.length > 0) {
    let childX = x;
    const sum = node.children.reduce((s, c) => s + c.value, 0) || 1;
    for (const child of node.children) {
      const childWidth = width * (child.value / sum);
      rects.push(...renderFlame(child, childX, y + BAR_HEIGHT + BAR_GAP, childWidth, depth + 1, total, onHover, activeNode, onClick, zoomNode, search));
      childX += childWidth;
    }
  }
  return rects;
}

const FlameGraph = forwardRef<{ resetZoom: () => void }, FlameGraphProps>(({ data, width, height = 320, search = '', total, onZoomChange }, ref) => {
  const [hovered, setHovered] = useState<any>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; node: FlameNode } | null>(null);
  const [zoomNode, setZoomNode] = useState<any>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [svgWidth, setSvgWidth] = useState(width || 900);

  React.useEffect(() => {
    function updateWidth() {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        setSvgWidth(Math.max(containerWidth, 300)); // 最小宽度300px
      }
    }
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // 当缩放状态改变时通知父组件
  React.useEffect(() => {
    onZoomChange && onZoomChange(zoomNode);
  }, [zoomNode, onZoomChange]);

  // 暴露重置方法给父组件
  React.useImperativeHandle(ref, () => ({
    resetZoom: () => setZoomNode(null)
  }));

  if (!data) {
    return (
      <div style={{ 
        height: 400, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        color: '#aaa', 
        fontSize: 20,
        background: '#fafafa',
        borderRadius: 8,
        border: '1px dashed #ddd'
      }}>
        暂无火焰图数据
      </div>
    );
  }

  // 计算最大深度
  function getDepth(node: FlameNode, d = 1): number {
    if (!node.children || node.children.length === 0) return d;
    return Math.max(...node.children.map(c => getDepth(c, d + 1)));
  }
  const maxDepth = getDepth(zoomNode || data);
  const svgHeight = Math.max(maxDepth * (BAR_HEIGHT + BAR_GAP) + 40, 200); // 最小高度200px

  // 悬停事件
  const handleHover = (node: FlameNode, e: any, active: boolean) => {
    setHovered(active ? node : null);
    if (active) {
      setTooltip({
        x: e.clientX,
        y: e.clientY,
        node,
      });
    } else {
      setTooltip(null);
    }
  };

  // 点击缩放
  const handleClick = (node: FlameNode) => {
    setZoomNode(node);
  };

  // 双击重置
  const handleDoubleClick = (e: any) => {
    setZoomNode(null);
  };

  // 计算总权重
  function getTotal(node: FlameNode): number {
    return node.value || 1;
  }
  const totalValue = total || getTotal(zoomNode || data);

  return (
    <div style={{ 
      position: 'relative', 
      width: '100%',
      minHeight: 200,
      background: '#fafafa',
      borderRadius: 8,
      overflow: 'hidden'
    }} ref={containerRef}>
      <svg 
        width={svgWidth} 
        height={svgHeight} 
        style={{ 
          display: 'block', 
          background: '#fafafa', 
          borderRadius: 8, 
          width: '100%', 
          minWidth: 300,
          maxWidth: '100%'
        }} 
        onDoubleClick={handleDoubleClick}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        preserveAspectRatio="xMidYMid meet"
      >
        {renderFlame(zoomNode || data, 0, 20, svgWidth, 0, totalValue, handleHover, hovered, handleClick, zoomNode, search)}
      </svg>
      {tooltip && (
        <div
          style={{
            position: 'fixed',
            left: Math.min(tooltip.x + 12, window.innerWidth - 250),
            top: Math.min(tooltip.y + 12, window.innerHeight - 150),
            background: '#fff',
            border: '1px solid #ddd',
            borderRadius: 6,
            boxShadow: '0 2px 8px #0001',
            padding: '8px 16px',
            zIndex: 1000,
            pointerEvents: 'none',
            color: '#222',
            fontSize: 14,
            minWidth: 200,
            maxWidth: 500,
            wordBreak: 'break-all',
            whiteSpace: 'pre-wrap',
          }}
        >
          <div style={{ 
            fontWeight: 'bold', 
            marginBottom: 4, 
            wordBreak: 'break-all',
            lineHeight: '1.4',
            fontSize: 13
          }}>
            {formatMethodName(tooltip.node.name)}
          </div>
          <div style={{ fontSize: 12, color: '#666', marginBottom: 2 }}>
            耗时/值: {toReadableValue('ns', tooltip.node.value)}
          </div>
          <div style={{ fontSize: 12, color: '#666', marginBottom: 2 }}>
            百分比: {((tooltip.node.value / totalValue) * 100).toFixed(2)}%
          </div>
          {tooltip.node.children && (
            <div style={{ fontSize: 12, color: '#666' }}>
              子节点: {tooltip.node.children.length}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

export default FlameGraph; 