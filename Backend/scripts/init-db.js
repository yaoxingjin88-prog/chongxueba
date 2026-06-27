import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import mysql from 'mysql2/promise'
import dotenv from 'dotenv'

dotenv.config()

const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function initDb() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
  })

  const schema = fs.readFileSync(path.join(__dirname, '../sql/schema.sql'), 'utf8')
  const seed = fs.readFileSync(path.join(__dirname, '../sql/seed.sql'), 'utf8')
  const testAccounts = fs.readFileSync(path.join(__dirname, '../sql/seed_test_accounts.sql'), 'utf8')

  await connection.query(schema)
  await connection.query(seed)
  await connection.query(testAccounts)
  await connection.end()

  console.log('数据库初始化完成')
}

initDb().catch((err) => {
  console.error('数据库初始化失败:', err.message)
  process.exit(1)
})
