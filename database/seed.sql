-- ============================================================
-- AMS: Data Seeding Script
-- CSE F Class - Anantha Lakshmi Institute of Technology & Sciences
-- Default password for all users: Ams@2026
-- bcrypt hash: $2b$12$LJ3m4qs4jY8K7vX9z.RKEeWgBqVz9qXz5r8NXHEY7DWDZ3RMXmFy6
-- ============================================================

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
('admin@ams.edu', '$2a$12$V5yrj2NaPaDhoa88Uc6sZugEyRNcamJhqnCedNcEqtzJBwmj3WP7C', 'System Administrator', 'admin', '9999999999');

-- ============================================================
-- 3. FACULTY (7 Teachers for CSE F)
-- ============================================================
INSERT INTO users (email, password_hash, full_name, role, phone) VALUES
('sruthi@alits.edu.in', '$2a$12$V5yrj2NaPaDhoa88Uc6sZugEyRNcamJhqnCedNcEqtzJBwmj3WP7C', 'Ms. R. Sruthi', 'faculty', '9390976647'),
('siva.ranganath@alits.edu.in', '$2a$12$V5yrj2NaPaDhoa88Uc6sZugEyRNcamJhqnCedNcEqtzJBwmj3WP7C', 'Mr. K. Siva Ranganath', 'faculty', '9959657428'),
('manjula@alits.edu.in', '$2a$12$V5yrj2NaPaDhoa88Uc6sZugEyRNcamJhqnCedNcEqtzJBwmj3WP7C', 'Ms. A. Manjula', 'faculty', '6301735752'),
('manohar@alits.edu.in', '$2a$12$V5yrj2NaPaDhoa88Uc6sZugEyRNcamJhqnCedNcEqtzJBwmj3WP7C', 'Mr. T. Manohar', 'faculty', '8919000890'),
('sunil@alits.edu.in', '$2a$12$V5yrj2NaPaDhoa88Uc6sZugEyRNcamJhqnCedNcEqtzJBwmj3WP7C', 'Ms. B. Sunil', 'faculty', '7075103887'),
('venugopal@alits.edu.in', '$2a$12$V5yrj2NaPaDhoa88Uc6sZugEyRNcamJhqnCedNcEqtzJBwmj3WP7C', 'Mr. Venu Gopal', 'faculty', '7989029473'),
('sreekanth@alits.edu.in', '$2a$12$V5yrj2NaPaDhoa88Uc6sZugEyRNcamJhqnCedNcEqtzJBwmj3WP7C', 'Mr. B. Sreekanth', 'faculty', '7075111037');

-- ============================================================
-- 4. CLASS (CSE F, Semester 5, 2026-27)
-- ============================================================
INSERT INTO classes (department_id, name, section, semester, academic_year)
SELECT id, 'CSE', 'F', 5, '2026-27'
FROM departments WHERE code = 'CSE';

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
WHERE d.code = 'CSE';

-- ============================================================
-- 6. CLASS-SUBJECT MAPPING
-- ============================================================
INSERT INTO class_subjects (class_id, subject_id)
SELECT c.id, sub.id
FROM classes c
JOIN departments d ON c.department_id = d.id
CROSS JOIN subjects sub
WHERE d.code = 'CSE'
  AND c.section = 'F'
  AND c.academic_year = '2026-27'
  AND sub.department_id = d.id;

-- ============================================================
-- 7. STUDENTS (62 Students - CSE F)
-- ============================================================

-- Helper: get class_id for CSE F
DO $$
DECLARE
    v_class_id INTEGER;
    v_user_id INTEGER;
