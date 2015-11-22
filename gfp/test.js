window.GM_addStyle = () => null
window.GM_getValue = (name, value) => value
window.GM_setValue = () => null
sinon.assert.expose(assert, {prefix: ''})
let context = require.context('.', true, /\/test_[^/]+\.js$/)
context.keys().forEach(context)
