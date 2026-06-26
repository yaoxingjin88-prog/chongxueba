USE chong_xueba;

INSERT INTO users (id, name, level, exp, exp_max, coins, gems, streak_days, focus_today_minutes, focus_week_minutes, mood, fullness, focus_stat, medals, total_medals, vip, ambient_sound)
VALUES (1, '小棍同学', 23, 7850, 10000, 12450, 128, 23, 155, 1125, 92, 78, 85, 18, 45, 1, 'rain')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO pets (user_id, name, level, stage, study_power, focus_power, memory_power, discipline_power)
SELECT 1, '小橙', 23, 'growth', 232, 198, 156, 189
WHERE NOT EXISTS (SELECT 1 FROM pets WHERE user_id = 1);

INSERT INTO tasks (type, icon, title, target_count, exp_reward, coin_reward, color, sort_order) VALUES
('daily', 'clock', '专注学习 25 分钟', 1, 60, 50, '#7864ee', 1),
('daily', 'book', '完成 3 道练习题', 3, 40, 30, '#8069f1', 2),
('daily', 'paw', '喂养宠物 1 次', 1, 20, 20, '#9c6cea', 3),
('daily', 'users', '加入自习室学习', 1, 80, 60, '#607ded', 4),
('daily', 'share-nodes', '分享成长报告', 1, 30, 40, '#a16be2', 5);

INSERT INTO user_tasks (user_id, task_id, current_count, done, activity_date)
SELECT 1, t.id,
  CASE t.sort_order WHEN 2 THEN 1 WHEN 3 THEN 1 ELSE 0 END,
  CASE t.sort_order WHEN 3 THEN 1 ELSE 0 END,
  CURDATE()
FROM tasks t
WHERE t.type = 'daily'
ON DUPLICATE KEY UPDATE current_count = VALUES(current_count), done = VALUES(done);

INSERT INTO mall_items (name, icon, price, price_type, category, sort_order) VALUES
('学霸背包', '🎒', 280, 'coins', 'prop', 1),
('星光帽子', '🎩', 150, 'coins', 'skin', 2),
('魔法围巾', '🧣', 320, 'coins', 'skin', 3),
('学习桌', '🪑', 500, 'coins', 'furniture', 4),
('星空床', '🛏️', 800, 'gems', 'furniture', 5),
('经验加倍卡', '⚡', 50, 'gems', 'prop', 6),
('专注药水', '🧪', 120, 'coins', 'prop', 7),
('限定皮肤', '✨', 200, 'gems', 'limited', 8),
('宠物玩具', '🎾', 90, 'coins', 'prop', 9);

INSERT INTO achievements (name, description, theme, badge_theme) VALUES
('专注大师', '累计专注100小时', 'shield-green', 'theme-orange'),
('自律达人', '连续打卡30天', 'shield-blue', 'theme-pink'),
('学霸之星', '累计专注200小时', 'shield-gold', 'theme-blue'),
('百发百中', '任务完成率100%', 'shield-purple', 'theme-orange'),
('博览群书', '完成50次学习', 'shield-teal', 'theme-pink'),
('初露锋芒', '首次获得勋章', 'shield-orange', 'theme-blue'),
('飞速成长', '等级达到30级', 'shield-gray', 'theme-orange'),
('学霸之王', '排行榜第1名', 'shield-gray', 'theme-pink'),
('毕业纪念', '完成全部课程', 'shield-gray', 'theme-blue');

INSERT INTO user_achievements (user_id, achievement_id, earned_at)
SELECT 1, id, DATE_SUB(CURDATE(), INTERVAL (10 - id) DAY)
FROM achievements WHERE id <= 6
ON DUPLICATE KEY UPDATE earned_at = VALUES(earned_at);

INSERT INTO focus_records (user_id, record_date, minutes) VALUES
(1, DATE_SUB(CURDATE(), INTERVAL 7 DAY), 108),
(1, DATE_SUB(CURDATE(), INTERVAL 6 DAY), 69),
(1, DATE_SUB(CURDATE(), INTERVAL 5 DAY), 141),
(1, DATE_SUB(CURDATE(), INTERVAL 4 DAY), 75),
(1, DATE_SUB(CURDATE(), INTERVAL 3 DAY), 138),
(1, DATE_SUB(CURDATE(), INTERVAL 2 DAY), 81),
(1, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 159),
(1, CURDATE(), 84);

INSERT INTO study_room_users (name, avatar_seed, pos_x, pos_y) VALUES
('小橙', 'xiaocheng', 13, 45),
('学霸喵', 'maomao', 87, 44),
('学霸熊', 'bear', 33, 62),
('小鹿同学', 'deer', 62, 60),
('自律猫', 'cat', 16, 78),
('学霸狗', 'dog', 47, 80),
('努力鸭', 'nuli', 82, 76);
