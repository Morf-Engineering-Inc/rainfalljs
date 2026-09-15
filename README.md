# RainfallJS

[![Build Status](https://github.com/Morf-Engineering-Inc/rainfalljs/actions/workflows/publish.yml/badge.svg)](https://github.com/morf_engineering/rainfalljs/actions)
[![Tests](https://github.com/Morf-Engineering-Inc/rainfalljs/actions/workflows/test.yml/badge.svg)](https://github.com/Morf-Engineering-Inc/rainfalljs/actions/workflows/test.yml)
[![npm version](https://img.shields.io/npm/v/@morf_engineering/rainfalljs.svg)](https://www.npmjs.com/package/@morf_engineering/rainfalljs)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm downloads](https://img.shields.io/npm/dm/@morf_engineering/rainfalljs.svg)](https://www.npmjs.com/package/@morf_engineering/rainfalljs)

A comprehensive data integration solution for React and Next.js applications that provides automated, secure, and reliable data handling. 

## About the Name
**RainfallJS**: Just as rain naturally flows from clouds down to nourish plants below, data "rains" down from your data sources to feed your React components. The name reflects our philosophy that data flow should be as natural, reliable, and effortless as rainfall - distributed exactly where it's needed without manual intervention. This project aims to be guided by principles that guide engineering like shown [here](https://react.dev/learn/thinking-in-react).

## Two halves, used separately

**The Data Map** (`@morf_engineering/rainfalljs/datamap`) — one declaration of how data
flows from a business requirement, through the endpoint and the key expression that
serves it, to the screen a person uses. Plain data: no server, no build, no React. It
validates in CI and prints itself small enough to paste into a prompt.
**→ [docs/DATA-MAP.md](docs/DATA-MAP.md)**

**The runtime** (`@morf_engineering/rainfalljs`) — `DataProvider`, `useData`,
`withData`, and the component-library mapper. A Context-based provider for apps that
do not already have a data layer.

They do not depend on each other. Most teams want the first one.
## 🌧️ New Direction: Rainfall for AI — Token-Optimized Data Context

Rainfall is evolving into a tool that helps **AI coding agents build web apps with far fewer tokens**. The water cycle now describes the AI knowledge loop:

- **Ocean** → your codebase and database (source of truth)
- **Evaporation** → `rainfall scan` lifts structure out of the code
- **Cloud** → `rainfall.json`, a compact manifest of entities → APIs → components
- **Rainfall** → `rainfall condense` rains precise, few-hundred-token context onto each AI session
- **The cycle** → agents update the manifest as they change code, so knowledge never evaporates

Instead of an AI re-reading dozens of files every session to rediscover which component calls which API (tens of thousands of tokens), it reads one condensed digest and refers to everything by stable IDs like `C001`, `API-002`, and `card.home.score`.

```bash
# One-off, no install needed:
npx @morf_engineering/rainfalljs init       # create a starter rainfall.json
npx @morf_engineering/rainfalljs scan       # seed it from your React/Next.js code

# Or install it, then use the short command:
npm install -D @morf_engineering/rainfalljs
npx rainfall validate      # check structure + referential integrity
npx rainfall condense      # print the compact AI context digest + token estimate
npx rainfall condense --focus card.home.score   # just one item's subgraph (for large apps)
npx rainfall report        # tokens-saved report: digest vs reading the source
```

**The AI skill:** drop [`skills/rainfall-manifest/SKILL.md`](skills/rainfall-manifest/SKILL.md) into your project's `.claude/skills/rainfall-manifest/` (or hand it to any agent) and the AI will read, use, and maintain the manifest automatically.

**Let your AI build the manifest for you:** the scan only finds the skeleton — entities, read/write mappings, response shapes, and flows need code understanding, which is an AI's job. If your agent has the skill installed, just ask it to "bootstrap a rainfall manifest". Otherwise run:

```bash
npx @morf_engineering/rainfalljs prompt
```

and paste the printed instructions into Claude, Cursor, or any coding assistant. The AI will seed the manifest with `scan`, enrich it by reading your models and handlers, verify it with `validate`, and finish by showing you your own `report` numbers — plus a standing instruction to keep the manifest updated from then on.

See [`RECOMMENDATION.md`](RECOMMENDATION.md) for the full rationale, [`schema/rainfall.schema.json`](schema/rainfall.schema.json) for the manifest format, and [`examples/manifest/rainfall.json`](examples/manifest/rainfall.json) for a worked example.

---

The original React data-provider library below still works and is unchanged.

## Features

- 🗺️ **Data Map** - requirement → endpoint → component → screen, validated in CI
- 🤖 **Built for agents** - the whole data flow as a compact brief, kept true by the build
- 🔎 **Traceability** - `consumersOf(endpoint)` answers "what breaks if I change this"
- 🔄 **Automated Data Flow** - connect components to data sources with one provider
- 🚀 **Next.js Integration** - available from the `/next` subpath
- 🧩 **Component Agnostic** - works with both functional and class components
- 🎛️ **Component Library Integration** - map data onto a UI library's props

## Installation

```bash
npm install @morf_engineering/rainfalljs

# or if you use yarn
yarn add @morf_engineering/rainfalljs
```

Three entry points:

```js
import { defineDataMap, validate, brief } from '@morf_engineering/rainfalljs/datamap';
import { DataProvider, useData } from '@morf_engineering/rainfalljs';
import { NextDataProvider } from '@morf_engineering/rainfalljs/next';
```

> **Changed in 0.2.0.** The Next.js exports moved from the root to
> `@morf_engineering/rainfalljs/next`. The root entry imported `next/router`, and
> `next` is an *optional* peer dependency — so on 0.1.x the package threw
> `MODULE_NOT_FOUND` for every consumer who was not on Next. 0.1.x additionally
> shipped a root entry that required a file the build never emitted, so it could not
> be imported at all. Both are fixed, and `__tests__/structure.test.js` now
> `require()`s every entry point rather than grepping the bundle for identifiers,
> which is why three published versions were green and broken.

## The Data Map in thirty seconds

```js
import { defineDataMap, validate, brief } from '@morf_engineering/rainfalljs/datamap';

const map = defineDataMap({
  name: 'Acme',
  requirements: [{ id: 'BR-1', statement: 'A customer sees their invoices.',
                   endpoints: ['INV'], screens: ['billing'], state: 'built' }],
  endpoints:    [{ id: 'INV', path: '/invoices', method: 'GET', state: 'built',
                   access: { mode: 'read', key: 'Query PK = TENANT#<tid>' } }],
  components:   [{ id: 'Table', name: 'Invoice table', state: 'built',
                   needs: [{ endpoint: 'INV', flow: 'FETCH' }] }],
  screens:      [{ id: 'billing', name: 'Billing', route: '/billing',
                   components: ['Table'], state: 'built' }],
});

map.consumersOf('INV');   // what breaks if I change this endpoint
map.trace('BR-1');        // the whole chain under one requirement
validate(map);            // run in CI: dangling refs and state conflicts are errors
console.log(brief(map));  // the whole data flow, sized for a context window
```

Full guide: **[docs/DATA-MAP.md](docs/DATA-MAP.md)**.

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
import { NextDataProvider } from '@morf_engineering/rainfalljs/next';

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
import { withServerSideData } from '@morf_engineering/rainfalljs/next';

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
import { createApiRoute } from '@morf_engineering/rainfalljs/next';

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

```markdown

### Writing your own mapping

`registerMUIComponents()` and `registerAntDesignComponents()` ship with the package.
Anything else — Radix, shadcn/ui, your own design system — is a mapping function you
register once:

```jsx
import {
  registerComponentLibrary,
  useComponentData,
  DataProvider,
} from '@morf_engineering/rainfalljs';

// A mapping is (data, props, options) => props-for-that-component.
registerComponentLibrary('shadcn', {
  Select: (data, props, { valueField = 'id', labelField = 'name', placeholder }) => ({
    items: (Array.isArray(data) ? data : []).map((item) => ({
      value: item[valueField],
      label: item[labelField],
    })),
    placeholder: placeholder ?? 'Select an option',
  }),

  Table: (data, props, { headers = {}, caption = '' }) => {
    const rows = Array.isArray(data) ? data : [];
    return {
      data: rows,
      caption,
      columns: rows.length
        ? Object.keys(rows[0]).map((key) => ({
            id: key,
            accessorKey: key,
            header: headers[key] ?? key,
          }))
        : [],
    };
  },
});

function UserSelect() {
  const { mappedProps, loading } = useComponentData('shadcn', 'Select', {
    valueField: 'id',
    labelField: 'name',
  });
  if (loading) return <div>Loading…</div>;
  return (
    <Select>
      <SelectTrigger><SelectValue placeholder={mappedProps.placeholder} /></SelectTrigger>
      <SelectContent>
        {mappedProps.items.map((item) => (
          <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

const App = () => (
  <DataProvider source="/api/users">
    <UserSelect />
  </DataProvider>
);
```

> **Changed in 0.2.0.** Earlier versions of this README documented
> `registerRadixComponents` and `registerShadcnComponents` as package exports. Neither
> was ever implemented — `registerRadixComponents` was re-exported without a
> definition, and `registerShadcnComponents` existed only in this file. Both are gone.
> Register the mapping yourself, as above; it is the same amount of code the README
> was asking you to copy anyway.

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


# The Value of RainfallJS vs. Vanilla Context API

When developers evaluate a new package, they often ask: "Why should I use this instead of what I already know?" Let's compare using RainfallJS to implementing data management with vanilla React Context API:

## Using Vanilla React Context API

```jsx
// 1. Create a context
const UserContext = React.createContext(null);

// 2. Create a provider component with data fetching logic
function UserProvider({ children }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const response = await fetch('/api/users');
        if (!response.ok) throw new Error('Failed to fetch');
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, []);
  
  return (
    <UserContext.Provider value={{ data, loading, error }}>
      {children}
    </UserContext.Provider>
  );
}

// 3. Create a custom hook
function useUserData() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUserData must be used within a UserProvider');
  }
  return context;
}

// 4. Implement in components
function UserProfile() {
  const { data, loading, error } = useUserData();
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return <div>{data.name}</div>;
}

// 5. Usage
function App() {
  return (
    <UserProvider>
      <UserProfile />
    </UserProvider>
  );
}
```

## Using RainfallJS

```jsx
import { DataProvider, useData } from '@morf_engineering/rainfalljs';

// 1. Component implementation
function UserProfile() {
  const { data, loading, error } = useData();
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return <div>{data.name}</div>;
}

// 2. Usage
function App() {
  return (
    <DataProvider source="/api/users">
      <UserProfile />
    </DataProvider>
  );
}
```

## The Value RainfallJS Adds

1. **Eliminates Boilerplate**: With vanilla Context, you need to create a context, provider, fetch logic, state management, and custom hooks for *each data source* in your application. RainfallJS handles all this with a single reusable component.

2. **Standardized Error Handling**: Consistent error management across all data sources without duplicating try/catch logic.

3. **Flexible Data Sources**: RainfallJS accepts API endpoints, functions, or static data, with the same consistent interface.

4. **Route-Based Data in Next.js**: Automatic data fetching based on current route, saving dozens of lines of code per page.

5. **Component Library Integration**: Automatic mapping of data to UI component props, eliminating tedious data transformation code.

6. **Security Built-In**: Authentication headers, data validation, and other security features that you'd need to implement manually with Context.

7. **Production-Ready**: Implements best practices for performance, caching, and server-side rendering that would take significant effort to build correctly with Context API.

8. **Consistent API**: No need to create and remember different context hook names for different data types.

For a real-world application with 10+ data sources and 20+ components, RainfallJS can eliminate hundreds of lines of repetitive context creation and data fetching code while providing more features and better reliability.


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

## Can I develop complex apps with RainfallJS?

RainfallJS could certainly be used to build complex applications, but with a different architectural approach than Redux for example.
Here's how you could build complex apps with RainfallJS:

Composable Data Providers: Users can nest multiple DataProviders for different sections of the application, creating a hierarchy of data sources that maps to the component structure.
Domain-Specific Providers: Each feature area could have its own DataProvider with specific transformations and validations, allowing separation of concerns.
Hybrid Approach: RainfallJS could handle all the data fetching and distribution needs, while using simpler state management (like useReducer) for UI state and interactions.
Cross-Provider Communication: For interactions between data domains, users could implement custom data sources that access and combine data from multiple endpoints.

The key difference is philosophical:

Redux centralizes all state in a single store with explicit actions
RainfallJS distributes data management closer to where it's used, following React's component model

For many complex applications, RainfallJS's approach may actually be more maintainable because it:

Keeps data concerns closer to the components that need them
Results in more modular, decoupled code
Aligns better with React's component-based architecture

The trade-off is that RainfallJS doesn't offer some of Redux's specialized tools like time-travel debugging or the Redux DevTools. However, for most applications focused on data fetching and component integration, these tools aren't essential, and the simplicity benefits outweigh this loss.

## License

MIT
