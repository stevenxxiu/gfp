import {Logger, LogTime} from 'gfp/logger';

function main(){
	LogTime.start();
	// if(ext.init()==false){logger.error('ext.init()'); return;}
	// if(gfpFilter.init()==false){logger.error('gfpFilter.init()'); return;}
	// if(gfpMatcher.init()==false){logger.error('gfpMatcher.init()'); return;}
	// if(prefLink.init()==false){logger.error('prefLink.init()'); return;}
	// if(searchGui.isSearchPage()){
	// 	if(searchGui.init()==false){logger.error('searchGui.init()'); return;}
	// 	if(searchGui.filterResults()==false){logger.error('searchGui.filterResults()'); return;}
	// }
	// if(ext.loaded()==false){logger.error('ext.loaded()'); return;}

	// init: function(){
	//   for(let i=0;i<config.ext.length;i++){
	//     let e=ext[config.ext[i]];
	//     if('init' in e) e.init();
	//   }
	// },

	// loaded: function(){
	//   for(let i=0;i<config.ext.length;i++){
	//     let e=ext[config.ext[i]];
	//     if('loaded' in e) e.loaded();
	//   }
	// };

	LogTime.snap('Total init time');
}

main();
