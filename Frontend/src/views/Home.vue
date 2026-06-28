<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { api } from '../api'
import { avatarUrl } from '../utils/avatar'
import { speakPet, stopPetSpeech } from '../utils/petSpeech'
import { resolveEquippedDressUpItems } from '../utils/petDressUpVisuals.js'
import homeFoxIsland from '../assets/home-fox-island.png'
import homeSkyBackground from '../assets/home-sky-background.png'

const router = useRouter()
const user = useUserStore()
const foxGreeting = ref('')
const equippedDressUp = ref([])
const coinPanelOpen = ref(false)
const walletLoading = ref(false)
const walletTxs = ref([])
let greetingTimer
let welcomeTimer

const coinShortcuts = [
  { icon: 'clipboard-list', label: '任务中心', path: '/tasks', color: '#f97316' },
  { icon: 'calendar-check', label: '每日打卡', path: '/checkin', color: '#34d399' },
  { icon: 'shirt', label: '商城', path: '/mall', color: '#ca8a04' },
]

const clickGreetings = [
  '今天也一起加油吧！',
  '专注一下，能量满满！',
  '摸摸头，学习不发愁～',
]

function buildWelcomeGreetings() {
  const name = user.name || '同学'
  const pet = user.petName || '小橙'
  return [
    `欢迎回来，${name}！`,
    `${name}，今天也一起加油吧！`,
    `欢迎回来～${pet}等你很久啦！`,
    `欢迎回来，一起开启专注时光吧！`,
  ]
}

function showFoxGreeting(text, duration = 3200) {
  foxGreeting.value = text
  speakPet(text, { voice: 'duoduo' })
  window.clearTimeout(greetingTimer)
  greetingTimer = window.setTimeout(() => {
    foxGreeting.value = ''
  }, duration)
}

function petFox() {
  showFoxGreeting(clickGreetings[Math.floor(Math.random() * clickGreetings.length)], 2200)
}

function maybeWelcomeHome() {
  if (sessionStorage.getItem('chong-xueba-welcome-home') !== '1') return
  sessionStorage.removeItem('chong-xueba-welcome-home')

  const greetings = buildWelcomeGreetings()
  showFoxGreeting(greetings[Math.floor(Math.random() * greetings.length)], 3500)
}

const stats = [
  {
    label: '心情值',
    value: user.mood,
    icon: 'heart',
    percentColor: '#9333ea',
    track: '#f3ecff',
    fill: 'linear-gradient(90deg, #c084fc 0%, #9333ea 100%)',
  },
  {
    label: '饱腹值',
    value: user.fullness,
    icon: 'drumstick-bite',
    percentColor: '#ff8a00',
    track: '#fff3e0',
    fill: 'linear-gradient(90deg, #ffc46b 0%, #ff922b 55%, #ff8a00 100%)',
  },
  {
    label: '专注值',
    value: user.focus,
    icon: 'leaf',
    percentColor: '#0d9488',
    track: '#e6faf5',
    fill: 'linear-gradient(90deg, #5eead4 0%, #2dd4bf 50%, #14b8a6 100%)',
  },
]

const features = [
  {
    icon: 'clipboard-list',
    label: '任务中心',
    path: '/tasks',
    iconBg: 'linear-gradient(145deg, #fff5eb 0%, #ffe4cc 100%)',
    iconColor: '#f97316',
    iconShadow: '0 3px 10px rgba(249, 115, 22, 0.2)',
  },
  {
    icon: 'chart-line',
    label: '成长报告',
    path: '/growth',
    iconBg: 'linear-gradient(145deg, #f5f0ff 0%, #e9d5ff 100%)',
    iconColor: '#9333ea',
    iconShadow: '0 3px 10px rgba(147, 51, 234, 0.18)',
  },
  {
    icon: 'shirt',
    label: '商城',
    path: '/mall',
    iconBg: 'linear-gradient(145deg, #fffbeb 0%, #fef08a 55%, #fde047 100%)',
    iconColor: '#ca8a04',
    iconShadow: '0 3px 10px rgba(234, 179, 8, 0.22)',
  },
  {
    icon: 'trophy',
    label: '排行榜',
    path: '/leaderboard',
    iconBg: 'linear-gradient(145deg, #eff6ff 0%, #c7d2fe 55%, #a5b4fc 100%)',
    iconColor: '#6366f1',
    iconShadow: '0 3px 10px rgba(99, 102, 241, 0.2)',
  },
]

