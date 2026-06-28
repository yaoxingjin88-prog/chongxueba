<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { FontAwesomeIcon } from '../plugins/fontawesome'
import { api } from '../api'
import { useStudyRoomJoin } from '../composables/useStudyRoomJoin'
import {
  studyRoomCarousel1,
  studyRoomCarousel2,
  studyRoomCarousel3,
  studyRoomCarousel4,
} from '../config/ossPublic.js'

const router = useRouter()
const {
  joining,
  passwordRoom,
  requestJoin,
  submitPassword,
  cancelPassword,
} = useStudyRoomJoin()

const passwordInput = ref('')

const categories = ref([])
const filters = ref([])
const rooms = ref([])
const carouselSlides = [
  studyRoomCarousel1,
  studyRoomCarousel2,
  studyRoomCarousel3,
  studyRoomCarousel4,
]
const activeSlide = ref(0)
const isCarouselDragging = ref(false)
const carouselTransition = ref(true)
const dragOffsetPx = ref(0)
const activeCategory = ref('recommend')
const activeSort = ref('latest')
const loading = ref(true)
const showAllCategories = ref(false)
const viewMode = ref('list')

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

const filterIcons = {
  online: 'users',
  focus: 'bullseye',
  latest: 'clock',
}

const activeSortLabel = computed(
  () => filters.value.find((filter) => filter.key === activeSort.value)?.label || '最新开启',
)

const coverThemes = {
  'english-fox': ['#ffd8b1', '#ffb8c6'],
  'math-cat': ['#c8d8ff', '#a8b4ff'],
  'night-deer': ['#d4c4ff', '#b8a8ff'],
  'code-bear': ['#b8e8ff', '#98c8ff'],
  'japanese-rabbit': ['#ffd4ec', '#ffc4dc'],
  'library-owl': ['#d8d0ff', '#b8b0ff'],
  'wizard-cat': ['#6d5fdd', '#9488ef'],
  'new-room': ['#c8d8ff', '#a594f5'],
}

function avatarUrl(seed) {
  return `https://api.dicebear.com/7.x/adventurer/png?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9`
}

function coverStyle(seed) {
  const colors = coverThemes[seed] || ['#d8c8ff', '#b8a8ff']
  return { background: `linear-gradient(145deg, ${colors[0]}, ${colors[1]})` }
}

function filterIcon(key) {
  return filterIcons[key] || 'filter'
}

async function loadPlaza() {
  loading.value = true
  try {
    const data = await api.getStudyRoomPlaza(activeCategory.value, activeSort.value)
    categories.value = data.categories || []
    filters.value = data.filters || []
    rooms.value = data.rooms || []
    activeCategory.value = data.activeCategory || activeCategory.value
    activeSort.value = data.activeSort || activeSort.value
  } catch {
    categories.value = [
      { key: 'recommend', label: '推荐' },
      { key: 'hot', label: '热门' },
      { key: 'kaoyan', label: '考研' },
    ]
    filters.value = [
      { key: 'online', label: '人数' },
      { key: 'focus', label: '专注率' },
      { key: 'latest', label: '最新开启' },
    ]
    rooms.value = []
  } finally {
    loading.value = false
  }
}

async function onCategoryChange(key) {
  activeCategory.value = key
  await loadPlaza()
}

async function onSortChange(key) {
  activeSort.value = key
  await loadPlaza()
}

async function joinRoom(room) {
  await requestJoin(room)
}

async function confirmPasswordJoin() {
  const pwd = passwordInput.value.trim()
  if (!pwd) return
  await submitPassword(pwd)
  passwordInput.value = ''
}

function closePasswordModal() {
  passwordInput.value = ''
  cancelPassword()
}

async function createRoom() {
  router.push('/study-room/create')
}

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
        // ignore release errors
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

onMounted(() => {
  loadPlaza()
  restartCarousel()
})

onBeforeUnmount(() => {
  window.clearInterval(carouselTimer)
})
</script>

