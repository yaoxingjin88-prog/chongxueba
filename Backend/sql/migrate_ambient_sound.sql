USE chong_xueba;
ALTER TABLE users ADD COLUMN IF NOT EXISTS ambient_sound VARCHAR(20) DEFAULT 'rain' AFTER vip;
UPDATE users SET ambient_sound = 'rain' WHERE ambient_sound IS NULL OR ambient_sound = '';
