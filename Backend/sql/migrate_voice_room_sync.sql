-- 语音自习室参与者：关联 users 表

ALTER TABLE study_voice_participants ADD COLUMN user_id INT NULL AFTER role;

UPDATE study_voice_participants p
JOIN users u ON u.name = p.name
SET p.user_id = u.id
WHERE p.user_id IS NULL AND p.role != 'center';
