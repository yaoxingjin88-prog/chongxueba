-- 邀请好友

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
