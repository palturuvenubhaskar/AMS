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

jest.mock('../src/config/redis', () => ({
  setex: jest.fn(),
  get: jest.fn(),
  set: jest.fn(),
}));

describe('Attendance Module Tests', () => {
  let adminToken, facultyToken, studentToken;

  beforeAll(() => {
    adminToken = jwt.sign({ id: 1, role: 'admin' }, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '1h' });
    facultyToken = jwt.sign({ id: 2, role: 'faculty' }, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '1h' });
    studentToken = jwt.sign({ id: 3, role: 'student' }, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '1h' });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('POST /api/attendance-sessions', () => {
    it('TC-ATT-001: Create Attendance Session', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ id: 1, class_id: 1, subject_id: 1, date: '2026-08-22' }] });

      const res = await request(app)
        .post('/api/attendance-sessions')
        .set('Authorization', `Bearer ${facultyToken}`)
        .send({ classId: 1, subjectId: 1, date: '2026-08-22', timeSlot: '09:00', mode: 'frs' });

      expect(res.status).toBe(201);
      expect(res.body.id).toBe(1);
    });

    it('TC-ATT-002: Create Session - Missing Fields', async () => {
      const res = await request(app)
        .post('/api/attendance-sessions')
        .set('Authorization', `Bearer ${facultyToken}`)
        .send({ classId: 1 });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('required');
    });
  });

  describe('GET /api/attendance-sessions', () => {
    it('TC-ATT-003: Get Sessions', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ id: 1, date: '2026-08-22' }] });

      const res = await request(app)
        .get('/api/attendance-sessions')
        .set('Authorization', `Bearer ${facultyToken}`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
    });
  });

  describe('GET /api/attendance-sessions/:id', () => {
    it('TC-ATT-004: Get Session Details', async () => {
      db.query
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // session
        .mockResolvedValueOnce({ rows: [{ id: 101, student_id: 1, status: 'present' }] }); // records

      const res = await request(app)
        .get('/api/attendance-sessions/1')
        .set('Authorization', `Bearer ${facultyToken}`);

      expect(res.status).toBe(200);
      expect(res.body.session).toBeDefined();
      expect(res.body.records.length).toBe(1);
    });

    it('TC-ATT-005: Get Session Details - Not Found', async () => {
      db.query.mockResolvedValueOnce({ rows: [] }); // session

      const res = await request(app)
        .get('/api/attendance-sessions/999')
        .set('Authorization', `Bearer ${facultyToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/attendance-sessions/:id/records', () => {
    it('TC-ATT-006: Mark Attendance (Bulk)', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ id: 1, status: 'active' }] }); // check session

      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce() // BEGIN
          .mockResolvedValueOnce({ rows: [{ id: 101 }] }) // INSERT 1
          .mockResolvedValueOnce({ rows: [{ id: 102 }] }) // INSERT 2
          .mockResolvedValueOnce() // UPDATE session
          .mockResolvedValueOnce(), // COMMIT
        release: jest.fn(),
      };
      db.pool.connect.mockResolvedValueOnce(mockClient);

      const res = await request(app)
        .post('/api/attendance-sessions/1/records')
        .set('Authorization', `Bearer ${facultyToken}`)
        .send({
          records: [
            { studentId: 10, status: 'present' },
            { studentId: 11, status: 'absent' }
          ]
        });

      expect(res.status).toBe(201);
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('TC-ATT-007: Mark Attendance - Inactive Session', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ id: 1, status: 'closed' }] });

      const res = await request(app)
        .post('/api/attendance-sessions/1/records')
        .set('Authorization', `Bearer ${facultyToken}`)
        .send({
          records: [{ studentId: 10, status: 'present' }]
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('not active');
    });
  });

  describe('PUT /api/attendance-records/:id', () => {
    it('TC-ATT-008: Edit Record Within 2 Hours', async () => {
      // Mock session created 1 hour ago
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      db.query
        .mockResolvedValueOnce({ rows: [{ id: 101, session_created: oneHourAgo }] }) // Check time
        .mockResolvedValueOnce({ rows: [{ id: 101, status: 'absent' }] }); // Update

      const res = await request(app)
        .put('/api/attendance-records/101')
        .set('Authorization', `Bearer ${facultyToken}`)
        .send({ status: 'absent' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('absent');
    });

    it('TC-ATT-009: Edit Record After 2 Hours (Forbidden)', async () => {
      // Mock session created 3 hours ago
      const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
      db.query.mockResolvedValueOnce({ rows: [{ id: 101, session_created: threeHoursAgo }] });

      const res = await request(app)
        .put('/api/attendance-records/101')
        .set('Authorization', `Bearer ${facultyToken}`)
        .send({ status: 'present' });

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('expired');
    });

    it('TC-ATT-010: Edit Record - Invalid Status', async () => {
      const res = await request(app)
        .put('/api/attendance-records/101')
        .set('Authorization', `Bearer ${facultyToken}`)
        .send({ status: 'late' }); // Not allowed

      expect(res.status).toBe(400);
    });
  });
});
