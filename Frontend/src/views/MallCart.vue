<script setup>
import { ref, computed, onMounted, onActivated } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../api'
import { useToast } from '../composables/useToast'

const router = useRouter()
const toast = useToast()

const cartItems = ref([])

const total = computed(() =>
  cartItems.value.filter((i) => i.checked).reduce((s, i) => s + i.price * i.quantity, 0),
)

async function loadCart() {
  try {
    const items = await api.getCart()
    cartItems.value = items.map((item) => ({
      ...item,
      checked: true,
    }))
  } catch {
    cartItems.value = []
  }
}

async function qtyChange(item, delta) {
  const next = item.quantity + delta
  if (next < 1 || next > 99) return
  item.quantity = next
  try {
    await api.updateCartItem(item.cartId, next)
  } catch { /* ignore */ }
}

async function removeItem(item) {
  try {
    await api.removeCartItem(item.cartId)
    cartItems.value = cartItems.value.filter((i) => i.cartId !== item.cartId)
  } catch { /* ignore */ }
}

function checkout() {
  const selected = cartItems.value.filter((i) => i.checked)
  if (!selected.length) {
    toast.show('请选择要结算的商品')
    return
  }
  const payload = selected.map((i) => ({
    itemId: i.id,
    name: i.name,
    price: i.price,
    quantity: i.quantity,
    image: i.image,
  }))
  sessionStorage.setItem('mall_checkout_items', JSON.stringify(payload))
  router.push({
    path: '/mall/checkout',
    state: { items: payload },
  })
}

onMounted(loadCart)
onActivated(loadCart)
</script>

<template>
  <div class="cart-page page">
    <div class="mall-sky-bg" />

    <div class="page-content no-tab">
      <!-- 顶部标题 -->
      <div class="nav-bar">
        <button class="nav-back" @click="router.back()">
          <font-awesome-icon icon="chevron-left" />
        </button>
        <span class="nav-title">购物车</span>
        <div class="nav-spacer" />
      </div>

      <!-- 购物车列表 -->
      <div class="cart-list">
        <div v-for="item in cartItems" :key="item.cartId" class="cart-item">
          <!-- 勾选框 -->
          <button class="check-box" :class="{ checked: item.checked }" @click="item.checked = !item.checked">
            <font-awesome-icon v-if="item.checked" icon="check" />
          </button>

          <!-- 商品图片 -->
          <div class="item-img-wrap">
            <div class="item-img-bg" />
            <span class="item-img-fallback">{{ item.image || '🎁' }}</span>
          </div>

          <!-- 商品信息 -->
          <div class="item-info">
            <span class="item-name">{{ item.name }}</span>
            <div class="item-bottom">
              <span class="item-price">{{ item.price }} 金币</span>
              <div class="qty-ctrl">
                <button class="qty-btn" @click="qtyChange(item, -1)">-</button>
                <span class="qty-val">{{ item.quantity }}</span>
                <button class="qty-btn" @click="qtyChange(item, 1)">+</button>
              </div>
            </div>
          </div>

          <button class="remove-btn" @click="removeItem(item)">
            <font-awesome-icon icon="trash-can" />
          </button>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="cartItems.length === 0" class="empty-state">
        <span class="empty-icon">🛒</span>
        <p class="text-muted">购物车是空的</p>
        <button class="gradient-btn" @click="router.push('/mall')">去逛逛</button>
      </div>
    </div>

    <!-- 底部结算栏 -->
    <div v-if="cartItems.length" class="bottom-bar">
      <div class="bottom-total">
        <span class="total-label">合计</span>
        <span class="total-price">{{ total.toLocaleString() }} 金币</span>
      </div>
      <button class="checkout-btn" @click="checkout">结算</button>
    </div>
  </div>
</template>

<style scoped>
.cart-page {
  background: transparent;
}

.cart-page .page-content {
  position: relative;
  z-index: 2;
}

