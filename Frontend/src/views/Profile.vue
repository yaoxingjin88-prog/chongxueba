<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { api } from '../api'
import { avatarUrl } from '../utils/avatar'

const router = useRouter()
const user = useUserStore()

const avatarSeed = ref(user.avatarSeed || 'moon-night')
const avatarCustomUrl = ref(user.avatarUrl || '')
const previewMedals = ref([
  { theme: 'theme-gold' },
  { theme: 'theme-pink' },
  { theme: 'theme-blue' },
  { theme: 'theme-purple' },
])

const stats = computed(() => [
  { label: '专注时长', value: `${user.focusTotalHours}h` },
  { label: '连续打卡', value: `${user.streakDays}天` },
  { label: '宠物等级', value: `${user.petLevel}级` },
  { label: '获得勋章', value: `${user.medals}枚` },
])

const menuItems = [
  { icon: 'clock', label: '学习统计', path: '/growth' },
  { icon: 'cat', label: '宠物养成', path: '/pet' },
  { icon: 'bookmark', label: '我的收藏', path: '/favorites' },
  { icon: 'gear', label: '设置中心', path: '/settings' },
]

const medalThemes = ['theme-gold', 'theme-pink', 'theme-blue', 'theme-purple']
const logoutConfirmOpen = ref(false)

async function loadProfileMeta() {
  try {
    const data = await api.getProfile()
    avatarSeed.value = data.avatarSeed || avatarSeed.value
    avatarCustomUrl.value = data.avatarUrl || ''
    user.avatarSeed = avatarSeed.value
    user.avatarUrl = avatarCustomUrl.value
  } catch {
    avatarSeed.value = user.avatarSeed
    avatarCustomUrl.value = user.avatarUrl
  }
}

async function loadAchievements() {
  try {
    const data = await api.getAchievements()
    user.medals = data.medals
    user.totalMedals = data.totalMedals
    if (data.recentMedals?.length) {
      previewMedals.value = data.recentMedals.slice(0, 4).map((medal, i) => ({
        theme: medal.theme || medalThemes[i],
      }))
    }
  } catch {
    /* keep default preview medals */
  }
}

function handleMenuItem(item) {
  if (item.path) router.push(item.path)
}

function requestLogout() {
  logoutConfirmOpen.value = true
}

function cancelLogout() {
  logoutConfirmOpen.value = false
}

function confirmLogout() {
  logoutConfirmOpen.value = false
  user.logout()
  sessionStorage.removeItem('chong-xueba-guest')
  router.replace('/login')
}

onMounted(async () => {
  if (!user.loaded) {
    try { await user.fetchUser() } catch { /* guest fallback */ }
  }
  loadProfileMeta()
  loadAchievements()
})
</script>

<template>
  <div class="profile page">
    <div class="page-bg" aria-hidden="true">
      <div class="bg-gradient" />
      <div class="bg-stars" />
      <div class="bg-glow" />
    </div>

    <div class="page-content">
      <section class="hero-user">
        <div class="avatar-wrap">
          <img :src="avatarUrl(avatarSeed, avatarCustomUrl)" alt="avatar" class="avatar-img">
        </div>

        <div class="user-meta">
          <h1 class="user-name">{{ user.name }}</h1>
          <p class="user-level">Lv.{{ user.level }}</p>
        </div>

        <div v-if="user.vip" class="vip-card">
          <font-awesome-icon icon="crown" class="vip-crown" />
          <div class="vip-text">
            <span class="vip-title">VIP会员</span>
            <span class="vip-expire">2024.12.31到期</span>
          </div>
        </div>
      </section>

      <section class="stats-card panel-card">
        <div v-for="stat in stats" :key="stat.label" class="stat-col">
          <span class="stat-label">{{ stat.label }}</span>
          <span class="stat-value">{{ stat.value }}</span>
        </div>
      </section>

      <section class="panel-card achievement-panel">
        <div class="panel-header">
          <h2 class="panel-title">成就墙</h2>
          <button type="button" class="view-all" @click="router.push('/achievement')">
            查看全部
            <font-awesome-icon icon="chevron-right" />
          </button>
        </div>
        <div class="medal-row">
          <div
            v-for="(medal, i) in previewMedals"
            :key="i"
            class="medal-badge"
            :class="medal.theme"
          >
            <div class="badge-scallop" />
            <font-awesome-icon icon="star" class="badge-star" />
            <div class="badge-ribbon" />
          </div>
        </div>
      </section>

      <section class="panel-card menu-panel">
        <button
          v-for="(item, index) in menuItems"
          :key="item.label"
          type="button"
          class="menu-row"
          :class="{ 'no-border': index === menuItems.length - 1 }"
          @click="handleMenuItem(item)"
        >
          <span class="menu-icon-wrap">
            <font-awesome-icon :icon="item.icon" class="menu-icon" />
          </span>
          <span class="menu-label">{{ item.label }}</span>
          <font-awesome-icon icon="chevron-right" class="menu-arrow" />
        </button>
      </section>

      <button type="button" class="logout-btn panel-card" @click="requestLogout">
        <font-awesome-icon icon="right-from-bracket" class="logout-icon" />
        退出登录
      </button>
    </div>

    <Teleport to="body">
      <Transition name="confirm-fade">
        <div
          v-if="logoutConfirmOpen"
          class="logout-confirm-overlay"
          @click.self="cancelLogout"
        >
          <div
            class="logout-confirm-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="logout-confirm-title"
            aria-describedby="logout-confirm-desc"
          >
            <div class="logout-confirm-icon" aria-hidden="true">
              <font-awesome-icon icon="right-from-bracket" />
            </div>
            <h3 id="logout-confirm-title" class="logout-confirm-title">确认退出登录？</h3>
            <p id="logout-confirm-desc" class="logout-confirm-desc">
              退出后需要重新登录，连续打卡记录仍会为你保留。
            </p>
            <div class="logout-confirm-actions">
              <button type="button" class="confirm-btn cancel" @click="cancelLogout">
                再想想
              </button>
              <button type="button" class="confirm-btn danger" @click="confirmLogout">
                退出登录
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.profile.page {
  position: relative;
  background: #ebe8f8;
}

