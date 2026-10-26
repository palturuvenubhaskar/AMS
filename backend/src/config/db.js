const { Pool } = require('pg');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });

const isSslRequired = 
  process.env.DATABASE_URL?.includes('supabase') || 
  process.env.DATABASE_URL?.includes('sslmode=require') ||
  process.env.NODE_ENV === 'production';

let pool = null;

if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: isSslRequired ? { rejectUnauthorized: false } : false,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

  pool.on('error', (err) => {
    console.error('Unexpected error on idle client:', err.message);
  });
} else {
  console.warn('WARNING: DATABASE_URL is not set.');
}

module.exports = {
  query: (text, params) => {
    if (!pool) {
      throw new Error('DATABASE_URL is not configured in environment variables.');
    }
    return pool.query(text, params);
  },
  get pool() {
    return pool;
  },
};
