<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../api'

const favoritesBanner = '/我的收藏狐狸.png'

const router = useRouter()

const loading = ref(true)
const manageMode = ref(false)
const toast = ref('')
const summary = ref({ total: 0, title: '我的收藏夹', slogan: '' })
const categories = ref([])
const items = ref([])
const activeCategory = ref('all')
const categoryScrollRef = ref(null)

let categoryTouchStartX = 0
let categoryTouchStartY = 0
let categoryScrollLock = false

function onCategoryTouchStart(e) {
  categoryTouchStartX = e.touches[0].clientX
  categoryTouchStartY = e.touches[0].clientY
  categoryScrollLock = false
}

function onCategoryTouchMove(e) {
  const el = categoryScrollRef.value
  if (!el || !e.touches.length) return

  const dx = e.touches[0].clientX - categoryTouchStartX
  const dy = e.touches[0].clientY - categoryTouchStartY

  if (!categoryScrollLock) {
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 6) {
      categoryScrollLock = true
    }
  }

  if (categoryScrollLock) {
    e.stopPropagation()
  }
}

function onCategoryTouchEnd() {
  categoryScrollLock = false
}

function coverUrl(seed, type) {
  if (type === 'achievement') return ''
  return `https://api.dicebear.com/7.x/adventurer/png?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9`
}

function showToast(msg) {
  toast.value = msg
  setTimeout(() => { toast.value = '' }, 2000)
}

async function loadFavorites() {
  loading.value = true
  try {
    const data = await api.getFavorites(activeCategory.value)
    summary.value = data.summary
    categories.value = data.categories
    items.value = data.items
  } catch (err) {
    showToast(err.message || '加载失败')
  } finally {
    loading.value = false
  }
}

function selectCategory(key) {
  activeCategory.value = key
}

function toggleManage() {
  manageMode.value = !manageMode.value
}

function handleAction(item) {
  if (manageMode.value) return
  if (item.actionPath) {
    router.push(item.actionPath)
    return
  }
  showToast('功能开发中')
}

async function removeItem(item) {
  try {
    await api.removeFavorite(item.id)
    showToast('已取消收藏')
    await loadFavorites()
  } catch (err) {
    showToast(err.message || '操作失败')
  }
}

function buddyTitle(item) {
  return item.level ? `${item.title} Lv.${item.level}` : item.title
}

watch(activeCategory, loadFavorites)
onMounted(loadFavorites)
</script>

