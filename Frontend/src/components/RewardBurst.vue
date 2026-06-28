<script setup>
defineProps({
  active: { type: Boolean, default: false },
  type: { type: String, default: 'coin' },
})
</script>

<template>
  <Transition name="burst-fade">
    <div v-if="active" class="reward-burst" aria-hidden="true">
      <span v-for="i in 12" :key="i" class="coin" :style="{ '--i': i, '--delay': `${i * 0.05}s` }">
        <font-awesome-icon :icon="type === 'coin' ? 'coins' : 'bolt'" />
      </span>
    </div>
  </Transition>
</template>

<style scoped>
.reward-burst {
  position: fixed;
  inset: 0;
  z-index: 200;
  pointer-events: none;
  display: flex;
  align-items: center;
  justify-content: center;
}

.coin {
  position: absolute;
  font-size: 22px;
  color: #fbbf24;
  opacity: 0;
  animation: fly-coin 1.1s ease-out forwards;
  animation-delay: var(--delay);
}

@keyframes fly-coin {
  0% {
    opacity: 1;
    transform: translate(0, 0) scale(1);
  }
  100% {
    opacity: 0;
    transform:
      translate(
        calc(cos(var(--i) * 30deg) * 120px),
        calc(sin(var(--i) * 30deg) * -140px - 40px)
      )
      scale(0.4);
  }
}

/* fallback without trig - use rotate trick */
.coin {
  animation: fly-coin-simple 1.1s ease-out forwards;
  animation-delay: var(--delay);
}

@keyframes fly-coin-simple {
  0% { opacity: 1; transform: translate(0, 0) scale(1); }
  100% {
    opacity: 0;
    transform: rotate(calc(var(--i) * 30deg)) translateY(-120px) scale(0.3);
  }
}

.burst-fade-enter-active,
.burst-fade-leave-active { transition: opacity 0.3s; }
.burst-fade-enter-from,
.burst-fade-leave-to { opacity: 0; }
</style>
