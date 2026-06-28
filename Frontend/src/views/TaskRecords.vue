<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import DreamPageBg from '../components/DreamPageBg.vue'
import { api } from '../api'

const router = useRouter()
const filters = [
  { key: 'all', label: '全部' },
  { key: 'completed', label: '已完成' },
  { key: 'progress', label: '进行中' },
  { key: 'expired', label: '已过期' },
]
const activeFilter = ref('all')
const stats = ref({ todayCompleted: 0, streakDays: 0, totalPoints: 0 })
const groups = ref([])
const loading = ref(true)

function localToday() {
  const n = new Date()
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`
}

function formatDateLabel(dateStr) {
  const today = localToday()
  const y = new Date()
  y.setDate(y.getDate() - 1)
  const yesterday = `${y.getFullYear()}-${String(y.getMonth() + 1).padStart(2, '0')}-${String(y.getDate()).padStart(2, '0')}`
  if (dateStr === today) return '今天'
  if (dateStr === yesterday) return '昨天'
  const [, m, d] = dateStr.split('-')
  return `${Number(m)}月${Number(d)}日`
}

function formatPoints(n) {
  return Number(n).toLocaleString('zh-CN')
}

async function loadHistory() {
  loading.value = true
  try {
    const data = await api.getTaskHistory(activeFilter.value)
    stats.value = data.stats
    groups.value = data.groups
  } finally { loading.value = false }
}

async function onFilterChange(key) { activeFilter.value = key; await loadHistory() }

onMounted(loadHistory)
</script>

<template>
  <div class="dream-page records-page">
    <DreamPageBg />

    <header class="dream-header">
      <button class="dream-hdr-btn" type="button" aria-label="返回" @click="router.back()">
        <font-awesome-icon icon="chevron-left" />
      </button>
      <h1>任务记录</h1>
      <button class="dream-hdr-btn" type="button" aria-label="查看签到日历" @click="router.push('/checkin')">
        <font-awesome-icon icon="calendar-days" />
      </button>
    </header>

    <main class="dream-body">
      <nav class="task-tab-row filters">
        <button
          v-for="f in filters"
          :key="f.key"
          class="task-tab-btn"
          :class="{ active: activeFilter === f.key }"
          @click="onFilterChange(f.key)"
        >{{ f.label }}</button>
      </nav>

      <section class="stats-row">
        <div class="dream-card stat-card">
          <span class="stat-ico done"><font-awesome-icon icon="circle-check" /></span>
          <span class="stat-label">今日完成</span>
          <strong class="stat-num">{{ stats.todayCompleted }}<small>个任务</small></strong>
        </div>
        <div class="dream-card stat-card">
          <span class="stat-ico streak"><font-awesome-icon icon="fire" /></span>
          <span class="stat-label">连续天数</span>
          <strong class="stat-num">{{ stats.streakDays }}<small>天</small></strong>
        </div>
        <div class="dream-card stat-card">
          <span class="stat-ico coin"><font-awesome-icon icon="coins" /></span>
          <span class="stat-label">累计积分</span>
          <strong class="stat-num">{{ formatPoints(stats.totalPoints) }}</strong>
        </div>
      </section>

      <section v-if="loading" class="sk-list">
        <div v-for="i in 3" :key="i" class="task-skeleton sk" />
      </section>

      <p v-else-if="!groups.length" class="empty">暂无任务记录</p>

      <section v-for="group in groups" v-else :key="group.date" class="dream-card group-card">
        <h3 class="date-label"><span class="dot" />{{ formatDateLabel(group.date) }}</h3>
        <article v-for="(item, idx) in group.items" :key="item.id" class="row" :class="{ 'row--last': idx === group.items.length - 1 }">
          <div class="row-icon" :style="{ '--c': item.color }">
            <font-awesome-icon :icon="item.icon" />
          </div>
          <div class="row-body">
            <span class="row-title">{{ item.title }}</span>
            <span class="row-meta">
              <template v-if="item.completedTime">{{ item.completedTime }} 完成</template>
              <template v-else-if="item.done">已完成</template>
              <template v-else>进度 {{ item.progress }}</template>
              <span v-if="item.done" class="row-coin"><font-awesome-icon icon="coins" /> +{{ item.coins }}</span>
            </span>
          </div>
          <span v-if="item.done" class="row-check"><font-awesome-icon icon="circle-check" /></span>
          <span v-else class="row-pending"><font-awesome-icon icon="clock" /></span>
        </article>
      </section>
    </main>
  </div>
</template>

<style scoped>
.filters { margin-bottom: 14px; }

.stats-row {
  display: flex;
  gap: 10px;
  margin-bottom: 18px;
}

.stat-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 6px 14px;
  margin-bottom: 0;
  text-align: center;
}

.stat-ico {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  font-size: 14px;
  margin-bottom: 2px;
}

.stat-ico.done { background: rgba(76, 217, 100, 0.2); color: #4cd964; }
.stat-ico.streak { background: rgba(251, 146, 60, 0.2); color: #fb923c; }
.stat-ico.coin { background: rgba(251, 191, 36, 0.2); color: #fde68a; }

.stat-label { font-size: 11px; color: var(--task-text-dim); font-weight: 600; }
.stat-num {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 2px;
  font-size: 20px;
  font-weight: 800;
  color: #fff;
  line-height: 1;
}
.stat-num small { font-size: 10px; font-weight: 600; color: var(--task-text-muted); margin-left: 2px; }

.sk-list { display: flex; flex-direction: column; gap: 10px; }
.sk { height: 80px; }
.empty { text-align: center; padding: 40px 20px; color: rgba(255,255,255,.45); font-size: 14px; }
.group-card { padding: 14px 16px 8px; margin-bottom: 12px; }
.date-label { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 700; color: var(--task-text-muted); margin-bottom: 6px; padding-bottom: 8px; }
.dot { width: 6px; height: 6px; border-radius: 50%; background: #fde047; }
.row { display: flex; align-items: center; gap: 12px; padding: 12px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.08); }
.row--last { border-bottom: none; padding-bottom: 4px; }
.row-icon {
  width: 44px; height: 44px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  border-radius: 14px; background: rgba(255,255,255,.92); color: var(--c, var(--task-primary)); font-size: 17px;
  box-shadow: 0 2px 10px rgba(0,0,0,.08);
}
.row-body { flex: 1; min-width: 0; }
.row-title { display: block; font-size: 14px; font-weight: 700; color: rgba(255,255,255,.92); margin-bottom: 4px; }
.row-meta { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; font-size: 11px; color: var(--task-text-dim); }
.row-coin { display: inline-flex; align-items: center; gap: 3px; color: #fde68a; font-weight: 700; }
.row-check {
  flex-shrink: 0; width: 32px; height: 32px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 50%; background: rgba(76, 217, 100, 0.22); font-size: 18px; color: var(--task-success);
}
.row-pending {
  flex-shrink: 0; width: 32px; height: 32px;
  display: flex; align-items: center; justify-content: center;
  font-size: 16px; color: rgba(255,255,255,.35);
}
</style>
