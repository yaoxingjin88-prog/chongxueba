USE chong_xueba;

ALTER TABLE study_rooms ADD COLUMN category VARCHAR(30) DEFAULT 'recommend' AFTER tags;
ALTER TABLE study_rooms ADD COLUMN room_label VARCHAR(30) NOT NULL DEFAULT '' AFTER category;
ALTER TABLE study_rooms ADD COLUMN member_avatars JSON NOT NULL AFTER room_label;
ALTER TABLE study_rooms ADD COLUMN extra_members INT DEFAULT 0 AFTER member_avatars;
ALTER TABLE study_rooms ADD COLUMN opened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER sort_order;
ALTER TABLE study_rooms ADD INDEX idx_category (category);