function formatCoins(n) {
  return n.toLocaleString('zh-CN')
}

async function loadWallet() {
  walletLoading.value = true
  try {
    const data = await api.getWallet()
    user.coins = data.coins
    user.gems = data.gems
    walletTxs.value = data.transactions || []
  } catch {
    walletTxs.value = []
  } finally {
    walletLoading.value = false
  }
}

function toggleCoinPanel() {
  coinPanelOpen.value = !coinPanelOpen.value
  if (coinPanelOpen.value) loadWallet()
}

function closeCoinPanel() {
  coinPanelOpen.value = false
}

function goCoinShortcut(path) {
  closeCoinPanel()
  router.push(path)
}

function onDocumentClick() {
  closeCoinPanel()
}

async function loadEquippedDressUp() {
  try {
    const items = await api.getDressUpItems()
    equippedDressUp.value = resolveEquippedDressUpItems(items)
  } catch {
    equippedDressUp.value = []
  }
}

onMounted(async () => {
  if (!user.loaded) {
    try { await user.fetchUser() } catch { /* guest fallback */ }
  }
  loadEquippedDressUp()
  welcomeTimer = window.setTimeout(maybeWelcomeHome, 700)
  document.addEventListener('click', onDocumentClick)
})

onBeforeUnmount(() => {
  stopPetSpeech()
  window.clearTimeout(greetingTimer)
  window.clearTimeout(welcomeTimer)
  document.removeEventListener('click', onDocumentClick)
})
</script>

