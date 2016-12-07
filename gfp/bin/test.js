import 'jsdom-global/register'
import sinon from 'sinon'
import {assert} from 'chai'

function main(){
  global.GM_addStyle = () => null
  global.GM_getResourceText = () => null
  global.GM_getResourceURL = () => null
  global.GM_getValue = (name, value) => value
  global.GM_setValue = () => null
  sinon.assert.expose(assert, {prefix: ''})
  let context = require.context('gfp', true, /\/test_[^/]+\.js$/)
  context.keys().forEach(context)
}

main()
