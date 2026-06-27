-- 用户自定义头像（本地相册上传，存 data URL）

ALTER TABLE user_profiles ADD COLUMN avatar_url MEDIUMTEXT NULL AFTER avatar_seed;
