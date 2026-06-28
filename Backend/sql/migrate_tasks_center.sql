-- 任务中心扩展：任务字段、活跃度宝箱、签到、学豆流水

ALTER TABLE tasks
  ADD COLUMN description VARCHAR(255) DEFAULT NULL,
  ADD COLUMN difficulty TINYINT DEFAULT 3,
  ADD COLUMN progress_unit VARCHAR(20) DEFAULT 'times',
  ADD COLUMN steps JSON DEFAULT NULL,
  ADD COLUMN pet_rewards JSON DEFAULT NULL,
  ADD COLUMN action_route VARCHAR(50) DEFAULT NULL;

ALTER TABLE tasks
  MODIFY COLUMN type ENUM('daily', 'weekly', 'goal', 'streak', 'event') DEFAULT 'daily';

ALTER TABLE user_tasks
  ADD COLUMN completed_at DATETIME DEFAULT NULL;

CREATE TABLE IF NOT EXISTS activity_chest_claims (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  tier TINYINT NOT NULL,
  claim_date DATE NOT NULL,
  UNIQUE KEY uk_user_tier_date (user_id, tier, claim_date),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS check_in_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  title VARCHAR(50) NOT NULL,
  icon VARCHAR(30) DEFAULT 'sun',
  is_preset TINYINT(1) DEFAULT 0,
  sort_order INT DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS check_ins (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  item_id INT NOT NULL,
  check_date DATE NOT NULL,
  UNIQUE KEY uk_user_item_date (user_id, item_id, check_date),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (item_id) REFERENCES check_in_items(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS coin_transactions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  amount INT NOT NULL,
  reason VARCHAR(50) NOT NULL,
  ref_id VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

UPDATE tasks SET
  description = '在专注模式或自习室完成有效专注',
  difficulty = 2,
  progress_unit = 'minutes',
  target_count = 25,
  steps = '["进入专注模式或自习室","开启计时并完成25分钟","返回任务中心领取奖励"]',
  pet_rewards = '{"focus":3,"study":2}',
  action_route = '/focus'
WHERE type = 'daily' AND icon = 'clock';

UPDATE tasks SET
  description = '完成练习题巩固知识点',
  difficulty = 2,
  progress_unit = 'times',
  steps = '["打开学习任务","完成指定数量练习","标记任务完成"]',
  pet_rewards = '{"study":3}'
WHERE type = 'daily' AND icon = 'book';

UPDATE tasks SET
  description = '在宠物页完成一次喂养互动',
  difficulty = 1,
  progress_unit = 'times',
  pet_rewards = '{"intimacy":5}',
  action_route = '/pet'
WHERE type = 'daily' AND icon = 'paw';

UPDATE tasks SET
  description = '进入任意自习室并完成一次学习',
  difficulty = 2,
  progress_unit = 'times',
  pet_rewards = '{"focus":2}',
  action_route = '/study-room'
WHERE type = 'daily' AND icon = 'users';

UPDATE tasks SET
  description = '分享你的成长报告给好友',
  difficulty = 1,
  progress_unit = 'times',
  pet_rewards = '{"intimacy":3}',
  action_route = '/growth'
WHERE type = 'daily' AND icon = 'share-nodes';

INSERT INTO tasks (type, icon, title, description, difficulty, target_count, progress_unit, exp_reward, coin_reward, color, sort_order, steps, pet_rewards, action_route)
SELECT 'weekly', 'calendar-check', '本周专注5天', '本周至少5天完成25分钟专注', 3, 5, 'days', 200, 150, '#7b61ff', 1,
  '["每天完成一次专注","累计5天即可达成","周末前完成奖励更丰厚"]', '{"focus":8,"study":5}', '/focus'
WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE type = 'weekly' AND title = '本周专注5天');

INSERT INTO tasks (type, icon, title, description, difficulty, target_count, progress_unit, exp_reward, coin_reward, color, sort_order, steps, pet_rewards, action_route)
SELECT 'weekly', 'list-check', '完成10个每日任务', '本周累计完成10个每日任务', 4, 10, 'times', 260, 180, '#6366f1', 2,
  '["完成每日任务","累计进度自动更新","达成后领取周挑战奖励"]', '{"study":6,"discipline":4}', '/tasks'
WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE type = 'weekly' AND title = '完成10个每日任务');

INSERT INTO tasks (type, icon, title, description, difficulty, target_count, progress_unit, exp_reward, coin_reward, color, sort_order, steps, pet_rewards, action_route)
SELECT 'weekly', 'fire', '连续打卡7天', '保持7天不间断学习打卡', 4, 7, 'days', 300, 220, '#f97316', 3,
  '["每日完成签到或任务","保持连续天数","达成后可获得额外奖励"]', '{"intimacy":10}', '/checkin'
WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE type = 'weekly' AND title = '连续打卡7天');

INSERT INTO tasks (type, icon, title, description, difficulty, target_count, progress_unit, exp_reward, coin_reward, color, sort_order, steps, pet_rewards, action_route)
SELECT 'event', 'gift', '限时·累计专注10小时', '本月累计专注达到10小时', 4, 600, 'minutes', 500, 300, '#a855f7', 1,
  '["任意场景完成专注","进度自动累计","活动结束前达成即可"]', '{"focus":12,"study":8}', '/focus'
WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE type = 'event' AND title = '限时·累计专注10小时');

INSERT INTO tasks (type, icon, title, description, difficulty, target_count, progress_unit, exp_reward, coin_reward, color, sort_order, steps, pet_rewards, action_route)
SELECT 'event', 'star', '限时·完成20个任务', '本月累计完成20个任务', 5, 20, 'times', 600, 400, '#ec4899', 2,
  '["完成每日/每周任务","进度实时更新","领取限定活动奖励"]', '{"study":10,"intimacy":8}', '/tasks'
WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE type = 'event' AND title = '限时·完成20个任务');

INSERT INTO check_in_items (user_id, title, icon, is_preset, sort_order)
SELECT u.id, '早起学习', 'sun', 1, 1 FROM users u
WHERE NOT EXISTS (SELECT 1 FROM check_in_items c WHERE c.user_id = u.id AND c.title = '早起学习');

INSERT INTO check_in_items (user_id, title, icon, is_preset, sort_order)
SELECT u.id, '完成专注', 'clock', 1, 2 FROM users u
WHERE NOT EXISTS (SELECT 1 FROM check_in_items c WHERE c.user_id = u.id AND c.title = '完成专注');

INSERT INTO check_in_items (user_id, title, icon, is_preset, sort_order)
SELECT u.id, '阅读30分钟', 'book', 1, 3 FROM users u
WHERE NOT EXISTS (SELECT 1 FROM check_in_items c WHERE c.user_id = u.id AND c.title = '阅读30分钟');

INSERT INTO check_in_items (user_id, title, icon, is_preset, sort_order)
SELECT u.id, '运动锻炼', 'heart', 1, 4 FROM users u
WHERE NOT EXISTS (SELECT 1 FROM check_in_items c WHERE c.user_id = u.id AND c.title = '运动锻炼');
