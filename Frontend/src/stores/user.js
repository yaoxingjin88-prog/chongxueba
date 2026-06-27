import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '../api'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('chong-xueba-token') || sessionStorage.getItem('chong-xueba-token') || '')
  const name = ref('小棍同学')
  const level = ref(23)
  const exp = ref(7850)
  const expMax = ref(10000)
  const coins = ref(12450)
  const gems = ref(128)
  const streakDays = ref(23)
  const focusToday = ref('2小时35分')
  const focusWeek = ref('18小时45分')
  const focusTotalHours = ref(156)
  const mood = ref(92)
  const fullness = ref(78)
  const focus = ref(85)
  const petName = ref('小橙')
  const petLevel = ref(23)
  const medals = ref(18)
  const totalMedals = ref(45)
  const vip = ref(true)
  const ambientSound = ref('rain')
  const avatarSeed = ref('moon-night')
  const avatarUrl = ref('')
  const loaded = ref(false)
  const loading = ref(false)

  const expPercent = computed(() => Math.round((exp.value / expMax.value) * 100))
  const isAuthenticated = computed(() => Boolean(token.value))

  function applyUser(data) {
    name.value = data.name
    level.value = data.level
    exp.value = data.exp
    expMax.value = data.expMax
    coins.value = data.coins
    gems.value = data.gems
    streakDays.value = data.streakDays
    focusToday.value = data.focusToday
    focusWeek.value = data.focusWeek
    focusTotalHours.value = data.focusTotalHours ?? focusTotalHours.value
    mood.value = data.mood
    fullness.value = data.fullness
    focus.value = data.focus
    petName.value = data.petName
    petLevel.value = data.petLevel
    medals.value = data.medals
    totalMedals.value = data.totalMedals
    vip.value = data.vip
    ambientSound.value = data.ambientSound || 'rain'
    avatarSeed.value = data.avatarSeed || 'moon-night'
    avatarUrl.value = data.avatarUrl || ''
  }

  async function fetchUser() {
    loading.value = true
    try {
      const data = token.value ? await api.getCurrentUser() : await api.getUser()
      applyUser(data)
      loaded.value = true
    } catch (error) {
      if (token.value) clearSession()
      throw error
    } finally {
      loading.value = false
    }
  }

  function saveSession(nextToken, remember = true) {
    localStorage.removeItem('chong-xueba-token')
    sessionStorage.removeItem('chong-xueba-token')
    const storage = remember ? localStorage : sessionStorage
    storage.setItem('chong-xueba-token', nextToken)
    token.value = nextToken
  }

  function clearSession() {
    localStorage.removeItem('chong-xueba-token')
    sessionStorage.removeItem('chong-xueba-token')
    token.value = ''
    loaded.value = false
  }

  async function login(payload) {
    const data = await api.login(payload)
    saveSession(data.token, payload.remember)
    applyUser(data.user)
    loaded.value = true
    sessionStorage.setItem('chong-xueba-welcome-home', '1')
    return data.user
  }

  async function wechatLogin(remember = true) {
    const data = await api.wechatLogin()
    saveSession(data.token, remember)
    applyUser(data.user)
    loaded.value = true
    sessionStorage.setItem('chong-xueba-welcome-home', '1')
    return data.user
  }

  function logout() {
    clearSession()
  }

  async function refresh() {
    await fetchUser()
  }

  return {
    name, level, exp, expMax, expPercent, coins, gems,
    streakDays, focusToday, focusWeek, focusTotalHours, mood, fullness, focus,
    petName, petLevel, medals, totalMedals, vip, ambientSound, avatarSeed, avatarUrl,
    token, isAuthenticated, loaded, loading, fetchUser, refresh, applyUser,
    login, wechatLogin, logout,
  }
})
