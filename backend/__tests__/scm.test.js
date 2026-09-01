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



describe('Student & Class Management (SCM) Tests', () => {
  let adminToken, facultyToken, studentToken;

  beforeAll(() => {
    adminToken = jwt.sign({ id: 1, role: 'admin' }, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '1h' });
    facultyToken = jwt.sign({ id: 2, role: 'faculty' }, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '1h' });
    studentToken = jwt.sign({ id: 3, role: 'student' }, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '1h' });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Departments', () => {
    it('TC-SCM-001: Create Department', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ id: 1, name: 'Electronics', code: 'ECE' }] });

      const res = await request(app)
        .post('/api/departments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Electronics', code: 'ECE' });

      expect(res.status).toBe(201);
      expect(res.body.code).toBe('ECE');
    });

    it('TC-SCM-002: Duplicate Department Code', async () => {
      const err = new Error('duplicate key value violates unique constraint');
      err.code = '23505';
      db.query.mockRejectedValueOnce(err);

      const res = await request(app)
        .post('/api/departments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Computer Science', code: 'CSE' });

      expect(res.status).toBe(409); // The errorHandler middleware handles 23505 as 409
    });

    it('TC-SCM-017: Delete Dept with Linked Classes', async () => {
      const err = new Error('violates foreign key constraint');
      err.code = '23503';
      db.query.mockRejectedValueOnce(err);

      const res = await request(app)
        .delete('/api/departments/1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
    });
  });

  describe('Classes', () => {
    it('TC-SCM-003: Create Class', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ id: 1, name: 'CSE-F', department_id: 1 }] });

      const res = await request(app)
        .post('/api/classes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ departmentId: 1, name: 'CSE-F', section: 'F', semester: 5, academicYear: '2026-27' });

      expect(res.status).toBe(201);
    });

    it('TC-SCM-004: Duplicate Class Constraint', async () => {
      const err = new Error('duplicate key');
      err.code = '23505';
      db.query.mockRejectedValueOnce(err);

      const res = await request(app)
        .post('/api/classes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ departmentId: 1, name: 'CSE-F', section: 'F', semester: 5, academicYear: '2026-27' });

      expect(res.status).toBe(409);
    });

    it('TC-SCM-018: Delete Class with Students', async () => {
      const err = new Error('violates foreign key constraint');
      err.code = '23503';
      db.query.mockRejectedValueOnce(err);

      const res = await request(app)
        .delete('/api/classes/1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
    });
  });

  describe('Subjects', () => {
    it('TC-SCM-005: Create Subject', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ id: 1, name: 'Machine Learning', code: 'CS401' }] });

      const res = await request(app)
        .post('/api/subjects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ departmentId: 1, name: 'Machine Learning', code: 'CS401', credits: 4 });

      expect(res.status).toBe(201);
    });

    it('TC-SCM-006: Map Subject to Class', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ class_id: 1, subject_id: 1, faculty_id: 2 }] });

      const res = await request(app)
        .post('/api/class-subjects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ classId: 1, subjectId: 1, facultyId: 2 });

      expect(res.status).toBe(201);
    });

    it('TC-SCM-007: Duplicate Class-Subject Mapping', async () => {
      const err = new Error('duplicate');
      err.code = '23505';
      db.query.mockRejectedValueOnce(err);

      const res = await request(app)
        .post('/api/class-subjects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ classId: 1, subjectId: 1, facultyId: 2 });

      expect(res.status).toBe(409);
    });
  });

  describe('Students', () => {
    it('TC-SCM-008: Register Student - Valid', async () => {
      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce() // BEGIN
          .mockResolvedValueOnce({ rows: [{ id: 10, email: '252g5a0501@alits.edu.in' }] }) // User creation
          .mockResolvedValueOnce({ rows: [{ id: 5, user_id: 10, roll_no: '252G5A0501' }] }) // Student creation
          .mockResolvedValueOnce(), // COMMIT
        release: jest.fn(),
      };
      
      db.pool.connect.mockResolvedValueOnce(mockClient);

      const res = await request(app)
        .post('/api/students')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          fullName: 'New Student',
          email: '252g5a0501@alits.edu.in',
          rollNo: '252G5A0501',
          classId: 1,
          phone: '123'
        });

      expect(res.status).toBe(201);
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('TC-SCM-010: Missing Roll No', async () => {
      const res = await request(app)
        .post('/api/students')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          full_name: 'New Student',
          email: 'test@alits.edu.in',
          class_id: 1
        });

      // Based on typical validation, should be 400
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/roll/i);
    });
  });
});
