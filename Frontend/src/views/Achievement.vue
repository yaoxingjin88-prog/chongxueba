<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { api } from '../api'

const router = useRouter()
const user = useUserStore()

// ==================== 数据 ====================
const tabs = ['勋章墙', '宠物图鉴', '成长回忆录']
const activeTab = ref(0)

const medalCategories = [
  { id: 'all', label: '全部' },
  { id: 'study', label: '学习达人' },
  { id: 'focus', label: '专注之星' },
  { id: 'streak', label: '坚持打卡' },
  { id: 'special', label: '特殊成就' },
]
const activeCategory = ref('all')

const achievements = ref([])
const pets = ref([])
const memories = ref([])
const selectedMedal = ref(null)

// ==================== 计算属性 ====================
const earnedCount = computed(() => achievements.value.filter((m) => m.earned).length)
const totalCount = computed(() => achievements.value.length)
const progressPercent = computed(() =>
  totalCount.value ? Math.round((earnedCount.value / totalCount.value) * 100) : 0,
)

const filteredMedals = computed(() => {
  if (activeCategory.value === 'all') return achievements.value
  return achievements.value.filter((m) => m.category === activeCategory.value)
})

const recentMedals = computed(() =>
  achievements.value.filter((m) => m.earned).slice(0, 3),
)

const collectedPets = computed(() => pets.value.filter((p) => p.unlocked).length)

// ==================== 加载数据 ====================
// API 接口约定（后端搭档参考）：
//   GET /api/achievements 返回:
//   {
//     medals: [{ id, name, desc, icon, category, earned, earnedDate?, rarity, color, progress? }],
//     pets:   [{ id, name, type, unlocked, level?, image?, desc? }],
//     memories: [{ id, date, title, desc, icon, color }]
//   }
async function loadAchievements() {
  try {
    const data = await api.getAchievements()
    const medalList = Array.isArray(data.medals)
      ? data.medals
      : (Array.isArray(data.allMedals) ? data.allMedals : [])
    achievements.value = medalList
    if (data.pets) pets.value = data.pets
    if (data.memories) memories.value = data.memories
  } catch {
    achievements.value = getDemoMedals()
    pets.value = getDemoPets()
    memories.value = getDemoMemories()
  }
}

function getDemoMedals() {
  return [
    // 学习达人
    { id: 'first_study', name: '初次学习', desc: '完成第一次学习任务', icon: 'book-open-reader', category: 'study', earned: true, earnedDate: '06-15', rarity: 'common', color: '#60a5fa' },
    { id: 'study_10h', name: '学霸初成', desc: '累计学习10小时', icon: 'brain', category: 'study', earned: true, earnedDate: '06-18', rarity: 'common', color: '#60a5fa' },
    { id: 'study_50h', name: '知识渊博', desc: '累计学习50小时', icon: 'trophy', category: 'study', earned: true, earnedDate: '06-24', rarity: 'rare', color: '#818cf8' },
    { id: 'study_100h', name: '学习大师', desc: '累计学习100小时', icon: 'crown', category: 'study', earned: false, progress: { current: 78, total: 100 }, rarity: 'epic', color: '#a78bfa' },
    { id: 'perfect_week', name: '完美一周', desc: '连续7天完成所有任务', icon: 'calendar-check', category: 'study', earned: true, earnedDate: '06-21', rarity: 'rare', color: '#818cf8' },
    { id: 'night_owl', name: '夜猫子', desc: '在22:00后完成学习', icon: 'moon', category: 'study', earned: true, earnedDate: '06-19', rarity: 'common', color: '#60a5fa' },
    // 专注之星
    { id: 'first_focus', name: '初次专注', desc: '完成第一次专注任务', icon: 'bullseye', category: 'focus', earned: true, earnedDate: '06-14', rarity: 'common', color: '#f59e0b' },
    { id: 'focus_1h', name: '专注新人', desc: '单次专注超过1小时', icon: 'clock', category: 'focus', earned: true, earnedDate: '06-20', rarity: 'common', color: '#f59e0b' },
    { id: 'focus_3h', name: '深度专注', desc: '单次专注超过3小时', icon: 'fire', category: 'focus', earned: false, progress: { current: 2.5, total: 3 }, rarity: 'rare', color: '#f97316' },
    { id: 'focus_marathon', name: '专注马拉松', desc: '单次专注超过5小时', icon: 'trophy', category: 'focus', earned: false, progress: { current: 2.5, total: 5 }, rarity: 'epic', color: '#ef4444' },
    { id: 'flow_state', name: '心流状态', desc: '一周内达成5次深度专注', icon: 'bolt', category: 'focus', earned: true, earnedDate: '06-25', rarity: 'rare', color: '#f97316' },
    // 坚持打卡
    { id: 'streak_3', name: '三天打鱼', desc: '连续打卡3天', icon: 'list-check', category: 'streak', earned: true, earnedDate: '06-17', rarity: 'common', color: '#34d399' },
    { id: 'streak_7', name: '一周之约', desc: '连续打卡7天', icon: 'clock', category: 'streak', earned: true, earnedDate: '06-21', rarity: 'common', color: '#34d399' },
    { id: 'streak_30', name: '月度之星', desc: '连续打卡30天', icon: 'medal', category: 'streak', earned: false, progress: { current: 23, total: 30 }, rarity: 'epic', color: '#10b981' },
    { id: 'streak_100', name: '百日筑基', desc: '连续打卡100天', icon: 'gem', category: 'streak', earned: false, progress: { current: 23, total: 100 }, rarity: 'legendary', color: '#fbbf24' },
    // 特殊成就
    { id: 'first_pet', name: '初次相遇', desc: '领养第一只宠物', icon: 'heart', category: 'special', earned: true, earnedDate: '06-13', rarity: 'common', color: '#f472b6' },
    { id: 'pet_master', name: '宠物达人', desc: '宠物达到20级', icon: 'paw', category: 'special', earned: true, earnedDate: '06-26', rarity: 'rare', color: '#e879f9' },
    { id: 'mall_first', name: '首次购物', desc: '在商城购买第一件商品', icon: 'bag-shopping', category: 'special', earned: true, earnedDate: '06-16', rarity: 'common', color: '#f472b6' },
    { id: 'collector', name: '收藏家', desc: '收集全部家具', icon: 'box-open', category: 'special', earned: false, progress: { current: 8, total: 20 }, rarity: 'epic', color: '#e879f9' },
  ]
}

