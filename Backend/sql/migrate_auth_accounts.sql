USE chong_xueba;

ALTER TABLE users ADD COLUMN phone VARCHAR(20) NULL AFTER name;
ALTER TABLE users ADD COLUMN login_account VARCHAR(50) NULL AFTER phone;
ALTER TABLE users ADD COLUMN password_hash VARCHAR(64) NOT NULL DEFAULT '' AFTER login_account;

CREATE UNIQUE INDEX uk_users_phone ON users (phone);
CREATE UNIQUE INDEX uk_users_login_account ON users (login_account);

UPDATE users SET
  phone = '18888888888',
  login_account = 'xiaogun',
  password_hash = '9b6a656ac7fb4ac8cc2a151c0f597252d9906f8c0e21d444f66d8cb1f131f9b5'
WHERE id = 1 AND (phone IS NULL OR phone = '' OR login_account IS NULL OR login_account = '');
