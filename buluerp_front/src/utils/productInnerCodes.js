export function getProductInnerCodes(product) {
  return product?.innerIds?.length ? [...product.innerIds] : [product?.innerId || '']
}

export function validateProductInnerCodes(_rule, values, callback) {
  if (!Array.isArray(values) || !values.length) return callback(new Error('至少保留一个内部编号'))
  const seen = new Set()
  for (const value of values) {
    const code = String(value ?? '').trim()
    if (!code) return callback(new Error('内部编号不能为空，请填写或删除空白行'))
    if (code.length > 50) return callback(new Error('每个内部编号不能超过50个字符'))
    if (/[\u0000-\u001f\u007f-\u009f\ud800-\udfff]/.test(code)) {
      return callback(new Error('内部编号不能包含换行、控制字符或表情符号'))
    }
    if (seen.has(code)) return callback(new Error(`内部编号重复：${code}`))
    seen.add(code)
  }
  callback()
}
