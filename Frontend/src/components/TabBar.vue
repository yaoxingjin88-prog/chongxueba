<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { FontAwesomeIcon } from '../plugins/fontawesome'

const route = useRoute()
const router = useRouter()

const tabs = [
  { key: 'home', label: '首页', icon: 'house', path: '/home' },
  { key: 'study', label: '自习室', icon: 'book-open-reader', path: '/study-room' },
  { key: 'growth', label: '成长', icon: 'bolt', path: '/growth' },
  { key: 'mall', label: '商城', icon: 'bag-shopping', path: '/mall' },
  { key: 'profile', label: '我的', icon: 'user', path: '/profile' },
]

const activeTab = computed(() => route.meta.tab)
const isHome = computed(() => activeTab.value === 'home')

function navigate(path) {
  router.push(path)
}
</script>

<template>
  <nav class="tab-bar" :class="{ 'tab-bar--home': isHome }">
    <button
      v-for="tab in tabs"
      :key="tab.key"
      class="tab-item"
      :class="{ active: activeTab === tab.key }"
      @click="navigate(tab.path)"
    >
      <font-awesome-icon :icon="tab.icon" class="tab-icon" />
      <span class="tab-label">{{ tab.label }}</span>
    </button>
  </nav>
</template>

<style scoped>
.tab-bar {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 430px;
  height: calc(var(--tab-height) + var(--safe-bottom));
  padding-bottom: var(--safe-bottom);
  display: flex;
  align-items: center;
  justify-content: space-around;
  background: #ffffff;
  border-radius: 24px 24px 0 0;
  box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.08);
  z-index: 100;
}

.tab-bar--home {
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.tab-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 6px 10px;
  color: #c4c4c4;
  transition: color 0.2s;
}

.tab-item.active {
  color: #8b5cf6;
}

.tab-icon {
  font-size: 22px;
}

.tab-label {
  font-size: 10px;
  font-weight: 500;
}

.tab-item.active .tab-label {
  font-weight: 600;
}
</style>
