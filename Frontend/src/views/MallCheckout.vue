<script setup>
import { ref, computed, onMounted, onActivated } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { api } from '../api'
import { useToast } from '../composables/useToast'

const router = useRouter()
const user = useUserStore()
const toast = useToast()

const items = ref([])

const subtotal = computed(() => items.value.reduce((s, i) => s + i.price * i.quantity, 0))
const discount = ref(0)
const total = computed(() => Math.max(0, subtotal.value - discount.value))

const submitting = ref(false)
const submitted = ref(false)

onMounted(loadCheckoutItems)
onActivated(loadCheckoutItems)

function loadCheckoutItems() {
  submitted.value = false
  const stateItems = history.state?.items
  if (stateItems?.length) {
    items.value = stateItems
    return
  }
  try {
    const saved = sessionStorage.getItem('mall_checkout_items')
    if (saved) {
      items.value = JSON.parse(saved)
      sessionStorage.removeItem('mall_checkout_items')
      return
    }
  } catch { /* ignore */ }
  loadFromCart()
}

async function loadFromCart() {
  try {
    const cart = await api.getCart()
    items.value = cart.map((i) => ({
      itemId: i.id,
      name: i.name,
      price: i.price,
      quantity: i.quantity,
      image: i.image,
    }))
  } catch {
    items.value = []
  }
}

