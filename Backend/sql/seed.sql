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
(1, DATE_SUB(CURDATE(), INTERVAL 30 DAY), 8505),
(1, DATE_SUB(CURDATE(), INTERVAL 7 DAY), 108),
(1, DATE_SUB(CURDATE(), INTERVAL 6 DAY), 69),
(1, DATE_SUB(CURDATE(), INTERVAL 5 DAY), 141),
(1, DATE_SUB(CURDATE(), INTERVAL 4 DAY), 75),
(1, DATE_SUB(CURDATE(), INTERVAL 3 DAY), 138),
(1, DATE_SUB(CURDATE(), INTERVAL 2 DAY), 81),
(1, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 159),
(1, CURDATE(), 84)
ON DUPLICATE KEY UPDATE minutes = VALUES(minutes);

INSERT INTO study_room_users (user_id, name, avatar_seed, pos_x, pos_y) VALUES
(1, '小棍同学', 'moon-night', 13, 45),
(2, '学霸喵', 'maomao', 87, 44),
(4, '夜读熊', 'bear', 33, 62),
(5, '星光鹿', 'deer', 62, 60),
(3, '自律狐', 'xiaocheng', 47, 80),
(6, '努力鸭', 'nuli', 82, 76);

INSERT INTO study_rooms (room_code, name, subtitle, cover_seed, online_count, focus_rate, tags, category, room_label, member_avatars, extra_members, sort_order, opened_at) VALUES
('SR-8821', '英语冲刺室', '四六级真题精练 · 全程相伴', 'english-fox', 128, 95, '["四六级", "英语"]', 'cet', '英语', '["xiaocheng", "maomao", "bear", "deer"]', 12, 1, DATE_SUB(NOW(), INTERVAL 2 HOUR)),
('SR-6612', '考研数学夜猫房', '高数线代概率 · 难题共创', 'math-cat', 96, 92, '["考研", "数学"]', 'kaoyan', '考研', '["bear", "deer", "cat", "dog"]', 8, 2, DATE_SUB(NOW(), INTERVAL 5 HOUR)),
('SR-3308', '星光晚自习', '晚间沉浸学习，拒绝内耗', 'night-deer', 132, 95, '["晚间", "自律"]', 'recommend', '自律', '["xiaocheng", "maomao", "nuli", "cat", "dog"]', 8, 3, DATE_SUB(NOW(), INTERVAL 1 HOUR)),
('SR-1205', 'AI 专注舱', '摄像头监督 + 番茄钟陪练', 'code-bear', 86, 93, '["AI", "专注"]', 'hot', 'AI陪练', '["maomao", "bear", "deer", "nuli"]', 6, 4, DATE_SUB(NOW(), INTERVAL 3 HOUR)),
('SR-9903', '番茄冲刺房', '25 分钟一轮，互相监督', 'japanese-rabbit', 74, 91, '["番茄", "冲刺"]', 'hot', '番茄', '["cat", "dog", "nuli", "xiaocheng"]', 5, 5, DATE_SUB(NOW(), INTERVAL 6 HOUR)),
('SR-4410', '深夜图书馆', '安静模式 · 仅白噪音陪伴', 'library-owl', 58, 96, '["安静", "深夜"]', 'recommend', '安静', '["deer", "bear", "maomao"]', 4, 6, DATE_SUB(NOW(), INTERVAL 8 HOUR)),
('SR-5520', '编程刷题室', 'LeetCode 每日一题 · 互相监督', 'code-bear', 52, 90, '["编程", "算法"]', 'code', '编程', '["dog", "cat", "bear"]', 3, 7, DATE_SUB(NOW(), INTERVAL 12 HOUR)),
('SR-6630', '日语入门房', '五十音 + 日常会话 · 轻松跟学', 'japanese-rabbit', 38, 86, '["日语", "语言"]', 'language', '语言', '["nuli", "xiaocheng", "deer"]', 2, 8, DATE_SUB(NOW(), INTERVAL 1 DAY));

INSERT INTO study_buddies (name, avatar_seed, level, study_goal, status, sort_order) VALUES
('小橙子', 'xiaocheng-girl', 23, '考研英语', 'focusing', 1),
('阿白', 'abai-panda', 18, '四六级', 'available', 2),
('学霸兔', 'scholar-rabbit', 31, '高数刷题', 'focusing', 3),
('努力鸭', 'nuli-duck', 15, '晚间自律', 'available', 4),
('小鹿同学', 'deer-buddy', 20, '考研政治', 'focusing', 5);

INSERT INTO study_search_history (user_id, keyword, search_type) VALUES
(1, '英语四六级', 'room'),
(1, '考研数学', 'room'),
(1, '晚间自律房', 'room');

INSERT INTO user_settings (user_id, phone, study_goal, default_focus_minutes, study_room_preference, pet_interaction_freq, growth_report_cycle, notify_focus_start, notify_task_complete, notify_pet_growth, notify_daily_checkin, notify_achievement, theme_appearance, cache_size_mb, app_version)
VALUES (1, '18888888888', '每日专注2小时', 25, '安静模式', 'daily', 'weekly', 1, 1, 1, 0, 1, 'starry', 23.5, 'V2.3.1')
ON DUPLICATE KEY UPDATE phone = VALUES(phone);

INSERT INTO user_favorites (user_id, item_type, title, cover_seed, meta, sort_order) VALUES
(1, 'course', '高效专注训练营', 'focus-camp', '{"tags":["专注力","自律养成"],"progress":65,"actionLabel":"继续学习","actionPath":"/focus"}', 1),
(1, 'room', '星光晚自习', 'night-deer', '{"onlineCount":132,"focusRate":95,"actionLabel":"进入房间","actionPath":"/study-room"}', 2),
(1, 'buddy', '小橙子', 'xiaocheng-girl', '{"level":23,"studyGoal":"考研英语","status":"focusing","actionLabel":"打招呼","actionPath":"/study-room/search"}', 3),
(1, 'achievement', '专注新星', 'star-medal', '{"subtitle":"累计完成 5 次专注学习任务","unlocked":true,"actionLabel":"查看成就","actionPath":"/achievement"}', 4),
(1, 'course', '番茄钟入门课', 'tomato-course', '{"tags":["番茄钟","入门"],"progress":30,"actionLabel":"继续学习","actionPath":"/focus"}', 5),
(1, 'room', '考研数学夜猫房', 'math-cat', '{"onlineCount":96,"focusRate":92,"actionLabel":"进入房间","actionPath":"/study-room/plaza"}', 6),
(1, 'buddy', '学霸兔', 'scholar-rabbit', '{"level":31,"studyGoal":"高数刷题","status":"focusing","actionLabel":"打招呼","actionPath":"/study-room/search"}', 7),
(1, 'outfit', '星光帽子', 'star-hat', '{"subtitle":"商城限定皮肤","actionLabel":"去装扮","actionPath":"/mall"}', 8),
(1, 'material', '四六级词汇表', 'cet-words', '{"subtitle":"1200 核心词汇 PDF","actionLabel":"查看资料","actionPath":""}', 9),
(1, 'achievement', '自律达人', 'discipline-medal', '{"subtitle":"连续打卡 30 天","unlocked":true,"actionLabel":"查看成就","actionPath":"/achievement"}', 10);
