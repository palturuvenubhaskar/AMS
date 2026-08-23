const db = require('../config/db');

// GET /departments
exports.getAll = async (req, res, next) => {
  try {
    const result = await db.query('SELECT * FROM departments ORDER BY name');
    res.json(result.rows);
  } catch (err) { next(err); }
};

// POST /departments
exports.create = async (req, res, next) => {
  try {
    const { name, code } = req.body;
    if (!name || !code) return res.status(400).json({ error: 'Name and code are required.' });
    const result = await db.query(
      'INSERT INTO departments (name, code) VALUES ($1, $2) RETURNING *', [name, code.toUpperCase()]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
};

// PUT /departments/:id
exports.update = async (req, res, next) => {
  try {
    const { name, code } = req.body;
    const result = await db.query(
      'UPDATE departments SET name = COALESCE($1, name), code = COALESCE($2, code) WHERE id = $3 RETURNING *',
      [name, code?.toUpperCase(), req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Department not found.' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
};

// DELETE /departments/:id
exports.delete = async (req, res, next) => {
  try {
    const result = await db.query('DELETE FROM departments WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Department not found.' });
    res.json({ message: 'Department deleted.' });
  } catch (err) { next(err); }
};
