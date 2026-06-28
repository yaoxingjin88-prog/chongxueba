/** 生产环境默认 /api，由 Vercel rewrites 转发；本地开发走 vite proxy */
export const API_BASE = (import.meta.env.VITE_API_BASE || '/api').replace(/\/$/, '')
