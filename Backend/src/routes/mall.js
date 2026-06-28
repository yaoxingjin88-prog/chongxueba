import { Router } from 'express'
import pool from '../config/db.js'
import { resolveUserId } from '../utils/auth.js'
import { recordCoinTx, unlockMedal } from '../services/achievementService.js'

const router = Router()

const CATEGORY_TO_INT = { skin: 1, furniture: 2, prop: 3, limited: 4, all: 0 }
const INT_TO_CATEGORY = { 1: 'skin', 2: 'furniture', 3: 'prop', 4: 'limited' }

function formatItem(row) {
  const categoryInt = CATEGORY_TO_INT[row.category] ?? Number(row.category) ?? 0
  return {
    id: row.id,
    category: categoryInt,
    name: row.name,
    price: row.price,
    priceType: row.price_type || 'coins',
    image: row.icon,
    description: row.description || '',
    tag: row.tag || null,
    tagColor: row.tag_color || null,
  }
}

function buildCategoryFilter(categoryIndex) {
  const idx = Number(categoryIndex) || 0
  if (idx === 0) return { sql: '', params: [] }
  const cat = INT_TO_CATEGORY[idx]
  if (!cat) return { sql: '', params: [] }
  return { sql: ' WHERE category = ?', params: [cat] }
}

function generateOrderNo() {
  const now = new Date()
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '')
  const rand = String(Math.floor(Math.random() * 9999)).padStart(4, '0')
  return `ORD-${dateStr}-${rand}`
}

async function attachOwned(userId, items) {
  if (!items.length) return items
  const ids = items.map((i) => i.id)
  const [ownedRows] = await pool.query(
    `SELECT item_id FROM mall_purchases WHERE user_id = ? AND item_id IN (${ids.map(() => '?').join(',')})`,
    [userId, ...ids],
  )
  const ownedSet = new Set(ownedRows.map((r) => r.item_id))
  return items.map((item) => ({ ...item, owned: ownedSet.has(item.id) }))
}

router.get('/items/search', async (req, res, next) => {
  try {
    const userId = resolveUserId(req)
    const q = (req.query.q || '').trim()
    if (!q) return res.json({ success: true, data: [] })
    const [rows] = await pool.query(
      'SELECT * FROM mall_items WHERE name LIKE ? OR description LIKE ? ORDER BY sort_order, id',
      [`%${q}%`, `%${q}%`],
    )
    const data = await attachOwned(userId, rows.map(formatItem))
    res.json({ success: true, data })
  } catch (err) {
    next(err)
  }
})

router.get('/items/featured', async (req, res, next) => {
  try {
    const userId = resolveUserId(req)
    const [rows] = await pool.query(
      "SELECT * FROM mall_items WHERE tag IN ('限定', '稀有') ORDER BY price DESC LIMIT 4",
    )
    const data = await attachOwned(userId, rows.map(formatItem))
    res.json({ success: true, data })
  } catch (err) {
    next(err)
  }
})

router.get('/items/hot', async (req, res, next) => {
  try {
    const userId = resolveUserId(req)
    const [rows] = await pool.query(
      "SELECT * FROM mall_items WHERE tag IN ('热门', '新品') OR tag IS NULL ORDER BY price ASC LIMIT 6",
    )
    const data = await attachOwned(userId, rows.map(formatItem))
    res.json({ success: true, data })
  } catch (err) {
    next(err)
  }
})

router.get('/items/:id', async (req, res, next) => {
  try {
    const userId = resolveUserId(req)
    const id = Number(req.params.id)
    const [rows] = await pool.query('SELECT * FROM mall_items WHERE id = ?', [id])
    if (!rows.length) {
      return res.status(404).json({ success: false, message: '商品不存在' })
    }
    const [owned] = await pool.query(
      'SELECT id FROM mall_purchases WHERE user_id = ? AND item_id = ?',
      [userId, id],
    )
    res.json({
      success: true,
      data: { ...formatItem(rows[0]), owned: owned.length > 0 },
    })
  } catch (err) {
    next(err)
  }
})

router.get('/items', async (req, res, next) => {
  try {
    const userId = resolveUserId(req)
    const { sql, params } = buildCategoryFilter(req.query.category)
    const [rows] = await pool.query(
      `SELECT * FROM mall_items${sql} ORDER BY sort_order, id`,
      params,
    )
    const data = await attachOwned(userId, rows.map(formatItem))
    res.json({ success: true, data })
  } catch (err) {
    next(err)
  }
})

