let app;
let initError = null;

try {
  app = require('../backend/src/app');
} catch (err) {
  initError = err;
  console.error('Failed to load backend app in serverless function:', err);
}

module.exports = (req, res) => {
  if (initError) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({
      error: 'Backend initialization failed',
      message: initError.message,
      stack: initError.stack
    }, null, 2));
  }

  // Normalize URL for Express routing if Vercel strips /api prefix
  if (!req.url.startsWith('/api') && !req.url.startsWith('/health') && !req.url.startsWith('/ping')) {
    req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
  }
  return app(req, res);
};
