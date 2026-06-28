-- 宠物养成扩展

CREATE TABLE IF NOT EXISTS pet_nurture_daily (
  user_id INT NOT NULL,
  nurture_key VARCHAR(32) NOT NULL,
  count_value INT DEFAULT 0,
  activity_date DATE NOT NULL,
  PRIMARY KEY (user_id, nurture_key, activity_date),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

ALTER TABLE pets ADD COLUMN exp INT DEFAULT 1260;
ALTER TABLE pets ADD COLUMN exp_max INT DEFAULT 2000;
ALTER TABLE pets ADD COLUMN vitality INT DEFAULT 156;
ALTER TABLE pets ADD COLUMN intimacy_exp INT DEFAULT 320;
ALTER TABLE pets ADD COLUMN intimacy_exp_max INT DEFAULT 500;
ALTER TABLE pets ADD COLUMN intimacy_level INT DEFAULT 4;
ALTER TABLE pets ADD COLUMN growth_stars INT DEFAULT 23;

UPDATE pets SET
  exp = 1260,
  exp_max = 2000,
  vitality = COALESCE(memory_power, 156),
  intimacy_exp = 320,
  intimacy_exp_max = 500,
  intimacy_level = 4,
  growth_stars = COALESCE(level, 23)
WHERE exp IS NULL OR exp = 0;

INSERT INTO pet_nurture_daily (user_id, nurture_key, count_value, activity_date)
SELECT 1, 'accompany_minutes', 6, CURDATE()
WHERE NOT EXISTS (
  SELECT 1 FROM pet_nurture_daily
  WHERE user_id = 1 AND nurture_key = 'accompany_minutes' AND activity_date = CURDATE()
);

INSERT INTO pet_nurture_daily (user_id, nurture_key, count_value, activity_date)
SELECT 1, 'pomodoro', 2, CURDATE()
WHERE NOT EXISTS (
  SELECT 1 FROM pet_nurture_daily
  WHERE user_id = 1 AND nurture_key = 'pomodoro' AND activity_date = CURDATE()
);
