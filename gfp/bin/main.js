import {LogTime} from 'gfp/logger'

function main(){
  LogTime.start()
  require('gfp/pref')
  let config = require('gfp/config').default
  let SearchGui = require('gfp/gui').SearchGui
  let searchGui
  if(SearchGui.isSearchPage()){
    searchGui = new SearchGui()
    searchGui.filterResults(SearchGui.getResults())
  }
  // es5 to allow webpack to parse requires
  for(let i=0; i<config.plugins.length; i++)
    require('gfp/plugin/' + config.plugins[i].toLowerCase()).default(searchGui)
  LogTime.snap('Total init time')
}

main()
