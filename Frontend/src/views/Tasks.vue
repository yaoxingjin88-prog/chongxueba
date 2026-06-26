<script setup>
import { ref, onMounted } from 'vue'
import PageHeader from '../components/PageHeader.vue'
import { api } from '../api'
import { useUserStore } from '../stores/user'

const user = useUserStore()
const tabTypes = ['daily', 'weekly', 'goal', 'streak']
const activeTab = ref(0)
const tasks = ref([])
const currentActivity = ref(0)
const loading = ref(true)

const milestones = [
  { value: 20, tone: 'gold', position: 2 },
  { value: 40, tone: 'blue', position: 26 },
  { value: 60, tone: 'copper', position: 50 },
  { value: 80, tone: 'orange', position: 74 },
  { value: 100, tone: 'purple', position: 98 },
]

async function loadTasks() {
  loading.value = true
  try {
    const data = await api.getTasks(tabTypes[activeTab.value])
    tasks.value = data.tasks
    currentActivity.value = data.currentActivity
  } finally {
    loading.value = false
  }
}

async function onTabChange(index) {
  activeTab.value = index
  await loadTasks()
}

async function completeTask(task) {
  if (task.done) return
  await api.completeTask(task.id)
  await user.refresh()
  await loadTasks()
}

onMounted(loadTasks)
</script>

<template>
  <div class="tasks page">
    <div class="task-bg" aria-hidden="true">
      <div class="task-stars" />
      <div class="task-glow task-glow-one" />
      <div class="task-glow task-glow-two" />
      <div class="task-cloud cloud-left" />
      <div class="task-cloud cloud-right" />
    </div>

    <PageHeader title="任务中心" transparent />

    <main class="page-content no-tab">
      <nav class="tab-row" aria-label="任务类型">
        <button
          v-for="(tab, index) in tabs"
          :key="tab"
          class="tab-btn"
          :class="{ active: activeTab === index }"
          type="button"
          @click="onTabChange(index)"
        >
          {{ tab }}
        </button>
      </nav>

      <section class="task-list" aria-label="任务列表">
        <article v-for="task in tasks" :key="task.title" class="task-card">
          <div class="task-icon" :style="{ '--task-color': task.color }">
            <font-awesome-icon :icon="task.icon" />
          </div>
          <div class="task-info">
            <span class="task-title">{{ task.title }}</span>
            <div class="task-meta">
              <span class="task-progress">{{ task.progress }}</span>
              <span class="reward exp"><font-awesome-icon icon="bolt" /> +{{ task.exp }} EXP</span>
              <span class="reward coins"><font-awesome-icon icon="coins" /> +{{ task.coins }}</span>
            </div>
          </div>
          <button v-if="!task.done" class="task-action" type="button" @click="completeTask(task)">去完成</button>
          <span v-else class="task-done" aria-label="已完成">
            <font-awesome-icon icon="circle-check" />
          </span>
        </article>
      </section>

      <section class="activity-section" aria-label="今日活跃度奖励">
        <div class="activity-header">
          <div>
            <span class="activity-title">今日活跃度</span>
            <p>完成任务，开启阶段宝箱</p>
          </div>
          <span class="activity-value">{{ currentActivity }}/100</span>
        </div>

        <div class="reward-track">
          <div class="activity-bar">
            <div class="activity-fill" :style="{ width: `${currentActivity}%` }" />
          </div>

          <div
            v-for="milestone in milestones"
            :key="milestone.value"
            class="milestone"
            :class="[
              `tone-${milestone.tone}`,
              {
                reached: currentActivity >= milestone.value,
                next: currentActivity < milestone.value && milestone.value === 40,
                grand: milestone.value === 100,
                first: milestone.value === 20,
                last: milestone.value === 100,
              },
            ]"
            :style="{ left: `${milestone.position}%` }"
          >
            <div class="chest-glow" />
            <div class="treasure-chest">
              <span class="chest-lid" />
              <span class="chest-body" />
              <span class="chest-band" />
              <span class="chest-lock">
                <font-awesome-icon :icon="currentActivity >= milestone.value ? 'check' : 'lock'" />
              </span>
            </div>
            <span class="milestone-value">{{ milestone.value }}</span>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.tasks {
  isolation: isolate;
  background: #405bcf;
  color: #fff;
}

.task-bg {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.task-bg::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, #5b64df 0%, #5269dd 30%, #4564d4 62%, #3657bd 100%);
}

