USE chong_xueba;

-- 测试账号（密码见 doc/test-accounts.md）
INSERT INTO users (
  id, name, phone, login_account, password_hash,
  level, exp, exp_max, coins, gems, streak_days,
  focus_today_minutes, focus_week_minutes, mood, fullness, focus_stat,
  medals, total_medals, vip, ambient_sound
) VALUES
(1, '小棍同学', '18888888888', 'xiaogun', '9b6a656ac7fb4ac8cc2a151c0f597252d9906f8c0e21d444f66d8cb1f131f9b5',
  23, 7850, 10000, 12450, 128, 23, 155, 1125, 92, 78, 85, 18, 45, 1, 'rain'),
(2, '学霸喵', '13900000001', 'xueba_miao', '9b6a656ac7fb4ac8cc2a151c0f597252d9906f8c0e21d444f66d8cb1f131f9b5',
  18, 5200, 8000, 8600, 66, 12, 90, 620, 88, 72, 78, 10, 45, 0, 'rain'),
(3, '自律狐', '13900000002', 'zilv_hu', 'dc344f74e0471cfe20e91b5cb092c76f2b5fdcf472d29a03058a44070a2982fa',
  15, 3100, 6000, 4200, 40, 7, 45, 380, 85, 68, 72, 6, 45, 0, 'forest'),
(4, '夜读熊', '13900000003', 'yedu_xiong', 'ece60385915e21671928a4d343e256f94cb2d3f10abcc723003b06e9b7a017a6',
  28, 9100, 12000, 15600, 210, 35, 210, 1680, 90, 82, 88, 22, 45, 1, 'cafe'),
(5, '星光鹿', '13900000004', 'star_deer', '9b6a656ac7fb4ac8cc2a151c0f597252d9906f8c0e21d444f66d8cb1f131f9b5',
  10, 1800, 4000, 2800, 24, 3, 25, 180, 80, 65, 70, 3, 45, 0, 'fire'),
(6, '努力鸭', '13900000005', 'nuli_ya', '9b6a656ac7fb4ac8cc2a151c0f597252d9906f8c0e21d444f66d8cb1f131f9b5',
  16, 4200, 7000, 5200, 48, 9, 72, 510, 86, 70, 76, 8, 45, 0, 'fire')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  phone = VALUES(phone),
  login_account = VALUES(login_account),
  password_hash = VALUES(password_hash),
  level = VALUES(level),
  exp = VALUES(exp),
  exp_max = VALUES(exp_max),
  coins = VALUES(coins),
  gems = VALUES(gems),
  streak_days = VALUES(streak_days),
  focus_today_minutes = VALUES(focus_today_minutes),
  focus_week_minutes = VALUES(focus_week_minutes),
  mood = VALUES(mood),
  fullness = VALUES(fullness),
  focus_stat = VALUES(focus_stat),
  medals = VALUES(medals),
  vip = VALUES(vip),
  ambient_sound = VALUES(ambient_sound);

INSERT INTO pets (user_id, name, level, stage, study_power, focus_power, memory_power, discipline_power)
SELECT 2, '喵酱', 18, 'growth', 180, 165, 140, 158
WHERE NOT EXISTS (SELECT 1 FROM pets WHERE user_id = 2);

INSERT INTO pets (user_id, name, level, stage, study_power, focus_power, memory_power, discipline_power)
SELECT 3, '小狐', 15, 'growth', 150, 142, 130, 145
WHERE NOT EXISTS (SELECT 1 FROM pets WHERE user_id = 3);

INSERT INTO pets (user_id, name, level, stage, study_power, focus_power, memory_power, discipline_power)
SELECT 4, '熊仔', 28, 'growth', 260, 228, 190, 215
WHERE NOT EXISTS (SELECT 1 FROM pets WHERE user_id = 4);

INSERT INTO pets (user_id, name, level, stage, study_power, focus_power, memory_power, discipline_power)
SELECT 5, '鹿鹿', 10, 'growth', 120, 110, 98, 105
WHERE NOT EXISTS (SELECT 1 FROM pets WHERE user_id = 5);

INSERT INTO pets (user_id, name, level, stage, study_power, focus_power, memory_power, discipline_power)
SELECT 6, '鸭鸭', 16, 'growth', 165, 152, 128, 148
WHERE NOT EXISTS (SELECT 1 FROM pets WHERE user_id = 6);

INSERT INTO user_settings (user_id, phone, study_goal, default_focus_minutes, study_room_preference)
VALUES
(2, '13900000001', '每日专注1小时', 25, '安静模式'),
(3, '13900000002', '每日专注45分钟', 25, '白噪音模式'),
(4, '13900000003', '每日专注3小时', 45, '番茄模式'),
(5, '13900000004', '每日专注30分钟', 25, '安静模式'),
(6, '13900000005', '每日专注2小时', 25, '番茄模式')
ON DUPLICATE KEY UPDATE phone = VALUES(phone), study_goal = VALUES(study_goal);

INSERT INTO user_profiles (user_id, avatar_seed, birthday, gender, region, interests, signature)
VALUES
(2, 'maomao', '2003-03-15', 'female', '中国 · 上海', '英语 / 四六级', '每天进步一点点 🐱'),
(3, 'xiaocheng', '2004-08-20', 'female', '中国 · 杭州', '自律 / forest专注', '专注当下，未来自来 🦊'),
(4, 'bear', '2001-11-02', 'male', '中国 · 北京', '考研 / 深夜自习', '夜读人不孤独 🐻'),
(5, 'deer', '2005-01-28', 'female', '中国 · 成都', '入门学习 / 打卡', '星光不负赶路人 ✨'),
(6, 'nuli', '2004-05-06', 'female', '中国 · 广州', '番茄钟 / 冲刺学习', '今天也要加油鸭 🦆')
ON DUPLICATE KEY UPDATE avatar_seed = VALUES(avatar_seed), signature = VALUES(signature);

INSERT INTO focus_records (user_id, record_date, minutes) VALUES
(2, CURDATE(), 90),
(3, CURDATE(), 45),
(4, CURDATE(), 210),
(5, CURDATE(), 25),
(6, CURDATE(), 72)
ON DUPLICATE KEY UPDATE minutes = VALUES(minutes);
