<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { api } from '../api'
import { useToast } from '../composables/useToast'
import { vipPayBg } from '../config/ossPublic.js'

const router = useRouter()
const user = useUserStore()
const toast = useToast()

const vipPayBgUrl = `url("${vipPayBg}")`

const loading = ref(true)
const subscribing = ref(false)
const status = ref({ active: false, expireLabel: null, daysLeft: 0 })
const plans = ref([])
const benefits = ref([])
const balance = ref({ coins: 0, gems: 0 })
const recentOrders = ref([])
const selectedPlanId = ref('quarterly')
const payMethod = ref('gems')

const benefitIconMap = {
  coins: 'coins',
  'chart-line': 'chart-line',
  crown: 'crown',
  shirt: 'shirt',
  users: 'users',
  gift: 'gift',
}

const selectedPlan = computed(() => plans.value.find((p) => p.id === selectedPlanId.value))

const canPayGems = computed(() => {
  const plan = selectedPlan.value
  return plan && balance.value.gems >= plan.priceGems
})

async function loadVip() {
  loading.value = true
  try {
    const data = await api.getVipInfo()
    status.value = data.status || status.value
    plans.value = data.plans || []
    benefits.value = data.benefits || []
    balance.value = data.balance || balance.value
    recentOrders.value = data.recentOrders || []
    if (plans.value.length && !plans.value.find((p) => p.id === selectedPlanId.value)) {
      selectedPlanId.value = plans.value[1]?.id || plans.value[0].id
    }
  } catch (err) {
    toast.show(err.message || '加载失败')
  } finally {
    loading.value = false
  }
}

async function handleSubscribe() {
  if (!selectedPlan.value || subscribing.value) return
  subscribing.value = true
  try {
    const result = await api.subscribeVip({
      planId: selectedPlanId.value,
      payMethod: payMethod.value,
    })
    toast.show(result.message || '开通成功')
    if (result.status) status.value = result.status
    if (typeof result.coins === 'number') user.coins = result.coins
    if (typeof result.gems === 'number') user.gems = result.gems
    user.vip = true
    user.vipExpireLabel = result.status?.expireLabel
      ? `${result.status.expireLabel}到期`
      : user.vipExpireLabel
    user.vipDaysLeft = result.status?.daysLeft ?? user.vipDaysLeft
    await loadVip()
    await user.refresh().catch(() => {})
  } catch (err) {
    toast.show(err.message || '开通失败')
  } finally {
    subscribing.value = false
  }
}

onMounted(loadVip)
</script>

<template>
  <div class="vip-page page">
    <div class="page-bg" aria-hidden="true" />

    <header class="top-bar">
      <button type="button" class="back-btn" aria-label="返回" @click="router.back()">
        <font-awesome-icon icon="chevron-left" />
      </button>
      <h1 class="page-title">VIP 会员</h1>
      <div class="top-spacer" />
    </header>

    <div v-if="loading" class="page-content no-tab vip-body">
      <div class="loading-state">加载中…</div>
    </div>

    <div v-else class="page-content no-tab vip-body">
      <section class="hero-card">
        <div class="hero-crown-wrap">
          <font-awesome-icon icon="crown" class="hero-crown" />
        </div>
        <div class="hero-info">
          <h2 v-if="status.active" class="hero-title">尊贵 VIP 会员</h2>
          <h2 v-else class="hero-title">开通 VIP 会员</h2>
          <p v-if="status.active" class="hero-sub">
            {{ status.expireLabel }}到期 · 剩余 {{ status.daysLeft }} 天
          </p>
          <p v-else class="hero-sub">解锁学豆加成、深度报告与专属特权</p>
        </div>
        <div class="balance-row">
          <span class="balance-pill">
            <font-awesome-icon icon="gem" />
            {{ balance.gems }}
          </span>
          <span class="balance-pill">
            <font-awesome-icon icon="coins" />
            {{ balance.coins }}
          </span>
        </div>
      </section>

      <section class="panel-card benefits-panel">
        <h3 class="section-title">会员权益</h3>
        <div class="benefits-grid">
          <div v-for="item in benefits" :key="item.title" class="benefit-item">
            <div class="benefit-icon">
              <font-awesome-icon :icon="benefitIconMap[item.icon] || 'star'" />
            </div>
            <div class="benefit-text">
              <span class="benefit-title">{{ item.title }}</span>
              <span class="benefit-desc">{{ item.desc }}</span>
            </div>
          </div>
        </div>
      </section>

      <section class="panel-card plans-panel">
        <h3 class="section-title">选择方案</h3>
        <div class="plans-row">
          <button
            v-for="plan in plans"
            :key="plan.id"
            type="button"
            class="plan-card"
            :class="{ active: selectedPlanId === plan.id }"
            @click="selectedPlanId = plan.id"
          >
            <span v-if="plan.badge" class="plan-badge">{{ plan.badge }}</span>
            <span class="plan-name">{{ plan.name }}</span>
            <span class="plan-price">{{ plan.priceLabel }}</span>
            <span class="plan-gems">
              <font-awesome-icon icon="gem" />
              {{ plan.priceGems }}
            </span>
          </button>
        </div>
      </section>

      <section class="panel-card pay-panel">
        <h3 class="section-title">支付方式</h3>
        <div class="pay-options">
          <button
            type="button"
            class="pay-option"
            :class="{ active: payMethod === 'gems' }"
            @click="payMethod = 'gems'"
          >
            <font-awesome-icon icon="gem" />
            <span>钻石支付</span>
            <span v-if="selectedPlan" class="pay-amount">{{ selectedPlan.priceGems }}</span>
          </button>
          <button
            type="button"
            class="pay-option"
            :class="{ active: payMethod === 'mock_wechat' }"
            @click="payMethod = 'mock_wechat'"
          >
            <font-awesome-icon icon="comment" />
            <span>微信支付（演示）</span>
          </button>
        </div>
      </section>

      <button
        type="button"
        class="subscribe-btn"
        :disabled="subscribing || (payMethod === 'gems' && !canPayGems)"
        @click="handleSubscribe"
      >
        <font-awesome-icon icon="crown" />
        {{ subscribing ? '开通中…' : status.active ? '续费会员' : '立即开通' }}
      </button>

      <p v-if="payMethod === 'gems' && selectedPlan && !canPayGems" class="hint-text">
        钻石不足，可去任务中心赚取或选择演示支付
      </p>

      <section v-if="recentOrders.length" class="panel-card orders-panel">
        <h3 class="section-title">最近开通</h3>
        <ul class="order-list">
          <li v-for="(order, i) in recentOrders" :key="i" class="order-item">
            <span>{{ order.planName }}</span>
            <span class="order-date">{{ order.date }}</span>
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>