<template>
  <div class="favorites page">
    <div class="hero-bg">
      <div class="hero-gradient" />
      <div class="hero-nebula" />
      <div class="hero-stars" />
    </div>

    <header class="fav-header">
      <button type="button" class="back-btn" @click="router.back()">
        <font-awesome-icon icon="chevron-left" />
      </button>
      <h1 class="header-title">我的收藏</h1>
      <button type="button" class="manage-btn" @click="toggleManage">
        {{ manageMode ? '完成' : '管理' }}
      </button>
    </header>

    <div class="favorites-body">
      <section class="banner-card">
        <img class="banner-bg" :src="favoritesBanner" alt="" aria-hidden="true">
        <div class="banner-text">
          <h2 class="banner-title">{{ summary.title }}</h2>
          <p class="banner-count">已收藏 {{ summary.total }} 个内容</p>
          <p class="banner-slogan">{{ summary.slogan }}</p>
        </div>
      </section>

      <div class="category-scroll-wrap">
        <div
          ref="categoryScrollRef"
          class="category-scroll"
          @touchstart.passive="onCategoryTouchStart"
          @touchmove="onCategoryTouchMove"
          @touchend="onCategoryTouchEnd"
          @touchcancel="onCategoryTouchEnd"
        >
          <button
            v-for="cat in categories"
            :key="cat.key"
            type="button"
            class="category-chip"
            :class="{ active: activeCategory === cat.key }"
            @click="selectCategory(cat.key)"
          >
            {{ cat.label }}
          </button>
        </div>
      </div>

      <div class="list-scroll">
        <div v-if="loading" class="loading-tip">加载中...</div>

        <div v-else-if="!items.length" class="empty-tip">暂无收藏内容</div>

        <div v-else class="fav-list">
        <article
          v-for="item in items"
          :key="item.id"
          class="fav-card"
        >
          <button type="button" class="star-btn" aria-label="已收藏">
            <font-awesome-icon icon="star" />
          </button>

          <div
            class="fav-thumb"
            :class="{ round: item.type === 'buddy', medal: item.type === 'achievement' }"
          >
            <span class="type-tag">{{ item.typeLabel }}</span>
            <img
              v-if="item.type !== 'achievement'"
              :src="coverUrl(item.coverSeed, item.type)"
              :alt="item.title"
            />
            <div v-else class="medal-icon">
              <font-awesome-icon icon="medal" />
            </div>
          </div>

          <div class="fav-body">
            <h3 class="fav-title">
              {{ item.type === 'buddy' ? buddyTitle(item) : item.title }}
            </h3>

            <template v-if="item.type === 'course'">
              <div v-if="item.tags.length" class="tag-row">
                <span v-for="tag in item.tags" :key="tag" class="tag">{{ tag }}</span>
              </div>
              <div class="progress-wrap">
                <span class="progress-label">已学习 {{ item.progress }}%</span>
                <div class="progress-track">
                  <div class="progress-fill" :style="{ width: `${item.progress}%` }" />
                </div>
              </div>
            </template>

            <template v-else-if="item.type === 'room'">
              <p class="meta-line">
                <font-awesome-icon icon="users" class="meta-icon" />
                {{ item.onlineCount }}人在线
              </p>
              <p class="meta-line success">专注率 {{ item.focusRate }}%</p>
            </template>

            <template v-else-if="item.type === 'buddy'">
              <p class="meta-line">学习目标：{{ item.studyGoal }}</p>
              <p v-if="item.status === 'focusing'" class="meta-line success">
                <span class="dot" />正在专注
              </p>
            </template>

            <template v-else-if="item.type === 'achievement'">
              <p class="meta-line">{{ item.subtitle }}</p>
              <p v-if="item.unlocked" class="meta-line success">
                <font-awesome-icon icon="circle-check" class="meta-icon" />
                已解锁
              </p>
            </template>

            <template v-else>
              <p v-if="item.subtitle" class="meta-line">{{ item.subtitle }}</p>
            </template>
          </div>

          <button
            v-if="manageMode"
            type="button"
            class="action-btn danger"
            @click="removeItem(item)"
          >
            取消收藏
          </button>
          <button
            v-else
            type="button"
            class="action-btn"
            @click="handleAction(item)"
          >
            {{ item.actionLabel }}
          </button>
        </article>
        </div>
      </div>
    </div>

    <Transition name="fade">
      <div v-if="toast" class="toast">{{ toast }}</div>
    </Transition>
  </div>
</template>

<style scoped>
.favorites.page {
  --fav-primary: #4a4580;
  --fav-secondary: #8e8ebc;
  --fav-purple: #8b5cf6;
  --fav-purple-dark: #7c3aed;
  --fav-success: #22c55e;
  background: #e0e7ff;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.hero-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.hero-gradient {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    #5d5fef 0%,
    #6366f1 12%,
    #9498f8 35%,
    #c7d2fe 62%,
    #e0e7ff 100%
  );
}

.hero-nebula {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 80% 40% at 20% 15%, rgba(93, 95, 239, 0.4) 0%, transparent 55%),
    radial-gradient(ellipse 70% 35% at 80% 20%, rgba(165, 180, 252, 0.3) 0%, transparent 50%);
}

.hero-stars {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 45%;
  background-image:
    radial-gradient(2px 2px at 12% 18%, rgba(255,255,255,0.9) 0%, transparent 100%),
    radial-gradient(1px 1px at 35% 10%, rgba(255,255,255,0.6) 0%, transparent 100%),
    radial-gradient(1.5px 1.5px at 58% 22%, rgba(255,255,255,0.75) 0%, transparent 100%),
    radial-gradient(1px 1px at 78% 14%, rgba(255,255,255,0.5) 0%, transparent 100%);
  mask-image: linear-gradient(180deg, #000 0%, transparent 100%);
  -webkit-mask-image: linear-gradient(180deg, #000 0%, transparent 100%);
}

.fav-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  padding-top: calc(10px + env(safe-area-inset-top, 0px));
  position: relative;
  z-index: 10;
  flex-shrink: 0;
}

.back-btn,
.manage-btn {
  min-width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: #fff;
}

.manage-btn {
  font-size: 15px;
  font-weight: 500;
  padding: 0 4px;
}

.header-title {
  font-size: 18px;
  font-weight: 600;
  color: #fff;
}

.favorites-body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 5;
  padding: 0 16px;
}

.list-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  padding-bottom: calc(24px + env(safe-area-inset-bottom, 0px));
}

/* ===== Banner ===== */
.banner-card {
  position: relative;
  margin-bottom: 16px;
  border-radius: 22px;
  overflow: hidden;
  flex-shrink: 0;
  box-shadow: 0 8px 28px rgba(93, 95, 239, 0.15);
}

