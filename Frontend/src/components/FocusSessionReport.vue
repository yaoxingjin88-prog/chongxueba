<script setup>
import { computed } from 'vue'

const props = defineProps({
  report: { type: Object, default: null },
})

const emit = defineEmits(['close'])

const scoreLevel = computed(() => {
  const s = props.report?.focusScoreAvg ?? 0
  if (s >= 90) return { label: '超专注', color: '#34d399' }
  if (s >= 75) return { label: '良好', color: '#818cf8' }
  if (s >= 60) return { label: '一般', color: '#fbbf24' }
  return { label: '需加油', color: '#f87171' }
})

function formatDuration(sec) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}分${String(s).padStart(2, '0')}秒`
}
</script>

<template>
  <div v-if="report" class="report-backdrop" @click.self="emit('close')">
    <section class="report-card">
      <div class="stars" aria-hidden="true">
        <span v-for="n in 8" :key="n" class="star" />
      </div>

      <header class="report-head">
        <h2>专注感知报告 2.0</h2>
        <p>基于学习行为结构数据，非人脸识别</p>
      </header>

      <div class="score-hero">
        <span class="big-score" :style="{ color: scoreLevel.color }">{{ report.focusScoreAvg }}</span>
        <span class="score-tag" :style="{ background: scoreLevel.color }">{{ scoreLevel.label }}</span>
      </div>

      <ul class="stat-grid">
        <li>
          <span class="stat-val">{{ formatDuration(report.effectiveSeconds || 0) }}</span>
          <span class="stat-label">有效专注</span>
        </li>
        <li>
          <span class="stat-val">{{ report.lightDistractionCount ?? report.distractedCount ?? 0 }}</span>
          <span class="stat-label">轻微分心</span>
        </li>
        <li>
          <span class="stat-val">{{ formatDuration(report.awaySeconds || 0) }}</span>
          <span class="stat-label">离开页面</span>
        </li>
      </ul>

      <div v-if="report.deepDistractionCount > 0" class="deep-note">
        明显分心 {{ report.deepDistractionCount }} 次，已静默记录
      </div>

      <div v-if="report.expReward > 0" class="reward-box">
        <p class="reward-title">获得奖励</p>
        <div class="reward-row">
          <span>经验 +{{ report.expReward }}</span>
          <span v-if="report.expMultiplier > 1" class="bonus">×{{ report.expMultiplier }} 专注加成</span>
        </div>
        <div v-if="report.petExpReward > 0" class="reward-row sub">
          宠物经验 +{{ report.petExpReward }} · 专注力提升
        </div>
        <p v-if="report.taskCompleted" class="task-done">✓ 已完成今日专注任务</p>
      </div>
      <p v-else class="no-reward">有效专注时长不足，继续加油哦～</p>

      <p class="privacy-note">仅分析视频节奏、页面注意力等行为数据，不上传画面、不识别面部</p>

      <button type="button" class="close-btn" @click="emit('close')">知道了</button>
    </section>
  </div>
</template>

<style scoped>
.report-backdrop {
  position: fixed;
  inset: 0;
  z-index: 600;
  background: rgba(8, 12, 36, 0.62);
  backdrop-filter: blur(4px);
  display: grid;
  place-items: center;
  padding: 20px;
}

.report-card {
  position: relative;
  width: min(100%, 340px);
  border-radius: 22px;
  background: linear-gradient(165deg, #1e1b4b 0%, #312e81 45%, #1e1b4b 100%);
  padding: 22px 20px 18px;
  box-shadow: 0 20px 50px rgba(30, 27, 75, 0.45);
  border: 1px solid rgba(129, 140, 248, 0.2);
  overflow: hidden;
}

.stars {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.star {
  position: absolute;
  width: 2px;
  height: 2px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.5);
}

.star:nth-child(1) { top: 10%; left: 15%; }
.star:nth-child(2) { top: 20%; right: 20%; width: 3px; height: 3px; }
.star:nth-child(3) { top: 55%; left: 8%; }
.star:nth-child(4) { bottom: 30%; right: 12%; }
.star:nth-child(5) { top: 35%; left: 45%; opacity: 0.4; }
.star:nth-child(6) { bottom: 15%; left: 30%; }
.star:nth-child(7) { top: 8%; right: 35%; }
.star:nth-child(8) { bottom: 45%; right: 40%; opacity: 0.6; }

.report-head h2 {
  font-size: 18px;
  font-weight: 800;
  color: #e0e7ff;
  margin-bottom: 4px;
}

.report-head p {
  font-size: 11px;
  color: #a5b4fc;
}

.score-hero {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin: 18px 0;
}

.big-score {
  font-size: 48px;
  font-weight: 900;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.score-tag {
  padding: 4px 10px;
  border-radius: 999px;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
}

.stat-grid {
  list-style: none;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 12px;
}

.stat-grid li {
  text-align: center;
  padding: 10px 6px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(129, 140, 248, 0.15);
}

.stat-val {
  display: block;
  font-size: 13px;
  font-weight: 800;
  color: #e0e7ff;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 10px;
  color: #a5b4fc;
}

.deep-note {
  font-size: 10px;
  color: #fde68a;
  text-align: center;
  margin-bottom: 10px;
  padding: 6px 10px;
  border-radius: 10px;
  background: rgba(251, 191, 36, 0.1);
}

.reward-box {
  padding: 12px 14px;
  border-radius: 14px;
  background: rgba(129, 140, 248, 0.15);
  border: 1px solid rgba(129, 140, 248, 0.25);
  margin-bottom: 12px;
}

.reward-title {
  font-size: 13px;
  font-weight: 800;
  color: #c7d2fe;
  margin-bottom: 8px;
}

.reward-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 700;
  color: #e0e7ff;
}

.reward-row.sub {
  margin-top: 4px;
  font-size: 11px;
  font-weight: 600;
  color: #a5b4fc;
}

.bonus {
  padding: 2px 6px;
  border-radius: 999px;
  background: rgba(129, 140, 248, 0.25);
  color: #c7d2fe;
  font-size: 10px;
}

.task-done {
  margin-top: 8px;
  font-size: 11px;
  font-weight: 700;
  color: #6ee7b7;
}

.no-reward {
  font-size: 12px;
  color: #a5b4fc;
  text-align: center;
  margin-bottom: 12px;
}

.privacy-note {
  font-size: 10px;
  color: #818cf8;
  text-align: center;
  margin-bottom: 12px;
  line-height: 1.5;
}

.close-btn {
  width: 100%;
  padding: 12px;
  border-radius: 14px;
  background: linear-gradient(90deg, #6366f1, #818cf8);
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  border: none;
}
</style>
