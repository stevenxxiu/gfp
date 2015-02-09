
var test={
	log: function(str){
		if(str==undefined) return;
		document.write(str);
	},

	logLine: function(str){
		test.log(str);
		test.log('<br>');
	},
	
	arrEqual: function(a,b){
		if(a.length!=b.length) return false;
		for(var i=0;i<a.length;i++){
			if(a[i]!=b[i]) return false;
		}
		return true;
	},
	
	normal2keywords: function(){
		//simple test 1
		var mf=new matchFilter(['http://www.example.com/']);
		mf.filter2keywords();
		test.logLine(test.arrEqual(mf.keywords,['http://www.example.com/']));
		//simple test 2
		var mf=new matchFilter(['http://www.ex*mple.com/']);
		mf.filter2keywords();
		test.logLine(test.arrEqual(mf.keywords,['http://www.ex','mple.com/']));
		//startswith test
		var mf=new matchFilter(['|http://www.example.com/']);
		mf.filter2keywords();
		test.log(test.arrEqual(mf.startKeywords,['http://www.example.com/']));
		test.log(test.arrEqual(mf.keywords,[]));
		test.logLine();
		//startswith test 2
		var mf=new matchFilter(['|http://www.ex*mple.com/']);
		mf.filter2keywords();
		test.log(test.arrEqual(mf.startKeywords,['http://www.ex']));
		test.log(test.arrEqual(mf.keywords,['mple.com/']));
		test.logLine();
		//domain test
		var mf=new matchFilter(['||www.example.com/']);
		mf.filter2keywords();
		test.log(test.arrEqual(mf.domainKeywords,['www.example.com/']));
		test.log(test.arrEqual(mf.keywords,[]));
		test.logLine();
		//domain test 2
		var mf=new matchFilter(['|||www.ex*ample*com/']);
		mf.filter2keywords();
		test.log(test.arrEqual(mf.domainKeywords,['|www.ex']));
		test.log(test.arrEqual(mf.keywords,['ample','com/']));
		test.logLine();
	},
	
	regex2keywords: function(){
		//simple test
		var mf=new matchFilter(['/example/']);
		mf.filter2keywords();
		test.logLine(test.arrEqual(mf.keywords,['example']));
		
		//startswith test
		var mf=new matchFilter(['/^example/']);
		mf.filter2keywords();
		test.log(test.arrEqual(mf.startKeywords,['example']));
		test.log(test.arrEqual(mf.keywords,[]));
		test.logLine();
		//startswith test 2
		var mf=new matchFilter(['/^exa.ple/']);
		mf.filter2keywords();
		test.log(test.arrEqual(mf.startKeywords,['exa']));
		test.log(test.arrEqual(mf.keywords,['ple']));
		test.logLine();
		
		//end test
		var mf=new matchFilter(['/example$/']);
		mf.filter2keywords();
		test.logLine(test.arrEqual(mf.keywords,['example']));
		
		//char wildcard test
		var mf=new matchFilter(['/example*/']);
		mf.filter2keywords();
		test.logLine(test.arrEqual(mf.keywords,['exampl']));
		//char wildcard test 2
		var mf=new matchFilter(['/exa.ple/']);
		mf.filter2keywords();
		test.logLine(test.arrEqual(mf.keywords,['exa','ple']));
		
		//char plus wildcard test
		var mf=new matchFilter(['/example+/']);
		mf.filter2keywords();
		test.logLine(test.arrEqual(mf.keywords,['example']));
		//char plus wildcard test 2
		var mf=new matchFilter(['/example+s/']);
		mf.filter2keywords();
		test.logLine(test.arrEqual(mf.keywords,['example','s']));
		
		//char optional test
		var mf=new matchFilter(['/example?s/']);
		mf.filter2keywords();
		test.logLine(test.arrEqual(mf.keywords,['exampl','s']));
		//or test
		var mf=new matchFilter(['/exa|ple/']);
		mf.filter2keywords();
		test.logLine(test.arrEqual(mf.keywords,[]));
		
		//char match multi test
		var mf=new matchFilter(['/example{0}/']);
		mf.filter2keywords();
		test.logLine(test.arrEqual(mf.keywords,['exampl']));
		//char match multi test 2
		var mf=new matchFilter(['/example{1}s/']);
		mf.filter2keywords();
		test.logLine(test.arrEqual(mf.keywords,['example','s']));
		//char match multi test 3
		var mf=new matchFilter(['/example{1,}s/']);
		mf.filter2keywords();
		test.logLine(test.arrEqual(mf.keywords,['example','s']));
		//char match multi test 4
		var mf=new matchFilter(['/example{1,2}s/']);
		mf.filter2keywords();
		test.logLine(test.arrEqual(mf.keywords,['example','s']));
		//char match multi test 5
		var mf=new matchFilter(['/example{0,2}s/']);
		mf.filter2keywords();
		test.logLine(test.arrEqual(mf.keywords,['exampl','s']));
		
		//char set test
		var mf=new matchFilter(['/exa[mn\\d\\x12\\u1234\\z\\]?]pl[de]s/']);
		mf.filter2keywords();
		test.logLine(test.arrEqual(mf.keywords,['exa','pl','s']));
		//char set num test
		var mf=new matchFilter(['/exa\\12345mples/']);
		mf.filter2keywords();
		test.logLine(test.arrEqual(mf.keywords,['exa','mples']));
		//special char sets test
		var mf=new matchFilter(['/a\\d+\\D\\f\\ncdef\\r+\\s+\\t\\v\\s\\w\\n\\0\\x41\\d\\d\\u1234\\\\/']);
		mf.filter2keywords();
		test.logLine(test.arrEqual(mf.keywords,['a','\f\ncdef\r','\t\v','\n\0a','\u1234\\']));
		
		//group test 1
		var mf=new matchFilter(['/exa(mple)/']);
		mf.filter2keywords();
		test.logLine(test.arrEqual(mf.keywords,['example']));
		//group test 2
		var mf=new matchFilter(['/^exa(mple)/']);
		mf.filter2keywords();
		test.logLine(test.arrEqual(mf.startKeywords,['example']));
		//group test 3
		var mf=new matchFilter(['/^exa(?=mple)/']);
		mf.filter2keywords();
		test.logLine(test.arrEqual(mf.startKeywords,['example']));
		//group test 4
		var mf=new matchFilter(['/exa(?![a-z]\dabcd)mple/']);
		mf.filter2keywords();
		test.logLine(test.arrEqual(mf.keywords,['exa','mple']));
		//group test 5
		var mf=new matchFilter(['/^(e(x(a(?:m)p)l)e)/']);
		mf.filter2keywords();
		test.logLine(test.arrEqual(mf.startKeywords,['example']));
		//group test 6
		var mf=new matchFilter(['/^exa(?:.*abc)mple/']);
		mf.filter2keywords();
		test.log(test.arrEqual(mf.keywords,['abcmple']));
		test.log(test.arrEqual(mf.startKeywords,['exa']));
		test.logLine();
		//group test 7
		var mf=new matchFilter(['/^exa(?:.*abc.*)mple/']);
		mf.filter2keywords();
		test.log(test.arrEqual(mf.keywords,['abc','mple']));
		test.log(test.arrEqual(mf.startKeywords,['exa']));
		test.logLine();
		//group test 8
		var mf=new matchFilter(['/(e(x(a(?:m)p)l)e)/']);
		mf.filter2keywords();
		test.logLine(test.arrEqual(mf.keywords,['example']));
		//group test 9
		var mf=new matchFilter(['/exa(?:.*ab|c.*)mple/']);
		mf.filter2keywords();
		test.logLine(test.arrEqual(mf.keywords,['exa','mple']));
		//group test 10
		var mf=new matchFilter(['/exa()mple/']);
		mf.filter2keywords();
		test.logLine(test.arrEqual(mf.keywords,['example']));
		//group test 11
		var mf=new matchFilter(['/exa(?:.*)mple/']);
		mf.filter2keywords();
		test.logLine(test.arrEqual(mf.keywords,['exa','mple']));
		//group test 12
		var mf=new matchFilter(['/exa((()))mple/']);
		mf.filter2keywords();
		test.logLine(test.arrEqual(mf.keywords,['example']));
		//group test 13
		var mf=new matchFilter(['/a(?=|[])?b/']);
		mf.filter2keywords();
		test.logLine(test.arrEqual(mf.keywords,['ab']));
		//group test 14
		var mf=new matchFilter(['/a(?=|[?!])?b/']);
		mf.filter2keywords();
		test.logLine(test.arrEqual(mf.keywords,['a','b']));
		//group test 15
		var mf=new matchFilter(['/a([])b/']);
		mf.filter2keywords();
		test.logLine(test.arrEqual(mf.keywords,['ab']));
		
		//generic test
		var mf=new matchFilter(['/(http|ftp|https):\\/\\/[\\w\\-_]+(\\.[\\w\\-_]+)+([\\w\\-\\.,@?^=%&amp;:/~\\+#]*[\\w\\-\\@?^=%&amp;/~\\+#])?abc/']);
		mf.filter2keywords();
		test.logLine(test.arrEqual(mf.keywords,['://','.','abc']));
		
	},
}
