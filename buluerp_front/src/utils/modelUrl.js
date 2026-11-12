// Route uploaded models through the same-origin API, including legacy absolute URLs.
export function getModelUrl(value) {
  if (!value) return ''
  const path = value.trim().replace(/^https?:\/\/[^/]+/i, '')
  if (path.startsWith('/dev-api/profile/')) return path
  if (path.startsWith('/profile/')) return '/dev-api' + path
  return value
}
