/* global GM_addStyle, GM_getResourceText, GM_getResourceURL */

export function cache(obj, prop, value){
  Object.defineProperty(obj, prop, {value: value})
  return value
}

export function bisect(a, x, comparer, lo=0, hi=null){
  // ported from the python standard library
  if(lo < 0)
    throw 'lo must be non-negative'
  if(hi === null)
    hi = a.length
  while(lo < hi){
    let mid = (lo + hi) >> 1
    if(comparer(x, a[mid]) == -1)
      hi = mid
    else
      lo = mid + 1
  }
  return lo
}

export function pad(num, size){
  return Array(Math.max(size - num.toString().length + 1, 0)).join(0) + num
}

export function addStyleResolve(name){
  GM_addStyle(GM_getResourceText(name).replace(
    /url\("?([^":]+)"?\)/g, (match, url) => `url("${GM_getResourceURL(`${name}/${url}`)}")`
  ))
}
