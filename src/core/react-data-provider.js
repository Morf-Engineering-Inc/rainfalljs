// data-provider.js - Core of the package
import React, { createContext, useContext, useState, useEffect } from 'react';

// Create a context for data sharing across components
const DataContext = createContext(null);

/**
 * DataProvider - Main wrapper component that handles data fetching and distribution
 * @param {Object} props
 * @param {Function|String} props.source - Data source function or API endpoint
 * @param {Object} props.options - Configuration options (authentication, caching, etc.)
 * @param {Boolean} props.secure - Enable additional security measures
 * @param {React.ReactNode} props.children - Child components
 */
export const DataProvider = ({ 
  source, 
  options = {}, 
  secure = true, 
  children 
}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Handle different source types
        let result;
        if (typeof source === 'function') {
          // Source is a function that returns data
          result = await source(options);
        } else if (typeof source === 'string') {
          // Source is an API endpoint
          const headers = secure ? {
            'Content-Type': 'application/json',
            ...(options.headers || {}),
          } : options.headers;
          
          const response = await fetch(source, {
            ...options,
            headers,
          });
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          result = await response.json();
        } else {
          // Direct data object
          result = source;
        }

        // Apply data transformation if provided
        if (options.transform && typeof options.transform === 'function') {
          result = options.transform(result);
        }
        
        // Apply data validation if provided
        if (options.validate && typeof options.validate === 'function') {
          const isValid = options.validate(result);
          if (!isValid) {
            throw new Error('Data validation failed');
          }
        }
        
        setData(result);
        setError(null);
      } catch (err) {
        setError(err.message || 'An error occurred while fetching data');
        console.error('DataProvider error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [source, JSON.stringify(options)]);

  // Context value with data state and utilities
  const value = {
    data,
    loading,
    error,
    refresh: () => {
      setLoading(true);
      // Force re-fetch by changing the effect dependency
      options.timestamp = Date.now();
    },
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};

/**
 * useData - Hook to access the data within any component
 */
export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

/**
 * withData - HOC to inject data into any component
 * @param {React.Component} Component - Component to enhance with data
 * @param {Function} mapDataToProps - Optional function to map data to props
 */
export const withData = (Component, mapDataToProps) => {
  return (props) => {
    const { data, loading, error } = useData();
    
    const mappedData = mapDataToProps 
      ? mapDataToProps(data, props) 
      : { data, loading, error };
    
    return <Component {...props} {...mappedData} />;
  };
};

// Utility functions
export const createDataSource = (config) => {
  return async (options) => {
    // Implement custom data source logic
    // This could connect to APIs, databases, etc.
    
    // Example implementation for API endpoints
    const { endpoint, method = 'GET', params = {} } = config;
    
    const url = new URL(endpoint);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
    
    const response = await fetch(url, {
      method,
      ...options,
    });
    
    return response.json();
  };
};