function getDemoPets() {
  // TODO: 后端 API 就绪后，替换为 api.getAchievements() 返回的 pets 数据
  return [
    {
      id: 'tororo',
      name: '山药泥',
      type: '白猫',
      unlocked: true,
      level: user.petLevel || 23,
      date: '06-13',
      image: '/live2d/runtime/tororo/preview/thumb.png',
      desc: 'Live2D 官方示例模型 · 白猫',
    },
    {
      id: 'hijiki',
      name: '羊栖菜',
      type: '黑猫',
      unlocked: true,
      level: 15,
      date: '06-20',
      image: '/live2d/runtime/hijiki/preview/thumb.png',
      desc: 'Live2D 官方示例模型 · 黑猫',
    },
  ]
}

function getDemoMemories() {
  return [
    { id: 1, date: '2026-06-13', title: '旅程开始', desc: '注册宠学霸，领养了第一只宠物「小橙」', icon: 'star', color: '#fbbf24' },
    { id: 2, date: '2026-06-14', title: '第一次专注', desc: '完成首次25分钟番茄钟专注', icon: 'bullseye', color: '#60a5fa' },
    { id: 3, date: '2026-06-17', title: '三天打卡', desc: '连续3天完成学习打卡，获得「三天打鱼」勋章', icon: 'calendar-check', color: '#34d399' },
    { id: 4, date: '2026-06-21', title: '完美一周', desc: '连续7天完成所有每日任务，解锁「完美一周」成就', icon: 'trophy', color: '#818cf8' },
    { id: 5, date: '2026-06-23', title: '宠物进化', desc: '小橙达到20级，解锁新外观', icon: 'paw', color: '#f472b6' },
    { id: 6, date: '2026-06-25', title: '心流时刻', desc: '本周达成5次深度专注，获得「心流状态」勋章', icon: 'fire', color: '#f97316' },
    { id: 7, date: '2026-06-26', title: '宠物达人', desc: '宠物达到20级，解锁「宠物达人」成就', icon: 'medal', color: '#e879f9' },
  ]
}

// ==================== 方法 ====================
function rarityClass(rarity) {
  return `rarity-${rarity || 'common'}`
}

function openMedal(medal) {
  if (medal.earned) selectedMedal.value = medal
}

// ==================== 辅助函数 ====================
function adjustColor(hex, amount) {
  const num = parseInt(hex.replace('#', ''), 16)
  const r = Math.min(255, Math.max(0, (num >> 16) + amount))
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amount))
  const b = Math.min(255, Math.max(0, (num & 0x0000ff) + amount))
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}

// ==================== 初始化 ====================
onMounted(loadAchievements)
</script>

