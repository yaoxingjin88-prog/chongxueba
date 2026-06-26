# Live2D 模型说明

## runtime 目录（当前使用）

项目已内置 Ni-j 系列 Live2D 模型，位于 `public/live2d/runtime/`：

| 模型 | 入口文件 | 说明 |
|------|----------|------|
| Nito | `nito.model3.json` | **默认首页宠物** |
| Nico | `nico.model3.json` | 可选角色 |
| Ni-j | `ni-j.model3.json` | 可选角色 |
| Nipsilon | `nipsilon.model3.json` | 可选角色 |
| Nietzsche | `nietzsche.model3.json` | 可选角色 |

共享动作文件位于 `motion/` 目录，支持 Idle、Tap、Flick 等交互。

## 切换模型

修改 `src/config/live2d.js` 中的 `modelPath`：

```js
export const LIVE2D_CONFIG = {
  modelPath: '/live2d/runtime/nico.model3.json',
  // ...
}
```

或在页面中传入：

```vue
<Live2DCharacter model-path="/live2d/runtime/nico.model3.json" />
```

## 交互说明

- **待机**：自动播放 `Idle` 动作组（idle / fun / sleep 等随机）
- **点击**：触发 `Tap` 动作组（happy / joy / angry 等）
- **拖拽**：`autoInteract` 已开启，支持视线跟随

## 依赖

- Cubism Core：`public/live2d/live2dcubismcore.min.js`（本地引入，避免 CDN 不可用）
- 渲染库：`pixi.js@6.5.x` + `pixi-live2d-display/cubism4`（须用 v6，v7 会导致 `isInteractive` 报错）
