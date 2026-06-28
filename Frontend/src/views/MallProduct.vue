<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '../stores/user'
import { api } from '../api'
import { useToast } from '../composables/useToast'

const router = useRouter()
const route = useRoute()
const user = useUserStore()
const toast = useToast()

const product = ref(null)
const quantity = ref(1)
const selectedColor = ref(0)
const addedToCart = ref(false)
const purchasing = ref(false)

const colors = ['#7c5cfc', '#f472b6', '#34d399', '#fbbf24']

const totalPrice = computed(() => (product.value?.price || 0) * quantity.value)
const isOwned = computed(() => Boolean(product.value?.owned))
const stock = ref(10)

async function loadDetail() {
  const id = route.params.id
  quantity.value = 1
  try {
    const item = await api.getMallItemDetail(id)
    product.value = {
      ...item,
      desc: item.description || item.desc || '',
      tagColor: item.tagColor || item.tag_color,
    }
  } catch (err) {
    product.value = null
    toast.show(err.message || '商品加载失败')
  }
}

async function addToCart() {
  if (!product.value || isOwned.value) return
  try {
    await api.addToCart(product.value.id, 1)
    addedToCart.value = true
    toast.show('已加入购物车')
    setTimeout(() => { addedToCart.value = false }, 2000)
  } catch (err) {
    toast.show(err.message || '加入购物车失败')
  }
}

async function buyNow() {
  if (!product.value || purchasing.value || isOwned.value) return
  purchasing.value = true
  try {
    const res = await api.purchaseItem(product.value.id)
    user.coins = res.coinsLeft ?? res.coins ?? user.coins
    await user.fetchUser()
    product.value = { ...product.value, owned: true }
    toast.show('购买成功')
    router.push('/mall/orders')
  } catch (err) {
    toast.show(err.message || '购买失败')
  } finally {
    purchasing.value = false
  }
}

onMounted(async () => {
  await user.fetchUser()
  loadDetail()
})
watch(() => route.params.id, loadDetail)
</script>

<template>
  <div class="product-page page">
    <div class="mall-sky-bg" />

    <div class="page-content no-tab">
      <!-- 顶部导航 -->
      <div class="nav-bar">
        <button class="nav-back" @click="router.back()">
          <font-awesome-icon icon="chevron-left" />
        </button>
        <span class="nav-title">商品详情</span>
        <button class="nav-share">
          <font-awesome-icon icon="share-nodes" />
        </button>
      </div>

      <!-- 主视觉区 -->
      <div class="hero-area">
        <div class="hero-glow" />
        <div class="sparkle-layer">
          <span v-for="i in 6" :key="i" class="sparkle-dot" :style="{ '--i': i }" />
        </div>
        <div class="hero-center">
          <div class="hero-icon-wrap">
            <div class="hero-ring" />
            <span class="hero-icon">{{ product?.image || '🎒' }}</span>
          </div>
        </div>
      </div>

      <!-- 商品信息卡片 -->
      <div class="info-card">
        <div class="name-row">
          <h2 class="prod-name">{{ product?.name || '商品名称' }}</h2>
          <span v-if="product?.tag" class="prod-tag" :style="{ background: product.tagColor }">{{ product.tag }}</span>
          <span v-if="isOwned" class="prod-owned">已拥有</span>
        </div>

        <div class="prod-price">
          <font-awesome-icon icon="coins" class="price-icon" />
          <strong>{{ product?.price || 0 }}</strong>
        </div>

        <p class="prod-desc">{{ product?.desc || '' }}</p>

        <!-- 颜色款式 -->
        <div class="section-block">
          <div class="section-label">颜色款式</div>
          <div class="color-row">
            <button
              v-for="(c, i) in colors"
              :key="i"
              class="color-dot"
              :class="{ active: selectedColor === i }"
              :style="{ background: c }"
              @click="selectedColor = i"
            />
          </div>
        </div>

        <!-- 数量 -->
        <div class="section-block">
          <div class="section-label">数量</div>
          <div class="qty-row">
            <button class="qty-btn" :disabled="quantity <= 1 || isOwned" @click="quantity--">
              <font-awesome-icon icon="minus" />
            </button>
            <span class="qty-val">{{ quantity }}</span>
            <button class="qty-btn" :disabled="quantity >= 1 || isOwned" @click="quantity++">
              <font-awesome-icon icon="plus" />
            </button>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="action-row">
          <button class="btn-outline" :disabled="isOwned" @click="addToCart">
            <font-awesome-icon icon="cart-shopping" />
            {{ isOwned ? '已拥有' : '加入购物车' }}
          </button>
          <button class="btn-primary" :disabled="purchasing || isOwned" @click="buyNow">
            {{ isOwned ? '已拥有' : (purchasing ? '购买中...' : '立即购买') }}
          </button>
        </div>

        <div class="prod-meta">
          <span>用 <font-awesome-icon icon="gem" style="color: #fbbf24" /> 钻石可购买</span>
          <span class="stock-info">库存 <em>{{ stock }}</em></span>
        </div>
      </div>

      <!-- Toast -->
      <Transition name="toast">
        <div v-if="addedToCart" class="toast-bar">
          <font-awesome-icon icon="check" /> 已加入购物车
        </div>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.product-page {
  background: transparent;
}

