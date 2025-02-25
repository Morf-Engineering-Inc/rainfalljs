// examples/component-mapping/shadcn-example.js
import React from 'react';
import { DataProvider } from '@morf_engineering/rainfalljs';
import { registerComponentLibrary, withComponentData, useComponentData } from '@morf_engineering/rainfalljs';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Register shadcn/ui component mappings
export const registerShadcnComponents = () => {
  registerComponentLibrary('shadcn', {
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
        placeholder: options.placeholder || "Select an option",
        defaultValue: options.defaultValue || items[0]?.value,
        ...options.selectOptions
      };
    },
    
    // Table mapping
    Table: (data, props, options) => {
      // Extract column definitions
      let columns = [];
      if (data && data.length > 0) {
        columns = Object.keys(data[0]).map(key => ({
          id: key,
          header: options.headers?.[key] || key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
          accessorKey: key,
          ...options.columnOptions?.[key]
        }));
      }
      
      return {
        data: Array.isArray(data) ? data : [],
        columns: options.columns || columns,
        caption: options.caption || "",
        ...options.tableOptions
      };
    },
    
    // Card mapping
    Card: (data, props, options) => {
      return {
        title: data?.title || options.defaultTitle || 'Card Title',
        description: data?.description || options.defaultDescription || '',
        content: data?.content || data,
        footer: data?.footer || options.footer || null,
        ...options.cardOptions
      };
    },
    
    // Tabs mapping
    Tabs: (data, props, options) => {
      let tabs = [];
      if (Array.isArray(data)) {
        tabs = data.map(item => ({
          value: item[options.valueField || 'id'] || item.id || item.value,
          label: item[options.labelField || 'title'] || item.title || item.label,
          content: item[options.contentField || 'content'] || item.content || item.description
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
registerShadcnComponents();

// Example: shadcn/ui Select with automatic data mapping
const UserSelect = () => {
  const { mappedProps, loading, error } = useComponentData('shadcn', 'Select', {
    valueField: 'id',
    labelField: 'name',
    placeholder: "Select a user"
  });
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <Select defaultValue={mappedProps.defaultValue} {...mappedProps.selectOptions}>
      <SelectTrigger>
        <SelectValue placeholder={mappedProps.placeholder} />
      </SelectTrigger>
      <SelectContent>
        {mappedProps.items.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

// Example: shadcn/ui Table with data mapping
const UsersTable = () => {
  const { mappedProps, loading, error } = useComponentData('shadcn', 'Table', {
    headers: {
      id: 'ID',
      name: 'Full Name',
      email: 'Email Address',
      role: 'User Role'
    },
    caption: "List of system users"
  });
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <Table>
      {mappedProps.caption && <TableCaption>{mappedProps.caption}</TableCaption>}
      <TableHeader>
        <TableRow>
          {mappedProps.columns.map((column) => (
            <TableHead key={column.id}>{column.header}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {mappedProps.data.map((row) => (
          <TableRow key={row.id}>
            {mappedProps.columns.map((column) => (
              <TableCell key={`${row.id}-${column.id}`}>
                {row[column.accessorKey]}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

// Example: shadcn/ui Card with data mapping
const UserCard = withComponentData(
  ({ title, description, content, footer }) => (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {typeof content === 'object' ? (
          <div>
            <p><strong>Name:</strong> {content.name}</p>
            <p><strong>Email:</strong> {content.email}</p>
            <p><strong>Role:</strong> {content.role}</p>
          </div>
        ) : (
          <p>{content}</p>
        )}
      </CardContent>
      {footer && (
        <CardFooter>
          {footer}
        </CardFooter>
      )}
    </Card>
  ),
  'shadcn',
  'Card',
  {
    defaultTitle: 'User Profile',
    defaultDescription: 'User details and information',
    footer: <button className="btn btn-primary">Edit Profile</button>
  }
);

// Example: shadcn/ui Tabs with data mapping
const ProjectTabs = () => {
  const { mappedProps, loading, error } = useComponentData('shadcn', 'Tabs', {
    valueField: 'id',
    labelField: 'name',
    contentField: 'description'
  });
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <Tabs defaultValue={mappedProps.defaultValue}>
      <TabsList>
        {mappedProps.tabs.map(tab => (
          <TabsTrigger key={tab.value} value={tab.value}>
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {mappedProps.tabs.map(tab => (
        <TabsContent key={tab.value} value={tab.value}>
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  );
};

// Complete example with DataProvider
const Dashboard = () => {
  const users = [
    { id: '1', name: 'John Doe', email: 'john@example.com', role: 'Admin' },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'Developer' },
    { id: '3', name: 'Bob Johnson', email: 'bob@example.com', role: 'Designer' }
  ];
  
  const projects = [
    { id: 'proj1', name: 'Website Redesign', description: 'Complete overhaul of the company website with new branding.' },
    { id: 'proj2', name: 'Mobile App', description: 'New mobile application for customer engagement and loyalty.' },
    { id: 'proj3', name: 'Dashboard', description: 'Internal analytics dashboard for tracking KPIs.' }
  ];
  
  return (
    <div className="dashboard">
      <h1>Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-xl font-semibold mb-4">User Selection</h2>
          <DataProvider source={users}>
            <UserSelect />
          </DataProvider>
        </div>
        
        <div>
          <h2 className="text-xl font-semibold mb-4">User Profile</h2>
          <DataProvider source={users[0]}>
            <UserCard />
          </DataProvider>
        </div>
      </div>
      
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">All Users</h2>
        <DataProvider source={users}>
          <UsersTable />
        </DataProvider>
      </div>
      
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Projects</h2>
        <DataProvider source={projects}>
          <ProjectTabs />
        </DataProvider>
      </div>
    </div>
  );
};

export default Dashboard;