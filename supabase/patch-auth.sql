-- ABSEN SKANEXA - PATCH AUTH / USER
ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR(100);
UPDATE users SET username = LOWER(TRIM(username)) WHERE username IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username_unique ON users(username);
ALTER TABLE users ALTER COLUMN password_hash TYPE VARCHAR(255);
ALTER TABLE users ALTER COLUMN status SET DEFAULT 'active';

SELECT id, username, name, role, status, LENGTH(password_hash) AS password_hash_length, created_at
FROM users ORDER BY created_at DESC;
