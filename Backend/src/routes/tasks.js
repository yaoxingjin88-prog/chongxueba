import { Router } from 'express'
import pool from '../config/db.js'
import { resolveUserId } from '../utils/auth.js'
import { checkAndUnlockAchievements, recordCoinTx } from '../services/achievementService.js'
import { applyVipCoinBonus, syncVipStatus } from '../services/vipService.js'
import {
  CHEST_TIERS,
  MAX_CHEST_OPENS_PER_DAY,
  calcActivity,
  mapTaskRow,
  fetchTasksWithProgress,
  fetchTaskDetail,
  completeTaskForUser,
  getWeekEndCountdown,
  getEventEndCountdown,
  getChestStatusMessage,
  formatProgress,
} from '../services/taskService.js'

const router = Router()

function toDateKey(value) {
  if (value instanceof Date) {
    return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`
  }
  return String(value).slice(0, 10)
}

router.get('/', async (req, res, next) => {
  try {
    const userId = resolveUserId(req)
    const type = req.query.type || 'daily'
    const rows = await fetchTasksWithProgress(userId, type)
    const tasks = rows.map(mapTaskRow)
    const currentActivity = calcActivity(rows)

    const payload = { tasks, currentActivity }
    if (type === 'weekly') {
      payload.weekCountdown = getWeekEndCountdown()
    }
    if (type === 'event') {
      payload.eventCountdown = getEventEndCountdown()
    }

    res.json({ success: true, data: payload })
  } catch (err) {
    next(err)
  }
})

router.get('/history', async (req, res, next) => {
  try {
    const userId = resolveUserId(req)
    const filter = req.query.filter || 'all'

    let dateCondition = ''
    if (filter === 'today') dateCondition = 'AND ut.activity_date = CURDATE()'
    else if (filter === 'completed') dateCondition = 'AND ut.done = 1'
    else if (filter === 'progress') dateCondition = 'AND ut.done = 0 AND ut.current_count > 0'
    else if (filter === 'expired') dateCondition = 'AND ut.done = 0 AND ut.activity_date < CURDATE()'

    const [records] = await pool.query(
      `SELECT t.title, t.icon, t.color, t.exp_reward, t.coin_reward, t.type, t.target_count, t.progress_unit,
              ut.current_count, ut.done, ut.activity_date, ut.completed_at, ut.id AS record_id
       FROM user_tasks ut
       JOIN tasks t ON t.id = ut.task_id
       WHERE ut.user_id = ? ${dateCondition}
       ORDER BY ut.activity_date DESC, ut.id DESC
       LIMIT 50`,
      [userId],
    )

    const [[todayStats]] = await pool.query(
      `SELECT COUNT(*) AS todayCompleted
       FROM user_tasks
       WHERE user_id = ? AND activity_date = CURDATE() AND done = 1`,
      [userId],
    )

    const [[userRow]] = await pool.query(
      'SELECT streak_days FROM users WHERE id = ?',
      [userId],
    )

    const [[pointsRow]] = await pool.query(
      `SELECT COALESCE(SUM(t.exp_reward), 0) AS totalPoints
       FROM user_tasks ut
       JOIN tasks t ON t.id = ut.task_id
       WHERE ut.user_id = ? AND ut.done = 1`,
      [userId],
    )

    const grouped = {}
    for (const r of records) {
      const dateKey = toDateKey(r.activity_date)
      if (!grouped[dateKey]) grouped[dateKey] = []
      grouped[dateKey].push({
        id: r.record_id,
        title: r.title,
        icon: r.icon,
        color: r.color,
        type: r.type,
        progress: formatProgress(r.current_count, r.target_count, r.progress_unit || 'times'),
        done: Boolean(r.done),
        exp: r.exp_reward,
        coins: r.coin_reward,
        date: dateKey,
        completedTime: r.completed_at
          ? new Date(r.completed_at).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
          : null,
      })
    }

    const groups = Object.entries(grouped).map(([date, items]) => ({ date, items }))

    res.json({
      success: true,
      data: {
        stats: {
          todayCompleted: todayStats?.todayCompleted || 0,
          streakDays: userRow?.streak_days || 0,
          totalPoints: pointsRow?.totalPoints || 0,
        },
        groups,
      },
    })
  } catch (err) {
    next(err)
  }
})

router.get('/activity/chests', async (req, res, next) => {
  try {
    const userId = resolveUserId(req)
    const rows = await fetchTasksWithProgress(userId, 'daily')
    const currentActivity = calcActivity(rows)

    const [claims] = await pool.query(
      'SELECT tier FROM activity_chest_claims WHERE user_id = ? AND claim_date = CURDATE()',
      [userId],
    )
    const claimedSet = new Set(claims.map((c) => c.tier))
    const claimedToday = claims.length

    const chests = CHEST_TIERS.map((c) => ({
      ...c,
      reached: currentActivity >= c.threshold,
      claimed: claimedSet.has(c.tier),
      canClaim: currentActivity >= c.threshold && !claimedSet.has(c.tier) && claimedToday < MAX_CHEST_OPENS_PER_DAY,
    }))

    const remainingOpens = Math.max(0, MAX_CHEST_OPENS_PER_DAY - claimedToday)
    const nextClaimable = chests.find((c) => c.canClaim)

    res.json({
      success: true,
      data: {
        currentActivity,
        chests,
        remainingOpens,
        maxOpensPerDay: MAX_CHEST_OPENS_PER_DAY,
        statusMessage: getChestStatusMessage(currentActivity, chests, remainingOpens),
        nextClaimableTier: nextClaimable?.tier || null,
        preview: nextClaimable?.preview || CHEST_TIERS[CHEST_TIERS.length - 1].preview,
      },
    })
  } catch (err) {
    next(err)
  }
})

router.post('/activity/chests/:tier/claim', async (req, res, next) => {
  try {
    const userId = resolveUserId(req)
    const tier = Number(req.params.tier)
    const chest = CHEST_TIERS.find((c) => c.tier === tier)
    if (!chest) {
      return res.status(404).json({ success: false, message: '宝箱不存在' })
    }

    const rows = await fetchTasksWithProgress(userId, 'daily')
    const currentActivity = calcActivity(rows)
    if (currentActivity < chest.threshold) {
      return res.status(400).json({ success: false, message: '活跃度不足，无法开启宝箱' })
    }

    const [[claimCount]] = await pool.query(
      'SELECT COUNT(*) AS cnt FROM activity_chest_claims WHERE user_id = ? AND claim_date = CURDATE()',
      [userId],
    )
    if (Number(claimCount?.cnt || 0) >= MAX_CHEST_OPENS_PER_DAY) {
      return res.status(400).json({ success: false, message: '今日开启次数已用完' })
    }

    const [existing] = await pool.query(
      'SELECT id FROM activity_chest_claims WHERE user_id = ? AND tier = ? AND claim_date = CURDATE()',
      [userId, tier],
    )
    if (existing.length) {
      return res.status(400).json({ success: false, message: '该宝箱今日已领取' })
    }

    await pool.query(
      'INSERT INTO activity_chest_claims (user_id, tier, claim_date) VALUES (?, ?, CURDATE())',
      [userId, tier],
    )

    await pool.query(
      'UPDATE users SET exp = exp + ?, coins = coins + ?, gems = gems + ? WHERE id = ?',
      [chest.exp, chest.coins, chest.gems, userId],
    )
    await recordCoinTx(userId, chest.coins, 'chest_claim', String(tier))

    const unlocked = await checkAndUnlockAchievements(userId)

    res.json({
      success: true,
      message: '宝箱开启成功',
      data: {
        tier: chest.tier,
        label: chest.label,
        rewards: { exp: chest.exp, coins: chest.coins, gems: chest.gems },
        unlocked,
      },
    })
  } catch (err) {
    next(err)
  }
})

router.get('/:id', async (req, res, next) => {
  try {
    const userId = resolveUserId(req)
    const taskId = Number(req.params.id)
    const row = await fetchTaskDetail(userId, taskId)
    if (!row) {
      return res.status(404).json({ success: false, message: '任务不存在' })
    }

    const mapped = mapTaskRow(row)
    mapped.typeLabel =
      { daily: '每日任务', weekly: '每周挑战', goal: '目标挑战', streak: '连续挑战', event: '限时活动' }[row.type] || '任务'

    if (row.type === 'weekly') {
      mapped.weekCountdown = getWeekEndCountdown()
    }

    res.json({ success: true, data: mapped })
  } catch (err) {
    next(err)
  }
})

router.patch('/:id/complete', async (req, res, next) => {
  try {
    const taskId = Number(req.params.id)
    const userId = resolveUserId(req)
    const result = await completeTaskForUser(userId, taskId)
    if (!result) {
      return res.status(404).json({ success: false, message: '任务不存在' })
    }
    if (result.alreadyDone) {
      return res.status(400).json({ success: false, message: '任务已完成' })
    }

    const { task, petRewards } = result
    const vipStatus = await syncVipStatus(userId)
    const baseCoins = task.coin_reward
    const bonusCoins = applyVipCoinBonus(baseCoins, vipStatus.active) - baseCoins
    if (bonusCoins > 0) {
      await pool.query('UPDATE users SET coins = coins + ? WHERE id = ?', [bonusCoins, userId])
    }
    const totalCoins = baseCoins + bonusCoins
    await recordCoinTx(userId, totalCoins, 'task_complete', String(taskId))
    const unlocked = await checkAndUnlockAchievements(userId)

    res.json({
      success: true,
      message: '任务已完成',
      data: {
        exp: task.exp_reward,
        coins: totalCoins,
        vipBonus: bonusCoins,
        petRewards,
        unlocked,
      },
    })
  } catch (err) {
    next(err)
  }
})

export default router
