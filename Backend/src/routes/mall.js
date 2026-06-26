import { Router } from 'express'
import pool from '../config/db.js'

const router = Router()
const DEFAULT_USER_ID = 1

const categoryMap = ['all', 'skin', 'furniture', 'prop', 'limited']

router.get('/items', async (req, res, next) => {
  try {
    const categoryIndex = Number(req.query.category) || 0
    const category = categoryMap[categoryIndex] || 'all'

    let sql = 'SELECT * FROM mall_items'
    const params = []
    if (category !== 'all') {
      sql += ' WHERE category = ?'
      params.push(category)
    }
    sql += ' ORDER BY sort_order'

    const [rows] = await pool.query(sql, params)
    const items = rows.map((item) => ({
      id: item.id,
      name: item.name,
      price: item.price,
      icon: item.icon,
      type: item.price_type,
      category: item.category,
    }))

    res.json({ success: true, data: items })
  } catch (err) {
    next(err)
  }
})

router.post('/purchase', async (req, res, next) => {
  try {
    const userId = Number(req.body.userId) || DEFAULT_USER_ID
    const itemId = Number(req.body.itemId)

    const [items] = await pool.query('SELECT * FROM mall_items WHERE id = ?', [itemId])
    if (!items.length) {
      return res.status(404).json({ success: false, message: '商品不存在' })
    }
    const item = items[0]

    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [userId])
    if (!users.length) {
      return res.status(404).json({ success: false, message: '用户不存在' })
    }
    const user = users[0]

    const balanceField = item.price_type === 'gems' ? 'gems' : 'coins'
    if (user[balanceField] < item.price) {
      return res.status(400).json({ success: false, message: '余额不足' })
    }

    await pool.query(`UPDATE users SET ${balanceField} = ${balanceField} - ? WHERE id = ?`, [
      item.price,
      userId,
    ])

    const [updated] = await pool.query('SELECT coins, gems FROM users WHERE id = ?', [userId])
    res.json({
      success: true,
      message: '购买成功',
      data: { coins: updated[0].coins, gems: updated[0].gems },
    })
  } catch (err) {
    next(err)
  }
})

export default router