async function submitOrder() {
  if (!items.value.length || submitting.value) return
  submitting.value = true
  try {
    const payload = items.value.map((i) => ({ itemId: i.itemId, quantity: i.quantity }))
    const res = await api.createOrder(payload, '小橙同学')
    if (res.coinsLeft != null) user.coins = res.coinsLeft
    await user.fetchUser()
    submitted.value = true
    sessionStorage.removeItem('mall_checkout_items')
    if (res.skipped > 0) {
      toast.show(`订单已提交，${res.skipped} 件已拥有商品已跳过`)
    } else {
      toast.show('订单提交成功')
    }
  } catch (err) {
    toast.show(err.message || '下单失败')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="checkout-page page">
    <div class="mall-sky-bg" />

    <div class="page-content no-tab">
      <!-- 顶部导航 -->
      <div class="nav-bar">
        <button class="nav-back" @click="router.back()">
          <font-awesome-icon icon="chevron-left" />
        </button>
        <span class="nav-title">确认订单</span>
        <div class="nav-spacer" />
      </div>

      <div class="checkout-body" v-if="!submitted">
        <!-- 收货信息 -->
        <div class="info-card">
          <div class="card-label">收货 / 兑换信息</div>
          <div class="info-row">
            <div class="info-avatar">
              <span>🦊</span>
            </div>
            <div class="info-detail">
              <span class="info-name">小橙同学</span>
              <span class="info-code">兑换码: XS-2024-0001</span>
            </div>
          </div>
        </div>

        <!-- 订单商品 -->
        <div class="goods-card">
          <div v-for="(item, i) in items" :key="i" class="goods-row">
            <div class="goods-left">
              <span class="goods-dot" :style="{ background: ['#7c5cfc', '#f472b6', '#fbbf24'][i] }" />
              <span class="goods-name">{{ item.name }}</span>
              <span class="goods-qty">×{{ item.quantity }}</span>
            </div>
            <span class="goods-price">
              <font-awesome-icon icon="gem" class="price-icon" />
              {{ item.price * item.quantity }}
            </span>
          </div>
          <div class="goods-divider" />
          <div class="goods-summary">
            <div class="summary-row">
              <span>商品小计</span>
              <span class="sum-num">
                <font-awesome-icon icon="gem" />
                {{ subtotal }}
              </span>
            </div>
            <div class="summary-row discount">
              <span>优惠</span>
              <span class="discount-num">-{{ discount }}</span>
            </div>
          </div>
        </div>

        <!-- 支付方式 -->
        <div class="pay-card">
          <span class="pay-label">确认收货人</span>
          <div class="pay-method">
            <font-awesome-icon icon="gem" class="pay-method-icon" style="color: #fbbf24" />
            <span>微信支付</span>
            <font-awesome-icon icon="chevron-right" class="pay-arrow" />
          </div>
        </div>
      </div>

      <!-- 提交成功 -->
      <div v-if="submitted" class="success-state">
        <span class="success-icon">🎉</span>
        <h3>订单提交成功</h3>
        <p class="success-desc">请等待商家发货</p>
        <button class="gradient-btn" @click="router.push('/mall/orders')">查看订单</button>
      </div>
    </div>

    <!-- 底部应付栏 -->
    <div class="bottom-bar" v-if="!submitted">
      <div class="pay-total-area">
        <span class="pay-total-label">应付总额</span>
        <span class="pay-total-num">
          <font-awesome-icon icon="gem" class="total-icon" />
          {{ total.toLocaleString() }}
        </span>
      </div>
      <button class="pay-btn" :disabled="submitting" @click="submitOrder">
        <span v-if="submitting">提交中...</span>
        <span v-else>确认支付</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.checkout-page {
  background: transparent;
}

.checkout-page .page-content,
.checkout-page .bottom-bar {
  position: relative;
  z-index: 2;
}
.checkout-page .bottom-bar {
  z-index: 20;
}

/* ===== 导航 ===== */
.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  padding-top: calc(8px + env(safe-area-inset-top, 0px));
  position: relative;
  z-index: 10;
}
.nav-back {
  width: 36px; height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(255,255,255,0.1);
  color: #fff;
  font-size: 14px;
}
.nav-title { font-size: 18px; font-weight: 800; color: #fff; letter-spacing: 1px; }
.nav-spacer { width: 36px; }

.checkout-body {
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  position: relative;
  z-index: 5;
}

/* ===== 卡片通用 ===== */
.info-card, .goods-card, .pay-card {
  padding: 18px;
  background: rgba(238, 234, 252, 0.75);
  backdrop-filter: blur(4px);
  border: 1px solid rgba(238, 234, 252, 0.5);
  border-radius: 16px;
}

.card-label {
  font-size: 14px;
  font-weight: 600;
  color: #7b6f9e;
  margin-bottom: 14px;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 12px;
}
.info-avatar {
  width: 48px; height: 48px;
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}
.info-detail { display: flex; flex-direction: column; gap: 3px; }
.info-name { font-size: 16px; font-weight: 700; color: #2d1f5e; }
.info-code { font-size: 13px; color: #7b6f9e; }

/* ===== 订单商品 ===== */
.goods-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
}
.goods-left { display: flex; align-items: center; gap: 8px; }
.goods-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.goods-name { font-size: 15px; color: #2d1f5e; font-weight: 500; }
.goods-qty { font-size: 13px; color: #9a8db8; }
.goods-price {
  font-size: 15px; font-weight: 700;
  color: #fbbf24;
  display: flex; align-items: center; gap: 3px;
}
.price-icon { font-size: 12px; }

.goods-divider {
  height: 1px;
  background: rgba(139, 92, 246, 0.15);
  margin: 10px 0;
}

.goods-summary { display: flex; flex-direction: column; gap: 4px; }
.summary-row {
  display: flex; justify-content: space-between;
  font-size: 14px; color: #7b6f9e;
}
.summary-row.discount { color: #9a8db8; }
.sum-num { display: flex; align-items: center; gap: 3px; color: #fbbf24; font-weight: 600; }
.discount-num { color: #fbbf24; font-weight: 700; }

/* ===== 支付方式 ===== */
.pay-card {
  display: flex; align-items: center; justify-content: space-between;
}
.pay-label { font-size: 14px; color: #7b6f9e; }
.pay-method { display: flex; align-items: center; gap: 6px; font-size: 15px; color: #2d1f5e; }
.pay-method-icon { font-size: 18px; }
.pay-arrow { font-size: 12px; color: #9a8db8; }

/* ===== 成功状态 ===== */
.success-state {
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  padding: 80px 20px; gap: 12px;
  position: relative; z-index: 5;
}
.success-icon { font-size: 56px; }
.success-state h3 { font-size: 22px; font-weight: 800; color: #fff; }
.success-desc { font-size: 15px; color: rgba(255,255,255,0.55); }
.success-state .gradient-btn { margin-top: 8px; }

/* ===== 底部栏 ===== */
.bottom-bar {
  position: fixed;
  bottom: 0; left: 50%;
  transform: translateX(-50%);
  width: 100%; max-width: 430px;
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 18px;
  padding-bottom: calc(14px + env(safe-area-inset-bottom, 0px));
  background: linear-gradient(180deg, rgba(30,20,60,0.6) 0%, rgba(20,12,40,0.9) 100%);
  backdrop-filter: blur(16px);
  border-top: 1px solid rgba(255,255,255,0.12);
  z-index: 20;
}
.pay-total-area { display: flex; flex-direction: column; gap: 2px; }
.pay-total-label { font-size: 12px; color: rgba(255,255,255,0.5); }
.pay-total-num {
  font-size: 26px; font-weight: 800;
  color: #fbbf24;
  display: flex; align-items: center; gap: 4px;
}
.total-icon { font-size: 20px; }
.pay-btn {
  padding: 14px 32px;
  border-radius: 14px;
  font-size: 16px; font-weight: 700;
  color: #fff;
  background: linear-gradient(135deg, #8b5cf6, #6366f1);
  box-shadow: 0 4px 16px rgba(99,102,241,0.35);
  transition: transform 0.15s;
}
.pay-btn:active { transform: scale(0.97); }
.pay-btn:disabled { opacity: 0.6; }
</style>
