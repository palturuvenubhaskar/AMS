const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');
const redis = require('../config/redis');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];

    // Check if token is blacklisted
    try {
      const isBlacklisted = await redis.get(`bl_${token}`);
      if (isBlacklisted) {
        return res.status(401).json({ error: 'Token has been revoked.' });
      }
    } catch (e) {
      // Redis unavailable, skip blacklist check
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
