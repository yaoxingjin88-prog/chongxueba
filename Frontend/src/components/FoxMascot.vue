<script setup>
import foxImg from '../assets/mascot/fox-mascot.png'

defineProps({
  height: { type: Number, default: 118 },
  showStar: { type: Boolean, default: false },
  floating: { type: Boolean, default: true },
  /** 浅色卡片内用 circle，深色背景用 dark */
  variant: {
    type: String,
    default: 'dark',
    validator: (v) => ['dark', 'circle'].includes(v),
  },
})
</script>

<template>
  <div
    class="fox-mascot-wrap"
    :class="variant"
    :style="{ height: `${height}px`, width: variant === 'circle' ? `${height}px` : `${Math.round(height * 0.92)}px` }"
  >
    <div v-if="showStar" class="gold-star" aria-hidden="true">
      <font-awesome-icon icon="star" />
    </div>
    <div class="fox-stage" :class="{ floating, circle: variant === 'circle' }">
      <img class="fox-img" :src="foxImg" alt="" draggable="false" />
    </div>
  </div>
</template>

<style scoped>
.fox-mascot-wrap {
  position: relative;
  flex-shrink: 0;
}

.fox-stage {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

/* 签到页等深色区域 */
.fox-mascot-wrap.dark .fox-stage {
  background: radial-gradient(
    ellipse 90% 80% at 50% 72%,
    rgba(74, 64, 128, 0.6) 0%,
    transparent 100%
  );
  border-radius: 50%;
}

.fox-mascot-wrap.dark .fox-img {
  width: 108%;
  max-height: 112%;
  object-fit: contain;
  object-position: center bottom;
  filter: drop-shadow(0 8px 14px rgba(26, 24, 53, 0.3));
}

/* 任务详情等浅色卡片内：圆形裁切，正常显示 */
.fox-mascot-wrap.circle .fox-stage {
  border-radius: 50%;
  overflow: hidden;
  background: linear-gradient(180deg, #ebe6f8 0%, #ddd6f3 100%);
  box-shadow: inset 0 0 0 1px rgba(123, 97, 255, 0.12);
}

.fox-mascot-wrap.circle .fox-img {
  width: 118%;
  max-height: 115%;
  object-fit: contain;
  object-position: center bottom;
  mix-blend-mode: normal;
  filter: none;
}

.fox-img {
  user-select: none;
  pointer-events: none;
}

.fox-stage.floating {
  animation: fox-float 3.6s ease-in-out infinite;
}

.gold-star {
  position: absolute;
  top: 2%;
  right: -2%;
  z-index: 5;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: linear-gradient(145deg, #fef9c3, #fde047);
  color: #ca8a04;
  font-size: 13px;
  box-shadow: 0 4px 12px rgba(253, 224, 71, 0.45);
  animation: star-pulse 2.5s ease-in-out infinite;
}

@keyframes fox-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}

@keyframes star-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1) rotate(6deg); }
}
</style>
