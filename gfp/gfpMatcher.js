
/**
core filter matcher operations
	uses adblock plus Matcher class
*/

let gfpMatcher={
	add: function(filter,keys){
		/**
		adds filter matcher to parent filter's submatcher, if it exists
		checks if filter is a dummy filter
		args:
			keys: filter's keys
		*/
		if(!(filter instanceof ActiveFilter)) return;
		if(keys.length==1){
			defaultMatcher.add(filter);
			return;
		}
		defaultMatcher.add(Filter.knownFilters[keys[0]]);
		if(!gfpFilter.isDummy(filter)){
			//filter is not a dummy filter, parent is compiled
			keys.pop();
			let parentFilter=gfpFilter.getSubfilter(keys);
			if('submatcher' in parentFilter){
				parentFilter.submatcher.add(filter);
			}
		}
	},
	
	getSubmatcher: function(filter){
		if('submatcher' in filter) return filter.submatcher;
		let submatcher=new CombinedMatcher();
		for each(let subfilter in gfpFilter.getSubfilters(filter)){
			if(filter instanceof ActiveFilter){
				submatcher.add(subfilter);
			}
		}
		filter.submatcher=submatcher;
		return submatcher;
	},
	
	matchesAny: function(nodeData){
		return this._matchesAny(nodeData.url,nodeData,gfpMatcher.matchesUrl);
	},
	
	matchesUrl: function(filter,url,nodeData){
		/**
		replaces ActiveFilter.matches
		*/
		if(!filter.regexp.test(url)) return null;
		if(!('subfilters' in filter)) return filter;
		//check if matches title
		return gfpMatcher.getSubmatcher(filter)._matchesAny(nodeData.title,nodeData,gfpMatcher.matchesTitle);
	},
	
	matchesTitle: function(filter,title,nodeData){
		/**
		replaces ActiveFilter.matches
		*/
		if(!filter.regexp.test(title)) return null;
		if(!('subfilters' in filter)) return filter;
		//check if matches summary
		return gfpMatcher.getSubmatcher(filter)._matchesAny(nodeData.summary,nodeData,gfpMatcher.matchesSummary);
	},
	
	matchesSummary: function(filter,summary,nodeData){
		/**
		replaces ActiveFilter.matches
		*/
		if(!filter.regexp.test(summary)) return null;
		return filter;
	},
	
	_matchesAny: function(text,nodeData,matchesFunc){
		if(!text) return null;
		let blacklistHit=null;
		if(this.whitelist.hasShortcuts || this.blacklist.hasShortcuts){
			//optimized matching using shortcuts
			let hashWhite=this.whitelist.shortcutHash;
			let hashBlack=this.blacklist.shortcutHash;

			let candidates=text.toLowerCase().match(/[a-z0-9%]{3,}/g);
			if(candidates){
				for(let i=0,l=candidates.length;i<l;i++){
					let substr=candidates[i];
					if(substr in hashWhite){
						let ret=hashWhite[substr].matches(text,nodeData,matchesFunc);
						if(ret) return ret;
					}
					if(substr in hashBlack && !blacklistHit){
						let ret=hashBlack[substr].matches(text,nodeData,matchesFunc);
						if(ret) blacklistHit=ret;
					}
				}
			}
		}
		
		//slow matching for filters without shortcut
		for each(let filter in this.whitelist.regexps){
			let ret=matchesFunc(filter,text,nodeData);
			if(ret) return ret;
		}
		if(blacklistHit) return blacklistHit;
		for each(let filter in this.blacklist.regexps){
			let ret=matchesFunc(filter,text,nodeData);
			if(ret) return ret;
		}
		return null;
	},

	init: function(){
		//initialize defaultMatcher
		for each(let filter in Filter.knownFilters){
			if(filter instanceof ActiveFilter && !filter.disabled){
				defaultMatcher.add(filter);
			}
		}
	},
}

CombinedMatcher.prototype.matchesAny=gfpMatcher.matchesAny;

CombinedMatcher.prototype._matchesAny=gfpMatcher._matchesAny;

RegExpFilterGroup.prototype.matches=function(text,nodeData,matchesFunc){
	for(let i=0,l=this.filters.length;i<l;i++){
		let ret=matchesFunc(this.filters[i],text,nodeData);
		if(ret) return ret;
	}
	return null;
}

RegExpFilter.prototype.matches=function(text,nodeData,matchesFunc){
	return matchesFunc(this,text,nodeData);
}

