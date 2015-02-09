
/**
extension of adblock plus Filter class
	provides subfilter classes, filter storage
*/

let gfpFilter={
	//split options regexp
	optionsRegExp: /\$([\w,]*?)(?:\$|$)/,
	
	//getter methods
	
	isDummy: function(filter){
		return 'text' in filter;
	},
	
	isDuplicateText: function(text1,text2){
		//checking startsWith is enough, since different options are considered as different filters
		if(text1.length>text2.length){
			return text1.substr(0,text2.length)==text2;
		}else{
			return text2.substr(0,text1.length)==text1;
		}
	},
	
	isDuplicate: function(keys,filters){
		/**
		checks if filter has a duplicate in filters
		e.g.
			a$$b is a duplicate of a$$b$$c and vice versa
			a$$b$$c is not a duplicate of a$$b$$d
		returns:
			deepest duplicate level reached (<=0 if no duplicates found, positive otherwise)
		*/
		let filter;
		if(keys[0] && (keys[0] in filters)){
			filter=filters[keys[0]];
		}else{
			return 0;
		}
		for(let i=1;i<keys.length;i++){
			if('subfilters' in filter){
				filters=filter.subfilters;
			}else{
				return i;
			}
			if(keys[i] in filters){
				filter=filters[keys[i]];
			}else{
				return -i;
			}
		}
		return keys.length;
	},
	
	getSubfilter: function(keys,filters,pop){
		/**
		gets a subfilter from filters
		assumes filters are compiled
		doesn't assume keys are all valid
		*/
		let filter;
		if(keys[0] && (keys[0] in filters)){
			filter=filters[keys[0]];
		}else{
			return null;
		}
		for(let i=1;i<keys.length;i++){
			if('subfilters' in filter){
				filters=filter.subfilters;
			}else{
				return null;
			}
			if(keys[i] in filters){
				filter=filters[keys[i]];
			}else{
				return null;
			}
		}
		if(pop){
			delete filters[keys[keys.length-1]];
		}
		return filter;
	},
	
	popSubfilter: function(keys,filters){
		/**
		assumes filters are compiled
		*/
		return gfpFilter.getSubfilter(keys,filters,true);
	},
	
	isSlowFilter: function(filter,filterParts){
		/**
		args:
			filter: last subfilter
			filterParts: parts of filter excluding filter
		*/
		if((filterParts[0]||filter) instanceof CommentFilter) return false;
		for(let i=0;i<filterParts.length;i++){
			if(filterParts[i] instanceof InvalidFilter) return false;
			if(defaultMatcher.findShortcut(filterParts[i])==null) return true;
		}
		if(filter instanceof InvalidFilter) return false;
		if(defaultMatcher.findShortcut(filter)==null) return true;
		return false;
	},
	
	isSlowFilterKeys: function(keys,filters){
		/**
		assumes filters are compiled
		assumes keys exist in filters
		args:
			filter: a filter with maximum of 1 subfilter
		*/
		let filter=filters[keys[0]];
		if(filter instanceof CommentFilter) return false;
		for(let i=1;;i++){
			if(filter instanceof InvalidFilter) return false;
			if(defaultMatcher.findShortcut(filter)==null) return true;
			if(i==keys.length) return false;
			if(!('subfilters' in filter)) return false;
			filter=filter.subfilters[keys[i]];
		}
	},
	
	getKeys: function(text){
		/**
		get subfilter keys from filterText
		*/
		if(!/\S/.test(text)){
			return [];
		}
		if(text[0]=='!'){
			return [text];
		}
		let ret=[];
		let textParts=gfpFilter.str2textParts(text);
		while(textParts.length!=0){
			let text=textParts.shift();
			let option=textParts.shift();
			if(option){
				ret.push(text+'$'+option);
			}else{
				ret.push(text);
			}
		}
		return ret;
	},
	
	iterate: function(filters,callback,filterParts){
		/**
		iterates over filters
		assumes filters are compiled
		callback: [filter,filterParts]
		*/
		if(filterParts==undefined) filterParts=[];
		for each(let filter in filters){
			if('subfilters' in filter){
				filterParts.push(filter);
				gfpFilter.iterate(filter.subfilters,callback,filterParts);
				filterParts.pop();
			}else{
				callback(filter,filterParts);
			}
		}
	},
	
	//setter methods
	
	str2options: function(option,filter){
		let options=option.toUpperCase().split(',');
		for(let i=0;i<options.length;i++){
			switch(options[i]){
				case 'MATCH_CASE':
					filter.matchCase=true;
					break;
				default:
					return new InvalidFilter(filter.text,'invalid filter option');
			}
		}
		return filter;
	},
	
	str2textParts: function(text){
		let ret=text.split(gfpFilter.optionsRegExp);
		if(ret[ret.length-1].length==0){
			ret.pop();
		}
		return ret;
	},
	
	fromTextParts: function(text,option,filters){
		/**
		converts a single filter part from text, option
		stores filter into filters
		*/
		if(option){
			text+='$'+option;
		}
		if(text in filters){
			return filters[text];
		}else{
			let filter=RegExpFilter.fromText(text);
			if(option){
				filter.text=text;
				filter=gfpFilter.str2options(option,filter);
			}
			filters[text]=filter;
			return filter;
		}
	},
	
	fromText: function(text,filters){
		/**
		assumes no filters are compiled
		returns:
			if has subfilters, dummy object for filter (end of textParts)
			if no subfilters, actual filter object
		*/
		if(!/\S/.test(text)){
			return null;
		}
		if(text[0]=='!'){
			let filter=new CommentFilter(text);
			filters[text]=filter;
			return filter;
		}
		let textParts=gfpFilter.str2textParts(text);
		let filter=gfpFilter.fromTextParts(textParts.shift(),textParts.shift(),filters);
		if(filter instanceof InvalidFilter){
			return filter;
		}
		if(textParts.length==0){
			return filter;
		}
		if(!('subfilters' in filter)){
			filter.subfilters={};
			filter.compiled=false;
		}
		let dummyFilter={};
		textParts.push(dummyFilter);
		filter.subfilters[text]=textParts;
		return dummyFilter;
	},
	
	fromTextCompiled: function(text,filters){
		/**
		filters can be in any compiled state
		prefers subfilters to be compiled
		returns:
			last subfilter
		*/
		if(!/\S/.test(text)){
			return null;
		}
		if(text[0]=='!'){
			let filter=new CommentFilter(text);
			filters[text]=filter;
			return filter;
		}
		let textParts=gfpFilter.str2textParts(text);
		for(let i=0;;i=1){
			let filter=gfpFilter.fromTextParts(textParts.shift(),textParts.shift(),filters);
			if(filter instanceof InvalidFilter){
				return filter;
			}
			if(textParts.length==0){
				if(i==1){
					filter.fullText=text;
				}
				//remove subfilters so the added filter isn't a parent filter
				delete filter.subfilters;
				return filter;
			}
			if('subfilters' in filter){				
				if(!filter.compiled){
					let dummyFilter={};
					textParts.push(dummyFilter);
					filter.subfilters[text]=textParts;
					return dummyFilter;
				}
			}else{
				filter.subfilters={};
				filter.compiled=true;
			}
			filters=filter.subfilters;
		}
	},
	
	clone: function(filter){
		/**
		clones a subfilter without cloning its subfilters
		*/
		let ret=RegExpFilter.fromText(filter.text);
		if(ret instanceof ActiveFilter){
			if('disabled' in filter)
				ret.disabled=filter.disabled;
			if('hitCount' in filter)
				ret.hitCount=filter.hitCount;
			if('lastHit' in filter)
				ret.lastHit=filter.lastHit;
		}
		return ret;
	},
	
	setSubfilter: function(n,keys,filters){
		/**
		sets a subfilter to a value with given keys
		assumes that keys exist
		returns:
			final subfilter
		*/
		for(let i=0;i<keys.length-1;i++){
			filters=filters[keys[i]].subfilters;
		}
		filters[keys[keys.length-1]]=n;
		return n;
	},
	
	compileSubfilters: function(filter){
		let filters=filter.subfilters;
		let ret={};
		for(let text in filters){
			let textParts=filters[text];
			let l=textParts.length;
			let filter;
			if(l==2){
				filter=gfpFilter.fromTextParts(textParts.shift(),'',ret);
			}else{
				filter=gfpFilter.fromTextParts(textParts.shift(),textParts.shift(),ret);
			}
			if(filter instanceof InvalidFilter){
				continue;
			}
			if(l<=3){
				//copy properties of dummyFilter into actual filter
				let dummyFilter=textParts.shift();
				for(let key in dummyFilter){
					filter[key]=dummyFilter[key];
				}
				filter.fullText=text;
				continue;
			}
			if(!('subfilters' in filter)){
				filter.subfilters={};
				filter.compiled=false;
			}
			filter.subfilters[text]=textParts;
		}
		filter.compiled=true;
		filter.subfilters=ret;
		return ret;
	},
	
	compileAll: function(filters){
		/**
		compiles all filters
		*/
		for each(let filter in filters){
			if('subfilters' in filter){
				if(!filter.compiled){
					gfpFilter.compileAll(gfpFilter.compileSubfilters(filter));
				}
			}
		}
		return filters;
	},
	
	getSubfilters: function(filter){
		if(filter.compiled) return filter.subfilters;
		return gfpFilter.compileSubfilters(filter);
	},
	
	//string operations
	
	stringifyRawS: function(filters,buffer,simpleStore){
		/**
		stringify a sub, uncompiled filter
		*/
		let serialize=ActiveFilter.prototype.serialize;
		for(let text in filters){
			let filter=filters[text];
			filter=filter[filter.length-1];
			let o_len=buffer.length;
			filter.text=escape(text);
			serialize.call(filter,buffer);
			if(buffer.length==o_len){
				simpleStore.push(text);
			}
		}
	},
	
	stringifyRawC: function(filters,buffer,simpleStore,isSub){
		/**
		stringify a compiled filter
		*/
		for each(let filter in filters){
			if('subfilters' in filter){
				if(filter.compiled){
					gfpFilter.stringifyRawC(filter.subfilters,buffer,simpleStore,true);
				}else{
					gfpFilter.stringifyRawS(filter.subfilters,buffer,simpleStore);
				}
			}else{
				let o_len=buffer.length;
				let text=isSub?filter.fullText:filter.text;
				filter.text=escape(text);
				filter.serialize(buffer);
				filter.text=text;
				if(buffer.length==o_len){
					//simpleStore does not need escaping
					simpleStore.push(text);
				}
			}
		}
	},
	
	stringify: function(filters){
		let buffer=[];
		let simpleStore=['[Simple Store]'];
		gfpFilter.stringifyRawC(filters,buffer,simpleStore,false);
		let ret='';
		if(buffer.length!=0) ret+=buffer.join('\n')+'\n';
		ret+=simpleStore.join('\n');
		return ret;
	},
	
	_parse: function(s,fromObject){
		/**
		verifies s
		returns: parsed filters
		*/
		let ret={};
		let buffer=s.split('\n');
		let i=0;
		for(i=0;i<buffer.length;){
			if(buffer[i]=='[Filter]'){
				let filter={};
				for(i++;buffer[i][0]!='[' && i<buffer.length;i++){
					let [key,val]=buffer[i].split('=');
					filter[key]=val;
				}
				if(filter.text==undefined){
					throw 'invalid serialized string';
				}
				filter.text=unescape(filter.text);
				fromObject(filter,ret);
			}else if(buffer[i]=='[Simple Store]'){
				i++;
				break;
			}else{
				throw 'invalid serialized string';
			}
		}
		if(i==0 && i<buffer.length){
			throw 'invalid serialized string';
		}
		for(;i<buffer.length;i++){
			gfpFilter.fromText(buffer[i],ret);
		}
		return ret;
	},
	
	parse: function(s){
		return gfpFilter._parse(s,gfpFilter.fromObject);
	},
	
	parseCompiled: function(s){
		return gfpFilter._parse(s,gfpFilter.fromObjectCompiled);
	},
	
	//Filter class hooks
	
	fromObject: function(obj,filters){
		let ret=gfpFilter.fromText(obj.text,filters);
		if(ret instanceof ActiveFilter || ret.constructor==Object){
			if('disabled' in obj)
				ret.disabled=(obj.disabled=='true');
			if('hitCount' in obj)
				ret.hitCount=parseInt(obj.hitCount)||0;
			if('lastHit' in obj)
				ret.lastHit=parseInt(obj.lastHit)||0;
		}
		return ret;
	},
	
	fromObjectCompiled: function(obj,filters){
		let ret=gfpFilter.fromTextCompiled(obj.text,filters);
		if(!ret) return null;
		if(ret instanceof ActiveFilter || ret.constructor==Object){
			if('disabled' in obj)
				ret.disabled=(obj.disabled=='true');
			if('hitCount' in obj)
				ret.hitCount=parseInt(obj.hitCount)||0;
			if('lastHit' in obj)
				ret.lastHit=parseInt(obj.lastHit)||0;
		}
		return ret;
	},
	
	//storage
	
	flush: function(filters){
		/**
		flushes filters to Filter.knownFilters
		*/
		Filter.knownFilters=filters;
	},
	
	isPtr: function(filters){
		return Filter.knownFilters==filters;
	},
	
	save: function(){
		GM_setValue('filters',gfpFilter.stringify(Filter.knownFilters));
	},
	
	load: function(){
		let s=GM_getValue('filters');
		if(s==undefined){
			//load filters from default config
			let textFilters=config.filters;
			let filters=Filter.knownFilters;
			for(let i=0;i<textFilters.length;i++){
				gfpFilter.fromText(textFilters[i],filters);
			}
			gfpFilter.save();
		}else{
			gfpFilter.flush(gfpFilter.parse(s));
		}
	},
	
	//init
	
	init: function(){
		//save some time by removing some abp parsing
		let emptyRegex={'test': function() false};
		Filter.optionsRegExp=emptyRegex;
		Filter.elemhideRegExp=emptyRegex;
		gfpFilter.load();
	},
}