<template>
  <div class="plaza-page page">
    <div class="plaza-bg" aria-hidden="true">
      <div class="bg-gradient" />
      <div class="bg-stars" />
    </div>

    <header class="plaza-header">
      <button class="icon-btn" type="button" aria-label="返回" @click="router.back()">
        <font-awesome-icon icon="chevron-left" />
      </button>
      <h1 class="plaza-title">自习室广场</h1>
      <div class="header-spacer" />
    </header>

    <div class="category-bar" :class="{ expanded: showAllCategories }">
      <div v-if="!showAllCategories" class="category-scroll">
        <button
          v-for="cat in categories"
          :key="cat.key"
          class="category-pill"
          :class="{ active: activeCategory === cat.key }"
          type="button"
          @click="onCategoryChange(cat.key)"
        >
          {{ cat.label }}
        </button>
      </div>
      <div v-else class="category-panel">
        <button
          v-for="cat in categories"
          :key="cat.key"
          class="category-pill"
          :class="{ active: activeCategory === cat.key }"
          type="button"
          @click="onCategoryChange(cat.key); showAllCategories = false"
        >
          {{ cat.label }}
        </button>
      </div>
      <button
        class="category-expand"
        :class="{ active: showAllCategories }"
        type="button"
        :aria-label="showAllCategories ? '收起分类' : '展开所有分类'"
        @click="showAllCategories = !showAllCategories"
      >
        <font-awesome-icon icon="bars" />
      </button>
    </div>

    <main class="page-content no-tab">
      <section class="plaza-carousel" aria-label="自习室推荐">
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
              <img :src="src" :alt="`自习室推荐 ${index + 1}`" draggable="false">
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

      <section class="filter-panel" aria-label="自习室排序和视图">
        <div class="filter-head">
          <div class="filter-summary">
            <span class="filter-eyebrow">当前排序</span>
            <strong>{{ activeSortLabel }}</strong>
            <span class="room-count">共 {{ rooms.length }} 间</span>
          </div>

          <div class="view-toggle" role="group" aria-label="房间展示方式">
            <button
              class="view-btn"
              :class="{ active: viewMode === 'list' }"
              type="button"
              aria-label="列表视图"
              :aria-pressed="viewMode === 'list'"
              @click="viewMode = 'list'"
            >
              <font-awesome-icon icon="bars" />
            </button>
            <button
              class="view-btn"
              :class="{ active: viewMode === 'grid' }"
              type="button"
              aria-label="网格视图"
              :aria-pressed="viewMode === 'grid'"
              @click="viewMode = 'grid'"
            >
              <font-awesome-icon icon="grip" />
            </button>
          </div>
        </div>

        <div class="sort-options" role="tablist" aria-label="排序方式">
          <button
            v-for="filter in filters"
            :key="filter.key"
            class="sort-chip"
            :class="{ active: activeSort === filter.key }"
            type="button"
            role="tab"
            :aria-selected="activeSort === filter.key"
            :disabled="loading"
            @click="onSortChange(filter.key)"
          >
            <span class="sort-icon">
              <font-awesome-icon :icon="filterIcon(filter.key)" />
            </span>
            <span>{{ filter.label }}</span>
            <span v-if="activeSort === filter.key" class="active-indicator" />
          </button>
        </div>
      </section>

      <section class="room-list" :class="`view-${viewMode}`" aria-label="自习室列表">
        <p v-if="loading" class="loading-tip">加载中...</p>
        <p v-else-if="!rooms.length" class="loading-tip">暂无自习室</p>

        <article v-for="room in rooms" :key="room.id" class="room-card">
          <div class="room-cover" :style="coverStyle(room.coverSeed)">
            <img :src="avatarUrl(room.coverSeed)" :alt="room.name" />
          </div>

          <div class="room-body">
            <div class="room-title-row">
              <h3 class="room-name">{{ room.name }}</h3>
              <span v-if="room.roomLabel" class="room-label">{{ room.roomLabel }}</span>
            </div>
            <p class="room-subtitle">{{ room.subtitle }}</p>

            <div class="room-stats">
              <span class="stat-item">
                <font-awesome-icon icon="users" />
                {{ room.onlineCount }}人在线
              </span>
              <span class="stat-divider" />
              <span class="stat-item stat-focus">专注率 {{ room.focusRate }}%</span>
            </div>

            <div class="room-footer">
              <div class="avatar-stack">
                <img
                  v-for="(seed, index) in room.memberAvatars.slice(0, 4)"
                  :key="`${room.id}-${seed}-${index}`"
                  :src="avatarUrl(seed)"
                  :alt="`成员${index + 1}`"
                />
                <span v-if="room.extraMembers > 0" class="avatar-more">+{{ room.extraMembers }}</span>
              </div>
              <button
                class="join-btn"
                type="button"
                :disabled="joining"
                @click="joinRoom(room)"
              >
                加入房间
              </button>
            </div>
          </div>
        </article>
      </section>
    </main>

    <button class="create-fab" type="button" @click="createRoom">
      <span class="fab-icon">
        <font-awesome-icon icon="plus" />
      </span>
      创建自习室
    </button>

    <div v-if="passwordRoom" class="pwd-overlay mobile-overlay" @click.self="closePasswordModal">
      <div class="pwd-sheet">
        <h3>输入房间密码</h3>
        <p class="pwd-hint">「{{ passwordRoom.name }}」为私密房间</p>
        <input
          v-model="passwordInput"
          type="password"
          class="pwd-input"
          maxlength="8"
          placeholder="4-8 位密码"
          @keyup.enter="confirmPasswordJoin"
        >
        <div class="pwd-actions">
          <button type="button" class="pwd-cancel" @click="closePasswordModal">取消</button>
          <button type="button" class="pwd-confirm" :disabled="joining" @click="confirmPasswordJoin">
            加入
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.plaza-page {
  --text-primary: #4a3b8c;
  --text-secondary: #7768a8;
  --accent-green: #28b446;
  background: #3b3e91;
}

