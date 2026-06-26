export function formatMinutes(minutes) {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours > 0 && mins > 0) return `${hours}小时${mins}分`
  if (hours > 0) return `${hours}小时`
  return `${mins}分钟`
}

export function formatDateLabel(date) {
  const d = new Date(date)
  return `${d.getMonth() + 1}.${String(d.getDate()).padStart(2, '0')}`
}
