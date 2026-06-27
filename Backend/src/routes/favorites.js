import { Router } from 'express'
import pool from '../config/db.js'
import { resolveUserId } from '../utils/auth.js'

const router = Router()

const TYPE_LABELS = {
  course: '课程',
  room: '自习室',
  buddy: '搭子',
  outfit: '装扮',
  achievement: '成就',
  material: '资料',
}

const CATEGORIES = [
  { key: 'all', label: '全部' },
  { key: 'course', label: '课程' },
  { key: 'room', label: '自习室' },
  { key: 'buddy', label: '搭子' },
  { key: 'outfit', label: '装扮' },
  { key: 'achievement', label: '成就' },
  { key: 'material', label: '资料' },
]

function parseMeta(raw) {
  if (!raw) return {}
  if (typeof raw === 'object') return raw
  try {
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

function formatItem(row) {
  const meta = parseMeta(row.meta)
  return {
    id: row.id,
    type: row.item_type,
    typeLabel: TYPE_LABELS[row.item_type] || row.item_type,
    title: row.title,
    coverSeed: row.cover_seed,
    tags: meta.tags || [],
    subtitle: meta.subtitle || '',
    progress: meta.progress ?? null,
    onlineCount: meta.onlineCount ?? null,
    focusRate: meta.focusRate ?? null,
    level: meta.level ?? null,
    studyGoal: meta.studyGoal || '',
    status: meta.status || '',
    unlocked: meta.unlocked ?? null,
    actionLabel: meta.actionLabel || '查看',
    actionPath: meta.actionPath || '',
  }
}

router.get('/', async (req, res, next) => {
  try {
    const userId = resolveUserId(req)
    const category = String(req.query.category || 'all')

    const [countRows] = await pool.query(
      'SELECT COUNT(*) AS total FROM user_favorites WHERE user_id = ?',
      [userId],
    )

    let sql = 'SELECT * FROM user_favorites WHERE user_id = ?'
    const params = [userId]
    if (category !== 'all') {
      sql += ' AND item_type = ?'
      params.push(category)
    }
    sql += ' ORDER BY sort_order ASC, favorited_at DESC'

    const [rows] = await pool.query(sql, params)

    res.json({
      success: true,
      data: {
        summary: {
          total: countRows[0].total,
          title: '我的收藏夹',
          slogan: '把喜欢的学习内容都收进星星口袋',
        },
        categories: CATEGORIES,
        items: rows.map(formatItem),
      },
    })
  } catch (err) {
    next(err)
  }
})

router.delete('/:id', async (req, res, next) => {
  try {
    const userId = resolveUserId(req)
    const id = Number(req.params.id)
    const [result] = await pool.query(
      'DELETE FROM user_favorites WHERE id = ? AND user_id = ?',
      [id, userId],
    )
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: '收藏不存在' })
    }
    res.json({ success: true, message: '已取消收藏' })
  } catch (err) {
    next(err)
  }
})

export default router
