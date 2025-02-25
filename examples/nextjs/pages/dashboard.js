import React from 'react';
import { useData, withServerSideData } from '@morf_engineering/rainfalljs';

export default function Dashboard() {
  const { data, loading, error } = useData();
  
  if (loading) return <div>Loading dashboard data...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <div>
      <h1>Dashboard</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}

export const getServerSideProps = withServerSideData();
