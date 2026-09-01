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



describe('Dashboard Module Tests', () => {
  let adminToken, facultyToken, studentToken;

  beforeAll(() => {
    adminToken = jwt.sign({ id: 1, role: 'admin' }, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '1h' });
    facultyToken = jwt.sign({ id: 2, role: 'faculty' }, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '1h' });
    studentToken = jwt.sign({ id: 3, role: 'student' }, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '1h' });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('GET /api/dashboard/classes/:id/summary', () => {
    it('TC-DASH-001: Get Class Summary', async () => {
      db.query
        .mockResolvedValueOnce({ rows: [{ count: '50' }] }) // totalStudents
        .mockResolvedValueOnce({ rows: [{ status: 'present', count: '45' }, { status: 'absent', count: '5' }] }) // todaySession
        .mockResolvedValueOnce({ rows: [{ avg_pct: '90.5' }] }); // avgAttendance

      const res = await request(app)
        .get('/api/dashboard/classes/1/summary')
        .set('Authorization', `Bearer ${facultyToken}`);

      expect(res.status).toBe(200);
      expect(res.body.totalStudents).toBe(50);
      expect(res.body.todayPresent).toBe(45);
      expect(res.body.avgAttendancePct).toBe(90.5);
    });
  });

  describe('GET /api/dashboard/classes/:id/trends', () => {
    it('TC-DASH-002: Get Trends', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ date: '2026-08-01', attendance_rate: '85.5' }] });

      const res = await request(app)
        .get('/api/dashboard/classes/1/trends?days=7')
        .set('Authorization', `Bearer ${facultyToken}`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
    });
  });

  describe('GET /api/dashboard/classes/:id/zones', () => {
    it('TC-DASH-003: Get Zones', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ zone: 'green', count: '40' }, { zone: 'red', count: '5' }] });

      const res = await request(app)
        .get('/api/dashboard/classes/1/zones')
        .set('Authorization', `Bearer ${facultyToken}`);

      expect(res.status).toBe(200);
      expect(res.body.green).toBe(40);
      expect(res.body.red).toBe(5);
    });
  });

  describe('GET /api/dashboard/classes/:id/heatmap', () => {
    it('TC-DASH-004: Get Heatmap', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ day_of_week: 1, time_slot: '09:00-10:00', attendance_pct: '95' }] });

      const res = await request(app)
        .get('/api/dashboard/classes/1/heatmap')
        .set('Authorization', `Bearer ${facultyToken}`);

      expect(res.status).toBe(200);
      expect(res.body[0].attendance_pct).toBe('95');
    });
  });

  describe('GET /api/dashboard/classes/:id/students', () => {
    it('TC-DASH-005: Get Student Stats', async () => {
      db.query
        .mockResolvedValueOnce({ rows: [{ student_name: 'John', roll_no: '101' }] }) // students
        .mockResolvedValueOnce({ rows: [{ count: '1' }] }); // total

      const res = await request(app)
        .get('/api/dashboard/classes/1/students?search=john&sort=roll_no&order=asc')
        .set('Authorization', `Bearer ${facultyToken}`);

      expect(res.status).toBe(200);
      expect(res.body.students.length).toBe(1);
      expect(res.body.total).toBe(1);
    });
  });

  describe('GET /api/dashboard/alerts', () => {
    it('TC-DASH-006: Get Alerts', async () => {
      db.query
        .mockResolvedValueOnce({ rows: [{ student_name: 'John', roll_no: '101', attendance_pct: '35', class_name: 'CS1' }] }) // redZone
        .mockResolvedValueOnce({ rows: [{ count: '2' }] }); // pending leaves

      const res = await request(app)
        .get('/api/dashboard/alerts')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
      expect(res.body[0].type).toBe('critical');
      expect(res.body[1].type).toBe('warning');
    });
  });

  describe('GET /api/dashboard/classes/:id/matrix', () => {
    it('TC-DASH-007: Get Monthly Matrix', async () => {
      db.query
        .mockResolvedValueOnce({ rows: [{ date_str: '2026-08-01' }] }) // dates
        .mockResolvedValueOnce({ rows: [{ user_id: 1, roll_no: '101', name: 'John' }] }) // students
        .mockResolvedValueOnce({ rows: [{ student_id: 1, date_str: '2026-08-01', present_count: '1' }] }); // records

      const res = await request(app)
        .get('/api/dashboard/classes/1/matrix?month=2026-08')
        .set('Authorization', `Bearer ${facultyToken}`);

      expect(res.status).toBe(200);
      expect(res.body.dates.length).toBe(1);
      expect(res.body.students[0].attendance['2026-08-01']).toBe('P');
    });
  });
});