async function processPurchase(userId, itemId) {
  const [items] = await pool.query('SELECT * FROM mall_items WHERE id = ?', [itemId])
  if (!items.length) return { error: { status: 404, message: '商品不存在' } }
  const item = items[0]

  const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [userId])
  if (!users.length) return { error: { status: 404, message: '用户不存在' } }
  const user = users[0]

  const balanceField = item.price_type === 'gems' ? 'gems' : 'coins'
  if (user[balanceField] < item.price) {
    return { error: { status: 400, message: balanceField === 'gems' ? '钻石不足' : '金币不足' } }
  }

  const [existing] = await pool.query(
    'SELECT id FROM mall_purchases WHERE user_id = ? AND item_id = ?',
    [userId, itemId],
  )
  if (existing.length) {
    return { error: { status: 400, message: '已拥有该商品' } }
  }

  await pool.query(`UPDATE users SET ${balanceField} = ${balanceField} - ? WHERE id = ?`, [
    item.price,
    userId,
  ])
  await pool.query('INSERT INTO mall_purchases (user_id, item_id) VALUES (?, ?)', [userId, itemId])

  await pool.query('DELETE FROM mall_cart_items WHERE user_id = ? AND item_id = ?', [userId, itemId])

  if (balanceField === 'coins') {
    await recordCoinTx(userId, -item.price, 'mall_purchase', String(itemId))
  }

  const [countRows] = await pool.query(
    'SELECT COUNT(*) AS cnt FROM mall_purchases WHERE user_id = ?',
    [userId],
  )
  if (countRows[0].cnt === 1) {
    await unlockMedal(userId, 'mall_first')
  }

  const orderNo = generateOrderNo()
  const [orderResult] = await pool.query(
    'INSERT INTO mall_orders (user_id, order_no, total, status, address) VALUES (?, ?, ?, ?, ?)',
    [userId, orderNo, item.price, 'done', null],
  )
  await pool.query(
    'INSERT INTO mall_order_items (order_id, item_id, name, price, quantity, image) VALUES (?, ?, ?, ?, ?, ?)',
    [orderResult.insertId, item.id, item.name, item.price, 1, item.icon],
  )

  const [updated] = await pool.query('SELECT coins, gems FROM users WHERE id = ?', [userId])
  return { item, orderNo, orderId: orderResult.insertId, coinsLeft: updated[0].coins, gems: updated[0].gems }
}

router.post('/purchase', async (req, res, next) => {
  try {
    const userId = resolveUserId(req)
    const itemId = Number(req.body.itemId)
    if (!itemId) {
      return res.status(400).json({ success: false, message: '缺少 itemId' })
    }

    const result = await processPurchase(userId, itemId)
    if (result.error) {
      return res.status(result.error.status).json({ success: false, message: result.error.message })
    }

    res.json({
      success: true,
      message: '购买成功',
      data: {
        itemId,
        orderNo: result.orderNo,
        orderId: result.orderId,
        coinsLeft: result.coinsLeft,
        coins: result.coinsLeft,
        gems: result.gems,
      },
    })
  } catch (err) {
    next(err)
  }
})

router.get('/cart', async (req, res, next) => {
  try {
    const userId = resolveUserId(req)
    const [rows] = await pool.query(
      `SELECT c.id AS cartId, c.item_id AS id, c.quantity, c.added_at,
              m.name, m.price, m.icon AS image, m.tag, m.tag_color AS tagColor
       FROM mall_cart_items c
       JOIN mall_items m ON c.item_id = m.id
       LEFT JOIN mall_purchases p ON p.user_id = c.user_id AND p.item_id = c.item_id
       WHERE c.user_id = ? AND p.id IS NULL
       ORDER BY c.added_at DESC`,
      [userId],
    )

    await pool.query(
      `DELETE c FROM mall_cart_items c
       INNER JOIN mall_purchases p ON p.user_id = c.user_id AND p.item_id = c.item_id
       WHERE c.user_id = ?`,
      [userId],
    )

    res.json({ success: true, data: rows })
  } catch (err) {
    next(err)
  }
})