.plaza-bg {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.bg-gradient {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, #3b3e91 0%, #4a48a8 18%, #5f5eb8 32%, #7d78cc 48%, #b8b2e8 68%, #ddd8f8 84%, #ece9fb 100%);
}

.bg-stars {
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  height: 220px;
  opacity: .8;
  background-image:
    radial-gradient(1.5px 1.5px at 10% 20%, rgba(255,255,255,.95) 0%, transparent 100%),
    radial-gradient(1px 1px at 30% 12%, rgba(255,255,255,.8) 0%, transparent 100%),
    radial-gradient(1px 1px at 55% 24%, rgba(255,255,255,.7) 0%, transparent 100%),
    radial-gradient(1px 1px at 78% 16%, rgba(255,255,255,.85) 0%, transparent 100%),
    radial-gradient(1px 1px at 92% 30%, rgba(255,255,255,.6) 0%, transparent 100%);
}

.plaza-header {
  position: relative;
  z-index: 10;
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  padding: calc(10px + env(safe-area-inset-top, 0px)) 16px 8px;
}

.plaza-title {
  color: #fff;
  font-size: 17px;
  font-weight: 700;
}

.header-spacer {
  width: 36px;
}

.icon-btn {
  display: flex;
  width: 36px;
  height: 36px;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(255, 255, 255, .14);
  color: rgba(255, 255, 255, .95);
  font-size: 14px;
}

.category-bar {
  position: relative;
  z-index: 10;
  display: flex;
  flex-shrink: 0;
  align-items: center;
  padding: 0 12px 12px 16px;
  gap: 6px;
}

.category-scroll {
  display: flex;
  min-width: 0;
  flex: 1;
  gap: 10px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  mask-image: linear-gradient(to right, #000 88%, transparent 100%);
}

.category-scroll::-webkit-scrollbar {
  display: none;
}

.category-expand {
  display: flex;
  width: 34px;
  height: 34px;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: rgba(255, 255, 255, .14);
  color: rgba(255, 255, 255, .95);
  font-size: 14px;
}

.category-bar.expanded {
  align-items: flex-start;
}

.category-expand.active {
  background: rgba(255, 255, 255, .24);
}

.category-panel {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-wrap: wrap;
  gap: 10px;
}

.category-pill {
  flex-shrink: 0;
  padding: 7px 16px;
  border: 1px solid transparent;
  border-radius: 999px;
  background: rgba(255, 255, 255, .16);
  color: rgba(255, 255, 255, .88);
  font-size: 13px;
  font-weight: 600;
}

.category-pill.active {
  border-color: rgba(255, 255, 255, .65);
  background: #fff;
  color: var(--text-primary);
}

.page-content {
  position: relative;
  z-index: 5;
  padding: 0 16px calc(env(safe-area-inset-bottom, 0px) + 88px);
}

.plaza-carousel {
  position: relative;
  overflow: hidden;
  border-radius: 20px;
  line-height: 0;
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
  padding-top: 31.5%;
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
  transform: scale(1.06, 1.2);
  transform-origin: center center;
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
  background: rgba(255, 255, 255, .42);
  transition: width .2s ease, background .2s ease;
}

.carousel-dot.active {
  width: 16px;
  background: #fff;
}

.filter-panel {
  margin-top: 14px;
  padding: 12px;
  border: 1px solid rgba(255, 255, 255, .54);
  border-radius: 18px;
  background: linear-gradient(145deg, rgba(250, 249, 255, .94), rgba(231, 227, 250, .9));
  box-shadow: 0 10px 28px rgba(57, 42, 126, .12), inset 0 1px 0 rgba(255, 255, 255, .72);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}

.filter-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.filter-summary {
  display: flex;
  min-width: 0;
  align-items: baseline;
  gap: 6px;
}

.filter-eyebrow {
  color: #9a8dbd;
  font-size: 10px;
  font-weight: 600;
}

.filter-summary strong {
  color: var(--text-primary);
  font-size: 13px;
  font-weight: 800;
}

.room-count {
  color: #9a8dbd;
  font-size: 10px;
}

.view-toggle {
  display: flex;
  flex-shrink: 0;
  gap: 3px;
  padding: 3px;
  border: 1px solid rgba(111, 91, 178, .1);
  border-radius: 11px;
  background: rgba(113, 95, 179, .08);
}

.view-btn {
  display: flex;
  width: 30px;
  height: 28px;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  color: #9688b9;
  font-size: 12px;
  transition: color .2s ease, background .2s ease, box-shadow .2s ease, transform .2s ease;
}

.view-btn.active {
  background: #fff;
  box-shadow: 0 4px 10px rgba(68, 48, 135, .13);
  color: #6d59c8;
}

.view-btn:active {
  transform: scale(.94);
}

.sort-options {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin-top: 11px;
}

.sort-chip {
  position: relative;
  display: flex;
  min-width: 0;
  height: 38px;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 0 8px;
  border: 1px solid rgba(112, 91, 181, .1);
  border-radius: 12px;
  background: rgba(255, 255, 255, .5);
  color: #8173a8;
  font-size: 11px;
  font-weight: 650;
  white-space: nowrap;
  transition: color .2s ease, background .2s ease, border-color .2s ease, transform .2s ease;
}

.sort-chip:disabled {
  cursor: wait;
  opacity: .72;
}

.sort-chip:not(:disabled):active {
  transform: scale(.97);
}

.sort-chip.active {
  border-color: rgba(119, 96, 214, .22);
  background: linear-gradient(135deg, rgba(146, 123, 238, .18), rgba(112, 91, 211, .12));
  color: #5d49b3;
}

.sort-icon {
  display: flex;
  width: 22px;
  height: 22px;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 7px;
  background: rgba(126, 105, 204, .1);
  font-size: 10px;
}

.sort-chip.active .sort-icon {
  background: linear-gradient(135deg, #9179eb, #7058d1);
  box-shadow: 0 4px 9px rgba(92, 68, 181, .22);
  color: #fff;
}

.active-indicator {
  position: absolute;
  right: 7px;
  bottom: 5px;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #7a61d9;
  box-shadow: 0 0 5px rgba(122, 97, 217, .55);
}

.room-list {
  margin-top: 10px;
  padding: 12px 0 8px;
  border: 1px solid rgba(255, 255, 255, .5);
  border-radius: 18px;
  background: rgba(244, 242, 252, .95);
  box-shadow: 0 10px 28px rgba(57, 42, 126, .1);
  transition: padding .2s ease;
}

.room-card {
  display: flex;
  gap: 12px;
  margin: 0 12px 12px;
  padding: 12px;
  border: 1px solid rgba(255, 255, 255, .75);
  border-radius: 18px;
  background: rgba(248, 247, 255, .96);
  box-shadow: 0 8px 24px rgba(70, 50, 130, .08);
}

.room-cover {
  width: 78px;
  height: 78px;
  flex-shrink: 0;
  overflow: hidden;
  border-radius: 16px;
}

.room-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.room-body {
  min-width: 0;
  flex: 1;
}

.room-title-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.room-name {
  color: var(--text-primary);
  font-size: 15px;
  font-weight: 800;
}

.room-label {
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(159, 122, 234, .14);
  color: #6b52c4;
  font-size: 10px;
  font-weight: 600;
}

.room-subtitle {
  margin-top: 4px;
  color: var(--text-secondary);
  font-size: 11px;
  line-height: 1.35;
}

.room-stats {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 7px;
}

.stat-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--text-secondary);
  font-size: 11px;
}

.stat-item svg {
  font-size: 10px;
}

.stat-divider {
  width: 1px;
  height: 10px;
  background: rgba(120, 96, 180, .18);
}

.stat-focus {
  color: var(--accent-green);
  font-weight: 700;
}

.room-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 10px;
}

