const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const targetUrl = process.argv[2] || process.env.SUPABASE_DATABASE_URL;

if (!targetUrl) {
  console.error('\x1b[31m%s\x1b[0m', 'Error: No Supabase connection string provided.');
  console.log('\nUsage:');
  console.log('  node setup-supabase.js "postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres"');
  console.log('Or set SUPABASE_DATABASE_URL in your .env file.\n');
  process.exit(1);
}

async function run() {
  console.log('\x1b[36m%s\x1b[0m', 'Connecting to Supabase PostgreSQL database...');
  const client = new Client({
    connectionString: targetUrl,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
  });

  try {
    await client.connect();
    console.log('\x1b[32m%s\x1b[0m', '✓ Connected to Supabase successfully!');

    // 1. Run Schema
    console.log('\n1. Applying database schema (schema.sql)...');
    const schemaSql = fs.readFileSync(path.join(__dirname, '../database/schema.sql'), 'utf8');
    await client.query(schemaSql);
    console.log('\x1b[32m%s\x1b[0m', '✓ Schema created (tables, types, triggers, indexes).');

    // 2. Run Migrations
    console.log('\n2. Applying migration enhancements...');
    try {
      await client.query(`ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'parent'`);
    } catch (e) { /* ignore */ }

    try {
      await client.query(`ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check`);
      await client.query(`ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'faculty', 'student', 'parent'))`);
    } catch (e) { /* ignore */ }

    await client.query(`
      CREATE TABLE IF NOT EXISTS student_parents (
        parent_id INTEGER REFERENCES users(id) ON DELETE CASCADE, 
        student_id INTEGER REFERENCES users(id) ON DELETE CASCADE, 
        relation VARCHAR(50), 
        PRIMARY KEY (parent_id, student_id)
      );
      CREATE TABLE IF NOT EXISTS attendance_disputes (
        id SERIAL PRIMARY KEY,
        record_id INTEGER NOT NULL REFERENCES attendance_records(id) ON DELETE CASCADE,
        student_id INTEGER NOT NULL REFERENCES students(user_id) ON DELETE CASCADE,
        type VARCHAR(20) NOT NULL CHECK (type IN ('justification', 'dispute')),
        reason TEXT NOT NULL,
        proof_url VARCHAR(500),
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
        faculty_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        remarks TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        resolved_at TIMESTAMP
      );
      ALTER TABLE class_subjects ADD COLUMN IF NOT EXISTS faculty_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
      CREATE INDEX IF NOT EXISTS idx_class_subjects_faculty ON class_subjects(faculty_id);
      ALTER TABLE timetables ADD COLUMN IF NOT EXISTS faculty_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
      CREATE INDEX IF NOT EXISTS idx_timetable_faculty ON timetables(faculty_id);
    `);
    console.log('\x1b[32m%s\x1b[0m', '✓ Migration patches applied.');

    // 3. Run Seed Data
    console.log('\n3. Seeding initial data (seed.sql)...');
    const seedSql = fs.readFileSync(path.join(__dirname, '../database/seed.sql'), 'utf8');
    await client.query(seedSql);
    console.log('\x1b[32m%s\x1b[0m', '✓ Seed data inserted successfully!');

    // 4. Verify counts
    console.log('\n4. Verifying Supabase database contents:');
    const uCount = await client.query('SELECT count(*) FROM users');
    const sCount = await client.query('SELECT count(*) FROM students');
    const cCount = await client.query('SELECT count(*) FROM classes');
    const subCount = await client.query('SELECT count(*) FROM subjects');
    const tCount = await client.query('SELECT count(*) FROM timetables');

    console.log(`   - Users:      ${uCount.rows[0].count}`);
    console.log(`   - Students:   ${sCount.rows[0].count}`);
    console.log(`   - Classes:    ${cCount.rows[0].count}`);
    console.log(`   - Subjects:   ${subCount.rows[0].count}`);
    console.log(`   - Timetables: ${tCount.rows[0].count}`);

    console.log('\n\x1b[32m%s\x1b[0m', '🎉 Supabase database setup is 100% complete!');
    console.log('\nTo use Supabase in your backend, update your .env:');
    console.log(`DATABASE_URL=${targetUrl}\n`);

  } catch (err) {
    console.error('\x1b[31m%s\x1b[0m', 'Error during Supabase setup:', err.message);
    if (err.position) console.error('SQL position:', err.position);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