<template>
  <div class="achievement-page">
    <!-- 顶部渐变背景 -->
    <div class="hero-bg">
      <div class="hero-gradient" />
      <div class="sparkles" />
      <div class="floating-shapes">
        <div class="shape hex-1" />
        <div class="shape hex-2" />
        <div class="shape hex-3" />
      </div>
    </div>

    <!-- 顶栏 -->
    <header class="ach-header">
      <button class="back-btn" @click="router.back()">
        <font-awesome-icon icon="chevron-left" />
      </button>
      <h1 class="ach-title">成就系统</h1>
      <div class="header-spacer" />
    </header>

    <!-- 进度概览 -->
    <div class="progress-card">
      <div class="progress-ring-container">
        <svg class="progress-ring" viewBox="0 0 100 100">
          <circle
            class="ring-bg"
            cx="50" cy="50" r="42"
            fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="6"
          />
          <circle
            class="ring-fill"
            cx="50" cy="50" r="42"
            fill="none" stroke="url(#ringGradient)" stroke-width="6"
            stroke-linecap="round"
            :stroke-dasharray="`${progressPercent * 2.64} 264`"
            transform="rotate(-90 50 50)"
          />
          <defs>
            <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#fbbf24" />
              <stop offset="50%" stop-color="#f472b6" />
              <stop offset="100%" stop-color="#818cf8" />
            </linearGradient>
          </defs>
        </svg>
        <div class="ring-center">
          <span class="ring-number">{{ earnedCount }}</span>
          <span class="ring-divider">/</span>
          <span class="ring-total">{{ totalCount }}</span>
        </div>
      </div>
      <div class="progress-info">
        <span class="progress-title">勋章收集进度</span>
        <span class="progress-pct">{{ progressPercent }}% 已完成</span>
      </div>
      <div class="recent-badges">
        <div
          v-for="medal in recentMedals"
          :key="medal.id"
          class="recent-badge-dot"
          :style="{ background: medal.color }"
          :title="medal.name"
        />
      </div>
    </div>

    <!-- 分段 Tab -->
    <div class="ach-tabs">
      <button
        v-for="(tab, i) in tabs"
        :key="tab"
        class="ach-tab-chip"
        :class="{ active: activeTab === i }"
        @click="activeTab = i"
      >
        {{ tab }}
      </button>
    </div>

    <!-- 内容卡片 -->
    <div class="content-card">
      <!-- ========== 勋章墙 ========== -->
      <template v-if="activeTab === 0">
        <!-- 分类筛选 -->
        <div class="filter-row">
          <button
            v-for="cat in medalCategories"
            :key="cat.id"
            class="filter-chip"
            :class="{ active: activeCategory === cat.id }"
            @click="activeCategory = cat.id"
          >
            {{ cat.label }}
          </button>
        </div>

        <!-- 蜂巢勋章网格 -->
        <div class="honeycomb-grid">
          <div
            v-for="(medal, i) in filteredMedals"
            :key="medal.id"
            class="hex-cell"
            :class="[
              rarityClass(medal.rarity),
              { earned: medal.earned, locked: !medal.earned },
            ]"
            :style="{ '--delay': `${i * 0.05}s` }"
            @click="openMedal(medal)"
          >
            <div class="hex-inner">
              <div class="hex-bg" :style="{ background: medal.earned ? `linear-gradient(145deg, ${medal.color}, ${adjustColor(medal.color, -30)})` : 'linear-gradient(145deg, #d1d5db, #9ca3af)' }" />
              <div class="hex-icon">
                <font-awesome-icon :icon="medal.icon || 'star'" />
              </div>
              <!-- 未获得时显示进度数字 -->
              <span v-if="!medal.earned && medal.progress" class="hex-progress-num">
                {{ medal.progress.current }}<small>/{{ medal.progress.total }}</small>
              </span>
              <!-- 未获得无进度的显示锁 -->
              <font-awesome-icon v-else-if="!medal.earned" icon="lock" class="locked-icon" />
              <!-- 未获得时显示进度条 -->
              <div v-if="!medal.earned && medal.progress" class="hex-progress">
                <div
                  class="hex-progress-fill"
                  :style="{ width: `${(medal.progress.current / medal.progress.total) * 100}%` }"
                />
              </div>
            </div>
            <span class="hex-label">{{ medal.name }}</span>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-if="filteredMedals.length === 0" class="empty-state">
          <font-awesome-icon icon="medal" class="empty-icon" />
          <p>该分类暂无勋章</p>
        </div>
      </template>

      <!-- ========== 宠物图鉴 ========== -->
      <template v-if="activeTab === 1">
        <div class="collection-header">
          <span class="collection-title">已收集 {{ collectedPets }}/{{ pets.length }} 种宠物</span>
          <div class="collection-bar">
            <div
              class="collection-fill"
              :style="{ width: `${pets.length ? (collectedPets / pets.length) * 100 : 0}%` }"
            />
          </div>
        </div>

        <div class="pet-grid">
          <div
            v-for="pet in pets"
            :key="pet.id"
            class="pet-card"
            :class="[pet.id, { locked: !pet.unlocked }]"
          >
            <!-- CSS 绘制的猫猫头像 -->
            <div class="pet-avatar" :class="{ 'not-unlocked': !pet.unlocked }">
              <div class="cat-face" :class="pet.id">
                <div class="cat-ear left" />
                <div class="cat-ear right" />
                <div class="cat-inner-ear left" />
                <div class="cat-inner-ear right" />
                <div class="cat-eyes">
                  <div class="cat-eye left"><div class="cat-pupil" /></div>
                  <div class="cat-eye right"><div class="cat-pupil" /></div>
                </div>
                <div class="cat-nose" />
                <div class="cat-mouth" />
                <div class="cat-whiskers left">
                  <span v-for="w in 2" :key="w" class="whisker" />
                </div>
                <div class="cat-whiskers right">
                  <span v-for="w in 2" :key="w" class="whisker" />
                </div>
              </div>
              <div v-if="!pet.unlocked" class="pet-lock-overlay">
                <font-awesome-icon icon="lock" />
              </div>
            </div>
            <span class="pet-name">{{ pet.name }}</span>
            <span v-if="pet.unlocked" class="pet-type-tag">{{ pet.type }}</span>
            <span v-if="pet.unlocked" class="pet-meta">Lv.{{ pet.level }}</span>
            <span v-else class="pet-condition">{{ pet.condition }}</span>
            <span v-if="pet.unlocked && pet.desc" class="pet-desc">{{ pet.desc }}</span>
          </div>
        </div>
      </template>

      <!-- ========== 成长回忆录 ========== -->
      <template v-if="activeTab === 2">
        <div class="timeline">
          <div
            v-for="(mem, i) in memories"
            :key="mem.id"
            class="timeline-item"
            :class="{ 'last-item': i === memories.length - 1 }"
          >
            <div class="timeline-line">
              <div class="timeline-dot" :style="{ background: mem.color }">
                <font-awesome-icon :icon="mem.icon" />
              </div>
              <div v-if="i < memories.length - 1" class="timeline-connector" />
            </div>
            <div class="timeline-card">
              <span class="timeline-date">{{ mem.date }}</span>
              <h4 class="timeline-title">{{ mem.title }}</h4>
              <p class="timeline-desc">{{ mem.desc }}</p>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- ========== 勋章详情弹窗 ========== -->
    <Teleport to="body">
      <div v-if="selectedMedal" class="modal-overlay" @click.self="selectedMedal = null">
        <div class="modal-card" :class="rarityClass(selectedMedal.rarity)">
          <button class="modal-close" @click="selectedMedal = null">
            <font-awesome-icon icon="xmark" />
          </button>
          <div class="modal-badge">
            <div class="modal-hex">
              <font-awesome-icon :icon="selectedMedal.icon" />
            </div>
            <div class="modal-rarity-tag">{{ selectedMedal.rarity?.toUpperCase() || 'COMMON' }}</div>
          </div>
          <h3 class="modal-name">{{ selectedMedal.name }}</h3>
          <p class="modal-desc">{{ selectedMedal.desc }}</p>
          <div v-if="selectedMedal.earnedDate" class="modal-date">
            <font-awesome-icon icon="calendar-check" />
            获得于 {{ selectedMedal.earnedDate }}
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>




