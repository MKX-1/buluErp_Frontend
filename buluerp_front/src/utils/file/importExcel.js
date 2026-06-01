export const beforeUpload = (file) => {
  const isExcel =
    file.type === 'application/vnd.ms-excel' ||
    file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  const isLt500M = file.size / 1024 / 1024 <= 500
  if (!isExcel) {
    ElMessage.error('只能上传 Excel 文件（xls/xlsx）')
    return false
  }
  if (!isLt500M) {
    ElMessage.error('文件大小不能超过 500MB')
    return false
  }
  return true
}
