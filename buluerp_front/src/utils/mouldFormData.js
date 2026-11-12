// 与系统现有图片表单一致：文件随新增/编辑请求提交，图片地址仅用于预览。
export function toMouldFormData(data) {
  const form = new FormData()
  for (const field of ['id', 'mouldNumber', 'manufacturerName', 'status', 'trialDate', 'mouldHouseId', 'deletePicture']) {
    const value = data[field]
    if (value !== undefined && value !== null && value !== '') form.append(field, String(value))
  }
  if (data.picture instanceof File) form.append('picture', data.picture)
  return form
}
