import pool from '../src/config/db.js'

await pool.query('DELETE FROM focus_records WHERE user_id = 1')

await pool.query(`
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
`)

const [[focus], [user]] = await Promise.all([
  pool.query('SELECT COALESCE(SUM(minutes), 0) AS total FROM focus_records WHERE user_id = 1'),
  pool.query('SELECT name, streak_days, medals, level FROM users WHERE id = 1'),
])

console.log('✓ focus_records 已更新')
console.log(`  专注总时长: ${Math.round(focus[0].total / 60)}h (${focus[0].total} 分钟)`)
console.log(`  用户: ${user[0].name} | Lv.${user[0].level} | 打卡 ${user[0].streak_days}天 | 勋章 ${user[0].medals}枚`)

await pool.end()
