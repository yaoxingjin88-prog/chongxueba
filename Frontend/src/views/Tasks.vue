<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import DreamPageBg from '../components/DreamPageBg.vue'
import { rewardTrophy } from '../config/ossAssets.js'
import Reward3DIcon from '../components/Reward3DIcon.vue'
import ChestTierIcon from '../components/ChestTierIcon.vue'
import { api } from '../api'
import { useUserStore } from '../stores/user'

const router = useRouter()
const user = useUserStore()
const tabTypes = ['daily', 'weekly', 'event']
const tabs = ['每日任务', '每周挑战', '限时活动']
const activeTab = ref(0)
const tasks = ref([])
const currentActivity = ref(0)
const weekCountdown = ref(null)
const eventCountdown = ref(null)
const chests = ref([])
const loading = ref(true)
const chestLoaded = ref(false)

const milestones = [
  { value: 20, tier: 1, pos: 8 },
  { value: 40, tier: 2, pos: 32 },
  { value: 60, tier: 3, pos: 56 },
  { value: 80, tier: 4, pos: 80 },
]

const pageTitle = computed(() => {
  if (activeTab.value === 1) return '挑战任务'
  if (activeTab.value === 2) return '限时活动'
  return '任务中心'
})

const countdownText = computed(() => {
  const cd = activeTab.value === 2 ? eventCountdown.value : weekCountdown.value
  if (!cd) return ''
  const { days, hours, minutes, seconds } = cd
  return `${days}天 ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
})

function chestStatus(tier) {
  const c = chests.value.find((x) => x.tier === tier)
  if (!c) return 'locked'
  if (c.claimed) return 'claimed'
  if (c.canClaim) return 'claimable'
  if (c.reached) return 'reached'
  return 'locked'
}

async function loadChests(force = false) {
  if (chestLoaded.value && !force) return
  const chestData = await api.getActivityChests()
  currentActivity.value = chestData.currentActivity
  chests.value = chestData.chests
  chestLoaded.value = true
}

async function loadTasks() {
  loading.value = true
  try {
    const data = await api.getTasks(tabTypes[activeTab.value])
    tasks.value = data.tasks
    if (data.currentActivity != null) currentActivity.value = data.currentActivity
    weekCountdown.value = data.weekCountdown || null
    eventCountdown.value = data.eventCountdown || null
  } finally { loading.value = false }
}

async function onTabChange(i) {
  activeTab.value = i
  await loadTasks()
}

function goDetail(t) { router.push(`/tasks/${t.id}`) }

async function claimChest(tier) {
  if (chestStatus(tier) !== 'claimable') return
  await api.claimActivityChest(tier)
  await user.refresh()
  await loadChests(true)
}

let timer
onMounted(async () => {
  await Promise.all([loadTasks(), loadChests(true)])
  timer = setInterval(() => {
    for (const cd of [weekCountdown.value, eventCountdown.value]) {
      if (cd?.totalMs > 0) {
        cd.totalMs -= 1000
        cd.days = Math.floor(cd.totalMs / 86400000)
        cd.hours = Math.floor((cd.totalMs % 86400000) / 3600000)
        cd.minutes = Math.floor((cd.totalMs % 3600000) / 60000)
        cd.seconds = Math.floor((cd.totalMs % 60000) / 1000)
      }
    }
  }, 1000)
})
onUnmounted(() => clearInterval(timer))
</script>

<template>
  <div class="dream-page tasks-hub">
    <DreamPageBg />

    <header class="dream-header">
      <button class="dream-hdr-btn" type="button" aria-label="返回" @click="router.back()">
        <font-awesome-icon icon="chevron-left" />
      </button>
      <h1>{{ pageTitle }}</h1>
      <div class="hdr-actions">
        <button class="dream-hdr-btn" type="button" aria-label="每日签到" @click="router.push('/checkin')">
          <font-awesome-icon icon="calendar-check" />
        </button>
        <button class="dream-hdr-btn" type="button" aria-label="奖励宝箱" @click="router.push('/treasure-box')">
          <font-awesome-icon icon="gift" />
        </button>
        <button class="dream-hdr-btn" type="button" aria-label="任务记录" @click="router.push('/tasks-records')">
          <font-awesome-icon icon="clock-rotate-left" />
        </button>
      </div>
    </header>

    <main class="dream-body">
      <nav class="task-tab-row task-tab-row--underline">
        <button
          v-for="(tab, i) in tabs"
          :key="tab"
          class="task-tab-btn"
          :class="{ active: activeTab === i }"
          @click="onTabChange(i)"
        >{{ tab }}</button>
      </nav>

      <section v-if="activeTab === 1 && weekCountdown" class="week-banner">
        <div class="week-copy">
          <strong>本周挑战赛</strong>
          <p>挑战自我 · 赢取丰厚奖励</p>
          <span class="countdown-pill">剩余时间：{{ countdownText }}</span>
        </div>
        <img class="week-trophy-img" :src="rewardTrophy" alt="" draggable="false" />
      </section>

      <section v-if="activeTab === 2 && eventCountdown" class="week-banner event-banner">
        <div class="week-copy">
          <strong>限时活动进行中</strong>
          <p>完成活动任务 · 赢取限定奖励</p>
          <span class="countdown-pill">剩余时间：{{ countdownText }}</span>
        </div>
        <Reward3DIcon variant="chest" :size="80" :floating="true" :glowing="true" class="week-trophy-slot" />
      </section>

      <section v-if="loading" class="list">
        <div v-for="i in 3" :key="i" class="task-skeleton card-sk" />
      </section>

      <TransitionGroup v-else name="task-card" tag="section" class="list">
        <article
          v-for="task in tasks"
          :key="task.id"
          class="dream-card task-card"
          :class="{ 'task-card--done': task.done }"
          @click="goDetail(task)"
        >
          <div class="task-inner">
            <div class="task-icon" :style="{ color: task.color || '#7b61ff' }">
              <font-awesome-icon :icon="task.icon" />
            </div>
            <div class="task-main">
              <h3 class="task-title">{{ task.title }}</h3>
              <p v-if="task.description && activeTab === 1" class="task-desc">{{ task.description }}</p>
              <span v-if="task.done" class="done-tag">已完成</span>
              <div class="task-prog">
                <span class="prog-label">{{ activeTab === 1 ? `进度: ${task.progress}` : task.progress }}</span>
                <div class="prog-bar">
                  <div class="prog-bar__fill" :style="{ width: `${task.progressPercent}%` }" />
                </div>
              </div>
              <div class="task-rewards">
                <span class="reward-tag exp"><font-awesome-icon icon="bolt" /> +{{ task.exp }}</span>
                <span class="reward-tag coin"><font-awesome-icon icon="coins" /> +{{ task.coins }}</span>
              </div>
            </div>
            <div class="task-side">
              <div v-if="activeTab === 1" class="medal-badge" :class="{ done: task.done }">
                <div class="medal-badge__coin">
                  <font-awesome-icon :icon="task.done ? 'check' : 'star'" />
                </div>
                <div class="medal-badge__ribbon" aria-hidden="true" />
              </div>
              <button v-else-if="!task.done" class="go-btn" type="button" @click.stop="goDetail(task)">去完成</button>
              <span v-else class="done-check"><font-awesome-icon icon="circle-check" /></span>
            </div>
          </div>
        </article>
        <p v-if="!tasks.length" key="empty" class="empty-hint">暂无任务</p>
      </TransitionGroup>

      <section class="dream-card activity-card">
        <div class="act-head">
          <div>
            <strong class="act-title">今日活跃度</strong>
            <p class="act-sub">完成任务，开启阶段宝箱</p>
          </div>
          <span class="act-score"><em>{{ currentActivity }}</em>/100</span>
        </div>
        <div class="act-track">
          <div class="act-rail"><div class="act-rail__fill" :style="{ width: `${currentActivity}%` }" /></div>
          <div
            v-for="m in milestones"
            :key="m.tier"
            class="act-node"
            :class="chestStatus(m.tier)"
            :style="{ left: `${m.pos}%` }"
            @click="chestStatus(m.tier) === 'claimable' ? claimChest(m.tier) : router.push('/treasure-box')"
          >
            <div
              class="act-node-icon"
              :class="{
                claimed: chestStatus(m.tier) === 'claimed',
                claimable: chestStatus(m.tier) === 'claimable',
                locked: chestStatus(m.tier) === 'locked',
              }"
            >
              <ChestTierIcon :tier="m.tier" :size="44" mini :floating="false" />
              <span v-if="chestStatus(m.tier) === 'claimed'" class="act-check-badge" aria-label="已领取">
                <font-awesome-icon icon="check" />
              </span>
            </div>
            <span class="act-node-val">{{ m.value }}</span>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.tasks-hub .dream-body { padding-bottom: 32px; }

.dream-header h1 { flex: 1; text-align: center; }
.hdr-actions { display: flex; gap: 6px; }

.week-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
  padding: 18px 16px 18px 18px;
  border-radius: 22px;
  background: linear-gradient(135deg, #8b74f9 0%, #7b61ff 55%, #6d5ce8 100%);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 28px rgba(123, 97, 255, 0.35);
  overflow: visible;
}

.week-copy strong { display: block; font-size: 17px; font-weight: 800; color: #fff; margin-bottom: 4px; }
.week-copy p { font-size: 12px; color: rgba(255,255,255,.75); margin-bottom: 10px; }
.countdown-pill {
  display: inline-block; padding: 4px 10px; border-radius: 999px;
  background: rgba(255,255,255,.18); font-size: 11px; color: #fde68a;
  font-variant-numeric: tabular-nums;
}
.week-trophy-img {
  flex-shrink: 0;
  height: 108px;
  width: auto;
  object-fit: contain;
  display: block;
  pointer-events: none;
  user-select: none;
}
.event-banner { background: linear-gradient(135deg, #a78bfa, #7c3aed); }

.list { margin-bottom: 14px; }
.card-sk { height: 96px; margin-bottom: 12px; }
.empty-hint { text-align: center; padding: 40px 20px; color: rgba(255,255,255,.45); font-size: 14px; }

/* 任务卡片 */
.task-card { cursor: pointer; transition: transform 0.15s; }
.task-card:active { transform: scale(0.985); }
.task-card--done { opacity: 0.85; }

.task-inner { display: flex; align-items: flex-start; gap: 12px; }

.task-icon {
  width: 48px; height: 48px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.92);
  font-size: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
}

.task-main { flex: 1; min-width: 0; }

.task-title {
  font-size: 14px; font-weight: 700;
  color: rgba(255, 255, 255, 0.95);
  line-height: 1.35; margin-bottom: 4px;
}

.task-desc {
  font-size: 11px; color: rgba(255,255,255,.45);
  margin-bottom: 6px; line-height: 1.45;
}

.done-tag {
  display: inline-block; margin-bottom: 6px;
  padding: 2px 8px; border-radius: 999px;
  background: rgba(76, 217, 100, 0.2); color: #4cd964;
  font-size: 10px; font-weight: 600;
}

.task-prog { margin-bottom: 8px; }

.prog-label {
  display: block; margin-bottom: 4px;
  font-size: 11px; font-weight: 600;
  color: rgba(255, 255, 255, 0.55);
}

.prog-bar {
  height: 6px; border-radius: 999px;
  background: rgba(255, 255, 255, 0.18); overflow: hidden;
}

.prog-bar__fill {
  height: 100%; border-radius: inherit;
  background: linear-gradient(90deg, #9d85ff, #7b61ff);
  transition: width 0.45s ease;
}

.task-rewards { display: flex; gap: 6px; flex-wrap: wrap; }

.reward-tag {
  display: inline-flex; align-items: center; gap: 3px;
  padding: 3px 9px; border-radius: 999px;
  font-size: 11px; font-weight: 700;
}

.reward-tag.exp { background: rgba(234, 88, 12, 0.2); color: #fdba74; }
.reward-tag.coin { background: rgba(251, 191, 36, 0.2); color: #fde68a; }

.task-side { flex-shrink: 0; padding-top: 4px; }

.medal-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
}

.medal-badge__coin {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: linear-gradient(145deg, #fff7d6, #fbbf24 45%, #d97706);
  color: #92400e;
  font-size: 16px;
  box-shadow: 0 4px 14px rgba(251, 191, 36, 0.45);
  position: relative;
  z-index: 2;
}

.medal-badge.done .medal-badge__coin {
  background: linear-gradient(145deg, #ecfdf5, #4cd964);
  color: #fff;
  box-shadow: 0 4px 12px rgba(76, 217, 100, 0.35);
}

.medal-badge__ribbon {
  width: 32px;
  height: 14px;
  margin-top: -3px;
  background:
    linear-gradient(135deg, transparent 50%, #7b61ff 50%) left / 50% 100% no-repeat,
    linear-gradient(225deg, transparent 50%, #7b61ff 50%) right / 50% 100% no-repeat;
  filter: drop-shadow(0 2px 4px rgba(123, 97, 255, 0.35));
}

.medal-badge.done .medal-badge__ribbon {
  background:
    linear-gradient(135deg, transparent 50%, #6ee7a0 50%) left / 50% 100% no-repeat,
    linear-gradient(225deg, transparent 50%, #6ee7a0 50%) right / 50% 100% no-repeat;
}

.done-check {
  width: 36px; height: 36px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 50%;
  background: rgba(76, 217, 100, 0.22);
  font-size: 20px; color: #4cd964;
}

.go-btn {
  padding: 8px 14px; border: none; border-radius: 999px;
  background: linear-gradient(90deg, #9d85ff, #7b61ff);
  color: #fff; font-size: 12px; font-weight: 700;
  white-space: nowrap; cursor: pointer;
  box-shadow: 0 4px 14px rgba(123, 97, 255, 0.4);
}

.go-btn:active { transform: scale(0.96); }

/* 活跃度 */
.activity-card { margin-bottom: 24px; }

.act-head {
  display: flex; justify-content: space-between; align-items: flex-start;
  margin-bottom: 18px;
}

.act-title {
  display: block; font-size: 15px; font-weight: 700;
  color: rgba(255, 255, 255, 0.95);
}

.act-sub {
  margin-top: 4px; font-size: 11px;
  color: rgba(255, 255, 255, 0.45);
}

.act-score {
  padding: 4px 12px; border-radius: 999px;
  background: rgba(255, 255, 255, 0.92);
  font-size: 13px; color: #635a78;
  font-variant-numeric: tabular-nums;
}

.act-score em {
  font-style: normal; color: #7b61ff; font-weight: 800;
}

.act-track { position: relative; height: 58px; }

.act-rail {
  position: absolute; top: 22px; left: 4%; right: 4%;
  height: 8px; border-radius: 999px;
  background: rgba(255, 255, 255, 0.18); overflow: hidden;
}

.act-rail__fill {
  height: 100%;
  background: linear-gradient(90deg, #9d85ff, #7b61ff);
  transition: width 0.5s ease;
}

.act-node {
  position: absolute; top: 0;
  display: flex; flex-direction: column; align-items: center;
  transform: translateX(-50%); cursor: pointer;
}

.act-node-icon {
  position: relative;
  width: 44px; height: 44px;
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 4px;
  border-radius: 12px;
  background: transparent;
  overflow: visible;
}

.act-node-icon.locked {
  opacity: 0.72;
  filter: grayscale(0.15);
}

.act-node-icon.claimable {
  box-shadow: 0 0 0 2px rgba(123, 97, 255, 0.65);
  border-radius: 14px;
}

.act-check-badge {
  position: absolute;
  right: -3px;
  bottom: 0;
  z-index: 3;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #4cd964;
  color: #fff;
  font-size: 8px;
  border: 2px solid rgba(255, 255, 255, 0.92);
  box-shadow: 0 2px 6px rgba(76, 217, 100, 0.45);
}

.act-node-val {
  font-size: 10px; font-weight: 700;
  color: rgba(255, 255, 255, 0.55);
}

.task-card-enter-active,
.task-card-leave-active { transition: all 0.35s ease; }
.task-card-enter-from { opacity: 0; transform: translateY(10px); }
.task-card-leave-to { opacity: 0; transform: scale(0.97); }
.task-card-move { transition: transform 0.35s ease; }
</style>
