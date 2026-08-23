const db = require('../config/db');

// POST /leave-requests
exports.apply = async (req, res, next) => {
  try {
    const { classId, fromDate, toDate, reason, description, proofUrl } = req.body;
    if (!classId || !fromDate || !toDate || !reason) {
      return res.status(400).json({ error: 'Class, dates, and reason are required.' });
    }

    // The DB trigger (process_leave_request) handles zone calculation and auto-approve/reject
    const result = await db.query(
      `INSERT INTO leave_requests (student_id, class_id, from_date, to_date, reason, description, proof_url, attendance_pct_snapshot, zone)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 0, 'green') RETURNING *`,
      [req.user.id, classId, fromDate, toDate, reason, description, proofUrl]
    );

    // Create notification
    const leave = result.rows[0];
    let notifTitle, notifMessage;
    if (leave.status === 'approved') {
      notifTitle = 'Leave Auto-Approved';
      notifMessage = `Your leave from ${fromDate} to ${toDate} was auto-approved (Green Zone: ${leave.attendance_pct_snapshot}%)`;
    } else if (leave.status === 'rejected') {
      notifTitle = 'Leave Auto-Rejected';
      notifMessage = `Your leave was auto-rejected. Attendance ${leave.attendance_pct_snapshot}% is below 60% (Red Zone)`;
    } else {
      notifTitle = 'Leave Request Submitted';
      notifMessage = `Your leave from ${fromDate} to ${toDate} is pending faculty review (Yellow Zone: ${leave.attendance_pct_snapshot}%)`;
    }

    await db.query(
      'INSERT INTO notifications (user_id, type, title, message) VALUES ($1, $2, $3, $4)',
      [req.user.id, 'leave_decision', notifTitle, notifMessage]
    );

    const io = req.app.get('io');
    if (io) {
      io.to(`user_${req.user.id}`).emit('notification', { title: notifTitle, message: notifMessage });
      // Notify class incharge if it's yellow
      if (leave.zone === 'yellow') {
        const incharge = await db.query('SELECT incharge_faculty_id FROM classes WHERE id = $1', [classId]);
        if (incharge.rows[0]?.incharge_faculty_id) {
          io.to(`user_${incharge.rows[0].incharge_faculty_id}`).emit('notification', {
            title: 'New Leave Request',
            message: `A new leave request requires your review for class ${classId}`
          });
        }
      }
    }

    res.status(201).json(leave);
  } catch (err) { next(err); }
};

