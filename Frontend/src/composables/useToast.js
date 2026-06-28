import { ref } from 'vue'

const toasts = ref([])
let seq = 0

export function useToast() {
  function show(message, type = 'success', duration = 2600) {
    const id = ++seq
    toasts.value.push({ id, message, type })
    setTimeout(() => {
      toasts.value = toasts.value.filter((t) => t.id !== id)
    }, duration)
    return id
  }

  return {
    toasts,
    show,
    success: (msg) => show(msg, 'success'),
    info: (msg) => show(msg, 'info'),
    reward: (msg) => show(msg, 'reward'),
  }
}
