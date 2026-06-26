<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { api } from '../api'

const router = useRouter()
const user = useUserStore()

const tabs = ['勋章墙', '宠物图鉴', '成长回忆录']
const activeTab = ref(0)
const recentMedals = ref([])
const allMedals = ref([])

async function loadAchievements() {
  const data = await api.getAchievements()
  user.medals = data.medals
  user.totalMedals = data.totalMedals
  recentMedals.value = data.recentMedals
  allMedals.value = data.allMedals
}

onMounted(loadAchievements)
</script>

<template>
  <div class="achievement page">
    <div class="hero-bg">
      <div class="hero-gradient" />
      <div class="sparkles" />
    </div>

    <header class="ach-header">
      <button class="back-btn" @click="router.back()">
        <font-awesome-icon icon="chevron-left" />
      </button>
      <h1 class="ach-title">成就系统</h1>
      <div class="header-spacer" />
    </header>

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

    <div class="content-card">
      <template v-if="activeTab === 0">
        <p class="progress-text">
          已获得勋章 <strong>{{ user.medals }}/{{ user.totalMedals }}</strong>
        </p>

        <section class="block">
          <h3 class="block-title">最近获得</h3>
          <div class="recent-grid">
            <div
              v-for="medal in recentMedals"
              :key="medal.name"
              class="recent-item"
            >
              <div class="recent-badge" :class="medal.theme">
                <div class="badge-scallop" />
                <font-awesome-icon icon="star" class="badge-star" />
                <div class="badge-ribbon" />
              </div>
              <span class="item-name">{{ medal.name }}</span>
              <span class="item-date">{{ medal.date }}</span>
            </div>
          </div>
        </section>

        <section class="block">
          <h3 class="block-title">勋章墙</h3>
          <div class="wall-grid">
            <div
              v-for="medal in allMedals"
              :key="medal.name"
              class="wall-item"
              :class="{ locked: !medal.earned }"
            >
              <div class="shield-badge" :class="medal.theme">
                <font-awesome-icon v-if="medal.earned" icon="star" class="shield-star" />
                <font-awesome-icon v-else icon="lock" class="shield-lock" />
                <div class="shield-ribbon" />
              </div>
              <span class="item-name">{{ medal.name }}</span>
              <span class="item-desc">{{ medal.desc }}</span>
            </div>
          </div>
        </section>
      </template>

      <div v-else class="placeholder">
        <font-awesome-icon :icon="activeTab === 1 ? 'paw' : 'book'" class="placeholder-icon" />
        <p>{{ tabs[activeTab] }}功能开发中</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.achievement.page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
  background: #c4b5fd;
}

/* ===== 顶部背景 ===== */
.hero-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 220px;
  pointer-events: none;
}

.hero-gradient {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, #b794f6 0%, #a78bfa 45%, #c4b5fd 100%);
}

.sparkles {
  position: absolute;
  inset: 0;
  background-image:
    radial-gradient(2px 2px at 15% 20%, rgba(255,255,255,0.9) 0%, transparent 100%),
    radial-gradient(1.5px 1.5px at 35% 12%, rgba(255,255,255,0.7) 0%, transparent 100%),
    radial-gradient(2px 2px at 60% 25%, rgba(255,255,255,0.85) 0%, transparent 100%),
    radial-gradient(1px 1px at 80% 15%, rgba(255,255,255,0.6) 0%, transparent 100%),
    radial-gradient(1.5px 1.5px at 25% 40%, rgba(255,255,255,0.5) 0%, transparent 100%),
    radial-gradient(1px 1px at 70% 35%, rgba(255,255,255,0.55) 0%, transparent 100%);
}

/* ===== 顶栏 ===== */
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
  width: 36px;
  height: 36px;
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

.header-spacer {
  width: 36px;
}

/* ===== 分段 Tab ===== */
.ach-tabs {
  display: flex;
  gap: 6px;
  padding: 0 16px 16px;
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
  color: rgba(255, 255, 255, 0.85);
  background: rgba(255, 255, 255, 0.18);
  transition: all 0.2s;
  white-space: nowrap;
  text-align: center;
}

.ach-tab-chip.active {
  background: #fff;
  color: #5b21b6;
  font-weight: 700;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
}

/* ===== 白色内容卡片 ===== */
.content-card {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  background: #fff;
  border-radius: 28px 28px 0 0;
  padding: 22px 18px;
  padding-bottom: calc(24px + env(safe-area-inset-bottom, 0px));
  position: relative;
  z-index: 5;
}