// GET /leave-requests/my (student's own)
exports.getMyLeaves = async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT lr.*, c.name as class_name, c.section,
              u.full_name as reviewer_name
       FROM leave_requests lr
       JOIN classes c ON lr.class_id = c.id
       LEFT JOIN users u ON lr.faculty_id = u.id
       WHERE lr.student_id = $1
       ORDER BY lr.created_at DESC`, [req.user.id]
    );
    res.json(result.rows);
  } catch (err) { next(err); }
};

// GET /leave-requests/pending (faculty - yellow zone)
exports.getPending = async (req, res, next) => {
  try {
    const { classId } = req.query;
    let query = `SELECT lr.*, c.name as class_name, c.section,
                        u.full_name as student_name, s.roll_no
                 FROM leave_requests lr
                 JOIN classes c ON lr.class_id = c.id
                 JOIN students s ON lr.student_id = s.user_id
                 JOIN users u ON s.user_id = u.id
                 WHERE lr.status = 'pending' AND lr.zone = 'yellow'`;
    const params = [];
    if (classId) { query += ` AND lr.class_id = $${params.length + 1}`; params.push(classId); }
    query += ' ORDER BY lr.created_at ASC';
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) { next(err); }
};

// GET /leave-requests (all, for faculty/admin)
exports.getAll = async (req, res, next) => {
  try {
    const { classId, status, zone } = req.query;
    let query = `SELECT lr.*, c.name as class_name, c.section,
                        u.full_name as student_name, s.roll_no,
                        rev.full_name as reviewer_name
                 FROM leave_requests lr
                 JOIN classes c ON lr.class_id = c.id
                 JOIN students s ON lr.student_id = s.user_id
                 JOIN users u ON s.user_id = u.id
                 LEFT JOIN users rev ON lr.faculty_id = rev.id`;
    const params = [];
    const conditions = [];
    if (classId) { conditions.push(`lr.class_id = $${params.length + 1}`); params.push(classId); }
    if (status) { conditions.push(`lr.status = $${params.length + 1}`); params.push(status); }
    if (zone) { conditions.push(`lr.zone = $${params.length + 1}`); params.push(zone); }
    if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY lr.created_at DESC';
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) { next(err); }
};

// PUT /leave-requests/bulk-review
exports.bulkReview = async (req, res, next) => {
  try {
    const { leaveIds, status, remarks } = req.body;
    if (!leaveIds || !Array.isArray(leaveIds) || leaveIds.length === 0) {
      return res.status(400).json({ error: 'leaveIds array is required.' });
    }
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status must be approved or rejected.' });
    }

    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      
      const placeholders = leaveIds.map((_, i) => `$${i + 4}`).join(',');
      const result = await client.query(
        `UPDATE leave_requests SET status = $1, faculty_id = $2, decision_by = 'faculty',
         remarks = $3, resolved_at = CURRENT_TIMESTAMP WHERE id IN (${placeholders}) AND status = 'pending' RETURNING *`,
        [status, req.user.id, remarks, ...leaveIds]
      );
      
      const io = req.app.get('io');

      for (const lr of result.rows) {
        if (status === 'approved') {
          await client.query(
            `UPDATE attendance_records SET status = 'on_leave'
             WHERE student_id = $1 AND session_id IN (
               SELECT id FROM attendance_sessions WHERE class_id = $2 AND date BETWEEN $3 AND $4
             ) AND status = 'absent'`,
            [lr.student_id, lr.class_id, lr.from_date, lr.to_date]
          );
        }

        const notifTitle = `Leave ${status === 'approved' ? 'Approved' : 'Rejected'}`;
        const notifMessage = `Your leave request was ${status} by ${req.user.fullName}. ${remarks || ''}`;
        
        await client.query(
          'INSERT INTO notifications (user_id, type, title, message) VALUES ($1, $2, $3, $4)',
          [lr.student_id, 'leave_decision', notifTitle, notifMessage]
        );
        
        if (io) {
          io.to(`user_${lr.student_id}`).emit('notification', { title: notifTitle, message: notifMessage });
        }
      }

      await client.query('COMMIT');
      res.json({ updated: result.rowCount, requests: result.rows });
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (err) { next(err); }
};

// PUT /leave-requests/:id (faculty review)
exports.review = async (req, res, next) => {
  try {
    const { status, remarks } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status must be approved or rejected.' });
    }

    const leave = await db.query('SELECT * FROM leave_requests WHERE id = $1', [req.params.id]);
    if (leave.rows.length === 0) return res.status(404).json({ error: 'Leave request not found.' });
    if (leave.rows[0].status !== 'pending') return res.status(400).json({ error: 'Only pending requests can be reviewed.' });

    const result = await db.query(
      `UPDATE leave_requests SET status = $1, faculty_id = $2, decision_by = 'faculty',
       remarks = $3, resolved_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING *`,
      [status, req.user.id, remarks, req.params.id]
    );

    // If approved, mark attendance as on_leave for those dates
    if (status === 'approved') {
      const lr = result.rows[0];
      await db.query(
        `UPDATE attendance_records SET status = 'on_leave'
         WHERE student_id = $1 AND session_id IN (
           SELECT id FROM attendance_sessions WHERE class_id = $2 AND date BETWEEN $3 AND $4
         ) AND status = 'absent'`,
        [lr.student_id, lr.class_id, lr.from_date, lr.to_date]
      );
    }

    // Notify student
    const notifTitle = `Leave ${status === 'approved' ? 'Approved' : 'Rejected'}`;
    const notifMessage = `Your leave request was ${status} by ${req.user.fullName}. ${remarks || ''}`;

    await db.query(
      'INSERT INTO notifications (user_id, type, title, message) VALUES ($1, $2, $3, $4)',
      [leave.rows[0].student_id, 'leave_decision', notifTitle, notifMessage]
    );

    const io = req.app.get('io');
    if (io) {
      io.to(`user_${leave.rows[0].student_id}`).emit('notification', { title: notifTitle, message: notifMessage });
    }

    res.json(result.rows[0]);
  } catch (err) { next(err); }
};

// GET /leave-requests/zone-preview (student checks zone before applying)
exports.zonePreview = async (req, res, next) => {
  try {
    const { classId } = req.query;
    const result = await db.query(
      'SELECT * FROM v_student_attendance_summary WHERE student_id = $1 AND class_id = $2',
      [req.user.id, classId]
    );

    if (result.rows.length === 0) {
      return res.json({ attendancePct: 100, zone: 'green', message: 'No attendance data yet. Leave will be auto-approved.' });
    }

    const data = result.rows[0];
    let message;
    if (data.zone === 'green') message = 'Your leave will be auto-approved (Green Zone).';
    else if (data.zone === 'yellow') message = 'Your leave will be sent for faculty review (Yellow Zone).';
    else message = 'Your leave will be auto-rejected (Red Zone). Attendance below 60%.';

    res.json({
      attendancePct: parseFloat(data.attendance_pct),
      zone: data.zone,
      totalPresent: parseInt(data.total_present),
      totalAbsent: parseInt(data.total_absent),
      totalSessions: parseInt(data.total_sessions),
      message,
    });
  } catch (err) { next(err); }
};
