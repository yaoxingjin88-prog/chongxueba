-- 自习室在线用户：关联 users 表，展示数据从真实账号同步

ALTER TABLE study_room_users ADD COLUMN user_id INT NULL AFTER id;

UPDATE study_room_users sru
JOIN users u ON u.name = sru.name
SET sru.user_id = u.id
WHERE sru.user_id IS NULL;

CREATE UNIQUE INDEX uk_study_room_users_user_id ON study_room_users (user_id);
