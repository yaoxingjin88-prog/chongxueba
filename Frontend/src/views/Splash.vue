<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

onMounted(() => {
  setTimeout(() => router.replace('/home'), 2500)
})
</script>

<template>
  <div class="splash page">
    <div class="stars-bg" />
    <div class="splash-content">
      <div class="logo-wrap">
        <div class="logo-icon">
          <font-awesome-icon icon="cat" />
        </div>
        <h1 class="app-name">宠学霸</h1>
        <p class="slogan">AI电子宠物 · 自律养成平台</p>
      </div>

      <div class="island-scene">
        <div class="cloud cloud-1" />
        <div class="cloud cloud-2" />
        <div class="island">
          <div class="island-top" />
          <div class="pet-fox">🦊</div>
        </div>
        <div class="stars">
          <span v-for="i in 12" :key="i" class="star" :style="{ '--i': i }">✦</span>
        </div>
      </div>

      <div class="loading">
        <div class="loading-bar">
          <div class="loading-fill" />
        </div>
        <p class="loading-text">正在进入星光世界...</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.splash {
  background: linear-gradient(180deg, #1a0a3e 0%, #2d1b69 40%, #4a2c8a 70%, #7c5cbf 100%);
  align-items: center;
  justify-content: center;
}

.splash-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  padding: 40px 24px;
  z-index: 1;
}

.logo-wrap {
  text-align: center;
  margin-bottom: 40px;
}

.logo-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 16px;
  background: var(--gradient-btn);
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
  box-shadow: 0 8px 32px rgba(124, 92, 191, 0.6);
  animation: float 3s ease-in-out infinite;
}

.app-name {
  font-size: 36px;
  font-weight: 800;
  background: linear-gradient(135deg, #fff 0%, #e9d5ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: 4px;
}

.slogan {
  margin-top: 8px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  letter-spacing: 2px;
}

.island-scene {
  position: relative;
  width: 280px;
  height: 200px;
  margin-bottom: 60px;
}

.cloud {
  position: absolute;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 50px;
  filter: blur(1px);
}

.cloud-1 {
  width: 80px;
  height: 30px;
  top: 20px;
  left: 10px;
  animation: drift 6s ease-in-out infinite;
}

.cloud-2 {
  width: 60px;
  height: 24px;
  top: 40px;
  right: 20px;
  animation: drift 8s ease-in-out infinite reverse;
}

.island {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  animation: float 4s ease-in-out infinite;
}

.island-top {
  width: 160px;
  height: 60px;
  background: linear-gradient(180deg, #5b8a3c 0%, #3d6b28 100%);
  border-radius: 50% 50% 0 0;
  position: relative;
}

.island-top::after {
  content: '';
  position: absolute;
  bottom: -20px;
  left: -20px;
  right: -20px;
  height: 40px;
  background: linear-gradient(180deg, #4a3520 0%, #2d1f10 100%);
  border-radius: 0 0 50% 50%;
  clip-path: ellipse(100% 60% at 50% 0%);
}

.pet-fox {
  position: absolute;
  top: -30px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 48px;
  filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3));
}

.stars {
  position: absolute;
  inset: 0;
}

.star {
  position: absolute;
  font-size: 10px;
  color: rgba(255, 255, 255, 0.6);
  animation: twinkle 2s ease-in-out infinite;
  animation-delay: calc(var(--i) * 0.3s);
  top: calc(var(--i) * 7%);
  left: calc(var(--i) * 8%);
}

.loading {
  width: 200px;
  text-align: center;
}

.loading-bar {
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 12px;
}

.loading-fill {
  height: 100%;
  width: 0;
  background: var(--gradient-btn);
  border-radius: 2px;
  animation: load 2.5s ease forwards;
}

.loading-text {
  font-size: 12px;
  color: var(--text-muted);
}

@keyframes float {
  0%, 100% { transform: translateX(-50%) translateY(0); }
  50% { transform: translateX(-50%) translateY(-10px); }
}

@keyframes drift {
  0%, 100% { transform: translateX(0); }
  50% { transform: translateX(15px); }
}

@keyframes twinkle {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 1; }
}

@keyframes load {
  to { width: 100%; }
}
</style>
