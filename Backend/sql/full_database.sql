-- =============================================================================
-- 宠学霸 · 完整数据库导入脚本（去重版）
-- 生成时间: 2026-06-28T03:35:07.670Z
-- 用法:
--   1. 宝塔 → 数据库 → 导入 → 选择本文件
--   2. 或命令行: mysql -u root -p < full_database.sql
--
-- 说明:
--   - 适用于全新空库导入
--   - 已自动跳过 schema 中已有的字段和索引，避免 Duplicate 错误
--   - 生产环境可去掉末尾 seed 段
-- =============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;


-- -----------------------------------------------------------------------------
-- 基础表结构（schema.sql）
-- -----------------------------------------------------------------------------

CREATE DATABASE IF NOT EXISTS chong_xueba DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE chong_xueba;

-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL,
  phone VARCHAR(20) UNIQUE,
  login_account VARCHAR(50) UNIQUE,
  password_hash VARCHAR(64) NOT NULL DEFAULT '',
  level INT DEFAULT 1,
  exp INT DEFAULT 0,
  exp_max INT DEFAULT 10000,
  coins INT DEFAULT 0,
  gems INT DEFAULT 0,
  streak_days INT DEFAULT 0,
  focus_today_minutes INT DEFAULT 0,
  focus_week_minutes INT DEFAULT 0,
  mood INT DEFAULT 80,
  fullness INT DEFAULT 80,
  focus_stat INT DEFAULT 80,
  medals INT DEFAULT 0,
  total_medals INT DEFAULT 45,
  vip TINYINT(1) DEFAULT 0,
  vip_expires_at DATETIME DEFAULT NULL,
  ambient_sound VARCHAR(20) DEFAULT 'rain',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 宠物表
