<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DreamPageBg from '../components/DreamPageBg.vue'
import FoxMascot from '../components/FoxMascot.vue'
import { api } from '../api'
import { useUserStore } from '../stores/user'
import { useToast } from '../composables/useToast'
import { sharePage } from '../utils/share'

const route = useRoute()
const router = useRouter()
const user = useUserStore()
const toast = useToast()
const task = ref(null)
const claiming = ref(false)
const loading = ref(true)
const error = ref('')

const PET_META = {
  focus: { label: '专注值', color: '#7b61ff' },
  study: { label: '经验值', color: '#7b61ff' },
  memory: { label: '记忆力', color: '#6366f1' },
  discipline: { label: '自律力', color: '#10b981' },
  intimacy: { label: '亲密度', color: '#ec4899' },
}

const petRewardItems = computed(() => {
  const r = task.value?.petRewards || {}
  return Object.entries(r)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => ({ key: k, value: v, ...PET_META[k] }))
})

async function loadTask() {
  loading.value = true
  error.value = ''
  try {
    task.value = await api.getTaskDetail(route.params.id)
  } catch (e) {
    error.value = e?.message || '加载失败，请稍后重试'
    task.value = null
  } finally {
    loading.value = false
  }
}

async function onStart() {
  if (!task.value || task.value.done) return
  if (task.value.actionRoute) {
    router.push(task.value.actionRoute)
    return
  }
  claiming.value = true
  try {
    await api.completeTask(task.value.id)
    await user.refresh()
    await loadTask()
    toast.success('任务已完成！')
  } finally { claiming.value = false }
}

async function onShare() {
  if (!task.value) return
  const r = await sharePage(task.value.title, task.value.description)
  if (r === 'copied') toast.success('链接已复制到剪贴板')
}

onMounted(loadTask)
</script>

<template>
  <div class="dream-page detail-page">
    <DreamPageBg />

    <header class="dream-header">
      <button class="dream-hdr-btn" type="button" aria-label="返回" @click="router.back()">
        <font-awesome-icon icon="chevron-left" />
      </button>
      <h1>任务详情</h1>
      <button class="dream-hdr-btn" type="button" aria-label="分享" @click="onShare">
        <font-awesome-icon icon="share-nodes" />
      </button>
    </header>

    <main v-if="loading" class="dream-body has-footer-btn">
      <div class="task-skeleton sk" />
      <div class="task-skeleton sk" />
    </main>
    <main v-else-if="error" class="dream-body">
      <p class="err-msg">{{ error }}</p>
    </main>
    <main v-else-if="task" class="dream-body has-footer-btn">
      <!-- 任务概览 -->
      <section class="dream-card hero">
        <div class="hero-top">
          <div
            class="hero-icon"
            :style="{
              color: task.color || '#7b61ff',
              background: `${task.color || '#7b61ff'}24`,
              borderColor: `${task.color || '#7b61ff'}45`,
              boxShadow: `0 4px 14px ${task.color || '#7b61ff'}28`,
            }"
          >
            <font-awesome-icon :icon="task.icon" />
          </div>
          <div class="hero-main">
            <div class="hero-title-row">
              <h2 class="hero-title">{{ task.title }}</h2>
              <span class="hero-badge">{{ task.typeLabel }}</span>
            </div>
            <p class="hero-desc">{{ task.description }}</p>
          </div>
        </div>
        <div class="hero-progress">
          <div class="prog-row">
            <span>当前进度</span>
            <strong>{{ task.progress }}</strong>
          </div>
          <div class="hero-bar">
            <div class="hero-bar__fill" :style="{ width: `${task.progressPercent}%` }" />
          </div>
        </div>
      </section>

      <!-- 任务奖励 -->
      <section class="dream-card">
        <h3 class="sec-title">任务奖励</h3>
        <div class="tile-row">
          <div class="tile tile-exp">
            <font-awesome-icon icon="bolt" class="tile-ico" />
            <span>EXP +{{ task.exp }}</span>
          </div>
          <div class="tile tile-coin">
            <font-awesome-icon icon="coins" class="tile-ico" />
            <span>+{{ task.coins }}</span>
          </div>
        </div>
      </section>

      <!-- 宠物成长 -->
      <section v-if="petRewardItems.length" class="dream-card pet-card">
        <h3 class="sec-title">宠物成长奖励</h3>
        <p class="pet-sub">完成任务可获得以下成长值</p>
        <div class="pet-layout">
          <div class="pet-tiles">
            <div
              v-for="item in petRewardItems"
              :key="item.key"
              class="pet-tile"
              :style="{
                background: `${item.color}22`,
                borderColor: `${item.color}42`,
              }"
            >
              <span class="pet-tile-label">{{ item.label }}</span>
              <strong :style="{ color: item.color }">+{{ item.value }}</strong>
            </div>
          </div>
          <FoxMascot variant="dark" :height="88" :floating="false" />
        </div>
      </section>

      <!-- 难度 -->
      <section class="dream-card">
        <h3 class="sec-title">任务难度</h3>
        <div class="diff-row">
          <div class="stars">
            <font-awesome-icon v-for="i in 5" :key="i" icon="star" :class="{ on: i <= task.difficulty }" />
          </div>
          <span class="diff-pill">{{ task.difficultyLabel }}</span>
        </div>
      </section>

      <!-- 步骤 -->
      <section v-if="task.steps?.length" class="dream-card">
        <h3 class="sec-title">任务步骤</h3>
        <ol class="steps">
          <li v-for="(step, i) in task.steps" :key="i">
            <span class="step-no">{{ String(i + 1).padStart(2, '0') }}</span>
            <span class="step-text">{{ step }}</span>
          </li>
        </ol>
        <p v-if="task.actionRoute === '/focus'" class="step-tip">
          专注期间离开计时界面超过5分钟将暂停计时哦~
        </p>
      </section>
    </main>

    <div v-if="task && !loading" class="dream-footer detail-footer">
      <button class="dream-btn" :disabled="task.done || claiming" @click="onStart">
        {{ task.done ? '已完成' : claiming ? '处理中...' : (task.actionRoute ? '立即前往' : '立即开始') }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.detail-page .dream-body {
  padding-bottom: calc(130px + env(safe-area-inset-bottom, 0px));
}

.sk { height: 120px; margin-bottom: 12px; }
.err-msg { text-align: center; padding: 48px 20px; color: rgba(255,255,255,.6); }

/* 区块标题 */
.sec-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 14px;
  font-size: 15px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.92);
}

