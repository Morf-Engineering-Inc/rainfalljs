// Main exports for the package
import { DataProvider, useData, withData, createDataSource } from './core/data-provider';
import { NextDataProvider, withServerSideData, createApiRoute } from './next/next-data-provider';

// Core exports
export { 
  DataProvider, 
  useData, 
  withData, 
  createDataSource
};

// Next.js specific exports
export {
  NextDataProvider,
  withServerSideData,
  createApiRoute
};

// Default export
export default DataProvider;
