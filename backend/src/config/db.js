const { Pool } = require('pg');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });

let dbUrl = process.env.DATABASE_URL;

// Automatically rewrite direct Supabase host (which is IPv6-only on AWS/Vercel) to IPv4 pooler
if (dbUrl && dbUrl.includes('db.lghwqnmyyngapycnmlhj.supabase.co')) {
  dbUrl = dbUrl
    .replace('db.lghwqnmyyngapycnmlhj.supabase.co:5432', 'aws-0-ap-northeast-2.pooler.supabase.com:6543')
    .replace('db.lghwqnmyyngapycnmlhj.supabase.co', 'aws-0-ap-northeast-2.pooler.supabase.com:6543')
    .replace('//postgres:', '//postgres.lghwqnmyyngapycnmlhj:');
}

const isSslRequired = 
  dbUrl?.includes('supabase') || 
  dbUrl?.includes('sslmode=require') ||
  process.env.NODE_ENV === 'production';

let pool = null;

if (dbUrl) {
  pool = new Pool({
    connectionString: dbUrl,
    ssl: isSslRequired ? { rejectUnauthorized: false } : false,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
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
