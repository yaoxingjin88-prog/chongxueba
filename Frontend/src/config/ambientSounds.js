/** 自习室环境音配置 */
export const AMBIENT_SOUNDS = [
  {
    key: 'rain',
    icon: 'cloud-rain',
    label: '雨声',
    url: '/sounds/rain.wav',
    volume: 0.55,
    description: '轻柔雨声，适合深度专注',
  },
  {
    key: 'cafe',
    icon: 'mug-hot',
    label: '咖啡厅',
    url: '/sounds/cafe.wav',
    volume: 0.45,
    description: '咖啡馆白噪音，营造学习氛围',
  },
  {
    key: 'forest',
    icon: 'tree',
    label: '森林',
    url: '/sounds/forest.wav',
    volume: 0.5,
    description: '鸟鸣与溪流，自然放松',
  },
  {
    key: 'fire',
    icon: 'fire',
    label: '篝火',
    url: '/sounds/fire.wav',
    volume: 0.48,
    description: '篝火噼啪声，温暖陪伴',
  },
]

export const DEFAULT_AMBIENT_KEY = 'rain'

export function getAmbientByKey(key) {
  return AMBIENT_SOUNDS.find((s) => s.key === key) || AMBIENT_SOUNDS[0]
}

export function getAmbientLabel(key) {
  return getAmbientByKey(key).label
}
