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

function FlameRect({ node, x, y, width, height, depth, onHover, isActive, onClick, isZoomed, isHighlighted }: any) {
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
      <text
        x={x + TEXT_PADDING}
        y={y + height / 2 + 6}
        fontSize={14}
        fill="#222"
        pointerEvents="none"
        style={{ userSelect: 'none' }}
      >
        {node.name}
      </text>
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
        setSvgWidth(containerRef.current.offsetWidth);
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
      <div style={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa', fontSize: 20 }}>
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
  const svgHeight = maxDepth * (BAR_HEIGHT + BAR_GAP) + 40;

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
    <div style={{ position: 'relative', width: '100%' }} ref={containerRef}>
      <svg width={svgWidth} height={svgHeight} style={{ display: 'block', background: '#fafafa', borderRadius: 8, width: '100%', minWidth: 300 }} onDoubleClick={handleDoubleClick}>
        {renderFlame(zoomNode || data, 0, 20, svgWidth, 0, totalValue, handleHover, hovered, handleClick, zoomNode, search)}
      </svg>
      {tooltip && (
        <div
          style={{
            position: 'fixed',
            left: tooltip.x + 12,
            top: tooltip.y + 12,
            background: '#fff',
            border: '1px solid #ddd',
            borderRadius: 6,
            boxShadow: '0 2px 8px #0001',
            padding: '8px 16px',
            zIndex: 1000,
            pointerEvents: 'none',
            color: '#222',
            fontSize: 14,
            minWidth: 180,
          }}
        >
          <div><b>{tooltip.node.name}</b></div>
          <div>耗时/值: {toReadableValue('ns', tooltip.node.value)}</div>
          <div>百分比: {((tooltip.node.value / totalValue) * 100).toFixed(2)}%</div>
          {tooltip.node.children && <div>子节点: {tooltip.node.children.length}</div>}
        </div>
      )}
    </div>
  );
});

export default FlameGraph; 