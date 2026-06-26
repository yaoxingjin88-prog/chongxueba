<script setup>
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import Live2DCharacter from '../components/Live2DCharacter.vue'

const router = useRouter()
const user = useUserStore()

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
    path: '/achievement',
    iconBg: 'linear-gradient(145deg, #eff6ff 0%, #c7d2fe 55%, #a5b4fc 100%)',
    iconColor: '#6366f1',
    iconShadow: '0 3px 10px rgba(99, 102, 241, 0.2)',
  },
]

function formatCoins(n) {
  return n.toLocaleString('zh-CN')
}
</script>

<template>
  <div class="home page">
    <!-- 梦幻星空 + 云朵背景 -->
    <div class="dream-bg">
      <div class="sky-gradient" />
      <div class="stars-layer" />
      <div class="cloud cloud-a" />
      <div class="cloud cloud-b" />
      <div class="cloud cloud-c" />
      <div class="sparkle" v-for="i in 8" :key="i" :style="{ '--i': i }" />
    </div>

    <!-- 状态栏 -->
    <div class="status-bar">
      <span class="time">9:41</span>
      <div class="status-icons">
        <span class="signal" />
        <span class="wifi" />
        <span class="battery" />
      </div>
    </div>

    <!-- 顶部用户信息 -->
    <header class="top-header">
      <div class="user-block" @click="router.push('/profile')">
        <div class="avatar">
          <img src="https://api.dicebear.com/7.x/adventurer/png?seed=xiaogun&backgroundColor=c0aede" alt="avatar" />
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
        <div class="coin-pill">
          <font-awesome-icon icon="coins" class="coin-icon" />
          <span>{{ formatCoins(user.coins) }}</span>
          <font-awesome-icon icon="chevron-down" class="chevron-sm" />
        </div>
        <div class="streak-card">
          <span class="streak-label">连续学习</span>
          <span class="streak-days">{{ user.streakDays }}<small>天</small></span>
        </div>
      </div>
    </header>

    <div class="main-stage">
      <!-- Live2D 角色区域 -->
      <section class="hero-section">
        <Live2DCharacter :top-padding="32" :bottom-padding="58" />
        <div class="grass-island">
          <div class="grass-top">
            <span v-for="f in 6" :key="f" class="flower" :style="{ '--f': f }">✿</span>
          </div>
          <div class="island-rock" />
        </div>
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
  background: #4c6ef5;
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

.sky-gradient {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    #2d4a8a 0%,
    #5b7fd4 18%,
    #9b8fd4 42%,
    #d4b8e8 62%,
    #f0c8e0 78%,
    #f8dce8 100%
  );
}

.stars-layer {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 45%;
  background-image:
    radial-gradient(1.5px 1.5px at 8% 15%, rgba(255,255,255,0.9) 0%, transparent 100%),
    radial-gradient(1px 1px at 25% 8%, rgba(255,255,255,0.7) 0%, transparent 100%),
    radial-gradient(1.5px 1.5px at 45% 22%, rgba(255,255,255,0.8) 0%, transparent 100%),
    radial-gradient(1px 1px at 65% 12%, rgba(255,255,255,0.6) 0%, transparent 100%),
    radial-gradient(1.5px 1.5px at 82% 18%, rgba(255,255,255,0.9) 0%, transparent 100%),
    radial-gradient(1px 1px at 92% 8%, rgba(255,255,255,0.5) 0%, transparent 100%),
    radial-gradient(1px 1px at 15% 35%, rgba(255,255,255,0.6) 0%, transparent 100%),
    radial-gradient(1.5px 1.5px at 55% 5%, rgba(255,255,255,0.8) 0%, transparent 100%),
    radial-gradient(1px 1px at 75% 32%, rgba(255,255,255,0.5) 0%, transparent 100%);
}

.cloud {
  position: absolute;
  border-radius: 50px;
  background: rgba(255, 255, 255, 0.35);
  filter: blur(2px);
}

