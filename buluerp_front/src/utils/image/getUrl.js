export const getFullImageUrl = (path) => {
  if (!path) return ''
  // 已是完整地址（http/https 开头）直接使用，避免二次拼接前缀
  if (/^https?:\/\//i.test(path)) return path
  // 相对路径：防止多余斜杠：/profile//2025/... => /profile/2025/...
  return '/dev-api' + path.replace('//', '/')
}