CREATE TABLE IF NOT EXISTS pets (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  name VARCHAR(50) NOT NULL,
  level INT DEFAULT 1,
  stage VARCHAR(20) DEFAULT 'growth',
  study_power INT DEFAULT 200,
  focus_power INT DEFAULT 180,
  memory_power INT DEFAULT 150,
  discipline_power INT DEFAULT 170,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 任务表
CREATE TABLE IF NOT EXISTS tasks (
  id INT PRIMARY KEY AUTO_INCREMENT,
  type ENUM('daily', 'weekly', 'goal', 'streak') DEFAULT 'daily',
  icon VARCHAR(30) NOT NULL,
  title VARCHAR(100) NOT NULL,
  target_count INT DEFAULT 1,
  exp_reward INT DEFAULT 0,
  coin_reward INT DEFAULT 0,
  color VARCHAR(20) DEFAULT '#7864ee',
  sort_order INT DEFAULT 0
);

-- 用户任务进度
CREATE TABLE IF NOT EXISTS user_tasks (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  task_id INT NOT NULL,
  current_count INT DEFAULT 0,
  done TINYINT(1) DEFAULT 0,
  activity_date DATE NOT NULL,
  UNIQUE KEY uk_user_task_date (user_id, task_id, activity_date),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

-- 商城商品
CREATE TABLE IF NOT EXISTS mall_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL,
  icon VARCHAR(10) NOT NULL,
  price INT NOT NULL,
  price_type ENUM('coins', 'gems') DEFAULT 'coins',
  category ENUM('all', 'skin', 'furniture', 'prop', 'limited') DEFAULT 'all',
  sort_order INT DEFAULT 0
);

-- 成就定义
CREATE TABLE IF NOT EXISTS achievements (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL,
  description VARCHAR(100),
  theme VARCHAR(30) DEFAULT 'shield-gray',
  badge_theme VARCHAR(30) DEFAULT 'theme-orange'
);

-- 用户成就
CREATE TABLE IF NOT EXISTS user_achievements (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  achievement_id INT NOT NULL,
  earned_at DATE,
  UNIQUE KEY uk_user_achievement (user_id, achievement_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE
);

-- 专注记录（成长报告图表）
CREATE TABLE IF NOT EXISTS focus_records (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  record_date DATE NOT NULL,
  minutes INT NOT NULL,
  UNIQUE KEY uk_user_date (user_id, record_date),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 自习室在线用户（展示用）
CREATE TABLE IF NOT EXISTS study_room_users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL UNIQUE,
  name VARCHAR(50) NOT NULL,
  avatar_seed VARCHAR(50) NOT NULL,
  pos_x DECIMAL(5,2) NOT NULL,
  pos_y DECIMAL(5,2) NOT NULL,
  is_online TINYINT(1) DEFAULT 1,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 自习室房间（搜索/推荐/广场）
CREATE TABLE IF NOT EXISTS study_rooms (
  id INT PRIMARY KEY AUTO_INCREMENT,
  room_code VARCHAR(20) NOT NULL,
  name VARCHAR(100) NOT NULL,
  subtitle VARCHAR(150) NOT NULL DEFAULT '',
  cover_seed VARCHAR(50) NOT NULL,
  online_count INT DEFAULT 0,
  focus_rate INT DEFAULT 95,
  tags JSON NOT NULL,
  category VARCHAR(30) DEFAULT 'recommend',
  room_label VARCHAR(30) NOT NULL DEFAULT '',
  member_avatars JSON NOT NULL,
  extra_members INT DEFAULT 0,
  is_hot TINYINT(1) DEFAULT 1,
  sort_order INT DEFAULT 0,
  opened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_room_code (room_code),
  INDEX idx_name (name),
  INDEX idx_category (category)
);

-- 推荐学习搭子
CREATE TABLE IF NOT EXISTS study_buddies (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL,
  avatar_seed VARCHAR(50) NOT NULL,
  level INT DEFAULT 1,
  study_goal VARCHAR(100) NOT NULL DEFAULT '',
  status ENUM('focusing', 'available') DEFAULT 'available',
  is_recommended TINYINT(1) DEFAULT 1,
  sort_order INT DEFAULT 0,
  INDEX idx_name (name)
);

-- 搜索历史
CREATE TABLE IF NOT EXISTS study_search_history (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  keyword VARCHAR(100) NOT NULL,
  search_type ENUM('room', 'buddy', 'code') DEFAULT 'room',
  searched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_time (user_id, searched_at DESC)
);

-- 用户设置
CREATE TABLE IF NOT EXISTS user_settings (
  user_id INT PRIMARY KEY,
  phone VARCHAR(20) DEFAULT '',
  study_goal VARCHAR(100) DEFAULT '每日专注2小时',
  default_focus_minutes INT DEFAULT 25,
  study_room_preference VARCHAR(100) DEFAULT '安静模式',
  pet_interaction_freq ENUM('daily', 'weekly', 'off') DEFAULT 'daily',
  growth_report_cycle ENUM('daily', 'weekly', 'monthly') DEFAULT 'weekly',
  notify_focus_start TINYINT(1) DEFAULT 1,
  notify_task_complete TINYINT(1) DEFAULT 1,
  notify_pet_growth TINYINT(1) DEFAULT 1,
  notify_daily_checkin TINYINT(1) DEFAULT 0,
  notify_achievement TINYINT(1) DEFAULT 1,
  theme_appearance VARCHAR(30) DEFAULT 'starry',
  cache_size_mb DECIMAL(6,1) DEFAULT 23.5,
  app_version VARCHAR(20) DEFAULT 'V2.3.1',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 用户收藏
CREATE TABLE IF NOT EXISTS user_favorites (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  item_type ENUM('course', 'room', 'buddy', 'outfit', 'achievement', 'material') NOT NULL,
  title VARCHAR(100) NOT NULL,
  cover_seed VARCHAR(50) NOT NULL DEFAULT '',
  meta JSON NOT NULL,
  sort_order INT DEFAULT 0,
  favorited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_type (user_id, item_type)
);

-- 用户个人资料
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id INT PRIMARY KEY,
  avatar_seed VARCHAR(50) DEFAULT 'moon-night',
  avatar_url MEDIUMTEXT NULL,
  birthday DATE DEFAULT '2002-06-18',
  gender ENUM('female', 'male', 'other') DEFAULT 'female',
  region VARCHAR(100) DEFAULT '中国 · 山东 · 济南',
  interests VARCHAR(200) DEFAULT '自律成长 / 专注力 / 时间管理',
  signature VARCHAR(60) DEFAULT '每一天的专注，都是未来的礼物 ✨',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 排行榜虚拟用户
CREATE TABLE IF NOT EXISTS leaderboard_users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL,
  avatar_seed VARCHAR(50) NOT NULL DEFAULT 'moon-night',
  level INT NOT NULL DEFAULT 1,
  pet_emoji VARCHAR(8) NOT NULL DEFAULT '🦊',
  status ENUM('online', 'focusing', 'offline') NOT NULL DEFAULT 'offline',
  focus_today INT NOT NULL DEFAULT 0,
  focus_week INT NOT NULL DEFAULT 0,
  focus_month INT NOT NULL DEFAULT 0,
  study_today INT NOT NULL DEFAULT 0,
  study_week INT NOT NULL DEFAULT 0,
  study_month INT NOT NULL DEFAULT 0,
  growth_today INT NOT NULL DEFAULT 0,
  growth_week INT NOT NULL DEFAULT 0,
  growth_month INT NOT NULL DEFAULT 0
);


-- -----------------------------------------------------------------------------
-- 增量迁移（migrate_search.sql）
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS study_rooms (
  id INT PRIMARY KEY AUTO_INCREMENT,
  room_code VARCHAR(20) NOT NULL,
  name VARCHAR(100) NOT NULL,
  subtitle VARCHAR(150) NOT NULL DEFAULT '',
  cover_seed VARCHAR(50) NOT NULL,
  online_count INT DEFAULT 0,
  focus_rate INT DEFAULT 95,
  tags JSON NOT NULL,
  is_hot TINYINT(1) DEFAULT 1,
  sort_order INT DEFAULT 0,
  UNIQUE KEY uk_room_code (room_code),
  INDEX idx_name (name)
);

CREATE TABLE IF NOT EXISTS study_buddies (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL,
  avatar_seed VARCHAR(50) NOT NULL,
  level INT DEFAULT 1,
  study_goal VARCHAR(100) NOT NULL DEFAULT '',
  status ENUM('focusing', 'available') DEFAULT 'available',
  is_recommended TINYINT(1) DEFAULT 1,
  sort_order INT DEFAULT 0,
  INDEX idx_name (name)
);

CREATE TABLE IF NOT EXISTS study_search_history (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  keyword VARCHAR(100) NOT NULL,
  search_type ENUM('room', 'buddy', 'code') DEFAULT 'room',
  searched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_time (user_id, searched_at DESC)
);

-- -----------------------------------------------------------------------------
-- 增量迁移（migrate_plaza.sql）
-- -----------------------------------------------------------------------------

-- [已跳过] study_rooms.category 已在 schema 中存在

-- [已跳过] study_rooms.room_label 已在 schema 中存在

-- [已跳过] study_rooms.member_avatars 已在 schema 中存在

-- [已跳过] study_rooms.extra_members 已在 schema 中存在

-- [已跳过] study_rooms.opened_at 已在 schema 中存在

-- [已跳过] 索引 study_rooms.idx_category 已在 schema 中存在

-- -----------------------------------------------------------------------------
-- 增量迁移（migrate_ambient_sound.sql）
-- -----------------------------------------------------------------------------

-- [已跳过] users.ambient_sound 已在 schema 中存在

UPDATE users SET ambient_sound = 'rain' WHERE ambient_sound IS NULL OR ambient_sound = '';

-- -----------------------------------------------------------------------------
-- 增量迁移（migrate_auth_accounts.sql）
-- -----------------------------------------------------------------------------

-- [已跳过] users.phone 已在 schema 中存在

-- [已跳过] users.login_account 已在 schema 中存在

-- [已跳过] users.password_hash 已在 schema 中存在

-- [已跳过] 唯一索引 users.(phone) 已在 schema 中存在

-- [已跳过] 唯一索引 users.(login_account) 已在 schema 中存在

UPDATE users SET
  phone = '18888888888',
  login_account = 'xiaogun',
  password_hash = '9b6a656ac7fb4ac8cc2a151c0f597252d9906f8c0e21d444f66d8cb1f131f9b5'
WHERE id = 1 AND (phone IS NULL OR phone = '' OR login_account IS NULL OR login_account = '');

-- -----------------------------------------------------------------------------
-- 增量迁移（migrate_settings.sql）
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS user_settings (
  user_id INT PRIMARY KEY,
  phone VARCHAR(20) DEFAULT '',
  study_goal VARCHAR(100) DEFAULT '每日专注2小时',
  default_focus_minutes INT DEFAULT 25,
  study_room_preference VARCHAR(100) DEFAULT '安静模式',
  pet_interaction_freq ENUM('daily', 'weekly', 'off') DEFAULT 'daily',
  growth_report_cycle ENUM('daily', 'weekly', 'monthly') DEFAULT 'weekly',
  notify_focus_start TINYINT(1) DEFAULT 1,
  notify_task_complete TINYINT(1) DEFAULT 1,
  notify_pet_growth TINYINT(1) DEFAULT 1,
  notify_daily_checkin TINYINT(1) DEFAULT 0,
  notify_achievement TINYINT(1) DEFAULT 1,
  theme_appearance VARCHAR(30) DEFAULT 'starry',
  cache_size_mb DECIMAL(6,1) DEFAULT 23.5,
  app_version VARCHAR(20) DEFAULT 'V2.3.1',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

INSERT INTO user_settings (user_id, phone, study_goal, default_focus_minutes, study_room_preference, pet_interaction_freq, growth_report_cycle, notify_focus_start, notify_task_complete, notify_pet_growth, notify_daily_checkin, notify_achievement, theme_appearance, cache_size_mb, app_version)
VALUES (1, '18888888888', '每日专注2小时', 25, '安静模式', 'daily', 'weekly', 1, 1, 1, 0, 1, 'starry', 23.5, 'V2.3.1')
ON DUPLICATE KEY UPDATE phone = VALUES(phone);

-- -----------------------------------------------------------------------------
-- 增量迁移（migrate_favorites.sql）
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS user_favorites (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  item_type ENUM('course', 'room', 'buddy', 'outfit', 'achievement', 'material') NOT NULL,
  title VARCHAR(100) NOT NULL,
  cover_seed VARCHAR(50) NOT NULL DEFAULT '',
  meta JSON NOT NULL,
  sort_order INT DEFAULT 0,
  favorited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_type (user_id, item_type)
);

INSERT INTO user_favorites (user_id, item_type, title, cover_seed, meta, sort_order) VALUES
(1, 'course', '高效专注训练营', 'focus-camp', '{"tags":["专注力","自律养成"],"progress":65,"actionLabel":"继续学习","actionPath":"/focus"}', 1),
(1, 'room', '星光晚自习', 'night-deer', '{"onlineCount":132,"focusRate":95,"actionLabel":"进入房间","actionPath":"/study-room"}', 2),
(1, 'buddy', '小橙子', 'xiaocheng-girl', '{"level":23,"studyGoal":"考研英语","status":"focusing","actionLabel":"打招呼","actionPath":"/study-room/search"}', 3),
(1, 'achievement', '专注新星', 'star-medal', '{"subtitle":"累计完成 5 次专注学习任务","unlocked":true,"actionLabel":"查看成就","actionPath":"/achievement"}', 4),
(1, 'course', '番茄钟入门课', 'tomato-course', '{"tags":["番茄钟","入门"],"progress":30,"actionLabel":"继续学习","actionPath":"/focus"}', 5),
(1, 'room', '考研数学夜猫房', 'math-cat', '{"onlineCount":96,"focusRate":92,"actionLabel":"进入房间","actionPath":"/study-room/plaza"}', 6),
(1, 'buddy', '学霸兔', 'scholar-rabbit', '{"level":31,"studyGoal":"高数刷题","status":"focusing","actionLabel":"打招呼","actionPath":"/study-room/search"}', 7),
(1, 'outfit', '星光帽子', 'star-hat', '{"subtitle":"商城限定皮肤","actionLabel":"去装扮","actionPath":"/mall"}', 8),
(1, 'material', '四六级词汇表', 'cet-words', '{"subtitle":"1200 核心词汇 PDF","actionLabel":"查看资料","actionPath":""}', 9),
(1, 'achievement', '自律达人', 'discipline-medal', '{"subtitle":"连续打卡 30 天","unlocked":true,"actionLabel":"查看成就","actionPath":"/achievement"}', 10);

-- -----------------------------------------------------------------------------
-- 增量迁移（migrate_profile.sql）
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS user_profiles (
  user_id INT PRIMARY KEY,
  avatar_seed VARCHAR(50) DEFAULT 'moon-night',
  birthday DATE DEFAULT '2002-06-18',
  gender ENUM('female', 'male', 'other') DEFAULT 'female',
  region VARCHAR(100) DEFAULT '中国 · 山东 · 济南',
  interests VARCHAR(200) DEFAULT '自律成长 / 专注力 / 时间管理',
  signature VARCHAR(60) DEFAULT '每一天的专注，都是未来的礼物 ✨',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

INSERT INTO user_profiles (user_id, avatar_seed, birthday, gender, region, interests, signature)
VALUES (1, 'moon-night', '2002-06-18', 'female', '中国 · 山东 · 济南', '自律成长 / 专注力 / 时间管理', '每一天的专注，都是未来的礼物 ✨')
ON DUPLICATE KEY UPDATE avatar_seed = VALUES(avatar_seed);

UPDATE user_settings SET study_goal = '考研英语' WHERE user_id = 1;

-- -----------------------------------------------------------------------------
-- 增量迁移（migrate_avatar_url.sql）
-- -----------------------------------------------------------------------------

-- [已跳过] user_profiles.avatar_url 已在 schema 中存在

-- -----------------------------------------------------------------------------
-- 增量迁移（migrate_leaderboard.sql）
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS leaderboard_users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL,
  avatar_seed VARCHAR(50) NOT NULL DEFAULT 'moon-night',
  level INT NOT NULL DEFAULT 1,
  pet_emoji VARCHAR(8) NOT NULL DEFAULT '🦊',
  status ENUM('online', 'focusing', 'offline') NOT NULL DEFAULT 'offline',
  focus_today INT NOT NULL DEFAULT 0,
  focus_week INT NOT NULL DEFAULT 0,
  focus_month INT NOT NULL DEFAULT 0,
  study_today INT NOT NULL DEFAULT 0,
  study_week INT NOT NULL DEFAULT 0,
  study_month INT NOT NULL DEFAULT 0,
  growth_today INT NOT NULL DEFAULT 0,
  growth_week INT NOT NULL DEFAULT 0,
  growth_month INT NOT NULL DEFAULT 0
);

DELETE FROM leaderboard_users;

INSERT INTO leaderboard_users
  (name, avatar_seed, level, pet_emoji, status, focus_today, focus_week, focus_month, study_today, study_week, study_month, growth_today, growth_week, growth_month)
VALUES
  ('小星同学', 'star-fox', 23, '⭐', 'focusing', 504, 3120, 12600, 420, 2800, 11200, 320, 2100, 8600),
  ('宇航员', 'cloud-pet', 22, '🚀', 'online', 456, 2980, 11800, 390, 2650, 10500, 280, 1980, 7900),
  ('奶糖兔', 'purple-bunny', 20, '🐰', 'online', 408, 2760, 10900, 360, 2480, 9800, 250, 1820, 7200),
  ('风中的小狐狸', 'dream-cat', 21, '🦊', 'online', 372, 2540, 10100, 330, 2300, 9100, 220, 1680, 6800),
  ('小满', 'xiaogun', 19, '🐼', 'focusing', 338, 2310, 9200, 300, 2100, 8400, 200, 1520, 6100),
  ('星辰大海', 'moon-night', 21, '🐱', 'offline', 318, 2180, 8700, 285, 1980, 7900, 185, 1410, 5800),
  ('咖啡不加糖', 'math-cat', 18, '☕', 'focusing', 309, 2050, 8200, 270, 1860, 7400, 170, 1320, 5400),
  ('夜猫子', 'night-deer', 17, '🦉', 'online', 273, 1890, 7600, 240, 1720, 6900, 150, 1180, 4900),
  ('书海拾贝', 'library-owl', 20, '📚', 'offline', 252, 1760, 7100, 225, 1600, 6400, 140, 1090, 4500),
  ('追光者', 'code-bear', 18, '✨', 'online', 228, 1620, 6500, 210, 1480, 5900, 125, 980, 4100),
  ('自律少年', 'english-fox', 16, '🎯', 'focusing', 210, 1480, 5900, 195, 1350, 5400, 110, 870, 3600),
  ('学习搭子', 'japanese-rabbit', 15, '🌸', 'offline', 186, 1320, 5300, 175, 1210, 4800, 95, 760, 3200);

-- -----------------------------------------------------------------------------
-- 增量迁移（migrate_study_room_sync.sql）
-- -----------------------------------------------------------------------------

-- [已跳过] study_room_users.user_id 已在 schema 中存在

UPDATE study_room_users sru
JOIN users u ON u.name = sru.name
SET sru.user_id = u.id
WHERE sru.user_id IS NULL;

-- [已跳过] 唯一索引 study_room_users.(user_id) 已在 schema 中存在

-- -----------------------------------------------------------------------------
-- 增量迁移（migrate_study_room_accounts.sql）
-- -----------------------------------------------------------------------------

DELETE FROM study_room_users;

-- -----------------------------------------------------------------------------
-- 增量迁移（migrate_voice_room_sync.sql）
-- -----------------------------------------------------------------------------

ALTER TABLE study_voice_participants ADD COLUMN user_id INT NULL AFTER role;

UPDATE study_voice_participants p
JOIN users u ON u.name = p.name
SET p.user_id = u.id
WHERE p.user_id IS NULL AND p.role != 'center';

-- -----------------------------------------------------------------------------
-- 增量迁移（migrate_interact.sql）
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS study_interact_sessions (
  user_id INT PRIMARY KEY,
  room_code VARCHAR(20) DEFAULT 'SR-DEFAULT',
  mode ENUM('none', 'voice', 'video', 'spectate') DEFAULT 'none',
  joined_at TIMESTAMP NULL DEFAULT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

INSERT INTO study_interact_sessions (user_id, room_code, mode, joined_at)
VALUES (1, 'SR-DEFAULT', 'none', NULL)
ON DUPLICATE KEY UPDATE room_code = VALUES(room_code);

-- -----------------------------------------------------------------------------
-- 增量迁移（migrate_voice_room.sql）
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS study_voice_user_state (
  user_id INT PRIMARY KEY,
  room_code VARCHAR(20) DEFAULT 'SR-DEFAULT',
  mic_enabled TINYINT(1) DEFAULT 1,
  speaker_enabled TINYINT(1) DEFAULT 1,
  headphone_mode TINYINT(1) DEFAULT 0,
  is_speaking TINYINT(1) DEFAULT 0,
  hand_raised TINYINT(1) DEFAULT 0,
  focus_remaining_sec INT DEFAULT 2700,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS study_voice_participants (
  id INT PRIMARY KEY AUTO_INCREMENT,
  room_code VARCHAR(20) DEFAULT 'SR-DEFAULT',
  role ENUM('center', 'orbit', 'list') DEFAULT 'orbit',
  name VARCHAR(50) NOT NULL,
  avatar_seed VARCHAR(50) NOT NULL,
  pos_x DECIMAL(5,2) DEFAULT NULL,
  pos_y DECIMAL(5,2) DEFAULT NULL,
  focus_seconds INT DEFAULT 2700,
  status ENUM('focusing', 'speaking', 'hand_raise', 'muted') DEFAULT 'focusing',
  mic_on TINYINT(1) DEFAULT 1,
  list_sort INT DEFAULT 0
);

INSERT INTO study_voice_user_state (user_id, room_code, mic_enabled, speaker_enabled, focus_remaining_sec)
VALUES (1, 'SR-DEFAULT', 1, 1, 2700)
ON DUPLICATE KEY UPDATE room_code = VALUES(room_code);

INSERT INTO study_voice_participants (id, room_code, role, name, avatar_seed, pos_x, pos_y, focus_seconds, status, mic_on, list_sort) VALUES
(1, 'SR-DEFAULT', 'center', '自习猫', 'study-cat', NULL, NULL, 2700, 'focusing', 0, 0),
(2, 'SR-DEFAULT', 'orbit', '小星同学', 'star-girl', 18, 24, 2700, 'speaking', 1, 1),
(3, 'SR-DEFAULT', 'orbit', '学霸喵', 'maomao', 82, 22, 2640, 'focusing', 1, 2),
(4, 'SR-DEFAULT', 'orbit', '自律猫', 'cat', 12, 52, 2580, 'muted', 0, 3),
(5, 'SR-DEFAULT', 'orbit', '学霸狗', 'dog', 88, 50, 2520, 'focusing', 1, 4),
(6, 'SR-DEFAULT', 'orbit', '努力鸭', 'duck', 28, 78, 2460, 'hand_raise', 1, 5),
(7, 'SR-DEFAULT', 'orbit', '小鹿同学', 'deer', 72, 76, 2400, 'focusing', 1, 6),
(8, 'SR-DEFAULT', 'list', '小星同学', 'star-girl', NULL, NULL, 2700, 'speaking', 1, 1),
(9, 'SR-DEFAULT', 'list', '学霸喵', 'maomao', NULL, NULL, 2640, 'focusing', 1, 2),
(10, 'SR-DEFAULT', 'list', '自律猫', 'cat', NULL, NULL, 2580, 'focusing', 0, 3),
(11, 'SR-DEFAULT', 'list', '努力鸭', 'duck', NULL, NULL, 2460, 'hand_raise', 1, 4),
(12, 'SR-DEFAULT', 'list', '小橙', 'xiaocheng', NULL, NULL, 2700, 'focusing', 1, 5),
(13, 'SR-DEFAULT', 'list', '学霸熊', 'bear', NULL, NULL, 2520, 'focusing', 1, 6)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- -----------------------------------------------------------------------------
-- 增量迁移（migrate_video_room.sql）
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS study_video_user_state (
  user_id INT PRIMARY KEY,
  room_code VARCHAR(20) DEFAULT 'SR-DEFAULT',
  mic_enabled TINYINT(1) DEFAULT 1,
  camera_enabled TINYINT(1) DEFAULT 1,
  camera_facing ENUM('front', 'back') DEFAULT 'front',
  beauty_filter TINYINT(1) DEFAULT 1,
  background_blur TINYINT(1) DEFAULT 0,
  privacy_mode TINYINT(1) DEFAULT 1,
  screen_brightness TINYINT(1) DEFAULT 1,
  focus_remaining_sec INT DEFAULT 2700,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS study_video_participants (
  id INT PRIMARY KEY AUTO_INCREMENT,
  room_code VARCHAR(20) DEFAULT 'SR-DEFAULT',
  name VARCHAR(50) NOT NULL,
  avatar_seed VARCHAR(50) NOT NULL,
  mic_on TINYINT(1) DEFAULT 1,
  camera_on TINYINT(1) DEFAULT 1,
  sort_order INT DEFAULT 0
);

INSERT INTO study_video_user_state (user_id, room_code, mic_enabled, camera_enabled, beauty_filter, focus_remaining_sec)
VALUES (1, 'SR-DEFAULT', 1, 1, 1, 2700)
ON DUPLICATE KEY UPDATE room_code = VALUES(room_code);

INSERT INTO study_video_participants (id, room_code, name, avatar_seed, mic_on, camera_on, sort_order) VALUES
(1, 'SR-DEFAULT', '学霸狗', 'dog', 1, 1, 1),
(2, 'SR-DEFAULT', '可可猫', 'cat', 0, 1, 2),
(3, 'SR-DEFAULT', '努力鸭', 'duck', 1, 1, 3),
(4, 'SR-DEFAULT', '学霸喵', 'maomao', 1, 0, 4),
(5, 'SR-DEFAULT', '小橙', 'xiaocheng', 1, 1, 5),
(6, 'SR-DEFAULT', '小鹿同学', 'deer', 1, 1, 6)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- -----------------------------------------------------------------------------
-- 增量迁移（migrate_study_menu.sql）
-- -----------------------------------------------------------------------------

ALTER TABLE study_interact_sessions
  ADD COLUMN notify_enabled TINYINT(1) DEFAULT 1;

CREATE TABLE IF NOT EXISTS study_room_reports (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  room_code VARCHAR(20) DEFAULT 'SR-DEFAULT',
  mode VARCHAR(20) DEFAULT 'voice',
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- -----------------------------------------------------------------------------
-- 增量迁移（migrate_study_room_info.sql）
-- -----------------------------------------------------------------------------

ALTER TABLE study_rooms
  ADD COLUMN room_intro TEXT NULL AFTER subtitle,
  ADD COLUMN entry_method VARCHAR(50) DEFAULT '自由加入' AFTER room_intro,
  ADD COLUMN rules_summary VARCHAR(200) DEFAULT '' AFTER entry_method,
  ADD COLUMN host_name VARCHAR(50) DEFAULT '' AFTER rules_summary,
  ADD COLUMN host_seed VARCHAR(50) DEFAULT '' AFTER host_name,
  ADD COLUMN display_number VARCHAR(20) DEFAULT '' AFTER host_seed;

INSERT INTO study_rooms (
  room_code, name, subtitle, room_intro, entry_method, rules_summary,
  host_name, host_seed, display_number, cover_seed, online_count, focus_rate,
  tags, category, room_label, member_avatars, extra_members, sort_order, opened_at
) VALUES (
  'SR-DEFAULT',
  '星光自习室',
  '在星光下专注，在陪伴中成长',
  '一起专注学习，互相陪伴，共同进步，让每一天都成为更好的自己！✨',
  '自由加入',
  '友善交流 | 禁止广告 | 专注学习',
  '小星同学',
  'star-girl',
  '123456',
  'night-deer',
  128,
  96,
  '["专注学习", "自习打卡", "考研备考", "自律成长"]',
  'recommend',
  '官方',
  '["star-girl", "maomao", "cat", "dog", "duck"]',
  120,
  0,
  NOW()
)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  subtitle = VALUES(subtitle),
  room_intro = VALUES(room_intro),
  entry_method = VALUES(entry_method),
  rules_summary = VALUES(rules_summary),
  host_name = VALUES(host_name),
  host_seed = VALUES(host_seed),
  display_number = VALUES(display_number),
  cover_seed = VALUES(cover_seed),
  tags = VALUES(tags);

-- -----------------------------------------------------------------------------
-- 增量迁移（migrate_study_invite.sql）
-- -----------------------------------------------------------------------------

ALTER TABLE user_profiles
  ADD COLUMN invite_code VARCHAR(20) NULL AFTER avatar_seed;

CREATE TABLE IF NOT EXISTS study_invite_stats (
  user_id INT PRIMARY KEY,
  invited_count INT DEFAULT 0,
  total_stars INT DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS study_invite_records (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  invitee_name VARCHAR(50) NOT NULL,
  invite_channel ENUM('buddy', 'wechat', 'qq', 'link', 'qrcode', 'now') DEFAULT 'buddy',
  reward_stars INT DEFAULT 10,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_time (user_id, created_at DESC)
);

UPDATE user_profiles SET invite_code = 'XGZY-2026' WHERE user_id = 1 AND (invite_code IS NULL OR invite_code = '');

INSERT INTO study_invite_stats (user_id, invited_count, total_stars) VALUES (1, 1, 10)
ON DUPLICATE KEY UPDATE invited_count = VALUES(invited_count), total_stars = VALUES(total_stars);

INSERT INTO study_invite_records (user_id, invitee_name, invite_channel, reward_stars, created_at) VALUES
(1, '阿白', 'buddy', 10, DATE_SUB(NOW(), INTERVAL 2 DAY));

-- -----------------------------------------------------------------------------
-- 增量迁移（migrate_video_focus_ai.sql）
-- -----------------------------------------------------------------------------

ALTER TABLE study_video_user_state
  ADD COLUMN ai_focus_enabled TINYINT(1) DEFAULT 1 AFTER screen_brightness,
  ADD COLUMN ai_alert_level VARCHAR(20) DEFAULT 'standard' AFTER ai_focus_enabled;

CREATE TABLE IF NOT EXISTS study_video_focus_sessions (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  room_code VARCHAR(20) DEFAULT 'SR-DEFAULT',
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP NULL,
  focus_score_avg INT DEFAULT 100,
  effective_seconds INT DEFAULT 0,
  distracted_count INT DEFAULT 0,
  away_seconds INT DEFAULT 0,
  phone_suspect_count INT DEFAULT 0,
  sample_count INT DEFAULT 0,
  exp_reward INT DEFAULT 0,
  pet_exp_reward INT DEFAULT 0,
  task_completed TINYINT(1) DEFAULT 0,
  INDEX idx_user_started (user_id, started_at),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS study_video_focus_events (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  session_id BIGINT NOT NULL,
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  score INT NOT NULL,
  status VARCHAR(24) NOT NULL,
  metrics_json JSON NULL,
  INDEX idx_session_time (session_id, recorded_at),
  FOREIGN KEY (session_id) REFERENCES study_video_focus_sessions(id) ON DELETE CASCADE
);

UPDATE study_video_user_state SET ai_focus_enabled = 1, ai_alert_level = 'standard' WHERE ai_focus_enabled IS NULL;

-- -----------------------------------------------------------------------------
-- 增量迁移（migrate_pet_nurture.sql）
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS pet_nurture_daily (
  user_id INT NOT NULL,
  nurture_key VARCHAR(32) NOT NULL,
  count_value INT DEFAULT 0,
  activity_date DATE NOT NULL,
  PRIMARY KEY (user_id, nurture_key, activity_date),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

ALTER TABLE pets ADD COLUMN exp INT DEFAULT 1260;

ALTER TABLE pets ADD COLUMN exp_max INT DEFAULT 2000;

ALTER TABLE pets ADD COLUMN vitality INT DEFAULT 156;

ALTER TABLE pets ADD COLUMN intimacy_exp INT DEFAULT 320;

ALTER TABLE pets ADD COLUMN intimacy_exp_max INT DEFAULT 500;

ALTER TABLE pets ADD COLUMN intimacy_level INT DEFAULT 4;

ALTER TABLE pets ADD COLUMN growth_stars INT DEFAULT 23;

UPDATE pets SET
  exp = 1260,
  exp_max = 2000,
  vitality = COALESCE(memory_power, 156),
  intimacy_exp = 320,
  intimacy_exp_max = 500,
  intimacy_level = 4,
  growth_stars = COALESCE(level, 23)
WHERE exp IS NULL OR exp = 0;

INSERT INTO pet_nurture_daily (user_id, nurture_key, count_value, activity_date)
SELECT 1, 'accompany_minutes', 6, CURDATE()
WHERE NOT EXISTS (
  SELECT 1 FROM pet_nurture_daily
  WHERE user_id = 1 AND nurture_key = 'accompany_minutes' AND activity_date = CURDATE()
);

INSERT INTO pet_nurture_daily (user_id, nurture_key, count_value, activity_date)
SELECT 1, 'pomodoro', 2, CURDATE()
WHERE NOT EXISTS (
  SELECT 1 FROM pet_nurture_daily
  WHERE user_id = 1 AND nurture_key = 'pomodoro' AND activity_date = CURDATE()
);

-- -----------------------------------------------------------------------------
-- 增量迁移（migrate_tasks_center.sql）
-- -----------------------------------------------------------------------------

ALTER TABLE tasks
  ADD COLUMN description VARCHAR(255) DEFAULT NULL,
  ADD COLUMN difficulty TINYINT DEFAULT 3,
  ADD COLUMN progress_unit VARCHAR(20) DEFAULT 'times',
  ADD COLUMN steps JSON DEFAULT NULL,
  ADD COLUMN pet_rewards JSON DEFAULT NULL,
  ADD COLUMN action_route VARCHAR(50) DEFAULT NULL;

ALTER TABLE tasks
  MODIFY COLUMN type ENUM('daily', 'weekly', 'goal', 'streak', 'event') DEFAULT 'daily';

ALTER TABLE user_tasks
  ADD COLUMN completed_at DATETIME DEFAULT NULL;

CREATE TABLE IF NOT EXISTS activity_chest_claims (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  tier TINYINT NOT NULL,
  claim_date DATE NOT NULL,
  UNIQUE KEY uk_user_tier_date (user_id, tier, claim_date),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS check_in_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  title VARCHAR(50) NOT NULL,
  icon VARCHAR(30) DEFAULT 'sun',
  is_preset TINYINT(1) DEFAULT 0,
  sort_order INT DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS check_ins (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  item_id INT NOT NULL,
  check_date DATE NOT NULL,
  UNIQUE KEY uk_user_item_date (user_id, item_id, check_date),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (item_id) REFERENCES check_in_items(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS coin_transactions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  amount INT NOT NULL,
  reason VARCHAR(50) NOT NULL,
  ref_id VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

UPDATE tasks SET
  description = '在专注模式或自习室完成有效专注',
  difficulty = 2,
  progress_unit = 'minutes',
  target_count = 25,
  steps = '["进入专注模式或自习室","开启计时并完成25分钟","返回任务中心领取奖励"]',
  pet_rewards = '{"focus":3,"study":2}',
  action_route = '/focus'
WHERE type = 'daily' AND icon = 'clock';

UPDATE tasks SET
  description = '完成练习题巩固知识点',
  difficulty = 2,
  progress_unit = 'times',
  steps = '["打开学习任务","完成指定数量练习","标记任务完成"]',
  pet_rewards = '{"study":3}'
WHERE type = 'daily' AND icon = 'book';

UPDATE tasks SET
  description = '在宠物页完成一次喂养互动',
  difficulty = 1,
  progress_unit = 'times',
  pet_rewards = '{"intimacy":5}',
  action_route = '/pet'
WHERE type = 'daily' AND icon = 'paw';

UPDATE tasks SET
  description = '进入任意自习室并完成一次学习',
  difficulty = 2,
  progress_unit = 'times',
  pet_rewards = '{"focus":2}',
  action_route = '/study-room'
WHERE type = 'daily' AND icon = 'users';

UPDATE tasks SET
  description = '分享你的成长报告给好友',
  difficulty = 1,
  progress_unit = 'times',
  pet_rewards = '{"intimacy":3}',
  action_route = '/growth'
WHERE type = 'daily' AND icon = 'share-nodes';

INSERT INTO tasks (type, icon, title, description, difficulty, target_count, progress_unit, exp_reward, coin_reward, color, sort_order, steps, pet_rewards, action_route)
SELECT 'weekly', 'calendar-check', '本周专注5天', '本周至少5天完成25分钟专注', 3, 5, 'days', 200, 150, '#7b61ff', 1,
  '["每天完成一次专注","累计5天即可达成","周末前完成奖励更丰厚"]', '{"focus":8,"study":5}', '/focus'
WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE type = 'weekly' AND title = '本周专注5天');

INSERT INTO tasks (type, icon, title, description, difficulty, target_count, progress_unit, exp_reward, coin_reward, color, sort_order, steps, pet_rewards, action_route)
SELECT 'weekly', 'list-check', '完成10个每日任务', '本周累计完成10个每日任务', 4, 10, 'times', 260, 180, '#6366f1', 2,
  '["完成每日任务","累计进度自动更新","达成后领取周挑战奖励"]', '{"study":6,"discipline":4}', '/tasks'
WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE type = 'weekly' AND title = '完成10个每日任务');

INSERT INTO tasks (type, icon, title, description, difficulty, target_count, progress_unit, exp_reward, coin_reward, color, sort_order, steps, pet_rewards, action_route)
SELECT 'weekly', 'fire', '连续打卡7天', '保持7天不间断学习打卡', 4, 7, 'days', 300, 220, '#f97316', 3,
  '["每日完成签到或任务","保持连续天数","达成后可获得额外奖励"]', '{"intimacy":10}', '/checkin'
WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE type = 'weekly' AND title = '连续打卡7天');

INSERT INTO tasks (type, icon, title, description, difficulty, target_count, progress_unit, exp_reward, coin_reward, color, sort_order, steps, pet_rewards, action_route)
SELECT 'event', 'gift', '限时·累计专注10小时', '本月累计专注达到10小时', 4, 600, 'minutes', 500, 300, '#a855f7', 1,
  '["任意场景完成专注","进度自动累计","活动结束前达成即可"]', '{"focus":12,"study":8}', '/focus'
WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE type = 'event' AND title = '限时·累计专注10小时');

INSERT INTO tasks (type, icon, title, description, difficulty, target_count, progress_unit, exp_reward, coin_reward, color, sort_order, steps, pet_rewards, action_route)
SELECT 'event', 'star', '限时·完成20个任务', '本月累计完成20个任务', 5, 20, 'times', 600, 400, '#ec4899', 2,
  '["完成每日/每周任务","进度实时更新","领取限定活动奖励"]', '{"study":10,"intimacy":8}', '/tasks'
WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE type = 'event' AND title = '限时·完成20个任务');

INSERT INTO check_in_items (user_id, title, icon, is_preset, sort_order)
SELECT u.id, '早起学习', 'sun', 1, 1 FROM users u
WHERE NOT EXISTS (SELECT 1 FROM check_in_items c WHERE c.user_id = u.id AND c.title = '早起学习');

INSERT INTO check_in_items (user_id, title, icon, is_preset, sort_order)
SELECT u.id, '完成专注', 'clock', 1, 2 FROM users u
WHERE NOT EXISTS (SELECT 1 FROM check_in_items c WHERE c.user_id = u.id AND c.title = '完成专注');

INSERT INTO check_in_items (user_id, title, icon, is_preset, sort_order)
SELECT u.id, '阅读30分钟', 'book', 1, 3 FROM users u
WHERE NOT EXISTS (SELECT 1 FROM check_in_items c WHERE c.user_id = u.id AND c.title = '阅读30分钟');

INSERT INTO check_in_items (user_id, title, icon, is_preset, sort_order)
SELECT u.id, '运动锻炼', 'heart', 1, 4 FROM users u
WHERE NOT EXISTS (SELECT 1 FROM check_in_items c WHERE c.user_id = u.id AND c.title = '运动锻炼');

-- -----------------------------------------------------------------------------
-- 增量迁移（migrate_mall.sql）
-- -----------------------------------------------------------------------------

ALTER TABLE mall_items
  ADD COLUMN description VARCHAR(255) DEFAULT NULL AFTER icon;

ALTER TABLE mall_items
  ADD COLUMN tag VARCHAR(20) DEFAULT NULL AFTER description;

ALTER TABLE mall_items
  ADD COLUMN tag_color VARCHAR(20) DEFAULT NULL AFTER tag;

CREATE TABLE IF NOT EXISTS mall_purchases (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  item_id INT NOT NULL,
  purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_user_item (user_id, item_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (item_id) REFERENCES mall_items(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS mall_cart_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  item_id INT NOT NULL,
  quantity INT DEFAULT 1,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_user_item (user_id, item_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (item_id) REFERENCES mall_items(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS mall_orders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  order_no VARCHAR(32) NOT NULL,
  total INT NOT NULL,
  status ENUM('pending', 'done', 'claim') DEFAULT 'pending',
  address VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS mall_order_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_id INT NOT NULL,
  item_id INT NOT NULL,
  name VARCHAR(50) NOT NULL,
  price INT NOT NULL,
  quantity INT DEFAULT 1,
  image VARCHAR(10) DEFAULT NULL,
  FOREIGN KEY (order_id) REFERENCES mall_orders(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS mall_outfits (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  name VARCHAR(50) DEFAULT 'default',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS mall_outfit_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  outfit_id INT NOT NULL,
  item_id INT NOT NULL,
  category INT DEFAULT 0,
  FOREIGN KEY (outfit_id) REFERENCES mall_outfits(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS medals (
  id VARCHAR(40) PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(50) NOT NULL,
  description VARCHAR(120) DEFAULT NULL,
  icon VARCHAR(40) DEFAULT 'medal',
  category ENUM('study', 'focus', 'streak', 'special') NOT NULL,
  earned TINYINT(1) DEFAULT 0,
  earned_date VARCHAR(10) DEFAULT NULL,
  rarity ENUM('common', 'rare', 'epic', 'legendary') DEFAULT 'common',
  color VARCHAR(20) DEFAULT '#60a5fa',
  progress_current DECIMAL(6,1) DEFAULT NULL,
  progress_total DECIMAL(6,1) DEFAULT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

DELETE FROM mall_items;

INSERT INTO mall_items (id, name, icon, description, tag, tag_color, price, price_type, category, sort_order) VALUES
(1, '星空书包', '🎒', '紫色猫耳双肩包，附星光特效，背上后宠物外观增加星空粒子效果。', '稀有', '#f472b6', 980, 'coins', 'skin', 1),
(2, '魔法帽', '🎩', '巫师风格尖顶帽，带魔法光泽质感。', '热门', '#f97316', 680, 'coins', 'skin', 2),
(3, '学者眼镜', '👓', '金丝边圆框眼镜，增加学者气质。', NULL, NULL, 320, 'coins', 'skin', 3),
(4, '猫耳发箍', '🎀', '可爱猫耳造型发箍，粉紫渐变配色。', NULL, NULL, 220, 'coins', 'skin', 4),
(5, '云朵小床', '☁️', '柔软云朵造型宠物床，宠物休息时恢复速度+20%。', '限定', '#8b5cf6', 880, 'coins', 'furniture', 5),
(6, '学习桌', '🪑', '紫色系书桌套装，含台灯与书架。', NULL, NULL, 1280, 'coins', 'furniture', 6),
(7, '星空地毯', '🌟', '星辰图案圆形地毯，铺在宠物小屋前。', NULL, NULL, 420, 'coins', 'furniture', 7),
(8, '小橙玩偶', '🧸', '小橙同款毛绒公仔，手感超软。', NULL, NULL, 450, 'coins', 'prop', 8),
(9, '专注计时器', '⏱️', '番茄钟造型桌面摆件，学习氛围+1。', NULL, NULL, 240, 'coins', 'prop', 9),
(10, '许愿瓶', '🫙', '星光许愿玻璃瓶，内含闪烁星砂。', '新品', '#34d399', 160, 'coins', 'prop', 10),
(11, '星空笔记本', '📓', '紫色星空封面手账，内页含星座图案。', NULL, NULL, 180, 'coins', 'prop', 11),
(12, '周年限定礼盒', '🎁', '一周年纪念限定套装，含全部限定外观。', '限定', '#fbbf24', 2480, 'coins', 'limited', 12);

INSERT IGNORE INTO mall_purchases (user_id, item_id) VALUES
(1, 1), (1, 2), (1, 3), (1, 4);

INSERT IGNORE INTO mall_cart_items (user_id, item_id, quantity) VALUES
(1, 5, 1);

INSERT INTO mall_orders (id, user_id, order_no, total, status, created_at) VALUES
(1, 1, 'ORD-20240601-001', 980, 'pending', '2026-06-01 10:30:00'),
(2, 1, 'ORD-20240528-002', 680, 'done', '2026-05-28 14:20:00'),
(3, 1, 'ORD-20240520-003', 1760, 'claim', '2026-05-20 09:15:00')
ON DUPLICATE KEY UPDATE order_no = VALUES(order_no);

INSERT INTO mall_order_items (order_id, item_id, name, price, quantity, image) VALUES
(1, 1, '星空书包', 980, 1, '🎒'),
(2, 2, '魔法帽', 680, 1, '🎩'),
(3, 5, '云朵小床', 880, 2, '☁️')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT IGNORE INTO mall_outfits (id, user_id, name) VALUES (1, 1, 'default');

INSERT IGNORE INTO mall_outfit_items (outfit_id, item_id, category) VALUES
(1, 1, 1), (1, 2, 1), (1, 3, 1);

INSERT INTO medals (id, user_id, name, description, icon, category, earned, earned_date, rarity, color) VALUES
('mall_first', 1, '首次购物', '在商城购买第一件商品', 'bag-shopping', 'special', 0, NULL, 'common', '#f472b6')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- -----------------------------------------------------------------------------
-- 增量迁移（migrate_achievements.sql）
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS medals (
  id VARCHAR(40) PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(50) NOT NULL,
  description VARCHAR(120) DEFAULT NULL,
  icon VARCHAR(40) DEFAULT 'medal',
  category ENUM('study', 'focus', 'streak', 'special') NOT NULL,
  earned TINYINT(1) DEFAULT 0,
  earned_date VARCHAR(10) DEFAULT NULL,
  rarity ENUM('common', 'rare', 'epic', 'legendary') DEFAULT 'common',
  color VARCHAR(20) DEFAULT '#60a5fa',
  progress_current DECIMAL(6,1) DEFAULT NULL,
  progress_total DECIMAL(6,1) DEFAULT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS pet_catalog (
  id VARCHAR(40) PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(50) NOT NULL,
  type VARCHAR(30) DEFAULT NULL,
  unlocked TINYINT(1) DEFAULT 0,
  level INT DEFAULT 1,
  image VARCHAR(255) DEFAULT NULL,
  description VARCHAR(255) DEFAULT NULL,
  unlock_condition VARCHAR(100) DEFAULT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS growth_memories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  memory_date DATE NOT NULL,
  title VARCHAR(80) NOT NULL,
  description VARCHAR(255) DEFAULT NULL,
  icon VARCHAR(40) DEFAULT 'star',
  color VARCHAR(20) DEFAULT '#fbbf24',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

INSERT INTO medals (id, user_id, name, description, icon, category, earned, earned_date, rarity, color, progress_current, progress_total) VALUES
('first_study', 1, '初次学习', '完成第一次学习任务', 'book-open-reader', 'study', 1, '06-15', 'common', '#60a5fa', NULL, NULL),
('study_10h', 1, '学霸初成', '累计学习10小时', 'brain', 'study', 1, '06-18', 'common', '#60a5fa', NULL, NULL),
('study_50h', 1, '知识渊博', '累计学习50小时', 'trophy', 'study', 1, '06-24', 'rare', '#818cf8', NULL, NULL),
('study_100h', 1, '学习大师', '累计学习100小时', 'crown', 'study', 0, NULL, 'epic', '#a78bfa', 78, 100),
('perfect_week', 1, '完美一周', '连续7天完成所有任务', 'calendar-check', 'study', 1, '06-21', 'rare', '#818cf8', NULL, NULL),
('night_owl', 1, '夜猫子', '在22:00后完成学习', 'moon', 'study', 1, '06-19', 'common', '#60a5fa', NULL, NULL),
('first_focus', 1, '初次专注', '完成第一次专注任务', 'bullseye', 'focus', 1, '06-14', 'common', '#f59e0b', NULL, NULL),
('focus_1h', 1, '专注新人', '单次专注超过1小时', 'clock', 'focus', 1, '06-20', 'common', '#f59e0b', NULL, NULL),
('focus_3h', 1, '深度专注', '单次专注超过3小时', 'fire', 'focus', 0, NULL, 'rare', '#f97316', 2.5, 3),
('focus_marathon', 1, '专注马拉松', '单次专注超过5小时', 'trophy', 'focus', 0, NULL, 'epic', '#ef4444', 2.5, 5),
('flow_state', 1, '心流状态', '一周内达成5次深度专注', 'bolt', 'focus', 1, '06-25', 'rare', '#f97316', NULL, NULL),
('streak_3', 1, '三天打鱼', '连续打卡3天', 'list-check', 'streak', 1, '06-17', 'common', '#34d399', NULL, NULL),
('streak_7', 1, '一周之约', '连续打卡7天', 'clock', 'streak', 1, '06-21', 'common', '#34d399', NULL, NULL),
('streak_30', 1, '月度之星', '连续打卡30天', 'medal', 'streak', 0, NULL, 'epic', '#10b981', 23, 30),
('streak_100', 1, '百日筑基', '连续打卡100天', 'gem', 'streak', 0, NULL, 'legendary', '#fbbf24', 23, 100),
('first_pet', 1, '初次相遇', '领养第一只宠物', 'heart', 'special', 1, '06-13', 'common', '#f472b6', NULL, NULL),
('pet_master', 1, '宠物达人', '宠物达到20级', 'paw', 'special', 1, '06-26', 'rare', '#e879f9', NULL, NULL),
('mall_first', 1, '首次购物', '在商城购买第一件商品', 'bag-shopping', 'special', 0, NULL, 'common', '#f472b6', NULL, NULL),
('collector', 1, '收藏家', '收集全部家具', 'box-open', 'special', 0, NULL, 'epic', '#e879f9', 8, 20)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description),
  icon = VALUES(icon),
  category = VALUES(category),
  rarity = VALUES(rarity),
  color = VALUES(color),
  progress_current = COALESCE(VALUES(progress_current), progress_current),
  progress_total = COALESCE(VALUES(progress_total), progress_total);

INSERT INTO pet_catalog (id, user_id, name, type, unlocked, level, description) VALUES
('tororo', 1, '山药泥', '白猫', 1, 23, 'Live2D 官方示例模型 · 白猫'),
('hijiki', 1, '羊栖菜', '黑猫', 1, 15, 'Live2D 官方示例模型 · 黑猫')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  type = VALUES(type),
  unlocked = VALUES(unlocked),
  level = VALUES(level),
  description = VALUES(description);

DELETE FROM growth_memories WHERE user_id = 1;

INSERT INTO growth_memories (user_id, memory_date, title, description, icon, color) VALUES
(1, '2026-06-13', '旅程开始', '注册宠学霸，领养了第一只宠物「小橙」', 'star', '#fbbf24'),
(1, '2026-06-14', '第一次专注', '完成首次25分钟番茄钟专注', 'bullseye', '#60a5fa'),
(1, '2026-06-17', '三天打卡', '连续3天完成学习打卡，获得「三天打鱼」勋章', 'calendar-check', '#34d399'),
(1, '2026-06-21', '完美一周', '连续7天完成所有每日任务，解锁「完美一周」成就', 'trophy', '#818cf8'),
(1, '2026-06-23', '宠物进化', '小橙达到20级，解锁新外观', 'paw', '#f472b6'),
(1, '2026-06-25', '心流时刻', '本周达成5次深度专注，获得「心流状态」勋章', 'fire', '#f97316'),
(1, '2026-06-26', '宠物达人', '宠物达到20级，解锁「宠物达人」成就', 'medal', '#e879f9');

UPDATE users SET medals = (
  SELECT COUNT(*) FROM medals WHERE user_id = users.id AND earned = 1
), total_medals = (
  SELECT COUNT(*) FROM medals WHERE user_id = users.id
) WHERE id = 1;

-- -----------------------------------------------------------------------------
-- 增量迁移（migrate_vip.sql）
-- -----------------------------------------------------------------------------

-- [已跳过] users.vip_expires_at 已在 schema 中存在

CREATE TABLE IF NOT EXISTS vip_subscriptions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  plan_id VARCHAR(20) NOT NULL,
  plan_name VARCHAR(50) NOT NULL,
  pay_method VARCHAR(20) NOT NULL,
  amount INT NOT NULL DEFAULT 0,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

UPDATE users SET vip = 1, vip_expires_at = '2026-12-31 23:59:59' WHERE id = 1 AND vip = 1;

-- -----------------------------------------------------------------------------
-- 增量迁移（migrate_study_room_create.sql）
-- -----------------------------------------------------------------------------

ALTER TABLE study_rooms ADD COLUMN study_mode VARCHAR(20) DEFAULT 'quiet' AFTER category;

ALTER TABLE study_rooms ADD COLUMN is_private TINYINT(1) DEFAULT 0 AFTER study_mode;

ALTER TABLE study_rooms ADD COLUMN room_password VARCHAR(20) DEFAULT NULL AFTER is_private;

ALTER TABLE study_rooms ADD COLUMN duration_minutes INT DEFAULT 45 AFTER room_password;

ALTER TABLE study_rooms ADD COLUMN max_members INT DEFAULT 8 AFTER duration_minutes;

ALTER TABLE study_rooms ADD COLUMN mic_enabled TINYINT(1) DEFAULT 1 AFTER max_members;

ALTER TABLE study_rooms ADD COLUMN camera_enabled TINYINT(1) DEFAULT 1 AFTER mic_enabled;

ALTER TABLE study_rooms ADD COLUMN atmosphere_id VARCHAR(30) DEFAULT 'starry-night' AFTER camera_enabled;

ALTER TABLE study_rooms ADD COLUMN creator_user_id INT DEFAULT NULL AFTER atmosphere_id;

-- -----------------------------------------------------------------------------
-- 种子数据（seed.sql）
-- -----------------------------------------------------------------------------

USE chong_xueba;

INSERT INTO users (id, name, level, exp, exp_max, coins, gems, streak_days, focus_today_minutes, focus_week_minutes, mood, fullness, focus_stat, medals, total_medals, vip, vip_expires_at, ambient_sound)
VALUES (1, '小棍同学', 23, 7850, 10000, 12450, 128, 23, 155, 1125, 92, 78, 85, 18, 45, 1, '2026-12-31 23:59:59', 'rain')
ON DUPLICATE KEY UPDATE name = VALUES(name), vip_expires_at = VALUES(vip_expires_at);

INSERT INTO pets (user_id, name, level, stage, study_power, focus_power, memory_power, discipline_power)
SELECT 1, '小橙', 23, 'growth', 232, 198, 156, 189
WHERE NOT EXISTS (SELECT 1 FROM pets WHERE user_id = 1);

INSERT INTO tasks (type, icon, title, target_count, exp_reward, coin_reward, color, sort_order) VALUES
('daily', 'clock', '专注学习 25 分钟', 1, 60, 50, '#7864ee', 1),
('daily', 'book', '完成 3 道练习题', 3, 40, 30, '#8069f1', 2),
('daily', 'paw', '喂养宠物 1 次', 1, 20, 20, '#9c6cea', 3),
('daily', 'users', '加入自习室学习', 1, 80, 60, '#607ded', 4),
('daily', 'share-nodes', '分享成长报告', 1, 30, 40, '#a16be2', 5);

INSERT INTO user_tasks (user_id, task_id, current_count, done, activity_date)
SELECT 1, t.id,
  CASE t.sort_order WHEN 2 THEN 1 WHEN 3 THEN 1 ELSE 0 END,
  CASE t.sort_order WHEN 3 THEN 1 ELSE 0 END,
  CURDATE()
FROM tasks t
WHERE t.type = 'daily'
ON DUPLICATE KEY UPDATE current_count = VALUES(current_count), done = VALUES(done);

INSERT INTO mall_items (name, icon, price, price_type, category, sort_order) VALUES
('学霸背包', '🎒', 280, 'coins', 'prop', 1),
('星光帽子', '🎩', 150, 'coins', 'skin', 2),
('魔法围巾', '🧣', 320, 'coins', 'skin', 3),
('学习桌', '🪑', 500, 'coins', 'furniture', 4),
('星空床', '🛏️', 800, 'gems', 'furniture', 5),
('经验加倍卡', '⚡', 50, 'gems', 'prop', 6),
('专注药水', '🧪', 120, 'coins', 'prop', 7),
('限定皮肤', '✨', 200, 'gems', 'limited', 8),
('宠物玩具', '🎾', 90, 'coins', 'prop', 9);

INSERT INTO achievements (name, description, theme, badge_theme) VALUES
('专注大师', '累计专注100小时', 'shield-green', 'theme-orange'),
('自律达人', '连续打卡30天', 'shield-blue', 'theme-pink'),
('学霸之星', '累计专注200小时', 'shield-gold', 'theme-blue'),
('百发百中', '任务完成率100%', 'shield-purple', 'theme-orange'),
('博览群书', '完成50次学习', 'shield-teal', 'theme-pink'),
('初露锋芒', '首次获得勋章', 'shield-orange', 'theme-blue'),
('飞速成长', '等级达到30级', 'shield-gray', 'theme-orange'),
('学霸之王', '排行榜第1名', 'shield-gray', 'theme-pink'),
('毕业纪念', '完成全部课程', 'shield-gray', 'theme-blue');

INSERT INTO user_achievements (user_id, achievement_id, earned_at)
SELECT 1, id, DATE_SUB(CURDATE(), INTERVAL (10 - id) DAY)
FROM achievements WHERE id <= 6
ON DUPLICATE KEY UPDATE earned_at = VALUES(earned_at);

INSERT INTO focus_records (user_id, record_date, minutes) VALUES
(1, DATE_SUB(CURDATE(), INTERVAL 30 DAY), 8505),
(1, DATE_SUB(CURDATE(), INTERVAL 7 DAY), 108),
(1, DATE_SUB(CURDATE(), INTERVAL 6 DAY), 69),
(1, DATE_SUB(CURDATE(), INTERVAL 5 DAY), 141),
(1, DATE_SUB(CURDATE(), INTERVAL 4 DAY), 75),
(1, DATE_SUB(CURDATE(), INTERVAL 3 DAY), 138),
(1, DATE_SUB(CURDATE(), INTERVAL 2 DAY), 81),
(1, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 159),
(1, CURDATE(), 84)
ON DUPLICATE KEY UPDATE minutes = VALUES(minutes);

INSERT INTO study_room_users (user_id, name, avatar_seed, pos_x, pos_y) VALUES
(1, '小棍同学', 'moon-night', 13, 45),
(2, '学霸喵', 'maomao', 87, 44),
(4, '夜读熊', 'bear', 33, 62),
(5, '星光鹿', 'deer', 62, 60),
(3, '自律狐', 'xiaocheng', 47, 80),
(6, '努力鸭', 'nuli', 82, 76);

INSERT INTO study_rooms (room_code, name, subtitle, cover_seed, online_count, focus_rate, tags, category, room_label, member_avatars, extra_members, sort_order, opened_at) VALUES
('SR-8821', '英语冲刺室', '四六级真题精练 · 全程相伴', 'english-fox', 128, 95, '["四六级", "英语"]', 'cet', '英语', '["xiaocheng", "maomao", "bear", "deer"]', 12, 1, DATE_SUB(NOW(), INTERVAL 2 HOUR)),
('SR-6612', '考研数学夜猫房', '高数线代概率 · 难题共创', 'math-cat', 96, 92, '["考研", "数学"]', 'kaoyan', '考研', '["bear", "deer", "cat", "dog"]', 8, 2, DATE_SUB(NOW(), INTERVAL 5 HOUR)),
('SR-3308', '星光晚自习', '晚间沉浸学习，拒绝内耗', 'night-deer', 132, 95, '["晚间", "自律"]', 'recommend', '自律', '["xiaocheng", "maomao", "nuli", "cat", "dog"]', 8, 3, DATE_SUB(NOW(), INTERVAL 1 HOUR)),
('SR-1205', 'AI 专注舱', '摄像头监督 + 番茄钟陪练', 'code-bear', 86, 93, '["AI", "专注"]', 'hot', 'AI陪练', '["maomao", "bear", "deer", "nuli"]', 6, 4, DATE_SUB(NOW(), INTERVAL 3 HOUR)),
('SR-9903', '番茄冲刺房', '25 分钟一轮，互相监督', 'japanese-rabbit', 74, 91, '["番茄", "冲刺"]', 'hot', '番茄', '["cat", "dog", "nuli", "xiaocheng"]', 5, 5, DATE_SUB(NOW(), INTERVAL 6 HOUR)),
('SR-4410', '深夜图书馆', '安静模式 · 仅白噪音陪伴', 'library-owl', 58, 96, '["安静", "深夜"]', 'recommend', '安静', '["deer", "bear", "maomao"]', 4, 6, DATE_SUB(NOW(), INTERVAL 8 HOUR)),
('SR-5520', '编程刷题室', 'LeetCode 每日一题 · 互相监督', 'code-bear', 52, 90, '["编程", "算法"]', 'code', '编程', '["dog", "cat", "bear"]', 3, 7, DATE_SUB(NOW(), INTERVAL 12 HOUR)),
('SR-6630', '日语入门房', '五十音 + 日常会话 · 轻松跟学', 'japanese-rabbit', 38, 86, '["日语", "语言"]', 'language', '语言', '["nuli", "xiaocheng", "deer"]', 2, 8, DATE_SUB(NOW(), INTERVAL 1 DAY));

INSERT INTO study_buddies (name, avatar_seed, level, study_goal, status, sort_order) VALUES
('小橙子', 'xiaocheng-girl', 23, '考研英语', 'focusing', 1),
('阿白', 'abai-panda', 18, '四六级', 'available', 2),
('学霸兔', 'scholar-rabbit', 31, '高数刷题', 'focusing', 3),
('努力鸭', 'nuli-duck', 15, '晚间自律', 'available', 4),
('小鹿同学', 'deer-buddy', 20, '考研政治', 'focusing', 5);

INSERT INTO study_search_history (user_id, keyword, search_type) VALUES
(1, '英语四六级', 'room'),
(1, '考研数学', 'room'),
(1, '晚间自律房', 'room');

INSERT INTO user_settings (user_id, phone, study_goal, default_focus_minutes, study_room_preference, pet_interaction_freq, growth_report_cycle, notify_focus_start, notify_task_complete, notify_pet_growth, notify_daily_checkin, notify_achievement, theme_appearance, cache_size_mb, app_version)
VALUES (1, '18888888888', '每日专注2小时', 25, '安静模式', 'daily', 'weekly', 1, 1, 1, 0, 1, 'starry', 23.5, 'V2.3.1')
ON DUPLICATE KEY UPDATE phone = VALUES(phone);

INSERT INTO user_favorites (user_id, item_type, title, cover_seed, meta, sort_order) VALUES
(1, 'course', '高效专注训练营', 'focus-camp', '{"tags":["专注力","自律养成"],"progress":65,"actionLabel":"继续学习","actionPath":"/focus"}', 1),
(1, 'room', '星光晚自习', 'night-deer', '{"onlineCount":132,"focusRate":95,"actionLabel":"进入房间","actionPath":"/study-room"}', 2),
(1, 'buddy', '小橙子', 'xiaocheng-girl', '{"level":23,"studyGoal":"考研英语","status":"focusing","actionLabel":"打招呼","actionPath":"/study-room/search"}', 3),
(1, 'achievement', '专注新星', 'star-medal', '{"subtitle":"累计完成 5 次专注学习任务","unlocked":true,"actionLabel":"查看成就","actionPath":"/achievement"}', 4),
(1, 'course', '番茄钟入门课', 'tomato-course', '{"tags":["番茄钟","入门"],"progress":30,"actionLabel":"继续学习","actionPath":"/focus"}', 5),
(1, 'room', '考研数学夜猫房', 'math-cat', '{"onlineCount":96,"focusRate":92,"actionLabel":"进入房间","actionPath":"/study-room/plaza"}', 6),
(1, 'buddy', '学霸兔', 'scholar-rabbit', '{"level":31,"studyGoal":"高数刷题","status":"focusing","actionLabel":"打招呼","actionPath":"/study-room/search"}', 7),
(1, 'outfit', '星光帽子', 'star-hat', '{"subtitle":"商城限定皮肤","actionLabel":"去装扮","actionPath":"/mall"}', 8),
(1, 'material', '四六级词汇表', 'cet-words', '{"subtitle":"1200 核心词汇 PDF","actionLabel":"查看资料","actionPath":""}', 9),
(1, 'achievement', '自律达人', 'discipline-medal', '{"subtitle":"连续打卡 30 天","unlocked":true,"actionLabel":"查看成就","actionPath":"/achievement"}', 10);


-- -----------------------------------------------------------------------------
-- 种子数据（seed_test_accounts.sql）
-- -----------------------------------------------------------------------------

USE chong_xueba;

-- 测试账号（密码见 doc/test-accounts.md）
INSERT INTO users (
  id, name, phone, login_account, password_hash,
  level, exp, exp_max, coins, gems, streak_days,
  focus_today_minutes, focus_week_minutes, mood, fullness, focus_stat,
  medals, total_medals, vip, ambient_sound
) VALUES
(1, '小棍同学', '18888888888', 'xiaogun', '9b6a656ac7fb4ac8cc2a151c0f597252d9906f8c0e21d444f66d8cb1f131f9b5',
  23, 7850, 10000, 12450, 128, 23, 155, 1125, 92, 78, 85, 18, 45, 1, 'rain'),
(2, '学霸喵', '13900000001', 'xueba_miao', '9b6a656ac7fb4ac8cc2a151c0f597252d9906f8c0e21d444f66d8cb1f131f9b5',
  18, 5200, 8000, 8600, 66, 12, 90, 620, 88, 72, 78, 10, 45, 0, 'rain'),
(3, '自律狐', '13900000002', 'zilv_hu', 'dc344f74e0471cfe20e91b5cb092c76f2b5fdcf472d29a03058a44070a2982fa',
  15, 3100, 6000, 4200, 40, 7, 45, 380, 85, 68, 72, 6, 45, 0, 'forest'),
(4, '夜读熊', '13900000003', 'yedu_xiong', 'ece60385915e21671928a4d343e256f94cb2d3f10abcc723003b06e9b7a017a6',
  28, 9100, 12000, 15600, 210, 35, 210, 1680, 90, 82, 88, 22, 45, 1, 'cafe'),
(5, '星光鹿', '13900000004', 'star_deer', '9b6a656ac7fb4ac8cc2a151c0f597252d9906f8c0e21d444f66d8cb1f131f9b5',
  10, 1800, 4000, 2800, 24, 3, 25, 180, 80, 65, 70, 3, 45, 0, 'fire'),
(6, '努力鸭', '13900000005', 'nuli_ya', '9b6a656ac7fb4ac8cc2a151c0f597252d9906f8c0e21d444f66d8cb1f131f9b5',
  16, 4200, 7000, 5200, 48, 9, 72, 510, 86, 70, 76, 8, 45, 0, 'fire')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  phone = VALUES(phone),
  login_account = VALUES(login_account),
  password_hash = VALUES(password_hash),
  level = VALUES(level),
  exp = VALUES(exp),
  exp_max = VALUES(exp_max),
  coins = VALUES(coins),
  gems = VALUES(gems),
  streak_days = VALUES(streak_days),
  focus_today_minutes = VALUES(focus_today_minutes),
  focus_week_minutes = VALUES(focus_week_minutes),
  mood = VALUES(mood),
  fullness = VALUES(fullness),
  focus_stat = VALUES(focus_stat),
  medals = VALUES(medals),
  vip = VALUES(vip),
  ambient_sound = VALUES(ambient_sound);

INSERT INTO pets (user_id, name, level, stage, study_power, focus_power, memory_power, discipline_power)
SELECT 2, '喵酱', 18, 'growth', 180, 165, 140, 158
WHERE NOT EXISTS (SELECT 1 FROM pets WHERE user_id = 2);

INSERT INTO pets (user_id, name, level, stage, study_power, focus_power, memory_power, discipline_power)
SELECT 3, '小狐', 15, 'growth', 150, 142, 130, 145
WHERE NOT EXISTS (SELECT 1 FROM pets WHERE user_id = 3);

INSERT INTO pets (user_id, name, level, stage, study_power, focus_power, memory_power, discipline_power)
SELECT 4, '熊仔', 28, 'growth', 260, 228, 190, 215
WHERE NOT EXISTS (SELECT 1 FROM pets WHERE user_id = 4);

INSERT INTO pets (user_id, name, level, stage, study_power, focus_power, memory_power, discipline_power)
SELECT 5, '鹿鹿', 10, 'growth', 120, 110, 98, 105
WHERE NOT EXISTS (SELECT 1 FROM pets WHERE user_id = 5);

INSERT INTO pets (user_id, name, level, stage, study_power, focus_power, memory_power, discipline_power)
SELECT 6, '鸭鸭', 16, 'growth', 165, 152, 128, 148
WHERE NOT EXISTS (SELECT 1 FROM pets WHERE user_id = 6);

INSERT INTO user_settings (user_id, phone, study_goal, default_focus_minutes, study_room_preference)
VALUES
(2, '13900000001', '每日专注1小时', 25, '安静模式'),
(3, '13900000002', '每日专注45分钟', 25, '白噪音模式'),
(4, '13900000003', '每日专注3小时', 45, '番茄模式'),
(5, '13900000004', '每日专注30分钟', 25, '安静模式'),
(6, '13900000005', '每日专注2小时', 25, '番茄模式')
ON DUPLICATE KEY UPDATE phone = VALUES(phone), study_goal = VALUES(study_goal);

INSERT INTO user_profiles (user_id, avatar_seed, birthday, gender, region, interests, signature)
VALUES
(2, 'maomao', '2003-03-15', 'female', '中国 · 上海', '英语 / 四六级', '每天进步一点点 🐱'),
(3, 'xiaocheng', '2004-08-20', 'female', '中国 · 杭州', '自律 / forest专注', '专注当下，未来自来 🦊'),
(4, 'bear', '2001-11-02', 'male', '中国 · 北京', '考研 / 深夜自习', '夜读人不孤独 🐻'),
(5, 'deer', '2005-01-28', 'female', '中国 · 成都', '入门学习 / 打卡', '星光不负赶路人 ✨'),
(6, 'nuli', '2004-05-06', 'female', '中国 · 广州', '番茄钟 / 冲刺学习', '今天也要加油鸭 🦆')
ON DUPLICATE KEY UPDATE avatar_seed = VALUES(avatar_seed), signature = VALUES(signature);

INSERT INTO focus_records (user_id, record_date, minutes) VALUES
(2, CURDATE(), 90),
(3, CURDATE(), 45),
(4, CURDATE(), 210),
(5, CURDATE(), 25),
(6, CURDATE(), 72)
ON DUPLICATE KEY UPDATE minutes = VALUES(minutes);


SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================================
-- 导入完成
-- =============================================================================
