import { Router } from 'express'
import pool from '../config/db.js'
import { resolveUserId } from '../utils/auth.js'
import { buildGrowthReport } from '../utils/growthReport.js'
import { buildGrowthSharePayload, resolveGrowthShareAction } from '../utils/growthShare.js'
import { buildPetNurturePage } from '../utils/petNurture.js'

const router = Router()

router.get('/', async (req, res, next) => {
  try {
    const userId = resolveUserId(req)
    const period = req.query.period === 'month' ? 'month' : 'week'
    const data = await buildGrowthReport(pool, userId, period)
    if (!data) {
      return res.status(404).json({ success: false, message: '用户不存在' })
    }
    res.json({ success: true, data })
  } catch (err) {
    next(err)
  }
})

router.post('/share', async (req, res, next) => {
  try {
    const userId = resolveUserId(req)
    const period = req.body.period === 'month' ? 'month' : 'week'
    const action = String(req.body.action || 'preview')
    const payload = await buildGrowthSharePayload(
      pool,
      userId,
      period,
      buildGrowthReport,
      buildPetNurturePage,
    )

    if (!payload) {
      return res.status(404).json({ success: false, message: '用户不存在' })
    }

    if (action === 'preview') {
      return res.json({ success: true, data: payload })
    }

    const result = resolveGrowthShareAction(action, payload)
    if (!result) {
      return res.status(400).json({ success: false, message: '无效的分享操作' })
    }

    res.json({
      success: true,
      data: { ...payload, ...result },
    })
  } catch (err) {
    next(err)
  }
})

export default router