BEGIN
    SELECT c.id INTO v_class_id
    FROM classes c
    JOIN departments d ON c.department_id = d.id
    WHERE d.code = 'CSE' AND c.section = 'F' AND c.academic_year = '2026-27';

    -- Batch 1: 242G1A05X2 to 242G1A05Z9
    INSERT INTO users (email, password_hash, full_name, role) VALUES ('242G1A05X2@alits.edu.in', '$2a$12$V5yrj2NaPaDhoa88Uc6sZugEyRNcamJhqnCedNcEqtzJBwmj3WP7C', 'MOHAMMED RAYAN', 'student') RETURNING id INTO v_user_id;
    INSERT INTO students (user_id, class_id, roll_no, enrollment_no) VALUES (v_user_id, v_class_id, '242G1A05X2', '242G1A05X2');

    INSERT INTO users (email, password_hash, full_name, role) VALUES ('242G1A05X3@alits.edu.in', '$2a$12$V5yrj2NaPaDhoa88Uc6sZugEyRNcamJhqnCedNcEqtzJBwmj3WP7C', 'MOOD SAI JYOSHNA BAI', 'student') RETURNING id INTO v_user_id;
    INSERT INTO students (user_id, class_id, roll_no, enrollment_no) VALUES (v_user_id, v_class_id, '242G1A05X3', '242G1A05X3');

    INSERT INTO users (email, password_hash, full_name, role) VALUES ('242G1A05X4@alits.edu.in', '$2a$12$V5yrj2NaPaDhoa88Uc6sZugEyRNcamJhqnCedNcEqtzJBwmj3WP7C', 'N POOJITHA', 'student') RETURNING id INTO v_user_id;
    INSERT INTO students (user_id, class_id, roll_no, enrollment_no) VALUES (v_user_id, v_class_id, '242G1A05X4', '242G1A05X4');

    INSERT INTO users (email, password_hash, full_name, role) VALUES ('242G1A05X6@alits.edu.in', '$2a$12$V5yrj2NaPaDhoa88Uc6sZugEyRNcamJhqnCedNcEqtzJBwmj3WP7C', 'PATAKAMURI TEJA', 'student') RETURNING id INTO v_user_id;
    INSERT INTO students (user_id, class_id, roll_no, enrollment_no) VALUES (v_user_id, v_class_id, '242G1A05X6', '242G1A05X6');

    INSERT INTO users (email, password_hash, full_name, role) VALUES ('242G1A05X7@alits.edu.in', '$2a$12$V5yrj2NaPaDhoa88Uc6sZugEyRNcamJhqnCedNcEqtzJBwmj3WP7C', 'PULA VISWANATH', 'student') RETURNING id INTO v_user_id;
    INSERT INTO students (user_id, class_id, roll_no, enrollment_no) VALUES (v_user_id, v_class_id, '242G1A05X7', '242G1A05X7');

    INSERT INTO users (email, password_hash, full_name, role) VALUES ('242G1A05X9@alits.edu.in', '$2a$12$V5yrj2NaPaDhoa88Uc6sZugEyRNcamJhqnCedNcEqtzJBwmj3WP7C', 'REDDYGARI YAMINI', 'student') RETURNING id INTO v_user_id;
    INSERT INTO students (user_id, class_id, roll_no, enrollment_no) VALUES (v_user_id, v_class_id, '242G1A05X9', '242G1A05X9');

    INSERT INTO users (email, password_hash, full_name, role) VALUES ('242G1A05Y0@alits.edu.in', '$2a$12$V5yrj2NaPaDhoa88Uc6sZugEyRNcamJhqnCedNcEqtzJBwmj3WP7C', 'REKKAPOGULA NAVYA SREE', 'student') RETURNING id INTO v_user_id;
    INSERT INTO students (user_id, class_id, roll_no, enrollment_no) VALUES (v_user_id, v_class_id, '242G1A05Y0', '242G1A05Y0');

    INSERT INTO users (email, password_hash, full_name, role) VALUES ('242G1A05Y1@alits.edu.in', '$2a$12$V5yrj2NaPaDhoa88Uc6sZugEyRNcamJhqnCedNcEqtzJBwmj3WP7C', 'S TEJASWINI', 'student') RETURNING id INTO v_user_id;
    INSERT INTO students (user_id, class_id, roll_no, enrollment_no) VALUES (v_user_id, v_class_id, '242G1A05Y1', '242G1A05Y1');

    INSERT INTO users (email, password_hash, full_name, role) VALUES ('242G1A05Y2@alits.edu.in', '$2a$12$V5yrj2NaPaDhoa88Uc6sZugEyRNcamJhqnCedNcEqtzJBwmj3WP7C', 'SAKE ABHISHEK', 'student') RETURNING id INTO v_user_id;
    INSERT INTO students (user_id, class_id, roll_no, enrollment_no) VALUES (v_user_id, v_class_id, '242G1A05Y2', '242G1A05Y2');

    INSERT INTO users (email, password_hash, full_name, role) VALUES ('242G1A05Y3@alits.edu.in', '$2a$12$V5yrj2NaPaDhoa88Uc6sZugEyRNcamJhqnCedNcEqtzJBwmj3WP7C', 'SAKE ASWITHA', 'student') RETURNING id INTO v_user_id;
    INSERT INTO students (user_id, class_id, roll_no, enrollment_no) VALUES (v_user_id, v_class_id, '242G1A05Y3', '242G1A05Y3');

    INSERT INTO users (email, password_hash, full_name, role) VALUES ('242G1A05Y4@alits.edu.in', '$2a$12$V5yrj2NaPaDhoa88Uc6sZugEyRNcamJhqnCedNcEqtzJBwmj3WP7C', 'SAKE DEEPIKA', 'student') RETURNING id INTO v_user_id;
    INSERT INTO students (user_id, class_id, roll_no, enrollment_no) VALUES (v_user_id, v_class_id, '242G1A05Y4', '242G1A05Y4');

    INSERT INTO users (email, password_hash, full_name, role) VALUES ('242G1A05Y5@alits.edu.in', '$2a$12$V5yrj2NaPaDhoa88Uc6sZugEyRNcamJhqnCedNcEqtzJBwmj3WP7C', 'SAKE PRABHAS', 'student') RETURNING id INTO v_user_id;
    INSERT INTO students (user_id, class_id, roll_no, enrollment_no) VALUES (v_user_id, v_class_id, '242G1A05Y5', '242G1A05Y5');

    INSERT INTO users (email, password_hash, full_name, role) VALUES ('242G1A05Y6@alits.edu.in', '$2a$12$V5yrj2NaPaDhoa88Uc6sZugEyRNcamJhqnCedNcEqtzJBwmj3WP7C', 'SHAIK SANIYA', 'student') RETURNING id INTO v_user_id;
    INSERT INTO students (user_id, class_id, roll_no, enrollment_no) VALUES (v_user_id, v_class_id, '242G1A05Y6', '242G1A05Y6');

    INSERT INTO users (email, password_hash, full_name, role) VALUES ('242G1A05Y7@alits.edu.in', '$2a$12$V5yrj2NaPaDhoa88Uc6sZugEyRNcamJhqnCedNcEqtzJBwmj3WP7C', 'SHAIK SHAHID AFRID', 'student') RETURNING id INTO v_user_id;
    INSERT INTO students (user_id, class_id, roll_no, enrollment_no) VALUES (v_user_id, v_class_id, '242G1A05Y7', '242G1A05Y7');

    INSERT INTO users (email, password_hash, full_name, role) VALUES ('242G1A05Y8@alits.edu.in', '$2a$12$V5yrj2NaPaDhoa88Uc6sZugEyRNcamJhqnCedNcEqtzJBwmj3WP7C', 'SODINAPALLI AISWARYA', 'student') RETURNING id INTO v_user_id;
    INSERT INTO students (user_id, class_id, roll_no, enrollment_no) VALUES (v_user_id, v_class_id, '242G1A05Y8', '242G1A05Y8');

    INSERT INTO users (email, password_hash, full_name, role) VALUES ('242G1A05Y9@alits.edu.in', '$2a$12$V5yrj2NaPaDhoa88Uc6sZugEyRNcamJhqnCedNcEqtzJBwmj3WP7C', 'SURAM LAVANYA', 'student') RETURNING id INTO v_user_id;
    INSERT INTO students (user_id, class_id, roll_no, enrollment_no) VALUES (v_user_id, v_class_id, '242G1A05Y9', '242G1A05Y9');

    INSERT INTO users (email, password_hash, full_name, role) VALUES ('242G1A05Z0@alits.edu.in', '$2a$12$V5yrj2NaPaDhoa88Uc6sZugEyRNcamJhqnCedNcEqtzJBwmj3WP7C', 'T SHILPA', 'student') RETURNING id INTO v_user_id;
    INSERT INTO students (user_id, class_id, roll_no, enrollment_no) VALUES (v_user_id, v_class_id, '242G1A05Z0', '242G1A05Z0');

    INSERT INTO users (email, password_hash, full_name, role) VALUES ('242G1A05Z1@alits.edu.in', '$2a$12$V5yrj2NaPaDhoa88Uc6sZugEyRNcamJhqnCedNcEqtzJBwmj3WP7C', 'UPPARA THIPPESWAMY', 'student') RETURNING id INTO v_user_id;
    INSERT INTO students (user_id, class_id, roll_no, enrollment_no) VALUES (v_user_id, v_class_id, '242G1A05Z1', '242G1A05Z1');

    INSERT INTO users (email, password_hash, full_name, role) VALUES ('242G1A05Z2@alits.edu.in', '$2a$12$V5yrj2NaPaDhoa88Uc6sZugEyRNcamJhqnCedNcEqtzJBwmj3WP7C', 'UPPARA VEENA', 'student') RETURNING id INTO v_user_id;
    INSERT INTO students (user_id, class_id, roll_no, enrollment_no) VALUES (v_user_id, v_class_id, '242G1A05Z2', '242G1A05Z2');

    INSERT INTO users (email, password_hash, full_name, role) VALUES ('242G1A05Z3@alits.edu.in', '$2a$12$V5yrj2NaPaDhoa88Uc6sZugEyRNcamJhqnCedNcEqtzJBwmj3WP7C', 'VADITHE SUJATHA BAI', 'student') RETURNING id INTO v_user_id;
    INSERT INTO students (user_id, class_id, roll_no, enrollment_no) VALUES (v_user_id, v_class_id, '242G1A05Z3', '242G1A05Z3');

    INSERT INTO users (email, password_hash, full_name, role) VALUES ('242G1A05Z4@alits.edu.in', '$2a$12$V5yrj2NaPaDhoa88Uc6sZugEyRNcamJhqnCedNcEqtzJBwmj3WP7C', 'VADLA ANNAMANI', 'student') RETURNING id INTO v_user_id;
    INSERT INTO students (user_id, class_id, roll_no, enrollment_no) VALUES (v_user_id, v_class_id, '242G1A05Z4', '242G1A05Z4');

    INSERT INTO users (email, password_hash, full_name, role) VALUES ('242G1A05Z5@alits.edu.in', '$2a$12$V5yrj2NaPaDhoa88Uc6sZugEyRNcamJhqnCedNcEqtzJBwmj3WP7C', 'VEMURI LALITHA', 'student') RETURNING id INTO v_user_id;
    INSERT INTO students (user_id, class_id, roll_no, enrollment_no) VALUES (v_user_id, v_class_id, '242G1A05Z5', '242G1A05Z5');

    INSERT INTO users (email, password_hash, full_name, role) VALUES ('242G1A05Z6@alits.edu.in', '$2a$12$V5yrj2NaPaDhoa88Uc6sZugEyRNcamJhqnCedNcEqtzJBwmj3WP7C', 'YARASI SRI VARSHINI', 'student') RETURNING id INTO v_user_id;
    INSERT INTO students (user_id, class_id, roll_no, enrollment_no) VALUES (v_user_id, v_class_id, '242G1A05Z6', '242G1A05Z6');

    INSERT INTO users (email, password_hash, full_name, role) VALUES ('242G1A05Z7@alits.edu.in', '$2a$12$V5yrj2NaPaDhoa88Uc6sZugEyRNcamJhqnCedNcEqtzJBwmj3WP7C', 'YEDUMALLA OBULA SAGAR', 'student') RETURNING id INTO v_user_id;
    INSERT INTO students (user_id, class_id, roll_no, enrollment_no) VALUES (v_user_id, v_class_id, '242G1A05Z7', '242G1A05Z7');

    INSERT INTO users (email, password_hash, full_name, role) VALUES ('242G1A05Z8@alits.edu.in', '$2a$12$V5yrj2NaPaDhoa88Uc6sZugEyRNcamJhqnCedNcEqtzJBwmj3WP7C', 'THOTA THERISSA SHALOM', 'student') RETURNING id INTO v_user_id;
    INSERT INTO students (user_id, class_id, roll_no, enrollment_no) VALUES (v_user_id, v_class_id, '242G1A05Z8', '242G1A05Z8');

    INSERT INTO users (email, password_hash, full_name, role) VALUES ('242G1A05Z9@alits.edu.in', '$2a$12$V5yrj2NaPaDhoa88Uc6sZugEyRNcamJhqnCedNcEqtzJBwmj3WP7C', 'JUMPULA LOKESH', 'student') RETURNING id INTO v_user_id;
    INSERT INTO students (user_id, class_id, roll_no, enrollment_no) VALUES (v_user_id, v_class_id, '242G1A05Z9', '242G1A05Z9');

    -- Batch 2: 252G5A0501 to 252G5A0537
    INSERT INTO users (email, password_hash, full_name, role) VALUES ('252G5A0501@alits.edu.in', '$2a$12$V5yrj2NaPaDhoa88Uc6sZugEyRNcamJhqnCedNcEqtzJBwmj3WP7C', 'BESTHA SAI VIKAS', 'student') RETURNING id INTO v_user_id;
    INSERT INTO students (user_id, class_id, roll_no, enrollment_no) VALUES (v_user_id, v_class_id, '252G5A0501', '252G5A0501');

    INSERT INTO users (email, password_hash, full_name, role) VALUES ('252G5A0502@alits.edu.in', '$2a$12$V5yrj2NaPaDhoa88Uc6sZugEyRNcamJhqnCedNcEqtzJBwmj3WP7C', 'CHAKALI NARENDRA', 'student') RETURNING id INTO v_user_id;
    INSERT INTO students (user_id, class_id, roll_no, enrollment_no) VALUES (v_user_id, v_class_id, '252G5A0502', '252G5A0502');

    INSERT INTO users (email, password_hash, full_name, role) VALUES ('252G5A0503@alits.edu.in', '$2a$12$V5yrj2NaPaDhoa88Uc6sZugEyRNcamJhqnCedNcEqtzJBwmj3WP7C', 'CHAKALI PAVAN SAI', 'student') RETURNING id INTO v_user_id;
    INSERT INTO students (user_id, class_id, roll_no, enrollment_no) VALUES (v_user_id, v_class_id, '252G5A0503', '252G5A0503');

    INSERT INTO users (email, password_hash, full_name, role) VALUES ('252G5A0504@alits.edu.in', '$2a$12$V5yrj2NaPaDhoa88Uc6sZugEyRNcamJhqnCedNcEqtzJBwmj3WP7C', 'CHINNAMPALLI RANJITH KUMAR', 'student') RETURNING id INTO v_user_id;
    INSERT INTO students (user_id, class_id, roll_no, enrollment_no) VALUES (v_user_id, v_class_id, '252G5A0504', '252G5A0504');

    INSERT INTO users (email, password_hash, full_name, role) VALUES ('252G5A0505@alits.edu.in', '$2a$12$V5yrj2NaPaDhoa88Uc6sZugEyRNcamJhqnCedNcEqtzJBwmj3WP7C', 'CHINTHALAPALLI INDU', 'student') RETURNING id INTO v_user_id;
    INSERT INTO students (user_id, class_id, roll_no, enrollment_no) VALUES (v_user_id, v_class_id, '252G5A0505', '252G5A0505');

    INSERT INTO users (email, password_hash, full_name, role) VALUES ('252G5A0506@alits.edu.in', '$2a$12$V5yrj2NaPaDhoa88Uc6sZugEyRNcamJhqnCedNcEqtzJBwmj3WP7C', 'D THARUN KUMAR', 'student') RETURNING id INTO v_user_id;
    INSERT INTO students (user_id, class_id, roll_no, enrollment_no) VALUES (v_user_id, v_class_id, '252G5A0506', '252G5A0506');

    INSERT INTO users (email, password_hash, full_name, role) VALUES ('252G5A0507@alits.edu.in', '$2a$12$V5yrj2NaPaDhoa88Uc6sZugEyRNcamJhqnCedNcEqtzJBwmj3WP7C', 'GARIKA POOJA', 'student') RETURNING id INTO v_user_id;
    INSERT INTO students (user_id, class_id, roll_no, enrollment_no) VALUES (v_user_id, v_class_id, '252G5A0507', '252G5A0507');

    INSERT INTO users (email, password_hash, full_name, role) VALUES ('252G5A0508@alits.edu.in', '$2a$12$V5yrj2NaPaDhoa88Uc6sZugEyRNcamJhqnCedNcEqtzJBwmj3WP7C', 'GOLLA MOHAN KUMAR', 'student') RETURNING id INTO v_user_id;
    INSERT INTO students (user_id, class_id, roll_no, enrollment_no) VALUES (v_user_id, v_class_id, '252G5A0508', '252G5A0508');

    INSERT INTO users (email, password_hash, full_name, role) VALUES ('252G5A0509@alits.edu.in', '$2a$12$V5yrj2NaPaDhoa88Uc6sZugEyRNcamJhqnCedNcEqtzJBwmj3WP7C', 'GUDDITI JAYAKRISHNA', 'student') RETURNING id INTO v_user_id;
    INSERT INTO students (user_id, class_id, roll_no, enrollment_no) VALUES (v_user_id, v_class_id, '252G5A0509', '252G5A0509');

    INSERT INTO users (email, password_hash, full_name, role) VALUES ('252G5A0510@alits.edu.in', '$2a$12$V5yrj2NaPaDhoa88Uc6sZugEyRNcamJhqnCedNcEqtzJBwmj3WP7C', 'GUJJALA PALLAVI', 'student') RETURNING id INTO v_user_id;
    INSERT INTO students (user_id, class_id, roll_no, enrollment_no) VALUES (v_user_id, v_class_id, '252G5A0510', '252G5A0510');

    INSERT INTO users (email, password_hash, full_name, role) VALUES ('252G5A0511@alits.edu.in', '$2a$12$V5yrj2NaPaDhoa88Uc6sZugEyRNcamJhqnCedNcEqtzJBwmj3WP7C', 'GUVVALA RAKESH', 'student') RETURNING id INTO v_user_id;
    INSERT INTO students (user_id, class_id, roll_no, enrollment_no) VALUES (v_user_id, v_class_id, '252G5A0511', '252G5A0511');

    INSERT INTO users (email, password_hash, full_name, role) VALUES ('252G5A0512@alits.edu.in', '$2a$12$V5yrj2NaPaDhoa88Uc6sZugEyRNcamJhqnCedNcEqtzJBwmj3WP7C', 'JAMMULA VISHNU VARDHAN', 'student') RETURNING id INTO v_user_id;
    INSERT INTO students (user_id, class_id, roll_no, enrollment_no) VALUES (v_user_id, v_class_id, '252G5A0512', '252G5A0512');

    INSERT INTO users (email, password_hash, full_name, role) VALUES ('252G5A0513@alits.edu.in', '$2a$12$V5yrj2NaPaDhoa88Uc6sZugEyRNcamJhqnCedNcEqtzJBwmj3WP7C', 'K VISHNU', 'student') RETURNING id INTO v_user_id;
    INSERT INTO students (user_id, class_id, roll_no, enrollment_no) VALUES (v_user_id, v_class_id, '252G5A0513', '252G5A0513');

    INSERT INTO users (email, password_hash, full_name, role) VALUES ('252G5A0514@alits.edu.in', '$2a$12$V5yrj2NaPaDhoa88Uc6sZugEyRNcamJhqnCedNcEqtzJBwmj3WP7C', 'KAMBALAPADU EDIGA KASIVISWANATH GOUD', 'student') RETURNING id INTO v_user_id;
    INSERT INTO students (user_id, class_id, roll_no, enrollment_no) VALUES (v_user_id, v_class_id, '252G5A0514', '252G5A0514');

    INSERT INTO users (email, password_hash, full_name, role) VALUES ('252G5A0515@alits.edu.in', '$2a$12$V5yrj2NaPaDhoa88Uc6sZugEyRNcamJhqnCedNcEqtzJBwmj3WP7C', 'KANNELURI YAGNA CHARAN', 'student') RETURNING id INTO v_user_id;
    INSERT INTO students (user_id, class_id, roll_no, enrollment_no) VALUES (v_user_id, v_class_id, '252G5A0515', '252G5A0515');

    INSERT INTO users (email, password_hash, full_name, role) VALUES ('252G5A0516@alits.edu.in', '$2a$12$V5yrj2NaPaDhoa88Uc6sZugEyRNcamJhqnCedNcEqtzJBwmj3WP7C', 'MOPURI SETTY SAI KUMAR', 'student') RETURNING id INTO v_user_id;
    INSERT INTO students (user_id, class_id, roll_no, enrollment_no) VALUES (v_user_id, v_class_id, '252G5A0516', '252G5A0516');

    INSERT INTO users (email, password_hash, full_name, role) VALUES ('252G5A0517@alits.edu.in', '$2a$12$V5yrj2NaPaDhoa88Uc6sZugEyRNcamJhqnCedNcEqtzJBwmj3WP7C', 'MUDDIREDDY JASWANTH REDDY', 'student') RETURNING id INTO v_user_id;
    INSERT INTO students (user_id, class_id, roll_no, enrollment_no) VALUES (v_user_id, v_class_id, '252G5A0517', '252G5A0517');

    INSERT INTO users (email, password_hash, full_name, role) VALUES ('252G5A0518@alits.edu.in', '$2a$12$V5yrj2NaPaDhoa88Uc6sZugEyRNcamJhqnCedNcEqtzJBwmj3WP7C', 'NAGELI TARAKARAM', 'student') RETURNING id INTO v_user_id;
    INSERT INTO students (user_id, class_id, roll_no, enrollment_no) VALUES (v_user_id, v_class_id, '252G5A0518', '252G5A0518');

    INSERT INTO users (email, password_hash, full_name, role) VALUES ('252G5A0519@alits.edu.in', '$2a$12$V5yrj2NaPaDhoa88Uc6sZugEyRNcamJhqnCedNcEqtzJBwmj3WP7C', 'NIDIGANTI SAI SREE', 'student') RETURNING id INTO v_user_id;
    INSERT INTO students (user_id, class_id, roll_no, enrollment_no) VALUES (v_user_id, v_class_id, '252G5A0519', '252G5A0519');

    INSERT INTO users (email, password_hash, full_name, role) VALUES ('252G5A0520@alits.edu.in', '$2a$12$V5yrj2NaPaDhoa88Uc6sZugEyRNcamJhqnCedNcEqtzJBwmj3WP7C', 'PALTURU VENUBHASKAR', 'student') RETURNING id INTO v_user_id;
    INSERT INTO students (user_id, class_id, roll_no, enrollment_no) VALUES (v_user_id, v_class_id, '252G5A0520', '252G5A0520');

    INSERT INTO users (email, password_hash, full_name, role) VALUES ('252G5A0521@alits.edu.in', '$2a$12$V5yrj2NaPaDhoa88Uc6sZugEyRNcamJhqnCedNcEqtzJBwmj3WP7C', 'PATHAKAMURI GOWTHAMI', 'student') RETURNING id INTO v_user_id;
    INSERT INTO students (user_id, class_id, roll_no, enrollment_no) VALUES (v_user_id, v_class_id, '252G5A0521', '252G5A0521');

    INSERT INTO users (email, password_hash, full_name, role) VALUES ('252G5A0522@alits.edu.in', '$2a$12$V5yrj2NaPaDhoa88Uc6sZugEyRNcamJhqnCedNcEqtzJBwmj3WP7C', 'PEDARASI SAHITH KUMAR', 'student') RETURNING id INTO v_user_id;
    INSERT INTO students (user_id, class_id, roll_no, enrollment_no) VALUES (v_user_id, v_class_id, '252G5A0522', '252G5A0522');

    INSERT INTO users (email, password_hash, full_name, role) VALUES ('252G5A0523@alits.edu.in', '$2a$12$V5yrj2NaPaDhoa88Uc6sZugEyRNcamJhqnCedNcEqtzJBwmj3WP7C', 'PENIKALAPATI KIRANMAI', 'student') RETURNING id INTO v_user_id;
    INSERT INTO students (user_id, class_id, roll_no, enrollment_no) VALUES (v_user_id, v_class_id, '252G5A0523', '252G5A0523');

    INSERT INTO users (email, password_hash, full_name, role) VALUES ('252G5A0524@alits.edu.in', '$2a$12$V5yrj2NaPaDhoa88Uc6sZugEyRNcamJhqnCedNcEqtzJBwmj3WP7C', 'SHAIK PAPA SAHEB MOHAMMED ADIL HUSSAIN', 'student') RETURNING id INTO v_user_id;
    INSERT INTO students (user_id, class_id, roll_no, enrollment_no) VALUES (v_user_id, v_class_id, '252G5A0524', '252G5A0524');

    INSERT INTO users (email, password_hash, full_name, role) VALUES ('252G5A0525@alits.edu.in', '$2a$12$V5yrj2NaPaDhoa88Uc6sZugEyRNcamJhqnCedNcEqtzJBwmj3WP7C', 'SHAIK VALI', 'student') RETURNING id INTO v_user_id;
    INSERT INTO students (user_id, class_id, roll_no, enrollment_no) VALUES (v_user_id, v_class_id, '252G5A0525', '252G5A0525');

    INSERT INTO users (email, password_hash, full_name, role) VALUES ('252G5A0526@alits.edu.in', '$2a$12$V5yrj2NaPaDhoa88Uc6sZugEyRNcamJhqnCedNcEqtzJBwmj3WP7C', 'SYED MOHAMMED INAMUL HASAN', 'student') RETURNING id INTO v_user_id;
    INSERT INTO students (user_id, class_id, roll_no, enrollment_no) VALUES (v_user_id, v_class_id, '252G5A0526', '252G5A0526');

    INSERT INTO users (email, password_hash, full_name, role) VALUES ('252G5A0527@alits.edu.in', '$2a$12$V5yrj2NaPaDhoa88Uc6sZugEyRNcamJhqnCedNcEqtzJBwmj3WP7C', 'TADIPATHRI LATHIF', 'student') RETURNING id INTO v_user_id;
    INSERT INTO students (user_id, class_id, roll_no, enrollment_no) VALUES (v_user_id, v_class_id, '252G5A0527', '252G5A0527');

    INSERT INTO users (email, password_hash, full_name, role) VALUES ('252G5A0528@alits.edu.in', '$2a$12$V5yrj2NaPaDhoa88Uc6sZugEyRNcamJhqnCedNcEqtzJBwmj3WP7C', 'TALARI VASANTH', 'student') RETURNING id INTO v_user_id;
    INSERT INTO students (user_id, class_id, roll_no, enrollment_no) VALUES (v_user_id, v_class_id, '252G5A0528', '252G5A0528');

    INSERT INTO users (email, password_hash, full_name, role) VALUES ('252G5A0529@alits.edu.in', '$2a$12$V5yrj2NaPaDhoa88Uc6sZugEyRNcamJhqnCedNcEqtzJBwmj3WP7C', 'UDUMULA KUSHAL', 'student') RETURNING id INTO v_user_id;
    INSERT INTO students (user_id, class_id, roll_no, enrollment_no) VALUES (v_user_id, v_class_id, '252G5A0529', '252G5A0529');

    INSERT INTO users (email, password_hash, full_name, role) VALUES ('252G5A0530@alits.edu.in', '$2a$12$V5yrj2NaPaDhoa88Uc6sZugEyRNcamJhqnCedNcEqtzJBwmj3WP7C', 'UPPARA SUNNY SAGAR', 'student') RETURNING id INTO v_user_id;
    INSERT INTO students (user_id, class_id, roll_no, enrollment_no) VALUES (v_user_id, v_class_id, '252G5A0530', '252G5A0530');

    INSERT INTO users (email, password_hash, full_name, role) VALUES ('252G5A0532@alits.edu.in', '$2a$12$V5yrj2NaPaDhoa88Uc6sZugEyRNcamJhqnCedNcEqtzJBwmj3WP7C', 'VARIMADUGU ADARSH KUMAR', 'student') RETURNING id INTO v_user_id;
    INSERT INTO students (user_id, class_id, roll_no, enrollment_no) VALUES (v_user_id, v_class_id, '252G5A0532', '252G5A0532');

    INSERT INTO users (email, password_hash, full_name, role) VALUES ('252G5A0533@alits.edu.in', '$2a$12$V5yrj2NaPaDhoa88Uc6sZugEyRNcamJhqnCedNcEqtzJBwmj3WP7C', 'VEERENDRA K S', 'student') RETURNING id INTO v_user_id;
    INSERT INTO students (user_id, class_id, roll_no, enrollment_no) VALUES (v_user_id, v_class_id, '252G5A0533', '252G5A0533');

    INSERT INTO users (email, password_hash, full_name, role) VALUES ('252G5A0534@alits.edu.in', '$2a$12$V5yrj2NaPaDhoa88Uc6sZugEyRNcamJhqnCedNcEqtzJBwmj3WP7C', 'VETTI ARUN KUMAR', 'student') RETURNING id INTO v_user_id;
    INSERT INTO students (user_id, class_id, roll_no, enrollment_no) VALUES (v_user_id, v_class_id, '252G5A0534', '252G5A0534');

    INSERT INTO users (email, password_hash, full_name, role) VALUES ('252G5A0535@alits.edu.in', '$2a$12$V5yrj2NaPaDhoa88Uc6sZugEyRNcamJhqnCedNcEqtzJBwmj3WP7C', 'C NANDAVARADHAN', 'student') RETURNING id INTO v_user_id;
    INSERT INTO students (user_id, class_id, roll_no, enrollment_no) VALUES (v_user_id, v_class_id, '252G5A0535', '252G5A0535');

    INSERT INTO users (email, password_hash, full_name, role) VALUES ('252G5A0536@alits.edu.in', '$2a$12$V5yrj2NaPaDhoa88Uc6sZugEyRNcamJhqnCedNcEqtzJBwmj3WP7C', 'BOYA MUKESH', 'student') RETURNING id INTO v_user_id;
    INSERT INTO students (user_id, class_id, roll_no, enrollment_no) VALUES (v_user_id, v_class_id, '252G5A0536', '252G5A0536');

    INSERT INTO users (email, password_hash, full_name, role) VALUES ('252G5A0537@alits.edu.in', '$2a$12$V5yrj2NaPaDhoa88Uc6sZugEyRNcamJhqnCedNcEqtzJBwmj3WP7C', 'K JASWANTH', 'student') RETURNING id INTO v_user_id;
    INSERT INTO students (user_id, class_id, roll_no, enrollment_no) VALUES (v_user_id, v_class_id, '252G5A0537', '252G5A0537');