.nav-bar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 8px 12px;
  padding-top: calc(8px + env(safe-area-inset-top, 0px));
  position: relative; z-index: 10;
}
.nav-back {
  width: 36px; height: 36px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 50%; background: rgba(255,255,255,0.1); color: #fff; font-size: 14px;
}
.nav-title { font-size: 18px; font-weight: 800; color: #fff; letter-spacing: 1px; }
.nav-spacer { width: 36px; }

.cart-list {
  padding: 8px 14px; display: flex; flex-direction: column; gap: 10px;
  position: relative; z-index: 5;
}
.cart-item {
  display: flex; align-items: center; gap: 10px; padding: 14px;
  background: rgba(238, 234, 252, 0.75);
  backdrop-filter: blur(4px);
  border: 1px solid rgba(238, 234, 252, 0.5);
  border-radius: 16px;
}
.check-box {
  width: 22px; height: 22px; border-radius: 50%;
  border: 2px solid rgba(139, 92, 246, 0.4);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; font-size: 11px; color: #7c5cfc;
}
.check-box.checked { background: #7c5cfc; border-color: #7c5cfc; color: #fff; }
.item-img-wrap {
  width: 64px; height: 64px; border-radius: 14px; overflow: hidden;
  position: relative; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
}
.item-img-bg {
  position: absolute; inset: 0;
  background: linear-gradient(145deg, rgba(139, 92, 246, 0.2) 0%, rgba(124, 92, 252, 0.1) 100%);
  border: 1px solid rgba(255,255,255,0.1); border-radius: 14px;
}
.item-img-fallback { position: relative; z-index: 1; font-size: 28px; }
.item-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 8px; }
.item-name { font-size: 14px; font-weight: 600; color: #2d1f5e; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.item-bottom { display: flex; align-items: center; justify-content: space-between; }
.item-price { font-size: 16px; font-weight: 800; color: #fbbf24; }
.qty-ctrl { display: flex; align-items: center; }
.qty-btn {
  width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;
  font-size: 16px; color: #5b3d99;
  background: rgba(238, 234, 252, 0.6); border: 1px solid rgba(139, 92, 246, 0.25);
}
.qty-btn:first-child { border-radius: 8px 0 0 8px; }
.qty-btn:last-child { border-radius: 0 8px 8px 0; }
.qty-val {
  width: 40px; height: 30px; display: flex; align-items: center; justify-content: center;
  font-size: 14px; font-weight: 700; color: #2d1f5e;
  border-top: 1px solid rgba(139, 92, 246, 0.25);
  border-bottom: 1px solid rgba(139, 92, 246, 0.25);
}
.remove-btn {
  width: 32px; height: 32px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  color: #ef4444; font-size: 14px;
}
.empty-state {
  display: flex; flex-direction: column; align-items: center; gap: 12px;
  padding: 80px 20px; position: relative; z-index: 5;
}
.empty-icon { font-size: 48px; opacity: 0.5; }
.bottom-bar {
  position: fixed; bottom: 0; left: 50%; transform: translateX(-50%);
  width: 100%; max-width: 430px;
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 18px;
  padding-bottom: calc(14px + env(safe-area-inset-bottom, 0px));
  background: linear-gradient(180deg, rgba(30, 20, 60, 0.6) 0%, rgba(20, 12, 40, 0.9) 100%);
  backdrop-filter: blur(16px);
  border-top: 1px solid rgba(255,255,255,0.12);
  z-index: 20;
}
.bottom-total { display: flex; align-items: baseline; gap: 8px; }
.total-label { font-size: 14px; color: rgba(255,255,255,0.6); }
.total-price { font-size: 24px; font-weight: 800; color: #fbbf24; }
.checkout-btn {
  padding: 12px 32px; border-radius: 14px;
  font-size: 16px; font-weight: 700; color: #fff;
  background: linear-gradient(135deg, #8b5cf6, #6366f1);
  box-shadow: 0 4px 16px rgba(99, 102, 241, 0.35);
}
</style>
