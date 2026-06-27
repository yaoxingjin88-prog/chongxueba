<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../api'
import { avatarUrl } from '../utils/avatar'
import homeFoxIsland from '../assets/home-fox-island.png'

const router = useRouter()

const loading = ref(true)
const toast = ref('')
const activeBoard = ref('focus')
const activePeriod = ref('today')
const tabs = ref([])
const periods = ref([])
const metricLabel = ref('专注时长')
const top3 = ref([])
const list = ref([])
const myRank = ref(null)

const podiumItems = computed(() => {
  if (top3.value.length < 3) return top3.value
  return [top3.value[1], top3.value[0], top3.value[2]]
})

const podiumHeights = ['podium-2', 'podium-1', 'podium-3']
const podiumThemes = ['silver', 'gold', 'bronze']

function showToast(msg) {
  toast.value = msg
  window.setTimeout(() => { toast.value = '' }, 2200)
}

async function loadLeaderboard() {
  loading.value = true
  try {
    const data = await api.getLeaderboard(activeBoard.value, activePeriod.value)
    tabs.value = data.tabs || []
    periods.value = data.periods || []
    metricLabel.value = data.metricLabel || '专注时长'
    top3.value = data.top3 || []
    list.value = data.list || []
    myRank.value = data.myRank || null
  } catch (err) {
    showToast(err.message || '加载失败')
  } finally {
    loading.value = false
  }
}

function switchBoard(key) {
  if (activeBoard.value === key) return
  activeBoard.value = key
}

function switchPeriod(key) {
  if (activePeriod.value === key) return
  activePeriod.value = key
}

function showHelp() {
  showToast('排行榜按所选榜单与时间维度实时更新')
}

function improveRank() {
  router.push('/focus')
}

watch([activeBoard, activePeriod], loadLeaderboard)

onMounted(loadLeaderboard)
</script>

