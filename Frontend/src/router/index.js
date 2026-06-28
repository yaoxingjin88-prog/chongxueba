import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  { path: '/', redirect: '/login' },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { hideTab: true },
  },
  {
    path: '/splash',
    name: 'Splash',
    component: () => import('../views/Splash.vue'),
    meta: { hideTab: true },
  },
  {
    path: '/home',
    name: 'Home',
    component: () => import('../views/Home.vue'),
    meta: { tab: 'home' },
  },
  {
    path: '/study-room',
    name: 'StudyRoom',
    component: () => import('../views/StudyRoom.vue'),
    meta: { tab: 'study' },
  },
  {
    path: '/study-room/search',
    name: 'StudyRoomSearch',
    component: () => import('../views/StudyRoomSearch.vue'),
    meta: { hideTab: true },
  },
  {
    path: '/study-room/plaza',
    name: 'StudyRoomPlaza',
    component: () => import('../views/StudyRoomPlaza.vue'),
    meta: { hideTab: true },
  },
  {
    path: '/study-room/create',
    name: 'StudyRoomCreate',
    component: () => import('../views/StudyRoomCreate.vue'),
    meta: { hideTab: true },
  },
  {
    path: '/study-room/voice',
    name: 'StudyRoomVoice',
    component: () => import('../views/StudyRoomVoice.vue'),
    meta: { hideTab: true },
  },
  {
    path: '/study-room/video',
    name: 'StudyRoomVideo',
    component: () => import('../views/StudyRoomVideo.vue'),
    meta: { hideTab: true },
  },
  {
    path: '/study-room/video/members',
    name: 'StudyRoomVideoMembers',
    component: () => import('../views/StudyRoomVideoMembers.vue'),
    meta: { hideTab: true },
  },
  {
    path: '/study-room/invite',
    name: 'StudyRoomInvite',
    component: () => import('../views/StudyRoomInvite.vue'),
    meta: { hideTab: true },
  },
  {
    path: '/growth',
    name: 'Growth',
    component: () => import('../views/Growth.vue'),
    meta: { tab: 'growth' },
  },
  {
    path: '/mall',
    name: 'Mall',
    component: () => import('../views/Mall.vue'),
    meta: { tab: 'mall' },
  },
  {
    path: '/mall/categories',
    name: 'MallCategories',
    component: () => import('../views/MallCategories.vue'),
    meta: { tab: 'mall' },
  },
  {
    path: '/mall/product/:id',
    name: 'MallProduct',
    component: () => import('../views/MallProduct.vue'),
    meta: { hideTab: true },
  },
  {
    path: '/mall/cart',
    name: 'MallCart',
    component: () => import('../views/MallCart.vue'),
    meta: { hideTab: true },
  },
  {
    path: '/mall/checkout',
    name: 'MallCheckout',
    component: () => import('../views/MallCheckout.vue'),
    meta: { hideTab: true },
  },
  {
    path: '/mall/dress-up',
    name: 'MallDressUp',
    component: () => import('../views/MallDressUp.vue'),
    meta: { hideTab: true },
  },
  {
    path: '/mall/orders',
    name: 'MallOrders',
    component: () => import('../views/MallOrders.vue'),
    meta: { hideTab: true },
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('../views/Profile.vue'),
    meta: { tab: 'profile' },
  },
  {
    path: '/vip',
    name: 'Vip',
    component: () => import('../views/Vip.vue'),
    meta: { hideTab: true },
  },
  {
    path: '/focus',
    name: 'Focus',
    component: () => import('../views/Focus.vue'),
    meta: { hideTab: true },
  },
  {
    path: '/pet/encyclopedia',
    name: 'PetEncyclopedia',
    component: () => import('../views/PetEncyclopedia.vue'),
    meta: { hideTab: true },
  },
  {
    path: '/pet/profile',
    name: 'PetProfile',
    component: () => import('../views/PetProfile.vue'),
    meta: { hideTab: true },
  },
  {
    path: '/pet/dress-up',
    name: 'PetDressUp',
    component: () => import('../views/PetDressUp.vue'),
    meta: { hideTab: true },
  },
  {
    path: '/pet',
    name: 'Pet',
    component: () => import('../views/Pet.vue'),
    meta: { hideTab: true },
  },
  {
    path: '/tasks',
    name: 'Tasks',
    component: () => import('../views/Tasks.vue'),
    meta: { hideTab: true },
  },
  {
    path: '/tasks/:id',
    name: 'TaskDetail',
    component: () => import('../views/TaskDetail.vue'),
    meta: { hideTab: true },
  },
  {
    path: '/tasks-records',
    name: 'TaskRecords',
    component: () => import('../views/TaskRecords.vue'),
    meta: { hideTab: true },
  },
  {
    path: '/treasure-box',
    name: 'TreasureBox',
    component: () => import('../views/TreasureBox.vue'),
    meta: { hideTab: true },
  },
  {
    path: '/checkin',
    name: 'CheckIn',
    component: () => import('../views/CheckIn.vue'),
    meta: { hideTab: true },
  },
  {
    path: '/leaderboard',
    name: 'Leaderboard',
    component: () => import('../views/Leaderboard.vue'),
    meta: { tab: 'growth' },
  },
  {
    path: '/achievement',
    name: 'Achievement',
    component: () => import('../views/Achievement.vue'),
    meta: { hideTab: true },
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('../views/Settings.vue'),
    meta: { hideTab: true },
  },
  {
    path: '/favorites',
    name: 'Favorites',
    component: () => import('../views/Favorites.vue'),
    meta: { hideTab: true },
  },
  {
    path: '/settings/profile',
    name: 'UserProfile',
    component: () => import('../views/UserProfile.vue'),
    meta: { hideTab: true },
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

router.beforeEach((to) => {
  const hasSession = Boolean(
    localStorage.getItem('chong-xueba-token')
    || sessionStorage.getItem('chong-xueba-token')
    || sessionStorage.getItem('chong-xueba-guest'),
  )

  if (to.path === '/login' && hasSession) return '/home'
  if (!['/login', '/splash'].includes(to.path) && !hasSession) return '/login'
})

export default router
