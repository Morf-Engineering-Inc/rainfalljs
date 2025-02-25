// examples/component-mapping/antd-example.js
import React from 'react';
import { DataProvider } from '@morf_engineering/rainfalljs';
import { withComponentData, useComponentData, registerAntDesignComponents } from '@morf_engineering/rainfalljs';
import { Table, Select, Input, Form } from 'antd';

// Register Ant Design component mappings
registerAntDesignComponents();

// Example with HOC pattern
const MappedTable = withComponentData(Table, 'antd', 'Table', {
  // Custom headers for auto-generated columns
  headers: {
    userId: 'User ID',
    phoneNumber: 'Phone Number',
  },
  // Table-specific options
  tableOptions: {
    bordered: true,
    size: 'middle',
    pagination: { pageSize: 10 }
  }
});

// Example with hook pattern
const UserSelect = () => {
  const { loading, error, mappedProps } = useComponentData('antd', 'Select', {
    valueField: 'id',
    labelField: 'name',
    // Additional select options
    selectOptions: {
      placeholder: 'Select a user',
      style: { width: '100%' }
    }
  });
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return <Select {...mappedProps} onChange={(value) => console.log('Selected:', value)} />;
};

// Form example with Input components
const UserForm = () => {
  const [form] = Form.useForm();
  
  return (
    <DataProvider source="/api/users/1">
      <Form form={form} layout="vertical">
        <Form.Item label="Name" name="name">
          {withComponentData(Input, 'antd', 'Input', { field: 'name' })}
        </Form.Item>
        
        <Form.Item label="Email" name="email">
          {withComponentData(Input, 'antd', 'Input', { field: 'email' })}
        </Form.Item>
        
        <Form.Item label="Phone Number" name="phoneNumber">
          {withComponentData(Input, 'antd', 'Input', { field: 'phoneNumber' })}
        </Form.Item>
      </Form>
    </DataProvider>
  );
};

// Complete example with DataProvider
const UserManagement = () => {
  return (
    <DataProvider source="/api/users">
      <div>
        <h2>User Data</h2>
        <MappedTable />
        
        <h2>User Selection</h2>
        <UserSelect />
        
        <h2>User Form</h2>
        <UserForm />
      </div>
    </DataProvider>
  );
};

export default UserManagement;