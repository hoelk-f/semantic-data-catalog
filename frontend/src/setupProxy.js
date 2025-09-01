const { createProxyMiddleware } = require('http-proxy-middleware');

// Use an environment variable for the backend URL if provided, otherwise
// fall back to the Docker service name. This ensures that the proxy works
// both in local development and within the docker-compose setup.
const target = process.env.BACKEND_URL || 'http://semantic-data-catalog-backend:8000';

module.exports = function (app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target,
      changeOrigin: true,
    }),
  );
};
