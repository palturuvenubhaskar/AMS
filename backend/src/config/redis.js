const Redis = require('ioredis');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });

let redis;

try {
  redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      if (times > 3) return null;
      return Math.min(times * 200, 2000);
    },
    lazyConnect: true,
  });

  redis.on('error', (err) => {
    console.warn('Redis connection error (non-fatal, running without cache):', err.message);
  });

  redis.connect().catch(() => {
    console.warn('Redis not available. Running without cache/token blacklisting.');
  });
} catch (e) {
  console.warn('Redis not available. Running without cache.');
  // Create a mock redis for graceful degradation
  redis = {
    get: async () => null,
    set: async () => 'OK',
    setex: async () => 'OK',
    del: async () => 0,
    exists: async () => 0,
  };
}

module.exports = redis;
