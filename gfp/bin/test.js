import sinon from 'sinon'
import {assert} from 'chai'

function main(){
  window.GM_addStyle = () => null
  window.GM_getResourceText = () => null
  window.GM_getResourceURL = () => null
  window.GM_getValue = (name, value) => value
  window.GM_setValue = () => null
  sinon.assert.expose(assert, {prefix: ''})
  let context = require.context('gfp', true, /\/test_[^/]+\.js$/)
  context.keys().forEach(context)
}

main()
