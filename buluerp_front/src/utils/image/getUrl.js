export const getFullImageUrl = (path) => {
  // 防止多余斜杠：/profile//2025/... => /profile/2025/...
  return '/dev-api' + path.replace('//', '/')
}