<template>
  <div class="home page">
    <!-- 首页背景图 -->
    <div class="dream-bg">
      <img :src="homeSkyBackground" alt="" class="dream-bg-img">
    </div>

    <!-- 顶部用户信息 -->
    <header class="top-header">
      <div class="user-block" @click="router.push('/profile')">
        <div class="avatar">
          <img :src="avatarUrl(user.avatarSeed, user.avatarUrl)" alt="avatar" />
        </div>
        <div class="user-detail">
          <div class="name-row">
            <span class="username">{{ user.name }}</span>
            <font-awesome-icon icon="chevron-down" class="chevron" />
          </div>
          <div class="level-row">
            <span class="level-text">Lv.{{ user.level }}</span>
            <div class="exp-bar">
              <div class="exp-fill" :style="{ width: `${user.expPercent}%` }" />
            </div>
          </div>
        </div>
      </div>

      <div class="right-block">
        <div class="coin-wrap">
          <button
            type="button"
            class="coin-pill"
            :class="{ open: coinPanelOpen }"
            @click.stop="toggleCoinPanel"
          >
            <font-awesome-icon icon="coins" class="coin-icon" />
            <span>{{ formatCoins(user.coins) }}</span>
            <font-awesome-icon icon="chevron-down" class="chevron-sm" />
          </button>

          <Transition name="coin-drop">
            <div v-if="coinPanelOpen" class="coin-panel" @click.stop>
              <div class="coin-panel-head">
                <span class="coin-panel-title">学豆钱包</span>
              </div>
              <div class="coin-panel-balance">
                <div class="balance-item">
                  <font-awesome-icon icon="coins" class="balance-icon coins" />
                  <div class="balance-meta">
                    <span class="balance-label">学豆</span>
                    <strong>{{ formatCoins(user.coins) }}</strong>
                  </div>
                </div>
                <div class="balance-divider" />
                <div class="balance-item">
                  <font-awesome-icon icon="gem" class="balance-icon gems" />
                  <div class="balance-meta">
                    <span class="balance-label">钻石</span>
                    <strong>{{ formatCoins(user.gems) }}</strong>
                  </div>
                </div>
              </div>

              <div class="coin-panel-section">
                <span class="section-label">最近明细</span>
                <div v-if="walletLoading" class="coin-panel-empty">加载中...</div>
                <div v-else-if="!walletTxs.length" class="coin-panel-empty">
                  暂无明细，完成任务赚取学豆吧
                </div>
                <ul v-else class="tx-list">
                  <li v-for="(tx, i) in walletTxs" :key="i" class="tx-row">
                    <span class="tx-amount" :class="tx.amount >= 0 ? 'plus' : 'minus'">
                      {{ tx.amount >= 0 ? '+' : '' }}{{ tx.amount }}
                    </span>
                    <span class="tx-label">{{ tx.label }}</span>
                    <span class="tx-time">{{ tx.time }}</span>
                  </li>
                </ul>
              </div>

              <div class="coin-shortcuts">
                <button
                  v-for="item in coinShortcuts"
                  :key="item.path"
                  type="button"
                  class="shortcut-btn"
                  @click="goCoinShortcut(item.path)"
                >
                  <span class="shortcut-icon" :style="{ color: item.color }">
                    <font-awesome-icon :icon="item.icon" />
                  </span>
                  <span>{{ item.label }}</span>
                </button>
              </div>
            </div>
          </Transition>
        </div>
        <div class="streak-card">
          <span class="streak-label">连续学习</span>
          <span class="streak-days">{{ user.streakDays }}<small>天</small></span>
        </div>
      </div>
    </header>

    <div class="main-stage">
      <!-- 3D 狐狸角色区域 -->
      <section class="hero-section">
        <button class="fox-scene" type="button" aria-label="摸摸小橙" @click="petFox">
          <Transition name="greeting">
            <span v-if="foxGreeting" class="fox-greeting">{{ foxGreeting }}</span>
          </Transition>
          <span class="fox-glow" aria-hidden="true" />
          <div class="fox-wrap">
            <img :src="homeFoxIsland" alt="坐在浮岛上的小狐狸" class="fox-model">
            <template v-for="item in equippedDressUp" :key="item.id">
              <img
                v-if="item.asset"
                :src="item.asset"
                :alt="item.name"
                class="fox-accessory"
                :class="[`accessory-${item.slot}`, `accessory-id-${item.id}`]"
              >
              <span
                v-else
                class="fox-accessory fox-accessory-fallback"
                :class="`accessory-${item.slot}`"
              >
                {{ item.image }}
              </span>
            </template>
          </div>
          <span class="fox-shadow" aria-hidden="true" />
        </button>
      </section>

      <!-- 操作面板：状态值 + 专注按钮 + 快捷入口 -->
      <section class="action-panel">
      <div class="stats-row">
        <div v-for="stat in stats" :key="stat.label" class="stat-card">
          <span class="stat-label">{{ stat.label }}</span>
          <div class="stat-bar-row">
            <div class="stat-track" :style="{ background: stat.track }">
              <div
                class="stat-fill"
                :style="{ width: `${stat.value}%`, background: stat.fill }"
              >
                <span class="stat-fill-icon">
                  <font-awesome-icon :icon="stat.icon" />
                </span>
              </div>
            </div>
            <span class="stat-percent" :style="{ color: stat.percentColor }">
              {{ stat.value }}%
            </span>
          </div>
        </div>
      </div>

      <button class="focus-btn" @click="router.push('/focus')">
        开始专注
      </button>

      <div class="feature-grid">
        <button
          v-for="item in features"
          :key="item.label"
          class="feature-card"
          @click="router.push(item.path)"
        >
          <div
            class="feature-icon"
            :style="{
              background: item.iconBg,
              color: item.iconColor,
              boxShadow: item.iconShadow,
            }"
          >
            <font-awesome-icon :icon="item.icon" />
          </div>
          <span class="feature-label">{{ item.label }}</span>
        </button>
      </div>
    </section>
    </div>
  </div>
</template>

<style scoped>
.home {
  background: #c8b8e8;
  overflow: hidden;
  height: 100vh;
  height: 100dvh;
  display: flex;
  flex-direction: column;
  padding-bottom: calc(var(--tab-height) + var(--safe-bottom));
}

/* ===== 背景 ===== */
.dream-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.dream-bg-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center top;
}

/* ===== 顶部 Header ===== */
.top-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: calc(12px + env(safe-area-inset-top, 0px)) 16px 4px;
  position: relative;
  z-index: 10;
  flex-shrink: 0;
}

.user-block {
  display: flex;
  align-items: center;
  gap: 10px;
}

