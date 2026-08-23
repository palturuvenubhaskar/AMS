const db = require('../config/db');

// GET /timetables
exports.getAll = async (req, res, next) => {
  try {
    const { classId, dayOfWeek } = req.query;
    let query = `SELECT t.*, s.name as subject_name, s.code as subject_code,
                        c.name as class_name, c.section,
                        u.full_name as faculty_name
                 FROM timetables t
                 JOIN subjects s ON t.subject_id = s.id
                 JOIN classes c ON t.class_id = c.id
                 LEFT JOIN users u ON t.faculty_id = u.id`;
    const params = [];
    const conditions = [];
    if (classId) { conditions.push(`t.class_id = $${params.length + 1}`); params.push(classId); }
    if (dayOfWeek !== undefined) { conditions.push(`t.day_of_week = $${params.length + 1}`); params.push(dayOfWeek); }
    if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY t.day_of_week, t.start_time';
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) { next(err); }
};

// GET /timetables/weekly/:classId
exports.getWeekly = async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT t.*, s.name as subject_name, s.code as subject_code,
              u.full_name as faculty_name
       FROM timetables t
       JOIN subjects s ON t.subject_id = s.id
       LEFT JOIN users u ON t.faculty_id = u.id
       WHERE t.class_id = $1
       ORDER BY t.day_of_week, t.start_time`, [req.params.classId]
    );

    // Group by day
    const weekly = {};
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    for (let i = 0; i <= 6; i++) weekly[i] = { day: days[i], slots: [] };
    result.rows.forEach(slot => weekly[slot.day_of_week].slots.push(slot));

    res.json(weekly);
  } catch (err) { next(err); }
};

// POST /timetables
// Supports bulk saving a timetable for a class: { classId, slots: [...] }
exports.create = async (req, res, next) => {
  const client = await db.pool.connect();
  try {
    const { classId, slots } = req.body;
    if (!classId || !Array.isArray(slots)) {
      return res.status(400).json({ error: 'classId and an array of slots are required.' });
    }

    await client.query('BEGIN');

    // Check for room conflicts
    for (const slot of slots) {
      if (slot.room && slot.subjectId) {
        // Query to check if ANY class (other than the current one) is using this room at overlapping times
        const conflictRes = await client.query(
          `SELECT t.*, c.name as class_name, c.section 
           FROM timetables t
           JOIN classes c ON t.class_id = c.id
           WHERE t.room = $1 
             AND t.day_of_week = $2 
             AND t.class_id != $3
             AND (t.start_time < $5 AND t.end_time > $4)`,
          [slot.room, slot.dayOfWeek, classId, slot.startTime, slot.endTime]
        );
        
        if (conflictRes && conflictRes.rows && conflictRes.rows.length > 0) {
          await client.query('ROLLBACK');
          const conflict = conflictRes.rows[0];
          return res.status(409).json({ 
            error: `Room conflict! ${slot.room} is already booked by ${conflict.class_name}-${conflict.section} from ${conflict.start_time} to ${conflict.end_time} on day ${slot.dayOfWeek}.` 
          });
        }
      }
    }

    // Remove existing timetable for this class to fully replace it
    await client.query('DELETE FROM timetables WHERE class_id = $1', [classId]);

    // Insert new slots
    const inserted = [];
    for (const slot of slots) {
      if (slot.subjectId) { // Only insert if a subject is assigned to this slot
        const result = await client.query(
          `INSERT INTO timetables (class_id, subject_id, faculty_id, day_of_week, start_time, end_time, room) 
           VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
          [classId, slot.subjectId, slot.facultyId || null, slot.dayOfWeek, slot.startTime, slot.endTime, slot.room || null]
        );
        inserted.push(result.rows[0]);
      }
    }

    await client.query('COMMIT');
    res.status(201).json({ message: 'Timetable saved.', inserted: inserted.length });
  } catch (err) { 
    await client.query('ROLLBACK');
    next(err); 
  } finally {
    client.release();
  }
};

// DELETE /timetables/:id
exports.delete = async (req, res, next) => {
  try {
    const result = await db.query('DELETE FROM timetables WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Timetable entry not found.' });
    res.json({ message: 'Timetable entry deleted.' });
  } catch (err) { next(err); }
};
