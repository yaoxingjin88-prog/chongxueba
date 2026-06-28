export async function sharePage(title, text = '') {
  const url = window.location.href
  if (navigator.share) {
    try {
      await navigator.share({ title, text, url })
      return 'shared'
    } catch (e) {
      if (e?.name === 'AbortError') return 'cancelled'
    }
  }
  try {
    await navigator.clipboard.writeText(`${title}\n${url}`)
    return 'copied'
  } catch {
    return 'failed'
  }
}
