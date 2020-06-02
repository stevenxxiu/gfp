export function addStyleResolve(name) {
  GM_addStyle(
    GM_getResourceText(name).replace(
      /url\("?([^":]+)"?\)/g,
      (match, url) => `url("${GM_getResourceURL(`${name}/${url}`)}")`
    )
  )
}

export function pad(num, size) {
  return Array(Math.max(size - num.toString().length + 1, 0)).join(0) + num
}

export function cache(obj, prop, value) {
  Object.defineProperty(obj, prop, { value: value })
  return value
}

export function bisect(a, x, comparer, lo = 0, hi = null) {
  // ported from the python standard library
  if (lo < 0) {
    throw 'lo must be non-negative'
  }
  if (hi === null) {
    hi = a.length
  }
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    if (comparer(x, a[mid]) < 0) {
      hi = mid
    } else {
      lo = mid + 1
    }
  }
  return lo
}

export function indexOfSorted(xs, ys, comparer) {
  const res = []
  let i = 0
  for (const y of ys) {
    // noinspection JSSuspiciousNameCombination
    i = bisect(xs, y, comparer, i + 1) - 1
    res.push(xs[i] === y ? i : -1)
  }
  return res
}

export function popMany(xs, is) {
  // O(n) time, mask is not'ed for speed
  const mask = new Array(xs.length)
  for (const i of is) {
    mask[i] = true
  }
  let offset = 0
  for (let i = 0; i < xs.length; i++) {
    if (mask[i] === undefined) {
      xs[offset] = xs[i]
      offset++
    }
  }
  xs.length = offset
  return xs
}
