# RainfallJS

[![Build Status](https://github.com/morf_engineering/rainfalljs/actions/workflows/publish.yml/badge.svg)](https://github.com/morf_engineering/rainfalljs/actions)
[![npm version](https://img.shields.io/npm/v/@morf_engineering/rainfalljs.svg)](https://www.npmjs.com/package/@morf_engineering/rainfalljs)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm downloads](https://img.shields.io/npm/dm/@morf_engineering/rainfalljs.svg)](https://www.npmjs.com/package/@morf_engineering/rainfalljs)

A comprehensive data integration solution for React and Next.js applications that provides automated, secure, and reliable data handling.
https://react.dev/learn/thinking-in-react
GOALS inspired by nature's beauty by rainfall - . Elon Musk idea. about applying from other fields. 
Rain Cycle -- data should flow down to grow your app components ui naturally 
Ai integration coming soon for mock data and testing. 


## Features

- 🔄 **Automated Data Flow** - Effortlessly connect components to data sources
- 🔒 **Security Built-in** - Secure data handling with authentication and validation
- 🚀 **Next.js Integration** - Special features for Next.js applications
- ⚡ **Performance Optimized** - Smart caching and minimal re-renders
- 🧩 **Component Agnostic** - Works with both functional and class components
- 🎛️ **Component Library Integration** - Automatic mapping to UI component libraries

## Installation

```bash
npm install @morf_engineering/rainfalljs

# or if you use yarn
yarn add @morf_engineering/rainfalljs
```

## Basic Usage

### Simple Data Provider

```jsx
import { DataProvider, useData } from '@morf_engineering/rainfalljs';

// Your component that needs data
const UserProfile = () => {
  const { data, loading, error } = useData();
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <div>
      <h1>{data.name}</h1>
      <p>Email: {data.email}</p>
    </div>
  );
};

// Wrap with DataProvider
const App = () => (
  <DataProvider source="/api/user">
    <UserProfile />
  </DataProvider>
);
```

### Next.js Integration

```jsx
import { NextDataProvider } from '@morf_engineering/rainfalljs';

// Your Next.js page
export default function Dashboard({ initialData }) {
  // Route-based data mapping
  const routeMapping = {
    '/dashboard': '/api/dashboard-data',
    '/dashboard/users': '/api/users',
    '/dashboard/analytics': '/api/analytics'
  };
  
  return (
    <NextDataProvider 
      routeMapping={routeMapping}
      defaultSource="/api/default"
      initialData={initialData}
    >
      <DashboardContent />
    </NextDataProvider>
  );
}

// Server-side data fetching
import { withServerSideData } from '@morf_engineering/rainfalljs';

export const getServerSideProps = withServerSideData(
  async (context) => {
    // Your existing getServerSideProps logic
    return { props: { otherProp: 'value' } };
  },
  {
    source: '/api/dashboard-data'
  }
);
```

### Creating API Routes in Next.js

```jsx
// pages/api/users.js
import { createApiRoute } from '@morf_engineering/rainfalljs';

export default createApiRoute(
  async (req, res) => {
    // Fetch users from database
    const users = await db.getUsers();
    return users;
  },
  {
    requireAuth: true,
    exposeErrors: process.env.NODE_ENV !== 'production'
  }
);
```

## Component Library Integration

RainfallJS provides automatic data mapping to UI component libraries like Material-UI and Ant Design:

```jsx
import { DataProvider, withComponentData, registerMUIComponents } from '@morf_engineering/rainfalljs';
import { DataGrid } from '@mui/x-data-grid';

// Register Material UI components (do this once in your app)
registerMUIComponents();

// Create a mapped component
const UsersGrid = withComponentData(DataGrid, 'mui', 'DataGrid');

// Use it with your data provider
function UsersList() {
  return (
    <DataProvider source="/api/users">
      <UsersGrid />
    </DataProvider>
  );
}
```

### Using Hooks Pattern

```jsx
import { useData, useComponentData } from '@morf_engineering/rainfalljs';
import { Table } from 'antd';

function UserTable() {
  // Get the component props automatically mapped from your data
  const { mappedProps } = useComponentData('antd', 'Table', {
    headers: {
      userId: 'User ID',
      fullName: 'Full Name'
    }
  });
  
  return <Table {...mappedProps} />;
}
```
Here's a snippet for your README that highlights the Radix UI integration:

```markdown

### Radix UI Integration

RainfallJS provides seamless integration with Radix UI's unstyled, accessible components:

```jsx
import { DataProvider, registerRadixComponents, useComponentData } from '@morf_engineering/rainfalljs';
import * as Select from '@radix-ui/react-select';

// Register Radix UI component mappings (do this once in your app)
registerRadixComponents();

// Example: Radix UI Select with automatic data mapping
function UserSelect() {
  const { mappedProps, loading, error } = useComponentData('radix', 'Select', {
    valueField: 'id',
    labelField: 'name'
  });
  
  if (loading) return <div>Loading...</div>;
  
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
}

// Use it with your data provider
function UserSelection() {
  return (
    <DataProvider source="/api/users">
      <UserSelect />
    </DataProvider>
  );
}
```

RainfallJS handles the complexities of Radix UI's compound component pattern, automatically mapping your data to the appropriate format for Radix components like Select, Dialog, and Tabs.


Let me create a component mapping integration for shadcn/ui, which is built on top of Radix UI but with pre-styled components and a more cohesive API:

```javascript
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
```

Here's a README snippet to document this shadcn/ui integration:

```markdown
### shadcn/ui Integration

RainfallJS provides elegant integration with shadcn/ui's beautifully designed components:

```jsx
import { DataProvider, registerShadcnComponents, useComponentData } from '@morf_engineering/rainfalljs';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";

// Register shadcn components (do this once in your app)
registerShadcnComponents();

// Create a data-aware table with automatic mapping
function UsersTable() {
  const { mappedProps, loading, error } = useComponentData('shadcn', 'Table', {
    headers: {
      id: 'ID',
      name: 'Full Name',
      email: 'Email Address'
    },
    caption: "System Users"
  });
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <Table>
      <TableCaption>{mappedProps.caption}</TableCaption>
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
}

// Use it with your data
function UsersList() {
  return (
    <DataProvider source="/api/users">
      <UsersTable />
    </DataProvider>
  );
}
```

RainfallJS supports all major shadcn/ui components including Select, Table, Card, and Tabs, automatically handling the complex component composition patterns for you.
```

This integration leverages the componentized nature of shadcn/ui while providing automatic data mapping to make it extremely simple to connect your data to the UI.


## Advanced Usage

### Custom Data Sources

```jsx
import { createDataSource, DataProvider } from '@morf_engineering/rainfalljs';

// Create a custom data source
const userDataSource = createDataSource({
  endpoint: 'https://api.example.com/users',
  method: 'GET',
  params: { limit: 10 }
});

// Use the custom data source
const App = () => (
  <DataProvider 
    source={userDataSource}
    options={{
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }}
  >
    <UserList />
  </DataProvider>
);
```

### Data Transformation

```jsx
<DataProvider
  source="/api/data"
  options={{
    transform: (data) => {
      // Transform data before it reaches components
      return data.map(item => ({
        ...item,
        fullName: `${item.firstName} ${item.lastName}`,
        createdAt: new Date(item.createdAt)
      }));
    }
  }}
>
  <MyComponent />
</DataProvider>
```

### With Class Components

```jsx
import { withData } from '@morf_engineering/rainfalljs';

class UserProfile extends React.Component {
  render() {
    const { data, loading, error } = this.props;
    
    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;
    
    return (
      <div>
        <h1>{data.name}</h1>
        <p>Email: {data.email}</p>
      </div>
    );
  }
}

// Connect the component to data
export default withData(UserProfile);
```

## API Reference

### `DataProvider`

Main provider component that fetches and provides data.

**Props:**
- `source` (String|Function|Object): Data source - can be API endpoint, function, or direct data
- `options` (Object): Configuration options for data fetching
- `secure` (Boolean): Enable security measures (default: true)
- `initialData` (Any): Initial data to use before fetching

### `useData`

React hook for accessing data in functional components.

**Returns:**
- `data` (Any): The fetched data
- `loading` (Boolean): Loading state
- `error` (String): Error message if fetch failed
- `refresh` (Function): Function to trigger data refresh

### `withData`

HOC for connecting class components to data.

**Parameters:**
- `Component` (Component): React component to enhance
- `mapDataToProps` (Function, optional): Maps data to component props

### Component Library Integration

#### `registerComponentLibrary`

Register mapping functions for a component library.

**Parameters:**
- `libraryName` (String): Name of the component library
- `mappings` (Object): Object with component mappings

#### `withComponentData`

HOC that connects a component to data with automatic prop mapping.

**Parameters:**
- `Component` (Component): React component to enhance
- `libraryName` (String): Name of the registered library
- `componentType` (String): Type of component in the library
- `options` (Object): Mapping options and overrides

#### `useComponentData`

Hook version for functional components.

**Parameters:**
- `libraryName` (String): Name of the registered library
- `componentType` (String): Type of component in the library
- `options` (Object): Mapping options and overrides

**Returns:**
- `loading` (Boolean): Loading state
- `error` (String): Error message if any
- `mappedProps` (Object): Props mapped from data

### Next.js Integration

#### `NextDataProvider`

Enhanced provider for Next.js applications.

**Additional Props:**
- `routeMapping` (Object): Map of routes to data sources
- `defaultSource` (String|Function): Default data source if no route match

#### `withServerSideData`

HOC for Next.js getServerSideProps.

**Parameters:**
- `getServerSideProps` (Function, optional): Original getServerSideProps
- `options` (Object): Data fetching options

#### `createApiRoute`

Helper for creating secure Next.js API routes.

**Parameters:**
- `handler` (Function): API route handler function
- `options` (Object): Security and validation options

# FAQ

## What is RainfallJS?

RainfallJS is a specialized data integration solution for React and Next.js applications that makes it easy to fetch, manage, and distribute data across your components with minimal boilerplate.

## Does RainfallJS use React's Context API?

Yes, RainfallJS is built on top of React's Context API. Rather than replacing Context, it enhances it with automated data fetching, transformation, validation, and error handling capabilities specifically designed for component data management.

## What problem does RainfallJS solve?

RainfallJS solves several common issues in React/Next.js applications:

1. **Repetitive data fetching logic** - No need to write the same fetch/state management code for every data source
2. **Prop drilling** - Access data anywhere in your component tree without passing props through multiple layers
3. **Loading & error states** - Unified handling of loading indicators and error messages
4. **Next.js specific challenges** - Integration with SSR and route-based data fetching
5. **Security concerns** - Built-in authentication header management and data validation

## How is this different from Redux, MobX, or React Query?

- **Redux/MobX**: RainfallJS is more lightweight and focused specifically on component data needs rather than global application state.
- **React Query**: While React Query is excellent for data fetching, RainfallJS provides a more unified context-based approach for data sharing across components and includes Next.js-specific optimizations.
- **SWR**: Similar to React Query, SWR focuses on data fetching and caching. RainfallJS provides a more complete data distribution system with both hooks and HOCs.

## Can I use RainfallJS with class components?

Yes! While many modern data libraries only work with hooks, RainfallJS supports both functional components (via the `useData` hook) and class components (via the `withData` HOC).

## Does RainfallJS work with Server-Side Rendering (SSR)?

Absolutely. RainfallJS has specific features for Next.js that support SSR through the `withServerSideData` higher-order component, ensuring your data is available during server rendering.

## Can I transform or validate data before it reaches my components?

Yes, RainfallJS allows you to provide transformation and validation functions as options:

```jsx
<DataProvider 
  source="/api/data"
  options={{
    transform: (data) => {
      // Transform data before it reaches components
      return data.map(item => ({
        ...item,
        fullName: `${item.firstName} ${item.lastName}`
      }));
    },
    validate: (data) => {
      // Validate data structure
      return Array.isArray(data) && data.length > 0;
    }
  }}
>
  <YourComponent />
</DataProvider>
```

## Is RainfallJS secure?

RainfallJS includes built-in security features, including:
- Authentication header management
- Data validation before rendering
- API route protection helpers for Next.js
- Error sanitization to prevent leaking sensitive information

## How can I contribute to RainfallJS?

Contributions are welcome! Please feel free to submit a pull request or open an issue on our [GitHub repository](https://github.com/morf_engineering/rainfalljs).

## Can I use RainfallJS in production?

Yes, RainfallJS is designed for production use in React and Next.js applications. The package is optimized for performance and has minimal dependencies.

## License

MIT
