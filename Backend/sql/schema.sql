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
