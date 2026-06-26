CREATE DATABASE IF NOT EXISTS chong_xueba DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE chong_xueba;

-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL,
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
  name VARCHAR(50) NOT NULL,
  avatar_seed VARCHAR(50) NOT NULL,
  pos_x DECIMAL(5,2) NOT NULL,
  pos_y DECIMAL(5,2) NOT NULL,
  is_online TINYINT(1) DEFAULT 1
);
