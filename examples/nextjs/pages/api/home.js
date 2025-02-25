import { createApiRoute } from '@morf_engineering/rainfalljs';

export default createApiRoute(
  async (req, res) => {
    // Example data
    return {
      title: 'Welcome to RainfallJS',
      description: 'A powerful data provider for React and Next.js',
      features: [
        'Automated data fetching',
        'Route-based data mapping',
        'Secure API integration'
      ]
    };
  }
);
