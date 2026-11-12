import httpInstance from '../httpsInstance'
let headers = { Authorization: `${localStorage.getItem('Authorization')}` }

export const searchFunc = (url, key, valueKey = key, fallbackKey = '') => {
  const requestRows = (searchKey, content) => httpInstance({
    url,
    params: { [searchKey]: content },
    method: 'get',
    headers: headers,
  })

  const debouncedSearch = debounce((ele, content) => {
    if (content) {
      ele.loading = true
      requestRows(key, content)
        .then((res) => {
          if (fallbackKey && (!res.rows || res.rows.length === 0)) {
            return requestRows(fallbackKey, content)
          }
          return res
        })
        .then((res) => {
          ele.options = res.rows.map((item) => {
            const optionValue = typeof valueKey === 'function' ? valueKey(item) : item[valueKey]
            if(ele.showKey){
              return { label: ele.showKey.map((showKey)=>showKey.label+':'+item[showKey.key]).join("  "), value: optionValue, raw: item }
            }else{
              return { label: key === 'innerId' && item.innerIds?.length ? item.innerIds.join(' / ') : item[key], value: optionValue, raw: item }
            }
          })
        })
        .finally(() => {
          ele.loading = false
        })
    } else {
      ele.options = []
    }
  }, 500)

  return (ele, content) => {
    debouncedSearch(ele, content)
  }
}

function debounce(func, delay) {
  let timer = null
  return function (...args) {
    if (timer) {
      clearTimeout(timer)
    }
    timer = setTimeout(() => {
      func.apply(this, args)
      timer = null
    }, delay)
  }
}
