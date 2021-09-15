import Config from 'gfp/config'
import Pref from 'gfp/pref'
import { LogTime } from 'gfp/logger'

function main() {
  LogTime.start()
  const config = new Config()
  // ES5 to allow *Webpack* to parse requires
  let searchGui = null
  for (let i = 0; i < config.plugins.length; i++) {
    searchGui = require('gfp/plugin/' + config.plugins[i]).default(searchGui, config)
  }
  new Pref(searchGui)
  LogTime.snap('Total init time')
}

main()
