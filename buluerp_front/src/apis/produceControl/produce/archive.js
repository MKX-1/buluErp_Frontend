import httpInstance from '@/utils/httpsInstance.js'

let headers = { Authorization: `${localStorage.getItem('Authorization')}` }

export function listArchiveOrders(params = {}) {
  return httpInstance({
    url: 'system/production-archive/orders',
    method: 'get',
    headers,
    params,
  })
}

export function listArchiveSchedules(orderCode, params = {}) {
  return httpInstance({
    url: `system/production-archive/${encodeURIComponent(orderCode)}/schedules`,
    method: 'get',
    headers,
    params,
  })
}

export function listArchiveArranges(orderCode, params = {}) {
  return httpInstance({
    url: `system/production-archive/${encodeURIComponent(orderCode)}/arranges`,
    method: 'get',
    headers,
    params,
  })
}

export function exportArchiveOrders(ids) {
  const formData = new URLSearchParams()
  formData.append('ids', ids.join(','))
  return httpInstance({
    url: 'system/production-archive/export',
    method: 'post',
    headers: { ...headers, 'Content-Type': 'application/x-www-form-urlencoded' },
    responseType: 'blob',
    data: formData,
  })
}
