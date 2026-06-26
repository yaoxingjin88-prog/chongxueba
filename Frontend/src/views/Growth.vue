<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { api } from '../api'

const router = useRouter()
const user = useUserStore()
const weekLabel = ref('本周报告')
const chartData = ref([])
const weekChangePercent = ref(25)
const weekTotalHours = ref(18.75)
const weekExpGain = ref(850)
const beatPercent = ref(92)
const maxValue = 3.2

const chartPoints = computed(() =>
  chartData.value.map((item, index) => ({
    ...item,
    x: 14 + index * (292 / Math.max(chartData.value.length - 1, 1)),
    y: 164 - (item.value / maxValue) * 112,
  })),
)

const linePoints = computed(() => chartPoints.value.map((point) => `${point.x},${point.y}`).join(' '))

const areaPath = computed(() => {
  if (!chartPoints.value.length) return ''
  return `M 14 164 L ${chartPoints.value.map((point) => `${point.x} ${point.y}`).join(' L ')} L 306 164 Z`
})

const lastPoint = computed(() => chartPoints.value[chartPoints.value.length - 1] || { x: 306, y: 164, day: '', value: 0 })

async function loadGrowth() {
  const data = await api.getGrowth()
  weekLabel.value = data.weekLabel
  weekChangePercent.value = data.weekChangePercent
  weekTotalHours.value = data.weekTotalHours
  weekExpGain.value = data.weekExpGain
  beatPercent.value = data.beatPercent
  chartData.value = data.chartData
}

function goBack() {
  router.push('/home')
}

onMounted(loadGrowth)
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
      <button class="week-selector" type="button">
        {{ weekLabel }}
        <font-awesome-icon icon="chevron-down" />
      </button>

      <section class="summary-cards" aria-label="本周数据摘要">
        <article class="summary-card">
          <span class="card-label">专注时长</span>
          <p class="card-value">{{ user.focusWeek }}</p>
          <p class="card-change">较上周 <strong>+{{ weekChangePercent }}%</strong></p>
        </article>
        <article class="summary-card">
          <span class="card-label">连续打卡</span>
          <p class="card-value">{{ user.streakDays }}<small>天</small></p>
          <p class="card-change">最长连续 {{ user.streakDays }} 天</p>
        </article>
      </section>

      <section class="trend-card">
        <div class="trend-heading">
          <div>
            <span class="section-kicker">学习统计</span>
            <h2>专注趋势</h2>
          </div>
          <span class="trend-total">本周 {{ weekTotalHours }}h</span>
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
          <div class="chart-labels">
            <span v-for="item in chartData" :key="item.day">{{ item.day }}</span>
          </div>
        </div>
      </section>

      <section class="pet-growth-card">
        <div class="pet-copy">
          <span class="section-kicker">宠物成长</span>
          <div class="level-row">
            <strong>Lv.{{ user.level }}</strong>
            <span>+{{ weekExpGain }} EXP</span>
          </div>
          <p>超过了 <b>{{ beatPercent }}%</b> 的用户</p>
        </div>

        <div class="fox-wrap" aria-label="小狐狸宠物">
          <span class="pet-spark spark-one">✦</span>
          <span class="pet-spark spark-two">✦</span>
          <svg class="fox" viewBox="0 0 180 135" role="img" aria-hidden="true">
            <defs>
              <linearGradient id="foxOrange" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0%" stop-color="#ffb45f" />
                <stop offset="100%" stop-color="#e56d35" />
              </linearGradient>
              <linearGradient id="foxTail" x1="0" x2="1">
                <stop offset="0%" stop-color="#dc6033" />
                <stop offset="72%" stop-color="#f39a4d" />
                <stop offset="100%" stop-color="#fff3dc" />
              </linearGradient>
            </defs>
            <ellipse cx="94" cy="123" rx="58" ry="8" fill="#7658b8" opacity=".16" />
            <path d="M128 96 C171 70 174 111 141 121 C126 126 116 117 121 109 Z" fill="url(#foxTail)" />
            <ellipse cx="94" cy="96" rx="36" ry="28" fill="url(#foxOrange)" />
            <path d="M67 46 L72 8 L98 36 Z" fill="#d75d32" />
            <path d="M112 38 L139 10 L136 53 Z" fill="#d75d32" />
            <path d="M72 18 L77 39 L91 35 Z" fill="#743b4b" opacity=".75" />
            <path d="M130 20 L117 39 L133 44 Z" fill="#743b4b" opacity=".75" />
            <ellipse cx="103" cy="58" rx="41" ry="35" fill="url(#foxOrange)" />
            <path d="M69 62 C78 91 121 96 139 64 C128 72 118 72 103 65 C89 74 79 73 69 62 Z" fill="#fff0d7" />
            <ellipse cx="87" cy="57" rx="3.5" ry="5" fill="#543543" />
            <ellipse cx="120" cy="57" rx="3.5" ry="5" fill="#543543" />
            <path d="M99 68 Q104 73 109 68" fill="none" stroke="#70404a" stroke-width="2.5" stroke-linecap="round" />
            <path d="M100 64 Q104 60 108 64 Q104 68 100 64" fill="#69404b" />
            <path d="M77 90 Q67 119 76 121" fill="none" stroke="#b84f32" stroke-width="9" stroke-linecap="round" />
            <path d="M110 96 Q117 119 113 122" fill="none" stroke="#b84f32" stroke-width="9" stroke-linecap="round" />
          </svg>
        </div>

        <button class="share-mini" type="button" aria-label="分享成长记录">
          <font-awesome-icon icon="share-nodes" />
        </button>
      </section>

      <button class="share-btn" type="button">
        <font-awesome-icon icon="share-nodes" />
        生成分享卡片
      </button>
    </main>
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
.pet-growth-card {
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
  grid-template-columns: repeat(8, 1fr);
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

.pet-growth-card {
  position: relative;
  display: flex;
  min-height: clamp(160px, 21vh, 190px);
  align-items: center;
  overflow: hidden;
  padding: 16px;
  border-radius: 18px;
}

.pet-growth-card::before {
  content: '';
  position: absolute;
  width: 170px;
  height: 170px;
  right: -35px;
  bottom: -58px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(164, 132, 240, .18), transparent 68%);
}

