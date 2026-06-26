<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { LIVE2D_CONFIG } from '../config/live2d'

const props = defineProps({
  modelPath: { type: String, default: LIVE2D_CONFIG.modelPath },
  scaleFactor: { type: Number, default: LIVE2D_CONFIG.scaleFactor },
  anchorY: { type: Number, default: LIVE2D_CONFIG.anchorY },
  idleGroup: { type: String, default: LIVE2D_CONFIG.idleGroup },
  tapGroup: { type: String, default: LIVE2D_CONFIG.tapGroup },
  /** 顶部留白，防止头部被裁切 */
  topPadding: { type: Number, default: 28 },
  /** 底部留白，为草地岛屿留空间 */
  bottomPadding: { type: Number, default: 56 },
})

const canvasWrap = ref(null)
const failed = ref(false)
const loading = ref(true)

let app = null
let model = null
let fitModel = null
let idleTimer = null

function playIdle() {
  if (!model) return
  try {
    model.motion(props.idleGroup)
  } catch {
    /* 忽略 */
  }
}

function playTap() {
  if (!model) return
  try {
    model.motion(props.tapGroup)
  } catch {
    playIdle()
  }
}

onMounted(async () => {
  await nextTick()
  if (!canvasWrap.value) return

  if (!window.Live2DCubismCore) {
    console.warn('[Live2D] Cubism Core 未加载，请检查 /live2d/live2dcubismcore.min.js')
    failed.value = true
    loading.value = false
    return
  }

  try {
    const PIXI = await import('pixi.js')
    window.PIXI = PIXI

    const { Live2DModel } = await import('pixi-live2d-display/cubism4')
    Live2DModel.registerTicker(PIXI.Ticker)

    app = new PIXI.Application({
      resizeTo: canvasWrap.value,
      backgroundAlpha: 0,
      antialias: true,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      autoDensity: true,
    })
    canvasWrap.value.appendChild(app.view)

    // autoInteract 开启视线跟随；Pixi v6 与 pixi-live2d-display 兼容
    model = await Live2DModel.from(props.modelPath, { autoInteract: true })
    model.interactive = true
    model.buttonMode = true
    app.stage.addChild(model)

    fitModel = () => {
      if (!canvasWrap.value || !model) return
      const w = canvasWrap.value.clientWidth
      const h = canvasWrap.value.clientHeight
      const topPad = props.topPadding
      const bottomPad = props.bottomPadding
      const availH = Math.max(h - topPad - bottomPad, 60)
      const availW = w * 0.94

      model.anchor.set(0.5, 1)
      const scale = Math.min(availH / model.height, availW / model.width) * props.scaleFactor
      model.scale.set(scale)
      model.position.set(w / 2, h - bottomPad)
    }

    fitModel()
    window.addEventListener('resize', fitModel)

    model.on('pointertap', () => {
      playTap()
      clearTimeout(idleTimer)
      idleTimer = setTimeout(playIdle, 3000)
    })

    playIdle()
    loading.value = false
  } catch (err) {
    console.warn('[Live2D] 模型加载失败:', err)
    failed.value = true
    loading.value = false
    app?.destroy(true, { children: true, texture: true })
    app = null
  }
})

onUnmounted(() => {
  clearTimeout(idleTimer)
  if (fitModel) window.removeEventListener('resize', fitModel)
  model = null
  if (app) {
    app.destroy(true, { children: true, texture: true })
    app = null
  }
})
</script>

<template>
  <div class="live2d-container">
    <div ref="canvasWrap" class="live2d-canvas" :class="{ hidden: failed }" />

    <div v-if="loading && !failed" class="live2d-state">
      <div class="loader" />
      <span>加载宠物中...</span>
    </div>

    <div v-if="failed" class="live2d-fallback">
      <div class="fallback-character">
        <div class="fox-face">🦊</div>
      </div>
      <p class="fallback-hint">Live2D 模型加载失败</p>
      <p class="fallback-sub">请检查 public/live2d/runtime/ 目录</p>
    </div>
  </div>
</template>

<style scoped>
.live2d-container {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 0;
}

.live2d-canvas {
  width: 100%;
  height: 100%;
}

.live2d-canvas.hidden {
  display: none;
}

.live2d-canvas :deep(canvas) {
  display: block;
  width: 100% !important;
  height: 100% !important;
}

.live2d-state {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 13px;
}

.loader {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(255, 255, 255, 0.2);
  border-top-color: #c084fc;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.live2d-fallback {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  padding-bottom: 20px;
}

.fallback-character {
  animation: breathe 3s ease-in-out infinite;
}

.fox-face {
  font-size: 88px;
  filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.15));
  line-height: 1;
}

.fallback-hint {
  margin-top: 8px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.85);
  font-weight: 500;
}

.fallback-sub {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 4px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes breathe {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-6px) scale(1.02); }
}
</style>
