import 'gfp/pref';
import config from 'gfp/config';
import {LogTime} from 'gfp/logger';
import {SearchGui} from 'gfp/gui';

function main(){
  LogTime.start();
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
