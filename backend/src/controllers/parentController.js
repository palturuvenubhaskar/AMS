const db = require('../config/db');

// GET /parents/ward-summary
exports.getWardSummary = async (req, res, next) => {
  try {
    const parentId = req.user.id;

    // Get wards for this parent
    const wards = await db.query(
      `SELECT sp.relation, u.full_name, u.email, u.phone, s.roll_no, s.user_id as student_id,
              c.name as class_name, c.section
       FROM student_parents sp
       JOIN users u ON sp.student_id = u.id
       JOIN students s ON u.id = s.user_id
       JOIN classes c ON s.class_id = c.id
       WHERE sp.parent_id = $1`, [parentId]
    );

    if (wards.rows.length === 0) {
      return res.json([]);
    }

    const summary = [];
    for (const ward of wards.rows) {
      const attSummary = await db.query(
        `SELECT total_classes, present_classes, absent_classes, leave_classes, attendance_pct, zone
         FROM v_student_attendance_summary
         WHERE student_id = $1`, [ward.student_id]
      );
      
      summary.push({
        ...ward,
        attendance: attSummary.rows[0] || null
      });
    }

    res.json(summary);
  } catch (err) { next(err); }
};
