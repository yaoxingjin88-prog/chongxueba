<script setup>
import { ref, watch, onMounted } from 'vue'
import { useUserStore } from '../stores/user'
import { api } from '../api'

const user = useUserStore()
const categories = ['全部', '皮肤', '家具', '道具', '限定']
const activeCategory = ref(0)
const items = ref([])
const loading = ref(true)

async function loadItems() {
  loading.value = true
  try {
    items.value = await api.getMallItems(activeCategory.value)
  } finally {
    loading.value = false
  }
}

async function purchase(item) {
  try {
    const data = await api.purchaseItem(item.id)
    user.coins = data.coins
    user.gems = data.gems
  } catch (err) {
    alert(err.message)
  }
}

watch(activeCategory, loadItems)
onMounted(loadItems)
</script>

<template>
  <div class="mall page">
    <div class="stars-bg" />

    <header class="mall-header">
      <h1>宠物商城</h1>
      <div class="balances">
        <div class="balance coins">
          <font-awesome-icon icon="coins" />
          {{ user.coins }}
        </div>
        <div class="balance gems">
          <font-awesome-icon icon="gem" />
          {{ user.gems }}
        </div>
      </div>
    </header>

    <div class="page-content">
      <div class="category-row">
        <button
          v-for="(cat, i) in categories"
          :key="cat"
          class="cat-btn"
          :class="{ active: activeCategory === i }"
          @click="activeCategory = i"
        >
          {{ cat }}
        </button>
      </div>

      <div class="product-grid">
        <div v-for="item in items" :key="item.id" class="product-card glass-card" @click="purchase(item)">
          <div class="product-image">{{ item.icon }}</div>
          <span class="product-name">{{ item.name }}</span>
          <div class="product-price">
            <font-awesome-icon :icon="item.type === 'coins' ? 'coins' : 'gem'" />
            {{ item.price }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mall-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  padding-top: calc(16px + env(safe-area-inset-top, 0px));
  position: relative;
  z-index: 10;
}

.mall-header h1 {
  font-size: 20px;
  font-weight: 700;
}

.balances {
  display: flex;
  gap: 10px;
}

.balance {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border-radius: var(--radius-full);
  font-size: 13px;
  font-weight: 600;
}

.balance.coins {
  background: rgba(251, 191, 36, 0.15);
  color: var(--gold);
}

.balance.gems {
  background: rgba(167, 139, 250, 0.15);
  color: var(--primary-light);
}

.category-row {
  display: flex;
  gap: 8px;
  padding: 0 16px;
  margin-bottom: 16px;
  overflow-x: auto;
}

.cat-btn {
  padding: 8px 16px;
  border-radius: var(--radius-full);
  font-size: 13px;
  white-space: nowrap;
  background: rgba(255, 255, 255, 0.06);
  color: var(--text-muted);
  border: 1px solid transparent;
}

.cat-btn.active {
  background: rgba(159, 122, 234, 0.3);
  color: #fff;
  border-color: var(--primary-light);
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  padding: 0 16px 20px;
}

.product-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 8px;
  gap: 6px;
  transition: transform 0.2s;
}

.product-card:active {
  transform: scale(0.97);
}

.product-image {
  width: 56px;
  height: 56px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
}

.product-name {
  font-size: 11px;
  text-align: center;
  color: var(--text-muted);
  line-height: 1.3;
}

.product-price {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 12px;
  font-weight: 600;
  color: var(--gold);
}
</style>
