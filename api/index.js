const app = require('../backend/src/app');

module.exports = (req, res) => {
  // Normalize URL for Express routing if Vercel strips /api prefix
  if (!req.url.startsWith('/api') && !req.url.startsWith('/health')) {
    req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
  }
  return app(req, res);
};
