<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { api } from '../api'
import GrowthShareSheet from '../components/GrowthShareSheet.vue'
import stageEgg from '../assets/pet-stage-egg.png'
import stageBaby from '../assets/pet-stage-baby.png'
import stageGrowth from '../assets/home-fox-island.png'
import stageMature from '../assets/pet-stage-mature.png'

const router = useRouter()
const user = useUserStore()

const period = ref('week')
const periodMenuOpen = ref(false)
const shareOpen = ref(false)
const toastMsg = ref('')
const loading = ref(false)

const periodOptions = [
  { key: 'week', label: '本周报告' },
  { key: 'month', label: '本月报告' },
]

const periodLabel = ref('本周报告')
const compareLabel = ref('较上周')
const trendLabel = ref('本周')
const focusDuration = ref(user.focusWeek)
const chartData = ref([])
const changePercent = ref(25)
const totalHours = ref(18.75)
const periodExpGain = ref(850)
const beatPercent = ref(92)
const maxStreakDays = ref(user.streakDays)
const petName = ref(user.petName)
const petLevel = ref(user.petLevel)
const petExp = ref(0)
const petExpMax = ref(1)
const currentStageKey = ref('growth')
const selectedStageKey = ref('growth')
const petEvolutionStages = ref([])

const petStages = [
  {
    key: 'egg',
    name: '星愿蛋',
    shortName: '蛋',
    level: 'Lv.1',
    image: stageEgg,
    description: '专注的每一分钟，都在唤醒蛋壳里的星光。',
  },
  {
    key: 'baby',
    name: '幼年小狐',
    shortName: '幼年',
    level: 'Lv.5',
    image: stageBaby,
    description: '好奇心旺盛，会陪你完成最初的学习任务。',
  },
  {
    key: 'growth',
    name: '成长小狐',
    shortName: '成长',
    level: 'Lv.15',
    image: stageGrowth,
    description: '已经掌握稳定的学习节奏，专注力持续成长。',
  },
  {
    key: 'mature',
    name: '学霸星狐',
    shortName: '成熟',
    level: 'Lv.30',
    image: stageMature,
    description: '完成长期目标后进化，解锁专属星光装扮。',
  },
]

const maxValue = computed(() => {
  const peak = Math.max(...chartData.value.map((item) => item.value), 0.5)
  return Math.ceil(peak * 1.25 * 10) / 10
})

const chartLabelStep = computed(() => {
  const len = chartData.value.length
  if (len <= 7) return 1
  return Math.ceil(len / 7)
})

const visibleChartLabels = computed(() =>
  chartData.value.filter((_, index) =>
    index === chartData.value.length - 1 || index % chartLabelStep.value === 0,
  ),
)

const changeText = computed(() => {
  const prefix = changePercent.value >= 0 ? '+' : ''
  return `${compareLabel.value} ${prefix}${changePercent.value}%`
})
const chartPoints = computed(() =>
  chartData.value.map((item, index) => ({
    ...item,
    x: 14 + index * (292 / Math.max(chartData.value.length - 1, 1)),
    y: 164 - (item.value / maxValue.value) * 112,
  })),
)

const linePoints = computed(() => chartPoints.value.map((point) => `${point.x},${point.y}`).join(' '))

const areaPath = computed(() => {
  if (!chartPoints.value.length) return ''
  return `M 14 164 L ${chartPoints.value.map((point) => `${point.x} ${point.y}`).join(' L ')} L 306 164 Z`
})

const lastPoint = computed(() => chartPoints.value[chartPoints.value.length - 1] || { x: 306, y: 164, day: '', value: 0 })
const selectedStage = computed(() => petStages.find((stage) => stage.key === selectedStageKey.value) || petStages[2])
const currentStageIndex = computed(() => Math.max(0, petStages.findIndex((stage) => stage.key === currentStageKey.value)))
const growthProgress = computed(() => Math.min(100, Math.round((petExp.value / Math.max(petExpMax.value, 1)) * 100)))
const nextStage = computed(() => petStages[currentStageIndex.value + 1] || null)

