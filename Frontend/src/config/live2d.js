/** Live2D 运行时模型配置 */
export const LIVE2D_CONFIG = {
  /** 默认展示模型：nito / nico / ni-j / nipsilon / nietzsche */
  modelPath: '/live2d/runtime/nito.model3.json',
  /** 模型缩放系数（相对容器自适应后的倍率） */
  scaleFactor: 1.28,
  /** 锚点纵向位置（0~1，越大越靠下） */
  anchorY: 0.88,
  /** 待机动作组 */
  idleGroup: 'Idle',
  /** 点击触发的动作组 */
  tapGroup: 'Tap',
}

export const LIVE2D_MODELS = [
  { id: 'nito', label: 'Nito', path: '/live2d/runtime/nito.model3.json' },
  { id: 'nico', label: 'Nico', path: '/live2d/runtime/nico.model3.json' },
  { id: 'ni-j', label: 'Ni-j', path: '/live2d/runtime/ni-j.model3.json' },
  { id: 'nipsilon', label: 'Nipsilon', path: '/live2d/runtime/nipsilon.model3.json' },
  { id: 'nietzsche', label: 'Nietzsche', path: '/live2d/runtime/nietzsche.model3.json' },
]