<template>
  <div class="leaderboard page">
    <div class="page-bg" aria-hidden="true">
      <img src="/首页.png" alt="" class="page-bg-img">
      <div class="page-bg-mask" />
    </div>

    <header class="lb-header">
      <button type="button" class="icon-btn" aria-label="返回" @click="router.back()">
        <font-awesome-icon icon="chevron-left" />
      </button>
      <h1 class="lb-title">排行榜</h1>
      <button type="button" class="icon-btn" aria-label="帮助" @click="showHelp">
        <font-awesome-icon icon="question-circle" />
      </button>
    </header>

    <div class="board-tabs" role="tablist" aria-label="榜单类型">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        type="button"
        class="board-tab"
        :class="{ active: activeBoard === tab.key }"
        role="tab"
        :aria-selected="activeBoard === tab.key"
        @click="switchBoard(tab.key)"
      >
        <font-awesome-icon v-if="tab.key === 'focus'" icon="star" class="tab-star" />
        {{ tab.label }}
      </button>
    </div>

    <div class="period-tabs" role="tablist" aria-label="时间范围">
      <button
        v-for="item in periods"
        :key="item.key"
        type="button"
        class="period-tab"
        :class="{ active: activePeriod === item.key }"
        role="tab"
        :aria-selected="activePeriod === item.key"
        @click="switchPeriod(item.key)"
      >
        {{ item.label }}
      </button>
    </div>

    <main class="lb-content">
      <p v-if="loading" class="loading-tip">加载中...</p>

      <template v-else>
        <section class="podium-section" aria-label="前三名">
          <div
            v-for="(item, index) in podiumItems"
            :key="item.rank"
            class="podium-item"
            :class="podiumHeights[index]"
          >
            <div class="podium-user">
              <div class="avatar-ring" :class="podiumThemes[index]">
                <span class="rank-badge">{{ item.rank }}</span>
                <img :src="avatarUrl(item.avatarSeed, item.avatarUrl)" :alt="item.name">
              </div>
              <p class="podium-name">{{ item.name }}</p>
              <span class="podium-level">Lv.{{ item.level }}</span>
            </div>
            <div class="podium-bar" :class="podiumThemes[index]">
              <span class="podium-score">{{ item.scoreLabel }}</span>
            </div>
          </div>
        </section>

        <section v-if="myRank" class="my-rank-card glass-card">
          <h2 class="my-rank-title">
            <span class="spark">✦</span>
            我的排名
            <span class="spark">✦</span>
          </h2>

          <div class="my-rank-body">
            <img :src="avatarUrl(myRank.avatarSeed, myRank.avatarUrl)" alt="" class="my-avatar">
            <div class="my-info">
              <div class="my-name-row">
                <span class="my-name">{{ myRank.name }}</span>
                <span class="my-level">Lv.{{ myRank.level }}</span>
              </div>
              <div class="my-rank-row">
                <strong class="my-rank-num">{{ myRank.rank }}<small>名</small></strong>
                <span v-if="myRank.rankChange > 0" class="rank-change">↑ {{ myRank.rankChange }}</span>
              </div>
              <div class="my-stats">
                <span>{{ metricLabel }} {{ myRank.scoreLabel }}</span>
                <span>连续打卡 {{ myRank.streakDays }}天</span>
              </div>
            </div>
            <button type="button" class="improve-btn" @click="improveRank">
              提升排名
              <font-awesome-icon icon="star" />
            </button>
          </div>

          <img :src="homeFoxIsland" alt="" class="fox-deco" aria-hidden="true">
        </section>

        <section class="rank-list-card glass-card" aria-label="排行榜列表">
          <div class="list-head">
            <span>排名</span>
            <span>用户</span>
            <span>{{ metricLabel }}</span>
            <span>状态</span>
          </div>

          <div v-if="!list.length" class="empty-tip">暂无更多排名</div>

          <article
            v-for="item in list"
            :key="`${item.rank}-${item.name}`"
            class="list-row"
            :class="{ me: item.isMe }"
          >
            <span class="col-rank">{{ item.rank }}</span>
            <div class="col-user">
              <img :src="avatarUrl(item.avatarSeed, item.avatarUrl)" :alt="item.name">
              <div class="user-meta">
                <div class="user-name-row">
                  <span class="user-name">{{ item.name }}</span>
                  <span class="pet-emoji">{{ item.petEmoji }}</span>
                </div>
                <span class="user-level">Lv.{{ item.level }}</span>
              </div>
            </div>
            <span class="col-score">{{ item.scoreLabel }}</span>
            <span class="status-pill" :class="item.status">{{ item.statusLabel }}</span>
          </article>
        </section>
      </template>
    </main>

    <Transition name="fade">
      <div v-if="toast" class="toast">{{ toast }}</div>
    </Transition>
  </div>
</template>

<style scoped>
.leaderboard.page {
  --lb-text: #4a4580;
  --lb-muted: #8e8ebc;
  --lb-purple: #8b5cf6;
  background: #dfe8ff;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.page-bg {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.page-bg-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center top;
}

.page-bg-mask {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    rgba(72, 78, 180, 0.18) 0%,
    rgba(120, 130, 220, 0.08) 28%,
    rgba(255, 255, 255, 0.06) 58%,
    rgba(224, 231, 255, 0.92) 100%
  );
}

.lb-header {
  position: relative;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: calc(10px + env(safe-area-inset-top, 0px)) 16px 8px;
  flex-shrink: 0;
}

.icon-btn {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  color: #fff;
  font-size: 17px;
}

.lb-title {
  color: #fff;
  font-size: 18px;
  font-weight: 700;
}

.board-tabs {
  position: relative;
  z-index: 10;
  display: flex;
  gap: 8px;
  padding: 0 16px 10px;
  flex-shrink: 0;
}

.board-tab {
  flex: 1;
  padding: 10px 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.16);
  color: rgba(255, 255, 255, 0.88);
  font-size: 14px;
  font-weight: 600;
  transition: all 0.18s ease;
}