async function loadGrowth() {
  loading.value = true
  try {
    const [data, pet] = await Promise.all([
      api.getGrowth(period.value),
      api.getPet(),
    ])
    periodLabel.value = data.periodLabel
    compareLabel.value = data.compareLabel
    trendLabel.value = data.trendLabel
    focusDuration.value = data.focusDuration
    changePercent.value = data.changePercent
    totalHours.value = data.totalHours
    periodExpGain.value = data.periodExpGain
    beatPercent.value = data.beatPercent
    maxStreakDays.value = data.maxStreakDays
    chartData.value = data.chartData

    petName.value = pet.profile?.petName || user.petName
    petLevel.value = pet.profile?.level || user.petLevel
    petExp.value = pet.profile?.exp || 0
    petExpMax.value = pet.profile?.expMax || 1
    petEvolutionStages.value = pet.evolutionStages || []
    const activeIndex = pet.evolutionStages?.findIndex((stage) => stage.active) ?? 2
    currentStageKey.value = petStages[Math.max(activeIndex, 0)]?.key || 'growth'
    selectedStageKey.value = currentStageKey.value
  } catch (err) {
    showToast(err.message || '加载失败')
  } finally {
    loading.value = false
  }
}

async function selectPeriod(nextPeriod) {
  if (period.value === nextPeriod) {
    periodMenuOpen.value = false
    return
  }
  period.value = nextPeriod
  periodMenuOpen.value = false
  await loadGrowth()
}

function togglePeriodMenu() {
  periodMenuOpen.value = !periodMenuOpen.value
}

function closePeriodMenu(event) {
  if (periodMenuOpen.value && event?.target && !event.target.closest('.period-wrap')) {
    periodMenuOpen.value = false
  }
}

function showToast(message) {
  toastMsg.value = message
  window.setTimeout(() => {
    if (toastMsg.value === message) toastMsg.value = ''
  }, 2200)
}

function openShare() {
  shareOpen.value = true
}

function getStageStatus(index) {
  if (index === currentStageIndex.value) return 'current'
  if (petEvolutionStages.value[index]?.locked || index > currentStageIndex.value) return 'locked'
  return 'unlocked'
}

function selectStage(stage) {
  selectedStageKey.value = stage.key
}

function goBack() {
  router.push('/home')
}

onMounted(() => {
  loadGrowth()
  document.addEventListener('click', closePeriodMenu)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', closePeriodMenu)
})
</script>