.task-stars {
  position: absolute;
  inset: 0;
  background-image:
    radial-gradient(1px 1px at 10% 12%, rgba(255,255,255,.9) 0%, transparent 100%),
    radial-gradient(1px 1px at 27% 5%, rgba(255,255,255,.65) 0%, transparent 100%),
    radial-gradient(1.5px 1.5px at 53% 16%, rgba(255,255,255,.8) 0%, transparent 100%),
    radial-gradient(1px 1px at 79% 8%, rgba(255,255,255,.72) 0%, transparent 100%),
    radial-gradient(1px 1px at 91% 36%, rgba(255,255,255,.6) 0%, transparent 100%),
    radial-gradient(1px 1px at 14% 58%, rgba(255,255,255,.55) 0%, transparent 100%),
    radial-gradient(1.5px 1.5px at 70% 73%, rgba(255,255,255,.6) 0%, transparent 100%),
    radial-gradient(1px 1px at 36% 89%, rgba(255,255,255,.5) 0%, transparent 100%);
  opacity: .8;
}

.task-glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(62px);
  opacity: .3;
}

.task-glow-one {
  width: 280px;
  height: 280px;
  top: 15%;
  left: -42%;
  background: #73b7ff;
}

.task-glow-two {
  width: 250px;
  height: 250px;
  right: -38%;
  bottom: 10%;
  background: #a886ff;
}

.task-cloud {
  position: absolute;
  border-radius: 999px;
  background: rgba(255,255,255,.08);
  filter: blur(3px);
}

.cloud-left {
  width: 110px;
  height: 28px;
  top: 38%;
  left: -35px;
}

.cloud-right {
  width: 95px;
  height: 25px;
  right: -20px;
  bottom: 18%;
}

.tasks :deep(.page-header) {
  color: #fff;
}

.tasks :deep(.back-btn) {
  background: rgba(255,255,255,.1);
  border: 1px solid rgba(255,255,255,.08);
}

.page-content {
  position: relative;
  z-index: 3;
}

.tab-row {
  display: grid;
  grid-template-columns: repeat(4, minmax(max-content, 1fr));
  gap: 7px;
  margin-bottom: 12px;
  padding: 0 16px;
  overflow-x: auto;
}

.tab-btn {
  padding: 8px 11px;
  border: 1px solid rgba(255, 255, 255, .12);
  border-radius: 999px;
  background: rgba(255, 255, 255, .07);
  color: rgba(255,255,255,.7);
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  transition: background .2s ease, transform .2s ease;
}

.tab-btn.active {
  border-color: rgba(255,255,255,.72);
  background: rgba(255,255,255,.9);
  box-shadow: 0 6px 16px rgba(37, 50, 143, .16);
  color: #6553ce;
}

.tab-btn:active {
  transform: scale(.96);
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 14px;
  padding: 0 16px;
}

.task-card {
  display: flex;
  min-height: 68px;
  align-items: center;
  gap: 11px;
  padding: 11px 12px;
  border: 1px solid rgba(255,255,255,.4);
  border-radius: 17px;
  background: linear-gradient(110deg, rgba(255,255,255,.86), rgba(247,244,255,.72));
  box-shadow: 0 8px 22px rgba(33, 43, 127, .13), inset 0 1px 0 rgba(255,255,255,.6);
  color: #554b73;
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}

.task-icon {
  display: flex;
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: color-mix(in srgb, var(--task-color) 15%, white);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--task-color) 20%, transparent);
  color: var(--task-color);
  font-size: 15px;
}

.task-info {
  min-width: 0;
  flex: 1;
}

.task-title {
  display: block;
  margin-bottom: 5px;
  overflow: hidden;
  color: #5f547d;
  font-size: 13px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.task-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.task-progress,
.reward {
  display: flex;
  align-items: center;
  gap: 3px;
  color: #948aa7;
  font-size: 9px;
  white-space: nowrap;
}

.reward.exp {
  color: #ee8a5d;
}

.reward.coins {
  color: #dfa142;
}

.task-action {
  flex-shrink: 0;
  padding: 7px 12px;
  border-radius: 999px;
  background: linear-gradient(135deg, #9779ed, #7155d8);
  box-shadow: 0 5px 13px rgba(101, 75, 195, .2);
  color: #fff;
  font-size: 11px;
  font-weight: 650;
  white-space: nowrap;
}

.task-done {
  flex-shrink: 0;
  color: #45caa5;
  font-size: 23px;
}

.activity-section {
  margin: 0 16px 20px;
  padding: 15px 14px 13px;
  border: 1px solid rgba(255,255,255,.16);
  border-radius: 19px;
  background: linear-gradient(120deg, rgba(124, 156, 255, .3), rgba(105, 126, 229, .25));
  box-shadow: inset 0 1px 0 rgba(255,255,255,.12), 0 10px 24px rgba(26, 40, 124, .13);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}

.activity-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 12px;
}

.activity-title {
  color: #fff;
  font-size: 14px;
  font-weight: 750;
}

.activity-header p {
  margin-top: 3px;
  color: rgba(255,255,255,.55);
  font-size: 9px;
}

.activity-value {
  padding: 4px 9px;
  border: 1px solid rgba(255,255,255,.16);
  border-radius: 999px;
  background: rgba(255,255,255,.1);
  color: #ffdc75;
  font-size: 11px;
  font-weight: 750;
}

.reward-track {
  position: relative;
  height: 72px;
  margin: 0 4px;
}

.activity-bar {
  position: absolute;
  z-index: 1;
  top: 29px;
  left: 2%;
  right: 2%;
  height: 7px;
  overflow: hidden;
  border: 1px solid rgba(255,255,255,.14);
  border-radius: 999px;
  background: rgba(36, 48, 143, .28);
  box-shadow: inset 0 2px 4px rgba(28, 36, 105, .22);
}

.activity-fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #ffd366 0%, #ffb84f 55%, #e58a4d 100%);
  box-shadow: 0 0 10px rgba(255, 195, 87, .65);
  transition: width .5s ease;
}

