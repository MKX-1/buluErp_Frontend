import httpInstance from "@/utils/httpsInstance"
import { toMouldFormData } from '@/utils/mouldFormData'

export function getMouldList(params) {
  return httpInstance({
    url: 'system/mould/list',
    method: 'get',
    params
  })
}

// export function createMould(data) {
//   return httpInstance({
//     url: 'system/mould',
//     method: 'post',
//     data, // 直接传 JSON 对象
//     headers: {
//       'Content-Type': 'application/json' // 使用 JSON
//     }
//   })
// }
export function createMould(data) {
  return httpInstance({
    url: 'system/mould/with-manufacturer',
    method: 'post',
    data: toMouldFormData(data),
    timeout: 120000,
  })
}
export function deleteMould(ids) {
  var idsParam = Array.isArray(ids) ? ids.join(',') : ids
  return httpInstance({
    url: `system/mould/`,
    method: 'delete',
    params: { ids: idsParam },
  })
}

export function updateMould(data) {
  return httpInstance({
    url: 'system/mould',
    method: 'PUT',
    data: toMouldFormData(data),
    timeout: 120000,
  })
}

export function batchUpdateMouldStatus(data) {
  return httpInstance({
    url: 'system/mould/batch-status',
    method: 'PUT',
    timeout: 120000,
    data
  })
}

export function getMouldDetail(id) {
  return httpInstance({
    url: `system/mould/${id}`,
    method: 'get',
  })
}

// export function importMouldFile(formData) {
//   return httpInstance({
//     url: '/system/mould/import',
//     method: 'post',
//     data: formData,
//     headers: {
//       'Content-Type': 'multipart/form-data'
//     }
//   })
// }

export function importMouldFile(formData) {
  return httpInstance({
    url: '/system/mould/import/with-manufacturer',
    method: 'post',
    data: formData,
    // 大批量 Excel 需要留出解析和事务写入时间，仅放宽模具导入，不影响其他请求的超时策略。
    timeout: 120000,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}
export function getMouldTemplate() {
  return httpInstance({
    url: 'system/mould/export/template',
    method: 'get',
    responseType: 'blob'
  })
}

export function exportMould(ids) {
  // 如果 ids 是数组，转换成逗号分隔的字符串
  var idsParam = Array.isArray(ids) ? ids.join(',') : ids

  return httpInstance({
    url: 'system/mould/export',
    method: 'post',
    params: { ids: idsParam }, // 通过 query 参数传递
    responseType: 'blob'
  })
}