.product-page .page-content {
  position: relative;
  z-index: 2;
}

/* ===== 导航 ===== */
.nav-bar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 8px 12px;
  padding-top: calc(8px + env(safe-area-inset-top, 0px));
  position: relative; z-index: 10;
}
.nav-back, .nav-share {
  width: 36px; height: 36px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 50%;
  background: rgba(255,255,255,0.1);
  color: #fff; font-size: 14px;
}
.nav-title { font-size: 18px; font-weight: 800; color: #fff; letter-spacing: 1px; }

/* ===== 主视觉区 ===== */
.hero-area {
  position: relative; height: 220px; overflow: hidden;
}
.hero-glow {
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  width: 180px; height: 180px;
  background: radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, transparent 70%);
  border-radius: 50%;
  animation: glowPulse 3s ease-in-out infinite;
}
@keyframes glowPulse {
  0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.5; }
  50% { transform: translate(-50%, -50%) scale(1.3); opacity: 0.9; }
}

.sparkle-layer { position: absolute; inset: 0; pointer-events: none; }
.sparkle-dot {
  position: absolute;
  width: 4px; height: 4px;
  background: rgba(255,255,255,0.8);
  border-radius: 50%;
  animation: sparkleFloat 2.5s ease-in-out infinite;
  animation-delay: calc(var(--i) * 0.35s);
  top: calc(15% + var(--i) * 12%);
  left: calc(10% + var(--i) * 14%);
}
@keyframes sparkleFloat {
  0%, 100% { opacity: 0; transform: translateY(0) scale(0.5); }
  50% { opacity: 0.9; transform: translateY(-12px) scale(1.2); }
}

.hero-center {
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center;
}
.hero-icon-wrap {
  position: relative;
  width: 100px; height: 100px;
  display: flex; align-items: center; justify-content: center;
}
.hero-ring {
  position: absolute;
  width: 90px; height: 90px;
  border: 2px solid rgba(255,255,255,0.12);
  border-radius: 50%;
  animation: ringSpin 8s linear infinite;
}
@keyframes ringSpin { to { transform: rotate(360deg); } }

.hero-icon {
  position: relative; z-index: 2;
  font-size: 50px;
  filter: drop-shadow(0 4px 16px rgba(124, 92, 252, 0.3));
}

/* ===== 信息卡片 ===== */
.info-card {
  position: relative;
  margin: -24px 14px 0;
  padding: 22px 18px 24px;
  background: rgba(238, 234, 252, 0.75);
  backdrop-filter: blur(4px);
  border: 1px solid rgba(238, 234, 252, 0.5);
  border-radius: 20px;
  z-index: 5;
}

