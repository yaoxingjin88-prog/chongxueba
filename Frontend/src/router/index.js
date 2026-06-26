import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  { path: '/', redirect: '/splash' },
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
    path: '/profile',
    name: 'Profile',
    component: () => import('../views/Profile.vue'),
    meta: { tab: 'profile' },
  },
  {
    path: '/focus',
    name: 'Focus',
    component: () => import('../views/Focus.vue'),
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
    path: '/achievement',
    name: 'Achievement',
    component: () => import('../views/Achievement.vue'),
    meta: { hideTab: true },
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export default router
