export function avatarUrl(seed = 'moon-night', customUrl = '') {
  if (customUrl) return customUrl
  return `https://api.dicebear.com/7.x/adventurer/png?seed=${seed}&backgroundColor=c0aede,d1d4f9`
}

export const AVATAR_PRESETS = [
  { seed: 'moon-night', label: '月夜' },
  { seed: 'xiaogun', label: '小棍' },
  { seed: 'star-fox', label: '星狐' },
  { seed: 'cloud-pet', label: '云朵' },
  { seed: 'dream-cat', label: '梦猫' },
  { seed: 'purple-bunny', label: '紫兔' },
]

const MAX_AVATAR_BYTES = 5 * 1024 * 1024

export function compressImageFile(file, maxSize = 256, quality = 0.82) {
  return new Promise((resolve, reject) => {
    if (!file?.type?.startsWith('image/')) {
      reject(new Error('请选择图片文件'))
      return
    }
    if (file.size > MAX_AVATAR_BYTES) {
      reject(new Error('图片不能超过 5MB'))
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height))
        const width = Math.max(1, Math.round(img.width * scale))
        const height = Math.max(1, Math.round(img.height * scale))
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.onerror = () => reject(new Error('图片读取失败'))
      img.src = reader.result
    }
    reader.onerror = () => reject(new Error('图片读取失败'))
    reader.readAsDataURL(file)
  })
}