<template>
  <div class="growth page">
    <div class="report-bg" aria-hidden="true">
      <div class="report-stars" />
      <div class="report-glow glow-left" />
      <div class="report-glow glow-right" />
      <div class="report-cloud cloud-one" />
      <div class="report-cloud cloud-two" />
    </div>

    <header class="growth-header">
      <button class="back-btn" type="button" aria-label="返回首页" @click="goBack">
        <font-awesome-icon icon="chevron-left" />
      </button>
      <h1>成长报告</h1>
      <span class="header-space" />
    </header>

    <main class="report-content">
      <div class="period-wrap" @click.stop>
        <button class="week-selector" type="button" @click.stop="togglePeriodMenu">
          {{ periodLabel }}
          <font-awesome-icon :icon="periodMenuOpen ? 'chevron-down' : 'chevron-down'" />
        </button>
        <div v-if="periodMenuOpen" class="period-menu">
          <button
            v-for="item in periodOptions"
            :key="item.key"
            type="button"
            class="period-option"
            :class="{ active: period === item.key }"
            @click="selectPeriod(item.key)"
          >
            {{ item.label }}
          </button>
        </div>
      </div>

      <section class="summary-cards" :aria-label="`${periodLabel}数据摘要`">
        <article class="summary-card">
          <span class="card-label">专注时长</span>
          <p class="card-value">{{ focusDuration }}</p>
          <p class="card-change"><strong>{{ changeText }}</strong></p>
        </article>
        <article class="summary-card">
          <span class="card-label">连续打卡</span>
          <p class="card-value">{{ user.streakDays }}<small>天</small></p>
          <p class="card-change">最长连续 {{ maxStreakDays }} 天</p>
        </article>
      </section>

      <section class="trend-card">
        <div class="trend-heading">
          <div>
            <span class="section-kicker">学习统计</span>
            <h2>专注趋势</h2>
          </div>
          <span class="trend-total">{{ trendLabel }} {{ totalHours }}h</span>
        </div>

        <div class="chart-wrap">
          <div class="chart-tip" v-if="lastPoint" :style="{ left: `${(lastPoint.x / 320) * 100 - 8}%` }">
            <strong>{{ lastPoint.day }}</strong>
            <span>{{ lastPoint.value }}h</span>
          </div>
          <svg class="line-chart" viewBox="0 0 320 180" role="img" aria-label="5月12日至19日专注时长趋势">
            <defs>
              <linearGradient id="trendArea" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stop-color="#8668ed" stop-opacity=".34" />
                <stop offset="100%" stop-color="#8668ed" stop-opacity=".02" />
              </linearGradient>
              <filter id="lineGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <line v-for="lineY in [35, 78, 121, 164]" :key="lineY" x1="14" x2="306" :y1="lineY" :y2="lineY" class="grid-line" />
            <path :d="areaPath" fill="url(#trendArea)" />
            <polyline :points="linePoints" class="trend-line" filter="url(#lineGlow)" />
            <circle
              v-for="point in chartPoints"
              :key="point.day"
              :cx="point.x"
              :cy="point.y"
              r="3.7"
              class="trend-point"
            />
          </svg>
          <div class="chart-labels" :style="{ gridTemplateColumns: `repeat(${visibleChartLabels.length}, 1fr)` }">
            <span v-for="item in visibleChartLabels" :key="item.day">{{ item.day }}</span>
          </div>
        </div>
      </section>

      <section class="evolution-card" aria-labelledby="pet-growth-title">
        <div class="evolution-heading">
          <div>
            <span class="section-kicker">宠物成长</span>
            <h2 id="pet-growth-title">{{ petName }}的成长档案</h2>
          </div>
          <span class="current-stage-badge">当前 · {{ petStages[currentStageIndex].shortName }}</span>
        </div>

        <div class="evolution-hero">
          <div
            class="selected-stage-visual"
            :class="{ locked: getStageStatus(petStages.indexOf(selectedStage)) === 'locked' }"
          >
            <span class="stage-aura" aria-hidden="true" />
            <img :src="selectedStage.image" :alt="selectedStage.name">
          </div>

          <div class="selected-stage-copy">
            <span class="stage-level">{{ selectedStage.level }} 解锁</span>
            <h3>{{ selectedStage.name }}</h3>
            <p>{{ selectedStage.description }}</p>
            <div class="growth-progress-copy">
              <span>Lv.{{ petLevel }}</span>
              <strong>{{ growthProgress }}%</strong>
            </div>
            <div class="growth-progress-track">
              <span :style="{ width: `${growthProgress}%` }" />
            </div>
            <small v-if="nextStage">距离 {{ nextStage.name }} 还需持续积累经验</small>
            <small v-else>已达到最高成长阶段</small>
          </div>
        </div>

        <div class="stage-gallery" aria-label="宠物四个成长阶段">
          <button
            v-for="(stage, index) in petStages"
            :key="stage.key"
            type="button"
            class="stage-card"
            :class="[getStageStatus(index), { selected: selectedStageKey === stage.key }]"
            @click="selectStage(stage)"
          >
            <span class="stage-thumb">
              <img :src="stage.image" alt="">
              <span v-if="getStageStatus(index) === 'locked'" class="stage-lock">
                <font-awesome-icon icon="lock" />
              </span>
              <span v-else-if="getStageStatus(index) === 'current'" class="stage-check">
                <font-awesome-icon icon="check" />
              </span>
            </span>
            <strong>{{ stage.shortName }}</strong>
            <small>{{ stage.level }}</small>
          </button>
        </div>

        <div class="evolution-note">
          <font-awesome-icon icon="star" />
          <span>{{ periodLabel.replace('报告', '') }}获得 <b>+{{ periodExpGain }} EXP</b>，成长速度超过 {{ beatPercent }}% 的用户</span>
        </div>
      </section>

      <button class="share-btn" type="button" :disabled="loading" @click="openShare">
        <font-awesome-icon icon="share-nodes" />
        生成分享卡片
      </button>
    </main>

    <GrowthShareSheet v-model="shareOpen" :period="period" @toast="showToast" />

    <Transition name="toast-fade">
      <div v-if="toastMsg" class="growth-toast">{{ toastMsg }}</div>
    </Transition>
  </div>
</template>

<style scoped>
.growth {
  isolation: isolate;
  background: #e9e4ff;
}

.report-bg {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.report-bg::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, #8b73ef 0%, #a08bf1 24%, #d8cef7 66%, #eee9fb 100%);
}

