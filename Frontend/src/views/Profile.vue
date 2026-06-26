<script setup>
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import ProgressBar from '../components/ProgressBar.vue'

const router = useRouter()
const user = useUserStore()

const stats = [
  { label: '专注时长', value: user.focusWeek },
  { label: '打卡天数', value: `${user.streakDays}天` },
  { label: '宠物等级', value: `Lv.${user.petLevel}` },
  { label: '获得勋章', value: `${user.medals}枚` },
]

const recentMedals = ['🏅', '🎖️', '⭐', '🏆', '🎯']

const menuItems = [
  { icon: 'chart-bar', label: '学习统计', path: '/growth' },
  { icon: 'paw', label: '宠物养成', path: '/pet' },
  { icon: 'box-open', label: '我的收藏', path: '/mall' },
  { icon: 'gear', label: '设置中心', path: '' },
]
</script>

<template>
  <div class="profile page">
    <div class="stars-bg" />

    <div class="page-content">
      <div class="profile-header">
        <div class="profile-bg" />
        <div class="profile-card">
          <div class="avatar-large">
            <span>🦊</span>
            <div v-if="user.vip" class="vip-badge">
              <font-awesome-icon icon="crown" />
              VIP
            </div>
          </div>
          <h2 class="profile-name">{{ user.name }}</h2>
          <div class="profile-level">
            <span class="level-tag">Lv.{{ user.level }}</span>
            <ProgressBar :value="user.exp" :max="user.expMax" color="var(--gold)" height="6px" />
          </div>
        </div>
      </div>

      <div class="stats-row">
        <div v-for="stat in stats" :key="stat.label" class="stat-item glass-card">
          <span class="stat-value">{{ stat.value }}</span>
          <span class="stat-label">{{ stat.label }}</span>
        </div>
      </div>

      <div class="achievement-preview glass-card">
        <div class="preview-header">
          <span class="section-title">成就墙</span>
          <button class="view-all" @click="router.push('/achievement')">
            查看全部
            <font-awesome-icon icon="chevron-right" />
          </button>
        </div>
        <div class="medal-row">
          <div v-for="(medal, i) in recentMedals" :key="i" class="medal-item">
            {{ medal }}
          </div>
        </div>
      </div>

      <div class="menu-list">
        <button
          v-for="item in menuItems"
          :key="item.label"
          class="menu-item glass-card"
          @click="item.path && router.push(item.path)"
        >
          <font-awesome-icon :icon="item.icon" class="menu-icon" />
          <span>{{ item.label }}</span>
          <font-awesome-icon icon="chevron-right" class="menu-arrow" />
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.profile-header {
  position: relative;
  padding-bottom: 20px;
}

.profile-bg {
  height: 140px;
  background: linear-gradient(135deg, #5b3d99 0%, #8b6fd4 50%, #e879f9 100%);
  border-radius: 0 0 30px 30px;
}

.profile-card {
  position: relative;
  margin: -60px 16px 0;
  padding: 20px;
  text-align: center;
  background: var(--gradient-card);
  backdrop-filter: blur(12px);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
}

.avatar-large {
  width: 80px;
  height: 80px;
  margin: 0 auto 12px;
  background: var(--gradient-btn);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 44px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  position: relative;
}

.vip-badge {
  position: absolute;
  bottom: -4px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 3px;
  padding: 2px 8px;
  background: var(--gradient-gold);
  border-radius: var(--radius-full);
  font-size: 10px;
  font-weight: 700;
  color: #78350f;
  white-space: nowrap;
}

.profile-name {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 8px;
}

.profile-level {
  max-width: 200px;
  margin: 0 auto;
}

.level-tag {
  font-size: 12px;
  color: var(--gold);
  display: block;
  margin-bottom: 6px;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  padding: 0 16px;
  margin-bottom: 16px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 4px;
  gap: 4px;
}

.stat-value {
  font-size: 14px;
  font-weight: 700;
}

.stat-label {
  font-size: 10px;
  color: var(--text-muted);
  text-align: center;
}

.achievement-preview {
  margin: 0 16px 16px;
  padding: 16px;
}

.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.view-all {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--text-muted);
}

.medal-row {
  display: flex;
  gap: 12px;
}

.medal-item {
  width: 48px;
  height: 48px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.menu-list {
  padding: 0 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  font-size: 15px;
  text-align: left;
  width: 100%;
}

.menu-icon {
  width: 36px;
  height: 36px;
  background: rgba(159, 122, 234, 0.2);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--primary-light);
  font-size: 16px;
  padding: 10px;
}

.menu-arrow {
  margin-left: auto;
  color: var(--text-dim);
  font-size: 12px;
}
</style>
