// @ts-nocheck
// eslint-disable-next-line
import React, { useEffect, useState } from 'react';
import { Table, Input, Tag, Button, Popconfirm, message } from 'antd';
import { getFiles, deleteFile } from '../../services/mock';

const statusColor = {
  '处理中': 'processing',
  '分析完成': 'success',
  '失败': 'error',
};

const FileTable: React.FC<{ refreshFlag?: number }> = ({ refreshFlag }) => {
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [sorter, setSorter] = useState({});
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);

  const fetchData = async () => {
    setLoading(true);
    const res = await getFiles({
      page: pagination.current,
      pageSize: pagination.pageSize,
      search,
      sorter,
    });
    if (res.code === 1 && res.data) {
      setData(res.data.items || []);
      setTotal(res.data.total || 0);
    } else {
      setData([]);
      setTotal(0);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, [pagination.current, pagination.pageSize, search, sorter, refreshFlag]);

  const handleDelete = async (id: string) => {
    try {
      const res = await deleteFile(id);
      if (res.code === 1) {
        message.success('删除成功');
        fetchData();
      } else {
        message.error(res.msg || '删除失败');
      }
    } catch (e) {
      message.error('删除失败');
    }
  };

  const columns = [
    {
      title: '文件名',
      dataIndex: 'name',
      sorter: true,
      ellipsis: true,
    },
    {
      title: '类型',
      dataIndex: 'type',
      width: 80,
    },
    {
      title: '大小 (MB)',
      dataIndex: 'size',
      sorter: true,
      render: (v) => v.toFixed(2),
      width: 120,
    },
    {
      title: '上传时间',
      dataIndex: 'createTime',
      sorter: true,
      width: 180,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 120,
      render: (status) => <Tag color={statusColor[status]}>{status}</Tag>,
    },
    {
      title: '操作',
      dataIndex: 'action',
      width: 120,
      render: (_, record) => (
        <>
          <Popconfirm title="确认删除该文件？" onConfirm={() => handleDelete(record.id)} okText="删除" cancelText="取消">
            <Button type="link" size="small" danger>删除</Button>
          </Popconfirm>
          <Button type="link" size="small" disabled onClick={() => message.info('功能待开发')}>详情</Button>
        </>
      ),
    },
  ];

  return (
    <div>
      <Input.Search
        placeholder="搜索文件名"
        allowClear
        style={{ width: 240, marginBottom: 16 }}
        onSearch={setSearch}
      />
      <Table
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50'],
          onChange: (page, pageSize) => setPagination({ current: page, pageSize }),
        }}
        onChange={(_, __, sorterObj) => setSorter(sorterObj)}
        rowKey="id"
        size="middle"
      />
    </div>
  );
};

export default FileTable; 