<style scoped>
.vip-page {
  position: relative;
  overflow: hidden;
}

.page-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background: v-bind(vipPayBgUrl) center top / cover no-repeat;
  background-color: #e8dcf8;
}

.top-bar {
  position: relative;
  z-index: 2;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px 8px;
}

.vip-body {
  position: relative;
  z-index: 1;
  padding: 0 16px calc(var(--safe-bottom) + 16px);
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.back-btn {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 50%;
  background: rgba(255,255,255,0.18);
  color: #fff;
  font-size: 16px;
  cursor: pointer;
}

.page-title {
  font-size: 17px;
  font-weight: 700;
  color: #fff;
}

.top-spacer {
  width: 36px;
}

.loading-state {
  text-align: center;
  color: rgba(255,255,255,0.85);
  padding: 48px 0;
  flex: 1;
}

.panel-card {
  background: rgba(255,255,255,0.96);
  border-radius: 18px;
  padding: 16px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.08);
}

.hero-card {
  background: linear-gradient(135deg, rgba(251,191,36,0.35) 0%, rgba(245,158,11,0.22) 100%);
  border: 1px solid rgba(255,255,255,0.45);
  border-radius: 20px;
  padding: 18px 16px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  backdrop-filter: blur(12px);
}

.hero-crown-wrap {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: rgba(255,255,255,0.25);
  display: flex;
  align-items: center;
  justify-content: center;
}

.hero-crown {
  font-size: 26px;
  color: #fbbf24;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
}

.hero-info {
  flex: 1;
  min-width: 140px;
}

.hero-title {
  font-size: 18px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 4px;
}

.hero-sub {
  font-size: 12px;
  color: rgba(255,255,255,0.88);
}

.balance-row {
  width: 100%;
  display: flex;
  gap: 8px;
}

.balance-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  border-radius: 999px;
  background: rgba(255,255,255,0.22);
  color: #fff;
  font-size: 12px;
  font-weight: 600;
}

.section-title {
  font-size: 15px;
  font-weight: 700;
  color: #4c1d95;
  margin-bottom: 12px;
}

.benefits-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.benefit-item {
  display: flex;
  gap: 8px;
  align-items: flex-start;
}

.benefit-icon {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: linear-gradient(135deg, #ede9fe, #ddd6fe);
  color: #7c3aed;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 14px;
}

.benefit-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.benefit-title {
  font-size: 13px;
  font-weight: 600;
  color: #1f2937;
}

.benefit-desc {
  font-size: 11px;
  color: #6b7280;
  line-height: 1.35;
}

.plans-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.plan-card {
  position: relative;
  border: 2px solid #e5e7eb;
  border-radius: 14px;
  padding: 12px 8px;
  background: #fff;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.plan-card.active {
  border-color: #a855f7;
  box-shadow: 0 0 0 3px rgba(168,85,247,0.15);
  background: linear-gradient(180deg, #faf5ff 0%, #fff 100%);
}

.plan-badge {
  position: absolute;
  top: -8px;
  right: -4px;
  font-size: 9px;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(135deg, #f59e0b, #d97706);
  padding: 2px 6px;
  border-radius: 999px;
}

.plan-name {
  font-size: 12px;
  font-weight: 600;
  color: #374151;
}

.plan-price {
  font-size: 18px;
  font-weight: 800;
  color: #7c3aed;
}

.plan-gems {
  font-size: 11px;
  color: #6b7280;
  display: flex;
  align-items: center;
  gap: 3px;
}

.pay-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.pay-option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  background: #fff;
  cursor: pointer;
  font-size: 14px;
  color: #374151;
}

.pay-option.active {
  border-color: #a855f7;
  background: #faf5ff;
}

.pay-amount {
  margin-left: auto;
  font-weight: 700;
  color: #7c3aed;
}

.subscribe-btn {
  width: 100%;
  border: none;
  border-radius: 14px;
  padding: 15px;
  font-size: 16px;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  box-shadow: 0 6px 20px rgba(245,158,11,0.35);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.subscribe-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.hint-text {
  text-align: center;
  font-size: 12px;
  color: rgba(255,255,255,0.85);
  margin-top: -6px;
}

.order-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.order-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #f3f4f6;
  font-size: 13px;
  color: #374151;
}

.order-item:last-child {
  border-bottom: none;
}

.order-date {
  color: #9ca3af;
  font-size: 12px;
}
</style>