END $$;

-- ============================================================
-- 8. TIMETABLE (CSE F Weekly Schedule)
-- ============================================================

-- Monday (day_of_week = 1)
INSERT INTO timetables (class_id, subject_id, day_of_week, start_time, end_time, room)
SELECT c.id, s.id, 1, t.start_time::TIME, t.end_time::TIME, t.room
FROM classes c
JOIN departments d ON c.department_id = d.id,
(VALUES
    ('24ALBTCS508T', '09:00', '10:10', '310'),
    ('24ALBTCS501T', '10:25', '11:30', '310'),
    ('24ALBTCS504Ta', '11:30', '12:30', '310'),
    ('24ALBTCS504Ta', '13:15', '14:15', '310'),
    ('24ALBTCS501T', '14:15', '15:15', '310'),
    ('24ALBTCS502T', '15:15', '16:00', '310')
) AS t(code, start_time, end_time, room)
JOIN subjects s ON s.code = t.code AND s.department_id = d.id
WHERE d.code = 'CSE' AND c.section = 'F' AND c.academic_year = '2026-27';

-- Tuesday (day_of_week = 2)
INSERT INTO timetables (class_id, subject_id, day_of_week, start_time, end_time, room)
SELECT c.id, s.id, 2, t.start_time::TIME, t.end_time::TIME, t.room
FROM classes c
JOIN departments d ON c.department_id = d.id,
(VALUES
    ('24ALBTCS502T', '09:00', '10:10', '104'),
    ('24ALBTCS301T', '10:25', '11:30', '104'),
    ('24ALBTAM301P', '13:15', '14:15', 'LAB 1'),
    ('24ALBTAM301P', '14:15', '15:15', 'LAB 1'),
    ('24ALBTAM301P', '15:15', '16:00', 'LAB 1')
) AS t(code, start_time, end_time, room)
JOIN subjects s ON s.code = t.code AND s.department_id = d.id
WHERE d.code = 'CSE' AND c.section = 'F' AND c.academic_year = '2026-27';

