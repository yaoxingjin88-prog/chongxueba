-- 用户个人资料扩展

CREATE TABLE IF NOT EXISTS user_profiles (
  user_id INT PRIMARY KEY,
  avatar_seed VARCHAR(50) DEFAULT 'moon-night',
  birthday DATE DEFAULT '2002-06-18',
  gender ENUM('female', 'male', 'other') DEFAULT 'female',
  region VARCHAR(100) DEFAULT '中国 · 山东 · 济南',
  interests VARCHAR(200) DEFAULT '自律成长 / 专注力 / 时间管理',
  signature VARCHAR(60) DEFAULT '每一天的专注，都是未来的礼物 ✨',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

INSERT INTO user_profiles (user_id, avatar_seed, birthday, gender, region, interests, signature)
VALUES (1, 'moon-night', '2002-06-18', 'female', '中国 · 山东 · 济南', '自律成长 / 专注力 / 时间管理', '每一天的专注，都是未来的礼物 ✨')
ON DUPLICATE KEY UPDATE avatar_seed = VALUES(avatar_seed);

UPDATE user_settings SET study_goal = '考研英语' WHERE user_id = 1;
