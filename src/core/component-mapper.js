// src/core/component-mapper.js
import React from 'react';
import { useData } from './data-provider';

/**
 * A registry of component prop mappings
 * This allows users to define how data should map to specific component libraries
 */
const componentMappings = {};

/**
 * Register a component library for automatic data mapping
 * @param {string} libraryName - Name of the component library
 * @param {Object} mappings - Object defining how to map data to component props
 */
export const registerComponentLibrary = (libraryName, mappings) => {
  componentMappings[libraryName] = mappings;
};

/**
 * withComponentData - HOC that automatically maps data to component props based on registered mappings
 * @param {React.Component} Component - Component to wrap
 * @param {string} libraryName - Name of the component library the component belongs to
 * @param {string} componentType - Type of component within the library (e.g., 'Table', 'Form', 'Chart')
 * @param {Object} options - Additional mapping options
 */
export const withComponentData = (Component, libraryName, componentType, options = {}) => {
  return (props) => {
    const { data, loading, error } = useData();
    
    // Return early if data isn't ready
    if (loading) return options.loadingComponent || <div>Loading...</div>;
    if (error) return options.errorComponent || <div>Error: {error}</div>;
    if (!data) return options.emptyComponent || null;
    
    // Get the mapping for this library and component
    const libraryMapping = componentMappings[libraryName];
    if (!libraryMapping) {
      console.warn(`No mappings registered for component library: ${libraryName}`);
      return <Component {...props} data={data} />;
    }
    
    const componentMapping = libraryMapping[componentType];
    if (!componentMapping) {
      console.warn(`No mappings registered for component type: ${componentType} in library: ${libraryName}`);
      return <Component {...props} data={data} />;
    }
    
    // Apply the mapping function to transform data into component props
    const mappedProps = componentMapping(data, props, options);
    
    // Merge original props with mapped props, letting original props override if there's a conflict
    return <Component {...mappedProps} {...props} />;
  };
};

/**
 * useComponentData - Hook version for functional components
 * @param {string} libraryName - Name of the component library
 * @param {string} componentType - Type of component within the library
 * @param {Object} options - Additional mapping options
 */
export const useComponentData = (libraryName, componentType, options = {}) => {
  const { data, loading, error } = useData();
  
  // If we have no data yet, return the loading/error state
  if (loading || error || !data) {
    return { loading, error, mappedProps: {} };
  }
  
  // Get the mapping for this library and component
  const libraryMapping = componentMappings[libraryName];
  if (!libraryMapping) {
    console.warn(`No mappings registered for component library: ${libraryName}`);
    return { loading, error, mappedProps: { data } };
  }
  
  const componentMapping = libraryMapping[componentType];
  if (!componentMapping) {
    console.warn(`No mappings registered for component type: ${componentType} in library: ${libraryName}`);
    return { loading, error, mappedProps: { data } };
  }
  
  // Apply the mapping function
  const mappedProps = componentMapping(data, options);
  
  return { loading, error, mappedProps };
};

// Example: Register MUI component mappings
export const registerMUIComponents = () => {
  registerComponentLibrary('mui', {
    // DataGrid mapping
    DataGrid: (data, props, options) => {
      // Default column generation from data
      let columns = [];
      if (data && data.length > 0) {
        columns = Object.keys(data[0]).map(field => ({
          field,
          headerName: options.headers?.[field] || field.charAt(0).toUpperCase() + field.slice(1),
          flex: 1,
          ...options.columnOptions?.[field]
        }));
      }
      
      return {
        rows: Array.isArray(data) ? data : [],
        columns: options.columns || columns,
        loading: false,
        ...options.gridOptions
      };
    },
    
    // Select dropdown mapping
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
        options: items,
        ...options.selectOptions
      };
    },
    
    // Form mapping
    TextField: (data, props, options) => {
      const { field } = props;
      
      if (!field || !data) return {};
      
      return {
        value: data[field] || '',
        ...options.textFieldOptions
      };
    }
  });
};

// Example: Register Ant Design component mappings
export const registerAntDesignComponents = () => {
  registerComponentLibrary('antd', {
    // Table mapping
    Table: (data, props, options) => {
      // Default column generation from data
      let columns = [];
      if (data && data.length > 0) {
        columns = Object.keys(data[0]).map(field => ({
          title: options.headers?.[field] || field.charAt(0).toUpperCase() + field.slice(1),
          dataIndex: field,
          key: field,
          ...options.columnOptions?.[field]
        }));
      }
      
      return {
        dataSource: Array.isArray(data) ? data.map((item, index) => ({ key: item.id || index, ...item })) : [],
        columns: options.columns || columns,
        loading: false,
        ...options.tableOptions
      };
    },
    
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
        options: items,
        ...options.selectOptions
      };
    },
    
    // Form mapping for Input components
    Input: (data, props, options) => {
      const { field } = props;
      
      if (!field || !data) return {};
      
      return {
        value: data[field] || '',
        ...options.inputOptions
      };
    }
  });
};