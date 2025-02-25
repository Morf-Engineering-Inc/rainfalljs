// Main exports for the package
import { DataProvider, useData, withData, createDataSource } from './core/data-provider';
import { NextDataProvider, withServerSideData, createApiRoute } from './next/next-data-provider';

// New component mapping feature
import { 
  registerComponentLibrary,
  withComponentData,
  useComponentData,
  registerMUIComponents,
  registerAntDesignComponents,
  registerRadixComponents
} from './core/component-mapper';

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

// Component mapping exports
export {
  registerComponentLibrary,
  withComponentData,
  useComponentData,
  registerMUIComponents,
  registerAntDesignComponents,
  registerRadixComponents
};

// Default export
export default DataProvider;