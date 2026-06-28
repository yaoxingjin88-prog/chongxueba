<script setup>
import { computed } from 'vue'
import AiMascotBot from './AiMascotBot.vue'
import { STATUS_HINTS, STATUS_LABELS, FOCUS_LEVEL } from '../utils/focusMetrics.js'

const props = defineProps({
  score: { type: Number, default: 88 },
  status: { type: String, default: 'normal_focus' },
  loading: { type: Boolean, default: false },
  enabled: { type: Boolean, default: true },
})

const mood = computed(() => {
  if (!props.enabled) return 'sleep'
  if (props.status === FOCUS_LEVEL.DEEP_FOCUS || props.status === 'deep_focus') return 'happy'
  if (props.status === FOCUS_LEVEL.NORMAL_FOCUS || props.status === 'normal_focus' || props.status === 'focusing') return 'happy'
  if (props.status === FOCUS_LEVEL.DEEP_DISTRACTION || props.status === 'deep_distraction' || props.status === 'away') return 'sleep'
  return 'warn'
})

const statusLabel = computed(() => STATUS_LABELS[props.status] || '感知中')
const hint = computed(() => STATUS_HINTS[props.status] || '')
const isFocused = computed(() =>
  [FOCUS_LEVEL.DEEP_FOCUS, FOCUS_LEVEL.NORMAL_FOCUS, 'deep_focus', 'normal_focus', 'focusing'].includes(props.status),
)

const ringStyle = computed(() => {
  const deg = Math.round((props.score / 100) * 360)
  let color = '#818cf8'
  if (props.score >= 85) color = '#34d399'
  else if (props.score >= 65) color = '#a78bfa'
  else if (props.score >= 40) color = '#fbbf24'
  else color = '#f87171'
  return {
    background: `conic-gradient(${color} ${deg}deg, rgba(255,255,255,.12) 0deg)`,
  }
})
</script>

<template>
  <div v-if="enabled" class="focus-overlay">
    <div class="starry-dust" aria-hidden="true">
      <span v-for="n in 6" :key="n" class="star" :class="`s${n}`" />
    </div>

    <div class="score-ring" :style="ringStyle">
      <div class="score-inner">
        <span v-if="loading" class="score-value small">···</span>
        <template v-else>
          <span class="score-value">{{ score }}</span>
          <span class="score-unit">专注</span>
        </template>
      </div>
    </div>

    <div class="status-pill" :class="status">
      <span class="pill-dot" />
      {{ statusLabel }}
    </div>

    <Transition name="bubble">
      <div v-if="hint && !isFocused" class="ai-bubble">
        <div class="ai-avatar">
          <AiMascotBot :mood="mood" />
        </div>
        <p>{{ hint }}</p>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.focus-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 4;
  overflow: hidden;
}

.starry-dust {
  position: absolute;
  inset: 0;
}

.star {
  position: absolute;
  width: 2px;
  height: 2px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.7);
  animation: twinkle 3s ease-in-out infinite;
}

.s1 { top: 12%; left: 18%; animation-delay: 0s; }
.s2 { top: 28%; right: 22%; animation-delay: 0.6s; width: 3px; height: 3px; }
.s3 { bottom: 35%; left: 12%; animation-delay: 1.2s; }
.s4 { top: 45%; right: 8%; animation-delay: 0.3s; }
.s5 { bottom: 18%; right: 30%; animation-delay: 1.8s; opacity: 0.5; }
.s6 { top: 8%; right: 38%; animation-delay: 2.2s; }

@keyframes twinkle {
  0%, 100% { opacity: 0.3; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.4); }
}

.score-ring {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  padding: 2px;
  box-shadow: 0 0 16px rgba(129, 140, 248, 0.35);
}

.score-inner {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: rgba(12, 18, 48, 0.78);
  backdrop-filter: blur(8px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #e0e7ff;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.score-value {
  font-size: 15px;
  font-weight: 800;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.score-value.small {
  font-size: 12px;
  letter-spacing: 2px;
}

.score-unit {
  font-size: 7px;
  margin-top: 2px;
  opacity: 0.7;
  letter-spacing: 1px;
}

.status-pill {
  position: absolute;
  top: 64px;
  right: 8px;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 8px;
  font-weight: 700;
  background: rgba(12, 18, 48, 0.72);
  backdrop-filter: blur(6px);
  color: #c7d2fe;
  border: 1px solid rgba(129, 140, 248, 0.2);
}

.pill-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: currentColor;
  opacity: 0.9;
}

.status-pill.deep_focus { color: #6ee7b7; }
.status-pill.normal_focus,
.status-pill.focusing { color: #a5b4fc; }
.status-pill.light_distraction,
.status-pill.distracted { color: #fde68a; }
.status-pill.deep_distraction,
.status-pill.away { color: #fca5a5; }

.ai-bubble {
  position: absolute;
  left: 8px;
  bottom: 8px;
  right: 64px;
  display: flex;
  align-items: flex-end;
  gap: 6px;
}

.ai-avatar {
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  filter: drop-shadow(0 2px 8px rgba(99, 102, 241, 0.3));
}

.ai-bubble p {
  margin: 0;
  padding: 7px 11px;
  border-radius: 12px 12px 12px 3px;
  background: rgba(15, 23, 60, 0.88);
  backdrop-filter: blur(10px);
  color: #e0e7ff;
  font-size: 10px;
  line-height: 1.45;
  font-weight: 600;
  border: 1px solid rgba(129, 140, 248, 0.25);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.2);
}

.bubble-enter-active,
.bubble-leave-active {
  transition: opacity 0.25s, transform 0.25s;
}

.bubble-enter-from,
.bubble-leave-to {
  opacity: 0;
  transform: translateY(6px);
}
</style>
