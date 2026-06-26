import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '../api'

export const useUserStore = defineStore('user', () => {
  const name = ref('小棍同学')
  const level = ref(23)
  const exp = ref(7850)
  const expMax = ref(10000)
  const coins = ref(12450)
  const gems = ref(128)
  const streakDays = ref(23)
  const focusToday = ref('2小时35分')
  const focusWeek = ref('18小时45分')
  const mood = ref(92)
  const fullness = ref(78)
  const focus = ref(85)
  const petName = ref('小橙')
  const petLevel = ref(23)
  const medals = ref(18)
  const totalMedals = ref(45)
  const vip = ref(true)
  const ambientSound = ref('rain')
  const loaded = ref(false)
  const loading = ref(false)

  const expPercent = computed(() => Math.round((exp.value / expMax.value) * 100))

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
    mood.value = data.mood
    fullness.value = data.fullness
    focus.value = data.focus
    petName.value = data.petName
    petLevel.value = data.petLevel
    medals.value = data.medals
    totalMedals.value = data.totalMedals
    vip.value = data.vip
    ambientSound.value = data.ambientSound || 'rain'
  }

  async function fetchUser() {
    loading.value = true
    try {
      const data = await api.getUser()
      applyUser(data)
      loaded.value = true
    } finally {
      loading.value = false
    }
  }

  async function refresh() {
    await fetchUser()
  }

  return {
    name, level, exp, expMax, expPercent, coins, gems,
    streakDays, focusToday, focusWeek, mood, fullness, focus,
    petName, petLevel, medals, totalMedals, vip, ambientSound,
    loaded, loading, fetchUser, refresh, applyUser,
  }
})
