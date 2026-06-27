-- 自习室连麦互动会话

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
