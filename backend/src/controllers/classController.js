const db = require('../config/db');

// GET /classes
exports.getAll = async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT c.*, d.name as department_name, d.code as department_code,
              (SELECT COUNT(*) FROM students s WHERE s.class_id = c.id) as student_count
       FROM classes c
       JOIN departments d ON c.department_id = d.id
       ORDER BY d.code, c.name, c.section`
    );
    res.json(result.rows);
  } catch (err) { next(err); }
};

// GET /classes/:id
exports.getById = async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT c.*, d.name as department_name, d.code as department_code,
              (SELECT COUNT(*) FROM students s WHERE s.class_id = c.id) as student_count
       FROM classes c
       JOIN departments d ON c.department_id = d.id
       WHERE c.id = $1`, [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Class not found.' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
};

// POST /classes
exports.create = async (req, res, next) => {
  try {
    const { departmentId, name, section, semester, academicYear } = req.body;
    if (!departmentId || !name || !section || !semester || !academicYear) {
      return res.status(400).json({ error: 'All fields are required.' });
    }
    const result = await db.query(
      'INSERT INTO classes (department_id, name, section, semester, academic_year) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [departmentId, name, section, semester, academicYear]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
};

// PUT /classes/:id
exports.update = async (req, res, next) => {
  try {
    const { departmentId, name, section, semester, academicYear } = req.body;
    const result = await db.query(
      `UPDATE classes SET department_id = COALESCE($1, department_id), name = COALESCE($2, name),
       section = COALESCE($3, section), semester = COALESCE($4, semester),
       academic_year = COALESCE($5, academic_year) WHERE id = $6 RETURNING *`,
      [departmentId, name, section, semester, academicYear, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Class not found.' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
};

// DELETE /classes/:id
exports.delete = async (req, res, next) => {
  try {
    const result = await db.query('DELETE FROM classes WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Class not found.' });
    res.json({ message: 'Class deleted.' });
  } catch (err) { next(err); }
};

// GET /classes/:id/students
exports.getStudents = async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT u.id, u.email, u.full_name, u.phone, u.is_active,
              s.roll_no, s.enrollment_no, s.class_id, s.created_at,
              COALESCE(v.total_present, 0) as total_present,
              COALESCE(v.total_absent, 0) as total_absent,
              COALESCE(v.total_on_leave, 0) as total_on_leave,
              COALESCE(v.total_sessions, 0) as total_sessions,
              COALESCE(v.attendance_pct, 0) as attendance_pct,
              COALESCE(v.zone, 'green') as zone
       FROM students s
       JOIN users u ON s.user_id = u.id
       LEFT JOIN v_student_attendance_summary v ON s.user_id = v.student_id AND s.class_id = v.class_id
       WHERE s.class_id = $1
       ORDER BY s.roll_no`, [req.params.id]
    );
    res.json(result.rows);
  } catch (err) { next(err); }
};

// GET /classes/:id/subjects
exports.getSubjects = async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT s.* FROM subjects s
       JOIN class_subjects cs ON s.id = cs.subject_id
       WHERE cs.class_id = $1
       ORDER BY s.name`, [req.params.id]
    );
    res.json(result.rows);
  } catch (err) { next(err); }
};
