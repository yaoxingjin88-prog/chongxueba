import { Router } from 'express'
import pool from '../config/db.js'
import { resolveUserId } from '../utils/auth.js'
import { buildPetNurturePage, performPetAction, claimIntimacyReward } from '../utils/petNurture.js'
import { buildPetSharePayload, resolvePetShareAction } from '../utils/petShare.js'
import { buildPetEncyclopedia } from '../utils/petEncyclopedia.js'

const router = Router()

router.get('/', async (req, res, next) => {
  try {
    const userId = resolveUserId(req)
    const data = await buildPetNurturePage(pool, userId)
    if (!data) {
      return res.status(404).json({ success: false, message: '宠物不存在' })
    }
    res.json({ success: true, data })
  } catch (err) {
    next(err)
  }
})

router.post('/feed', async (req, res, next) => {
  try {
    const userId = resolveUserId(req)
    const data = await performPetAction(pool, userId, 'feed')
    res.json({ success: true, message: '喂养成功，小橙很开心～', data })
  } catch (err) {
    next(err)
  }
})

router.post('/action', async (req, res, next) => {
  try {
    const userId = resolveUserId(req)
    const type = String(req.body.type || '').trim()
    const data = await performPetAction(pool, userId, type)
    const labels = { feed: '喂养', accompany: '陪伴', train: '训练', bath: '洗澡', sleep: '睡眠' }
    res.json({
      success: true,
      message: `${labels[type] || '互动'}完成`,
      data,
    })
  } catch (err) {
    if (err.message === '未知互动类型' || err.message === '金币不足' || err.message === '宠物不存在') {
      return res.status(400).json({ success: false, message: err.message })
    }
    next(err)
  }
})

router.post('/intimacy-reward', async (req, res, next) => {
  try {
    const userId = resolveUserId(req)
    const data = await claimIntimacyReward(pool, userId)
    res.json({ success: true, message: '亲密奖励已领取', data })
  } catch (err) {
    if (err.message.includes('亲密度')) {
      return res.status(400).json({ success: false, message: err.message })
    }
    next(err)
  }
})

router.get('/encyclopedia', async (req, res, next) => {
  try {
    const userId = resolveUserId(req)
    const data = await buildPetEncyclopedia(pool, userId, buildPetNurturePage)
    res.json({ success: true, data })
  } catch (err) {
    next(err)
  }
})

router.post('/share', async (req, res, next) => {
  try {
    const userId = resolveUserId(req)
    const action = String(req.body.action || 'preview')
    const payload = await buildPetSharePayload(pool, userId, buildPetNurturePage)

    if (!payload) {
      return res.status(404).json({ success: false, message: '宠物不存在' })
    }

    if (action === 'preview') {
      return res.json({ success: true, data: payload })
    }

    const result = resolvePetShareAction(action, payload)
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
