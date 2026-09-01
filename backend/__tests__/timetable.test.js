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



describe('Timetable Module Tests', () => {
  let adminToken, facultyToken, studentToken;

  beforeAll(() => {
    adminToken = jwt.sign({ id: 1, role: 'admin' }, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '1h' });
    facultyToken = jwt.sign({ id: 2, role: 'faculty' }, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '1h' });
    studentToken = jwt.sign({ id: 3, role: 'student' }, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '1h' });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('GET /api/timetables', () => {
    it('TC-TIM-001: Get All Timetables', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ id: 1, class_id: 1, day_of_week: 1, start_time: '09:00' }] });

      const res = await request(app)
        .get('/api/timetables')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
    });

    it('TC-TIM-002: Get Timetables with Filters', async () => {
      db.query.mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .get('/api/timetables?classId=1&dayOfWeek=1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE t.class_id = $1 AND t.day_of_week = $2'),
        ['1', '1']
      );
    });
  });

  describe('GET /api/timetables/weekly/:classId', () => {
    it('TC-TIM-003: Get Weekly Timetable', async () => {
      db.query.mockResolvedValueOnce({
        rows: [
          { id: 1, class_id: 1, day_of_week: 1, start_time: '09:00:00' },
          { id: 2, class_id: 1, day_of_week: 2, start_time: '10:00:00' }
        ]
      });

      const res = await request(app)
        .get('/api/timetables/weekly/1')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body['1'].slots.length).toBe(1);
      expect(res.body['2'].slots.length).toBe(1);
    });
  });

  describe('POST /api/timetables', () => {
    it('TC-TIM-004: Create Timetable - Valid', async () => {
      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce() // BEGIN
          .mockResolvedValueOnce({ rows: [] }) // SELECT conflict check
          .mockResolvedValueOnce() // DELETE
          .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // INSERT
          .mockResolvedValueOnce(), // COMMIT
        release: jest.fn(),
      };
      db.pool.connect.mockResolvedValueOnce(mockClient);

      const res = await request(app)
        .post('/api/timetables')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          classId: 1,
          slots: [
            { subjectId: 1, facultyId: 2, dayOfWeek: 1, startTime: '09:00', endTime: '10:00', room: '101' },
            { dayOfWeek: 1, startTime: '10:00', endTime: '11:00' } // empty slot, should not insert
          ]
        });

      expect(res.status).toBe(201);
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(mockClient.release).toHaveBeenCalled();
      expect(res.body.inserted).toBe(1);
    });

    it('TC-TIM-005: Create Timetable - Missing classId', async () => {
      const mockClient = { release: jest.fn() };
      db.pool.connect.mockResolvedValueOnce(mockClient);

      const res = await request(app)
        .post('/api/timetables')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          slots: []
        });

      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /api/timetables/:id', () => {
    it('TC-TIM-006: Delete Timetable Entry', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });

      const res = await request(app)
        .delete('/api/timetables/1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
    });

    it('TC-TIM-007: Delete Timetable Entry - Not Found', async () => {
      db.query.mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .delete('/api/timetables/999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });
  });
});