.avatar {
  width: 46px;
  height: 46px;
  border-radius: 50%;
  overflow: hidden;
  border: 2.5px solid rgba(255, 255, 255, 0.7);
  flex-shrink: 0;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-detail {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.name-row {
  display: flex;
  align-items: center;
  gap: 4px;
}

.username {
  font-size: 16px;
  font-weight: 700;
  color: #fff;
  text-shadow: 0 1px 4px rgba(0,0,0,0.15);
}

.chevron {
  font-size: 10px;
  color: rgba(255,255,255,0.7);
}

.level-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.level-text {
  font-size: 12px;
  font-weight: 600;
  color: rgba(255,255,255,0.9);
  white-space: nowrap;
}

.exp-bar {
  width: 72px;
  height: 5px;
  background: rgba(255,255,255,0.25);
  border-radius: 3px;
  overflow: hidden;
}

.exp-fill {
  height: 100%;
  background: linear-gradient(90deg, #c084fc, #e879f9);
  border-radius: 3px;
}

.right-block {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  position: relative;
  z-index: 30;
}

.coin-wrap {
  position: relative;
}

.coin-pill {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.88);
  border-radius: 20px;
  font-size: 14px;
  font-weight: 700;
  color: #1f2937;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
  cursor: pointer;
  transition: box-shadow 0.2s, background 0.2s;
}

.coin-pill.open {
  background: #fff;
  box-shadow: 0 4px 18px rgba(91, 33, 182, 0.15);
}

.coin-icon {
  color: #f59e0b;
  font-size: 16px;
}

.chevron-sm {
  font-size: 9px;
  color: #9ca3af;
  transition: transform 0.2s;
}

.coin-pill.open .chevron-sm {
  transform: rotate(180deg);
}

.coin-panel {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 260px;
  padding: 14px;
  background: rgba(255, 255, 255, 0.97);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: 18px;
  box-shadow: 0 12px 40px rgba(76, 29, 149, 0.18);
}

.coin-panel-head {
  margin-bottom: 12px;
}

.coin-panel-title {
  font-size: 14px;
  font-weight: 700;
  color: #5b21b6;
}

.coin-panel-balance {
  display: flex;
  align-items: center;
  padding: 12px;
  background: linear-gradient(135deg, #faf5ff 0%, #fef3c7 100%);
  border-radius: 14px;
  margin-bottom: 14px;
}

.balance-item {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
}

.balance-divider {
  width: 1px;
  height: 32px;
  background: rgba(91, 33, 182, 0.12);
  margin: 0 8px;
}

.balance-icon {
  font-size: 18px;
}

.balance-icon.coins { color: #f59e0b; }
.balance-icon.gems { color: #a78bfa; }

.balance-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.balance-label {
  font-size: 10px;
  color: #71717a;
}

.balance-meta strong {
  font-size: 16px;
  font-weight: 800;
  color: #27272a;
  line-height: 1.1;
}

.coin-panel-section {
  margin-bottom: 12px;
}

.section-label {
  display: block;
  font-size: 11px;
  font-weight: 600;
  color: #a1a1aa;
  margin-bottom: 8px;
}

.coin-panel-empty {
  font-size: 12px;
  color: #a1a1aa;
  text-align: center;
  padding: 16px 8px;
  line-height: 1.5;
}

.tx-list {
  list-style: none;
  max-height: 168px;
  overflow-y: auto;
}

.tx-row {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  border-bottom: 1px solid #f4f4f5;
  font-size: 12px;
}

.tx-row:last-child {
  border-bottom: none;
}

.tx-amount {
  font-weight: 800;
  min-width: 42px;
}

.tx-amount.plus { color: #16a34a; }
.tx-amount.minus { color: #ef4444; }

.tx-label {
  color: #3f3f46;
  font-weight: 500;
}

.tx-time {
  color: #a1a1aa;
  font-size: 10px;
  white-space: nowrap;
}

.coin-shortcuts {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  padding-top: 4px;
  border-top: 1px solid #f4f4f5;
}

.shortcut-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 4px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 600;
  color: #52525b;
  transition: background 0.15s;
}

.shortcut-btn:active {
  background: #f4f4f5;
}

.shortcut-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fafafa;
  border-radius: 10px;
  font-size: 14px;
}

.coin-drop-enter-active,
.coin-drop-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.coin-drop-enter-from,
.coin-drop-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

.streak-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 6px 14px;
  background: rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.45);
  border-radius: 14px;
  min-width: 72px;
}

.streak-label {
  font-size: 10px;
  color: rgba(255,255,255,0.85);
}

.streak-days {
  font-size: 22px;
  font-weight: 800;
  color: #fff;
  line-height: 1.1;
}

.streak-days small {
  font-size: 12px;
  font-weight: 600;
}

/* ===== 主内容区 ===== */
.main-stage {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

/* ===== 3D 狐狸英雄区 ===== */
.hero-section {
  position: relative;
  flex: 1 1 auto;
  min-height: 210px;
  z-index: 5;
  margin-top: 0;
  padding-top: 2px;
  overflow: visible;
}

.fox-scene {
  position: absolute;
  inset: -8px 10px -14px;
  z-index: 4;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  width: calc(100% - 20px);
  cursor: pointer;
  isolation: isolate;
}

.fox-wrap {
  position: relative;
  z-index: 3;
  width: min(76vw, 292px);
  max-width: 100%;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  transform-origin: 50% 72%;
  animation: fox-breathe 4.8s ease-in-out infinite;
  transition: transform .24s cubic-bezier(.2, .8, .2, 1);
}

.fox-model {
  position: relative;
  z-index: 2;
  display: block;
  width: 100%;
  max-height: 100%;
  object-fit: contain;
  object-position: center bottom;
  filter:
    drop-shadow(0 14px 16px rgba(49, 51, 112, .22))
    drop-shadow(0 3px 4px rgba(255, 255, 255, .24));
  transition: filter .24s ease;
}

.fox-scene:active .fox-wrap {
  transform: scale(.975) translateY(2px);
}

.fox-scene:active .fox-model {
  filter: drop-shadow(0 9px 10px rgba(49, 51, 112, .18));
}

.fox-accessory {
  position: absolute;
  pointer-events: none;
  display: block;
  height: auto;
  object-fit: contain;
  filter: drop-shadow(0 4px 8px rgba(30, 16, 70, 0.28));
}

.fox-accessory-fallback {
  font-size: 28px;
  line-height: 1;
}

.accessory-back { z-index: 1; }

.accessory-head,
.accessory-face,
.accessory-neck,
.accessory-body,
.accessory-prop,
.accessory-effect {
  z-index: 4;
}

.accessory-id-1 {
  top: 21%;
  left: 1%;
  width: 98%;
}

.accessory-id-2 {
  top: -3%;
  left: 21%;
  width: 58%;
  transform: rotate(-2deg);
}

.accessory-id-3 {
  top: 18%;
  left: 27%;
  width: 46%;
}

.accessory-id-4 {
  top: 1%;
  left: 21%;
  width: 58%;
}

.fox-accessory-fallback.accessory-body,
.fox-accessory-fallback.accessory-neck {
  top: 39%;
  left: 50%;
  z-index: 4;
  transform: translateX(-50%);
}

.fox-accessory-fallback.accessory-prop,
.fox-accessory-fallback.accessory-effect {
  right: 2%;
  bottom: 28%;
  z-index: 4;
}

.fox-glow {
  position: absolute;
  z-index: 1;
  left: 50%;
  bottom: 8%;
  width: 72%;
  aspect-ratio: 1.6;
  border-radius: 50%;
  background: radial-gradient(ellipse, rgba(255, 244, 170, .34), rgba(181, 160, 255, .16) 48%, transparent 72%);
  transform: translateX(-50%);
  filter: blur(10px);
  animation: fox-glow 4.8s ease-in-out infinite;
}

.fox-shadow {
  position: absolute;
  z-index: 2;
  left: 50%;
  bottom: 1%;
  width: 45%;
  height: 8%;
  border-radius: 50%;
  background: rgba(54, 50, 91, .22);
  transform: translateX(-50%);
  filter: blur(8px);
}

.fox-greeting {
  position: absolute;
  z-index: 6;
  top: 6px;
  left: 50%;
  width: max-content;
  max-width: 78%;
  padding: 8px 13px;
  border: 1px solid rgba(255,255,255,.78);
  border-radius: 16px 16px 16px 5px;
  color: #6655ae;
  background: rgba(255,255,255,.9);
  box-shadow: 0 8px 22px rgba(58, 55, 128, .15);
  backdrop-filter: blur(10px);
  transform: translateX(-50%);
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}

.greeting-enter-active,
.greeting-leave-active {
  transition: opacity .2s ease, transform .25s cubic-bezier(.2, .8, .2, 1);
}

.greeting-enter-from,
.greeting-leave-to {
  opacity: 0;
  transform: translate(-50%, 7px) scale(.94);
}

/* ===== 操作面板（状态 + 按钮 + 快捷入口） ===== */
.action-panel {
  position: relative;
  z-index: 10;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: 12px 16px 8px;
  margin-top: 0;
}

.stats-row {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
  margin-bottom: 18px;
}

.stat-card {
  flex: 1;
  min-width: 0;
  min-height: 82px;
  background: rgba(255, 255, 255, 0.96);
  border-radius: 20px;
  padding: 14px 11px 16px;
  box-shadow:
    0 4px 16px rgba(0, 0, 0, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 12px;
}

.stat-label {
  font-size: 13px;
  color: #64748b;
  font-weight: 500;
  line-height: 1;
}

.stat-bar-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.stat-track {
  flex: 1;
  min-width: 0;
  height: 12px;
  border-radius: 999px;
  overflow: hidden;
  position: relative;
}

.stat-fill {
  height: 100%;
  min-width: 11px;
  border-radius: 999px;
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  box-shadow: inset 0 -1px 2px rgba(255, 255, 255, 0.25);
  position: relative;
}

.stat-fill-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  margin-right: 1px;
  font-size: 7px;
  color: rgba(255, 255, 255, 0.92);
  filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.12));
  flex-shrink: 0;
}

.stat-percent {
  font-size: 14px;
  font-weight: 700;
  line-height: 1;
  flex-shrink: 0;
  min-width: 34px;
  text-align: right;
}

.focus-btn {
  width: 100%;
  padding: 15px;
  border-radius: 28px;
  background: linear-gradient(90deg, #9333ea 0%, #c084fc 50%, #a855f7 100%);
  color: #fff;
  font-size: 17px;
  font-weight: 700;
  letter-spacing: 2px;
  box-shadow: 0 6px 24px rgba(147, 51, 234, 0.4);
  flex-shrink: 0;
  margin-bottom: 14px;
  transition: transform 0.15s;
}

.focus-btn:active {
  transform: scale(0.98);
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  flex-shrink: 0;
}

.feature-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.96);
  border-radius: 18px;
  padding: 12px 6px 11px;
  min-height: 82px;
  box-shadow:
    0 4px 16px rgba(0, 0, 0, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  transition: transform 0.15s, box-shadow 0.15s;
}

.feature-card:active {
  transform: scale(0.96);
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

.feature-icon {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  position: relative;
  flex-shrink: 0;
}

.feature-icon::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.45) 0%, transparent 50%);
  pointer-events: none;
}