<style scoped>
/* ========== 页面容器 ========== */
.achievement-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
  background: #c4b5fd;
}

/* ========== 顶部背景 ========== */
.hero-bg {
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 380px;
  pointer-events: none;
  overflow: hidden;
}

.hero-gradient {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, #b794f6 0%, #a78bfa 40%, #c4b5fd 100%);
}

.sparkles {
  position: absolute;
  inset: 0;
  background-image:
    radial-gradient(2px 2px at 15% 15%, rgba(255,255,255,0.9) 0%, transparent 100%),
    radial-gradient(1.5px 1.5px at 35% 8%, rgba(255,255,255,0.7) 0%, transparent 100%),
    radial-gradient(2px 2px at 60% 20%, rgba(255,255,255,0.85) 0%, transparent 100%),
    radial-gradient(1px 1px at 80% 12%, rgba(255,255,255,0.6) 0%, transparent 100%),
    radial-gradient(1.5px 1.5px at 25% 30%, rgba(255,255,255,0.5) 0%, transparent 100%),
    radial-gradient(1px 1px at 70% 25%, rgba(255,255,255,0.55) 0%, transparent 100%),
    radial-gradient(2px 2px at 45% 18%, rgba(255,255,255,0.75) 0%, transparent 100%),
    radial-gradient(1px 1px at 90% 28%, rgba(255,255,255,0.5) 0%, transparent 100%);
}

/* 浮动六边形装饰 */
.floating-shapes {
  position: absolute;
  inset: 0;
}

.shape {
  position: absolute;
  width: 40px; height: 46px;
  clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
  opacity: 0.08;
  background: #fff;
}

.hex-1 { top: 20px; left: 10%; transform: rotate(15deg); }
.hex-2 { top: 60px; right: 15%; width: 32px; height: 37px; transform: rotate(-10deg); }
.hex-3 { top: 140px; left: 75%; width: 24px; height: 28px; transform: rotate(20deg); }

