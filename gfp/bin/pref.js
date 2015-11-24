/* globals $ */

function main(){
  window.store = (() => {
    let pad = (num, size) => Array(Math.max(size - num.toString().length + 1, 0)).join(0) + num
    let filters = {
      'slow filter': {},
      ' fast filter ': {},
      ' matched ': {hitCount: 1, lastHit: new Date(2000, 0, 2, 2, 4, 5, 6).getTime()},
    }
    for(let i = 0; i < 50; i++)
      filters[' filler ' + pad(i, 2) + ' '] = {}
    return {filters: JSON.stringify(filters)}
  })()
  window.GM_addStyle = (text) => {
    if(text == '')
      return
    let style = document.createElement('style')
    style.textContent = text
    document.head.appendChild(style)
  }
  window.GM_getResourceText = () => ''
  window.GM_getResourceURL = () => ''
  window.GM_registerMenuCommand = (name, cb) => $(cb)
  window.GM_getValue = (name, value) => name in window.store ? window.store[name]: value
  window.GM_setValue = (name, value) => window.store[name] = value
  require('gfp/pref')
  let config = require('gfp/config').default
  // XXX add buttons

}

main()
