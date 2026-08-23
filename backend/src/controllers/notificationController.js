const db = require('../config/db');

// GET /notifications
exports.getAll = async (req, res, next) => {
  try {
    const result = await db.query(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
      [req.user.id]
    );
    const unreadCount = await db.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false',
      [req.user.id]
    );
    res.json({ notifications: result.rows, unreadCount: parseInt(unreadCount.rows[0].count) });
  } catch (err) { next(err); }
};

// PUT /notifications/:id/read
exports.markRead = async (req, res, next) => {
  try {
    await db.query('UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]);
    res.json({ message: 'Marked as read.' });
  } catch (err) { next(err); }
};

// PUT /notifications/read-all
exports.markAllRead = async (req, res, next) => {
  try {
    await db.query('UPDATE notifications SET is_read = true WHERE user_id = $1', [req.user.id]);
    res.json({ message: 'All marked as read.' });
  } catch (err) { next(err); }
};
