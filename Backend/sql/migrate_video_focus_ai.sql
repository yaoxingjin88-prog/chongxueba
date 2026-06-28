-- 视频自习室 AI 专注分析

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