.report-stars {
  position: absolute;
  inset: 0;
  background-image:
    radial-gradient(1px 1px at 13% 9%, rgba(255,255,255,.9) 0%, transparent 100%),
    radial-gradient(1.5px 1.5px at 29% 17%, rgba(255,255,255,.7) 0%, transparent 100%),
    radial-gradient(1px 1px at 67% 8%, rgba(255,255,255,.85) 0%, transparent 100%),
    radial-gradient(1px 1px at 86% 24%, rgba(255,255,255,.7) 0%, transparent 100%),
    radial-gradient(1px 1px at 17% 54%, rgba(255,255,255,.6) 0%, transparent 100%),
    radial-gradient(1px 1px at 91% 63%, rgba(255,255,255,.7) 0%, transparent 100%);
  opacity: .8;
}

.report-glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(50px);
}

.glow-left {
  width: 240px;
  height: 240px;
  top: 18%;
  left: -35%;
  background: rgba(122, 183, 255, .38);
}

.glow-right {
  width: 250px;
  height: 250px;
  right: -36%;
  bottom: 8%;
  background: rgba(255, 218, 241, .38);
}

.report-cloud {
  position: absolute;
  height: 24px;
  border-radius: 999px;
  background: rgba(255,255,255,.2);
  filter: blur(1px);
}

.cloud-one {
  width: 90px;
  top: 12%;
  right: -10px;
}

.cloud-two {
  width: 120px;
  bottom: 23%;
  left: -38px;
}

.growth-header {
  position: relative;
  z-index: 5;
  display: grid;
  grid-template-columns: 36px 1fr 36px;
  align-items: center;
  padding: calc(16px + env(safe-area-inset-top, 0px)) 18px 8px;
}

.growth-header h1 {
  color: #fff;
  font-size: 19px;
  font-weight: 750;
  letter-spacing: .5px;
  text-align: center;
  text-shadow: 0 2px 10px rgba(80, 57, 165, .2);
}

.back-btn {
  display: flex;
  width: 32px;
  height: 32px;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  color: rgba(255,255,255,.95);
  font-size: 15px;
}

.back-btn:active {
  background: rgba(255,255,255,.14);
}

.report-content {
  position: relative;
  z-index: 4;
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  gap: 10px;
  overflow-y: auto;
  padding: 0 18px calc(var(--tab-height) + var(--safe-bottom) + 12px);
}

