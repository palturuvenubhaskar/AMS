-- ============================================================
-- AMS (Academic Attendance Management System) - Complete Supabase Setup
-- Run this entire script in Supabase SQL Editor in 1 click.
-- Default password for all users: Ams@2026
-- ============================================================

-- ============================================================
-- AAMS-FRS: Academic Attendance Management System with FRS
-- PostgreSQL 15+ Schema Script
-- Generated: August 2026
-- ============================================================

-- Clean slate
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS attendance_disputes CASCADE;
DROP TABLE IF EXISTS student_parents CASCADE;
DROP TABLE IF EXISTS attendance_records CASCADE;
DROP TABLE IF EXISTS attendance_sessions CASCADE;
DROP TABLE IF EXISTS leave_requests CASCADE;
DROP TABLE IF EXISTS timetables CASCADE;
DROP TABLE IF EXISTS student_faces CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS class_subjects CASCADE;
DROP TABLE IF EXISTS subjects CASCADE;
DROP TABLE IF EXISTS classes CASCADE;
DROP TABLE IF EXISTS departments CASCADE;
DROP TABLE IF EXISTS refresh_tokens CASCADE;
DROP TABLE IF EXISTS token_blacklist CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================================
-- 1. USERS (Base entity for Admin, Faculty, Student)
-- ============================================================
CREATE TABLE users (
    id              SERIAL PRIMARY KEY,
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    full_name       VARCHAR(100) NOT NULL,
    role            VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'faculty', 'student', 'parent')),
    phone           VARCHAR(20),
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- ============================================================
-- 2. DEPARTMENTS
-- ============================================================
CREATE TABLE departments (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    code        VARCHAR(20) NOT NULL UNIQUE,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 3. CLASSES (Class sections: e.g., CSE-A, 3rd Year)
-- ============================================================
CREATE TABLE classes (
    id              SERIAL PRIMARY KEY,
    department_id   INTEGER NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
    name            VARCHAR(50) NOT NULL,
    section         VARCHAR(20) NOT NULL,
    semester        INTEGER NOT NULL CHECK (semester BETWEEN 1 AND 10),
    academic_year   VARCHAR(20) NOT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(name, section, semester, academic_year)
);

CREATE INDEX idx_classes_dept ON classes(department_id);

-- ============================================================
-- 4. SUBJECTS
-- ============================================================
CREATE TABLE subjects (
    id              SERIAL PRIMARY KEY,
    department_id   INTEGER NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
    name            VARCHAR(100) NOT NULL,
    code            VARCHAR(20) NOT NULL,
    credits         INTEGER DEFAULT 3,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(code, department_id)
);

-- ============================================================
-- 5. CLASS_SUBJECTS (Junction: which subjects belong to which class)
-- ============================================================
CREATE TABLE class_subjects (
    id          SERIAL PRIMARY KEY,
    class_id    INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    subject_id  INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    faculty_id  INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(class_id, subject_id)
);

CREATE INDEX idx_class_subjects_faculty ON class_subjects(faculty_id);

-- ============================================================
-- 6. STUDENTS (Extended profile for student role)
-- ============================================================
CREATE TABLE students (
    user_id         INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    class_id        INTEGER NOT NULL REFERENCES classes(id) ON DELETE RESTRICT,
    roll_no         VARCHAR(30) NOT NULL,
    enrollment_no   VARCHAR(50),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(roll_no, class_id)
);

CREATE INDEX idx_students_class ON students(class_id);

-- ============================================================
-- 7. STUDENT_FACES (FRS enrollment data)
-- ============================================================
CREATE TABLE student_faces (
    id              SERIAL PRIMARY KEY,
    student_id      INTEGER NOT NULL REFERENCES students(user_id) ON DELETE CASCADE,
    image_path      VARCHAR(500) NOT NULL,
    embedding       BYTEA NOT NULL,
    angle_type      VARCHAR(20) DEFAULT 'front',
    is_primary      BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_faces_student ON student_faces(student_id);

-- ============================================================
-- 8. TIMETABLES
-- ============================================================
CREATE TABLE timetables (
    id              SERIAL PRIMARY KEY,
    class_id        INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    subject_id      INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    faculty_id      INTEGER REFERENCES users(id) ON DELETE SET NULL,
    day_of_week     INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time      TIME NOT NULL,
    end_time        TIME NOT NULL,
    room            VARCHAR(50),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_time CHECK (end_time > start_time)
);

CREATE INDEX idx_timetable_class ON timetables(class_id);
CREATE INDEX idx_timetable_day ON timetables(day_of_week);
CREATE INDEX idx_timetable_faculty ON timetables(faculty_id);

-- ============================================================
-- 9. ATTENDANCE_SESSIONS (Header for each attendance event)
-- ============================================================
CREATE TABLE attendance_sessions (
    id              SERIAL PRIMARY KEY,
    class_id        INTEGER NOT NULL REFERENCES classes(id) ON DELETE RESTRICT,
    subject_id      INTEGER NOT NULL REFERENCES subjects(id) ON DELETE RESTRICT,
    faculty_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    date            DATE NOT NULL,
    time_slot       VARCHAR(50) NOT NULL,
    mode            VARCHAR(10) NOT NULL CHECK (mode IN ('manual', 'frs')),
    status          VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'closed', 'cancelled')),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(class_id, subject_id, date, time_slot)
);

CREATE INDEX idx_sessions_class ON attendance_sessions(class_id);
CREATE INDEX idx_sessions_date ON attendance_sessions(date);
CREATE INDEX idx_sessions_faculty ON attendance_sessions(faculty_id);

-- ============================================================
-- 10. ATTENDANCE_RECORDS (Individual student entries)
-- ============================================================
CREATE TABLE attendance_records (
    id              SERIAL PRIMARY KEY,
    session_id      INTEGER NOT NULL REFERENCES attendance_sessions(id) ON DELETE CASCADE,
    student_id      INTEGER NOT NULL REFERENCES students(user_id) ON DELETE RESTRICT,
    status          VARCHAR(20) NOT NULL CHECK (status IN ('present', 'absent', 'on_leave')),
    frs_confidence  DECIMAL(5,4),
    marked_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(session_id, student_id)
);

CREATE INDEX idx_records_session ON attendance_records(session_id);
CREATE INDEX idx_records_student ON attendance_records(student_id);

