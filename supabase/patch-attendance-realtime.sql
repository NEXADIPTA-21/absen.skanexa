-- Jalankan sekali di Supabase SQL Editor jika database sudah terlanjur dibuat.
ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR(100);

UPDATE users
SET username = LOWER(TRIM(username))
WHERE username IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username_unique ON users(username);

CREATE INDEX IF NOT EXISTS idx_attendance_date_status
ON attendance(attendance_date, status);

CREATE INDEX IF NOT EXISTS idx_attendance_student_date
ON attendance(student_id, attendance_date);
