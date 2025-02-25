// examples/component-mapping/radix-example.js
import React from 'react';
import { DataProvider } from '@morf_engineering/rainfalljs';
import { registerComponentLibrary, withComponentData, useComponentData } from '@morf_engineering/rainfalljs';
import * as Select from '@radix-ui/react-select';
import * as Dialog from '@radix-ui/react-dialog';
import * as Tabs from '@radix-ui/react-tabs';

// Register Radix UI component mappings
export const registerRadixComponents = () => {
  registerComponentLibrary('radix', {
    // Select mapping
    Select: (data, props, options) => {
      const { valueField = 'value', labelField = 'label' } = options;
      
      let items = [];
      if (Array.isArray(data)) {
        items = data.map(item => ({
          value: item[valueField] || item.id || item.value,
          label: item[labelField] || item.name || item.label
        }));
      }
      
      return {
        items,
        ...options.selectOptions
      };
    },
    
    // Dialog mapping
    Dialog: (data, props, options) => {
      return {
        title: data?.title || options.defaultTitle || 'Dialog',
        description: data?.description || options.defaultDescription || '',
        content: data?.content || '',
        ...options.dialogOptions
      };
    },
    
    // Tabs mapping
    Tabs: (data, props, options) => {
      let tabs = [];
      if (Array.isArray(data)) {
        tabs = data.map(item => ({
          value: item[options.valueField || 'id'],
          label: item[options.labelField || 'title'],
          content: item[options.contentField || 'content']
        }));
      }
      
      return {
        tabs,
        defaultValue: data?.[0]?.[options.valueField || 'id'] || 'tab1',
        ...options.tabsOptions
      };
    }
  });
};

// Register the components
registerRadixComponents();

// Example: Radix UI Select with automatic data mapping
const RadixSelect = () => {
  const { mappedProps, loading, error } = useComponentData('radix', 'Select', {
    valueField: 'id',
    labelField: 'name'
  });
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <Select.Root>
      <Select.Trigger>
        <Select.Value placeholder="Select a user" />
        <Select.Icon />
      </Select.Trigger>
      
      <Select.Portal>
        <Select.Content>
          <Select.Viewport>
            {mappedProps.items.map((item) => (
              <Select.Item key={item.value} value={item.value}>
                <Select.ItemText>{item.label}</Select.ItemText>
                <Select.ItemIndicator />
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
};

// Example: Radix UI Dialog with data mapping
const UserDetailsDialog = withComponentData(
  ({ title, description, content, user, ...props }) => (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button>View User Details</button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog-content">
          <Dialog.Title>{title}</Dialog.Title>
          <Dialog.Description>{description}</Dialog.Description>
          
          <div className="user-details">
            <h3>{user?.name}</h3>
            <p>Email: {user?.email}</p>
            <p>Role: {user?.role}</p>
            {content}
          </div>
          
          <Dialog.Close asChild>
            <button className="close-button">Close</button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  ),
  'radix',
  'Dialog',
  {
    defaultTitle: 'User Information',
    defaultDescription: 'Detailed information about the selected user'
  }
);

// Example: Radix UI Tabs with data mapping
const ProjectTabs = () => {
  const { mappedProps, loading, error } = useComponentData('radix', 'Tabs', {
    valueField: 'id',
    labelField: 'name',
    contentField: 'description'
  });
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <Tabs.Root defaultValue={mappedProps.defaultValue}>
      <Tabs.List className="tabs-list">
        {mappedProps.tabs.map(tab => (
          <Tabs.Trigger key={tab.value} value={tab.value} className="tab-trigger">
            {tab.label}
          </Tabs.Trigger>
        ))}
      </Tabs.List>
      
      {mappedProps.tabs.map(tab => (
        <Tabs.Content key={tab.value} value={tab.value} className="tab-content">
          {tab.content}
        </Tabs.Content>
      ))}
    </Tabs.Root>
  );
};

// Complete example with DataProvider
const UserDashboard = () => {
  const users = [
    { id: '1', name: 'John Doe', email: 'john@example.com', role: 'Admin', description: 'Project manager with 5 years of experience.' },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'Developer', description: 'Senior developer specializing in React.' },
    { id: '3', name: 'Bob Johnson', email: 'bob@example.com', role: 'Designer', description: 'UI/UX designer with expertise in Figma.' }
  ];
  
  const projects = [
    { id: 'proj1', name: 'Website Redesign', description: 'Complete overhaul of the company website with new branding.' },
    { id: 'proj2', name: 'Mobile App', description: 'New mobile application for customer engagement and loyalty.' },
    { id: 'proj3', name: 'Dashboard', description: 'Internal analytics dashboard for tracking KPIs.' }
  ];
  
  return (
    <div className="dashboard">
      <h1>User Dashboard</h1>
      
      <section>
        <h2>User Selection</h2>
        <DataProvider source={users}>
          <RadixSelect />
        </DataProvider>
      </section>
      
      <section>
        <h2>User Details</h2>
        <DataProvider source={users[0]}>
          <UserDetailsDialog user={users[0]} />
        </DataProvider>
      </section>
      
      <section>
        <h2>Projects</h2>
        <DataProvider source={projects}>
          <ProjectTabs />
        </DataProvider>
      </section>
    </div>
  );
};

export default UserDashboard;