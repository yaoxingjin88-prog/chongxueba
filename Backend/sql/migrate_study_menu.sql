-- 自习室功能菜单：消息提醒 + 举报反馈

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