.week-selector {
  display: flex;
  width: max-content;
  align-items: center;
  gap: 6px;
  padding: 7px 12px;
  border: 1px solid rgba(255,255,255,.45);
  border-radius: 999px;
  background: rgba(255,255,255,.72);
  box-shadow: 0 5px 16px rgba(87, 66, 161, .1);
  color: #785fc1;
  font-size: 12px;
  font-weight: 650;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.period-wrap {
  position: relative;
  width: max-content;
}

.period-menu {
  position: absolute;
  z-index: 6;
  top: calc(100% + 6px);
  left: 0;
  min-width: 120px;
  padding: 6px;
  border-radius: 14px;
  background: rgba(255,255,255,.95);
  border: 1px solid rgba(120, 95, 193, .15);
  box-shadow: 0 10px 24px rgba(83, 62, 153, .18);
}

.period-option {
  display: block;
  width: 100%;
  padding: 9px 12px;
  border-radius: 10px;
  text-align: left;
  color: #6b5a96;
  font-size: 12px;
  font-weight: 650;
}

.period-option.active,
.period-option:active {
  color: #7255dd;
  background: rgba(126, 94, 224, .1);
}

.week-selector svg {
  font-size: 9px;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.summary-card,
.trend-card,
.evolution-card {
  border: 1px solid rgba(255,255,255,.58);
  background: linear-gradient(145deg, rgba(255,255,255,.82), rgba(250,248,255,.67));
  box-shadow: 0 10px 28px rgba(83, 62, 153, .12), inset 0 1px 0 rgba(255,255,255,.6);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}

.summary-card {
  min-height: clamp(104px, 12.5vh, 120px);
  padding: 14px 13px;
  border-radius: 17px;
}

.card-label,
.section-kicker {
  color: #8375a6;
  font-size: 11px;
  font-weight: 650;
}

.card-value {
  margin-top: 7px;
  color: #7255dd;
  font-size: 20px;
  font-weight: 800;
  letter-spacing: -.5px;
  line-height: 1;
}

.card-value small {
  margin-left: 2px;
  font-size: 13px;
}

.card-change {
  margin-top: 7px;
  color: #8c82a5;
  font-size: 10px;
}

.card-change strong {
  color: #2bbd9b;
  font-weight: 750;
}

.trend-card {
  display: flex;
  min-height: clamp(240px, 32.5vh, 310px);
  flex-direction: column;
  padding: 13px 13px 10px;
  border-radius: 18px;
}

.trend-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  padding: 0 2px;
}

.trend-heading h2 {
  margin-top: 2px;
  color: #4d426e;
  font-size: 16px;
  font-weight: 760;
}

.trend-total {
  padding: 4px 8px;
  border-radius: 999px;
  background: rgba(126, 94, 224, .09);
  color: #8069c7;
  font-size: 10px;
}

.chart-wrap {
  position: relative;
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  margin-top: 4px;
}

.line-chart {
  display: block;
  width: 100%;
  min-height: 126px;
  flex: 1;
  overflow: visible;
}

.grid-line {
  stroke: rgba(105, 87, 151, .1);
  stroke-width: 1;
}

.trend-line {
  fill: none;
  stroke: #8565eb;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2.4;
}

.trend-point {
  fill: #fff;
  stroke: #8565eb;
  stroke-width: 2.3;
}

.chart-labels {
  display: grid;
  margin-top: -8px;
  color: #948aa9;
  font-size: 8px;
  text-align: center;
}

.chart-tip {
  position: absolute;
  z-index: 2;
  top: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 5px 8px;
  border-radius: 7px;
  background: linear-gradient(145deg, #8e70ef, #7051d4);
  box-shadow: 0 5px 12px rgba(98, 70, 190, .28);
  color: #fff;
  font-size: 9px;
  transform: translateX(-50%);
}

.chart-tip::after {
  content: '';
  position: absolute;
  bottom: -4px;
  width: 8px;
  height: 8px;
  background: #7455d7;
  transform: rotate(45deg);
}

.chart-tip strong,
.chart-tip span {
  position: relative;
  z-index: 1;
}

.chart-tip span {
  margin-top: 1px;
  opacity: .82;
}

.evolution-card {
  position: relative;
  overflow: hidden;
  flex-shrink: 0;
  padding: 16px;
  border-radius: 20px;
}

.evolution-card::before {
  content: '';
  position: absolute;
  width: 240px;
  height: 240px;
  top: 40px;
  left: -90px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(167, 139, 250, .18), transparent 68%);
  pointer-events: none;
}

.evolution-heading {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.evolution-heading h2 {
  margin-top: 3px;
  color: #4d426e;
  font-size: 17px;
  font-weight: 780;
}

.current-stage-badge {
  padding: 5px 9px;
  border: 1px solid rgba(132, 102, 225, .14);
  border-radius: 999px;
  color: #7457d4;
  background: rgba(139, 111, 225, .1);
  font-size: 10px;
  font-weight: 700;
}

.evolution-hero {
  position: relative;
  z-index: 2;
  display: grid;
  grid-template-columns: 46% 1fr;
  align-items: center;
  min-height: 184px;
  margin-top: 8px;
}

.selected-stage-visual {
  position: relative;
  display: grid;
  height: 174px;
  place-items: center;
}

.selected-stage-visual img {
  position: relative;
  z-index: 2;
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 10px 10px rgba(77, 55, 130, .16));
  animation: stageFloat 4.2s ease-in-out infinite;
}

.selected-stage-visual.locked img {
  filter: grayscale(.72) saturate(.45) opacity(.68);
}

.stage-aura {
  position: absolute;
  width: 112px;
  height: 112px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 231, 151, .42), rgba(158, 126, 234, .15) 52%, transparent 72%);
  filter: blur(7px);
}

.selected-stage-copy {
  min-width: 0;
  padding-left: 8px;
}

.stage-level {
  color: #a084df;
  font-size: 10px;
  font-weight: 700;
}

.selected-stage-copy h3 {
  margin-top: 3px;
  color: #5a477f;
  font-size: 20px;
  font-weight: 830;
}

.selected-stage-copy > p {
  min-height: 47px;
  margin-top: 7px;
  color: #84799c;
  font-size: 11px;
  line-height: 1.45;
}

.growth-progress-copy {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 10px;
  color: #765bd3;
  font-size: 10px;
  font-weight: 700;
}

.growth-progress-copy strong {
  color: #29b995;
}

.growth-progress-track {
  height: 7px;
  margin-top: 5px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(120, 91, 194, .1);
}

