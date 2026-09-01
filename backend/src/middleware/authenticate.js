const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');
const db = require('../config/db');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];

    // Check if token is blacklisted
    try {
      const blacklistResult = await db.query('SELECT id FROM token_blacklist WHERE token = $1', [token]);
      if (blacklistResult && blacklistResult.rows && blacklistResult.rows.length > 0) {
        return res.status(401).json({ error: 'Token has been revoked.' });
      }
    } catch (e) {
      console.error('Error checking token blacklist:', e);
    }

    const decoded = jwt.verify(token, jwtConfig.secret);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired.', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ error: 'Invalid token.' });
  }
};

module.exports = authenticate;
