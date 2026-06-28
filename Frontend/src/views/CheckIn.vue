<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import DreamPageBg from '../components/DreamPageBg.vue'
import FoxMascot from '../components/FoxMascot.vue'
import RewardBurst from '../components/RewardBurst.vue'
import { api } from '../api'
import { useUserStore } from '../stores/user'
import { useToast } from '../composables/useToast'
import { sharePage } from '../utils/share'

const router = useRouter()
const user = useUserStore()
const toast = useToast()
const items = ref([])
const calendarDays = ref([])
const streakDays = ref(0)
const todayReward = ref({ exp: 30, coins: 20 })
const viewMonth = ref(new Date())
const checkingIn = ref(false)
const loading = ref(true)
const showBurst = ref(false)
const streakBump = ref(false)

const monthLabel = computed(() => {
  const d = viewMonth.value
  return `${d.getFullYear()}年${d.getMonth() + 1}月`
})
const monthKey = computed(() => {
  const d = viewMonth.value
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
})
const todayStr = computed(() => {
  const n = new Date()
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`
})
const hasCheckedToday = computed(() => calendarDays.value.some((d) => d.date === todayStr.value))

const canGoNextMonth = computed(() => {
  const now = new Date()
  const d = viewMonth.value
  return d.getFullYear() < now.getFullYear()
    || (d.getFullYear() === now.getFullYear() && d.getMonth() < now.getMonth())
})

const streakHint = computed(() => {
  const r = 7 - (streakDays.value % 7)
  if (streakDays.value > 0 && streakDays.value % 7 !== 0) {
    return `再签 ${r} 天可获得额外奖励`
  }
  return '每日签到，领取丰厚奖励'
})

const REWARD_CYCLE = [10, 10, 20, 20, 30, 30, 50]

function dayReward(day, info) {
  if (info?.reward) return info.reward
  const coins = REWARD_CYCLE[(day - 1) % 7]
  return { coins, hasStar: day % 7 === 0 }
}

async function loadData() {
  loading.value = true
  try {
    const [itemData, calendar] = await Promise.all([
      api.getCheckInItems(),
      api.getCheckInCalendar(monthKey.value),
    ])
    items.value = itemData
    calendarDays.value = calendar.days
    streakDays.value = calendar.streakDays
    todayReward.value = calendar.todayReward || { exp: 30, coins: 20 }
  } finally { loading.value = false }
}

async function checkInAll() {
  if (checkingIn.value || hasCheckedToday.value) return
  checkingIn.value = true
  try {
    for (const item of items.value.filter((i) => !i.checked)) {
      await api.checkIn(item.id)
    }
    await user.refresh()
    await loadData()
    showBurst.value = true
    streakBump.value = true
    setTimeout(() => { showBurst.value = false }, 1200)
    setTimeout(() => { streakBump.value = false }, 600)
    toast.reward(`签到成功！获得 EXP +${todayReward.value.exp}、学豆 +${todayReward.value.coins}`)
  } finally { checkingIn.value = false }
}

async function onShare() {
  const r = await sharePage('每日签到', `已连续签到 ${streakDays.value} 天`)
  if (r === 'copied') toast.success('链接已复制到剪贴板')
}

function prevMonth() {
  const d = new Date(viewMonth.value)
  d.setMonth(d.getMonth() - 1)
  viewMonth.value = d
  loadData()
}

function nextMonth() {
  if (!canGoNextMonth.value) return
  const d = new Date(viewMonth.value)
  d.setMonth(d.getMonth() + 1)
  viewMonth.value = d
  loadData()
}

function dayInfo(dateStr) {
  return calendarDays.value.find((d) => d.date === dateStr)
}

function monthDayCells() {
  const d = viewMonth.value
  const y = d.getFullYear()
  const m = d.getMonth()
  const total = new Date(y, m + 1, 0).getDate()
  const blanks = new Date(y, m, 1).getDay()
  const cells = []
  for (let i = 0; i < blanks; i++) cells.push({ blank: true, key: `b${i}` })
  for (let day = 1; day <= total; day++) {
    const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const info = dayInfo(dateStr)
    const reward = dayReward(day, info)
    cells.push({
      day, dateStr, key: dateStr,
      checked: Boolean(info),
      today: dateStr === todayStr.value,
      future: dateStr > todayStr.value,
      past: dateStr < todayStr.value,
      reward,
      milestone: reward.hasStar,
      showReward: !info && dateStr >= todayStr.value,
    })
  }
  return cells
}

onMounted(loadData)
</script>

<template>
  <div class="dream-page checkin-page">
    <DreamPageBg />
    <RewardBurst :active="showBurst" />

    <header class="dream-header">
      <button class="dream-hdr-btn" type="button" aria-label="返回" @click="router.back()">
        <font-awesome-icon icon="chevron-left" />
      </button>
      <h1>每日签到</h1>
      <button class="dream-hdr-btn" type="button" aria-label="分享" @click="onShare">
        <font-awesome-icon icon="share-nodes" />
      </button>
    </header>

    <main class="dream-body">
      <section class="streak-block">
        <div class="streak-copy">
          <p class="streak-line">
            连续签到 <strong class="streak-num" :class="{ bump: streakBump }">{{ streakDays }}</strong> 天
          </p>
          <p class="streak-tip">{{ streakHint }}</p>
        </div>
        <FoxMascot variant="dark" :height="118" show-star />
      </section>

      <section class="dream-card cal-card">
        <div class="card-head">
          <h2 class="dream-section-title inline">本月签到奖励</h2>
          <div class="month-nav">
            <button type="button" class="month-btn" aria-label="上个月" @click="prevMonth"><font-awesome-icon icon="chevron-left" /></button>
            <span class="month-text">{{ monthLabel }}</span>
            <button type="button" class="month-btn" aria-label="下个月" :disabled="!canGoNextMonth" @click="nextMonth"><font-awesome-icon icon="chevron-right" /></button>
          </div>
        </div>
        <div v-if="loading" class="cal-skeleton">
          <div v-for="i in 28" :key="i" class="sk-cell" />
        </div>
        <template v-else>
          <div class="week-head">
            <span v-for="w in ['日','一','二','三','四','五','六']" :key="w">{{ w }}</span>
          </div>
          <div class="cal-grid">
            <div v-for="cell in monthDayCells()" :key="cell.key" class="cal-cell" :class="{ blank: cell.blank }">
              <template v-if="!cell.blank">
                <div
                  class="day-box"
                  :class="{
                    checked: cell.checked,
                    today: cell.today && !cell.checked,
                    past: cell.past && !cell.checked,
                  }"
                >
                  <template v-if="cell.checked">
                    <div class="checked-reward">
                      <span class="coin-dot lg"><font-awesome-icon icon="coins" /></span>
                      <span class="check-dot"><font-awesome-icon icon="check" /></span>
                    </div>
                    <span class="amt checked-amt">+{{ cell.reward.coins }}</span>
                  </template>
                  <template v-else-if="cell.past">
                    <span class="day-num dim">{{ cell.day }}</span>
                  </template>
                  <template v-else>
                    <span class="day-num" :class="{ 'today-num': cell.today }">{{ cell.day }}</span>
                    <div v-if="cell.showReward" class="day-reward" :class="{ milestone: cell.milestone }">
                      <span v-if="cell.milestone" class="star-dot"><font-awesome-icon icon="star" /></span>
                      <span v-else class="coin-dot sm"><font-awesome-icon icon="coins" /></span>
                      <span class="amt">+{{ cell.reward.coins }}</span>
                    </div>
                  </template>
                </div>
              </template>
            </div>
          </div>
          <div class="today-reward-bar">
            <span class="bar-label">今日奖励</span>
            <div class="bar-pills">
              <span class="mini-pill exp"><font-awesome-icon icon="bolt" /> EXP +{{ todayReward.exp }}</span>
              <span class="mini-pill coin"><font-awesome-icon icon="coins" /> +{{ todayReward.coins }}</span>
            </div>
          </div>
        </template>
      </section>
    </main>

    <div class="dream-footer">
      <button class="dream-btn" :class="{ done: hasCheckedToday }" :disabled="hasCheckedToday || checkingIn" @click="checkInAll">
        {{ hasCheckedToday ? '今日已签到' : checkingIn ? '签到中...' : '立即签到' }}
      </button>
      <p class="reset-tip">每日0点重置签到进度</p>
    </div>
  </div>
</template>

<style scoped>
.streak-block {
  display: flex; align-items: flex-end; justify-content: space-between;
  padding: 4px 4px 20px; min-height: 130px;
  position: relative;
}

.streak-block::after {
  content: '';
  position: absolute;
  right: 8%;
  bottom: 8px;
  width: 120px;
  height: 36px;
  border-radius: 50%;
  background: radial-gradient(ellipse, rgba(255,255,255,.28) 0%, transparent 70%);
  pointer-events: none;
}

.streak-line { font-size: 17px; font-weight: 600; color: rgba(255,255,255,.85); margin-bottom: 8px; }
.streak-num { font-size: 44px; font-weight: 800; color: #fff; line-height: 1; margin: 0 2px; display: inline-block; transition: transform 0.3s; }
.streak-num.bump { transform: scale(1.15); color: #c4b5fd; }
.streak-tip { font-size: 13px; color: var(--task-text-muted); line-height: 1.5; max-width: 190px; }

.card-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; gap: 8px; }
.dream-section-title.inline { margin-bottom: 0; }
.month-nav { display: flex; align-items: center; gap: 6px; }
.cal-card { padding-bottom: 16px; margin-top: -12px; position: relative; z-index: 4; }

.month-text { font-size: 12px; color: var(--task-text-muted); font-weight: 600; min-width: 72px; text-align: center; }
.month-btn { width: 26px; height: 26px; border: none; border-radius: 50%; background: rgba(255,255,255,.15); color: #fff; font-size: 10px; cursor: pointer; transition: background 0.2s; }
.month-btn:active:not(:disabled) { background: rgba(255,255,255,.28); }
.month-btn:disabled { opacity: 0.35; cursor: not-allowed; }

.cal-skeleton { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; }
.sk-cell { height: 52px; border-radius: 12px; background: rgba(255,255,255,.08); animation: task-sk 1.4s ease-in-out infinite; }

.week-head { display: grid; grid-template-columns: repeat(7, 1fr); margin-bottom: 6px; text-align: center; font-size: 11px; color: var(--task-text-dim); font-weight: 600; }
.cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); row-gap: 2px; }
.cal-cell { display: flex; align-items: center; justify-content: center; min-height: 56px; }
.cal-cell.blank { visibility: hidden; }

.day-box { display: flex; flex-direction: column; align-items: center; justify-content: center; width: 44px; min-height: 52px; gap: 3px; }
.day-num { font-size: 13px; font-weight: 700; color: rgba(255,255,255,.85); line-height: 1; }
.day-num.dim { color: rgba(255,255,255,.28); font-weight: 500; }
.day-box.today {
  border-radius: 50%;
  box-shadow: 0 0 0 2.5px var(--task-primary), 0 0 16px rgba(123,97,255,.35);
  background: rgba(123,97,255,.12);
}

.today-num { color: #c4b5fd; }

.checked-amt { margin-top: 2px; }

.today-reward-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px dashed rgba(255, 255, 255, 0.15);
}

.bar-label { font-size: 13px; font-weight: 700; color: rgba(255,255,255,.92); flex-shrink: 0; }

.bar-pills { display: flex; gap: 8px; flex-wrap: wrap; justify-content: flex-end; }

.mini-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
}

.mini-pill.exp { background: rgba(37, 99, 235, 0.22); color: #93c5fd; }
.mini-pill.coin { background: rgba(251, 191, 36, 0.2); color: #fde68a; }

.checked-reward { position: relative; }

.coin-dot { display: flex; align-items: center; justify-content: center; border-radius: 50%; background: linear-gradient(145deg, #fef3c7, #fde68a); color: #d97706; box-shadow: 0 2px 8px rgba(251,191,36,.28); }
.coin-dot.lg { width: 34px; height: 34px; font-size: 13px; }
.coin-dot.sm { width: 20px; height: 20px; font-size: 8px; }
.check-dot { position: absolute; bottom: -4px; right: -5px; width: 16px; height: 16px; display: flex; align-items: center; justify-content: center; border-radius: 50%; background: #4cd964; color: #fff; font-size: 8px; border: 2px solid #fff; }

.day-reward { display: flex; flex-direction: column; align-items: center; gap: 1px; }
.star-dot { width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; border-radius: 50%; background: linear-gradient(145deg, #fef9c3, #fde047); color: #ca8a04; font-size: 10px; box-shadow: 0 0 10px rgba(253,224,71,.5); }
.amt { font-size: 9px; font-weight: 700; color: #d97706; }
.day-reward.milestone .amt { color: #ca8a04; }

.reset-tip { margin-top: 10px; text-align: center; font-size: 11px; color: rgba(255,255,255,.4); }
</style>
