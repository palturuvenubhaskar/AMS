const db = require('../config/db');

// GET /subjects
exports.getAll = async (req, res, next) => {
  try {
    const { departmentId } = req.query;
    let query = 'SELECT s.*, d.name as department_name, d.code as department_code FROM subjects s JOIN departments d ON s.department_id = d.id';
    const params = [];
    if (departmentId) { query += ' WHERE s.department_id = $1'; params.push(departmentId); }
    query += ' ORDER BY s.code';
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) { next(err); }
};

// POST /subjects
exports.create = async (req, res, next) => {
  try {
    const { departmentId, name, code, credits } = req.body;
    if (!departmentId || !name || !code) return res.status(400).json({ error: 'Department, name, and code are required.' });
    const result = await db.query(
      'INSERT INTO subjects (department_id, name, code, credits) VALUES ($1, $2, $3, $4) RETURNING *',
      [departmentId, name, code, credits || 3]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
};

// PUT /subjects/:id
exports.update = async (req, res, next) => {
  try {
    const { departmentId, name, code, credits } = req.body;
    const result = await db.query(
      `UPDATE subjects SET department_id = COALESCE($1, department_id), name = COALESCE($2, name),
       code = COALESCE($3, code), credits = COALESCE($4, credits) WHERE id = $5 RETURNING *`,
      [departmentId, name, code, credits, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Subject not found.' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
};

// DELETE /subjects/:id
exports.delete = async (req, res, next) => {
  try {
    const result = await db.query('DELETE FROM subjects WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Subject not found.' });
    res.json({ message: 'Subject deleted.' });
  } catch (err) { next(err); }
};

// POST /class-subjects (map subject to class)
exports.mapToClass = async (req, res, next) => {
  try {
    const { classId, subjectId, facultyId } = req.body;
    if (!classId || !subjectId) return res.status(400).json({ error: 'classId and subjectId required.' });
    
    // UPSERT behavior for mapped subjects (if mapping exists, update faculty_id)
    const result = await db.query(
      `INSERT INTO class_subjects (class_id, subject_id, faculty_id) 
       VALUES ($1, $2, $3) 
       ON CONFLICT (class_id, subject_id) 
       DO UPDATE SET faculty_id = EXCLUDED.faculty_id 
       RETURNING *`, 
      [classId, subjectId, facultyId || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
};

// DELETE /class-subjects/:classId/:subjectId
exports.unmapFromClass = async (req, res, next) => {
  try {
    const result = await db.query(
      'DELETE FROM class_subjects WHERE class_id = $1 AND subject_id = $2 RETURNING *',
      [req.params.classId, req.params.subjectId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Mapping not found.' });
    res.json({ message: 'Subject unmapped from class.' });
  } catch (err) { next(err); }
};

// GET /class-subjects/:classId
exports.getMappedSubjects = async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT cs.*, s.name as subject_name, s.code as subject_code, s.credits,
              u.full_name as faculty_name 
       FROM class_subjects cs
       JOIN subjects s ON cs.subject_id = s.id
       LEFT JOIN users u ON cs.faculty_id = u.id
       WHERE cs.class_id = $1
       ORDER BY s.code`,
      [req.params.classId]
    );
    res.json(result.rows);
  } catch (err) { next(err); }
};
