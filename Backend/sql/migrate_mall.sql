-- 商城扩展：商品字段、购买/购物车/订单/装扮表

ALTER TABLE mall_items
  ADD COLUMN description VARCHAR(255) DEFAULT NULL AFTER icon;

ALTER TABLE mall_items
  ADD COLUMN tag VARCHAR(20) DEFAULT NULL AFTER description;

ALTER TABLE mall_items
  ADD COLUMN tag_color VARCHAR(20) DEFAULT NULL AFTER tag;

CREATE TABLE IF NOT EXISTS mall_purchases (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  item_id INT NOT NULL,
  purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_user_item (user_id, item_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (item_id) REFERENCES mall_items(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS mall_cart_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  item_id INT NOT NULL,
  quantity INT DEFAULT 1,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_user_item (user_id, item_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (item_id) REFERENCES mall_items(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS mall_orders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  order_no VARCHAR(32) NOT NULL,
  total INT NOT NULL,
  status ENUM('pending', 'done', 'claim') DEFAULT 'pending',
  address VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS mall_order_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_id INT NOT NULL,
  item_id INT NOT NULL,
  name VARCHAR(50) NOT NULL,
  price INT NOT NULL,
  quantity INT DEFAULT 1,
  image VARCHAR(10) DEFAULT NULL,
  FOREIGN KEY (order_id) REFERENCES mall_orders(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS mall_outfits (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  name VARCHAR(50) DEFAULT 'default',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS mall_outfit_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  outfit_id INT NOT NULL,
  item_id INT NOT NULL,
  category INT DEFAULT 0,
  FOREIGN KEY (outfit_id) REFERENCES mall_outfits(id) ON DELETE CASCADE
);

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

DELETE FROM mall_items;

INSERT INTO mall_items (id, name, icon, description, tag, tag_color, price, price_type, category, sort_order) VALUES
(1, '星空书包', '🎒', '紫色猫耳双肩包，附星光特效，背上后宠物外观增加星空粒子效果。', '稀有', '#f472b6', 980, 'coins', 'skin', 1),
(2, '魔法帽', '🎩', '巫师风格尖顶帽，带魔法光泽质感。', '热门', '#f97316', 680, 'coins', 'skin', 2),
(3, '学者眼镜', '👓', '金丝边圆框眼镜，增加学者气质。', NULL, NULL, 320, 'coins', 'skin', 3),
(4, '猫耳发箍', '🎀', '可爱猫耳造型发箍，粉紫渐变配色。', NULL, NULL, 220, 'coins', 'skin', 4),
(5, '云朵小床', '☁️', '柔软云朵造型宠物床，宠物休息时恢复速度+20%。', '限定', '#8b5cf6', 880, 'coins', 'furniture', 5),
(6, '学习桌', '🪑', '紫色系书桌套装，含台灯与书架。', NULL, NULL, 1280, 'coins', 'furniture', 6),
(7, '星空地毯', '🌟', '星辰图案圆形地毯，铺在宠物小屋前。', NULL, NULL, 420, 'coins', 'furniture', 7),
(8, '小橙玩偶', '🧸', '小橙同款毛绒公仔，手感超软。', NULL, NULL, 450, 'coins', 'prop', 8),
(9, '专注计时器', '⏱️', '番茄钟造型桌面摆件，学习氛围+1。', NULL, NULL, 240, 'coins', 'prop', 9),
(10, '许愿瓶', '🫙', '星光许愿玻璃瓶，内含闪烁星砂。', '新品', '#34d399', 160, 'coins', 'prop', 10),
(11, '星空笔记本', '📓', '紫色星空封面手账，内页含星座图案。', NULL, NULL, 180, 'coins', 'prop', 11),
(12, '周年限定礼盒', '🎁', '一周年纪念限定套装，含全部限定外观。', '限定', '#fbbf24', 2480, 'coins', 'limited', 12);

INSERT IGNORE INTO mall_purchases (user_id, item_id) VALUES
(1, 1), (1, 2), (1, 3), (1, 4);

INSERT IGNORE INTO mall_cart_items (user_id, item_id, quantity) VALUES
(1, 5, 1);

INSERT INTO mall_orders (id, user_id, order_no, total, status, created_at) VALUES
(1, 1, 'ORD-20240601-001', 980, 'pending', '2026-06-01 10:30:00'),
(2, 1, 'ORD-20240528-002', 680, 'done', '2026-05-28 14:20:00'),
(3, 1, 'ORD-20240520-003', 1760, 'claim', '2026-05-20 09:15:00')
ON DUPLICATE KEY UPDATE order_no = VALUES(order_no);

INSERT INTO mall_order_items (order_id, item_id, name, price, quantity, image) VALUES
(1, 1, '星空书包', 980, 1, '🎒'),
(2, 2, '魔法帽', 680, 1, '🎩'),
(3, 5, '云朵小床', 880, 2, '☁️')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT IGNORE INTO mall_outfits (id, user_id, name) VALUES (1, 1, 'default');

INSERT IGNORE INTO mall_outfit_items (outfit_id, item_id, category) VALUES
(1, 1, 1), (1, 2, 1), (1, 3, 1);

INSERT INTO medals (id, user_id, name, description, icon, category, earned, earned_date, rarity, color) VALUES
('mall_first', 1, '首次购物', '在商城购买第一件商品', 'bag-shopping', 'special', 0, NULL, 'common', '#f472b6')
ON DUPLICATE KEY UPDATE name = VALUES(name);
