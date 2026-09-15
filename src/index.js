/**
 * RainfallJS — root entry.
 *
 * Core React only. The Next.js integration is NOT re-exported here: it imports
 * `next/router`, and `next` is an optional peer dependency, so importing it from
 * the root made the whole package throw MODULE_NOT_FOUND for every consumer who
 * was not on Next. That was the 0.1.3 bug.
 *
 *   import { DataProvider } from "@morf_engineering/rainfalljs";
 *   import { NextDataProvider } from "@morf_engineering/rainfalljs/next";
 *   import { defineDataMap } from "@morf_engineering/rainfalljs/datamap";
 */
import {
  DataProvider,
  useData,
  withData,
  createDataSource
} from './core/react-data-provider';

import {
  registerComponentLibrary,
  withComponentData,
  useComponentData,
  registerMUIComponents,
  registerAntDesignComponents
} from './core/component-mapper';

export {
  DataProvider,
  useData,
  withData,
  createDataSource
};

export {
  registerComponentLibrary,
  withComponentData,
  useComponentData,
  registerMUIComponents,
  registerAntDesignComponents
};

export default DataProvider;
