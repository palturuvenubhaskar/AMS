const request = require('supertest');
const { app } = require('../src/app');
const db = require('../src/config/db');
const jwt = require('jsonwebtoken');

jest.mock('../src/config/db', () => ({
  query: jest.fn(),
  pool: {
    connect: jest.fn(),
  }
}));



describe('Notification Module Tests', () => {
  let studentToken;

  beforeAll(() => {
    studentToken = jwt.sign({ id: 3, role: 'student' }, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '1h' });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('GET /api/notifications', () => {
    it('TC-NOT-001: Get Notifications', async () => {
      db.query
        .mockResolvedValueOnce({ rows: [{ id: 1, message: 'Test Notif' }] }) // get notifs
        .mockResolvedValueOnce({ rows: [{ count: '1' }] }); // unread count

      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.notifications.length).toBe(1);
      expect(res.body.unreadCount).toBe(1);
    });
  });

  describe('PUT /api/notifications/:id/read', () => {
    it('TC-NOT-002: Mark Single Notification as Read', async () => {
      db.query.mockResolvedValueOnce({ rowCount: 1 });

      const res = await request(app)
        .put('/api/notifications/1/read')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
    });
  });

  describe('PUT /api/notifications/read-all', () => {
    it('TC-NOT-003: Mark All Notifications as Read', async () => {
      db.query.mockResolvedValueOnce({ rowCount: 5 });

      const res = await request(app)
        .put('/api/notifications/read-all')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
    });
  });
});
