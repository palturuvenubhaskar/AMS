-- Align the 75% boundary across the database and the app.
--
-- Previously `zone = 'green'` required attendance strictly above 75%, while the
-- UI, the leave policy and the "75% target" all treat 75% as the safe line.
-- Run this once against an existing database (local or Supabase):
--
--   psql "$DATABASE_URL" -f database/migrations/001-zone-thresholds.sql

BEGIN;

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
        WHEN (COUNT(ar.id) FILTER (WHERE ar.status = 'present') * 100.0 / COUNT(ar.id)) >= 75 THEN 'green'
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

    IF v_attendance_pct >= 75 THEN
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

COMMIT;