.board-tab.active {
  background: rgba(255, 255, 255, 0.96);
  color: var(--lb-text);
  box-shadow: 0 8px 24px rgba(72, 78, 180, 0.18);
}

.tab-star {
  margin-right: 4px;
  color: #fbbf24;
  font-size: 12px;
}

.period-tabs {
  position: relative;
  z-index: 10;
  display: flex;
  gap: 6px;
  margin: 0 16px 12px;
  padding: 4px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.18);
  flex-shrink: 0;
}

.period-tab {
  flex: 1;
  padding: 8px 0;
  border-radius: 999px;
  color: rgba(255, 255, 255, 0.86);
  font-size: 13px;
  font-weight: 600;
}

.period-tab.active {
  background: #fff;
  color: var(--lb-text);
  box-shadow: 0 4px 14px rgba(72, 78, 180, 0.12);
}

.lb-content {
  position: relative;
  z-index: 5;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 0 16px calc(var(--tab-height) + var(--safe-bottom) + 20px);
}

.loading-tip,
.empty-tip {
  padding: 40px 0;
  text-align: center;
  color: var(--lb-muted);
  font-size: 14px;
}

.glass-card {
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  border: 1px solid rgba(255, 255, 255, 0.72);
  box-shadow: 0 10px 30px rgba(93, 95, 239, 0.12);
}

.podium-section {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 10px;
  min-height: 220px;
  padding: 8px 0 0;
}

.podium-item {
  display: flex;
  flex: 1;
  max-width: 112px;
  flex-direction: column;
  align-items: center;
}

.podium-user {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 8px;
}

.avatar-ring {
  position: relative;
  width: 72px;
  height: 72px;
  padding: 3px;
  border-radius: 50%;
}

