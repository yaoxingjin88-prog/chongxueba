<script setup>
import { ref, onMounted, onActivated } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../api'

const router = useRouter()

const filters = ['全部', '待发货', '已完成']
const activeFilter = ref(0)

const orders = ref([])

const filteredOrders = ref([])

const statusColorMap = { pending: '#f97316', done: '#34d399', claim: '#c084fc' }
const statusLabelMap = { pending: '待发货', done: '已完成', claim: '待领取' }

async function loadOrders() {
  try {
    orders.value = await api.getOrders()
    filterOrders(activeFilter.value)
  } catch { /* ignore */ }
}

function filterOrders(idx) {
  activeFilter.value = idx
  if (idx === 0) filteredOrders.value = [...orders.value]
  else if (idx === 1) filteredOrders.value = orders.value.filter((o) => o.status === 'pending')
  else filteredOrders.value = orders.value.filter((o) => o.status === 'done')
}

onMounted(loadOrders)
onActivated(loadOrders)
</script>

<template>
  <div class="orders-page page">
    <div class="mall-sky-bg" />

    <div class="page-content no-tab">
      <!-- 导航栏 -->
      <div class="nav-bar">
        <button class="nav-back" @click="router.back()">
          <font-awesome-icon icon="chevron-left" />
        </button>
        <span class="nav-title">购物记录</span>
        <button class="nav-refresh" @click="loadOrders">
          <font-awesome-icon icon="rotate" />
        </button>
      </div>

      <!-- 筛选标签 -->
      <div class="filter-row">
        <button
          v-for="(f, i) in filters"
          :key="f"
          class="filter-pill"
          :class="{ active: activeFilter === i }"
          @click="filterOrders(i)"
        >
          {{ f }}
        </button>
      </div>

      <!-- 订单列表 -->
      <div class="order-list">
        <div v-for="order in filteredOrders" :key="order.id" class="order-card">
          <div class="order-img">
            <span>{{ order.items?.[0]?.image || '📦' }}</span>
          </div>
          <div class="order-info">
            <span class="order-name">{{ order.items?.[0]?.name || '商品' }}</span>
            <span class="order-no">{{ order.order_no }}</span>
          </div>
          <div class="order-right">
            <span class="order-status" :style="{ color: statusColorMap[order.status] || '#f97316' }">
              {{ statusLabelMap[order.status] || order.status }}
            </span>
            <span class="order-total">{{ order.total }} 金币</span>
          </div>
        </div>
      </div>

      <div v-if="filteredOrders.length === 0" class="empty-state">
        <span class="empty-icon">📦</span>
        <p class="text-muted">暂无购物记录</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.orders-page {
  background: transparent;
}

.orders-page .page-content {
  position: relative;
  z-index: 2;
}

.nav-bar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 8px 12px;
  padding-top: calc(8px + env(safe-area-inset-top, 0px));
  position: relative; z-index: 10;
}
.nav-back, .nav-refresh {
  width: 36px; height: 36px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 50%;
  background: rgba(255,255,255,0.1);
  color: #fff; font-size: 14px;
}
.nav-title { font-size: 18px; font-weight: 800; color: #fff; letter-spacing: 1px; }

.filter-row {
  display: flex; gap: 8px;
  padding: 12px 14px;
  position: relative; z-index: 5;
}
.filter-pill {
  padding: 7px 18px; border-radius: 999px;
  font-size: 13px; font-weight: 600;
  color: #5b3d99;
  background: rgba(238, 234, 252, 0.7);
  border: 1px solid rgba(238, 234, 252, 0.5);
  transition: all 0.2s;
}
.filter-pill.active {
  background: rgba(139, 92, 246, 0.8);
  color: #fff;
  border-color: rgba(139, 92, 246, 0.5);
}

.order-list {
  padding: 0 14px;
  display: flex; flex-direction: column; gap: 10px;
  padding-bottom: 24px;
  position: relative; z-index: 5;
}
.order-card {
  display: flex; align-items: center; gap: 12px;
  padding: 14px;
  background: rgba(238, 234, 252, 0.75);
  backdrop-filter: blur(4px);
  border: 1px solid rgba(238, 234, 252, 0.5);
  border-radius: 16px;
}
.order-img {
  width: 56px; height: 56px;
  background: rgba(139, 92, 246, 0.12);
  border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  font-size: 28px; flex-shrink: 0;
}
.order-info {
  flex: 1; display: flex; flex-direction: column; gap: 4px; min-width: 0;
}
.order-name { font-size: 15px; font-weight: 600; color: #2d1f5e; }
.order-no { font-size: 12px; color: #7b6f9e; }
.order-right {
  display: flex; flex-direction: column; align-items: flex-end; gap: 6px; flex-shrink: 0;
}
.order-status { font-size: 13px; font-weight: 600; }
.order-total { font-size: 12px; color: #fbbf24; font-weight: 700; }
.order-action {
  padding: 5px 14px; border-radius: 8px;
  font-size: 12px; font-weight: 700; color: #fff;
}

.empty-state {
  display: flex; flex-direction: column;
  align-items: center; gap: 10px;
  padding: 60px 20px;
  position: relative; z-index: 5;
}
.empty-icon { font-size: 48px; opacity: 0.5; }
</style>
