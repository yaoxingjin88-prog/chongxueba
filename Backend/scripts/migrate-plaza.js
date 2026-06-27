import mysql from 'mysql2/promise'
import dotenv from 'dotenv'

dotenv.config()

const columns = [
  "ADD COLUMN category VARCHAR(30) DEFAULT 'recommend' AFTER tags",
  "ADD COLUMN room_label VARCHAR(30) NOT NULL DEFAULT '' AFTER category",
  "ADD COLUMN member_avatars JSON NOT NULL AFTER room_label",
  "ADD COLUMN extra_members INT DEFAULT 0 AFTER member_avatars",
  'ADD COLUMN opened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER sort_order',
]

async function migratePlaza() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'chong_xueba',
  })

  for (const clause of columns) {
    try {
      await conn.query(`ALTER TABLE study_rooms ${clause}`)
    } catch (err) {
      if (err.code !== 'ER_DUP_FIELDNAME') throw err
    }
  }

  try {
    await conn.query('ALTER TABLE study_rooms ADD INDEX idx_category (category)')
  } catch (err) {
    if (err.code !== 'ER_DUP_KEYNAME') throw err
  }

  await conn.query('DELETE FROM study_rooms')
  await conn.query(`
    INSERT INTO study_rooms (room_code, name, subtitle, cover_seed, online_count, focus_rate, tags, category, room_label, member_avatars, extra_members, sort_order, opened_at) VALUES
    ('SR-8821', '英语冲刺室', '四六级真题精练 · 全程相伴', 'english-fox', 128, 95, '["四六级", "英语"]', 'cet', '英语', '["xiaocheng", "maomao", "bear", "deer"]', 12, 1, DATE_SUB(NOW(), INTERVAL 2 HOUR)),
    ('SR-6612', '考研数学夜猫房', '高数线代概率 · 难题共创', 'math-cat', 96, 92, '["考研", "数学"]', 'kaoyan', '考研', '["bear", "deer", "cat", "dog"]', 8, 2, DATE_SUB(NOW(), INTERVAL 5 HOUR)),
    ('SR-3308', '星光晚自习', '晚间沉浸学习，拒绝内耗', 'night-deer', 132, 95, '["晚间", "自律"]', 'recommend', '自律', '["xiaocheng", "maomao", "nuli", "cat", "dog"]', 8, 3, DATE_SUB(NOW(), INTERVAL 1 HOUR)),
    ('SR-1205', 'AI 专注舱', '摄像头监督 + 番茄钟陪练', 'code-bear', 86, 93, '["AI", "专注"]', 'hot', 'AI陪练', '["maomao", "bear", "deer", "nuli"]', 6, 4, DATE_SUB(NOW(), INTERVAL 3 HOUR)),
    ('SR-9903', '番茄冲刺房', '25 分钟一轮，互相监督', 'japanese-rabbit', 74, 91, '["番茄", "冲刺"]', 'hot', '番茄', '["cat", "dog", "nuli", "xiaocheng"]', 5, 5, DATE_SUB(NOW(), INTERVAL 6 HOUR)),
    ('SR-4410', '深夜图书馆', '安静模式 · 仅白噪音陪伴', 'library-owl', 58, 96, '["安静", "深夜"]', 'recommend', '安静', '["deer", "bear", "maomao"]', 4, 6, DATE_SUB(NOW(), INTERVAL 8 HOUR)),
    ('SR-5520', '编程刷题室', 'LeetCode 每日一题 · 互相监督', 'code-bear', 52, 90, '["编程", "算法"]', 'code', '编程', '["dog", "cat", "bear"]', 3, 7, DATE_SUB(NOW(), INTERVAL 12 HOUR)),
    ('SR-6630', '日语入门房', '五十音 + 日常会话 · 轻松跟学', 'japanese-rabbit', 38, 86, '["日语", "语言"]', 'language', '语言', '["nuli", "xiaocheng", "deer"]', 2, 8, DATE_SUB(NOW(), INTERVAL 1 DAY))
  `)

  await conn.end()
  console.log('广场数据迁移完成')
}

migratePlaza().catch((err) => {
  console.error(err.message)
  process.exit(1)
})
