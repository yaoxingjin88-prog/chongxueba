-- 成就系统：勋章、宠物图鉴、成长回忆录

CREATE TABLE IF NOT EXISTS medals (
  id VARCHAR(40) PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(50) NOT NULL,
  description VARCHAR(120) DEFAULT NULL,
  icon VARCHAR(40) DEFAULT 'medal',
  category ENUM('study', 'focus', 'streak', 'special') NOT NULL,
  earned TINYINT(1) DEFAULT 0,
  earned_date VARCHAR(10) DEFAULT NULL,
  rarity ENUM('common', 'rare', 'epic', 'legendary') DEFAULT 'common',
  color VARCHAR(20) DEFAULT '#60a5fa',
  progress_current DECIMAL(6,1) DEFAULT NULL,
  progress_total DECIMAL(6,1) DEFAULT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS pet_catalog (
  id VARCHAR(40) PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(50) NOT NULL,
  type VARCHAR(30) DEFAULT NULL,
  unlocked TINYINT(1) DEFAULT 0,
  level INT DEFAULT 1,
  image VARCHAR(255) DEFAULT NULL,
  description VARCHAR(255) DEFAULT NULL,
  unlock_condition VARCHAR(100) DEFAULT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS growth_memories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  memory_date DATE NOT NULL,
  title VARCHAR(80) NOT NULL,
  description VARCHAR(255) DEFAULT NULL,
  icon VARCHAR(40) DEFAULT 'star',
  color VARCHAR(20) DEFAULT '#fbbf24',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

INSERT INTO medals (id, user_id, name, description, icon, category, earned, earned_date, rarity, color, progress_current, progress_total) VALUES
('first_study', 1, '初次学习', '完成第一次学习任务', 'book-open-reader', 'study', 1, '06-15', 'common', '#60a5fa', NULL, NULL),
('study_10h', 1, '学霸初成', '累计学习10小时', 'brain', 'study', 1, '06-18', 'common', '#60a5fa', NULL, NULL),
('study_50h', 1, '知识渊博', '累计学习50小时', 'trophy', 'study', 1, '06-24', 'rare', '#818cf8', NULL, NULL),
('study_100h', 1, '学习大师', '累计学习100小时', 'crown', 'study', 0, NULL, 'epic', '#a78bfa', 78, 100),
('perfect_week', 1, '完美一周', '连续7天完成所有任务', 'calendar-check', 'study', 1, '06-21', 'rare', '#818cf8', NULL, NULL),
('night_owl', 1, '夜猫子', '在22:00后完成学习', 'moon', 'study', 1, '06-19', 'common', '#60a5fa', NULL, NULL),
('first_focus', 1, '初次专注', '完成第一次专注任务', 'bullseye', 'focus', 1, '06-14', 'common', '#f59e0b', NULL, NULL),
('focus_1h', 1, '专注新人', '单次专注超过1小时', 'clock', 'focus', 1, '06-20', 'common', '#f59e0b', NULL, NULL),
('focus_3h', 1, '深度专注', '单次专注超过3小时', 'fire', 'focus', 0, NULL, 'rare', '#f97316', 2.5, 3),
('focus_marathon', 1, '专注马拉松', '单次专注超过5小时', 'trophy', 'focus', 0, NULL, 'epic', '#ef4444', 2.5, 5),
('flow_state', 1, '心流状态', '一周内达成5次深度专注', 'bolt', 'focus', 1, '06-25', 'rare', '#f97316', NULL, NULL),
('streak_3', 1, '三天打鱼', '连续打卡3天', 'list-check', 'streak', 1, '06-17', 'common', '#34d399', NULL, NULL),
('streak_7', 1, '一周之约', '连续打卡7天', 'clock', 'streak', 1, '06-21', 'common', '#34d399', NULL, NULL),
('streak_30', 1, '月度之星', '连续打卡30天', 'medal', 'streak', 0, NULL, 'epic', '#10b981', 23, 30),
('streak_100', 1, '百日筑基', '连续打卡100天', 'gem', 'streak', 0, NULL, 'legendary', '#fbbf24', 23, 100),
('first_pet', 1, '初次相遇', '领养第一只宠物', 'heart', 'special', 1, '06-13', 'common', '#f472b6', NULL, NULL),
('pet_master', 1, '宠物达人', '宠物达到20级', 'paw', 'special', 1, '06-26', 'rare', '#e879f9', NULL, NULL),
('mall_first', 1, '首次购物', '在商城购买第一件商品', 'bag-shopping', 'special', 0, NULL, 'common', '#f472b6', NULL, NULL),
('collector', 1, '收藏家', '收集全部家具', 'box-open', 'special', 0, NULL, 'epic', '#e879f9', 8, 20)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description),
  icon = VALUES(icon),
  category = VALUES(category),
  rarity = VALUES(rarity),
  color = VALUES(color),
  progress_current = COALESCE(VALUES(progress_current), progress_current),
  progress_total = COALESCE(VALUES(progress_total), progress_total);

INSERT INTO pet_catalog (id, user_id, name, type, unlocked, level, description) VALUES
('tororo', 1, '山药泥', '白猫', 1, 23, 'Live2D 官方示例模型 · 白猫'),
('hijiki', 1, '羊栖菜', '黑猫', 1, 15, 'Live2D 官方示例模型 · 黑猫')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  type = VALUES(type),
  unlocked = VALUES(unlocked),
  level = VALUES(level),
  description = VALUES(description);

DELETE FROM growth_memories WHERE user_id = 1;

INSERT INTO growth_memories (user_id, memory_date, title, description, icon, color) VALUES
(1, '2026-06-13', '旅程开始', '注册宠学霸，领养了第一只宠物「小橙」', 'star', '#fbbf24'),
(1, '2026-06-14', '第一次专注', '完成首次25分钟番茄钟专注', 'bullseye', '#60a5fa'),
(1, '2026-06-17', '三天打卡', '连续3天完成学习打卡，获得「三天打鱼」勋章', 'calendar-check', '#34d399'),
(1, '2026-06-21', '完美一周', '连续7天完成所有每日任务，解锁「完美一周」成就', 'trophy', '#818cf8'),
(1, '2026-06-23', '宠物进化', '小橙达到20级，解锁新外观', 'paw', '#f472b6'),
(1, '2026-06-25', '心流时刻', '本周达成5次深度专注，获得「心流状态」勋章', 'fire', '#f97316'),
(1, '2026-06-26', '宠物达人', '宠物达到20级，解锁「宠物达人」成就', 'medal', '#e879f9');

UPDATE users SET medals = (
  SELECT COUNT(*) FROM medals WHERE user_id = users.id AND earned = 1
), total_medals = (
  SELECT COUNT(*) FROM medals WHERE user_id = users.id
) WHERE id = 1;
