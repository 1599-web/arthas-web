// @ts-nocheck
// eslint-disable-next-line
// 由于项目初始化阶段，暂时关闭类型检查和eslint报错，后续完善依赖后移除。
import React, { useState } from 'react';
import { Card, Row, Col, Typography, Modal, Tooltip } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import FileUpload from '../../components/FileUpload';
import FileTable from '../../components/FileTable';

const { Title } = Typography;

const Home: React.FC = () => {
  const [refreshFlag, setRefreshFlag] = useState(0);
  const [uploadVisible, setUploadVisible] = useState(false);
  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>JFR 文件管理</Title>
      <Row gutter={24}>
        <Col span={24}>
          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>文件列表</span>
                <Tooltip title="上传文件">
                  <UploadOutlined style={{ fontSize: 20, cursor: 'pointer' }} onClick={() => setUploadVisible(true)} />
                </Tooltip>
              </div>
            }
            bordered={false}
          >
            <FileTable refreshFlag={refreshFlag} />
          </Card>
          <Modal
            open={uploadVisible}
            title="上传 .jfr 文件"
            footer={null}
            onCancel={() => setUploadVisible(false)}
            destroyOnClose
          >
            <FileUpload onUploadSuccess={() => { setRefreshFlag(f => f + 1); setUploadVisible(false); }} />
          </Modal>
        </Col>
      </Row>
    </div>
  );
};

export default Home; 