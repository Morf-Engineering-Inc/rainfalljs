import React from 'react';
import { NextDataProvider, useData, withServerSideData } from '@morf_engineering/rainfalljs';

// Simple component that displays the data
const DataDisplay = () => {
  const { data, loading, error } = useData();
  
  if (loading) return <div>Loading data...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!data) return <div>No data available</div>;
  
  return (
    <div>
      <h2>Data Display</h2>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
};

// Main page component
export default function HomePage({ initialData }) {
  // Route mapping configuration
  const routeMapping = {
    '/': '/api/home-data',
    '/dashboard': '/api/dashboard-data',
    '/users': '/api/users-data'
  };
  
  return (
    <div className="container">
      <h1>React Data Provider Example</h1>
      
      <NextDataProvider 
        routeMapping={routeMapping}
        defaultSource="/api/default-data"
        initialData={initialData}
        options={{
          headers: {
            'Content-Type': 'application/json',
          }
        }}
      >
        <DataDisplay />
      </NextDataProvider>
    </div>
  );
}

// Server-side data fetching
export const getServerSideProps = withServerSideData(
  async () => {
    // Original getServerSideProps logic
    return { 
      props: { 
        timestamp: new Date().toISOString() 
      } 
    };
  },
  {
    source: 'https://jsonplaceholder.typicode.com/users'
  }
);
