const db = require('../config/db');

// GET /dashboard/classes/:id/summary
exports.getSummary = async (req, res, next) => {
  try {
    const classId = req.params.id;
    const today = new Date().toISOString().split('T')[0];

    const totalStudents = await db.query('SELECT COUNT(*) as count FROM students WHERE class_id = $1', [classId]);

    const todaySession = await db.query(
      `SELECT ar.status, COUNT(*) as count
       FROM attendance_records ar
       JOIN attendance_sessions sess ON ar.session_id = sess.id
       WHERE sess.class_id = $1 AND sess.date = $2
       GROUP BY ar.status`, [classId, today]
    );

    const avgAttendance = await db.query(
      `SELECT COALESCE(AVG(attendance_pct), 0) as avg_pct FROM v_student_attendance_summary WHERE class_id = $1`,
      [classId]
    );

    let todayPresent = 0, todayAbsent = 0, todayLeave = 0;
    todaySession.rows.forEach(r => {
      if (r.status === 'present') todayPresent = parseInt(r.count);
      else if (r.status === 'absent') todayAbsent = parseInt(r.count);
      else if (r.status === 'on_leave') todayLeave = parseInt(r.count);
    });

    res.json({
      totalStudents: parseInt(totalStudents.rows[0].count),
      todayPresent, todayAbsent, todayLeave,
      avgAttendancePct: parseFloat(parseFloat(avgAttendance.rows[0].avg_pct).toFixed(2)),
    });
  } catch (err) { next(err); }
};

// GET /dashboard/classes/:id/trends
exports.getTrends = async (req, res, next) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const result = await db.query(
      `SELECT date, attendance_rate
       FROM v_class_daily_attendance
       WHERE class_id = $1 AND date >= CURRENT_DATE - $2::INTEGER
       ORDER BY date`, [req.params.id, days]
    );
    res.json(result.rows);
  } catch (err) { next(err); }
};

// GET /dashboard/classes/:id/zones
exports.getZones = async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT zone, COUNT(*) as count
       FROM v_student_attendance_summary
       WHERE class_id = $1
       GROUP BY zone`, [req.params.id]
    );

    const zones = { green: 0, yellow: 0, red: 0 };
    result.rows.forEach(r => { zones[r.zone] = parseInt(r.count); });
    res.json(zones);
  } catch (err) { next(err); }
};

// GET /dashboard/classes/:id/heatmap
exports.getHeatmap = async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT t.day_of_week, t.start_time || '-' || t.end_time as time_slot,
              s.name as subject_name,
              COALESCE(
                (SELECT ROUND(COUNT(*) FILTER (WHERE ar.status = 'present') * 100.0 / NULLIF(COUNT(*), 0), 2)
                 FROM attendance_sessions sess
                 JOIN attendance_records ar ON sess.id = ar.session_id
                 WHERE sess.class_id = $1 AND sess.subject_id = t.subject_id
                   AND EXTRACT(DOW FROM sess.date) = t.day_of_week), 0
              ) as attendance_pct
       FROM timetables t
       JOIN subjects s ON t.subject_id = s.id
       WHERE t.class_id = $1
       ORDER BY t.day_of_week, t.start_time`, [req.params.id]
    );
    res.json(result.rows);
  } catch (err) { next(err); }
};

// GET /dashboard/classes/:id/students
exports.getStudentStats = async (req, res, next) => {
  try {
    const { search, sort, order, page, limit } = req.query;
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    const offset = (pageNum - 1) * limitNum;

    let query = `SELECT v.*, u.email, u.phone, u.is_active
                 FROM v_student_attendance_summary v
                 JOIN users u ON v.student_id = u.id
                 WHERE v.class_id = $1`;
    const params = [req.params.id];

    if (search) {
      query += ` AND (LOWER(v.student_name) LIKE $${params.length + 1} OR LOWER(v.roll_no) LIKE $${params.length + 1})`;
      params.push(`%${search.toLowerCase()}%`);
    }

    const sortCol = sort || 'roll_no';
    const sortOrder = order === 'desc' ? 'DESC' : 'ASC';
    query += ` ORDER BY ${sortCol} ${sortOrder}`;
    query += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limitNum, offset);

    const result = await db.query(query, params);

    // Total count
    const countResult = await db.query(
      'SELECT COUNT(*) FROM v_student_attendance_summary WHERE class_id = $1', [req.params.id]
    );

    res.json({
      students: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: pageNum,
      totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limitNum),
    });
  } catch (err) { next(err); }
};

