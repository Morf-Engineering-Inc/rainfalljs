import React, { useState } from 'react';
import { DataProvider, useData, withData } from '@morf_engineering/rainfalljs';

// Simple component using the useData hook
const UserProfile = () => {
  const { data, loading, error, refresh } = useData();
  
  if (loading) return <div>Loading user data...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!data) return <div>No user data available</div>;
  
  return (
    <div className="user-profile">
      <h2>{data.name}</h2>
      <p>Email: {data.email}</p>
      <p>Role: {data.role}</p>
      <button onClick={refresh}>Refresh Data</button>
    </div>
  );
};

// Example of a class component using the withData HOC
class ProductList extends React.Component {
  render() {
    const { data, loading, error } = this.props;
    
    if (loading) return <div>Loading products...</div>;
    if (error) return <div>Error loading products: {error}</div>;
    if (!data || !data.products) return <div>No products available</div>;
    
    return (
      <div className="product-list">
        <h2>Products</h2>
        <ul>
          {data.products.map(product => (
            <li key={product.id}>
              {product.name} - ${product.price}
            </li>
          ))}
        </ul>
      </div>
    );
  }
}

// Connect the class component to data
const ConnectedProductList = withData(ProductList);

// Example of data transform and validation
const transformAndValidateOptions = {
  transform: (rawData) => {
    // Transform the data before it reaches components
    return {
      ...rawData,
      name: rawData.name.toUpperCase(),
      // Add computed properties
      isAdmin: rawData.role === 'admin'
    };
  },
  validate: (data) => {
    // Validate data structure
    return data && data.email && data.role;
  }
};

// Demo App showing different ways to use RainfallJS
export default function BasicDemo() {
  const [dataSource, setDataSource] = useState('user');
  
  // Mock data sources (in a real app, these would be API endpoints)
  const dataSources = {
    user: {
      name: 'John Doe',
      email: 'john@example.com',
      role: 'admin'
    },
    products: {
      products: [
        { id: 1, name: 'Product A', price: 29.99 },
        { id: 2, name: 'Product B', price: 49.99 },
        { id: 3, name: 'Product C', price: 19.99 }
      ]
    }
  };
  
  const handleSourceChange = (e) => {
    setDataSource(e.target.value);
  };
  
  return (
    <div className="basic-demo">
      <h1>RainfallJS Basic Demo</h1>
      
      <div className="source-selector">
        <p>Select data source:</p>
        <select value={dataSource} onChange={handleSourceChange}>
          <option value="user">User Profile</option>
          <option value="products">Product List</option>
        </select>
      </div>
      
      <div className="demo-section">
        <h2>Functional Component with useData hook</h2>
        <DataProvider 
          source={dataSources[dataSource]} 
          options={transformAndValidateOptions}
        >
          <UserProfile />
        </DataProvider>
      </div>
      
      <div className="demo-section">
        <h2>Class Component with withData HOC</h2>
        <DataProvider source={dataSources.products}>
          <ConnectedProductList />
        </DataProvider>
      </div>
      
      <div className="explanation">
        <h3>How This Demo Works:</h3>
        <p>
          This example demonstrates several key features of RainfallJS:
        </p>
        <ul>
          <li>Using the DataProvider to provide data to components</li>
          <li>Accessing data with the useData hook in functional components</li>
          <li>Using the withData HOC for class components</li>
          <li>Data transformation and validation</li>
          <li>Refreshing data on demand</li>
        </ul>
        <p>
          In a real application, the data source would typically be an API endpoint 
          or a function that fetches data from an API.
        </p>
      </div>
    </div>
  );
}

// If you want to run this as a standalone app:
// 
// import { createRoot } from 'react-dom/client';
// const root = createRoot(document.getElementById('root'));
// root.render(<BasicDemo />);