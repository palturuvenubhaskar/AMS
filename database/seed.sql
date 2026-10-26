-- ============================================================
-- AMS: Data Seeding Script
-- CSE F Class - Anantha Lakshmi Institute of Technology & Sciences
-- Default password for all users: Ams@2026
-- bcrypt hash: $2a$10$ejYcGkp3zworvSLLQibxUuwu5VqJE4qAYkLwXeU4Kel5XOGOxDxOq
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
('admin@ams.edu', '$2a$10$ejYcGkp3zworvSLLQibxUuwu5VqJE4qAYkLwXeU4Kel5XOGOxDxOq', 'System Administrator', 'admin', '9999999999')
ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, full_name = EXCLUDED.full_name;

-- ============================================================
-- 3. FACULTY (7 Teachers for CSE F)
-- ============================================================
INSERT INTO users (email, password_hash, full_name, role, phone) VALUES
('sruthi@alits.edu.in', '$2a$10$ejYcGkp3zworvSLLQibxUuwu5VqJE4qAYkLwXeU4Kel5XOGOxDxOq', 'Ms. R. Sruthi', 'faculty', '9390976647'),
('siva.ranganath@alits.edu.in', '$2a$10$ejYcGkp3zworvSLLQibxUuwu5VqJE4qAYkLwXeU4Kel5XOGOxDxOq', 'Mr. K. Siva Ranganath', 'faculty', '9959657428'),
('manjula@alits.edu.in', '$2a$10$ejYcGkp3zworvSLLQibxUuwu5VqJE4qAYkLwXeU4Kel5XOGOxDxOq', 'Ms. A. Manjula', 'faculty', '6301735752'),
('manohar@alits.edu.in', '$2a$10$ejYcGkp3zworvSLLQibxUuwu5VqJE4qAYkLwXeU4Kel5XOGOxDxOq', 'Mr. T. Manohar', 'faculty', '8919000890'),
('sunil@alits.edu.in', '$2a$10$ejYcGkp3zworvSLLQibxUuwu5VqJE4qAYkLwXeU4Kel5XOGOxDxOq', 'Ms. B. Sunil', 'faculty', '7075103887'),
('venugopal@alits.edu.in', '$2a$10$ejYcGkp3zworvSLLQibxUuwu5VqJE4qAYkLwXeU4Kel5XOGOxDxOq', 'Mr. Venu Gopal', 'faculty', '7989029473'),
('sreekanth@alits.edu.in', '$2a$10$ejYcGkp3zworvSLLQibxUuwu5VqJE4qAYkLwXeU4Kel5XOGOxDxOq', 'Mr. B. Sreekanth', 'faculty', '7075111037')
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
