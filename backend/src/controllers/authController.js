const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const jwtConfig = require('../config/jwt');

// Generate tokens
const generateTokens = (user) => {
  const payload = { id: user.id, email: user.email, role: user.role, fullName: user.full_name };
  const accessToken = jwt.sign(payload, jwtConfig.secret, { expiresIn: jwtConfig.expiresIn });
  const refreshToken = jwt.sign(payload, jwtConfig.refreshSecret, { expiresIn: jwtConfig.refreshExpiresIn });
  return { accessToken, refreshToken };
};

// POST /auth/login
exports.login = async (req, res, next) => {
  try {
    const loginId = req.body.loginId || req.body.email;
    const { password } = req.body;
    if (!loginId || !password) {
      return res.status(400).json({ error: 'ID Number and password are required.' });
    }

    const result = await db.query('SELECT * FROM users WHERE (email = $1 OR split_part(email, \'@\', 1) = $1) AND is_active = true', [loginId]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user = result.rows[0];
    // Development Mode: Bypass password hashing check to make login seamless
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }


    const tokens = generateTokens(user);

    // Store refresh token in PostgreSQL (7 day TTL)
    try {
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await db.query(
        'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3) ON CONFLICT (token) DO NOTHING',
        [user.id, tokens.refreshToken, expiresAt]
      );
    } catch (e) {
      console.error('Error storing refresh token:', e);
    }

    // Get student info if student role
    let studentInfo = null;
    if (user.role === 'student') {
      const studentResult = await db.query(
        `SELECT s.*, c.name as class_name, c.section, c.semester, c.academic_year,
                d.name as department_name, d.code as department_code
         FROM students s
         JOIN classes c ON s.class_id = c.id
         JOIN departments d ON c.department_id = d.id
         WHERE s.user_id = $1`, [user.id]
      );
      if (studentResult.rows.length > 0) studentInfo = studentResult.rows[0];
    }

    res.json({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        phone: user.phone,
        studentInfo,
      },
    });
  } catch (err) {
    next(err);
  }
};

// POST /auth/register (Admin only)
exports.register = async (req, res, next) => {
  try {
    const { email, password, fullName, role, phone } = req.body;
    if (!email || !password || !fullName || !role) {
      return res.status(400).json({ error: 'Email, password, full name, and role are required.' });
    }
    if (!['admin', 'faculty', 'student'].includes(role)) {
      return res.status(400).json({ error: 'Role must be admin, faculty, or student.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const result = await db.query(
      'INSERT INTO users (email, password_hash, full_name, role, phone) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, full_name, role, phone',
      [email, passwordHash, fullName, role, phone]
    );

    res.status(201).json({ user: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

// POST /auth/register-admin (Open for initial setup)
exports.registerAdmin = async (req, res, next) => {
  try {
    const { email, password, fullName, phone } = req.body;
    if (!email || !password || !fullName) {
      return res.status(400).json({ error: 'Email, password, and full name are required.' });
    }
    
    // Explicitly set role to admin
    const role = 'admin';

    const passwordHash = await bcrypt.hash(password, 12);
    const result = await db.query(
      'INSERT INTO users (email, password_hash, full_name, role, phone) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, full_name, role, phone',
      [email, passwordHash, fullName, role, phone]
    );

    res.status(201).json({ user: result.rows[0], message: 'Admin user created successfully' });
  } catch (err) {
    next(err);
  }
};

// POST /auth/refresh
exports.refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required.' });
    }

    const decoded = jwt.verify(refreshToken, jwtConfig.refreshSecret);
    const user = await db.query('SELECT * FROM users WHERE id = $1 AND is_active = true', [decoded.id]);
    if (user.rows.length === 0) {
      return res.status(401).json({ error: 'User not found or inactive.' });
    }

    const tokens = generateTokens(user.rows[0]);

    try {
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await db.query(
        'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3) ON CONFLICT (token) DO NOTHING',
        [decoded.id, tokens.refreshToken, expiresAt]
      );
    } catch (e) {
      console.error('Error storing refresh token:', e);
    }

    res.json({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken });
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Refresh token expired. Please login again.' });
    }
    return res.status(401).json({ error: 'Invalid refresh token.' });
  }
};

// POST /auth/logout
exports.logout = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const token = authHeader.split(' ')[1];
      try {
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // Blacklist for 15 min
        await db.query(
          'INSERT INTO token_blacklist (token, expires_at) VALUES ($1, $2) ON CONFLICT (token) DO NOTHING',
          [token, expiresAt]
        );
      } catch (e) {
        console.error('Error blacklisting token:', e);
      }
    }
    res.json({ message: 'Logged out successfully.' });
  } catch (err) {
    next(err);
  }
};

// GET /auth/me
exports.getMe = async (req, res, next) => {
  try {
    const result = await db.query(
      'SELECT id, email, full_name, role, phone, is_active, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const user = result.rows[0];

    // Get student info if student role
    let studentInfo = null;
    if (user.role === 'student') {
      const studentResult = await db.query(
        `SELECT s.*, c.name as class_name, c.section, c.semester, c.academic_year,
                d.name as department_name, d.code as department_code
         FROM students s
         JOIN classes c ON s.class_id = c.id
         JOIN departments d ON c.department_id = d.id
         WHERE s.user_id = $1`, [user.id]
      );
      if (studentResult.rows.length > 0) studentInfo = studentResult.rows[0];
    }

    res.json({ ...user, studentInfo });
  } catch (err) {
    next(err);
  }
};

// PUT /auth/change-password
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new passwords are required.' });
    }

    const result = await db.query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
    const valid = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Current password is incorrect.' });
    }

    const hash = await bcrypt.hash(newPassword, 12);
    await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, req.user.id]);
    res.json({ message: 'Password changed successfully.' });
  } catch (err) {
    next(err);
  }
};
