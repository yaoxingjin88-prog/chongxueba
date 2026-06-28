import { Router } from 'express'
import { resolveUserId } from '../utils/auth.js'
import { getVipPage, subscribeVip } from '../services/vipService.js'

const router = Router()

router.get('/', async (req, res, next) => {
  try {
    const userId = resolveUserId(req)
    const data = await getVipPage(userId)
    res.json({ success: true, data })
  } catch (err) {
    next(err)
  }
})

router.post('/subscribe', async (req, res, next) => {
  try {
    const userId = resolveUserId(req)
    const { planId, payMethod } = req.body
    if (!planId) {
      return res.status(400).json({ success: false, message: '请选择会员方案' })
    }
    const result = await subscribeVip(userId, planId, payMethod || 'gems')
    res.json({ success: true, data: result, message: result.message })
  } catch (err) {
    if (['钻石不足', '学豆不足', '无效的会员方案', '不支持的支付方式'].includes(err.message)) {
      return res.status(400).json({ success: false, message: err.message })
    }
    next(err)
  }
})

export default router