.pet-copy {
  position: relative;
  z-index: 2;
  width: 52%;
}

.level-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-top: 7px;
}

.level-row strong {
  color: #7455dc;
  font-size: 25px;
  font-weight: 850;
  letter-spacing: -.5px;
}

.level-row span {
  color: #29b995;
  font-size: 10px;
  font-weight: 700;
}

.pet-copy p {
  margin-top: 9px;
  color: #81769a;
  font-size: 11px;
}

.pet-copy b {
  color: #765add;
}

.fox-wrap {
  position: absolute;
  right: 21px;
  bottom: 4px;
  width: clamp(154px, 39vw, 174px);
  height: clamp(121px, 15.5vh, 142px);
}

.fox {
  width: 100%;
  height: 100%;
  overflow: visible;
  filter: drop-shadow(0 8px 8px rgba(111, 65, 55, .14));
}

.pet-spark {
  position: absolute;
  z-index: 2;
  color: #9b78e7;
  font-size: 11px;
  animation: petSpark 2.6s ease-in-out infinite;
}

.spark-one {
  top: 14px;
  right: 12px;
}

.spark-two {
  top: 42px;
  left: 7px;
  animation-delay: .8s;
}

.share-mini {
  position: absolute;
  z-index: 4;
  top: 12px;
  right: 12px;
  color: #9a87cd;
  font-size: 11px;
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

  .pet-growth-card {
    min-height: 128px;
  }

  .fox-wrap {
    width: 136px;
    height: 108px;
  }
}

@keyframes petSpark {
  0%, 100% { opacity: .4; transform: scale(.8) rotate(0); }
  50% { opacity: 1; transform: scale(1.15) rotate(20deg); }
}
</style>