-- ============================================================
-- 11. LEAVE_REQUESTS (Threshold-based governance)
-- ============================================================
CREATE TABLE leave_requests (
    id                      SERIAL PRIMARY KEY,
    student_id              INTEGER NOT NULL REFERENCES students(user_id) ON DELETE CASCADE,
    class_id                INTEGER NOT NULL REFERENCES classes(id) ON DELETE RESTRICT,
    faculty_id              INTEGER REFERENCES users(id) ON DELETE SET NULL,
    from_date               DATE NOT NULL,
    to_date                 DATE NOT NULL,
    reason                  VARCHAR(50) NOT NULL,
    description             TEXT,
    proof_url               VARCHAR(500),
    attendance_pct_snapshot DECIMAL(5,2) NOT NULL,
    zone                    VARCHAR(10) NOT NULL CHECK (zone IN ('green', 'yellow', 'red')),
    status                  VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    decision_by             VARCHAR(20) CHECK (decision_by IN ('system', 'faculty')),
    remarks                 TEXT,
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at             TIMESTAMP,
    CONSTRAINT valid_dates CHECK (to_date >= from_date)
);

CREATE INDEX idx_leave_student ON leave_requests(student_id);
CREATE INDEX idx_leave_class ON leave_requests(class_id);
CREATE INDEX idx_leave_status ON leave_requests(status);
CREATE INDEX idx_leave_zone ON leave_requests(zone);

