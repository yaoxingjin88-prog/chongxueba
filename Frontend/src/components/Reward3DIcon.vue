<script setup>
import { computed } from 'vue'
import { rewardChestTier4, rewardTrophy } from '../config/ossAssets.js'

const props = defineProps({
  variant: {
    type: String,
    default: 'chest',
    validator: (v) => ['trophy', 'chest'].includes(v),
  },
  size: { type: Number, default: 120 },
  floating: { type: Boolean, default: true },
  glowing: { type: Boolean, default: false },
  open: { type: Boolean, default: false },
})

const imgSrc = computed(() => (props.variant === 'chest' ? rewardChestTier4 : rewardTrophy))

const boxStyle = computed(() => {
  const w = props.size
  if (props.variant === 'trophy') {
    return { width: `${w}px`, height: `${Math.round(w * 1.85)}px` }
  }
  return { width: `${w}px`, height: `${w}px` }
})
</script>

<template>
  <div
    class="reward-3d"
    :class="[variant, { floating, glowing, open }]"
    :style="boxStyle"
    aria-hidden="true"
  >
    <div class="reward-glow" />
    <div class="reward-frame">
      <img
        class="reward-img reward-img--solo"
        :src="imgSrc"
        alt=""
        draggable="false"
      />
    </div>
    <div v-if="open && variant === 'chest'" class="open-spark">
      <span v-for="i in 6" :key="i" class="spark-dot" :style="{ '--i': i }" />
    </div>
  </div>
</template>

<style scoped>
.reward-3d {
  position: relative;
  flex-shrink: 0;
}

.reward-glow {
  position: absolute;
  inset: 5%;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(251, 191, 36, 0.38), rgba(123, 97, 255, 0.1) 58%, transparent 75%);
  filter: blur(10px);
  opacity: 0;
  transition: opacity 0.35s;
}

.reward-3d.glowing .reward-glow,
.reward-3d.open .reward-glow {
  opacity: 1;
  animation: glow-pulse 2.4s ease-in-out infinite;
}

.reward-frame {
  position: relative;
  z-index: 2;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.reward-3d.trophy .reward-frame {
  overflow: visible;
}

.reward-img {
  position: absolute;
  top: 50%;
  height: 112%;
  width: 200%;
  max-width: none;
  transform: translateY(-50%);
  object-fit: contain;
  user-select: none;
  pointer-events: none;
  filter: drop-shadow(0 10px 18px rgba(0, 0, 0, 0.4));
}

.reward-img--solo {
  position: static;
  width: 100%;
  height: 100%;
  transform: none;
}

.reward-3d.trophy .reward-img--solo {
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center center;
  filter: drop-shadow(0 6px 14px rgba(0, 0, 0, 0.28));
}

.reward-3d.floating .reward-frame {
  animation: asset-float 3.8s ease-in-out infinite;
}

.reward-3d.open .reward-frame {
  animation: chest-pop 0.55s cubic-bezier(0.34, 1.4, 0.64, 1);
}

.open-spark {
  position: absolute;
  top: 36%;
  left: 50%;
  z-index: 3;
  width: 0;
  height: 0;
}

.spark-dot {
  position: absolute;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #fde047;
  box-shadow: 0 0 10px #fbbf24;
  animation: spark-burst 0.75s ease-out forwards;
  animation-delay: calc(var(--i) * 0.05s);
}

@keyframes asset-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-7px); }
}

@keyframes glow-pulse {
  0%, 100% { transform: scale(1); opacity: 0.75; }
  50% { transform: scale(1.08); opacity: 1; }
}

@keyframes chest-pop {
  0% { transform: scale(1); }
  40% { transform: scale(1.07) translateY(-5px); }
  100% { transform: scale(1); }
}

@keyframes spark-burst {
  to {
    transform: rotate(calc(var(--i) * 60deg)) translateY(-48px);
    opacity: 0;
  }
}
</style>
