const db = require('./src/config/db');

(async () => {
  try {
    await db.query(`ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'parent'`);
  } catch (e) { /* ignore if user_role enum doesn't exist */ }

  try {
    // If role is a VARCHAR CHECK constraint, update it
    await db.query(`ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check`);
    await db.query(`ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'faculty', 'student', 'parent'))`);
  } catch (e) { console.log('users_role_check:', e.message); }
  
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS student_parents (
        parent_id INTEGER REFERENCES users(id) ON DELETE CASCADE, 
        student_id INTEGER REFERENCES users(id) ON DELETE CASCADE, 
        relation VARCHAR(50), 
        PRIMARY KEY (parent_id, student_id)
      )
    `);
  } catch (e) { console.log('student_parents:', e.message); }

  try {
    await db.query(`
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
      )
    `);
  } catch (e) { console.log('attendance_disputes:', e.message); }

  try {
    await db.query(`ALTER TABLE class_subjects ADD COLUMN IF NOT EXISTS faculty_id INTEGER REFERENCES users(id) ON DELETE SET NULL`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_class_subjects_faculty ON class_subjects(faculty_id)`);
  } catch (e) { console.log('class_subjects faculty_id:', e.message); }

  try {
    await db.query(`ALTER TABLE timetables ADD COLUMN IF NOT EXISTS faculty_id INTEGER REFERENCES users(id) ON DELETE SET NULL`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_timetable_faculty ON timetables(faculty_id)`);
  } catch (e) { console.log('timetables faculty_id:', e.message); }
  
  console.log('Migration Success');
  process.exit(0);
})();
