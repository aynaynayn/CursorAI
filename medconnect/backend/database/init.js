/**
 * Database initialization script - Creates schema from schema.sql
 * Run: node database/init.js
 * Note: Drop and recreate the database if you need to re-run on existing DB
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { pool } = require('../src/config/database');

async function init() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');

  try {
    await pool.query(schema);
    console.log('Database schema created successfully.');
  } catch (error) {
    console.error('Init error:', error.message);

    // Print detailed SQL position + nearby snippet
    if (error.position) {
      const pos = Number(error.position);
      console.error('Error position:', pos);

      const start = Math.max(0, pos - 150);
      const end = Math.min(schema.length, pos + 150);

      console.error('\n--- SQL near error ---\n');
      console.error(schema.slice(start, end));
      console.error('\n----------------------\n');
    }

    if (error.code === '42P07' || error.message?.includes('already exists')) {
      console.log('Schema objects may already exist. To recreate, drop the database and run again.');
    }

    process.exit(1);
  } finally {
    await pool.end();
  }
}

init();
