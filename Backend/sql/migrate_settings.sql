-- 用户设置表迁移（pool 已连接 chong_xueba 库）

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
