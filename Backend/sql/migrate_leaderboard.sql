-- 排行榜虚拟用户数据

CREATE TABLE IF NOT EXISTS leaderboard_users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL,
  avatar_seed VARCHAR(50) NOT NULL DEFAULT 'moon-night',
  level INT NOT NULL DEFAULT 1,
  pet_emoji VARCHAR(8) NOT NULL DEFAULT '🦊',
  status ENUM('online', 'focusing', 'offline') NOT NULL DEFAULT 'offline',
  focus_today INT NOT NULL DEFAULT 0,
  focus_week INT NOT NULL DEFAULT 0,
  focus_month INT NOT NULL DEFAULT 0,
  study_today INT NOT NULL DEFAULT 0,
  study_week INT NOT NULL DEFAULT 0,
  study_month INT NOT NULL DEFAULT 0,
  growth_today INT NOT NULL DEFAULT 0,
  growth_week INT NOT NULL DEFAULT 0,
  growth_month INT NOT NULL DEFAULT 0
);

DELETE FROM leaderboard_users;

INSERT INTO leaderboard_users
  (name, avatar_seed, level, pet_emoji, status, focus_today, focus_week, focus_month, study_today, study_week, study_month, growth_today, growth_week, growth_month)
VALUES
  ('小星同学', 'star-fox', 23, '⭐', 'focusing', 504, 3120, 12600, 420, 2800, 11200, 320, 2100, 8600),
  ('宇航员', 'cloud-pet', 22, '🚀', 'online', 456, 2980, 11800, 390, 2650, 10500, 280, 1980, 7900),
  ('奶糖兔', 'purple-bunny', 20, '🐰', 'online', 408, 2760, 10900, 360, 2480, 9800, 250, 1820, 7200),
  ('风中的小狐狸', 'dream-cat', 21, '🦊', 'online', 372, 2540, 10100, 330, 2300, 9100, 220, 1680, 6800),
  ('小满', 'xiaogun', 19, '🐼', 'focusing', 338, 2310, 9200, 300, 2100, 8400, 200, 1520, 6100),
  ('星辰大海', 'moon-night', 21, '🐱', 'offline', 318, 2180, 8700, 285, 1980, 7900, 185, 1410, 5800),
  ('咖啡不加糖', 'math-cat', 18, '☕', 'focusing', 309, 2050, 8200, 270, 1860, 7400, 170, 1320, 5400),
  ('夜猫子', 'night-deer', 17, '🦉', 'online', 273, 1890, 7600, 240, 1720, 6900, 150, 1180, 4900),
  ('书海拾贝', 'library-owl', 20, '📚', 'offline', 252, 1760, 7100, 225, 1600, 6400, 140, 1090, 4500),
  ('追光者', 'code-bear', 18, '✨', 'online', 228, 1620, 6500, 210, 1480, 5900, 125, 980, 4100),
  ('自律少年', 'english-fox', 16, '🎯', 'focusing', 210, 1480, 5900, 195, 1350, 5400, 110, 870, 3600),
  ('学习搭子', 'japanese-rabbit', 15, '🌸', 'offline', 186, 1320, 5300, 175, 1210, 4800, 95, 760, 3200);
