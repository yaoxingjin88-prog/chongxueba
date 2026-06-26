const BASE = '/api'

async function request(url, options = {}) {
  const res = await fetch(`${BASE}${url}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  const json = await res.json()
  if (!res.ok || json.success === false) {
    throw new Error(json.message || '请求失败')
  }
  return json.data
}

export const api = {
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
  getStudyRoom: () => request('/study-room'),
  saveAmbientSound: (key) => request('/study-room/ambient-sound', {
    method: 'PUT',
    body: JSON.stringify({ key }),
  }),
}
