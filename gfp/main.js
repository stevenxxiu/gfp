import Config from 'gfp/config';
import {LogTime} from 'gfp/logger';
import {SearchGui} from 'gfp/gui';
import {Pref} from 'gfp/pref';

function main(){
  LogTime.start();
  new Pref();
  let searchGui;
  if(SearchGui.isSearchPage()){
    searchGui = new SearchGui();
    searchGui.filterResults(SearchGui.getResults());
  }
  for(let pluginName of Config.plugins)
    require(`gfp/plugin/${pluginName.toLowerCase()}`)(searchGui);
  LogTime.snap('Total init time');
}

main();