// GET /dashboard/alerts
exports.getAlerts = async (req, res, next) => {
  try {
    const alerts = [];

    // Students below 60%
    const redZone = await db.query(
      `SELECT student_name, roll_no, class_name, attendance_pct
       FROM v_student_attendance_summary WHERE zone = 'red' ORDER BY attendance_pct`
    );
    redZone.rows.forEach(s => {
      alerts.push({
        type: 'critical', category: 'low_attendance',
        message: `${s.student_name} (${s.roll_no}) has ${s.attendance_pct}% attendance`,
        class: s.class_name,
      });
    });

    // Pending yellow leaves
    const pendingLeaves = await db.query(
      `SELECT COUNT(*) as count FROM leave_requests WHERE status = 'pending' AND zone = 'yellow'`
    );
    if (parseInt(pendingLeaves.rows[0].count) > 0) {
      alerts.push({
        type: 'warning', category: 'pending_leaves',
        message: `${pendingLeaves.rows[0].count} yellow zone leave requests pending review`,
      });
    }

    res.json(alerts);
  } catch (err) { next(err); }
};

// GET /dashboard/classes/:id/matrix
exports.getMatrix = async (req, res, next) => {
  try {
    const classId = req.params.id;
    const { month } = req.query; // 'YYYY-MM'
    
    let dateFilter = '';
    const params = [classId];
    if (month) {
      dateFilter = `AND TO_CHAR(sess.date, 'YYYY-MM') = $2`;
      params.push(month);
    }

    // 1. Get dates
    const datesResult = await db.query(
      `SELECT DISTINCT TO_CHAR(sess.date, 'YYYY-MM-DD') as date_str
       FROM attendance_sessions sess 
       WHERE sess.class_id = $1 ${dateFilter} 
       ORDER BY date_str ASC`, params
    );
    const dates = datesResult.rows.map(r => r.date_str);

    // 2. Get students
    const studentsResult = await db.query(
      `SELECT s.user_id, s.roll_no, u.full_name as name 
       FROM students s JOIN users u ON s.user_id = u.id 
       WHERE s.class_id = $1 
       ORDER BY s.roll_no ASC`, [classId]
    );
    const students = studentsResult.rows;

    // 3. Get records
    const recordsResult = await db.query(
      `SELECT ar.student_id, TO_CHAR(sess.date, 'YYYY-MM-DD') as date_str,
         COUNT(ar.id) FILTER (WHERE ar.status = 'present') as present_count
       FROM attendance_records ar
       JOIN attendance_sessions sess ON ar.session_id = sess.id
       WHERE sess.class_id = $1 ${dateFilter}
       GROUP BY ar.student_id, date_str`, params
    );

    const matrix = {};
    recordsResult.rows.forEach(r => {
      if (!matrix[r.student_id]) matrix[r.student_id] = {};
      matrix[r.student_id][r.date_str] = parseInt(r.present_count) > 0 ? 'P' : 'A';
    });

    const resultStudents = students.map((s, index) => {
       const sData = { slNo: index + 1, rollNo: s.roll_no, name: s.name, attendance: {}, percentage: 0 };
       let presentDays = 0, totalDays = 0;
       dates.forEach(d => {
         const status = matrix[s.user_id]?.[d];
         if (status) {
           sData.attendance[d] = status;
           totalDays++;
           if (status === 'P') presentDays++;
         } else {
           sData.attendance[d] = '-'; // no record for this student on this date
         }
       });
       sData.percentage = totalDays === 0 ? 0 : parseFloat(((presentDays / totalDays) * 100).toFixed(1));
       return sData;
    });

    res.json({ dates, students: resultStudents });
  } catch (err) { next(err); }
};
// GET /dashboard/predictions/:studentId
exports.getPredictions = async (req, res, next) => {
  try {
    const studentId = req.params.studentId;
    
    const summary = await db.query(
      `SELECT * FROM v_student_attendance_summary WHERE student_id = $1`, [studentId]
    );
    if (!summary.rows.length) return res.json(null);

    const data = summary.rows[0];
    const totalConducted = parseInt(data.total_classes);
    const present = parseInt(data.present_classes);
    
    // Assume semester has ~400 total classes
    const TOTAL_SEMESTER_CLASSES = 400;
    const remainingClasses = Math.max(0, TOTAL_SEMESTER_CLASSES - totalConducted);
    
    const requiredTo75 = Math.ceil((0.75 * TOTAL_SEMESTER_CLASSES) - present);
    const maxPossiblePct = ((present + remainingClasses) / TOTAL_SEMESTER_CLASSES * 100).toFixed(1);
    const minPossiblePct = ((present) / TOTAL_SEMESTER_CLASSES * 100).toFixed(1);
    
    let safeToBunk = 0;
    if (present >= (0.75 * TOTAL_SEMESTER_CLASSES)) {
      safeToBunk = Math.floor(present / 0.75 - TOTAL_SEMESTER_CLASSES);
    }

    res.json({
      totalConducted,
      present,
      remainingClasses,
      requiredFor75: Math.max(0, requiredTo75),
      canReach75: requiredTo75 <= remainingClasses,
      maxPossiblePct: parseFloat(maxPossiblePct),
      minPossiblePct: parseFloat(minPossiblePct),
      safeToBunk: Math.max(0, safeToBunk)
    });
  } catch (err) { next(err); }
};
const ExcelJS = require('exceljs');