.growth-progress-track span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #9b7bf0, #6f52d8 62%, #35c5a2);
  box-shadow: 0 0 8px rgba(121, 88, 220, .32);
  transition: width .5s ease;
}

.selected-stage-copy small {
  display: block;
  margin-top: 6px;
  color: #a098b2;
  font-size: 8px;
  line-height: 1.35;
}

.stage-gallery {
  position: relative;
  z-index: 2;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 7px;
  margin-top: 5px;
}

.stage-card {
  min-width: 0;
  padding: 6px 4px 7px;
  border: 1px solid rgba(126, 100, 192, .08);
  border-radius: 14px;
  color: #776d90;
  background: rgba(255,255,255,.54);
  transition: transform .2s ease, border-color .2s ease, box-shadow .2s ease;
}

.stage-card.selected {
  border-color: rgba(119, 83, 220, .45);
  box-shadow: 0 7px 17px rgba(102, 72, 184, .13), inset 0 0 0 2px rgba(139, 106, 229, .08);
  transform: translateY(-2px);
}

.stage-card.current {
  color: #6f51d1;
  background: linear-gradient(155deg, rgba(247,243,255,.95), rgba(233,225,255,.8));
}

.stage-card.locked {
  color: #aaa3b8;
}

.stage-thumb {
  position: relative;
  display: block;
  height: 68px;
}

.stage-thumb img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 4px 5px rgba(65, 48, 101, .12));
}

.stage-card.locked .stage-thumb img {
  filter: grayscale(.8) saturate(.3) opacity(.52);
}

.stage-lock,
.stage-check {
  position: absolute;
  right: 1px;
  bottom: 2px;
  display: grid;
  width: 19px;
  height: 19px;
  place-items: center;
  border: 2px solid white;
  border-radius: 50%;
  color: white;
  font-size: 8px;
}

.stage-lock {
  background: #aaa2ba;
}

.stage-check {
  background: linear-gradient(135deg, #8d6ce7, #55c7a8);
}

.stage-card > strong,
.stage-card > small {
  display: block;
  overflow: hidden;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.stage-card > strong {
  margin-top: 3px;
  font-size: 10px;
}

.stage-card > small {
  margin-top: 2px;
  color: #aaa2b8;
  font-size: 8px;
}

.evolution-note {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 7px;
  margin-top: 11px;
  padding: 9px 11px;
  border-radius: 12px;
  color: #756a8c;
  background: rgba(121, 91, 205, .07);
  font-size: 10px;
}

.evolution-note svg {
  color: #f6b939;
}

.evolution-note b {
  color: #7254d8;
}

.share-btn {
  display: flex;
  width: 100%;
  min-height: 52px;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: 999px;
  background: linear-gradient(100deg, #9c7cf0 0%, #7c59e0 52%, #6848cd 100%);
  box-shadow: 0 10px 24px rgba(101, 72, 198, .24), inset 0 1px 0 rgba(255,255,255,.3);
  color: #fff;
  font-size: 15px;
  font-weight: 750;
  letter-spacing: .5px;
  transition: transform .2s ease;
}

.share-btn:active {
  transform: scale(.98);
}

.share-btn:disabled {
  opacity: 0.65;
}

.growth-toast {
  position: fixed;
  z-index: 600;
  left: 50%;
  bottom: calc(var(--tab-height) + var(--safe-bottom) + 24px);
  transform: translateX(-50%);
  max-width: calc(100% - 40px);
  padding: 10px 16px;
  border-radius: 999px;
  background: rgba(20, 16, 40, 0.88);
  color: #fff;
  font-size: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}

.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(8px);
}

@media (max-height: 760px) {
  .growth-header {
    padding-top: calc(10px + env(safe-area-inset-top, 0px));
    padding-bottom: 5px;
  }

  .report-content {
    gap: 8px;
  }

  .summary-card {
    min-height: 82px;
    padding: 11px 12px;
  }

  .trend-card {
    min-height: 210px;
    padding-top: 10px;
  }

  .line-chart {
    height: 105px;
  }

  .evolution-card {
    padding: 13px;
  }

  .evolution-hero {
    min-height: 164px;
  }

  .selected-stage-visual {
    height: 154px;
  }

  .stage-thumb {
    height: 58px;
  }
}

@keyframes stageFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}

@media (prefers-reduced-motion: reduce) {
  .selected-stage-visual img {
    animation: none;
  }
}
</style>
