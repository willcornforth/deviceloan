// Vitest setup file - runs before all tests
// Set environment variables needed for tests

// Auth0 configuration for tests
process.env.AUTH0_DOMAIN = 'test.auth0.com';
process.env.AUTH0_AUDIENCE = 'https://test-api';

// Service endpoints for tests
process.env.PRODUCTS_SERVICE_URL = 'http://localhost:7071';
process.env.LOANS_SERVICE_URL = 'http://localhost:7072';
