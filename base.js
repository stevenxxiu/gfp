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
// @include			http://www.google.tld/cse?*
// @include			https://www.google.tld/cse?*
// @include			http://www.google.tld/custom?*
// @include			https://www.google.tld/custom?*
// ==/UserScript==

/**
history:
	v1.19.9 (25-08-12):
		[fix] google results processing
	v1.19.8 (11-05-12):
		[fix] prefLink when logged in
		[add] error/msg logger
	v1.19.7 (04-05-12):
		[add] filter editor in menu commands, google pref only works when logged in
		[fix] google simulates 'esc' after some keypresses like ctrl-f, ctrl-h, prevent this from closing pref
		[fix] google results processing
		[fix] table cell overflow due to firefox upgrade
	v1.19.6 (07-12-11):
		[fix] filter link position
	v1.19.5 (22-07-11):
		[rem] removed old google prefLink positioning
	v1.19.4 (16-07-11):
		[fix] filter link position
	v1.19.3 (20-06-11):
		[fix] filter link position
	v1.19.2 (12-05-11):
		[fix] wiki entries
	v1.19.1 (23-04-11):
		[fix] google book results processing
	v1.19 (13-04-11):
		[chg] discard 'www' in addFilter dialog
	v1.18 (13-04-11):
		[add] google ssl filtering
		[fix] video filter link
	v1.17 (22-03-11):
		[fix] pref subfilter already exists bug (a$$b$$c => a$$b$$d)
		[fix] cancelling pref retains the edited filter list
		[fix] adding empty filter raises exception
	v1.16 (19-03-11):
		[chg] using css selectors instead of xpath to increase selector speed
	v1.15 (19-03-11):
		[add] google instant ext
		[fix] small fixes
	v1.14 (16-03-11):
		[fix] google custom search ext directLink
		[fix] fixed & improved googlemonkeyr ext
	v1.13 (15-03-11):
		[fix] google custom search url matching
		[add] prefLink in google custom search
	v1.12 (15-03-11):
		[fix] can't filter links more than twice when using the filter link
		[add] removes google custom search link redirects in ext
	v1.11 (15-03-11):
		[add] added google custom search extension
	v1.10 (15-03-11):
		[add] supports title, summary filtering
		[fix] various minor fixes
	v1.04 (04-03-11):
		[fix] whitelist hitcount bug
	v1.03 (03-03-11):
		[fix] pref window bug, add filter then edit filter exit will display 'filter already exists'
		[fix] bug when importing filters, then selecting will select old value (before importing)
	v1.02 (28-02-11):
		[fix] google maps bug
		[fix] live results googlemonkeyr autoload ext
		[chg] hide parent node if all child nodes hidden, when resHidden==true
	v1.01 (28-02-11):
		[fix] image linkArea bug
		[fix] live results bug
		[chg] filterClass improvements, remNode improvements
	v1.01 (27-02-11):
		[add] googlemonkeyr pagerize support
	v1.00 (19-02-11):
		[add] new gui
		[add] syntax highlighting
		[add] syntax checking (uses abp)
		[chg] uses adblock plus match engine for matching
	v0.07 (04-11-09):
		[fix] some minor bugs in _at_include, still need to improve speed after long time
	v0.06 (19-01-09):
		[fix] some problems regarding different search results (news items, etc.)
		[fix] filter starting/ending with space problems (in filter editor);
	v0.05 (18/01/09):
		[fix] 'summary' option error
	v0.04 (17-01-09):
		[add] made filtering faster (by buffering nodes)
		[add] added processing of exceptions
		[add] 'optimize' function in filter composer
		[chg] 'block' string to 'filter' (thanks to ekbookworldwide)
		[add] whenever block a new site, show filter composer
		[add] 'search box' filter: searchstr
	v0.03 (08-01-09):
		[fix] initial filters problem
	v0.02 (04-01-09):
		[fix] title not showing original filter
	v0.01:
		[chg] many changes to original script
*/

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
	//if gmonkeyr and instant are both needed, then only enable 'instant'
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