.feature-icon svg {
  position: relative;
  z-index: 1;
  filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.08));
}

.feature-label {
  font-size: 11px;
  color: #475569;
  font-weight: 500;
  line-height: 1.2;
  text-align: center;
  white-space: nowrap;
}

@keyframes fox-breathe {
  0%, 100% { transform: translateY(0) scale(1); }
  48% { transform: translateY(-5px) scale(1.008); }
}

@keyframes fox-glow {
  0%, 100% { opacity: .68; transform: translateX(-50%) scale(.96); }
  50% { opacity: 1; transform: translateX(-50%) scale(1.04); }
}

@media (max-height: 760px) {
  .hero-section {
    min-height: 166px;
  }

  .fox-wrap {
    width: min(62vw, 232px);
  }

  .action-panel {
    padding-top: 7px;
  }

  .stats-row {
    margin-bottom: 10px;
  }

  .stat-card {
    min-height: 70px;
    padding-block: 10px 12px;
    gap: 8px;
  }

  .focus-btn {
    margin-bottom: 9px;
    padding-block: 12px;
  }

  .feature-card {
    min-height: 68px;
    padding-block: 8px;
    gap: 5px;
  }

  .feature-icon {
    width: 36px;
    height: 36px;
    font-size: 17px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .fox-wrap,
  .fox-glow {
    animation: none;
  }
}
</style>