.name-row { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
.prod-name { font-size: 22px; font-weight: 800; color: #2d1f5e; }
.prod-tag { padding: 3px 10px; border-radius: 999px; font-size: 11px; font-weight: 700; color: #fff; }
.prod-owned {
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  color: #5b3d99;
  background: rgba(139, 92, 246, 0.15);
}

.prod-price {
  font-size: 30px; font-weight: 800; color: #fbbf24;
  margin-bottom: 8px;
  display: flex; align-items: center; gap: 6px;
}
.price-icon { font-size: 22px; }
.prod-desc { font-size: 14px; color: #7b6f9e; line-height: 1.5; margin-bottom: 18px; }

/* ===== 区块 ===== */
.section-block { margin-bottom: 18px; }
.section-label { font-size: 14px; font-weight: 600; color: #7b6f9e; margin-bottom: 10px; }

.color-row { display: flex; gap: 12px; }
.color-dot {
  width: 40px; height: 40px; border-radius: 50%;
  border: 3px solid transparent;
  transition: all 0.2s;
}
.color-dot.active {
  border-color: #c084fc;
  box-shadow: 0 0 0 2px rgba(15,10,30,0.8), 0 0 0 4px #c084fc;
}

.qty-row { display: flex; align-items: center; }
.qty-btn {
  width: 36px; height: 36px;
  display: flex; align-items: center; justify-content: center;
  background: rgba(238, 234, 252, 0.6);
  color: #5b3d99; font-size: 14px;
  border: 1px solid rgba(139, 92, 246, 0.25);
}
.qty-btn:first-child { border-radius: 8px 0 0 8px; }
.qty-btn:last-child { border-radius: 0 8px 8px 0; }
.qty-btn:disabled { opacity: 0.3; }
.qty-val {
  width: 48px; height: 36px;
  display: flex; align-items: center; justify-content: center;
  font-size: 15px; font-weight: 700; color: #2d1f5e;
  border-top: 1px solid rgba(139, 92, 246, 0.25);
  border-bottom: 1px solid rgba(139, 92, 246, 0.25);
}

/* ===== 按钮 ===== */
.action-row { display: flex; gap: 10px; margin-bottom: 14px; }
.btn-outline, .btn-primary {
  flex: 1; height: 46px; border-radius: 14px;
  font-size: 15px; font-weight: 700;
  display: flex; align-items: center; justify-content: center; gap: 6px;
  transition: transform 0.15s;
}
.btn-outline:active, .btn-primary:active { transform: scale(0.98); }
.btn-outline {
  background: rgba(238, 234, 252, 0.6);
  color: #5b3d99;
  border: 1.5px solid rgba(139, 92, 246, 0.35);
}
.btn-primary {
  background: linear-gradient(135deg, #8b5cf6, #6366f1);
  color: #fff;
  box-shadow: 0 4px 16px rgba(99,102,241,0.3);
}

.prod-meta {
  display: flex; justify-content: space-between;
  font-size: 13px; color: #7b6f9e;
}
.stock-info em { font-style: normal; color: #f472b6; font-weight: 600; }

/* ===== Toast ===== */
.toast-bar {
  position: fixed; bottom: 100px; left: 50%;
  transform: translateX(-50%);
  padding: 12px 24px;
  background: rgba(30,20,60,0.9);
  backdrop-filter: blur(12px);
  color: #fff; border-radius: 12px;
  font-size: 14px; font-weight: 600;
  display: flex; align-items: center; gap: 8px;
  border: 1px solid rgba(255,255,255,0.15);
  z-index: 100;
}
.toast-enter-active { animation: toastIn 0.3s ease; }
.toast-leave-active { animation: toastIn 0.3s ease reverse; }
@keyframes toastIn {
  from { opacity: 0; transform: translateX(-50%) translateY(20px); }
  to { opacity: 1; transform: translateX(-50%) translateY(0); }
}
</style>
