-- ============================================================
-- AAMS-FRS: Academic Attendance Management System with FRS
-- PostgreSQL 15+ Schema Script
-- Generated: August 2026
-- ============================================================

-- Clean slate
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
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
    role            VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'faculty', 'student')),
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
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(class_id, subject_id)
);

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
    day_of_week     INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time      TIME NOT NULL,
    end_time        TIME NOT NULL,
    room            VARCHAR(50),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_time CHECK (end_time > start_time)
);

CREATE INDEX idx_timetable_class ON timetables(class_id);
CREATE INDEX idx_timetable_day ON timetables(day_of_week);

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
-- SEED DATA
-- ============================================================

INSERT INTO departments (name, code) VALUES
('Computer Science and Engineering', 'CSE'),
('Electronics and Communication', 'ECE'),
('Mechanical Engineering', 'MECH'),
('Civil Engineering', 'CIVIL');

INSERT INTO users (email, password_hash, full_name, role, phone) VALUES
('admin@aams.edu', '$2b$12$dummyhashforadmin', 'System Administrator', 'admin', '9999999999'),
('faculty1@aams.edu', '$2b$12$dummyhashforfaculty1', 'Dr. Rajesh Kumar', 'faculty', '8888888888'),
('faculty2@aams.edu', '$2b$12$dummyhashforfaculty2', 'Prof. Sunita Devi', 'faculty', '7777777777'),
('faculty3@aams.edu', '$2b$12$dummyhashforfaculty3', 'Dr. Amit Sharma', 'faculty', '6666666666');

INSERT INTO classes (department_id, name, section, semester, academic_year) VALUES
(1, 'CSE', 'A', 5, '2026-27'),
(1, 'CSE', 'B', 5, '2026-27'),
(2, 'ECE', 'A', 3, '2026-27');

INSERT INTO subjects (department_id, name, code, credits) VALUES
(1, 'Database Management Systems', 'CS301', 4),
(1, 'Operating Systems', 'CS302', 4),
(1, 'Computer Networks', 'CS303', 3),
(2, 'Digital Signal Processing', 'EC301', 4),
(2, 'Microprocessors', 'EC302', 3);

INSERT INTO class_subjects (class_id, subject_id) VALUES
(1, 1), (1, 2), (1, 3),
(2, 1), (2, 2),
(3, 4), (3, 5);

COMMIT;

-- ============================================================
-- END OF SCHEMA
-- ============================================================
