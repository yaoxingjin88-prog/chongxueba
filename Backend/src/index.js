import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import pool from './config/db.js'
import { errorHandler, notFound } from './middleware/errorHandler.js'
import userRoutes from './routes/user.js'
import taskRoutes from './routes/tasks.js'
import mallRoutes from './routes/mall.js'
import growthRoutes from './routes/growth.js'
import achievementRoutes from './routes/achievements.js'
import petRoutes from './routes/pet.js'
import focusRoutes from './routes/focus.js'
import studyRoomRoutes from './routes/studyRoom.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1')
    res.json({ success: true, message: '服务正常' })
  } catch {
    res.status(503).json({ success: false, message: '数据库连接失败' })
  }
})

app.use('/api/user', userRoutes)
app.use('/api/tasks', taskRoutes)
app.use('/api/mall', mallRoutes)
app.use('/api/growth', growthRoutes)
app.use('/api/achievements', achievementRoutes)
app.use('/api/pet', petRoutes)
app.use('/api/focus', focusRoutes)
app.use('/api/study-room', studyRoomRoutes)

app.use(notFound)
app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`宠学霸 API 服务已启动: http://localhost:${PORT}`)
})