.milestone {
  --chest-dark: #8f6232;
  --chest-main: #d99b49;
  --chest-light: #ffc767;
  --chest-width: 30px;
  --chest-height: 27px;
  position: absolute;
  z-index: 3;
  top: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  transform: translateX(-50%);
}

.milestone.first {
  transform: translateX(-20%);
}

.milestone.last {
  transform: translateX(-80%);
}

.tone-blue {
  --chest-dark: #414e86;
  --chest-main: #6777b8;
  --chest-light: #8da0dc;
  --chest-width: 34px;
  --chest-height: 30px;
}

.tone-copper {
  --chest-dark: #88482f;
  --chest-main: #cf7348;
  --chest-light: #f09a67;
  --chest-width: 38px;
  --chest-height: 34px;
}

.tone-orange {
  --chest-dark: #8f4829;
  --chest-main: #db7542;
  --chest-light: #f5a15f;
  --chest-width: 43px;
  --chest-height: 38px;
}

.tone-purple {
  --chest-dark: #5a357c;
  --chest-main: #8a50a9;
  --chest-light: #bd72cf;
  --chest-width: 50px;
  --chest-height: 43px;
}

.treasure-chest {
  position: relative;
  width: var(--chest-width);
  height: var(--chest-height);
  margin-top: calc(43px - var(--chest-height));
  filter: drop-shadow(0 5px 5px rgba(24, 30, 94, .28));
  transition: transform .25s ease, filter .25s ease;
}

.grand .treasure-chest {
  filter: drop-shadow(0 7px 7px rgba(74, 35, 111, .34));
}

.chest-lid {
  position: absolute;
  z-index: 3;
  top: 1px;
  left: 3px;
  width: calc(100% - 6px);
  height: 42%;
  border: 2px solid var(--chest-dark);
  border-radius: 9px 9px 3px 3px;
  background: linear-gradient(180deg, var(--chest-light), var(--chest-main));
  box-shadow: inset 0 2px 2px rgba(255,255,255,.3);
}

.chest-body {
  position: absolute;
  z-index: 2;
  right: 0;
  bottom: 0;
  left: 0;
  height: 64%;
  border: 2px solid var(--chest-dark);
  border-radius: 4px 4px 8px 8px;
  background: linear-gradient(145deg, var(--chest-light), var(--chest-main) 58%, var(--chest-dark));
  box-shadow: inset 0 2px 2px rgba(255,255,255,.25);
}

.chest-band {
  position: absolute;
  z-index: 4;
  top: 2px;
  bottom: 1px;
  left: 50%;
  width: 7px;
  border-right: 1px solid rgba(72,43,37,.35);
  border-left: 1px solid rgba(255,255,255,.25);
  background: var(--chest-dark);
  transform: translateX(-50%);
}

.chest-lock {
  position: absolute;
  z-index: 5;
  top: 43%;
  left: 50%;
  display: flex;
  width: clamp(9px, 31%, 14px);
  height: clamp(9px, 31%, 14px);
  align-items: center;
  justify-content: center;
  border: 1px solid #8c6129;
  border-radius: 3px;
  background: #ffd766;
  color: #765124;
  font-size: 6px;
  transform: translateX(-50%);
}

.milestone-value {
  margin-top: 4px;
  color: rgba(255,255,255,.7);
  font-size: 10px;
  font-weight: 650;
}

.chest-glow {
  position: absolute;
  top: 5px;
  width: 36px;
  height: 28px;
  border-radius: 50%;
  background: rgba(255, 211, 102, .5);
  filter: blur(10px);
  opacity: 0;
}

.milestone.reached .chest-glow,
.milestone.next .chest-glow {
  opacity: .72;
}

.milestone.reached .treasure-chest {
  filter: drop-shadow(0 5px 6px rgba(255, 198, 77, .35));
}

.milestone.reached .milestone-value {
  color: #ffdf80;
}

.milestone.next .treasure-chest {
  animation: chestPulse 2.2s ease-in-out infinite;
}

@media (max-height: 760px) {
  .task-card {
    min-height: 62px;
    padding-top: 8px;
    padding-bottom: 8px;
  }

  .task-icon {
    width: 36px;
    height: 36px;
  }
}

@keyframes chestPulse {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-3px) scale(1.04); }
}
</style>
