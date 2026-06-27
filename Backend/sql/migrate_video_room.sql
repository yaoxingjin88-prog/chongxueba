-- 视频自习室

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
