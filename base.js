// ==UserScript==
// @name			Google Search Filter Plus
// @description		Filters google search results
// @namespace		smk
// @include			http://www.google.tld/
// @include			https://www.google.tld/
// @include			https://encrypted.google.com/
// @include			http://www.google.tld/search?*
// @include			https://www.google.tld/search?*
// @include			https://encrypted.google.com/search?*
// @include			http://www.google.tld/#*&q=*
// @include			https://www.google.tld/#*&q=*
// @include			http://www.google.tld/#q=*
// @include			https://www.google.tld/#q=*
// @include			https://encrypted.google.com/#*&q=*
// @include			http://www.google.tld/cse?*
// @include			https://www.google.tld/cse?*
// @include			http://www.google.tld/custom?*
// @include			https://www.google.tld/custom?*
// ==/UserScript==

/**
thanks to:
	adblock plus
	cho45
	ekbookworldwide
	marti
	sizzlemctwizzle
	webismymind
*/

let config={
	//blocked sites (default)
	filters: [
		'||daniweb.com',
		'||velocityreviews.com',
	],
	
	//completely hide filter results (default)
	resHidden: false,
	
	//enabled extensions
	ext: ['gmonkeyr','customSearch','instant'],
	
	//log component times
	logTime: true,
}

/**
helper functions
*/

function $X(x, t, r) {
    if (t && t.tagName) 
        var h = r, r = t, t = h;    
    var d = r ? r.ownerDocument || r : r = document, p;
    switch (t) {
    case XPathResult.NUMBER_TYPE:
        p = 'numberValue';
        break;
    case XPathResult.STRING_TYPE:
        p = 'stringValue';
        break;
    case XPathResult.BOOLEAN_TYPE:
        p = 'booleanValue';
        break;
    case XPathResult.ANY_UNORDERED_NODE_TYPE: 
    case XPathResult.FIRST_ORDERED_NODE_TYPE:
        p = 'singleNodeValue';
        break;
    default:
        return d.evaluate(x, r, null, t || XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    }
    return d.evaluate(x, r, null, t, null)[p];
}

/**
helper classes
*/

let logger={
	msg: GM_log,
	error: function(msg) GM_log('Error: '+msg),
}

let logTime={
	currTime: null,
	
	start: function(){
		logTime.currTime=new Date().getTime();
	},
	
	snap: function(msg){
		GM_log(msg+': '+(new Date().getTime()-logTime.currTime)+'ms');
	},
	
	end: function(msg){
		logTime.snap(msg);
		logTime.currTime=null;
	},
	
	restart: function(msg){
		logTime.snap(msg);
		logTime.start();
	},
	
	profile: function(parent,funcName){
		let tTime=0;
		let func=parent[funcName];
		
		parent[funcName]=function(){
			let currTime=new Date().getTime();
			let ret=func.apply(this,arguments);
			tTime+=new Date().getTime()-currTime;
			return ret;
		};
		
		this.snap=function(msg){
			GM_log(msg+': '+tTime+'ms');
		};
		
		this.end=function(msg){
			this.snap(msg);
			tTime=0;
		};
	},
};

if(!config.logTime){
	for(let key in logTime){
		if(logTime[key].constructor==Function){
			logTime[key]=function(){};
		}
	}
}
