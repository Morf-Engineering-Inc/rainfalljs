// Example Next.js page using the data provider package
import { useState } from 'react';
import { useData } from '../components/data-provider';
import { NextDataProvider } from '../components/next-data-provider';

// Example data visualization component
const DataVisualization = () => {
  const { data, loading, error } = useData();
  
  if (loading) return <div>Loading data...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!data) return <div>No data available</div>;
  
  return (
    <div className="data-visualization">
      <h2>Data Visualization</h2>
      
      {/* Display data in a table */}
      <table className="data-table">
        <thead>
          <tr>
            {Object.keys(data[0] || {}).map(key => (
              <th key={key}>{key}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr key={index}>
              {Object.values(item).map((value, i) => (
                <td key={i}>{typeof value === 'object' ? JSON.stringify(value) : value}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Example form component that uses the data
const DataForm = () => {
  const { data, loading, error, refresh } = useData();
  const [formData, setFormData] = useState({});
  
  if (loading) return <div>Loading form data...</div>;
  if (error) return <div>Error loading form: {error}</div>;
  if (!data) return <div>No form configuration available</div>;
  
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/submit-form', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        throw new Error('Form submission failed');
      }
      
      // Reset form and refresh data
      setFormData({});
      refresh();
      
      alert('Form submitted successfully!');
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };
  
  return (
    <div className="data-form">
      <h2>{data.formTitle || 'Data Entry Form'}</h2>
      
      <form onSubmit={handleSubmit}>
        {data.fields.map(field => (
          <div key={field.name} className="form-field">
            <label htmlFor={field.name}>{field.label}</label>
            
            {field.type === 'select' ? (
              <select
                id={field.name}
                name={field.name}
                value={formData[field.name] || ''}
                onChange={handleChange}
                required={field.required}
              >
                <option value="">Select...</option>
                {field.options.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type={field.type || 'text'}
                id={field.name}
                name={field.name}
                value={formData[field.name] || ''}
                onChange={handleChange}
                required={field.required}
                min={field.min}
                max={field.max}
                pattern={field.pattern}
              />
            )}
          </div>
        ))}
        
        <button type="submit">Submit</button>
      </form>
    </div>
  );
};

// Example Next.js page component
export default function DashboardPage({ initialData }) {
  // Configure route-specific data sources
  const routeMapping = {
    '/dashboard': '/api/dashboard-data',
    '/dashboard/users': '/api/users-data',
    '/dashboard/analytics': '/api/analytics-data',
    '/dashboard/settings': '/api/settings'
  };
  
  return (
    <NextDataProvider 
      routeMapping={routeMapping}
      defaultSource="/api/default-data"
      initialData={initialData}
      secure={true}
      options={{
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        validate: (data) => Array.isArray(data) && data.length > 0
      }}
    >
      <div className="dashboard">
        <h1>Dashboard</h1>
        
        <div className="dashboard-grid">
          <div className="visualization-panel">
            <DataVisualization />
          </div>
          
          <div className="form-panel">
            <DataForm />
          </div>
        </div>
      </div>
    </NextDataProvider>
  );
}

// Example of server-side data fetching
export const getServerSideProps = withServerSideData(
  async (context) => {
    // Original getServerSideProps logic here
    return { props: { timestamp: new Date().toISOString() } };
  },
  {
    routeMapping: {
      '/dashboard': '/api/dashboard-data',
      '/dashboard/users': '/api/users-data'
    },
    headers: {
      'Cache-Control': 'no-cache'
    }
  }
);

// Example API route implementation
// File: /pages/api/dashboard-data.js
export default createApiRoute(
  async (req, res) => {
    // Fetch data from database or external API
    const data = [
      { id: 1, name: 'Product A', sales: 342, growth: 5.7 },
      { id: 2, name: 'Product B', sales: 276, growth: -2.3 },
      { id: 3, name: 'Product C', sales: 418, growth: 12.1 }
    ];
    
    return data;
  },
  {
    requireAuth: true,
    exposeErrors: process.env.NODE_ENV !== 'production',
    validate: (data) => Array.isArray(data) && data.length > 0
  }
);