/* ===== 全屏沉浸式背景 ===== */
.page-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.bg-gradient {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    #4c1d95 0%,
    #5b21b6 8%,
    #6d28d9 18%,
    #7c3aed 32%,
    #8b5cf6 48%,
    #a78bfa 62%,
    #c4b5fd 76%,
    #ddd6fe 88%,
    #ebe8f8 100%
  );
}

.bg-glow {
  position: absolute;
  top: -5%;
  right: -15%;
  width: 70%;
  height: 45%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.12) 0%, transparent 65%);
}

.bg-stars {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 42%;
  background-image:
    radial-gradient(1.5px 1.5px at 8% 14%, rgba(255,255,255,0.95) 0%, transparent 100%),
    radial-gradient(1px 1px at 22% 28%, rgba(255,255,255,0.6) 0%, transparent 100%),
    radial-gradient(2px 2px at 38% 10%, rgba(255,255,255,0.85) 0%, transparent 100%),
    radial-gradient(1px 1px at 52% 22%, rgba(255,255,255,0.5) 0%, transparent 100%),
    radial-gradient(1.5px 1.5px at 68% 16%, rgba(255,255,255,0.75) 0%, transparent 100%),
    radial-gradient(1px 1px at 82% 30%, rgba(255,255,255,0.55) 0%, transparent 100%),
    radial-gradient(1px 1px at 92% 12%, rgba(255,255,255,0.7) 0%, transparent 100%),
    radial-gradient(1px 1px at 15% 38%, rgba(255,255,255,0.4) 0%, transparent 100%),
    radial-gradient(1.5px 1.5px at 45% 34%, rgba(255,255,255,0.35) 0%, transparent 100%);
}

/* ===== 滚动内容 ===== */
.page-content {
  position: relative;
  z-index: 1;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: calc(20px + env(safe-area-inset-top, 0px)) 16px calc(var(--tab-height) + var(--safe-bottom) + 16px);
}

/* ===== 用户信息（无独立背景，浮在渐变上） ===== */
.hero-user {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 8px 4px 28px;
}

.avatar-wrap {
  flex-shrink: 0;
  width: 62px;
  height: 62px;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid rgba(255, 255, 255, 0.92);
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.22);
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-meta {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-size: 20px;
  font-weight: 700;
  color: #fff;
  line-height: 1.25;
  margin-bottom: 4px;
  letter-spacing: 0.3px;
  text-shadow: 0 1px 6px rgba(0, 0, 0, 0.12);
}

.user-level {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.85);
}

.vip-card {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 8px 11px;
  background: linear-gradient(135deg, rgba(251, 191, 36, 0.38) 0%, rgba(245, 158, 11, 0.28) 100%);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.35);
  border-radius: 12px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.1);
}

.vip-crown {
  font-size: 18px;
  color: #fbbf24;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2));
}

.vip-text {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.vip-title {
  font-size: 11px;
  font-weight: 700;
  color: #fff;
  white-space: nowrap;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
}

.vip-expire {
  font-size: 9px;
  color: rgba(255, 255, 255, 0.82);
  white-space: nowrap;
}

/* ===== 白色卡片 ===== */
.panel-card {
  background: #fff;
  border-radius: 22px;
  box-shadow: 0 4px 24px rgba(91, 33, 182, 0.07);
}

.stats-card {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  padding: 22px 8px 20px;
  margin-top: -12px;
  margin-bottom: 14px;
  position: relative;
  z-index: 2;
}

.stat-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  text-align: center;
}

.stat-label {
  font-size: 11px;
  color: #a1a1aa;
  line-height: 1.2;
}

.stat-value {
  font-size: 18px;
  font-weight: 800;
  color: #27272a;
  line-height: 1.1;
}

