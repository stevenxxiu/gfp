for(let funcName of ['GM_addStyle', 'GM_getValue', 'GM_setValue'])
  window[funcName] = () => null;
sinon.assert.expose(assert, {prefix: ''});
let context = require.context('.', true, /\/test_[^/]+\.js$/);
context.keys().forEach(context);
