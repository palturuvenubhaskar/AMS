require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });

module.exports = {
  secret: process.env.JWT_SECRET || 'aams-frs-jwt-secret-fallback',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'aams-frs-refresh-secret-fallback',
  expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
};
