const db = require('../config/db');

// POST /api/attendance-records/:id/disputes
// Create a new dispute or justification
exports.createDispute = async (req, res, next) => {
  try {
    const recordId = req.params.id;
    const { type, reason, proofUrl } = req.body;
    const studentId = req.user.id;

    if (!['justification', 'dispute'].includes(type)) {
      return res.status(400).json({ error: 'Invalid type. Must be justification or dispute.' });
    }

    if (!reason) {
      return res.status(400).json({ error: 'Reason is required.' });
    }

    // Verify the record belongs to the student and is absent
    const recordRes = await db.query(
      `SELECT ar.*, sess.date 
       FROM attendance_records ar
       JOIN attendance_sessions sess ON ar.session_id = sess.id
       WHERE ar.id = $1 AND ar.student_id = $2`,
      [recordId, studentId]
    );

    if (recordRes.rows.length === 0) {
      return res.status(404).json({ error: 'Record not found or access denied.' });
    }

    const record = recordRes.rows[0];
    if (record.status !== 'absent') {
      return res.status(400).json({ error: 'Can only dispute or justify absent records.' });
    }

    // Enforce 7-day rule for justifications
    if (type === 'justification') {
      const recordDate = new Date(record.date);
      const now = new Date();
      const diffTime = Math.abs(now - recordDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      if (diffDays > 7) {
        return res.status(400).json({ error: 'Justifications must be submitted within 7 days of the absence.' });
      }
    }

    // Check if a pending dispute already exists
    const existing = await db.query(
      'SELECT id FROM attendance_disputes WHERE record_id = $1 AND status = $2',
      [recordId, 'pending']
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'A pending dispute or justification already exists for this record.' });
    }

    const insertRes = await db.query(
      `INSERT INTO attendance_disputes (record_id, student_id, type, reason, proof_url)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [recordId, studentId, type, reason, proofUrl || null]
    );

    res.status(201).json({ message: 'Submitted successfully.', dispute: insertRes.rows[0] });
  } catch (err) {
    next(err);
  }
};

// GET /api/attendance-disputes/pending
// Faculty gets pending disputes for their classes
exports.getPending = async (req, res, next) => {
  try {
    const facultyId = req.user.id;
    
    const result = await db.query(
      `SELECT d.*, 
              u.full_name as student_name, s.roll_no,
              c.name as class_name, c.section,
              sess.date, sess.time_slot, sub.name as subject_name
       FROM attendance_disputes d
       JOIN students s ON d.student_id = s.user_id
       JOIN users u ON s.user_id = u.id
       JOIN attendance_records ar ON d.record_id = ar.id
       JOIN attendance_sessions sess ON ar.session_id = sess.id
       JOIN classes c ON sess.class_id = c.id
       JOIN subjects sub ON sess.subject_id = sub.id
       WHERE sess.faculty_id = $1 AND d.status = 'pending'
       ORDER BY d.created_at DESC`,
      [facultyId]
    );

    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

// PUT /api/attendance-disputes/:id/resolve
// Faculty resolves the dispute
exports.resolveDispute = async (req, res, next) => {
  const client = await db.pool.connect();
  try {
    const facultyId = req.user.id;
    const disputeId = req.params.id;
    const { status, remarks } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status must be approved or rejected.' });
    }

    await client.query('BEGIN');

    // Get the dispute
    const disputeRes = await client.query(
      `SELECT d.*, ar.session_id, sess.faculty_id 
       FROM attendance_disputes d
       JOIN attendance_records ar ON d.record_id = ar.id
       JOIN attendance_sessions sess ON ar.session_id = sess.id
       WHERE d.id = $1`,
      [disputeId]
    );

    if (disputeRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Dispute not found.' });
    }

    const dispute = disputeRes.rows[0];
    
    // Auth check: Is this faculty allowed to resolve it? (Must be the session faculty)
    if (dispute.faculty_id !== facultyId) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Only the faculty who took the attendance can resolve its disputes.' });
    }

    if (dispute.status !== 'pending') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Dispute is already resolved.' });
    }

    // Update dispute
    const updated = await client.query(
      `UPDATE attendance_disputes 
       SET status = $1, faculty_id = $2, remarks = $3, resolved_at = CURRENT_TIMESTAMP
       WHERE id = $4 RETURNING *`,
      [status, facultyId, remarks || null, disputeId]
    );

    // If approved, update attendance_records
    if (status === 'approved') {
      const newRecordStatus = dispute.type === 'justification' ? 'on_leave' : 'present';
      
      await client.query(
        `UPDATE attendance_records SET status = $1 WHERE id = $2`,
        [newRecordStatus, dispute.record_id]
      );
    }

    await client.query('COMMIT');

    // Send notification
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${dispute.student_id}`).emit('notification', {
        title: `Absence ${dispute.type === 'justification' ? 'Justification' : 'Dispute'} ${status}`,
        message: `Your request has been ${status} by the faculty.`
      });
    }

    res.json({ message: `Dispute ${status} successfully.`, dispute: updated.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};
