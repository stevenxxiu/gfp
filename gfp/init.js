
function init(){
	logger.init();
	logTime.start();
	if(ext.init()==false){logger.error('ext.init()'); return;}
	if(gfpFilter.init()==false){logger.error('gfpFilter.init()'); return;}
	if(gfpMatcher.init()==false){logger.error('gfpMatcher.init()'); return;}
	if(prefLink.init()==false){logger.error('prefLink.init()'); return;}
	if(searchGui.isSearchPage()){
		if(searchGui.init()==false){logger.error('searchGui.init()'); return;}
		if(searchGui.filterResults()==false){logger.error('searchGui.filterResults()'); return;}
	}
	if(ext.loaded()==false){logger.error('ext.loaded()'); return;}
	logTime.end('Total init time');
}
