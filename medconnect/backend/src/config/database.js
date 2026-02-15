/**
 * PostgreSQL database connection configuration
 * Uses connection pooling for production efficiency
 */
require('dotenv').config();

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false } // Required for Supabase
      : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test connection on startup
pool.on('connect', () => {
  if (process.env.NODE_ENV !== 'test') {
    console.log('Database connected successfully');
  }
});

pool.on('error', (err) => {
  console.error('Unexpected database error:', err);
});

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params),
};
