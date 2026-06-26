import pool from '../src/config/db.js'

try {
  await pool.query(
    "ALTER TABLE users ADD COLUMN ambient_sound VARCHAR(20) DEFAULT 'rain' AFTER vip",
  )
  console.log('ambient_sound 字段已添加')
} catch (err) {
  if (err.code === 'ER_DUP_FIELDNAME') {
    console.log('ambient_sound 字段已存在')
  } else {
    throw err
  }
}

await pool.end()