.avatar-stack {
  display: flex;
  align-items: center;
}

.avatar-stack img {
  width: 24px;
  height: 24px;
  margin-left: -6px;
  border: 2px solid #fff;
  border-radius: 50%;
  object-fit: cover;
}

.avatar-stack img:first-child {
  margin-left: 0;
}

.avatar-more {
  display: inline-flex;
  width: 24px;
  height: 24px;
  align-items: center;
  justify-content: center;
  margin-left: -6px;
  border: 2px solid #fff;
  border-radius: 50%;
  background: rgba(159, 122, 234, .18);
  color: #6b52c4;
  font-size: 9px;
  font-weight: 700;
}

.join-btn {
  flex-shrink: 0;
  padding: 7px 12px;
  border-radius: 999px;
  background: linear-gradient(135deg, #8e8cf8, #6a67e0);
  box-shadow: 0 4px 14px rgba(100, 70, 180, .28);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
}

.room-list.view-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  padding: 10px;
}

.view-grid .loading-tip {
  grid-column: 1 / -1;
}

.view-grid .room-card {
  min-width: 0;
  flex-direction: column;
  gap: 9px;
  margin: 0;
  padding: 10px;
  border-radius: 16px;
}

.view-grid .room-cover {
  width: 100%;
  height: 96px;
  border-radius: 13px;
}

