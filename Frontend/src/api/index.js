import { API_BASE } from '../config/apiBase.js'

async function request(url, options = {}) {
  const token = localStorage.getItem('chong-xueba-token') || sessionStorage.getItem('chong-xueba-token')
  const res = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  })
  const json = await res.json()
  if (!res.ok || json.success === false) {
    throw new Error(json.message || '请求失败')
  }
  return json.data
}

export const api = {
  sendLoginCode: (phone) => request('/auth/send-code', {
    method: 'POST',
    body: JSON.stringify({ phone }),
  }),
  login: (payload) => request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  wechatLogin: () => request('/auth/wechat', { method: 'POST', body: '{}' }),
  getCurrentUser: () => request('/auth/me'),
  getUser: (id = 1) => request(`/user/${id}`),
  getWallet: () => request('/user/wallet'),
  getTasks: (type = 'daily') => request(`/tasks?type=${type}`),
  getTaskDetail: (id) => request(`/tasks/${id}`),
  completeTask: (id) => request(`/tasks/${id}/complete`, { method: 'PATCH', body: '{}' }),
  getTaskHistory: (filter = 'all') => request(`/tasks/history?filter=${filter}`),
  getActivityChests: () => request('/tasks/activity/chests'),
  claimActivityChest: (tier) => request(`/tasks/activity/chests/${tier}/claim`, { method: 'POST', body: '{}' }),
  getCheckInItems: () => request('/checkin/items'),
  checkIn: (itemId) => request('/checkin', { method: 'POST', body: JSON.stringify({ itemId }) }),
  getCheckInCalendar: (month) => request(`/checkin/calendar?month=${month}`),
  getMallItems: (category = 0) => request(`/mall/items?category=${category}`),
  searchMallItems: (q) => request(`/mall/items/search?q=${encodeURIComponent(q)}`),
  getMallFeatured: () => request('/mall/items/featured'),
  getMallHot: () => request('/mall/items/hot'),
  getMallItemDetail: (id) => request(`/mall/items/${id}`),
  purchaseItem: (itemId) => request('/mall/purchase', { method: 'POST', body: JSON.stringify({ itemId }) }),
  getCart: () => request('/mall/cart'),
  addToCart: (itemId, quantity = 1) => request('/mall/cart/add', { method: 'POST', body: JSON.stringify({ itemId, quantity }) }),
  updateCartItem: (cartId, quantity) => request(`/mall/cart/${cartId}`, { method: 'PATCH', body: JSON.stringify({ quantity }) }),
  removeCartItem: (cartId) => request(`/mall/cart/${cartId}`, { method: 'DELETE' }),
  createOrder: (items, address) => request('/mall/orders', { method: 'POST', body: JSON.stringify({ items, address }) }),
  getOrders: (status) => request(`/mall/orders${status ? `?status=${status}` : ''}`),
  getDressUpItems: () => request('/mall/dress-up/items'),
  saveOutfit: (items) => request('/mall/dress-up/save', { method: 'POST', body: JSON.stringify({ items }) }),
  getGrowth: (period = 'week') => request(`/growth?period=${period}`),
  getGrowthShare: (period = 'week') => request('/growth/share', {
    method: 'POST',
    body: JSON.stringify({ action: 'preview', period }),
  }),
  growthShareAction: (action, period = 'week') => request('/growth/share', {
    method: 'POST',
    body: JSON.stringify({ action, period }),
  }),
  getAchievements: () => request('/achievements'),
  getPet: () => request('/pet'),
  getPetProfile: () => request('/pet/profile'),
  feedPet: () => request('/pet/feed', { method: 'POST', body: '{}' }),
  petAction: (type) => request('/pet/action', {
    method: 'POST',
    body: JSON.stringify({ type }),
  }),
  claimPetIntimacyReward: () => request('/pet/intimacy-reward', { method: 'POST', body: '{}' }),
  getPetEncyclopedia: () => request('/pet/encyclopedia'),
  getPetShare: () => request('/pet/share', {
    method: 'POST',
    body: JSON.stringify({ action: 'preview' }),
  }),
  petShareAction: (action) => request('/pet/share', {
    method: 'POST',
    body: JSON.stringify({ action }),
  }),
  completeFocus: (minutes) => request('/focus/complete', { method: 'POST', body: JSON.stringify({ minutes }) }),
  getFocusShare: (payload) => request('/focus/share', {
    method: 'POST',
    body: JSON.stringify({ action: 'preview', ...payload }),
  }),
  focusShareAction: (payload) => request('/focus/share', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  getStudyRoom: () => request('/study-room'),
  getStudyRoomPlaza: (category = 'recommend', sort = 'latest') =>
    request(`/study-room/plaza?category=${encodeURIComponent(category)}&sort=${encodeURIComponent(sort)}`),
  getStudyRoomCreatePage: () => request('/study-room/create-page'),
  createStudyRoom: (payload) =>
    request('/study-room/plaza/create', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getStudyRoomSearchPage: () => request('/study-room/search-page'),
  searchStudyRoom: (q, type = 'room') =>
    request(`/study-room/search?q=${encodeURIComponent(q)}&type=${type}`),
  saveStudySearchHistory: (keyword, searchType = 'room') =>
    request('/study-room/search-history', {
      method: 'POST',
      body: JSON.stringify({ keyword, searchType }),
    }),
  clearStudySearchHistory: () => request('/study-room/search-history', { method: 'DELETE' }),
  joinStudyRoom: (roomId, payload = {}) =>
    request(`/study-room/rooms/${roomId}/join`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  greetStudyBuddy: (buddyId) => request(`/study-room/buddies/${buddyId}/greet`, { method: 'POST', body: '{}' }),
  inviteStudyBuddy: (buddyId) => request(`/study-room/buddies/${buddyId}/invite`, { method: 'POST', body: '{}' }),
  saveAmbientSound: (key) => request('/study-room/ambient-sound', {
    method: 'PUT',
    body: JSON.stringify({ key }),
  }),
  getStudyInteract: () => request('/study-room/interact'),
  joinStudyInteract: (mode) => request('/study-room/interact/join', {
    method: 'POST',
    body: JSON.stringify({ mode }),
  }),
  leaveStudyInteract: () => request('/study-room/interact/leave', { method: 'POST', body: '{}' }),
  getVoiceRoom: () => request('/study-room/voice'),
  patchVoiceSettings: (payload) => request('/study-room/voice/settings', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  }),
  voiceSpeak: (active) => request('/study-room/voice/speak', {
    method: 'POST',
    body: JSON.stringify({ active }),
  }),
  voiceHandRaise: () => request('/study-room/voice/hand-raise', { method: 'POST', body: '{}' }),
  voiceEndFocus: () => request('/study-room/voice/end-focus', { method: 'POST', body: '{}' }),
  getVideoRoom: () => request('/study-room/video'),
  getVideoRoomMembers: ({ page = 1, pageSize = 24, q = '', roomCode } = {}) => {
    const params = new URLSearchParams()
    params.set('page', String(page))
    params.set('pageSize', String(pageSize))
    if (q) params.set('q', q)
    if (roomCode) params.set('roomCode', roomCode)
    return request(`/study-room/video/members?${params}`)
  },
  patchVideoSettings: (payload) => request('/study-room/video/settings', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  }),
  switchVideoCamera: () => request('/study-room/video/switch-camera', { method: 'POST', body: '{}' }),
  videoEndFocus: () => request('/study-room/video/end-focus', { method: 'POST', body: '{}' }),
  startVideoFocusAnalysis: (roomCode = 'SR-DEFAULT') =>
    request('/study-room/video/focus-analysis/start', {
      method: 'POST',
      body: JSON.stringify({ roomCode }),
    }),
  reportVideoFocusEvents: (sessionId, events, summary) =>
    request('/study-room/video/focus-analysis/events', {
      method: 'POST',
      body: JSON.stringify({ sessionId, events, summary }),
    }),
  endVideoFocusAnalysis: (sessionId, summary) =>
    request('/study-room/video/focus-analysis/end', {
      method: 'POST',
      body: JSON.stringify({ sessionId, summary }),
    }),
  getVideoFocusSummary: () => request('/study-room/video/focus-analysis/summary'),
  getStudyRoomMenu: (mode = 'voice') => request(`/study-room/menu?mode=${encodeURIComponent(mode)}`),
  getStudyRoomInfo: (mode = 'voice') => request(`/study-room/menu/room-info?mode=${encodeURIComponent(mode)}`),
  studyRoomMenuAction: (payload) => request('/study-room/menu/action', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  getStudyRoomInvite: (mode = 'voice') =>
    request(`/study-room/invite?mode=${encodeURIComponent(mode)}`),
  getStudyRoomInviteRecords: () => request('/study-room/invite/records'),
  studyRoomInviteAction: (payload) => request('/study-room/invite/action', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  getSettings: () => request('/settings'),
  updateSettings: (payload) => request('/settings', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  }),
  clearSettingsCache: () => request('/settings/clear-cache', { method: 'POST', body: '{}' }),
  checkSettingsUpdate: () => request('/settings/check-update', { method: 'POST', body: '{}' }),
  deleteAccount: () => request('/settings/delete-account', { method: 'POST', body: '{}' }),
  getFavorites: (category = 'all') =>
    request(`/favorites?category=${encodeURIComponent(category)}`),
  removeFavorite: (id) => request(`/favorites/${id}`, { method: 'DELETE' }),
  getProfile: () => request('/profile'),
  updateProfile: (payload) => request('/profile', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  }),
  getVipInfo: () => request('/vip'),
  subscribeVip: (payload) => request('/vip/subscribe', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  getLeaderboard: (board = 'focus', period = 'today') =>
    request(`/leaderboard?board=${encodeURIComponent(board)}&period=${encodeURIComponent(period)}`),
}