router.post('/cart/add', async (req, res, next) => {
  try {
    const userId = resolveUserId(req)
    const itemId = Number(req.body.itemId)
    const quantity = Number(req.body.quantity) || 1
    if (!itemId) {
      return res.status(400).json({ success: false, message: '缺少 itemId' })
    }

    const [items] = await pool.query('SELECT id FROM mall_items WHERE id = ?', [itemId])
    if (!items.length) {
      return res.status(404).json({ success: false, message: '商品不存在' })
    }

    const [owned] = await pool.query(
      'SELECT id FROM mall_purchases WHERE user_id = ? AND item_id = ?',
      [userId, itemId],
    )
    if (owned.length) {
      return res.status(400).json({ success: false, message: '已拥有该商品' })
    }

    const [existing] = await pool.query(
      'SELECT id FROM mall_cart_items WHERE user_id = ? AND item_id = ?',
      [userId, itemId],
    )
    if (existing.length) {
      await pool.query('UPDATE mall_cart_items SET quantity = quantity + ? WHERE id = ?', [
        quantity,
        existing[0].id,
      ])
    } else {
      await pool.query(
        'INSERT INTO mall_cart_items (user_id, item_id, quantity) VALUES (?, ?, ?)',
        [userId, itemId, quantity],
      )
    }

    const [countRows] = await pool.query(
      'SELECT COUNT(*) AS count FROM mall_cart_items WHERE user_id = ?',
      [userId],
    )
    res.json({ success: true, data: { cartCount: countRows[0].count } })
  } catch (err) {
    next(err)
  }
})

router.patch('/cart/:id', async (req, res, next) => {
  try {
    const userId = resolveUserId(req)
    const id = Number(req.params.id)
    const quantity = Number(req.body.quantity)
    if (!quantity || quantity < 1) {
      return res.status(400).json({ success: false, message: '数量无效' })
    }

    const [rows] = await pool.query(
      'SELECT id FROM mall_cart_items WHERE id = ? AND user_id = ?',
      [id, userId],
    )
    if (!rows.length) {
      return res.status(404).json({ success: false, message: '购物车商品不存在' })
    }

    await pool.query('UPDATE mall_cart_items SET quantity = ? WHERE id = ?', [quantity, id])
    res.json({ success: true, data: { id, quantity } })
  } catch (err) {
    next(err)
  }
})

router.delete('/cart/:id', async (req, res, next) => {
  try {
    const userId = resolveUserId(req)
    const id = Number(req.params.id)
    const [rows] = await pool.query(
      'SELECT id FROM mall_cart_items WHERE id = ? AND user_id = ?',
      [id, userId],
    )
    if (!rows.length) {
      return res.status(404).json({ success: false, message: '购物车商品不存在' })
    }

    await pool.query('DELETE FROM mall_cart_items WHERE id = ?', [id])
    res.json({ success: true, data: { id } })
  } catch (err) {
    next(err)
  }
})

router.post('/orders', async (req, res, next) => {
  try {
    const userId = resolveUserId(req)
    const { items, address } = req.body
    if (!items?.length) {
      return res.status(400).json({ success: false, message: '缺少订单商品' })
    }

    const now = new Date()
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '')
    const rand = String(Math.floor(Math.random() * 9999)).padStart(4, '0')
    const orderNo = `ORD-${dateStr}-${rand}`

    let total = 0
    const orderItems = []
    for (const item of items) {
      const [dbRows] = await pool.query('SELECT * FROM mall_items WHERE id = ?', [item.itemId])
      if (!dbRows.length) continue
      const dbItem = dbRows[0]
      const qty = 1

      const [owned] = await pool.query(
        'SELECT id FROM mall_purchases WHERE user_id = ? AND item_id = ?',
        [userId, dbItem.id],
      )
      if (owned.length) continue

      total += dbItem.price * qty
      orderItems.push({
        itemId: dbItem.id,
        name: dbItem.name,
        price: dbItem.price,
        quantity: qty,
        image: dbItem.icon,
        priceType: dbItem.price_type,
      })
    }

    if (!orderItems.length) {
      return res.status(400).json({ success: false, message: '没有有效的商品' })
    }

    const skipped = items.length - orderItems.length

    const [users] = await pool.query('SELECT coins, gems FROM users WHERE id = ?', [userId])
    if (!users.length) {
      return res.status(404).json({ success: false, message: '用户不存在' })
    }
    const user = users[0]
    if (user.coins < total) {
      return res.status(400).json({ success: false, message: '金币不足' })
    }

    await pool.query('UPDATE users SET coins = coins - ? WHERE id = ?', [total, userId])
    await recordCoinTx(userId, -total, 'mall_order', orderNo)

    const [orderResult] = await pool.query(
      'INSERT INTO mall_orders (user_id, order_no, total, status, address) VALUES (?, ?, ?, ?, ?)',
      [userId, orderNo, total, 'pending', address || null],
    )
    const orderId = orderResult.insertId

    for (const oi of orderItems) {
      await pool.query(
        'INSERT INTO mall_order_items (order_id, item_id, name, price, quantity, image) VALUES (?, ?, ?, ?, ?, ?)',
        [orderId, oi.itemId, oi.name, oi.price, oi.quantity, oi.image],
      )
      await pool.query('INSERT INTO mall_purchases (user_id, item_id) VALUES (?, ?)', [
        userId,
        oi.itemId,
      ])
    }

    const [countRows] = await pool.query(
      'SELECT COUNT(*) AS cnt FROM mall_purchases WHERE user_id = ?',
      [userId],
    )
    if (countRows[0].cnt >= 1) {
      await unlockMedal(userId, 'mall_first')
    }

    for (const oi of orderItems) {
      await pool.query('DELETE FROM mall_cart_items WHERE user_id = ? AND item_id = ?', [
        userId,
        oi.itemId,
      ])
    }

    res.json({
      success: true,
      data: { orderId, orderNo, total, coinsLeft: user.coins - total, skipped },
    })
  } catch (err) {
    next(err)
  }
})

