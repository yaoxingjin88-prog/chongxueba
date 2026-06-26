export function errorHandler(err, _req, res, _next) {
  console.error(err)
  const status = err.status || 500
  res.status(status).json({
    success: false,
    message: err.message || '服务器内部错误',
  })
}

export function notFound(_req, res) {
  res.status(404).json({ success: false, message: '接口不存在' })
}
