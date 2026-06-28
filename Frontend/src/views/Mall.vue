<script setup>
import { ref, computed, onMounted, onActivated, onBeforeUnmount, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { api } from '../api'
import { useToast } from '../composables/useToast'
import {
  mallCarousel1,
  mallCarousel2,
  mallCarousel3,
  mallCarousel4,
} from '../config/ossPublic.js'

const router = useRouter()
const user = useUserStore()
const toast = useToast()

const cartBadge = ref(0)
const searchText = ref('')

const carouselSlides = [
  mallCarousel1,
  mallCarousel2,
  mallCarousel3,
  mallCarousel4,
]
const activeSlide = ref(0)
const isCarouselDragging = ref(false)
const carouselTransition = ref(true)
const dragOffsetPx = ref(0)

let carouselTimer
let carouselPointerId = null
let carouselStartX = 0
let carouselStartY = 0
let carouselDragLocked = false

const SWIPE_THRESHOLD = 48

const carouselTrackStyle = computed(() => ({
  transform: `translate3d(calc(-${activeSlide.value * 100}% + ${dragOffsetPx.value}px), 0, 0)`,
  transition: carouselTransition.value ? 'transform 0.45s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
}))

function pauseCarousel() {
  window.clearInterval(carouselTimer)
}

function nextSlide() {
  activeSlide.value = (activeSlide.value + 1) % carouselSlides.length
}

function restartCarousel() {
  pauseCarousel()
  carouselTimer = window.setInterval(nextSlide, 4000)
}

function goToSlide(index) {
  activeSlide.value = index
  restartCarousel()
}

function cancelCarouselDrag() {
  isCarouselDragging.value = false
  carouselDragLocked = false
  carouselPointerId = null
  dragOffsetPx.value = 0
  carouselTransition.value = true
  restartCarousel()
}

function finishCarouselDrag() {
  if (!isCarouselDragging.value) return

  const offset = dragOffsetPx.value
  if (offset <= -SWIPE_THRESHOLD && activeSlide.value < carouselSlides.length - 1) {
    activeSlide.value += 1
  } else if (offset >= SWIPE_THRESHOLD && activeSlide.value > 0) {
    activeSlide.value -= 1
  }

  cancelCarouselDrag()
}

function onCarouselPointerDown(event) {
  if (event.pointerType === 'mouse' && event.button !== 0) return

  isCarouselDragging.value = true
  carouselTransition.value = false
  carouselPointerId = event.pointerId
  carouselStartX = event.clientX
  carouselStartY = event.clientY
  carouselDragLocked = false
  dragOffsetPx.value = 0
  pauseCarousel()
  event.currentTarget.setPointerCapture(event.pointerId)
}

function onCarouselPointerMove(event) {
  if (!isCarouselDragging.value || event.pointerId !== carouselPointerId) return

  const deltaX = event.clientX - carouselStartX
  const deltaY = event.clientY - carouselStartY

  if (!carouselDragLocked) {
    if (Math.abs(deltaX) < 8 && Math.abs(deltaY) < 8) return
    if (Math.abs(deltaY) >= Math.abs(deltaX)) {
      try {
        event.currentTarget.releasePointerCapture(event.pointerId)
      } catch {
        // ignore
      }
      cancelCarouselDrag()
      return
    }
    carouselDragLocked = true
  }

  event.preventDefault()

  const atFirst = activeSlide.value === 0 && deltaX > 0
  const atLast = activeSlide.value === carouselSlides.length - 1 && deltaX < 0
  dragOffsetPx.value = (atFirst || atLast) ? deltaX * 0.35 : deltaX
}

function onCarouselPointerUp(event) {
  if (event.pointerId !== carouselPointerId) return
  finishCarouselDrag()
}

const featuredItems = ref([])
const hotItems = ref([])
const searchResults = ref([])
const showSearchResults = ref(false)

async function loadItems() {
  try {
    const [featured, hot] = await Promise.all([
      api.getMallFeatured(),
      api.getMallHot(),
    ])
    featuredItems.value = featured
    hotItems.value = hot
  } catch {
    // fallback silently
  }
}

let searchTimer = null
watch(searchText, (val) => {
  clearTimeout(searchTimer)
  if (!val.trim()) {
    showSearchResults.value = false
    searchResults.value = []
    return
  }
  searchTimer = setTimeout(async () => {
    try {
      searchResults.value = await api.searchMallItems(val.trim())
      showSearchResults.value = true
    } catch {
      searchResults.value = []
    }
  }, 300)
})

function goDetail(id) {
  router.push(`/mall/product/${id}`)
}

async function addToCart(e, item) {
  e.stopPropagation()
  if (item.owned) {
    toast.show('已拥有该商品')
    return
  }
  try {
    const res = await api.addToCart(item.id, 1)
    cartBadge.value = res.cartCount
    toast.show('已加入购物车')
  } catch (err) {
    toast.show(err.message || '加入失败')
  }
}

function goCategories() {
  router.push('/mall/categories')
}

async function refreshCartBadge() {
  try {
    const cart = await api.getCart()
    cartBadge.value = cart.length
  } catch {
    cartBadge.value = 0
  }
}

onMounted(async () => {
  await user.fetchUser()
  await loadItems()
  await refreshCartBadge()
  restartCarousel()
})

onActivated(async () => {
  await user.fetchUser()
  await loadItems()
  await refreshCartBadge()
  restartCarousel()
})

onBeforeUnmount(() => {
  pauseCarousel()
})

const funcLinks = [
  { icon: 'list', label: '商品分类', path: '/mall/categories' },
  { icon: 'cart-shopping', label: '购物车', path: '/mall/cart' },
  { icon: 'clipboard-list', label: '我的订单', path: '/mall/orders' },
  { icon: 'box-open', label: '兑换记录', path: '/mall/orders' },
]
</script>

<template>
  <div class="mall-page page">
    <div class="mall-sky-bg" />

    <div class="page-content">
      <header class="mall-header">
        <h1 class="mall-title">宠物商城</h1>
        <div class="header-right">
          <div class="coin-display">
            <font-awesome-icon icon="coins" class="coin-icon" />
            <span>{{ user.coins.toLocaleString() }}</span>
          </div>
          <button class="cart-btn" @click="router.push('/mall/cart')">
            <font-awesome-icon icon="cart-shopping" />
            <span v-if="cartBadge" class="cart-badge">{{ cartBadge }}</span>
          </button>
        </div>
      </header>

      <!-- 搜索框 -->
      <div class="search-section">
        <div class="search-box">
          <font-awesome-icon icon="search" class="search-icon" />
          <input
            v-model="searchText"
            type="text"
            placeholder="搜索宠物商品、装扮、道具..."
            class="search-input"
          />
        </div>
      </div>

      <!-- 搜索结果 -->
      <div v-if="showSearchResults" class="search-results">
        <div class="search-results-mask" @click="showSearchResults = false" />
        <div class="search-results-panel">
          <div
            v-for="item in searchResults"
            :key="item.id"
            class="search-result-item"
            @click="goDetail(item.id); showSearchResults = false"
          >
            <span class="search-result-name">{{ item.name }}</span>
            <span class="search-result-price">{{ item.price }} 金币</span>
          </div>
          <div v-if="searchResults.length === 0" class="search-empty">未找到相关商品</div>
        </div>
      </div>

      <!-- 轮播横幅 -->
      <section class="banner-section mall-carousel" aria-label="商城活动">
        <div
          class="carousel-viewport"
          :class="{ dragging: isCarouselDragging }"
          @pointerdown="onCarouselPointerDown"
          @pointermove="onCarouselPointerMove"
          @pointerup="onCarouselPointerUp"
          @pointercancel="onCarouselPointerUp"
        >
          <div class="carousel-track" :style="carouselTrackStyle">
            <div
              v-for="(src, index) in carouselSlides"
              :key="index"
              class="carousel-slide"
            >
              <img :src="src" :alt="`商城活动 ${index + 1}`" draggable="false">
            </div>
          </div>
        </div>
        <div class="carousel-dots">
          <button
            v-for="(_, index) in carouselSlides"
            :key="index"
            type="button"
            class="carousel-dot"
            :class="{ active: activeSlide === index }"
            :aria-label="`第 ${index + 1} 张轮播图`"
            :aria-current="activeSlide === index ? 'true' : 'false'"
            @click="goToSlide(index)"
          />
        </div>
      </section>

      <!-- 功能区 -->
      <div class="func-row">
        <button
          v-for="link in funcLinks"
          :key="link.label"
          class="func-btn"
          @click="router.push(link.path)"
        >
          <div class="func-icon-wrap">
            <font-awesome-icon :icon="link.icon" />
          </div>
          <span class="func-label">{{ link.label }}</span>
        </button>
      </div>

      <!-- 精选推荐 -->
      <div class="section-block">
        <div class="section-header">
          <h3 class="section-title">精选推荐</h3>
          <button class="section-more" @click="goCategories">
            查看更多 <font-awesome-icon icon="chevron-right" class="more-icon" />
          </button>
        </div>
        <div class="product-grid">
          <div
            v-for="item in featuredItems"
            :key="item.id"
            class="product-card"
            @click="goDetail(item.id)"
          >
            <div class="card-img-wrap">
              <div class="card-img-bg" />
              <div class="card-img">
                <span class="card-emoji">{{ item.image }}</span>
              </div>
              <span v-if="item.tag" class="card-tag" :style="{ background: item.tagColor }">
                {{ item.tag }}
              </span>
              <span v-if="item.owned" class="card-owned">已拥有</span>
            </div>
            <div class="card-body">
              <div class="card-name">{{ item.name }}</div>
              <div class="card-row">
                <div class="card-price">
                  <font-awesome-icon icon="coins" class="price-icon" />
                  <span>{{ item.price }}</span>
                </div>
                <button
                  v-if="!item.owned"
                  class="add-btn"
                  @click="addToCart($event, item)"
                >
                  <font-awesome-icon icon="plus" />
                </button>
                <span v-else class="owned-tip">已拥有</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 热门商品 -->
      <div class="section-block">
        <div class="section-header">
          <h3 class="section-title">热门商品</h3>
          <button class="section-more" @click="goCategories">
            查看更多 <font-awesome-icon icon="chevron-right" class="more-icon" />
          </button>
        </div>
        <div class="product-grid">
          <div
            v-for="item in hotItems"
            :key="item.id"
            class="product-card"
            @click="goDetail(item.id)"
          >
            <div class="card-img-wrap">
              <div class="card-img-bg" />
              <div class="card-img">
                <span class="card-emoji">{{ item.image }}</span>
              </div>
              <span v-if="item.tag" class="card-tag" :style="{ background: item.tagColor }">
                {{ item.tag }}
              </span>
              <span v-if="item.owned" class="card-owned">已拥有</span>
            </div>
            <div class="card-body">
              <div class="card-name">{{ item.name }}</div>
              <div class="card-row">
                <div class="card-price">
                  <font-awesome-icon icon="coins" class="price-icon" />
                  <span>{{ item.price }}</span>
                </div>
                <button
                  v-if="!item.owned"
                  class="add-btn"
                  @click="addToCart($event, item)"
                >
                  <font-awesome-icon icon="plus" />
                </button>
                <span v-else class="owned-tip">已拥有</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ===== 页面容器 ===== */
.mall-page {
  background: transparent;
}

.mall-page .page-content {
  position: relative;
  z-index: 2;
}

/* ===== 顶部导航 ===== */
.mall-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 14px;
  padding-top: calc(10px + env(safe-area-inset-top, 0px));
  position: relative; z-index: 10;
}
.mall-title { font-size: 22px; font-weight: 800; color: #fff; letter-spacing: 1px; }
.header-right { display: flex; align-items: center; gap: 10px; }
.coin-display {
  display: flex; align-items: center; gap: 5px;
  padding: 6px 12px;
  background: rgba(251, 191, 36, 0.15);
  border: 1px solid rgba(251, 191, 36, 0.2);
  border-radius: 999px;
  font-size: 13px; font-weight: 700; color: #fbbf24;
}
.coin-icon { font-size: 14px; }
.cart-btn {
  position: relative;
  width: 38px; height: 38px;
  display: flex; align-items: center; justify-content: center;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 50%;
  font-size: 16px; color: #c084fc;
}
.cart-badge {
  position: absolute; top: -3px; right: -3px;
  min-width: 18px; height: 18px; padding: 0 5px;
  background: #ef4444; color: #fff;
  font-size: 10px; font-weight: 700;
  border-radius: 999px;
  display: flex; align-items: center; justify-content: center;
}

/* ===== 搜索框 ===== */
.search-section {
  padding: 4px 14px 8px;
  position: relative; z-index: 8;
}
.search-box {
  display: flex; align-items: center;
  background: rgba(238, 234, 252, 0.65);
  border: 1px solid rgba(238, 234, 252, 0.5);
  border-radius: 24px;
  padding: 10px 16px;
  gap: 8px;
}
.search-icon { font-size: 15px; color: #7b6f9e; }
.search-input {
  flex: 1; border: none; outline: none;
  background: transparent;
  color: #2d1f5e; font-size: 14px;
  font-family: inherit;
}
.search-input::placeholder { color: #9a8db8; }

/* ===== 搜索结果 ===== */
.search-results {
  position: relative; z-index: 20;
  padding: 0 14px;
}
.search-results-mask {
  position: fixed; inset: 0;
  z-index: -1;
}
.search-results-panel {
  background: rgba(238, 234, 252, 0.95);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(238, 234, 252, 0.6);
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(139, 92, 246, 0.2);
}
.search-result-item {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(139, 92, 246, 0.08);
  cursor: pointer;
  transition: background 0.15s;
}
.search-result-item:active { background: rgba(139, 92, 246, 0.08); }
.search-result-name { font-size: 14px; font-weight: 600; color: #2d1f5e; }
.search-result-price { font-size: 13px; font-weight: 700; color: #fbbf24; }
.search-empty {
  padding: 24px 16px;
  text-align: center;
  font-size: 13px; color: #9a8db8;
}

/* ===== 轮播横幅 ===== */
.banner-section {
  padding: 4px 14px 8px;
  position: relative;
  z-index: 5;
}

.mall-carousel {
  position: relative;
  overflow: hidden;
  border-radius: 18px;
  line-height: 0;
  box-shadow: 0 6px 28px rgba(139, 92, 246, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.08);
}

.carousel-viewport {
  position: relative;
  width: 100%;
  overflow: hidden;
  border-radius: inherit;
  touch-action: pan-y;
  cursor: grab;
  user-select: none;
}

.carousel-viewport.dragging {
  cursor: grabbing;
}

.carousel-viewport.dragging .carousel-track {
  transition: none;
}

.carousel-viewport::before {
  content: '';
  display: block;
  padding-top: 34.9%;
}

.carousel-track {
  position: absolute;
  inset: 0;
  display: flex;
  width: 100%;
  height: 100%;
  will-change: transform;
}

.carousel-slide {
  position: relative;
  flex: 0 0 100%;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.carousel-slide img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  display: block;
  pointer-events: none;
  user-select: none;
  -webkit-user-drag: none;
}

.carousel-dots {
  position: absolute;
  left: 50%;
  bottom: 10px;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 6px;
  z-index: 2;
}

.carousel-dot {
  width: 6px;
  height: 6px;
  padding: 0;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.42);
  transition: width 0.2s ease, background 0.2s ease;
}

.carousel-dot.active {
  width: 16px;
  background: #fff;
}

/* ===== 功能区 ===== */
.func-row {
  display: flex; justify-content: space-around;
  padding: 10px 6px 6px;
  position: relative; z-index: 5;
}
.func-btn {
  display: flex; flex-direction: column; align-items: center;
  gap: 6px;
  color: rgba(255, 255, 255, 0.7);
  transition: color 0.2s;
}
.func-btn:active { color: #c084fc; }
.func-icon-wrap {
  width: 56px; height: 56px;
  display: flex; align-items: center; justify-content: center;
  background: rgba(238, 234, 252, 0.7);
  border: 1px solid rgba(238, 234, 252, 0.5);
  border-radius: 16px;
  font-size: 24px;
  color: #5b3d99;
}
.func-label { font-size: 13px; font-weight: 500; color: #fff; }

/* ===== 区块 ===== */
.section-block {
  padding: 10px 0 4px;
  position: relative; z-index: 5;
}
.section-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 14px 8px;
}
.section-title {
  font-size: 17px; font-weight: 700;
  color: #fff;
}
.section-more {
  display: flex; align-items: center; gap: 4px;
  font-size: 13px; font-weight: 500;
  color: rgba(255, 255, 255, 0.55);
}
.more-icon { font-size: 11px; }

/* ===== 商品网格 ===== */
.product-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  padding: 0 12px;
}
.product-card {
  background: rgba(238, 234, 252, 0.75);
  backdrop-filter: blur(4px);
  border: 1px solid rgba(238, 234, 252, 0.5);
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s, border-color 0.2s;
}
.product-card:active {
  transform: scale(0.97);
  border-color: rgba(159, 122, 234, 0.5);
}

.card-img-wrap {
  position: relative;
  width: 100%; height: 120px;
  display: flex; align-items: center; justify-content: center;
  overflow: hidden;
}
.card-img-bg {
  position: absolute; inset: 0;
  background: linear-gradient(160deg, rgba(139, 92, 246, 0.1) 0%, rgba(124, 92, 252, 0.06) 40%, rgba(232, 121, 249, 0.08) 100%);
}
.card-img {
  position: relative; z-index: 2;
  width: 72px; height: 72px;
  display: flex; align-items: center; justify-content: center;
}
.card-emoji {
  font-size: 40px;
  filter: drop-shadow(0 4px 12px rgba(139, 92, 246, 0.2));
}
.card-tag {
  position: absolute; top: 8px; left: 8px;
  padding: 3px 8px; border-radius: 6px;
  font-size: 10px; font-weight: 700;
  color: #fff; z-index: 3;
}
.card-owned {
  position: absolute; top: 8px; right: 8px;
  padding: 3px 8px; border-radius: 6px;
  font-size: 10px; font-weight: 700;
  color: #5b3d99;
  background: rgba(255, 255, 255, 0.85);
  z-index: 3;
}
.owned-tip {
  font-size: 11px;
  font-weight: 700;
  color: #7b6f9e;
  padding: 0 4px;
}

.card-body { padding: 10px 12px 14px; }
.card-name {
  font-size: 14px; font-weight: 600;
  color: #2d1f5e;
  margin-bottom: 8px; line-height: 1.3;
}
.card-row {
  display: flex; align-items: center; justify-content: space-between;
}
.card-price {
  display: flex; align-items: center; gap: 3px;
  font-size: 16px; font-weight: 800; color: #fbbf24;
}
.price-icon { font-size: 12px; }
.add-btn {
  width: 30px; height: 30px;
  border-radius: 50%;
  background: linear-gradient(135deg, #9f7aea, #7c5cbf);
  color: #fff;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px;
  box-shadow: 0 2px 8px rgba(124, 92, 191, 0.35);
}
.add-btn:active { transform: scale(0.9); }
</style>