.cloud-a {
  width: 120px; height: 40px;
  bottom: 52%; left: -20px;
  animation: drift 12s ease-in-out infinite;
}

.cloud-b {
  width: 90px; height: 32px;
  bottom: 56%; right: 10px;
  animation: drift 10s ease-in-out infinite reverse;
}

.cloud-c {
  width: 160px; height: 50px;
  bottom: 48%; left: 30%;
  background: rgba(255, 200, 220, 0.4);
  animation: drift 14s ease-in-out infinite;
}

.sparkle {
  position: absolute;
  width: 4px; height: 4px;
  background: #fff;
  border-radius: 50%;
  opacity: 0;
  animation: sparkle 3s ease-in-out infinite;
  animation-delay: calc(var(--i) * 0.4s);
  top: calc(10% + var(--i) * 8%);
  left: calc(12% + var(--i) * 10%);
}

/* ===== 状态栏 ===== */
.status-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 24px 0;
  padding-top: calc(8px + env(safe-area-inset-top, 0px));
  position: relative;
  z-index: 10;
  color: #fff;
  font-size: 15px;
  font-weight: 600;
}

.status-icons {
  display: flex;
  align-items: center;
  gap: 5px;
}

.signal, .wifi, .battery {
  display: inline-block;
  background: #fff;
  border-radius: 2px;
}

.signal { width: 16px; height: 10px; clip-path: polygon(0 100%, 25% 40%, 50% 70%, 75% 20%, 100% 50%, 100% 100%); }
.wifi { width: 14px; height: 10px; border-radius: 50% 50% 0 0; background: transparent; border: 2px solid #fff; border-bottom: none; }
.battery { width: 22px; height: 10px; border: 1.5px solid #fff; border-radius: 3px; position: relative; }
.battery::after { content: ''; position: absolute; right: -4px; top: 2px; width: 2px; height: 5px; background: #fff; border-radius: 0 1px 1px 0; }

/* ===== 顶部 Header ===== */
.top-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 8px 16px 4px;
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
}

.coin-icon {
  color: #f59e0b;
  font-size: 16px;
}

.chevron-sm {
  font-size: 9px;
  color: #9ca3af;
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

/* ===== Live2D 英雄区 ===== */
.hero-section {
  position: relative;
  flex: 1 1 auto;
  min-height: 180px;
  z-index: 5;
  margin-top: 0;
  padding-top: 6px;
}

.grass-island {
  position: absolute;
  bottom: 6px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 4;
  animation: islandFloat 4s ease-in-out infinite;
}

.grass-top {
  width: 165px;
  height: 44px;
  background: linear-gradient(180deg, #7ec850 0%, #5aad38 100%);
  border-radius: 50% 50% 10px 10px;
  position: relative;
  z-index: 2;
  box-shadow: 0 -2px 8px rgba(94, 173, 56, 0.3);
}

.flower {
  position: absolute;
  font-size: 8px;
  color: #fff;
  top: 8px;
  left: calc(var(--f) * 14px + 10px);
  opacity: 0.8;
}

.island-rock {
  width: 132px;
  height: 26px;
  margin: -4px auto 0;
  background: linear-gradient(180deg, #8b7355 0%, #6b5740 100%);
  border-radius: 0 0 50% 50%;
  box-shadow: 0 8px 20px rgba(0,0,0,0.2);
}

.live2d-container,
:deep(.live2d-container) {
  position: absolute;
  inset: 0;
  z-index: 3;
  min-height: 0;
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

@keyframes drift {
  0%, 100% { transform: translateX(0); }
  50% { transform: translateX(20px); }
}

@keyframes sparkle {
  0%, 100% { opacity: 0; transform: scale(0.5); }
  50% { opacity: 1; transform: scale(1); }
}

@keyframes islandFloat {
  0%, 100% { transform: translateX(-50%) translateY(0); }
  50% { transform: translateX(-50%) translateY(-6px); }
}
</style>