-- Wednesday (day_of_week = 3)
INSERT INTO timetables (class_id, subject_id, day_of_week, start_time, end_time, room)
SELECT c.id, s.id, 3, t.start_time::TIME, t.end_time::TIME, t.room
FROM classes c
JOIN departments d ON c.department_id = d.id,
(VALUES
    ('24ALBTCS503T', '09:00', '10:10', '310'),
    ('24ALBTCS503T', '10:25', '11:30', '310'),
    ('24ALBTCS502T', '11:30', '12:30', '310'),
    ('24ALBTCS508T', '13:15', '14:15', '310'),
    ('24ALBTCS301T', '14:15', '15:15', '310')
) AS t(code, start_time, end_time, room)
JOIN subjects s ON s.code = t.code AND s.department_id = d.id
WHERE d.code = 'CSE' AND c.section = 'F' AND c.academic_year = '2026-27';

-- Thursday (day_of_week = 4)
INSERT INTO timetables (class_id, subject_id, day_of_week, start_time, end_time, room)
SELECT c.id, s.id, 4, t.start_time::TIME, t.end_time::TIME, t.room
FROM classes c
JOIN departments d ON c.department_id = d.id,
(VALUES
    ('24ALBTCS501P', '09:00', '10:10', 'LAB 5'),
    ('24ALBTCS501P', '10:25', '11:30', 'LAB 5'),
    ('24ALBTCS504Ta', '11:30', '12:30', '104'),
    ('24ALBTCS301T', '13:15', '14:15', '104')
) AS t(code, start_time, end_time, room)
JOIN subjects s ON s.code = t.code AND s.department_id = d.id
WHERE d.code = 'CSE' AND c.section = 'F' AND c.academic_year = '2026-27';