.progress-text {
  font-size: 13px;
  color: #a1a1aa;
  margin-bottom: 22px;
}

.progress-text strong {
  color: #71717a;
  font-weight: 600;
}

.block {
  margin-bottom: 26px;
}

.block-title {
  font-size: 15px;
  font-weight: 700;
  color: #27272a;
  margin-bottom: 16px;
}

/* ===== 最近获得 ===== */
.recent-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  width: 100%;
}

.recent-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.recent-badge {
  position: relative;
  width: 76px;
  height: 76px;
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
    rgba(255,255,255,0.5) 0deg 12deg,
    transparent 12deg 24deg
  );
  mask: radial-gradient(circle, transparent 62%, black 63%);
  -webkit-mask: radial-gradient(circle, transparent 62%, black 63%);
}

.theme-orange .badge-scallop { background: linear-gradient(145deg, #fb923c, #ef4444); }
.theme-pink .badge-scallop { background: linear-gradient(145deg, #f472b6, #c026d3); }
.theme-blue .badge-scallop { background: linear-gradient(145deg, #60a5fa, #eab308); }

.badge-star {
  position: relative;
  z-index: 1;
  font-size: 26px;
  color: #fff;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2));
}

.badge-ribbon {
  position: absolute;
  bottom: -2px;
  left: 50%;
  transform: translateX(-50%);
  width: 28px;
  height: 14px;
  z-index: 2;
}

.badge-ribbon::before,
.badge-ribbon::after {
  content: '';
  position: absolute;
  bottom: 0;
  width: 14px;
  height: 14px;
  background: inherit;
}

.theme-orange .badge-ribbon { background: #dc2626; }
.theme-pink .badge-ribbon { background: #a21caf; }
.theme-blue .badge-ribbon { background: #2563eb; }

.badge-ribbon::before {
  left: 0;
  clip-path: polygon(0 0, 100% 0, 50% 100%);
  filter: brightness(0.85);
}

.badge-ribbon::after {
  right: 0;
  clip-path: polygon(0 0, 100% 0, 50% 100%);
  filter: brightness(0.7);
}

/* ===== 勋章墙 ===== */
.wall-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px 12px;
  width: 100%;
}

.wall-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  text-align: center;
}

.shield-badge {
  position: relative;
  width: 62px;
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: center;
  clip-path: polygon(50% 0%, 95% 22%, 95% 68%, 50% 100%, 5% 68%, 5% 22%);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.shield-green { background: linear-gradient(160deg, #4ade80 0%, #eab308 100%); }
.shield-blue { background: linear-gradient(160deg, #60a5fa 0%, #94a3b8 100%); }
.shield-gold { background: linear-gradient(160deg, #fbbf24 0%, #f97316 100%); }
.shield-purple { background: linear-gradient(160deg, #a78bfa 0%, #7c3aed 100%); }
.shield-teal { background: linear-gradient(160deg, #2dd4bf 0%, #0891b2 100%); }
.shield-orange { background: linear-gradient(160deg, #fb923c 0%, #ea580c 100%); }
.shield-gray { background: linear-gradient(160deg, #d4d4d8 0%, #a1a1aa 100%); }

.shield-star {
  font-size: 22px;
  color: #fff;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.15));
  margin-top: -4px;
}

.shield-lock {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.7);
  margin-top: -4px;
}

.shield-ribbon {
  position: absolute;
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
  width: 20px;
  height: 8px;
  background: rgba(0, 0, 0, 0.12);
  border-radius: 0 0 4px 4px;
}

.item-name {
  font-size: 12px;
  font-weight: 600;
  color: #27272a;
  line-height: 1.3;
}

.item-date {
  font-size: 10px;
  color: #a1a1aa;
}

.item-desc {
  font-size: 10px;
  color: #a1a1aa;
  line-height: 1.35;
  max-width: 90px;
}

.wall-item.locked {
  opacity: 0.55;
  filter: grayscale(1);
}

.wall-item.locked .item-name,
.wall-item.locked .item-desc {
  color: #d4d4d8;
}

/* ===== 占位 ===== */
.placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #a1a1aa;
  gap: 12px;
}

.placeholder-icon {
  font-size: 40px;
  opacity: 0.4;
}
</style>
