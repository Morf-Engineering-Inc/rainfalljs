# RainfallJS

A comprehensive data integration solution for React and Next.js applications that provides automated, secure, and reliable data handling.

## Features

- 🔄 **Automated Data Flow** - Effortlessly connect components to data sources
- 🔒 **Security Built-in** - Secure data handling with authentication and validation
- 🚀 **Next.js Integration** - Special features for Next.js applications
- ⚡ **Performance Optimized** - Smart caching and minimal re-renders
- 🧩 **Component Agnostic** - Works with both functional and class components

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
import { withServerSideData } from 'react-data-provider';

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

### `NextDataProvider`

Enhanced provider for Next.js applications.

**Additional Props:**
- `routeMapping` (Object): Map of routes to data sources
- `defaultSource` (String|Function): Default data source if no route match

### `withServerSideData`

HOC for Next.js getServerSideProps.

**Parameters:**
- `getServerSideProps` (Function, optional): Original getServerSideProps
- `options` (Object): Data fetching options

### `createApiRoute`

Helper for creating secure Next.js API routes.

**Parameters:**
- `handler` (Function): API route handler function
- `options` (Object): Security and validation options

## License

MIT