/* ========== 顶栏 ========== */
.ach-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  padding-top: calc(8px + env(safe-area-inset-top, 0px));
  position: relative;
  z-index: 10;
  flex-shrink: 0;
}

.back-btn {
  width: 36px; height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: #fff;
}

.ach-title {
  font-size: 17px;
  font-weight: 700;
  color: #fff;
}

.header-spacer { width: 36px; }

/* ========== 进度概览卡片 ========== */
.progress-card {
  display: flex;
  align-items: center;
  gap: 16px;
  margin: 0 16px;
  padding: 16px 18px;
  background: rgba(255,255,255,0.15);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 20px;
  border: 1px solid rgba(255,255,255,0.22);
  position: relative;
  z-index: 10;
  flex-shrink: 0;
}

.progress-ring-container {
  position: relative;
  width: 64px; height: 64px;
  flex-shrink: 0;
}

.progress-ring {
  width: 100%; height: 100%;
  transform: rotate(-90deg);
}

.ring-bg {
  transition: none;
}

.ring-fill {
  transition: stroke-dasharray 0.6s ease;
}

.ring-center {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1px;
}

.ring-number {
  font-size: 20px;
  font-weight: 800;
  color: #fff;
  line-height: 1;
}

.ring-divider {
  font-size: 14px;
  color: rgba(255,255,255,0.6);
  margin: 0 1px;
}

.ring-total {
  font-size: 14px;
  font-weight: 600;
  color: rgba(255,255,255,0.7);
  line-height: 1;
}

.progress-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.progress-title {
  font-size: 14px;
  font-weight: 700;
  color: #fff;
}

.progress-pct {
  font-size: 12px;
  color: rgba(255,255,255,0.75);
}

.recent-badges {
  display: flex;
  gap: 6px;
  margin-left: auto;
}

.recent-badge-dot {
  width: 10px; height: 10px;
  border-radius: 50%;
  box-shadow: 0 0 6px rgba(255,255,255,0.5);
}

/* ========== Tab ========== */
.ach-tabs {
  display: flex;
  gap: 6px;
  padding: 14px 16px 16px;
  position: relative;
  z-index: 10;
  flex-shrink: 0;
}

.ach-tab-chip {
  flex: 1;
  padding: 9px 6px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 500;
  color: rgba(255,255,255,0.85);
  background: rgba(255,255,255,0.18);
  transition: all 0.2s;
  white-space: nowrap;
  text-align: center;
}

.ach-tab-chip.active {
  background: #fff;
  color: #5b21b6;
  font-weight: 700;
  box-shadow: 0 2px 10px rgba(0,0,0,0.08);
}

/* ========== 白色内容卡片 ========== */
.content-card {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  background: #fff;
  border-radius: 28px 28px 0 0;
  padding: 22px 14px;
  padding-bottom: calc(24px + env(safe-area-inset-bottom, 0px));
  position: relative;
  z-index: 5;
}

/* ========== 分类筛选 ========== */
.filter-row {
  display: flex;
  gap: 8px;
  padding: 0 4px 18px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.filter-row::-webkit-scrollbar { display: none; }

.filter-chip {
  padding: 7px 16px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  color: #71717a;
  background: #f4f4f5;
  white-space: nowrap;
  flex-shrink: 0;
  transition: all 0.2s;
}

.filter-chip.active {
  background: #5b21b6;
  color: #fff;
  box-shadow: 0 2px 8px rgba(91,33,182,0.25);
}

/* ========== 蜂巢勋章网格 ========== */
.honeycomb-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px 8px;
  padding: 4px 2px;
  justify-items: center;
}

.hex-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  cursor: default;
  animation: hexFadeIn 0.4s ease both;
  animation-delay: var(--delay);
}

.hex-cell.locked {
  cursor: default;
}

