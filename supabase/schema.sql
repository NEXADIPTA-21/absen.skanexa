-- ==============================================================================
-- ABSEN SKANEXA v1.0
-- Supabase PostgreSQL Schema
-- Timezone: Asia/Jakarta (WIB)
-- ==============================================================================

-- ==============================================================================
-- 0. EXTENSIONS
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ==============================================================================
-- 1. USERS TABLE
-- ==============================================================================

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(64) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL
        CHECK (role IN ('admin', 'student', 'security')),
    status VARCHAR(20) NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'disabled')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- ==============================================================================
-- 2. CLASSES TABLE
-- ==============================================================================

CREATE TABLE IF NOT EXISTS classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'disabled')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- ==============================================================================
-- 3. STUDENTS TABLE
-- ==============================================================================

CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    user_id UUID
        REFERENCES users(id)
        ON DELETE CASCADE,

    class_id UUID
        REFERENCES classes(id)
        ON DELETE SET NULL,

    name VARCHAR(100) NOT NULL,

    qr_token VARCHAR(64) UNIQUE NOT NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'disabled')),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- ==============================================================================
-- 4. ATTENDANCE SETTINGS TABLE
-- ==============================================================================

CREATE TABLE IF NOT EXISTS attendance_settings (
    id INT PRIMARY KEY DEFAULT 1,

    check_in_start TIME NOT NULL DEFAULT '06:00:00',

    late_threshold TIME NOT NULL DEFAULT '07:15:00',

    check_in_end TIME NOT NULL DEFAULT '08:00:00',

    check_out_start TIME NOT NULL DEFAULT '15:00:00',

    check_out_end TIME NOT NULL DEFAULT '17:30:00',

    timezone VARCHAR(50) NOT NULL DEFAULT 'Asia/Jakarta',

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT single_row CHECK (id = 1)
);


-- ==============================================================================
-- 5. ATTENDANCE TABLE
-- ==============================================================================

CREATE TABLE IF NOT EXISTS attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    student_id UUID NOT NULL
        REFERENCES students(id)
        ON DELETE CASCADE,

    attendance_date DATE NOT NULL,

    check_in_at TIMESTAMPTZ,

    check_out_at TIMESTAMPTZ,

    check_in_by UUID
        REFERENCES users(id)
        ON DELETE SET NULL,

    check_out_by UUID
        REFERENCES users(id)
        ON DELETE SET NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'present'
        CHECK (
            status IN (
                'present',
                'late',
                'checked_out',
                'absent'
            )
        ),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT uq_student_attendance_date
        UNIQUE (student_id, attendance_date)
);


-- ==============================================================================
-- 6. AUDIT LOGS TABLE
-- ==============================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    user_id UUID
        REFERENCES users(id)
        ON DELETE SET NULL,

    action VARCHAR(100) NOT NULL,

    entity_type VARCHAR(50) NOT NULL,

    entity_id VARCHAR(100),

    metadata JSONB DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ DEFAULT NOW()
);


-- ==============================================================================
-- 7. INDEXES
-- ==============================================================================
-- Dioptimalkan untuk scanner QR agar lookup token cepat.

CREATE INDEX IF NOT EXISTS idx_students_qr_token
    ON students(qr_token);

CREATE INDEX IF NOT EXISTS idx_students_user_id
    ON students(user_id);

CREATE INDEX IF NOT EXISTS idx_students_class_id
    ON students(class_id);

CREATE INDEX IF NOT EXISTS idx_attendance_student_id
    ON attendance(student_id);

CREATE INDEX IF NOT EXISTS idx_attendance_attendance_date
    ON attendance(attendance_date);

CREATE INDEX IF NOT EXISTS idx_attendance_student_date
    ON attendance(student_id, attendance_date);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at
    ON audit_logs(created_at DESC);


-- ==============================================================================
-- 8. DEFAULT ATTENDANCE SETTINGS
-- ==============================================================================

INSERT INTO attendance_settings (
    id,
    check_in_start,
    late_threshold,
    check_in_end,
    check_out_start,
    check_out_end,
    timezone
)
VALUES (
    1,
    '06:00:00',
    '07:15:00',
    '08:00:00',
    '15:00:00',
    '17:30:00',
    'Asia/Jakarta'
)
ON CONFLICT (id) DO NOTHING;


-- ==============================================================================
-- 9. DEFAULT ADMIN ACCOUNT
-- ==============================================================================
-- Username : admin
-- Password : admin123
--
-- ID sengaja TIDAK ditentukan secara manual.
-- PostgreSQL akan membuat UUID otomatis.
-- ==============================================================================

INSERT INTO users (
    username,
    password_hash,
    role,
    status
)
VALUES (
    'admin',
    '$2a$10$Lsmc6Y9bK4T9uBvhqD2RnuU/Wc191a2oIbgI8w4l9v3hNcf3Q7Hl2',
    'admin',
    'active'
)
ON CONFLICT (username) DO NOTHING;


-- ==============================================================================
-- 10. DEFAULT SECURITY ACCOUNT
-- ==============================================================================
-- Username : security01
-- Password : security123
--
-- ID juga dibuat otomatis oleh PostgreSQL.
-- ==============================================================================

INSERT INTO users (
    username,
    password_hash,
    role,
    status
)
VALUES (
    'security01',
    '$2a$10$fG6mH1J7Zk5Nq8RvT3YpLuX2B1C9v0W8E4a7S6d5F2g1H3j4K5l6M',
    'security',
    'active'
)
ON CONFLICT (username) DO NOTHING;


-- ==============================================================================
-- 11. SAMPLE CLASSES
-- ==============================================================================

INSERT INTO classes (
    name,
    status
)
VALUES
    ('X RPL 1', 'active'),
    ('X RPL 2', 'active'),
    ('XI RPL 1', 'active'),
    ('XI RPL 2', 'active'),
    ('XII RPL 1', 'active'),
    ('XII RPL 2', 'active')
ON CONFLICT (name) DO NOTHING;


-- ==============================================================================
-- DONE
-- ==============================================================================

SELECT
    'Absen SKANEXA database schema berhasil dibuat.' AS message;
