USE chong_xueba;

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
