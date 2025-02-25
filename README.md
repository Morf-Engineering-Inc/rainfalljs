# RainfallJS
![Build Status](https://github.com/morf_engineering/rainfalljs/actions/workflows/publish.yml/badge.svg)
[![npm version](https://img.shields.io/npm/v/@morf_engineering/rainfalljs.svg)](https://www.npmjs.com/package/@morf_engineering/rainfalljs)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm downloads](https://img.shields.io/npm/dm/@morf_engineering/rainfalljs.svg)](https://www.npmjs.com/package/@morf_engineering/rainfalljs)
[![Coverage Status](https://coveralls.io/repos/github/morf_engineering/rainfalljs/badge.svg?branch=main)](https://coveralls.io/github/morf_engineering/rainfalljs?branch=main)

react-data-provider/
├── src/
│   ├── core/
│   ├── next/
│   └── index.js
├── dist/
├── examples/
└── package.json

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

