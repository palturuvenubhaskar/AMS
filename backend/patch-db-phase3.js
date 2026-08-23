const db = require('./src/config/db');

async function runPatch() {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    console.log('Creating attendance_disputes table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS attendance_disputes (
        id SERIAL PRIMARY KEY,
        record_id INTEGER NOT NULL REFERENCES attendance_records(id) ON DELETE CASCADE,
        student_id INTEGER NOT NULL REFERENCES students(user_id) ON DELETE CASCADE,
        type VARCHAR(20) NOT NULL CHECK (type IN ('justification', 'dispute')),
        reason TEXT NOT NULL,
        proof_url VARCHAR(500),
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
        faculty_id INTEGER REFERENCES users(id),
        remarks TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        resolved_at TIMESTAMP
      );
    `);

    // Add indexes for fast lookups
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_disputes_record ON attendance_disputes(record_id);
      CREATE INDEX IF NOT EXISTS idx_disputes_student ON attendance_disputes(student_id);
      CREATE INDEX IF NOT EXISTS idx_disputes_status ON attendance_disputes(status);
    `);

    await client.query('COMMIT');
    console.log('Phase 3 Patch applied successfully!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error applying patch:', error);
  } finally {
    client.release();
    db.pool.end();
  }
}

runPatch();
