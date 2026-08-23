const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const dept = require('../controllers/departmentController');
const cls = require('../controllers/classController');
const sub = require('../controllers/subjectController');
const student = require('../controllers/studentController');
const timetable = require('../controllers/timetableController');
const attendance = require('../controllers/attendanceController');
const leave = require('../controllers/leaveController');
const notif = require('../controllers/notificationController');
const dashboard = require('../controllers/dashboardController');
const parent = require('../controllers/parentController');
const dispute = require('../controllers/disputeController');

// All routes require authentication
router.use(authenticate);

// Departments (Admin only)
router.get('/departments', dept.getAll);
router.post('/departments', authorize('admin'), dept.create);
router.put('/departments/:id', authorize('admin'), dept.update);
router.delete('/departments/:id', authorize('admin'), dept.delete);

// Classes
router.get('/classes', cls.getAll);
router.get('/classes/:id', cls.getById);
router.post('/classes', authorize('admin'), cls.create);
router.put('/classes/:id', authorize('admin'), cls.update);
router.delete('/classes/:id', authorize('admin'), cls.delete);
router.get('/classes/:id/students', authorize('admin', 'faculty'), cls.getStudents);
router.get('/classes/:id/subjects', cls.getSubjects);

// Subjects
router.get('/subjects', sub.getAll);
router.post('/subjects', authorize('admin'), sub.create);
router.put('/subjects/:id', authorize('admin'), sub.update);
router.delete('/subjects/:id', authorize('admin'), sub.delete);
router.post('/class-subjects', authorize('admin'), sub.mapToClass);
router.delete('/class-subjects/:classId/:subjectId', authorize('admin'), sub.unmapFromClass);
router.get('/class-subjects/:classId', sub.getMappedSubjects);

const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

// Students
router.post('/students', authorize('admin', 'faculty'), student.register);
router.post('/students/bulk-import', authorize('admin', 'faculty'), upload.single('file'), student.bulkImport);
router.get('/students/me', authorize('student'), student.getProfile);
router.get('/students/:id/attendance', student.getAttendance);
router.get('/students/:id/attendance/summary', student.getAttendanceSummary);
router.get('/users', authorize('admin'), student.getAllUsers);
router.post('/users', authorize('admin'), student.createUser);

// Timetables
router.get('/timetables', timetable.getAll);
router.get('/timetables/weekly/:classId', timetable.getWeekly);
router.post('/timetables', authorize('admin', 'faculty'), timetable.create);
router.delete('/timetables/:id', authorize('admin', 'faculty'), timetable.delete);

// Attendance
router.post('/attendance-sessions', authorize('faculty'), attendance.createSession);
router.get('/attendance-sessions', authorize('admin', 'faculty'), attendance.getSessions);
router.get('/attendance-sessions/:id', authorize('admin', 'faculty'), attendance.getSession);
router.post('/attendance-sessions/:id/records', authorize('faculty'), attendance.markAttendance);
router.put('/attendance-records/:id', authorize('faculty'), attendance.editRecord);

// Leave Requests
router.post('/leave-requests', authorize('student'), leave.apply);
router.get('/leave-requests/my', authorize('student'), leave.getMyLeaves);
router.get('/leave-requests/pending', authorize('faculty'), leave.getPending);
router.get('/leave-requests/zone-preview', authorize('student'), leave.zonePreview);
router.get('/leave-requests', authorize('admin', 'faculty'), leave.getAll);
router.put('/leave-requests/bulk-review', authorize('faculty'), leave.bulkReview);
router.put('/leave-requests/:id', authorize('faculty'), leave.review);

// Notifications
router.get('/notifications', notif.getAll);
router.put('/notifications/:id/read', notif.markRead);
router.put('/notifications/read-all', notif.markAllRead);

// Dashboard
router.get('/dashboard/classes/:id/summary', authorize('admin', 'faculty'), dashboard.getSummary);
router.get('/dashboard/classes/:id/trends', authorize('admin', 'faculty'), dashboard.getTrends);
router.get('/dashboard/classes/:id/zones', authorize('admin', 'faculty'), dashboard.getZones);
router.get('/dashboard/classes/:id/heatmap', authorize('admin', 'faculty'), dashboard.getHeatmap);
router.get('/dashboard/classes/:id/students', authorize('admin', 'faculty'), dashboard.getStudentStats);
router.get('/dashboard/classes/:id/matrix', authorize('admin', 'faculty'), dashboard.getMatrix);
router.get('/dashboard/classes/:id/export-matrix', authorize('admin', 'faculty'), dashboard.exportMatrix);
router.get('/dashboard/predictions/:studentId', authorize('student', 'parent', 'faculty'), dashboard.getPredictions);
router.get('/dashboard/alerts', authorize('admin', 'faculty'), dashboard.getAlerts);

// Parents
router.get('/parents/ward-summary', authorize('parent'), parent.getWardSummary);

// Disputes & Justifications
router.post('/attendance-records/:id/disputes', authorize('student'), dispute.createDispute);
router.get('/attendance-disputes/pending', authorize('faculty'), dispute.getPending);
router.put('/attendance-disputes/:id/resolve', authorize('faculty'), dispute.resolveDispute);

module.exports = router;
