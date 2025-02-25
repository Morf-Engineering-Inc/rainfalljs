import React from 'react';
import { NextDataProvider } from '@morf_engineering/rainfalljs';

function MyApp({ Component, pageProps }) {
  return (
    <NextDataProvider 
      routeMapping={{
        '/': '/api/home',
        '/dashboard': '/api/dashboard'
      }}
      initialData={pageProps.initialData}
    >
      <Component {...pageProps} />
    </NextDataProvider>
  );
}

export default MyApp;
