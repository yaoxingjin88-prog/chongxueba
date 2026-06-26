<script setup>
import { useRouter } from 'vue-router'
import { FontAwesomeIcon } from '../plugins/fontawesome'

defineProps({
  title: { type: String, default: '' },
  showBack: { type: Boolean, default: true },
  transparent: { type: Boolean, default: false },
})

const router = useRouter()

function goBack() {
  router.back()
}
</script>

<template>
  <header class="page-header" :class="{ transparent }">
    <div class="header-left">
      <button v-if="showBack" class="back-btn" @click="goBack">
        <font-awesome-icon icon="chevron-left" />
      </button>
      <slot name="left" />
    </div>
    <h1 v-if="title" class="header-title">{{ title }}</h1>
    <div class="header-right">
      <slot name="right" />
    </div>
  </header>
</template>

<style scoped>
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: var(--header-height);
  padding: 0 16px;
  padding-top: env(safe-area-inset-top, 0px);
  position: relative;
  z-index: 10;
  flex-shrink: 0;
}

.page-header.transparent {
  background: transparent;
}

.header-left,
.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 60px;
}

.header-right {
  justify-content: flex-end;
}

.header-title {
  font-size: 17px;
  font-weight: 600;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}

.back-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  font-size: 14px;
}
</style>