.view-grid .room-cover img {
  object-fit: contain;
}

.view-grid .room-body {
  width: 100%;
}

.view-grid .room-title-row {
  align-items: flex-start;
  justify-content: space-between;
}

.view-grid .room-name {
  min-width: 0;
  overflow: hidden;
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.view-grid .room-label {
  flex-shrink: 0;
  padding: 2px 6px;
  font-size: 8px;
}

.view-grid .room-subtitle {
  display: -webkit-box;
  min-height: 29px;
  overflow: hidden;
  font-size: 10px;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.view-grid .room-stats {
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 6px;
}

.view-grid .stat-item {
  font-size: 9px;
}

.view-grid .stat-divider {
  display: none;
}

.view-grid .room-footer {
  align-items: stretch;
  flex-direction: column;
  margin-top: 8px;
}

.view-grid .avatar-stack {
  min-height: 24px;
}

.view-grid .join-btn {
  width: 100%;
  padding: 8px;
}

.create-fab {
  position: fixed;
  z-index: 20;
  right: 16px;
  bottom: calc(env(safe-area-inset-bottom, 0px) + 20px);
  left: 16px;
  display: flex;
  max-width: 398px;
  height: 52px;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin: 0 auto;
  border-radius: 999px;
  background: linear-gradient(135deg, #8e8cf8, #6a67e0);
  box-shadow: 0 10px 28px rgba(70, 50, 130, .32);
  color: #fff;
  font-size: 15px;
  font-weight: 700;
}

.fab-icon {
  display: inline-flex;
  width: 24px;
  height: 24px;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(255, 255, 255, .22);
  font-size: 12px;
}

.loading-tip {
  padding: 28px 16px;
  color: var(--text-secondary);
  font-size: 13px;
  text-align: center;
}

.pwd-overlay {
  z-index: 100;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.pwd-sheet {
  width: 100%;
  background: #fff;
  border-radius: 20px 20px 0 0;
  padding: 20px 20px calc(var(--safe-bottom) + 16px);
}

.pwd-sheet h3 {
  font-size: 17px;
  font-weight: 700;
  color: #4a3b8c;
  margin-bottom: 6px;
}

.pwd-hint {
  font-size: 13px;
  color: #8b7fb8;
  margin-bottom: 14px;
}

.pwd-input {
  width: 100%;
  border: none;
  background: #f5f3ff;
  border-radius: 12px;
  padding: 12px 14px;
  font-size: 15px;
  margin-bottom: 14px;
  outline: none;
}

.pwd-actions {
  display: flex;
  gap: 10px;
}

.pwd-cancel,
.pwd-confirm {
  flex: 1;
  border: none;
  border-radius: 12px;
  padding: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
}

.pwd-cancel {
  background: #f3f4f6;
  color: #6b7280;
}

.pwd-confirm {
  background: linear-gradient(135deg, #a855f7, #7c3aed);
  color: #fff;
}

.pwd-confirm:disabled {
  opacity: 0.55;
}
</style>