-- ============================================================
-- 12. NOTIFICATIONS
-- ============================================================
CREATE TABLE notifications (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type        VARCHAR(30) NOT NULL,
    title       VARCHAR(200) NOT NULL,
    message     TEXT NOT NULL,
    is_read     BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notif_user ON notifications(user_id);
CREATE INDEX idx_notif_unread ON notifications(user_id, is_read);

-- ============================================================
-- 13. AUDIT_LOGS
-- ============================================================
CREATE TABLE audit_logs (
    id              SERIAL PRIMARY KEY,
    table_name      VARCHAR(50) NOT NULL,
    record_id       INTEGER NOT NULL,
    action          VARCHAR(20) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    old_data        JSONB,
    new_data        JSONB,
    performed_by    INTEGER REFERENCES users(id) ON DELETE SET NULL,
    performed_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_table ON audit_logs(table_name, record_id);
CREATE INDEX idx_audit_performed ON audit_logs(performed_at);

-- ============================================================
-- 13.5. HOLIDAYS
-- ============================================================
CREATE TABLE holidays (
    id          SERIAL PRIMARY KEY,
    date        DATE NOT NULL UNIQUE,
    name        VARCHAR(100) NOT NULL,
    type        VARCHAR(20) DEFAULT 'public',
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_holidays_date ON holidays(date);

-- ============================================================
-- 14. REFRESH_TOKENS
-- ============================================================
CREATE TABLE refresh_tokens (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token           TEXT NOT NULL UNIQUE,
    expires_at      TIMESTAMP NOT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);

-- ============================================================
-- 15. TOKEN_BLACKLIST
-- ============================================================
CREATE TABLE token_blacklist (
    id              SERIAL PRIMARY KEY,
    token           TEXT NOT NULL UNIQUE,
    blacklisted_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at      TIMESTAMP
);

CREATE INDEX idx_token_blacklist_token ON token_blacklist(token);

-- ============================================================
-- 16. ATTENDANCE_DISPUTES
-- ============================================================
CREATE TABLE attendance_disputes (
    id SERIAL PRIMARY KEY,
    record_id INTEGER NOT NULL REFERENCES attendance_records(id) ON DELETE CASCADE,
    student_id INTEGER NOT NULL REFERENCES students(user_id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('justification', 'dispute')),
    reason TEXT NOT NULL,
    proof_url VARCHAR(500),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    faculty_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP
);

CREATE INDEX idx_disputes_record ON attendance_disputes(record_id);
CREATE INDEX idx_disputes_student ON attendance_disputes(student_id);
CREATE INDEX idx_disputes_status ON attendance_disputes(status);

-- ============================================================
-- 17. STUDENT_PARENTS
-- ============================================================
CREATE TABLE student_parents (
    parent_id INTEGER REFERENCES users(id) ON DELETE CASCADE, 
    student_id INTEGER REFERENCES users(id) ON DELETE CASCADE, 
    relation VARCHAR(50), 
    PRIMARY KEY (parent_id, student_id)
);

-- ============================================================
-- VIEWS
-- ============================================================

-- View: Student Attendance Summary per Class (with Zone)
CREATE OR REPLACE VIEW v_student_attendance_summary AS
SELECT 
    s.user_id AS student_id,
    s.class_id,
    c.name AS class_name,
    u.full_name AS student_name,
    s.roll_no,
    COUNT(ar.id) FILTER (WHERE ar.status = 'present') AS total_present,
    COUNT(ar.id) FILTER (WHERE ar.status = 'absent') AS total_absent,
    COUNT(ar.id) FILTER (WHERE ar.status = 'on_leave') AS total_on_leave,
    COUNT(ar.id) AS total_sessions,
    CASE 
        WHEN COUNT(ar.id) = 0 THEN 0
        ELSE ROUND((COUNT(ar.id) FILTER (WHERE ar.status = 'present') * 100.0 / COUNT(ar.id)), 2)
    END AS attendance_pct,
    CASE 
        WHEN COUNT(ar.id) = 0 THEN 'green'
        WHEN (COUNT(ar.id) FILTER (WHERE ar.status = 'present') * 100.0 / COUNT(ar.id)) > 75 THEN 'green'
        WHEN (COUNT(ar.id) FILTER (WHERE ar.status = 'present') * 100.0 / COUNT(ar.id)) >= 60 THEN 'yellow'
        ELSE 'red'
    END AS zone
FROM students s
JOIN users u ON s.user_id = u.id
JOIN classes c ON s.class_id = c.id
LEFT JOIN attendance_records ar ON s.user_id = ar.student_id
LEFT JOIN attendance_sessions sess ON ar.session_id = sess.id
LEFT JOIN holidays h ON sess.date = h.date
WHERE h.id IS NULL
GROUP BY s.user_id, s.class_id, c.name, u.full_name, s.roll_no;

-- View: Class Daily Attendance Trend
CREATE OR REPLACE VIEW v_class_daily_attendance AS
SELECT 
    sess.class_id,
    sess.subject_id,
    sub.name AS subject_name,
    sess.date,
    COUNT(ar.id) FILTER (WHERE ar.status = 'present') AS present_count,
    COUNT(ar.id) FILTER (WHERE ar.status = 'absent') AS absent_count,
    COUNT(ar.id) AS total_students,
    ROUND((COUNT(ar.id) FILTER (WHERE ar.status = 'present') * 100.0 / NULLIF(COUNT(ar.id), 0)), 2) AS attendance_rate
FROM attendance_sessions sess
JOIN subjects sub ON sess.subject_id = sub.id
LEFT JOIN attendance_records ar ON sess.id = ar.session_id
GROUP BY sess.class_id, sess.subject_id, sub.name, sess.date;

-- View: Faculty Attendance Activity Log
CREATE OR REPLACE VIEW v_faculty_attendance_activity AS
SELECT 
    sess.id AS session_id,
    sess.class_id,
    c.name AS class_name,
    sess.subject_id,
    sub.name AS subject_name,
    sess.faculty_id,
    u.full_name AS faculty_name,
    sess.date,
    sess.time_slot,
    sess.mode,
    sess.created_at,
    COUNT(ar.id) FILTER (WHERE ar.status = 'present') AS present_count,
    COUNT(ar.id) FILTER (WHERE ar.status = 'absent') AS absent_count
FROM attendance_sessions sess
JOIN classes c ON sess.class_id = c.id
JOIN subjects sub ON sess.subject_id = sub.id
JOIN users u ON sess.faculty_id = u.id
LEFT JOIN attendance_records ar ON sess.id = ar.session_id
GROUP BY sess.id, c.name, sub.name, u.full_name, sess.class_id, sess.subject_id, 
         sess.faculty_id, sess.date, sess.time_slot, sess.mode, sess.created_at;

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-update updated_at on users
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-process leave request zone & decision
CREATE OR REPLACE FUNCTION process_leave_request()
RETURNS TRIGGER AS $$
DECLARE
    v_attendance_pct DECIMAL(5,2);
BEGIN
    SELECT attendance_pct INTO v_attendance_pct
    FROM v_student_attendance_summary
    WHERE student_id = NEW.student_id AND class_id = NEW.class_id;

    IF v_attendance_pct IS NULL THEN
        v_attendance_pct := 100.0;
    END IF;

    NEW.attendance_pct_snapshot := v_attendance_pct;

    IF v_attendance_pct > 75 THEN
        NEW.zone := 'green';
        NEW.status := 'approved';
        NEW.decision_by := 'system';
        NEW.resolved_at := CURRENT_TIMESTAMP;
    ELSIF v_attendance_pct >= 60 THEN
        NEW.zone := 'yellow';
        NEW.status := 'pending';
        NEW.decision_by := NULL;
    ELSE
        NEW.zone := 'red';
        NEW.status := 'rejected';
        NEW.decision_by := 'system';
        NEW.remarks := 'Auto-rejected: Attendance below 60%';
        NEW.resolved_at := CURRENT_TIMESTAMP;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_process_leave_request
    BEFORE INSERT ON leave_requests
    FOR EACH ROW
    EXECUTE FUNCTION process_leave_request();

-- Audit log trigger for attendance_records
CREATE OR REPLACE FUNCTION audit_attendance_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_logs (table_name, record_id, action, new_data, performed_by, performed_at)
        VALUES ('attendance_records', NEW.id, 'INSERT', row_to_json(NEW), 
                (SELECT faculty_id FROM attendance_sessions WHERE id = NEW.session_id), CURRENT_TIMESTAMP);
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_logs (table_name, record_id, action, old_data, new_data, performed_by, performed_at)
        VALUES ('attendance_records', NEW.id, 'UPDATE', row_to_json(OLD), row_to_json(NEW),
                (SELECT faculty_id FROM attendance_sessions WHERE id = NEW.session_id), CURRENT_TIMESTAMP);
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_audit_attendance
    AFTER INSERT OR UPDATE ON attendance_records
    FOR EACH ROW EXECUTE FUNCTION audit_attendance_changes();

-- ============================================================
-- END OF SCHEMA
-- ============================================================



-- ============================================================
-- AMS: Data Seeding Script
-- CSE F Class - Anantha Lakshmi Institute of Technology & Sciences
-- Default password for all users: Ams@2026
-- bcrypt hash: $2a$10$ejYcGkp3zworvSLLQibxUuwu5VqJE4qAYkLwXeU4Kel5XOGOxDxOq
-- ============================================================

-- ============================================================
-- 0. SCHEMA COMPATIBILITY CHECK
-- ============================================================
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'class_subjects') THEN
        ALTER TABLE class_subjects ADD COLUMN IF NOT EXISTS faculty_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
        CREATE INDEX IF NOT EXISTS idx_class_subjects_faculty ON class_subjects(faculty_id);
    END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'timetables') THEN
        ALTER TABLE timetables ADD COLUMN IF NOT EXISTS faculty_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
        CREATE INDEX IF NOT EXISTS idx_timetable_faculty ON timetables(faculty_id);
    END IF;
END $$;

-- ============================================================
-- 1. DEPARTMENT
-- ============================================================
INSERT INTO departments (name, code) VALUES
('Computer Science and Engineering', 'CSE')
ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- 2. ADMIN USER
-- ============================================================
INSERT INTO users (email, password_hash, full_name, role, phone) VALUES
('admin@ams.edu', '$2a$10$ejYcGkp3zworvSLLQibxUuwu5VqJE4qAYkLwXeU4Kel5XOGOxDxOq', 'System Administrator', 'admin', '9999999999')
ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, full_name = EXCLUDED.full_name;

-- ============================================================
-- 3. FACULTY (7 Teachers for CSE F + Demo Faculty)
-- ============================================================
INSERT INTO users (email, password_hash, full_name, role, phone) VALUES
('sruthi@alits.edu.in', '$2a$10$ejYcGkp3zworvSLLQibxUuwu5VqJE4qAYkLwXeU4Kel5XOGOxDxOq', 'Ms. R. Sruthi', 'faculty', '9390976647'),
('siva.ranganath@alits.edu.in', '$2a$10$ejYcGkp3zworvSLLQibxUuwu5VqJE4qAYkLwXeU4Kel5XOGOxDxOq', 'Mr. K. Siva Ranganath', 'faculty', '9959657428'),
('manjula@alits.edu.in', '$2a$10$ejYcGkp3zworvSLLQibxUuwu5VqJE4qAYkLwXeU4Kel5XOGOxDxOq', 'Ms. A. Manjula', 'faculty', '6301735752'),
('manohar@alits.edu.in', '$2a$10$ejYcGkp3zworvSLLQibxUuwu5VqJE4qAYkLwXeU4Kel5XOGOxDxOq', 'Mr. T. Manohar', 'faculty', '8919000890'),
('sunil@alits.edu.in', '$2a$10$ejYcGkp3zworvSLLQibxUuwu5VqJE4qAYkLwXeU4Kel5XOGOxDxOq', 'Ms. B. Sunil', 'faculty', '7075103887'),
('venugopal@alits.edu.in', '$2a$10$ejYcGkp3zworvSLLQibxUuwu5VqJE4qAYkLwXeU4Kel5XOGOxDxOq', 'Mr. Venu Gopal', 'faculty', '7989029473'),
('sreekanth@alits.edu.in', '$2a$10$ejYcGkp3zworvSLLQibxUuwu5VqJE4qAYkLwXeU4Kel5XOGOxDxOq', 'Mr. B. Sreekanth', 'faculty', '7075111037'),
('faculty1@ams.edu', '$2a$10$ejYcGkp3zworvSLLQibxUuwu5VqJE4qAYkLwXeU4Kel5XOGOxDxOq', 'Demo Faculty', 'faculty', '9876543210')
ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, full_name = EXCLUDED.full_name, phone = EXCLUDED.phone;

-- ============================================================
-- 4. CLASS (CSE F, Semester 5, 2026-27)
-- ============================================================
INSERT INTO classes (department_id, name, section, semester, academic_year)
SELECT id, 'CSE', 'F', 5, '2026-27'
FROM departments WHERE code = 'CSE'
ON CONFLICT (name, section, semester, academic_year) DO NOTHING;

-- ============================================================
-- 5. SUBJECTS (8 subjects for CSE F)
-- ============================================================
INSERT INTO subjects (department_id, name, code, credits)
SELECT d.id, s.name, s.code, s.credits
FROM departments d,
(VALUES
    ('Artificial Intelligence', '24ALBTCS301T', 4),
    ('Computer Networks & Internet Protocols', '24ALBTCS501T', 4),
    ('Automata Theory & Compiler Design', '24ALBTCS502T', 4),
    ('Intro to Quantum Tech & Applications', '24ALBTCS503T', 3),
    ('Object Oriented Analysis & Design', '24ALBTCS504Ta', 4),
    ('Green Building', '24ALBTCS508T', 3),
    ('Artificial Intelligence Lab', '24ALBTAM301P', 2),
    ('Computer Networks & Internet Protocols Lab', '24ALBTCS501P', 2)
) AS s(name, code, credits)
WHERE d.code = 'CSE'
ON CONFLICT (code, department_id) DO UPDATE SET name = EXCLUDED.name, credits = EXCLUDED.credits;

-- ============================================================
-- 6. CLASS-SUBJECT MAPPING (Linked to designated faculty)
-- ============================================================
INSERT INTO class_subjects (class_id, subject_id, faculty_id)
SELECT c.id, sub.id, u.id
FROM classes c
JOIN departments d ON c.department_id = d.id
CROSS JOIN (VALUES
    ('24ALBTCS301T', 'sruthi@alits.edu.in'),
    ('24ALBTCS501T', 'siva.ranganath@alits.edu.in'),
    ('24ALBTCS502T', 'manjula@alits.edu.in'),
    ('24ALBTCS503T', 'manohar@alits.edu.in'),
    ('24ALBTCS504Ta', 'sunil@alits.edu.in'),
    ('24ALBTCS508T', 'venugopal@alits.edu.in'),
    ('24ALBTAM301P', 'sruthi@alits.edu.in'),
    ('24ALBTCS501P', 'sreekanth@alits.edu.in')
) AS m(subject_code, faculty_email)
JOIN subjects sub ON sub.code = m.subject_code AND sub.department_id = d.id
LEFT JOIN users u ON u.email = m.faculty_email
WHERE d.code = 'CSE'
  AND c.section = 'F'
  AND c.semester = 5
  AND c.academic_year = '2026-27'
ON CONFLICT (class_id, subject_id) DO UPDATE SET faculty_id = EXCLUDED.faculty_id;

-- ============================================================
-- 7. STUDENTS (62 Students - CSE F)
-- ============================================================

-- 7.1 Insert Student User Accounts
INSERT INTO users (email, password_hash, full_name, role)
VALUES
    ('242G1A05X2@alits.edu.in', '$2a$10$ejYcGkp3zworvSLLQibxUuwu5VqJE4qAYkLwXeU4Kel5XOGOxDxOq', 'MOHAMMED RAYAN', 'student'),
    ('242G1A05X3@alits.edu.in', '$2a$10$ejYcGkp3zworvSLLQibxUuwu5VqJE4qAYkLwXeU4Kel5XOGOxDxOq', 'MOOD SAI JYOSHNA BAI', 'student'),
    ('242G1A05X4@alits.edu.in', '$2a$10$ejYcGkp3zworvSLLQibxUuwu5VqJE4qAYkLwXeU4Kel5XOGOxDxOq', 'N POOJITHA', 'student'),
    ('242G1A05X6@alits.edu.in', '$2a$10$ejYcGkp3zworvSLLQibxUuwu5VqJE4qAYkLwXeU4Kel5XOGOxDxOq', 'PATAKAMURI TEJA', 'student'),
    ('242G1A05X7@alits.edu.in', '$2a$10$ejYcGkp3zworvSLLQibxUuwu5VqJE4qAYkLwXeU4Kel5XOGOxDxOq', 'PULA VISWANATH', 'student'),
    ('242G1A05X9@alits.edu.in', '$2a$10$ejYcGkp3zworvSLLQibxUuwu5VqJE4qAYkLwXeU4Kel5XOGOxDxOq', 'REDDYGARI YAMINI', 'student'),
    ('242G1A05Y0@alits.edu.in', '$2a$10$ejYcGkp3zworvSLLQibxUuwu5VqJE4qAYkLwXeU4Kel5XOGOxDxOq', 'REKKAPOGULA NAVYA SREE', 'student'),
    ('242G1A05Y1@alits.edu.in', '$2a$10$ejYcGkp3zworvSLLQibxUuwu5VqJE4qAYkLwXeU4Kel5XOGOxDxOq', 'S TEJASWINI', 'student'),
    ('242G1A05Y2@alits.edu.in', '$2a$10$ejYcGkp3zworvSLLQibxUuwu5VqJE4qAYkLwXeU4Kel5XOGOxDxOq', 'SAKE ABHISHEK', 'student'),
    ('242G1A05Y3@alits.edu.in', '$2a$10$ejYcGkp3zworvSLLQibxUuwu5VqJE4qAYkLwXeU4Kel5XOGOxDxOq', 'SAKE ASWITHA', 'student'),
    ('242G1A05Y4@alits.edu.in', '$2a$10$ejYcGkp3zworvSLLQibxUuwu5VqJE4qAYkLwXeU4Kel5XOGOxDxOq', 'SAKE DEEPIKA', 'student'),
    ('242G1A05Y5@alits.edu.in', '$2a$10$ejYcGkp3zworvSLLQibxUuwu5VqJE4qAYkLwXeU4Kel5XOGOxDxOq', 'SAKE PRABHAS', 'student'),
    ('242G1A05Y6@alits.edu.in', '$2a$10$ejYcGkp3zworvSLLQibxUuwu5VqJE4qAYkLwXeU4Kel5XOGOxDxOq', 'SHAIK SANIYA', 'student'),
    ('242G1A05Y7@alits.edu.in', '$2a$10$ejYcGkp3zworvSLLQibxUuwu5VqJE4qAYkLwXeU4Kel5XOGOxDxOq', 'SHAIK SHAHID AFRID', 'student'),
    ('242G1A05Y8@alits.edu.in', '$2a$10$ejYcGkp3zworvSLLQibxUuwu5VqJE4qAYkLwXeU4Kel5XOGOxDxOq', 'SODINAPALLI AISWARYA', 'student'),
    ('242G1A05Y9@alits.edu.in', '$2a$10$ejYcGkp3zworvSLLQibxUuwu5VqJE4qAYkLwXeU4Kel5XOGOxDxOq', 'SURAM LAVANYA', 'student'),
    ('242G1A05Z0@alits.edu.in', '$2a$10$ejYcGkp3zworvSLLQibxUuwu5VqJE4qAYkLwXeU4Kel5XOGOxDxOq', 'T SHILPA', 'student'),
    ('242G1A05Z1@alits.edu.in', '$2a$10$ejYcGkp3zworvSLLQibxUuwu5VqJE4qAYkLwXeU4Kel5XOGOxDxOq', 'UPPARA THIPPESWAMY', 'student'),
    ('242G1A05Z2@alits.edu.in', '$2a$10$ejYcGkp3zworvSLLQibxUuwu5VqJE4qAYkLwXeU4Kel5XOGOxDxOq', 'UPPARA VEENA', 'student'),
    ('242G1A05Z3@alits.edu.in', '$2a$10$ejYcGkp3zworvSLLQibxUuwu5VqJE4qAYkLwXeU4Kel5XOGOxDxOq', 'VADITHE SUJATHA BAI', 'student'),
    ('242G1A05Z4@alits.edu.in', '$2a$10$ejYcGkp3zworvSLLQibxUuwu5VqJE4qAYkLwXeU4Kel5XOGOxDxOq', 'VADLA ANNAMANI', 'student'),
    ('242G1A05Z5@alits.edu.in', '$2a$10$ejYcGkp3zworvSLLQibxUuwu5VqJE4qAYkLwXeU4Kel5XOGOxDxOq', 'VEMURI LALITHA', 'student'),
    ('242G1A05Z6@alits.edu.in', '$2a$10$ejYcGkp3zworvSLLQibxUuwu5VqJE4qAYkLwXeU4Kel5XOGOxDxOq', 'YARASI SRI VARSHINI', 'student'),
    ('242G1A05Z7@alits.edu.in', '$2a$10$ejYcGkp3zworvSLLQibxUuwu5VqJE4qAYkLwXeU4Kel5XOGOxDxOq', 'YEDUMALLA OBULA SAGAR', 'student'),
    ('242G1A05Z8@alits.edu.in', '$2a$10$ejYcGkp3zworvSLLQibxUuwu5VqJE4qAYkLwXeU4Kel5XOGOxDxOq', 'THOTA THERISSA SHALOM', 'student'),
    ('242G1A05Z9@alits.edu.in', '$2a$10$ejYcGkp3zworvSLLQibxUuwu5VqJE4qAYkLwXeU4Kel5XOGOxDxOq', 'JUMPULA LOKESH', 'student'),
    ('252G5A0501@alits.edu.in', '$2a$10$ejYcGkp3zworvSLLQibxUuwu5VqJE4qAYkLwXeU4Kel5XOGOxDxOq', 'BESTHA SAI VIKAS', 'student'),
    ('252G5A0502@alits.edu.in', '$2a$10$ejYcGkp3zworvSLLQibxUuwu5VqJE4qAYkLwXeU4Kel5XOGOxDxOq', 'CHAKALI NARENDRA', 'student'),
    ('252G5A0503@alits.edu.in', '$2a$10$ejYcGkp3zworvSLLQibxUuwu5VqJE4qAYkLwXeU4Kel5XOGOxDxOq', 'CHAKALI PAVAN SAI', 'student'),
    ('252G5A0504@alits.edu.in', '$2a$10$ejYcGkp3zworvSLLQibxUuwu5VqJE4qAYkLwXeU4Kel5XOGOxDxOq', 'CHINNAMPALLI RANJITH KUMAR', 'student'),
    ('252G5A0505@alits.edu.in', '$2a$10$ejYcGkp3zworvSLLQibxUuwu5VqJE4qAYkLwXeU4Kel5XOGOxDxOq', 'CHINTHALAPALLI INDU', 'student'),
    ('252G5A0506@alits.edu.in', '$2a$10$ejYcGkp3zworvSLLQibxUuwu5VqJE4qAYkLwXeU4Kel5XOGOxDxOq', 'D THARUN KUMAR', 'student'),
    ('252G5A0507@alits.edu.in', '$2a$10$ejYcGkp3zworvSLLQibxUuwu5VqJE4qAYkLwXeU4Kel5XOGOxDxOq', 'GARIKA POOJA', 'student'),
    ('252G5A0508@alits.edu.in', '$2a$10$ejYcGkp3zworvSLLQibxUuwu5VqJE4qAYkLwXeU4Kel5XOGOxDxOq', 'GOLLA MOHAN KUMAR', 'student'),
    ('252G5A0509@alits.edu.in', '$2a$10$ejYcGkp3zworvSLLQibxUuwu5VqJE4qAYkLwXeU4Kel5XOGOxDxOq', 'GUDDITI JAYAKRISHNA', 'student'),
    ('252G5A0510@alits.edu.in', '$2a$10$ejYcGkp3zworvSLLQibxUuwu5VqJE4qAYkLwXeU4Kel5XOGOxDxOq', 'GUJJALA PALLAVI', 'student'),
    ('252G5A0511@alits.edu.in', '$2a$10$ejYcGkp3zworvSLLQibxUuwu5VqJE4qAYkLwXeU4Kel5XOGOxDxOq', 'GUVVALA RAKESH', 'student'),
    ('252G5A0512@alits.edu.in', '$2a$10$ejYcGkp3zworvSLLQibxUuwu5VqJE4qAYkLwXeU4Kel5XOGOxDxOq', 'JAMMULA VISHNU VARDHAN', 'student'),
    ('252G5A0513@alits.edu.in', '$2a$10$ejYcGkp3zworvSLLQibxUuwu5VqJE4qAYkLwXeU4Kel5XOGOxDxOq', 'K VISHNU', 'student'),
    ('252G5A0514@alits.edu.in', '$2a$10$ejYcGkp3zworvSLLQibxUuwu5VqJE4qAYkLwXeU4Kel5XOGOxDxOq', 'KAMBALAPADU EDIGA KASIVISWANATH GOUD', 'student'),
    ('252G5A0515@alits.edu.in', '$2a$10$ejYcGkp3zworvSLLQibxUuwu5VqJE4qAYkLwXeU4Kel5XOGOxDxOq', 'KANNELURI YAGNA CHARAN', 'student'),
    ('252G5A0516@alits.edu.in', '$2a$10$ejYcGkp3zworvSLLQibxUuwu5VqJE4qAYkLwXeU4Kel5XOGOxDxOq', 'MOPURI SETTY SAI KUMAR', 'student'),
    ('252G5A0517@alits.edu.in', '$2a$10$ejYcGkp3zworvSLLQibxUuwu5VqJE4qAYkLwXeU4Kel5XOGOxDxOq', 'MUDDIREDDY JASWANTH REDDY', 'student'),
    ('252G5A0518@alits.edu.in', '$2a$10$ejYcGkp3zworvSLLQibxUuwu5VqJE4qAYkLwXeU4Kel5XOGOxDxOq', 'NAGELI TARAKARAM', 'student'),
    ('252G5A0519@alits.edu.in', '$2a$10$ejYcGkp3zworvSLLQibxUuwu5VqJE4qAYkLwXeU4Kel5XOGOxDxOq', 'NIDIGANTI SAI SREE', 'student'),
    ('252G5A0520@alits.edu.in', '$2a$10$ejYcGkp3zworvSLLQibxUuwu5VqJE4qAYkLwXeU4Kel5XOGOxDxOq', 'PALTURU VENUBHASKAR', 'student'),
    ('252G5A0521@alits.edu.in', '$2a$10$ejYcGkp3zworvSLLQibxUuwu5VqJE4qAYkLwXeU4Kel5XOGOxDxOq', 'PATHAKAMURI GOWTHAMI', 'student'),
    ('252G5A0522@alits.edu.in', '$2a$10$ejYcGkp3zworvSLLQibxUuwu5VqJE4qAYkLwXeU4Kel5XOGOxDxOq', 'PEDARASI SAHITH KUMAR', 'student'),
    ('252G5A0523@alits.edu.in', '$2a$10$ejYcGkp3zworvSLLQibxUuwu5VqJE4qAYkLwXeU4Kel5XOGOxDxOq', 'PENIKALAPATI KIRANMAI', 'student'),
    ('252G5A0524@alits.edu.in', '$2a$10$ejYcGkp3zworvSLLQibxUuwu5VqJE4qAYkLwXeU4Kel5XOGOxDxOq', 'SHAIK PAPA SAHEB MOHAMMED ADIL HUSSAIN', 'student'),
    ('252G5A0525@alits.edu.in', '$2a$10$ejYcGkp3zworvSLLQibxUuwu5VqJE4qAYkLwXeU4Kel5XOGOxDxOq', 'SHAIK VALI', 'student'),
    ('252G5A0526@alits.edu.in', '$2a$10$ejYcGkp3zworvSLLQibxUuwu5VqJE4qAYkLwXeU4Kel5XOGOxDxOq', 'SYED MOHAMMED INAMUL HASAN', 'student'),
    ('252G5A0527@alits.edu.in', '$2a$10$ejYcGkp3zworvSLLQibxUuwu5VqJE4qAYkLwXeU4Kel5XOGOxDxOq', 'TADIPATHRI LATHIF', 'student'),
    ('252G5A0528@alits.edu.in', '$2a$10$ejYcGkp3zworvSLLQibxUuwu5VqJE4qAYkLwXeU4Kel5XOGOxDxOq', 'TALARI VASANTH', 'student'),
    ('252G5A0529@alits.edu.in', '$2a$10$ejYcGkp3zworvSLLQibxUuwu5VqJE4qAYkLwXeU4Kel5XOGOxDxOq', 'UDUMULA KUSHAL', 'student'),
    ('252G5A0530@alits.edu.in', '$2a$10$ejYcGkp3zworvSLLQibxUuwu5VqJE4qAYkLwXeU4Kel5XOGOxDxOq', 'UPPARA SUNNY SAGAR', 'student'),
    ('252G5A0532@alits.edu.in', '$2a$10$ejYcGkp3zworvSLLQibxUuwu5VqJE4qAYkLwXeU4Kel5XOGOxDxOq', 'VARIMADUGU ADARSH KUMAR', 'student'),
    ('252G5A0533@alits.edu.in', '$2a$10$ejYcGkp3zworvSLLQibxUuwu5VqJE4qAYkLwXeU4Kel5XOGOxDxOq', 'VEERENDRA K S', 'student'),
    ('252G5A0534@alits.edu.in', '$2a$10$ejYcGkp3zworvSLLQibxUuwu5VqJE4qAYkLwXeU4Kel5XOGOxDxOq', 'VETTI ARUN KUMAR', 'student'),
    ('252G5A0535@alits.edu.in', '$2a$10$ejYcGkp3zworvSLLQibxUuwu5VqJE4qAYkLwXeU4Kel5XOGOxDxOq', 'C NANDAVARADHAN', 'student'),
    ('252G5A0536@alits.edu.in', '$2a$10$ejYcGkp3zworvSLLQibxUuwu5VqJE4qAYkLwXeU4Kel5XOGOxDxOq', 'BOYA MUKESH', 'student'),
    ('252G5A0537@alits.edu.in', '$2a$10$ejYcGkp3zworvSLLQibxUuwu5VqJE4qAYkLwXeU4Kel5XOGOxDxOq', 'K JASWANTH', 'student')
ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, full_name = EXCLUDED.full_name;

-- 7.2 Insert Student Profiles
INSERT INTO students (user_id, class_id, roll_no, enrollment_no)
SELECT u.id, c.id, st.roll_no, st.roll_no
FROM classes c
JOIN departments d ON c.department_id = d.id
CROSS JOIN (VALUES
    ('242G1A05X2@alits.edu.in', '242G1A05X2'),
    ('242G1A05X3@alits.edu.in', '242G1A05X3'),
    ('242G1A05X4@alits.edu.in', '242G1A05X4'),
    ('242G1A05X6@alits.edu.in', '242G1A05X6'),
    ('242G1A05X7@alits.edu.in', '242G1A05X7'),
    ('242G1A05X9@alits.edu.in', '242G1A05X9'),
    ('242G1A05Y0@alits.edu.in', '242G1A05Y0'),
    ('242G1A05Y1@alits.edu.in', '242G1A05Y1'),
    ('242G1A05Y2@alits.edu.in', '242G1A05Y2'),
    ('242G1A05Y3@alits.edu.in', '242G1A05Y3'),
    ('242G1A05Y4@alits.edu.in', '242G1A05Y4'),
    ('242G1A05Y5@alits.edu.in', '242G1A05Y5'),
    ('242G1A05Y6@alits.edu.in', '242G1A05Y6'),
    ('242G1A05Y7@alits.edu.in', '242G1A05Y7'),
    ('242G1A05Y8@alits.edu.in', '242G1A05Y8'),
    ('242G1A05Y9@alits.edu.in', '242G1A05Y9'),
    ('242G1A05Z0@alits.edu.in', '242G1A05Z0'),
    ('242G1A05Z1@alits.edu.in', '242G1A05Z1'),
    ('242G1A05Z2@alits.edu.in', '242G1A05Z2'),
    ('242G1A05Z3@alits.edu.in', '242G1A05Z3'),
    ('242G1A05Z4@alits.edu.in', '242G1A05Z4'),
    ('242G1A05Z5@alits.edu.in', '242G1A05Z5'),
    ('242G1A05Z6@alits.edu.in', '242G1A05Z6'),
    ('242G1A05Z7@alits.edu.in', '242G1A05Z7'),
    ('242G1A05Z8@alits.edu.in', '242G1A05Z8'),
    ('242G1A05Z9@alits.edu.in', '242G1A05Z9'),
    ('252G5A0501@alits.edu.in', '252G5A0501'),
    ('252G5A0502@alits.edu.in', '252G5A0502'),
    ('252G5A0503@alits.edu.in', '252G5A0503'),
    ('252G5A0504@alits.edu.in', '252G5A0504'),
    ('252G5A0505@alits.edu.in', '252G5A0505'),
    ('252G5A0506@alits.edu.in', '252G5A0506'),
    ('252G5A0507@alits.edu.in', '252G5A0507'),
    ('252G5A0508@alits.edu.in', '252G5A0508'),
    ('252G5A0509@alits.edu.in', '252G5A0509'),
    ('252G5A0510@alits.edu.in', '252G5A0510'),
    ('252G5A0511@alits.edu.in', '252G5A0511'),
    ('252G5A0512@alits.edu.in', '252G5A0512'),
    ('252G5A0513@alits.edu.in', '252G5A0513'),
    ('252G5A0514@alits.edu.in', '252G5A0514'),
    ('252G5A0515@alits.edu.in', '252G5A0515'),
    ('252G5A0516@alits.edu.in', '252G5A0516'),
    ('252G5A0517@alits.edu.in', '252G5A0517'),
    ('252G5A0518@alits.edu.in', '252G5A0518'),
    ('252G5A0519@alits.edu.in', '252G5A0519'),
    ('252G5A0520@alits.edu.in', '252G5A0520'),
    ('252G5A0521@alits.edu.in', '252G5A0521'),
    ('252G5A0522@alits.edu.in', '252G5A0522'),
    ('252G5A0523@alits.edu.in', '252G5A0523'),
    ('252G5A0524@alits.edu.in', '252G5A0524'),
    ('252G5A0525@alits.edu.in', '252G5A0525'),
    ('252G5A0526@alits.edu.in', '252G5A0526'),
    ('252G5A0527@alits.edu.in', '252G5A0527'),
    ('252G5A0528@alits.edu.in', '252G5A0528'),
    ('252G5A0529@alits.edu.in', '252G5A0529'),
    ('252G5A0530@alits.edu.in', '252G5A0530'),
    ('252G5A0532@alits.edu.in', '252G5A0532'),
    ('252G5A0533@alits.edu.in', '252G5A0533'),
    ('252G5A0534@alits.edu.in', '252G5A0534'),
    ('252G5A0535@alits.edu.in', '252G5A0535'),
    ('252G5A0536@alits.edu.in', '252G5A0536'),
    ('252G5A0537@alits.edu.in', '252G5A0537')
) AS st(email, roll_no)
JOIN users u ON u.email = st.email
WHERE d.code = 'CSE' AND c.section = 'F' AND c.semester = 5 AND c.academic_year = '2026-27'
ON CONFLICT (user_id) DO UPDATE SET class_id = EXCLUDED.class_id, roll_no = EXCLUDED.roll_no, enrollment_no = EXCLUDED.enrollment_no;

-- ============================================================
-- 8. TIMETABLE (CSE F Weekly Schedule with Faculty Mapping)
-- ============================================================

-- Clean existing timetable slots for CSE F before inserting
DELETE FROM timetables 
WHERE class_id = (
    SELECT c.id FROM classes c 
    JOIN departments d ON c.department_id = d.id 
    WHERE d.code = 'CSE' AND c.section = 'F' AND c.semester = 5 AND c.academic_year = '2026-27'
);

-- Monday (day_of_week = 1)
INSERT INTO timetables (class_id, subject_id, faculty_id, day_of_week, start_time, end_time, room)
SELECT c.id, s.id, cs.faculty_id, 1, t.start_time::TIME, t.end_time::TIME, t.room
FROM classes c
JOIN departments d ON c.department_id = d.id
CROSS JOIN (VALUES
    ('24ALBTCS508T', '09:00', '10:10', '310'),
    ('24ALBTCS501T', '10:25', '11:30', '310'),
    ('24ALBTCS504Ta', '11:30', '12:30', '310'),
    ('24ALBTCS504Ta', '13:15', '14:15', '310'),
    ('24ALBTCS501T', '14:15', '15:15', '310'),
    ('24ALBTCS502T', '15:15', '16:00', '310')
) AS t(code, start_time, end_time, room)
JOIN subjects s ON s.code = t.code AND s.department_id = d.id
LEFT JOIN class_subjects cs ON cs.class_id = c.id AND cs.subject_id = s.id
WHERE d.code = 'CSE' AND c.section = 'F' AND c.semester = 5 AND c.academic_year = '2026-27';

-- Tuesday (day_of_week = 2)
INSERT INTO timetables (class_id, subject_id, faculty_id, day_of_week, start_time, end_time, room)
SELECT c.id, s.id, cs.faculty_id, 2, t.start_time::TIME, t.end_time::TIME, t.room
FROM classes c
JOIN departments d ON c.department_id = d.id
CROSS JOIN (VALUES
    ('24ALBTCS502T', '09:00', '10:10', '104'),
    ('24ALBTCS301T', '10:25', '11:30', '104'),
    ('24ALBTAM301P', '13:15', '14:15', 'LAB 1'),
    ('24ALBTAM301P', '14:15', '15:15', 'LAB 1'),
    ('24ALBTAM301P', '15:15', '16:00', 'LAB 1')
) AS t(code, start_time, end_time, room)
JOIN subjects s ON s.code = t.code AND s.department_id = d.id
LEFT JOIN class_subjects cs ON cs.class_id = c.id AND cs.subject_id = s.id
WHERE d.code = 'CSE' AND c.section = 'F' AND c.semester = 5 AND c.academic_year = '2026-27';

-- Wednesday (day_of_week = 3)
INSERT INTO timetables (class_id, subject_id, faculty_id, day_of_week, start_time, end_time, room)
SELECT c.id, s.id, cs.faculty_id, 3, t.start_time::TIME, t.end_time::TIME, t.room
FROM classes c
JOIN departments d ON c.department_id = d.id
CROSS JOIN (VALUES
    ('24ALBTCS503T', '09:00', '10:10', '310'),
    ('24ALBTCS503T', '10:25', '11:30', '310'),
    ('24ALBTCS502T', '11:30', '12:30', '310'),
    ('24ALBTCS508T', '13:15', '14:15', '310'),
    ('24ALBTCS301T', '14:15', '15:15', '310')
) AS t(code, start_time, end_time, room)
JOIN subjects s ON s.code = t.code AND s.department_id = d.id
LEFT JOIN class_subjects cs ON cs.class_id = c.id AND cs.subject_id = s.id
WHERE d.code = 'CSE' AND c.section = 'F' AND c.semester = 5 AND c.academic_year = '2026-27';

-- Thursday (day_of_week = 4)
INSERT INTO timetables (class_id, subject_id, faculty_id, day_of_week, start_time, end_time, room)
SELECT c.id, s.id, cs.faculty_id, 4, t.start_time::TIME, t.end_time::TIME, t.room
FROM classes c
JOIN departments d ON c.department_id = d.id
CROSS JOIN (VALUES
    ('24ALBTCS501P', '09:00', '10:10', 'LAB 5'),
    ('24ALBTCS501P', '10:25', '11:30', 'LAB 5'),
    ('24ALBTCS504Ta', '11:30', '12:30', '104'),
    ('24ALBTCS301T', '13:15', '14:15', '104')
) AS t(code, start_time, end_time, room)
JOIN subjects s ON s.code = t.code AND s.department_id = d.id
LEFT JOIN class_subjects cs ON cs.class_id = c.id AND cs.subject_id = s.id
WHERE d.code = 'CSE' AND c.section = 'F' AND c.semester = 5 AND c.academic_year = '2026-27';

-- Friday (day_of_week = 5)
INSERT INTO timetables (class_id, subject_id, faculty_id, day_of_week, start_time, end_time, room)
SELECT c.id, s.id, cs.faculty_id, 5, t.start_time::TIME, t.end_time::TIME, t.room
FROM classes c
JOIN departments d ON c.department_id = d.id
CROSS JOIN (VALUES
    ('24ALBTCS508T', '09:00', '10:10', 'LAB 4'),
    ('24ALBTCS501T', '10:25', '11:30', 'LAB 4'),
    ('24ALBTCS301T', '11:30', '12:30', 'LAB 4'),
    ('24ALBTCS502T', '13:15', '14:15', 'LAB 4'),
    ('24ALBTCS501T', '14:15', '15:15', 'LAB 4'),
    ('24ALBTCS504Ta', '15:15', '16:00', 'LAB 4')
) AS t(code, start_time, end_time, room)
JOIN subjects s ON s.code = t.code AND s.department_id = d.id
LEFT JOIN class_subjects cs ON cs.class_id = c.id AND cs.subject_id = s.id
WHERE d.code = 'CSE' AND c.section = 'F' AND c.semester = 5 AND c.academic_year = '2026-27';

-- Saturday (day_of_week = 6)
INSERT INTO timetables (class_id, subject_id, faculty_id, day_of_week, start_time, end_time, room)
SELECT c.id, s.id, cs.faculty_id, 6, t.start_time::TIME, t.end_time::TIME, t.room
FROM classes c
JOIN departments d ON c.department_id = d.id
CROSS JOIN (VALUES
    ('24ALBTCS508T', '09:00', '10:10', '310'),
    ('24ALBTCS301T', '10:25', '11:30', '310'),
    ('24ALBTCS508T', '11:30', '12:30', '310'),
    ('24ALBTCS504Ta', '13:15', '14:15', '310'),
    ('24ALBTCS502T', '14:15', '15:15', '310'),
    ('24ALBTCS501T', '15:15', '16:00', '310')
) AS t(code, start_time, end_time, room)
JOIN subjects s ON s.code = t.code AND s.department_id = d.id
LEFT JOIN class_subjects cs ON cs.class_id = c.id AND cs.subject_id = s.id
WHERE d.code = 'CSE' AND c.section = 'F' AND c.semester = 5 AND c.academic_year = '2026-27';

-- ============================================================
-- END OF SEED DATA
-- ============================================================


-- Verification Output
SELECT 'Setup Completed Successfully!' as status,
       (SELECT count(*) FROM users) as total_users,
       (SELECT count(*) FROM students) as total_students,
       (SELECT count(*) FROM classes) as total_classes,
       (SELECT count(*) FROM subjects) as total_subjects;