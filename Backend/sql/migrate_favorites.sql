-- 用户收藏表迁移

CREATE TABLE IF NOT EXISTS user_favorites (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  item_type ENUM('course', 'room', 'buddy', 'outfit', 'achievement', 'material') NOT NULL,
  title VARCHAR(100) NOT NULL,
  cover_seed VARCHAR(50) NOT NULL DEFAULT '',
  meta JSON NOT NULL,
  sort_order INT DEFAULT 0,
  favorited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_type (user_id, item_type)
);

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