.avatar-ring.gold {
  background: linear-gradient(145deg, #fde68a, #f59e0b);
  box-shadow: 0 0 18px rgba(251, 191, 36, 0.45);
}

.avatar-ring.silver {
  width: 64px;
  height: 64px;
  background: linear-gradient(145deg, #e2e8f0, #94a3b8);
}

.avatar-ring.bronze {
  width: 64px;
  height: 64px;
  background: linear-gradient(145deg, #fdba74, #ea580c);
}

.avatar-ring img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid rgba(255, 255, 255, 0.95);
}

.rank-badge {
  position: absolute;
  top: -4px;
  right: -2px;
  z-index: 2;
  min-width: 22px;
  height: 22px;
  padding: 0 6px;
  border-radius: 999px;
  background: linear-gradient(135deg, #fde68a, #f59e0b);
  color: #fff;
  font-size: 11px;
  font-weight: 800;
  display: grid;
  place-items: center;
  box-shadow: 0 4px 10px rgba(245, 158, 11, 0.35);
}

.podium-item.podium-2 .rank-badge,
.podium-item.podium-3 .rank-badge {
  background: linear-gradient(135deg, #cbd5e1, #64748b);
}

.podium-name {
  margin-top: 8px;
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  text-shadow: 0 1px 8px rgba(35, 35, 90, 0.28);
}

.podium-level {
  margin-top: 2px;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.18);
  color: rgba(255, 255, 255, 0.92);
  font-size: 10px;
  font-weight: 600;
}

.podium-bar {
  width: 100%;
  display: grid;
  place-items: center;
  border-radius: 18px 18px 0 0;
  color: #fff;
  font-size: 12px;
  font-weight: 700;
}

.podium-bar.gold {
  height: 92px;
  background: linear-gradient(180deg, #fcd34d 0%, #f59e0b 100%);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.35);
}

.podium-bar.silver {
  height: 72px;
  background: linear-gradient(180deg, #dbeafe 0%, #60a5fa 100%);
}

.podium-bar.bronze {
  height: 58px;
  background: linear-gradient(180deg, #fdba74 0%, #fb923c 100%);
}

.podium-item.podium-1 {
  transform: translateY(-8px);
}

.my-rank-card {
  position: relative;
  margin-top: 14px;
  padding: 14px 14px 16px;
  border-radius: 22px;
  overflow: hidden;
}

.my-rank-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 12px;
  color: var(--lb-text);
  font-size: 15px;
  font-weight: 700;
}

.spark {
  color: #c4b5fd;
  font-size: 12px;
}

.my-rank-body {
  display: flex;
  align-items: center;
  gap: 10px;
}

.my-avatar {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba(255, 255, 255, 0.95);
  box-shadow: 0 4px 14px rgba(139, 92, 246, 0.18);
  flex-shrink: 0;
}

.my-info {
  flex: 1;
  min-width: 0;
}

.my-name-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.my-name {
  color: var(--lb-text);
  font-size: 15px;
  font-weight: 700;
}

.my-level {
  padding: 2px 7px;
  border-radius: 999px;
  background: linear-gradient(135deg, #a78bfa, #8b5cf6);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
}

.my-rank-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-top: 4px;
}

.my-rank-num {
  color: var(--lb-purple);
  font-size: 24px;
  font-weight: 800;
  line-height: 1;
}

.my-rank-num small {
  font-size: 13px;
  font-weight: 700;
}

.rank-change {
  color: #22c55e;
  font-size: 13px;
  font-weight: 700;
}

.my-stats {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-top: 4px;
  color: var(--lb-muted);
  font-size: 11px;
}

.improve-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 10px 12px;
  border-radius: 999px;
  background: linear-gradient(135deg, #a78bfa, #8b5cf6);
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  box-shadow: 0 6px 18px rgba(139, 92, 246, 0.28);
  flex-shrink: 0;
}

.fox-deco {
  position: absolute;
  right: -8px;
  bottom: -10px;
  width: 88px;
  pointer-events: none;
  opacity: 0.95;
}

.rank-list-card {
  margin-top: 14px;
  padding: 12px 0 6px;
  border-radius: 22px;
}

.list-head,
.list-row {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr) 72px 58px;
  align-items: center;
  gap: 8px;
  padding: 0 14px;
}

.list-head {
  margin-bottom: 8px;
  color: var(--lb-muted);
  font-size: 11px;
  font-weight: 600;
}

.list-row {
  padding-top: 10px;
  padding-bottom: 10px;
  border-top: 1px solid rgba(142, 142, 188, 0.12);
}

.list-row.me {
  background: rgba(167, 139, 250, 0.08);
}

.col-rank {
  color: var(--lb-muted);
  font-size: 14px;
  font-weight: 700;
}

.col-user {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.col-user img {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba(255, 255, 255, 0.95);
  flex-shrink: 0;
}

.user-meta {
  min-width: 0;
}

.user-name-row {
  display: flex;
  align-items: center;
  gap: 4px;
}

.user-name {
  color: var(--lb-text);
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pet-emoji {
  font-size: 12px;
  flex-shrink: 0;
}

.user-level {
  display: inline-block;
  margin-top: 2px;
  padding: 1px 6px;
  border-radius: 999px;
  background: rgba(139, 92, 246, 0.12);
  color: var(--lb-purple);
  font-size: 10px;
  font-weight: 700;
}

.col-score {
  color: var(--lb-text);
  font-size: 12px;
  font-weight: 700;
  text-align: right;
}

.status-pill {
  justify-self: end;
  padding: 4px 8px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 700;
  white-space: nowrap;
}

.status-pill.online {
  background: rgba(34, 197, 94, 0.12);
  color: #16a34a;
}

.status-pill.focusing {
  background: rgba(139, 92, 246, 0.12);
  color: #7c3aed;
}

.status-pill.offline {
  background: rgba(148, 163, 184, 0.16);
  color: #64748b;
}

.toast {
  position: fixed;
  left: 50%;
  bottom: calc(var(--tab-height) + var(--safe-bottom) + 24px);
  transform: translateX(-50%);
  padding: 10px 20px;
  border-radius: 999px;
  background: rgba(74, 69, 128, 0.92);
  color: #fff;
  font-size: 13px;
  z-index: 200;
  white-space: nowrap;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
