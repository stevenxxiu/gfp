import Config from 'gfp/config';
import {LogTime} from 'gfp/logger';
import {SearchGui} from 'gfp/gui';

let plugins = {
  customSearch: () => require('gfp/plugin/customsearch'),
  instant: () => require('gfp/plugin/instant'),
};

function main(){
  LogTime.start();
  let searchGui;
  if(SearchGui.isSearchPage()){
    searchGui = new SearchGui();
    searchGui.filterResults();
  }
  for(let pluginName of Config.plugins)
    plugins[pluginName]()(searchGui);
  LogTime.snap('Total init time');
}

main();