router.get('/orders', async (req, res, next) => {
  try {
    const userId = resolveUserId(req)
    const status = req.query.status
    let orders
    if (status) {
      const [rows] = await pool.query(
        'SELECT * FROM mall_orders WHERE user_id = ? AND status = ? ORDER BY created_at DESC',
        [userId, status],
      )
      orders = rows
    } else {
      const [rows] = await pool.query(
        'SELECT * FROM mall_orders WHERE user_id = ? ORDER BY created_at DESC',
        [userId],
      )
      orders = rows
    }

    const result = []
    for (const order of orders) {
      const [items] = await pool.query('SELECT * FROM mall_order_items WHERE order_id = ?', [
        order.id,
      ])
      result.push({ ...order, items })
    }

    res.json({ success: true, data: result })
  } catch (err) {
    next(err)
  }
})

router.get('/dress-up/items', async (req, res, next) => {
  try {
    const userId = resolveUserId(req)
    const [rows] = await pool.query(
      `SELECT p.item_id AS id, m.name, m.icon AS image, m.category,
              m.tag, m.tag_color AS tagColor,
              COALESCE(o.equipped, 0) AS equipped
       FROM mall_purchases p
       JOIN mall_items m ON p.item_id = m.id
       LEFT JOIN (
         SELECT oi.item_id, 1 AS equipped
         FROM mall_outfit_items oi
         WHERE oi.outfit_id = (
           SELECT id FROM mall_outfits WHERE user_id = ? AND name = 'default' LIMIT 1
         )
       ) o ON p.item_id = o.item_id
       WHERE p.user_id = ?
       ORDER BY p.id`,
      [userId, userId],
    )
    const data = rows.map((row) => ({
      ...row,
      category: CATEGORY_TO_INT[row.category] ?? 0,
      equipped: Boolean(row.equipped),
    }))
    res.json({ success: true, data })
  } catch (err) {
    next(err)
  }
})

router.post('/dress-up/save', async (req, res, next) => {
  try {
    const userId = resolveUserId(req)
    const { items } = req.body
    if (!Array.isArray(items)) {
      return res.status(400).json({ success: false, message: '缺少搭配数据' })
    }

    const [outfits] = await pool.query(
      'SELECT id FROM mall_outfits WHERE user_id = ? AND name = ?',
      [userId, 'default'],
    )
    let outfitId
    if (outfits.length) {
      outfitId = outfits[0].id
    } else {
      const [result] = await pool.query(
        'INSERT INTO mall_outfits (user_id, name) VALUES (?, ?)',
        [userId, 'default'],
      )
      outfitId = result.insertId
    }

    await pool.query('DELETE FROM mall_outfit_items WHERE outfit_id = ?', [outfitId])

    for (const item of items) {
      await pool.query(
        'INSERT INTO mall_outfit_items (outfit_id, item_id, category) VALUES (?, ?, ?)',
        [outfitId, item.id || item.itemId, item.category || 0],
      )
    }

    res.json({ success: true, data: { saved: true } })
  } catch (err) {
    next(err)
  }
})

export default router
