<script setup>
import { computed } from 'vue'
import {
  rewardChestTier1,
  rewardChestTier2,
  rewardChestTier3,
  rewardChestTier4,
} from '../config/ossAssets.js'

const TIER_IMAGES = {
  1: rewardChestTier1,
  2: rewardChestTier2,
  3: rewardChestTier3,
  4: rewardChestTier4,
}

const props = defineProps({
  tier: { type: Number, default: 1 },
  size: { type: Number, default: 168 },
  floating: { type: Boolean, default: true },
  glowing: { type: Boolean, default: false },
  open: { type: Boolean, default: false },
  mini: { type: Boolean, default: false },
})

const chestSrc = computed(() => {
  const t = Math.min(4, Math.max(1, props.tier))
  return TIER_IMAGES[t]
})
</script>

<template>
  <div
    class="chest-tier"
    :class="{ floating, glowing, open, mini }"
    :style="{ width: `${size}px`, height: `${size}px` }"
    aria-hidden="true"
  >
    <div v-if="!mini" class="chest-glow" />
    <div class="chest-frame">
      <img
        class="chest-img"
        :src="chestSrc"
        alt=""
        draggable="false"
      />
    </div>
    <div v-if="open && !mini" class="open-spark">
      <span v-for="i in 6" :key="i" class="spark-dot" :style="{ '--i': i }" />
    </div>
  </div>
</template>

<style scoped>
.chest-tier {
  position: relative;
  flex-shrink: 0;
}

.chest-glow {
  position: absolute;
  inset: 5%;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(251, 191, 36, 0.38), rgba(123, 97, 255, 0.1) 58%, transparent 75%);
  filter: blur(10px);
  opacity: 0;
  transition: opacity 0.35s;
}

.chest-tier.glowing .chest-glow,
.chest-tier.open .chest-glow {
  opacity: 1;
  animation: glow-pulse 2.4s ease-in-out infinite;
}

.chest-frame {
  position: relative;
  z-index: 2;
  width: 100%;
  height: 100%;
}

.chest-img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  user-select: none;
  pointer-events: none;
  filter: drop-shadow(0 10px 18px rgba(0, 0, 0, 0.35));
}

.chest-tier.mini .chest-img {
  filter: drop-shadow(0 3px 6px rgba(0, 0, 0, 0.28));
}

.chest-tier.floating .chest-frame {
  animation: asset-float 3.8s ease-in-out infinite;
}

.chest-tier.open .chest-frame {
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
