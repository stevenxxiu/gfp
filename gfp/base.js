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
		'||daniweb.com^',
		'||velocityreviews.com^',
	],
	
	//completely hide filter results (default)
	resHidden: false,
	
	//enabled extensions
	ext: ['gmonkeyr','customSearch','instant'],
	
	//log component times
	logTime: true,
}
