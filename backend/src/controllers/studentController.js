const bcrypt = require('bcryptjs');
const db = require('../config/db');
const fs = require('fs');
const { parse } = require('csv-parse');

exports.bulkImport = async (req, res, next) => {
  if (!req.file) return res.status(400).json({ error: 'No CSV file uploaded' });
  const { classId } = req.body;
  if (!classId) return res.status(400).json({ error: 'Class ID is required' });

  const results = [];
  fs.createReadStream(req.file.path)
    .pipe(parse({ columns: true, skip_empty_lines: true }))
    .on('data', (data) => results.push(data))
    .on('end', async () => {
      const client = await db.pool.connect();
      try {
        await client.query('BEGIN');
        let success = 0;
        let failed = 0;
        const errors = [];
        
        for (let i = 0; i < results.length; i++) {
          const row = results[i];
          const fullName = row.name || row.full_name;
          const rollNo = row.roll_no;
          const phone = row.phone || null;
          
          if (!fullName || !rollNo) {
            failed++;
            errors.push({ row: i+2, roll_no: rollNo, error: 'Name and Roll No are required' });
            continue;
          }

          try {
            const email = row.email || `${rollNo.toLowerCase()}@alits.edu.in`;
            const hashedPassword = await bcrypt.hash(rollNo, 10);
            
            const userRes = await client.query(
              `INSERT INTO users (email, password_hash, full_name, phone, role) 
               VALUES ($1, $2, $3, $4, 'student') RETURNING id`,
              [email, hashedPassword, fullName, phone]
            );
            
            await client.query(
              'INSERT INTO students (user_id, class_id, roll_no) VALUES ($1, $2, $3)',
              [userRes.rows[0].id, classId, rollNo]
            );
            success++;
          } catch (err) {
            failed++;
            errors.push({ row: i+2, roll_no: rollNo, error: err.code === '23505' ? 'Duplicate roll no or email' : err.message });
          }
        }
        await client.query('COMMIT');
        res.json({ success, failed, errors });
      } catch (err) {
        await client.query('ROLLBACK');
        next(err);
      } finally {
        client.release();
        fs.unlinkSync(req.file.path);
      }
    })
    .on('error', (err) => {
      fs.unlinkSync(req.file.path);
      next(err);
    });
};

// POST /students (register student)
exports.register = async (req, res, next) => {
  try {
    const { fullName, rollNo, classId, enrollmentNo, phone } = req.body;
    const email = req.body.email || `${rollNo.toLowerCase()}@alits.edu.in`;
    
    if (!fullName || !rollNo || !classId) {
      return res.status(400).json({ error: 'Name, roll no, and class are required.' });
    }

    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      const defaultPassword = 'Aams@2026';
      const passwordHash = await bcrypt.hash(defaultPassword, 12);

      const userResult = await client.query(
        'INSERT INTO users (email, password_hash, full_name, role, phone) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [email, passwordHash, fullName, 'student', phone]
      );

      const studentResult = await client.query(
        'INSERT INTO students (user_id, class_id, roll_no, enrollment_no) VALUES ($1, $2, $3, $4) RETURNING *',
        [userResult.rows[0].id, classId, rollNo, enrollmentNo || rollNo]
      );

      await client.query('COMMIT');
      res.status(201).json({
        user: userResult.rows[0],
        student: studentResult.rows[0],
        tempPassword: defaultPassword,
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) { next(err); }
};

// GET /students/me
exports.getProfile = async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT u.id, u.email, u.full_name, u.phone, u.role, u.created_at,
              s.roll_no, s.enrollment_no, s.class_id,
              c.name as class_name, c.section, c.semester, c.academic_year,
              d.name as department_name, d.code as department_code
       FROM users u
       JOIN students s ON u.id = s.user_id
       JOIN classes c ON s.class_id = c.id
       JOIN departments d ON c.department_id = d.id
       WHERE u.id = $1`, [req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Student not found.' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
};

// GET /students/:id/attendance
exports.getAttendance = async (req, res, next) => {
  try {
    const studentId = req.params.id === 'me' ? req.user.id : parseInt(req.params.id);
    const result = await db.query(
      `SELECT ar.*, sess.date, sess.time_slot, sess.mode,
              sub.name as subject_name, sub.code as subject_code,
              c.name as class_name, c.section,
              u.full_name as faculty_name
       FROM attendance_records ar
       JOIN attendance_sessions sess ON ar.session_id = sess.id
       JOIN subjects sub ON sess.subject_id = sub.id
       JOIN classes c ON sess.class_id = c.id
       JOIN users u ON sess.faculty_id = u.id
       WHERE ar.student_id = $1
       ORDER BY sess.date DESC, sess.time_slot DESC`, [studentId]
    );
    res.json(result.rows);
  } catch (err) { next(err); }
};

// GET /students/:id/attendance/summary
exports.getAttendanceSummary = async (req, res, next) => {
  try {
    const studentId = req.params.id === 'me' ? req.user.id : parseInt(req.params.id);
    const result = await db.query(
      'SELECT * FROM v_student_attendance_summary WHERE student_id = $1', [studentId]
    );
    res.json(result.rows[0] || {
      student_id: studentId,
      total_present: 0, total_absent: 0, total_on_leave: 0,
      total_sessions: 0, attendance_pct: 0, zone: 'green'
    });
  } catch (err) { next(err); }
};

// GET /users (Admin)
exports.getAllUsers = async (req, res, next) => {
  try {
    const { role } = req.query;
    let query = 'SELECT id, email, full_name, role, phone, is_active, created_at FROM users';
    const params = [];
    if (role) { query += ' WHERE role = $1'; params.push(role); }
    query += ' ORDER BY created_at DESC';
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) { next(err); }
};

// POST /users (Admin - create general users)
exports.createUser = async (req, res, next) => {
  try {
    const { fullName, email, role, phone } = req.body;
    if (!fullName || !email || !role) {
      return res.status(400).json({ error: 'Name, email, and role are required.' });
    }

    const validRoles = ['admin', 'faculty', 'student'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role.' });
    }

    const defaultPassword = 'Aams@2026';
    const passwordHash = await bcrypt.hash(defaultPassword, 12);

    const result = await db.query(
      'INSERT INTO users (email, password_hash, full_name, role, phone) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, full_name, role, phone, is_active, created_at',
      [email, passwordHash, fullName, role, phone]
    );

    res.status(201).json({
      user: result.rows[0],
      tempPassword: defaultPassword,
    });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Email already exists.' });
    }
    next(err);
  }
};
