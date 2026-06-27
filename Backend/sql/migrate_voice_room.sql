-- 语音连麦自习室

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