// GET /dashboard/classes/:id/export-matrix
exports.exportMatrix = async (req, res, next) => {
  try {
    const classId = req.params.id;
    const { month } = req.query; // 'YYYY-MM'
    
    let dateFilter = '';
    const params = [classId];
    if (month) {
      dateFilter = `AND TO_CHAR(sess.date, 'YYYY-MM') = $2`;
      params.push(month);
    }

    // 1. Get dates
    const datesResult = await db.query(
      `SELECT DISTINCT TO_CHAR(sess.date, 'YYYY-MM-DD') as date_str
       FROM attendance_sessions sess 
       WHERE sess.class_id = $1 ${dateFilter} 
       ORDER BY date_str ASC`, params
    );
    const dates = datesResult.rows.map(r => r.date_str);

    // 2. Get students
    const studentsResult = await db.query(
      `SELECT s.user_id, s.roll_no, u.full_name as name 
       FROM students s JOIN users u ON s.user_id = u.id 
       WHERE s.class_id = $1 
       ORDER BY s.roll_no ASC`, [classId]
    );
    const students = studentsResult.rows;

    // 3. Get records
    const recordsResult = await db.query(
      `SELECT ar.student_id, TO_CHAR(sess.date, 'YYYY-MM-DD') as date_str,
         COUNT(ar.id) FILTER (WHERE ar.status = 'present') as present_count
       FROM attendance_records ar
       JOIN attendance_sessions sess ON ar.session_id = sess.id
       WHERE sess.class_id = $1 ${dateFilter}
       GROUP BY ar.student_id, date_str`, params
    );

    const matrix = {};
    recordsResult.rows.forEach(r => {
      if (!matrix[r.student_id]) matrix[r.student_id] = {};
      matrix[r.student_id][r.date_str] = parseInt(r.present_count) > 0 ? 'P' : 'A';
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Attendance Matrix');

    // Columns
    const columns = [
      { header: 'Sl No', key: 'slNo', width: 10 },
      { header: 'Roll No', key: 'rollNo', width: 15 },
      { header: 'Name', key: 'name', width: 25 },
      ...dates.map(d => ({ header: d, key: d, width: 12 })),
      { header: 'Total Present', key: 'totalPresent', width: 15 },
      { header: 'Total Days', key: 'totalDays', width: 12 },
      { header: 'Percentage', key: 'percentage', width: 12 }
    ];
    worksheet.columns = columns;

    // Rows
    students.forEach((s, index) => {
      let presentDays = 0, totalDays = 0;
      const row = {
        slNo: index + 1,
        rollNo: s.roll_no,
        name: s.name
      };

      dates.forEach(d => {
        const status = matrix[s.user_id]?.[d];
        if (status) {
          row[d] = status;
          totalDays++;
          if (status === 'P') presentDays++;
        } else {
          row[d] = '-';
        }
      });

      row.totalPresent = presentDays;
      row.totalDays = totalDays;
      row.percentage = totalDays === 0 ? 0 : parseFloat(((presentDays / totalDays) * 100).toFixed(1));
      worksheet.addRow(row);
    });

    // Styling headers
    worksheet.getRow(1).font = { bold: true };

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=attendance_matrix_${classId}_${month || 'all'}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) { next(err); }
};
