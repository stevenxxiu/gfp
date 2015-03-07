import {LogTime} from 'gfp/logger';

function main(){
  LogTime.start();
  require('gfp/pref');
  let config = require('gfp/config');
  let SearchGui = require('gfp/gui').SearchGui;
  let searchGui;
  if(SearchGui.isSearchPage()){
    searchGui = new SearchGui();
    searchGui.filterResults(SearchGui.getResults());
  }
  for(let pluginName of config.plugins)
    require(`gfp/plugin/${pluginName.toLowerCase()}`)(searchGui);
  LogTime.snap('Total init time');
}

main();