.sec-title::before {
  content: '';
  width: 4px;
  height: 14px;
  border-radius: 999px;
  background: #a594ff;
  flex-shrink: 0;
}

/* Hero */
.hero-top {
  display: flex;
  gap: 12px;
  margin-bottom: 14px;
}

.hero-icon {
  width: 52px;
  height: 52px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  border: 1px solid transparent;
  font-size: 22px;
}

.hero-main { flex: 1; min-width: 0; }

.hero-title-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.hero-title {
  font-size: 16px;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.95);
  line-height: 1.35;
}

.hero-badge {
  padding: 2px 10px;
  border-radius: 999px;
  background: rgba(123, 97, 255, 0.35);
  color: #ddd6fe;
  font-size: 10px;
  font-weight: 600;
}

.hero-desc {
  font-size: 12px;
  line-height: 1.55;
  color: rgba(255, 255, 255, 0.45);
}

.hero-progress {
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.prog-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.45);
}

.prog-row strong {
  color: rgba(255, 255, 255, 0.95);
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}

.hero-bar {
  height: 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.2);
  overflow: hidden;
}

.hero-bar__fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #9d85ff, #c4b5fd);
  transition: width 0.5s ease;
}

/* 奖励 / 成长 — 半透明色块，不用白底 */
.tile-row,
.pet-tiles {
  display: flex;
  gap: 10px;
}

.tile,
.pet-tile {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 14px 10px;
  border-radius: 16px;
  border: 1px solid transparent;
}

.tile {
  flex-direction: row;
  gap: 8px;
  font-size: 14px;
  font-weight: 800;
}

.tile-exp {
  background: rgba(59, 130, 246, 0.2);
  border-color: rgba(147, 197, 253, 0.28);
  color: #93c5fd;
}

.tile-coin {
  background: rgba(245, 158, 11, 0.18);
  border-color: rgba(253, 224, 71, 0.28);
  color: #fde68a;
}

.tile-ico { font-size: 16px; }

.pet-sub {
  margin: -8px 0 12px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.45);
}

.pet-layout {
  display: flex;
  align-items: center;
  gap: 10px;
}

.pet-tiles { flex: 1; flex-wrap: wrap; }
.pet-tile { min-width: calc(50% - 5px); flex: 1 1 calc(50% - 5px); }

.pet-tile-label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.55);
  font-weight: 600;
}

.pet-tile strong {
  font-size: 20px;
  font-weight: 800;
}

/* 难度 */
.diff-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.stars {
  display: flex;
  gap: 4px;
  color: rgba(255, 255, 255, 0.2);
  font-size: 18px;
}

.stars .on { color: #fbbf24; }

.diff-pill {
  padding: 4px 12px;
  border-radius: 999px;
  background: rgba(123, 97, 255, 0.3);
  color: #ddd6fe;
  font-size: 12px;
  font-weight: 600;
}

/* 步骤 */
.steps {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.steps li {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.step-no {
  flex-shrink: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: rgba(123, 97, 255, 0.35);
  color: #e0d9ff;
  font-size: 12px;
  font-weight: 800;
}

.step-text {
  font-size: 14px;
  line-height: 1.55;
  color: rgba(255, 255, 255, 0.75);
  padding-top: 4px;
}

.step-tip {
  margin-top: 14px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
  text-align: center;
}

.detail-footer {
  background: linear-gradient(180deg, transparent, rgba(26, 24, 53, 0.85) 40%);
}
</style>