.banner-bg {
  display: block;
  width: 100%;
  height: auto;
  aspect-ratio: 2.35 / 1;
  object-fit: cover;
}

.banner-text {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  width: 62%;
  padding: 16px 18px;
  pointer-events: none;
}

.banner-title {
  font-size: 18px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 6px;
  text-shadow: 0 1px 8px rgba(54, 36, 173, 0.35);
}

.banner-count {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.95);
  margin-bottom: 4px;
  text-shadow: 0 1px 6px rgba(54, 36, 173, 0.28);
}

.banner-slogan {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.82);
  line-height: 1.45;
  text-shadow: 0 1px 6px rgba(54, 36, 173, 0.25);
}

/* ===== 分类 ===== */
.category-scroll-wrap {
  flex-shrink: 0;
  margin: 0 -16px 4px;
  overflow: hidden;
}

.category-scroll {
  display: flex;
  gap: 10px;
  width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  padding: 0 16px 16px;
  -webkit-overflow-scrolling: touch;
  touch-action: pan-x;
  overscroll-behavior-x: contain;
  scroll-behavior: smooth;
  scrollbar-width: none;
}

.category-scroll::after {
  content: '';
  flex-shrink: 0;
  width: 4px;
}

.category-scroll::-webkit-scrollbar {
  display: none;
}

.category-chip {
  flex-shrink: 0;
  padding: 8px 18px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.88);
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.25);
  transition: all 0.2s;
}

.category-chip.active {
  background: #fff;
  color: var(--fav-purple-dark);
  font-weight: 600;
  box-shadow: 0 4px 14px rgba(93, 95, 239, 0.2);
}

.loading-tip,
.empty-tip {
  text-align: center;
  padding: 48px 20px;
  color: var(--fav-secondary);
  font-size: 14px;
}

/* ===== 收藏卡片 ===== */
.fav-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.fav-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 6px 24px rgba(93, 95, 239, 0.08);
}

.star-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  font-size: 16px;
  color: #fbbf24;
  filter: drop-shadow(0 1px 2px rgba(251, 191, 36, 0.4));
  z-index: 2;
}

.fav-thumb {
  position: relative;
  width: 72px;
  height: 72px;
  border-radius: 16px;
  overflow: hidden;
  flex-shrink: 0;
  background: linear-gradient(145deg, #e9d5ff, #c4b5fd);
}

.fav-thumb.round {
  border-radius: 50%;
  border: 2px solid #ddd6fe;
}

.fav-thumb.medal {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(145deg, #fde68a, #fbbf24);
}

.fav-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.medal-icon {
  font-size: 32px;
  color: #fff;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.15));
}

.type-tag {
  position: absolute;
  top: 4px;
  left: 4px;
  z-index: 1;
  padding: 2px 7px;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 600;
  color: #fff;
  background: rgba(139, 92, 246, 0.88);
}

.fav-body {
  flex: 1;
  min-width: 0;
  padding-right: 20px;
}

.fav-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--fav-primary);
  margin-bottom: 6px;
  line-height: 1.3;
  padding-right: 16px;
}

.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
}

.tag {
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 10px;
  color: var(--fav-purple-dark);
  background: #f3e8ff;
}

.progress-wrap {
  margin-top: 2px;
}

.progress-label {
  font-size: 11px;
  color: var(--fav-secondary);
  display: block;
  margin-bottom: 4px;
}

.progress-track {
  height: 4px;
  background: #ede9fe;
  border-radius: 999px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #a78bfa, #8b5cf6);
  border-radius: 999px;
}

.meta-line {
  font-size: 12px;
  color: var(--fav-secondary);
  line-height: 1.5;
  display: flex;
  align-items: center;
  gap: 4px;
}

.meta-line.success {
  color: var(--fav-success);
  font-weight: 500;
}

.meta-icon {
  font-size: 11px;
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--fav-success);
  display: inline-block;
}

.action-btn {
  flex-shrink: 0;
  padding: 8px 14px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  color: #fff;
  background: linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
  white-space: nowrap;
}

.action-btn.danger {
  background: linear-gradient(135deg, #fca5a5 0%, #ef4444 100%);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.25);
}

.toast {
  position: fixed;
  left: 50%;
  bottom: calc(40px + env(safe-area-inset-bottom, 0px));
  transform: translateX(-50%);
  padding: 10px 22px;
  background: rgba(74, 69, 128, 0.92);
  color: #fff;
  font-size: 13px;
  border-radius: 999px;
  z-index: 200;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