.achievement-panel {
  padding: 18px 18px 22px;
  margin-bottom: 14px;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
}

.panel-title {
  font-size: 16px;
  font-weight: 700;
  color: #7c3aed;
}

.view-all {
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 13px;
  color: #9333ea;
}

.medal-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 6px;
}

.medal-badge {
  position: relative;
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.badge-scallop {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.15);
}

.badge-scallop::before {
  content: '';
  position: absolute;
  inset: -3px;
  border-radius: 50%;
  background: repeating-conic-gradient(
    from 0deg,
    rgba(255,255,255,0.55) 0deg 10deg,
    transparent 10deg 20deg
  );
  mask: radial-gradient(circle, transparent 58%, black 59%);
  -webkit-mask: radial-gradient(circle, transparent 58%, black 59%);
}

.theme-gold .badge-scallop { background: linear-gradient(145deg, #fde047, #f59e0b); }
.theme-pink .badge-scallop { background: linear-gradient(145deg, #f9a8d4, #db2777); }
.theme-blue .badge-scallop { background: linear-gradient(145deg, #93c5fd, #2563eb); }
.theme-purple .badge-scallop { background: linear-gradient(145deg, #c4b5fd, #7c3aed); }

.badge-star {
  position: relative;
  z-index: 1;
  font-size: 22px;
  color: #fff;
  filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.2));
}

.badge-ribbon {
  position: absolute;
  bottom: -1px;
  left: 50%;
  transform: translateX(-50%);
  width: 24px;
  height: 12px;
  z-index: 2;
}

.badge-ribbon::before,
.badge-ribbon::after {
  content: '';
  position: absolute;
  bottom: 0;
  width: 12px;
  height: 12px;
}

.theme-gold .badge-ribbon { background: #ea580c; }
.theme-pink .badge-ribbon { background: #be185d; }
.theme-blue .badge-ribbon { background: #1d4ed8; }
.theme-purple .badge-ribbon { background: #6d28d9; }

.badge-ribbon::before {
  left: 0;
  clip-path: polygon(0 0, 100% 0, 50% 100%);
  filter: brightness(0.92);
}

.badge-ribbon::after {
  right: 0;
  clip-path: polygon(0 0, 100% 0, 50% 100%);
  filter: brightness(0.78);
}

/* ===== 菜单 ===== */
.menu-panel {
  padding: 4px 0;
  margin-bottom: 14px;
}

.menu-row {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 15px 18px;
  text-align: left;
  border-bottom: 1px solid #f4f4f5;
}

.menu-row.no-border {
  border-bottom: none;
}

.menu-icon-wrap {
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
}

.menu-icon {
  font-size: 18px;
  color: #8b5cf6;
}

.menu-label {
  flex: 1;
  font-size: 15px;
  font-weight: 500;
  color: #3f3f46;
}

.menu-arrow {
  font-size: 11px;
  color: #d4d4d8;
}

.logout-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 16px;
  margin-bottom: 12px;
  font-size: 15px;
  font-weight: 500;
  color: #ef4444;
}

.logout-icon {
  font-size: 16px;
}

.logout-confirm-overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(15, 10, 35, 0.52);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

.logout-confirm-dialog {
  width: min(100%, 320px);
  padding: 24px 20px 20px;
  border-radius: 20px;
  background: #fff;
  box-shadow: 0 18px 48px rgba(76, 29, 149, 0.22);
  text-align: center;
}

.logout-confirm-icon {
  width: 52px;
  height: 52px;
  margin: 0 auto 14px;
  border-radius: 50%;
  background: #fef2f2;
  color: #ef4444;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.logout-confirm-title {
  font-size: 18px;
  font-weight: 700;
  color: #27272a;
}

.logout-confirm-desc {
  margin-top: 8px;
  font-size: 13px;
  line-height: 1.6;
  color: #71717a;
}

.logout-confirm-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.confirm-btn {
  flex: 1;
  min-height: 44px;
  border-radius: 999px;
  font-size: 15px;
  font-weight: 600;
}

.confirm-btn.cancel {
  background: #f4f4f5;
  color: #52525b;
}

.confirm-btn.danger {
  background: linear-gradient(135deg, #ef4444 0%, #f87171 100%);
  color: #fff;
  box-shadow: 0 6px 18px rgba(239, 68, 68, 0.28);
}

.confirm-fade-enter-active,
.confirm-fade-leave-active {
  transition: opacity 0.2s ease;
}

.confirm-fade-enter-active .logout-confirm-dialog,
.confirm-fade-leave-active .logout-confirm-dialog {
  transition: transform 0.22s ease, opacity 0.22s ease;
}

.confirm-fade-enter-from,
.confirm-fade-leave-to {
  opacity: 0;
}

.confirm-fade-enter-from .logout-confirm-dialog,
.confirm-fade-leave-to .logout-confirm-dialog {
  transform: scale(0.94) translateY(8px);
  opacity: 0;
}
</style>
