// examples/component-mapping/mui-example.js
import React from 'react';
import { DataProvider } from '@morf_engineering/rainfalljs';
import { withComponentData, useComponentData, registerMUIComponents } from '@morf_engineering/rainfalljs';
import { DataGrid } from '@mui/x-data-grid';
import { Select, TextField } from '@mui/material';

// Register MUI component mappings
registerMUIComponents();

// Example with HOC pattern for class components
const MappedDataGrid = withComponentData(DataGrid, 'mui', 'DataGrid', {
  // Override column definitions
  columns: [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'name', headerName: 'Name', flex: 1 },
    { field: 'email', headerName: 'Email', flex: 1 },
  ],
  // Custom headers for auto-generated columns
  headers: {
    phoneNumber: 'Phone Number',
  },
  // Column-specific options
  columnOptions: {
    email: { 
      renderCell: (params) => <a href={`mailto:${params.value}`}>{params.value}</a>
    }
  }
});

// Example with hook pattern for functional components
const UserSelect = () => {
  const { loading, error, mappedProps } = useComponentData('mui', 'Select', {
    valueField: 'id',
    labelField: 'fullName',
    // Additional select options
    selectOptions: {
      label: 'Select User',
      fullWidth: true
    }
  });
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return <Select {...mappedProps} onChange={(e) => console.log('Selected:', e.target.value)} />;
};

// Complete example with DataProvider
const UserManagement = () => {
  return (
    <DataProvider source="/api/users">
      <div style={{ height: 400, width: '100%' }}>
        <h2>User Data</h2>
        <MappedDataGrid />
        
        <h2>User Selection</h2>
        <UserSelect />
      </div>
    </DataProvider>
  );
};

export default UserManagement;