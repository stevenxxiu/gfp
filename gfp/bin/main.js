import {LogTime} from 'gfp/logger'

function main(){
  LogTime.start()
  let config = require('gfp/config').default
  let SearchGui = require('gfp/gui').SearchGui
  let searchGui = null
  if(SearchGui.isSearchPage()){
    searchGui = new SearchGui()
    searchGui.filterResults(SearchGui.getResults())
  }
  let pref = require('gfp/pref').default
  new pref(searchGui)
  // es5 to allow webpack to parse requires
  for(let i = 0; i < config.plugins.length; i++)
    require('gfp/plugin/' + config.plugins[i].toLowerCase()).default(searchGui)
  LogTime.snap('Total init time')
}

main()
