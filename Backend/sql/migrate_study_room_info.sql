-- 自习室房间资料扩展

ALTER TABLE study_rooms
  ADD COLUMN room_intro TEXT NULL AFTER subtitle,
  ADD COLUMN entry_method VARCHAR(50) DEFAULT '自由加入' AFTER room_intro,
  ADD COLUMN rules_summary VARCHAR(200) DEFAULT '' AFTER entry_method,
  ADD COLUMN host_name VARCHAR(50) DEFAULT '' AFTER rules_summary,
  ADD COLUMN host_seed VARCHAR(50) DEFAULT '' AFTER host_name,
  ADD COLUMN display_number VARCHAR(20) DEFAULT '' AFTER host_seed;

INSERT INTO study_rooms (
  room_code, name, subtitle, room_intro, entry_method, rules_summary,
  host_name, host_seed, display_number, cover_seed, online_count, focus_rate,
  tags, category, room_label, member_avatars, extra_members, sort_order, opened_at
) VALUES (
  'SR-DEFAULT',
  '星光自习室',
  '在星光下专注，在陪伴中成长',
  '一起专注学习，互相陪伴，共同进步，让每一天都成为更好的自己！✨',
  '自由加入',
  '友善交流 | 禁止广告 | 专注学习',
  '小星同学',
  'star-girl',
  '123456',
  'night-deer',
  128,
  96,
  '["专注学习", "自习打卡", "考研备考", "自律成长"]',
  'recommend',
  '官方',
  '["star-girl", "maomao", "cat", "dog", "duck"]',
  120,
  0,
  NOW()
)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  subtitle = VALUES(subtitle),
  room_intro = VALUES(room_intro),
  entry_method = VALUES(entry_method),
  rules_summary = VALUES(rules_summary),
  host_name = VALUES(host_name),
  host_seed = VALUES(host_seed),
  display_number = VALUES(display_number),
  cover_seed = VALUES(cover_seed),
  tags = VALUES(tags);
