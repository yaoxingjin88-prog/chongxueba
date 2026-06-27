const BASE = '/api'

async function request(url, options = {}) {
  const token = localStorage.getItem('chong-xueba-token') || sessionStorage.getItem('chong-xueba-token')
  const res = await fetch(`${BASE}${url}`, {
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
  getTasks: (type = 'daily') => request(`/tasks?type=${type}`),
  completeTask: (id) => request(`/tasks/${id}/complete`, { method: 'PATCH', body: '{}' }),
  getMallItems: (category = 0) => request(`/mall/items?category=${category}`),
  purchaseItem: (itemId) => request('/mall/purchase', { method: 'POST', body: JSON.stringify({ itemId }) }),
  getGrowth: () => request('/growth'),
  getAchievements: () => request('/achievements'),
  getPet: () => request('/pet'),
  feedPet: () => request('/pet/feed', { method: 'POST', body: '{}' }),
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
  joinStudyRoom: (roomId) => request(`/study-room/rooms/${roomId}/join`, { method: 'POST', body: '{}' }),
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
  patchVideoSettings: (payload) => request('/study-room/video/settings', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  }),
  switchVideoCamera: () => request('/study-room/video/switch-camera', { method: 'POST', body: '{}' }),
  videoEndFocus: () => request('/study-room/video/end-focus', { method: 'POST', body: '{}' }),
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
  getLeaderboard: (board = 'focus', period = 'today') =>
    request(`/leaderboard?board=${encodeURIComponent(board)}&period=${encodeURIComponent(period)}`),
}
