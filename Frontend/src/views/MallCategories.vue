<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../api'

const router = useRouter()

const categories = [
  { id: 'all', name: '全部' },
  { id: 'pet-supplies', name: '宠物用品' },
  { id: 'accessories', name: '装扮配饰' },
  { id: 'study', name: '学习用品' },
  { id: 'furniture', name: '家具装饰' },
  { id: 'growth', name: '成长道具' },
  { id: 'limited', name: '限定周边' },
]

const categoryNames = {
  1: '装扮配饰',
  2: '家具装饰',
  3: '学习道具',
  4: '限定周边',
}

const categoryFilter = {
  'pet-supplies': (items) => items.filter((i) => i.category !== 4),
  accessories: (items) => items.filter((i) => i.category === 1),
  study: (items) => items.filter((i) => i.category === 3),
  furniture: (items) => items.filter((i) => i.category === 2),
  growth: (items) => items.filter((i) => i.category === 3),
  limited: (items) => items.filter((i) => i.category === 4),
}

const activeCategory = ref('pet-supplies')
const allItems = ref([])

const displayProducts = computed(() => {
  if (activeCategory.value === 'all') {
    return [1, 2, 3, 4].map((cat) => ({
      category: cat,
      categoryName: categoryNames[cat],
      items: allItems.value.filter((i) => i.category === cat),
    })).filter((section) => section.items.length)
  }
  const filterFn = categoryFilter[activeCategory.value]
  const items = filterFn ? filterFn(allItems.value) : allItems.value
  const cat = categories.find((c) => c.id === activeCategory.value)
  return [{
    category: activeCategory.value,
    categoryName: cat?.name || '商品',
    items,
  }]
})

async function loadItems() {
  try {
    allItems.value = await api.getMallItems(0)
  } catch {
    allItems.value = []
  }
}

function selectCategory(id) {
  activeCategory.value = id
}

function goBack() {
  router.back()
}

function goSearch() {
  router.push('/mall')
}

function goDetail(item) {
  router.push(`/mall/product/${item.id}`)
}

onMounted(loadItems)
</script>

<template>
  <div class="categories-page page">
    <div class="mall-sky-bg" />

    <!-- 导航栏 -->
    <header class="nav-bar">
      <button class="nav-back" @click="goBack">
        <font-awesome-icon icon="chevron-left" />
      </button>
      <h1 class="nav-title">商品分类</h1>
      <button class="nav-search" @click="goSearch">
        <font-awesome-icon icon="search" />
      </button>
    </header>

    <!-- 主体区域 -->
    <div class="main-body">
      <!-- 左侧分类栏 -->
      <aside class="sidebar">
        <button
          v-for="cat in categories"
          :key="cat.id"
          class="sidebar-item"
          :class="{ active: activeCategory === cat.id }"
          @click="selectCategory(cat.id)"
        >
          <span class="sidebar-text">{{ cat.name }}</span>
        </button>
      </aside>

      <!-- 右侧商品区 -->
      <div class="content-area">
        <template v-for="section in displayProducts" :key="section.category">
          <div class="category-section">
            <h2 class="category-title">{{ section.categoryName }}</h2>
            <div class="product-grid">
              <div
                v-for="item in section.items"
                :key="item.id"
                class="product-card"
                @click="goDetail(item)"
              >
                <div class="product-img-wrap">
                  <span class="product-emoji">{{ item.image }}</span>
                </div>
                <div class="product-info">
                  <span class="product-name">{{ item.name }}</span>
                  <span v-if="item.tag" class="product-tag">{{ item.tag }}</span>
                </div>
              </div>
            </div>
          </div>
        </template>

        <div class="content-bottom" />
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ===== 页面容器 ===== */
.categories-page {
  background: transparent;
}

.categories-page .nav-bar,
.categories-page .main-body {
  position: relative;
  z-index: 2;
}

/* ===== 导航栏 ===== */
.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 56px;
  padding: 0 12px;
  padding-top: env(safe-area-inset-top, 0px);
  background: linear-gradient(90deg, #5E35B1 0%, #7E57C2 100%);
  flex-shrink: 0;
  position: relative;
  z-index: 10;
}

.nav-back,
.nav-search {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
  font-size: 14px;
  flex-shrink: 0;
}

.nav-title {
  font-size: 17px;
  font-weight: 600;
  color: #fff;
  letter-spacing: 0.5px;
}

/* ===== 主体区域 ===== */
.main-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

/* ===== 左侧分类栏 ===== */
.sidebar {
  width: 80px;
  flex-shrink: 0;
  background: linear-gradient(
    180deg,
    rgba(88, 52, 158, 0.72) 0%,
    rgba(72, 42, 138, 0.78) 100%
  );
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.sidebar-item {
  width: 100%;
  min-height: 56px;
  padding: 8px 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  color: rgba(255, 255, 255, 0.68);
  font-size: 12px;
  font-weight: 500;
  transition: color 0.2s, background 0.2s;
  border: none;
  background: none;
  cursor: pointer;
  font-family: inherit;
}

.sidebar-item.active {
  color: #fff;
  background: rgba(255, 255, 255, 0.16);
  font-weight: 600;
  text-shadow: 0 1px 4px rgba(76, 29, 149, 0.25);
}

.sidebar-item.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 26px;
  background: linear-gradient(180deg, #f0e6ff 0%, #c4b5fd 100%);
  border-radius: 0 3px 3px 0;
  box-shadow: 0 0 8px rgba(196, 181, 253, 0.55);
}

.sidebar-text {
  line-height: 1.3;
  text-align: center;
}

/* ===== 右侧商品区 ===== */
.content-area {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 16px;
}

.content-bottom {
  height: calc(var(--tab-height) + var(--safe-bottom));
}

/* ===== 分类区块 ===== */
.category-section {
  margin-bottom: 4px;
}

.category-title {
  font-size: 18px;
  font-weight: 700;
  color: #333333;
  margin-bottom: 12px;
}

/* ===== 商品网格 ===== */
.product-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

/* ===== 商品卡片 ===== */
.product-card {
  background: #FFFFFF;
  border-radius: 12px;
  box-shadow: 0 4px 8px rgba(94, 53, 177, 0.15);
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.product-card:active {
  transform: scale(0.96);
}

.product-img-wrap {
  width: 100%;
  aspect-ratio: 1;
  background: #F5F0FF;
  display: flex;
  align-items: center;
  justify-content: center;
}

.product-emoji {
  font-size: 36px;
  line-height: 1;
}

.product-info {
  padding: 8px 6px 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  width: 100%;
}

.product-name {
  font-size: 12px;
  color: #333333;
  font-weight: 500;
  text-align: center;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}

.product-tag {
  font-size: 8px;
  color: #5E35B1;
  background: #E8E0FF;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 600;
  line-height: 1.2;
}
</style>
