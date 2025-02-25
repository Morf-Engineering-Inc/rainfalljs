// next-data-provider.js - Next.js specific integration
import { useRouter } from 'next/router';
import { DataProvider, createDataSource } from './data-provider';

/**
 * NextDataProvider - Enhanced DataProvider for Next.js
 * Includes automatic route-based data fetching and SSR support
 */
export const NextDataProvider = ({ 
  children, 
  routeMapping = {}, 
  defaultSource = null,
  ...props 
}) => {
  const router = useRouter();
  
  // Determine data source based on current route
  const getCurrentSource = () => {
    const { pathname } = router;
    
    // Check if we have a specific source for this route
    for (const routePattern in routeMapping) {
      // Support both exact matches and patterns
      if (
        pathname === routePattern || 
        (routePattern.includes('*') && new RegExp(routePattern.replace('*', '.*')).test(pathname))
      ) {
        return routeMapping[routePattern];
      }
    }
    
    // Fall back to default source
    return defaultSource;
  };
  
  const source = getCurrentSource();
  
  // Don't render the provider if no source is available for the current route
  if (!source) {
    return children;
  }
  
  return (
    <DataProvider source={source} {...props}>
      {children}
    </DataProvider>
  );
};

/**
 * withServerSideData - HOC for getServerSideProps to prefetch data
 * @param {Function} getServerSideProps - Original getServerSideProps function
 * @param {Object} options - Data fetching options
 */
export const withServerSideData = (getServerSideProps, options = {}) => {
  return async (context) => {
    // Determine the data source
    let source = options.source;
    
    // Support dynamic source based on route
    if (options.routeMapping && context.resolvedUrl) {
      const { resolvedUrl } = context;
      
      for (const routePattern in options.routeMapping) {
        if (
          resolvedUrl === routePattern || 
          (routePattern.includes('*') && new RegExp(routePattern.replace('*', '.*')).test(resolvedUrl))
        ) {
          source = options.routeMapping[routePattern];
          break;
        }
      }
    }
    
    // If no source, just run the original getServerSideProps
    if (!source) {
      return getServerSideProps ? await getServerSideProps(context) : { props: {} };
    }
    
    try {
      // Fetch data
      let data;
      if (typeof source === 'function') {
        data = await source(options);
      } else if (typeof source === 'string') {
        const response = await fetch(source, {
          headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {})
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        data = await response.json();
      }
      
      // Get original props if available
      const originalResult = getServerSideProps ? await getServerSideProps(context) : { props: {} };
      
      // Merge data with original props
      return {
        ...originalResult,
        props: {
          ...originalResult.props,
          initialData: data
        }
      };
    } catch (error) {
      console.error('Error prefetching data:', error);
      
      // Get original props if available
      const originalResult = getServerSideProps ? await getServerSideProps(context) : { props: {} };
      
      // Add error to props
      return {
        ...originalResult,
        props: {
          ...originalResult.props,
          dataError: error.message
        }
      };
    }
  };
};

/**
 * createApiRoute - Create a Next.js API route handler that provides data
 * @param {Function} handler - Data handler function
 * @param {Object} options - Security and validation options
 */
export const createApiRoute = (handler, options = {}) => {
  return async (req, res) => {
    // Security checks
    if (options.secure !== false) {
      // Check authentication if required
      if (options.requireAuth && !req.headers.authorization) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      // Rate limiting
      if (options.rateLimit) {
        // Implementation would depend on your rate limiting strategy
        // This is a placeholder for the concept
      }
    }
    
    try {
      // Execute the handler
      const data = await handler(req, res);
      
      // If the handler has already sent a response, return early
      if (res.writableEnded) {
        return;
      }
      
      // Validate data if validator provided
      if (options.validate && typeof options.validate === 'function') {
        const isValid = options.validate(data);
        if (!isValid) {
          return res.status(400).json({ error: 'Data validation failed' });
        }
      }
      
      // Send the response
      res.status(200).json(data);
    } catch (error) {
      console.error('API route error:', error);
      
      if (!res.writableEnded) {
        res.status(500).json({ error: options.exposeErrors ? error.message : 'Internal server error' });
      }
    }
  };
};
