const path = require('path');
const fs = require('fs');
const db = require('../config/db');

// Ensure uploads/faces directory exists
const facesDir = path.join(__dirname, '../../uploads/faces');
if (!fs.existsSync(facesDir)) {
  fs.mkdirSync(facesDir, { recursive: true });
}

// POST /api/face/enroll
exports.enrollFace = async (req, res, next) => {
  try {
    let { studentId, embedding, image, angleType } = req.body;

    // Authorization & student id resolution
    if (req.user.role === 'student') {
      studentId = req.user.id;
    } else {
      studentId = parseInt(studentId, 10);
    }

    if (!studentId) {
      return res.status(400).json({ error: 'Valid studentId is required.' });
    }

    if (!Array.isArray(embedding) || embedding.length !== 128) {
      return res.status(400).json({ error: 'A 128-dimensional face embedding array is required.' });
    }

    // Verify student exists
    const studentCheck = await db.query('SELECT user_id, class_id, roll_no FROM students WHERE user_id = $1', [studentId]);
    if (studentCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Student record not found.' });
    }

    // Save image if provided as base64 data URL
    let imagePath = '/uploads/faces/default.jpg';
    if (image && typeof image === 'string' && image.startsWith('data:image')) {
      const matches = image.match(/^data:image\/([a-zA-Z0-9.+]+);base64,(.+)$/);
      if (matches) {
        const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
        const base64Data = matches[2];
        const fileName = `face_${studentId}_${Date.now()}.${ext}`;
        const filePath = path.join(facesDir, fileName);
        await fs.promises.writeFile(filePath, Buffer.from(base64Data, 'base64'));
        imagePath = `/uploads/faces/${fileName}`;
      }
    }

    // Convert float array (128 floats) to binary Buffer
    const float32Array = new Float32Array(embedding);
    const embeddingBuffer = Buffer.from(float32Array.buffer);

    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      // Unset previous primary faces for this student
      await client.query(
        'UPDATE student_faces SET is_primary = FALSE WHERE student_id = $1',
        [studentId]
      );

      // Insert new face
      const insertRes = await client.query(
        `INSERT INTO student_faces (student_id, image_path, embedding, angle_type, is_primary)
         VALUES ($1, $2, $3, $4, TRUE)
         RETURNING id, student_id, image_path, angle_type, is_primary, created_at`,
        [studentId, imagePath, embeddingBuffer, angleType || 'front']
      );

      await client.query('COMMIT');

      const enrolledFace = insertRes.rows[0];
      return res.status(201).json({
        success: true,
        message: 'Face enrolled successfully.',
        face: {
          id: enrolledFace.id,
          studentId: enrolledFace.student_id,
          imagePath: enrolledFace.image_path,
          angleType: enrolledFace.angle_type,
          createdAt: enrolledFace.created_at,
          rollNo: studentCheck.rows[0].roll_no,
        },
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    next(err);
  }
};

// GET /api/classes/:classId/faces
exports.getClassFaces = async (req, res, next) => {
  try {
    const classId = parseInt(req.params.classId, 10);
    if (!classId) return res.status(400).json({ error: 'Valid classId is required.' });

    const result = await db.query(
      `SELECT sf.id, sf.student_id, sf.image_path, sf.embedding, sf.created_at,
              s.roll_no, u.full_name
       FROM student_faces sf
       JOIN students s ON s.user_id = sf.student_id
       JOIN users u ON u.id = s.user_id
       WHERE s.class_id = $1 AND sf.is_primary = TRUE
       ORDER BY s.roll_no ASC`,
      [classId]
    );

    const faces = result.rows.map(row => {
      let descriptor = null;
      if (row.embedding && Buffer.isBuffer(row.embedding)) {
        const floatArray = new Float32Array(
          row.embedding.buffer,
          row.embedding.byteOffset,
          row.embedding.byteLength / 4
        );
        descriptor = Array.from(floatArray);
      }
      return {
        id: row.id,
        studentId: row.student_id,
        rollNo: row.roll_no,
        fullName: row.full_name,
        imagePath: row.image_path,
        createdAt: row.created_at,
        embedding: descriptor,
      };
    });

    res.json({
      count: faces.length,
      faces,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/classes/:classId/face-status
exports.getClassFaceStatus = async (req, res, next) => {
  try {
    const classId = parseInt(req.params.classId, 10);
    if (!classId) return res.status(400).json({ error: 'Valid classId is required.' });

    const result = await db.query(
      `SELECT s.user_id as student_id, s.roll_no, s.enrollment_no, u.full_name,
              sf.id as face_id, sf.image_path, sf.created_at as enrolled_at
       FROM students s
       JOIN users u ON u.id = s.user_id
       LEFT JOIN student_faces sf ON sf.student_id = s.user_id AND sf.is_primary = TRUE
       WHERE s.class_id = $1
       ORDER BY s.roll_no ASC`,
      [classId]
    );

    const students = result.rows.map(r => ({
      studentId: r.student_id,
      rollNo: r.roll_no,
      enrollmentNo: r.enrollment_no,
      fullName: r.full_name,
      isEnrolled: !!r.face_id,
      faceId: r.face_id || null,
      imagePath: r.image_path || null,
      enrolledAt: r.enrolled_at || null,
    }));

    const enrolledCount = students.filter(s => s.isEnrolled).length;

    res.json({
      totalStudents: students.length,
      enrolledCount,
      missingCount: students.length - enrolledCount,
      students,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/students/:id/face
exports.getStudentFace = async (req, res, next) => {
  try {
    const studentId = parseInt(req.params.id, 10);
    if (!studentId) return res.status(400).json({ error: 'Valid studentId is required.' });

    // Students can only view their own face unless faculty/admin
    if (req.user.role === 'student' && req.user.id !== studentId) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const result = await db.query(
      `SELECT sf.id, sf.student_id, sf.image_path, sf.angle_type, sf.is_primary, sf.created_at,
              s.roll_no, u.full_name
       FROM student_faces sf
       JOIN students s ON s.user_id = sf.student_id
       JOIN users u ON u.id = s.user_id
       WHERE sf.student_id = $1 AND sf.is_primary = TRUE
       LIMIT 1`,
      [studentId]
    );

    if (result.rows.length === 0) {
      return res.json({ enrolled: false, face: null });
    }

    const row = result.rows[0];
    res.json({
      enrolled: true,
      face: {
        id: row.id,
        studentId: row.student_id,
        rollNo: row.roll_no,
        fullName: row.full_name,
        imagePath: row.image_path,
        angleType: row.angle_type,
        createdAt: row.created_at,
      },
    });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/students/:id/face
exports.deleteStudentFace = async (req, res, next) => {
  try {
    const studentId = parseInt(req.params.id, 10);
    if (!studentId) return res.status(400).json({ error: 'Valid studentId is required.' });

    if (req.user.role === 'student' && req.user.id !== studentId) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const rows = await db.query(
      'DELETE FROM student_faces WHERE student_id = $1 RETURNING image_path',
      [studentId]
    );

    // Optionally delete old images
    for (const r of rows.rows) {
      if (r.image_path && r.image_path.startsWith('/uploads/faces/')) {
        const p = path.join(__dirname, '../..', r.image_path);
        if (fs.existsSync(p)) {
          try { fs.unlinkSync(p); } catch (e) { /* ignore cleanup error */ }
        }
      }
    }

    res.json({ success: true, message: 'Face record removed successfully.' });
  } catch (err) {
    next(err);
  }
};
