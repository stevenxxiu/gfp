import {LogTime} from 'gfp/logger'

function main(){
  LogTime.start()
  let config = require('gfp/config').default
  let searchGui = null
  // es5 to allow webpack to parse requires
  for(let i = 0; i < config.plugins.length; i++)
    searchGui = require('gfp/plugin/' + config.plugins[i]).default(searchGui)
  let pref = require('gfp/pref').default
  new pref(searchGui)
  LogTime.snap('Total init time')
}

main()
