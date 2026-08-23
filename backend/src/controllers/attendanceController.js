const db = require('../config/db');

// POST /attendance-sessions
exports.createSession = async (req, res, next) => {
  try {
    const { classId, subjectId, date, timeSlot, mode } = req.body;
    if (!classId || !subjectId || !date || !timeSlot) {
      return res.status(400).json({ error: 'Class, subject, date, and time slot are required.' });
    }

    const result = await db.query(
      `INSERT INTO attendance_sessions (class_id, subject_id, faculty_id, date, time_slot, mode)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [classId, subjectId, req.user.id, date, timeSlot, mode || 'manual']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
};

// GET /attendance-sessions
exports.getSessions = async (req, res, next) => {
  try {
    const { classId, date, facultyId } = req.query;
    let query = `SELECT sess.*, sub.name as subject_name, sub.code as subject_code,
                        c.name as class_name, c.section, u.full_name as faculty_name,
                        (SELECT COUNT(*) FILTER (WHERE ar.status = 'present') FROM attendance_records ar WHERE ar.session_id = sess.id) as present_count,
                        (SELECT COUNT(*) FILTER (WHERE ar.status = 'absent') FROM attendance_records ar WHERE ar.session_id = sess.id) as absent_count,
                        (SELECT COUNT(*) FROM attendance_records ar WHERE ar.session_id = sess.id) as total_records
                 FROM attendance_sessions sess
                 JOIN subjects sub ON sess.subject_id = sub.id
                 JOIN classes c ON sess.class_id = c.id
                 JOIN users u ON sess.faculty_id = u.id`;
    const params = [];
    const conditions = [];
    if (classId) { conditions.push(`sess.class_id = $${params.length + 1}`); params.push(classId); }
    if (date) { conditions.push(`sess.date = $${params.length + 1}`); params.push(date); }
    if (facultyId) { conditions.push(`sess.faculty_id = $${params.length + 1}`); params.push(facultyId); }
    if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY sess.date DESC, sess.time_slot DESC';
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) { next(err); }
};

// GET /attendance-sessions/:id
exports.getSession = async (req, res, next) => {
  try {
    const session = await db.query(
      `SELECT sess.*, sub.name as subject_name, sub.code as subject_code,
              c.name as class_name, c.section, u.full_name as faculty_name
       FROM attendance_sessions sess
       JOIN subjects sub ON sess.subject_id = sub.id
       JOIN classes c ON sess.class_id = c.id
       JOIN users u ON sess.faculty_id = u.id
       WHERE sess.id = $1`, [req.params.id]
    );
    if (session.rows.length === 0) return res.status(404).json({ error: 'Session not found.' });

    const records = await db.query(
      `SELECT ar.*, u.full_name as student_name, s.roll_no
       FROM attendance_records ar
       JOIN students s ON ar.student_id = s.user_id
       JOIN users u ON s.user_id = u.id
       WHERE ar.session_id = $1
       ORDER BY s.roll_no`, [req.params.id]
    );

    res.json({ session: session.rows[0], records: records.rows });
  } catch (err) { next(err); }
};

// POST /attendance-sessions/:id/records (bulk mark)
exports.markAttendance = async (req, res, next) => {
  try {
    const sessionId = req.params.id;
    const { records } = req.body; // [{studentId, status, frsConfidence?}]

    if (!records || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ error: 'Records array is required.' });
    }

    // Verify session exists and is active
    const session = await db.query('SELECT * FROM attendance_sessions WHERE id = $1', [sessionId]);
    if (session.rows.length === 0) return res.status(404).json({ error: 'Session not found.' });
    if (session.rows[0].status !== 'active') return res.status(400).json({ error: 'Session is not active.' });

    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      const inserted = [];
      for (const record of records) {
        const result = await client.query(
          `INSERT INTO attendance_records (session_id, student_id, status, frs_confidence)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (session_id, student_id) DO UPDATE SET status = $3, frs_confidence = $4, marked_at = CURRENT_TIMESTAMP
           RETURNING *`,
          [sessionId, record.studentId, record.status, record.frsConfidence || null]
        );
        inserted.push(result.rows[0]);
      }

      // Close session after marking
      await client.query('UPDATE attendance_sessions SET status = $1 WHERE id = $2', ['closed', sessionId]);
      await client.query('COMMIT');

      const io = req.app.get('io');
      if (io) {
        const sessionDate = session.rows[0].date || new Date();
        const dateStr = sessionDate instanceof Date ? sessionDate.toISOString().split('T')[0] : new Date(sessionDate).toISOString().split('T')[0];
        
        for (const record of inserted) {
          io.to(`user_${record.student_id}`).emit('notification', {
            title: 'Attendance Marked',
            message: `Your attendance was marked as ${record.status} for ${dateStr}.`
          });
        }
      }

      res.status(201).json({ message: `${inserted.length} records saved.`, records: inserted });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) { next(err); }
};

// PUT /attendance-records/:id (edit within 2 hours)
exports.editRecord = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['present', 'absent', 'on_leave'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status.' });
    }

    // Check 2-hour edit window
    const record = await db.query(
      `SELECT ar.*, sess.created_at as session_created
       FROM attendance_records ar
       JOIN attendance_sessions sess ON ar.session_id = sess.id
       WHERE ar.id = $1`, [req.params.id]
    );

    if (record.rows.length === 0) return res.status(404).json({ error: 'Record not found.' });

    const sessionTime = new Date(record.rows[0].session_created);
    const now = new Date();
    const hoursDiff = (now - sessionTime) / (1000 * 60 * 60);

    if (hoursDiff > 2) {
      return res.status(403).json({ error: 'Edit window expired. Records can only be edited within 2 hours.' });
    }

    const result = await db.query(
      'UPDATE attendance_records SET status = $1, marked_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { next(err); }
};
