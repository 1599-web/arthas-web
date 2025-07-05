// @ts-nocheck
// eslint-disable-next-line
import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Select, Input, Checkbox, Typography, Spin, message } from 'antd';
import { useParams } from 'react-router-dom';
import FlameGraph from '../../components/FlameGraph';
import { getDimensions, getFlameGraph } from '../../services/mock';
import { formatFlamegraph } from '../../utils/formatFlamegraph';

const { Title } = Typography;

const Analysis: React.FC = () => {
  const { fileId } = useParams();
  const [dimension, setDimension] = useState('');
  const [dimensionOptions, setDimensionOptions] = useState([]);
  const [unit, setUnit] = useState('ns');
  const [taskSearch, setTaskSearch] = useState('');
  const [allTasks, setAllTasks] = useState([]);
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [include, setInclude] = useState(true);
  const [flameData, setFlameData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [isZoomed, setIsZoomed] = useState(false);
  const flameGraphRef = React.useRef<any>(null);

  // 加载维度元数据
  useEffect(() => {
    // mock实现
    getDimensions({ fileId }).then(res => {
      if (res.code === 1 && res.data && Array.isArray(res.data.perfDimensions)) {
        const dims = res.data.perfDimensions.map(d => ({ label: d.key, value: d.key, unit: d.unit, filters: d.filters }));
        setDimensionOptions(dims);
        if (dims.length > 0) {
          setDimension(dims[0].value);
          setUnit(dims[0].unit);
        }
      }
    });
    // 真实接口
    // if (!fileId) return;
    // fetchJfrMetadata(fileId)
    //   .then(res => {
    //     const dims = res.perfDimensions || res.data?.perfDimensions || [];
    //     setDimensionOptions(dims.map(d => ({ label: d.key, value: d.key, unit: d.unit, filters: d.filters })));
    //     if (dims.length > 0) {
    //       setDimension(dims[0].key);
    //       setUnit(dims[0].unit);
    //     }
    //   })
    //   .catch(e => message.error(e.message));
  }, []);

  // 加载火焰图数据
  useEffect(() => {
    if (!dimension) return;
    setLoading(true);
    getFlameGraph({ fileId, dimension, include, taskSet: selectedTasks })
      .then(res => {
        if (res.code === 1 && res.data) {
          const { data, symbolTable, threadSplit } = res.data;
          if (data && symbolTable) {
            setFlameData(formatFlamegraph(data, symbolTable));
          } else {
            setFlameData(null);
          }
          if (threadSplit) {
            setAllTasks(Object.keys(threadSplit));
          }
        } else {
          setFlameData(null);
        }
        setLoading(false);
      })
      .catch(e => { setLoading(false); message.error(e.message); });
    // 真实接口：如需切换，注释上面并取消下方注释
    // if (!fileId || !dimension) return;
    // setLoading(true);
    // fetchJfrFlameGraph({ fileId, dimension, include, taskSet: selectedTasks })
    //   .then(res => {
    //     const data = res.data || res.data?.data;
    //     const symbolTable = res.symbolTable || res.data?.symbolTable;
    //     const threadSplit = res.threadSplit || res.data?.threadSplit;
    //     if (data && symbolTable) {
    //       setFlameData(formatFlamegraph(data, symbolTable));
    //     } else {
    //       setFlameData(null);
    //     }
    //     if (threadSplit) {
    //       setAllTasks(Object.keys(threadSplit));
    //     }
    //     setLoading(false);
    //   })
    //   .catch(e => { setLoading(false); message.error(e.message); });
  }, [dimension, selectedTasks]);

  // 任务筛选
  const filteredTasks = allTasks.filter(t => t.toLowerCase().includes(taskSearch.toLowerCase()));

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>JFR 分析详情</Title>
      <Row gutter={24}>
        <Col span={6}>
          <Card title="分析维度" variant="borderless" style={{ marginBottom: 16 }}>
            <Select
              style={{ width: '100%' }}
              options={dimensionOptions}
              value={dimension}
              onChange={v => {
                setDimension(v);
                const found = dimensionOptions.find(d => d.value === v);
                setUnit(found?.unit || 'ns');
              }}
            />
          </Card>
          <Card title="任务筛选" variant="borderless">
            <Input.Search
              placeholder="搜索任务名"
              allowClear
              value={taskSearch}
              onChange={e => setTaskSearch(e.target.value)}
              style={{ marginBottom: 8 }}
            />
            <Checkbox
              checked={include}
              onChange={e => setInclude(e.target.checked)}
              style={{ marginBottom: 8 }}
            >
              包含（Include）
            </Checkbox>
            <Checkbox.Group
              options={filteredTasks}
              value={selectedTasks}
              onChange={setSelectedTasks}
              style={{ display: 'block', maxHeight: 200, overflow: 'auto' }}
            />
          </Card>
          <Card title="火焰图搜索" variant="borderless" style={{ marginTop: 16 }}>
            <Input.Search
              placeholder="方法/类名高亮"
              allowClear
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </Card>
        </Col>
        <Col span={18}>
          <Card 
            title={
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>火焰图</span>
                {isZoomed && (
                  <button
                    onClick={() => {
                      flameGraphRef.current?.resetZoom();
                    }}
                    style={{
                      padding: '4px 8px',
                      background: '#1890ff',
                      color: 'white',
                      border: 'none',
                      borderRadius: 4,
                      cursor: 'pointer',
                      fontSize: 12
                    }}
                  >
                    返回
                  </button>
                )}
              </div>
            } 
            variant="borderless"
          >
            <Spin spinning={loading} tip="火焰图加载中...">
              <FlameGraph 
                ref={flameGraphRef}
                data={flameData} 
                search={search} 
                onZoomChange={(zoomNode) => setIsZoomed(!!zoomNode)}
              />
            </Spin>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Analysis; 