
/**
dummy functions emulating greasemonkey and googleSearchFilterPlus for prefGui testing
*/

/**
core functions
*/

function logArgs(name,args){
	if(window.console) console.log(name+': '+Array.prototype.slice.call(args).toSource());
}

function GM_getValue(name,def){
	logArgs('GM_getValue',arguments);
	return undefined;
}

function GM_setValue(name,val){
	logArgs('GM_setValue',arguments);
	return undefined;
}

/**
add filters
*/

let filters=Filter.knownFilters;

gfpFilter.fromText('@@test1',filters);
gfpFilter.fromText('@@/test2/',filters);
gfpFilter.fromText('test3',filters);
gfpFilter.fromText('/test4/',filters);
gfpFilter.fromText('/test5(/',filters);
gfpFilter.fromText('a$$b$$c',filters);

let testFilter1=gfpFilter.fromObject({
	text: 'slowFilter1',
	disabled: 'false',
	hitCount: '1',
},filters);

let testFilter2=gfpFilter.fromObject({
	text: '/fastFilter2/*',
	disabled: 'true',
	hitCount: '2',
},filters);

let testFilter3=gfpFilter.fromObject({
	text: '/fastFilter3/*',
	disabled: 'false',
	hitCount: '3',
},filters);

let testFilter4=gfpFilter.fromObject({
	text: '/fastFilter4/*',
	disabled: 'false',
	hitCount: '4',
},filters);

let testFilter5=gfpFilter.fromObject({
	text: '/fastFilter5/*',
	disabled: 'false',
	hitCount: '5',
},filters);

/**
test
*/

function test(){
	alert(Filter.knownFilters['@@test1'] instanceof WhitelistFilter);
	alert(Filter.knownFilters['test3'] instanceof WhitelistFilter);
	alert(Filter.knownFilters['/test5(/'] instanceof InvalidFilter);

	alert(defaultMatcher.findShortcut(testFilter1));
	alert(defaultMatcher.findShortcut(testFilter2));
}