.hex-inner {
  position: relative;
  width: 80px; height: 90px;
  clip-path: polygon(50% 0%, 100% 22%, 100% 78%, 50% 100%, 0% 78%, 0% 22%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s, filter 0.3s;
  /* 金属边框用 box-shadow 模拟，clip-path 裁剪外部 */
  box-shadow: inset 0 0 0 2.5px rgba(255,255,255,0.25);
}

/* 闪烁高光层 */
.hex-inner::after {
  content: '';
  position: absolute;
  top: 6px; left: 20%; right: 20%; height: 26%;
  background: linear-gradient(180deg, rgba(255,255,255,0.35) 0%, transparent 100%);
  border-radius: 50%;
  z-index: 3;
  pointer-events: none;
}

.hex-cell.earned .hex-inner:active {
  transform: scale(0.93);
}

/* 传说品质光晕 */
.hex-cell.rarity-legendary .hex-inner {
  filter: drop-shadow(0 4px 16px rgba(251,191,36,0.55));
  box-shadow: inset 0 0 0 2.5px rgba(255,255,255,0.35);
}

.hex-cell.rarity-legendary.earned {
  animation: legendaryPulse 2.5s ease-in-out infinite;
}

@keyframes legendaryPulse {
  0%, 100% { filter: drop-shadow(0 4px 16px rgba(251,191,36,0.3)); }
  50%      { filter: drop-shadow(0 4px 24px rgba(251,191,36,0.6)); }
}

/* 史诗品质 */
.hex-cell.rarity-epic .hex-inner {
  filter: drop-shadow(0 3px 12px rgba(168,85,247,0.4));
  box-shadow: inset 0 0 0 2.5px rgba(255,255,255,0.28);
}

/* 稀有品质 */
.hex-cell.rarity-rare .hex-inner {
  filter: drop-shadow(0 3px 10px rgba(129,140,248,0.3));
}

.hex-bg {
  position: absolute;
  inset: 0;
}

/* 徽章内圈光效 */
.hex-bg::after {
  content: '';
  position: absolute;
  inset: 4px;
  clip-path: polygon(50% 0%, 100% 22%, 100% 78%, 50% 100%, 0% 78%, 0% 22%);
  background: radial-gradient(ellipse at 50% 35%, rgba(255,255,255,0.18) 0%, transparent 70%);
  pointer-events: none;
}

.hex-icon {
  position: relative;
  z-index: 2;
  font-size: 28px;
  color: #fff;
  filter: drop-shadow(0 2px 3px rgba(0,0,0,0.2));
}

.locked-icon {
  font-size: 15px;
  color: rgba(255,255,255,0.45);
  filter: drop-shadow(0 1px 2px rgba(0,0,0,0.15));
  z-index: 2;
  position: relative;
}

.hex-progress-num {
  position: relative;
  z-index: 4;
  font-size: 16px;
  font-weight: 700;
  color: rgba(255,255,255,0.9);
  text-shadow: 0 1px 3px rgba(0,0,0,0.2);
  line-height: 1;
  margin-top: 2px;
}

.hex-progress-num small {
  font-size: 10px;
  font-weight: 500;
  opacity: 0.8;
}

/* 进度条（锁定的勋章） */
.hex-progress {
  position: absolute;
  bottom: 12px;
  left: 14px;
  right: 14px;
  height: 4px;
  background: rgba(0,0,0,0.2);
  border-radius: 2px;
  z-index: 4;
  overflow: hidden;
}

.hex-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, rgba(255,255,255,0.9), rgba(255,255,255,0.6));
  border-radius: 2px;
  transition: width 0.4s ease;
}

.hex-label {
  font-size: 12px;
  font-weight: 600;
  color: #3f3f46;
  text-align: center;
  line-height: 1.3;
  max-width: 96px;
}

.hex-cell.locked .hex-label {
  color: #a1a1aa;
}

/* 稀有度样式 */
.rarity-common { --rarity-glow: rgba(96,165,250,0.3); }
.rarity-rare { --rarity-glow: rgba(129,140,248,0.4); }
.rarity-epic { --rarity-glow: rgba(168,85,247,0.45); }
.rarity-legendary { --rarity-glow: rgba(251,191,36,0.55); }

/* 锁定态徽章 - 故意的金属暗沉效果 */
.hex-cell.locked .hex-inner::after {
  opacity: 0.15;
}

.hex-cell.locked .hex-inner {
  box-shadow: inset 0 0 0 2px rgba(255,255,255,0.12);
  filter: brightness(0.65) saturate(0.5);
}

.hex-cell.locked .hex-bg {
  filter: brightness(0.8);
}

@keyframes hexFadeIn {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ========== 空状态 ========== */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48px 20px;
  color: #d4d4d8;
  gap: 10px;
}

.empty-icon {
  font-size: 36px;
}

.empty-state p {
  font-size: 13px;
  color: #a1a1aa;
}

/* ========== 宠物图鉴 ========== */
.collection-header {
  margin-bottom: 18px;
  padding: 0 4px;
}

.collection-title {
  font-size: 13px;
  font-weight: 600;
  color: #52525b;
  display: block;
  margin-bottom: 8px;
}

.collection-bar {
  height: 6px;
  background: #f4f4f5;
  border-radius: 3px;
  overflow: hidden;
}

.collection-fill {
  height: 100%;
  background: linear-gradient(90deg, #a78bfa, #f472b6);
  border-radius: 3px;
  transition: width 0.5s ease;
}

.pet-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px 12px;
}

.pet-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 16px 12px 14px;
  border-radius: 20px;
  border: 1px solid #f4f4f5;
  transition: transform 0.2s, box-shadow 0.2s;
  background: #fafafa;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}