-- Friday (day_of_week = 5)
INSERT INTO timetables (class_id, subject_id, day_of_week, start_time, end_time, room)
SELECT c.id, s.id, 5, t.start_time::TIME, t.end_time::TIME, t.room
FROM classes c
JOIN departments d ON c.department_id = d.id,
(VALUES
    ('24ALBTCS508T', '09:00', '10:10', 'LAB 4'),
    ('24ALBTCS501T', '10:25', '11:30', 'LAB 4'),
    ('24ALBTCS301T', '11:30', '12:30', 'LAB 4'),
    ('24ALBTCS502T', '13:15', '14:15', 'LAB 4'),
    ('24ALBTCS501T', '14:15', '15:15', 'LAB 4'),
    ('24ALBTCS504Ta', '15:15', '16:00', 'LAB 4')
) AS t(code, start_time, end_time, room)
JOIN subjects s ON s.code = t.code AND s.department_id = d.id
WHERE d.code = 'CSE' AND c.section = 'F' AND c.academic_year = '2026-27';

-- Saturday (day_of_week = 6)
INSERT INTO timetables (class_id, subject_id, day_of_week, start_time, end_time, room)
SELECT c.id, s.id, 6, t.start_time::TIME, t.end_time::TIME, t.room
FROM classes c
JOIN departments d ON c.department_id = d.id,
(VALUES
    ('24ALBTCS508T', '09:00', '10:10', '310'),
    ('24ALBTCS301T', '10:25', '11:30', '310'),
    ('24ALBTCS508T', '11:30', '12:30', '310'),
    ('24ALBTCS504Ta', '13:15', '14:15', '310'),
    ('24ALBTCS502T', '14:15', '15:15', '310'),
    ('24ALBTCS501T', '15:15', '16:00', '310')
) AS t(code, start_time, end_time, room)
JOIN subjects s ON s.code = t.code AND s.department_id = d.id
WHERE d.code = 'CSE' AND c.section = 'F' AND c.academic_year = '2026-27';

-- ============================================================
-- END OF SEED DATA
-- ============================================================
