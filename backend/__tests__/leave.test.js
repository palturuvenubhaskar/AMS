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

describe('Leave Module Tests', () => {
  let adminToken, facultyToken, studentToken;
  let studentUser = { id: 3, fullName: 'Student One' };
  let facultyUser = { id: 2, fullName: 'Faculty One' };

  beforeAll(() => {
    adminToken = jwt.sign({ id: 1, role: 'admin' }, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '1h' });
    facultyToken = jwt.sign({ id: 2, role: 'faculty', fullName: facultyUser.fullName }, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '1h' });
    studentToken = jwt.sign({ id: 3, role: 'student' }, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '1h' });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('POST /api/leave-requests', () => {
    it('TC-LV-001: Apply for Leave', async () => {
      db.query
        .mockResolvedValueOnce({ rows: [{ id: 1, status: 'pending', attendance_pct_snapshot: 60 }] }) // INSERT leave
        .mockResolvedValueOnce({ rows: [] }); // INSERT notification

      const res = await request(app)
        .post('/api/leave-requests')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ classId: 1, fromDate: '2026-09-01', toDate: '2026-09-02', reason: 'Sick', description: 'Fever' });

      expect(res.status).toBe(201);
      expect(db.query).toHaveBeenCalledTimes(2);
    });

    it('TC-LV-002: Apply for Leave - Missing Fields', async () => {
      const res = await request(app)
        .post('/api/leave-requests')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ classId: 1 });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/leave-requests/zone-preview', () => {
    it('TC-LV-003: Zone Preview - Green', async () => {
      db.query.mockResolvedValueOnce({
        rows: [{ attendance_pct: '85.00', zone: 'green', total_present: 17, total_absent: 3, total_sessions: 20 }]
      });

      const res = await request(app)
        .get('/api/leave-requests/zone-preview?classId=1')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.zone).toBe('green');
      expect(res.body.attendancePct).toBe(85);
    });

    it('TC-LV-004: Zone Preview - No Data', async () => {
      db.query.mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .get('/api/leave-requests/zone-preview?classId=1')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.zone).toBe('green');
      expect(res.body.message).toContain('No attendance data');
    });
  });

  describe('GET /api/leave-requests/my', () => {
    it('TC-LV-005: Get My Leaves', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ id: 1, status: 'pending' }] });

      const res = await request(app)
        .get('/api/leave-requests/my')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
    });
  });

  describe('GET /api/leave-requests/pending', () => {
    it('TC-LV-006: Get Pending Leaves (Faculty)', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ id: 1, status: 'pending', zone: 'yellow' }] });

      const res = await request(app)
        .get('/api/leave-requests/pending?classId=1')
        .set('Authorization', `Bearer ${facultyToken}`);

      expect(res.status).toBe(200);
      expect(res.body[0].zone).toBe('yellow');
    });
  });

  describe('GET /api/leave-requests', () => {
    it('TC-LV-007: Get All Leaves (Admin)', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ id: 1 }, { id: 2 }] });

      const res = await request(app)
        .get('/api/leave-requests?status=approved')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
    });
  });

  describe('PUT /api/leave-requests/:id', () => {
    it('TC-LV-008: Review Leave - Approve', async () => {
      db.query
        .mockResolvedValueOnce({ rows: [{ id: 1, status: 'pending', student_id: 3, class_id: 1, from_date: '2026-09-01', to_date: '2026-09-02' }] }) // fetch leave
        .mockResolvedValueOnce({ rows: [{ id: 1, status: 'approved' }] }) // update leave
        .mockResolvedValueOnce({ rows: [] }) // update attendance
        .mockResolvedValueOnce({ rows: [] }); // insert notification

      const res = await request(app)
        .put('/api/leave-requests/1')
        .set('Authorization', `Bearer ${facultyToken}`)
        .send({ status: 'approved', remarks: 'Okay' });

      expect(res.status).toBe(200);
      expect(db.query).toHaveBeenCalledTimes(4); // check, update, attendance update, notification
      expect(res.body.status).toBe('approved');
    });

    it('TC-LV-009: Review Leave - Reject', async () => {
      db.query
        .mockResolvedValueOnce({ rows: [{ id: 1, status: 'pending', student_id: 3 }] }) // fetch leave
        .mockResolvedValueOnce({ rows: [{ id: 1, status: 'rejected' }] }) // update leave
        // No attendance update for rejection
        .mockResolvedValueOnce({ rows: [] }); // insert notification

      const res = await request(app)
        .put('/api/leave-requests/1')
        .set('Authorization', `Bearer ${facultyToken}`)
        .send({ status: 'rejected', remarks: 'Not allowed' });

      expect(res.status).toBe(200);
      expect(db.query).toHaveBeenCalledTimes(3); // check, update, notification
      expect(res.body.status).toBe('rejected');
    });

    it('TC-LV-010: Review Leave - Invalid Status', async () => {
      const res = await request(app)
        .put('/api/leave-requests/1')
        .set('Authorization', `Bearer ${facultyToken}`)
        .send({ status: 'pending' });

      expect(res.status).toBe(400);
    });

    it('TC-LV-011: Review Leave - Already Reviewed', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ id: 1, status: 'approved' }] }); // fetch leave

      const res = await request(app)
        .put('/api/leave-requests/1')
        .set('Authorization', `Bearer ${facultyToken}`)
        .send({ status: 'rejected' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('pending');
    });
  });
});
