-- 创建自习室表单字段扩展

ALTER TABLE study_rooms ADD COLUMN study_mode VARCHAR(20) DEFAULT 'quiet' AFTER category;
ALTER TABLE study_rooms ADD COLUMN is_private TINYINT(1) DEFAULT 0 AFTER study_mode;
ALTER TABLE study_rooms ADD COLUMN room_password VARCHAR(20) DEFAULT NULL AFTER is_private;
ALTER TABLE study_rooms ADD COLUMN duration_minutes INT DEFAULT 45 AFTER room_password;
ALTER TABLE study_rooms ADD COLUMN max_members INT DEFAULT 8 AFTER duration_minutes;
ALTER TABLE study_rooms ADD COLUMN mic_enabled TINYINT(1) DEFAULT 1 AFTER max_members;
ALTER TABLE study_rooms ADD COLUMN camera_enabled TINYINT(1) DEFAULT 1 AFTER mic_enabled;
ALTER TABLE study_rooms ADD COLUMN atmosphere_id VARCHAR(30) DEFAULT 'starry-night' AFTER camera_enabled;
ALTER TABLE study_rooms ADD COLUMN creator_user_id INT DEFAULT NULL AFTER atmosphere_id;