.pet-card.tororo {
  background: linear-gradient(160deg, #fefefe 0%, #f5f3ff 100%);
}

.pet-card.hijiki {
  background: linear-gradient(160deg, #fafafa 0%, #2d2d3a 100%);
}

.pet-card.hijiki .pet-name,
.pet-card.hijiki .pet-meta,
.pet-card.hijiki .pet-desc {
  color: #e5e5e5;
}

.pet-card.hijiki .pet-type-tag {
  background: rgba(255,255,255,0.12);
  color: #c4b5fd;
}

.pet-card:not(.locked):active {
  transform: scale(0.97);
}

.pet-card.locked {
  opacity: 0.5;
  background: #f5f5f5;
}

.pet-avatar {
  width: 100px; height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.pet-avatar.not-unlocked {
  filter: grayscale(1) brightness(0.9);
}

/* ===== CSS 猫猫头像 ===== */
.cat-face {
  position: relative;
  width: 80px; height: 80px;
}

/* 底色圆 */
.cat-face::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
}

.cat-face.tororo::before {
  background: linear-gradient(160deg, #f9fafb 0%, #f3f0ff 100%);
  box-shadow:
    0 0 0 2px #e9d5ff,
    inset 0 -4px 8px rgba(168,139,250,0.08);
}

.cat-face.hijiki::before {
  background: linear-gradient(160deg, #4a4a5a 0%, #2d2d3a 100%);
  box-shadow:
    0 0 0 2px #5a5a6a,
    inset 0 -4px 8px rgba(0,0,0,0.3);
}

/* 耳朵 */
.cat-ear {
  position: absolute;
  top: -6px;
  width: 24px; height: 28px;
  border-radius: 70% 70% 20% 20%;
}

.cat-ear.left  { left: 2px; transform: rotate(-8deg); }
.cat-ear.right { right: 2px; transform: rotate(8deg); }

.cat-face.tororo .cat-ear {
  background: linear-gradient(180deg, #f5f3ff 0%, #ede9fe 60%, #e9d5ff 100%);
  box-shadow: inset 0 2px 4px rgba(168,139,250,0.15);
}

.cat-face.hijiki .cat-ear {
  background: linear-gradient(180deg, #3d3d4d 0%, #2d2d3a 60%, #1e1e2a 100%);
}

/* 内耳 */
.cat-inner-ear {
  position: absolute;
  top: 2px;
  width: 14px; height: 18px;
  border-radius: 60% 60% 30% 30%;
}

.cat-inner-ear.left  { left: 7px; transform: rotate(-5deg); }
.cat-inner-ear.right { right: 7px; transform: rotate(5deg); }

.cat-face.tororo .cat-inner-ear {
  background: linear-gradient(180deg, #fcd3e0 0%, #f9a8c8 100%);
}

.cat-face.hijiki .cat-inner-ear {
  background: linear-gradient(180deg, #6d5d6d 0%, #4d3d4d 100%);
}

/* 眼睛 */
.cat-eyes {
  position: absolute;
  top: 26px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 14px;
}

.cat-eye {
  width: 14px; height: 16px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cat-face.tororo .cat-eye {
  background: #3b3b4d;
}

.cat-face.hijiki .cat-eye {
  background: #fbbf24;
}

.cat-pupil {
  width: 7px; height: 7px;
  border-radius: 50%;
}

.cat-face.tororo .cat-pupil {
  background: #fff;
  box-shadow: 0 0 2px rgba(255,255,255,0.9);
}

.cat-face.hijiki .cat-pupil {
  background: #1a1a2e;
}

/* 鼻子 */
.cat-nose {
  position: absolute;
  bottom: 32px;
  left: 50%;
  transform: translateX(-50%);
  width: 10px; height: 6px;
  border-radius: 40% 40% 50% 50%;
}

.cat-face.tororo .cat-nose {
  background: #f472b6;
}

.cat-face.hijiki .cat-nose {
  background: #f9a8c8;
}

/* 嘴巴 */
.cat-mouth {
  position: absolute;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  width: 16px; height: 8px;
  border-bottom: 2px solid #d4d4d8;
  border-radius: 0 0 50% 50%;
}

.cat-face.hijiki .cat-mouth {
  border-color: #7a7a8a;
}

/* 胡须 */
.cat-whiskers {
  position: absolute;
  bottom: 30px;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.cat-whiskers.left  { left: -8px; }
.cat-whiskers.right { right: -8px; }

.whisker {
  display: block;
  height: 1.2px;
  border-radius: 1px;
  background: #d4d4d8;
}

.cat-whiskers.left .whisker {
  width: 18px;
  transform-origin: right center;
}

.cat-whiskers.left .whisker:nth-child(1) {
  width: 16px;
  transform: rotate(-12deg);
}

.cat-whiskers.left .whisker:nth-child(2) {
  width: 14px;
  transform: rotate(2deg);
}

.cat-whiskers.right .whisker {
  width: 18px;
  transform-origin: left center;
}

.cat-whiskers.right .whisker:nth-child(1) {
  width: 16px;
  transform: rotate(12deg);
}

.cat-whiskers.right .whisker:nth-child(2) {
  width: 14px;
  transform: rotate(-2deg);
}

.cat-face.hijiki .whisker {
  background: #7a7a8a;
}

/* 锁定遮罩 */
.pet-lock-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0,0,0,0.2);
  border-radius: 50%;
  color: #fff;
  font-size: 16px;
}

.pet-name {
  font-size: 14px;
  font-weight: 700;
  color: #27272a;
}

.pet-type-tag {
  font-size: 10px;
  color: #a78bfa;
  background: #f5f3ff;
  padding: 2px 10px;
  border-radius: 999px;
  font-weight: 500;
}

.pet-meta {
  font-size: 11px;
  color: #71717a;
  font-weight: 500;
}

.pet-desc {
  font-size: 10px;
  color: #a1a1aa;
  text-align: center;
  line-height: 1.3;
  max-width: 140px;
}

.pet-condition {
  font-size: 10px;
  color: #d4d4d8;
  text-align: center;
  line-height: 1.3;
  max-width: 140px;
}

/* ========== 成长回忆录 - 时间线 ========== */
.timeline {
  padding: 0 4px;
}

.timeline-item {
  display: flex;
  gap: 14px;
}

.timeline-item.last-item .timeline-connector {
  display: none;
}

.timeline-line {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
  width: 28px;
}

.timeline-dot {
  width: 28px; height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  color: #fff;
  flex-shrink: 0;
  box-shadow: 0 2px 6px rgba(0,0,0,0.12);
}

.timeline-connector {
  width: 2px;
  flex: 1;
  min-height: 16px;
  background: linear-gradient(180deg, #e4e4e7, #f4f4f5);
}

.timeline-card {
  flex: 1;
  padding: 4px 0 28px;
}

.timeline-date {
  font-size: 11px;
  color: #a1a1aa;
  font-weight: 500;
}

.timeline-title {
  font-size: 14px;
  font-weight: 700;
  color: #27272a;
  margin: 3px 0;
}

.timeline-desc {
  font-size: 12px;
  color: #71717a;
  line-height: 1.5;
}

/* ========== 勋章详情弹窗 ========== */
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0,0,0,0.45);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  padding: 24px;
  animation: fadeIn 0.2s ease;
}

.modal-card {
  position: relative;
  width: 100%;
  max-width: 300px;
  background: #fff;
  border-radius: 24px;
  padding: 32px 24px 24px;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0,0,0,0.2);
  animation: modalPop 0.3s ease;
}

.modal-close {
  position: absolute;
  top: 12px; right: 12px;
  width: 32px; height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #f4f4f5;
  color: #71717a;
  font-size: 14px;
}

.modal-badge {
  margin-bottom: 16px;
}

.modal-hex {
  width: 88px; height: 100px;
  margin: 0 auto;
  position: relative;
  clip-path: polygon(50% 0%, 100% 22%, 100% 78%, 50% 100%, 0% 78%, 0% 22%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
  color: #fff;
  box-shadow: inset 0 0 0 3px rgba(255,255,255,0.3);
}

/* 弹窗六边形高光 */
.modal-hex::after {
  content: '';
  position: absolute;
  top: 8px; left: 18%; right: 18%; height: 28%;
  background: linear-gradient(180deg, rgba(255,255,255,0.4) 0%, transparent 100%);
  border-radius: 50%;
  pointer-events: none;
}

/* 弹窗稀有度背景 */
.modal-card.rarity-common .modal-hex { background: linear-gradient(145deg, #60a5fa, #3b82f6); }
.modal-card.rarity-rare .modal-hex   { background: linear-gradient(145deg, #818cf8, #6366f1); }
.modal-card.rarity-epic .modal-hex   { background: linear-gradient(145deg, #a78bfa, #7c3aed); box-shadow: 0 0 24px rgba(168,85,247,0.4); }
.modal-card.rarity-legendary .modal-hex { background: linear-gradient(145deg, #fbbf24, #f59e0b); box-shadow: 0 0 32px rgba(251,191,36,0.5); }

.modal-rarity-tag {
  display: inline-block;
  margin-top: 10px;
  padding: 3px 12px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  border-radius: 999px;
  background: #f4f4f5;
  color: #71717a;
}

.modal-name {
  font-size: 18px;
  font-weight: 700;
  color: #18181b;
  margin-bottom: 6px;
}

.modal-desc {
  font-size: 13px;
  color: #71717a;
  line-height: 1.5;
  margin-bottom: 14px;
}

.modal-date {
  font-size: 12px;
  color: #a1a1aa;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}

@keyframes modalPop {
  from { opacity: 0; transform: scale(0.9) translateY(10px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}
</style>
