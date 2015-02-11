
function matchFilter(filters,filtersCase){
	this.add=function(l,n){
		/**
		add element to set (array)
		returns: added index
		*/
		let i=l.indexOf(n);
		if(i!=-1) return i;
		l.push(n);
		return l.length-1;
	}
	
	this.getFilterType=function(filter){
		/**
		gets filter type
		types:
			-1: invalid
			0: normal
			1: regex
		*/
		if(filter[0]=='/' && /\/[a-z]*$/i.test(filter)){
			let i=filter.lastIndexOf('/');
			try{new RegExp(filter.substring(1,i),filter.substr(i+1));}
			catch(e){return -1;}
			return 1;
		}else{
			//filters cannot be empty
			if(filter=='' || filter=='*' || filter.indexOf('**')!=-1) return -1;
			return 0;
		}
	}
	
	this.walkNum=function(filter,i){
		/**
		walks until char isn't a digit
		*/
		let c;
		do{
			c=filter.charCodeAt(i++);
		}while(c>=0x30 && c<=0x39);
		return i-1;
	}
	
	this.regWalkCharNext=function(filter,i){
		/**
		gets to the next regex char position
		returns: next regex char pos
		*/
		switch(filter[i]){
			case '\\':
				i++;
				switch(filter[i++]){
					case 'c': i++; break;
					case 'x': i+=2; break;
					case 'u': i+=4; break;
				}
				break
			default:
				i++;
		}
		return i;
	}
	
	this.regWalkCharSet=function(filter,i){
		/**
		walks regex char set
		returns: end of char set pos
		*/
		if(filter[i]!='[') return i;
		for(i++;i<filter.length;i=this.regWalkCharNext(filter,i)){
			if(filter[i]==']') break;
		}
		return i+1;
	}
	
	this.regIsCharSetNop=function(filter,i,j){
		/**
		checks if char set is equivalent to a nop
		*/
		if(j==i+2 && filter.substr(i,2)=='[]') return true;
		return false;
	}
	
	this.regWalkGroup=function(filter,i,depth){
		/**
		walks regex group
		args:
			depth (optional): if specified and is not 0, will assume i is in the middle of the group,
				and walk to the end
		returns: end of group pos
		*/
		if(!depth){
			if(filter[i]!='(') return i;
			//checking for group options unnecessary
			depth=0;
		}
		for(;i<filter.length;){
			switch(filter[i]){
				case '[': i=this.regWalkCharSet(filter,i); break;
				case '(': depth++; i++; break;
				case ')': depth--; i++; break;
				default: i=this.regWalkCharNext(filter,i);
			}
			if(depth==0) break;
		}
		return i;
	}
	
	this.regWalkMatch=function(filter,i){
		/**
		walks match operators
		returns: end of match operators
		*/
		switch(filter[i]){
			case '*': i++; break;
			case '+': i++; break;
			case '?': i++; break;
			case '{': i=filter.indexOf('}',i+1)+1; break;
		}
		return i;
	}
	
	this.regMatchOptional=function(filter,i){
		/**
		checks if match is optional
		returns: [optional,i]
		*/
		let optional=false;
		switch(filter[i]){
			case '*':
				optional=true;
				i++;
				break;
			case '+':
				i++;
				break;
			case '?':
				optional=true;
				i++;
				break;
			case '{':
				i++;
				let endMatchOp=filter.indexOf('}',i);
				let n=filter.substring(i,endMatchOp);
				if(n.indexOf(',')==-1){
					if(parseInt(n)==0) optional=true;
				}else{
					if(parseInt(n.substr(0,n.indexOf(',')))==0) optional=true;
				}
				i=endMatchOp+1;
				break;
		}
		return [optional,i];
	}
	
	this.regexGroup2keywords=function(filter,i,inGroup){
		/**
		converts a regex group to keywords
		returns: [currStartKeyword,currKeywords,stLast_j,isGroupNop,j]
		*/
		let currStartKeyword='';
		let currKeywords=[];
		
		if(i==null) i=1;
		let matchSK;
		if(inGroup) matchSK=true;
		else matchSK=false;
		
		//current position of filter
		let j=0;
		//continuing position of current keyword
		let start=i;
		//stored current keyword (continues at start)
		let currKeyword='';
		//last keyword store position, used to check if the last keyword is at the end of the group
		let stLast_j=-1;
		//true if group is equivalent to a nop
		let isGroupNop=true;
		//if all keywords can be purged ('|' is encountered')
		let purgeKeywords=false;
		
		let stLastKeyword=function(o_j){
			/**
			flush currKeyword
			does not update start
			*/
			let n=currKeyword+filter.substring(start,o_j);
			//convert n to lower case for case-insensitive match
			n=n.toLowerCase();
			if(matchSK){
				currStartKeyword=n;
				currKeyword='';
				matchSK=false;
			}else{
				if(n){
					currKeywords.push(n);
					currKeyword='';
				}
			}
			if(n) stLast_j=o_j;
		}
		let updateCurrKeyword=function(o_j,s){
			/**
			update currKeyword
			does not update start
			*/
			if(s) currKeyword+=filter.substring(start,o_j)+s;
			else currKeyword+=filter.substring(start,o_j);
		}
		
		let processEnd=false;
		for(j=i;j<filter.length;j++){
			let o_j;
			switch(filter[j]){
				case '/':
					stLastKeyword(j);
					processEnd=true;
					j=filter.length;
					break;
				case '\\':
					//check if special character is constant
					j++;
					switch(filter[j++]){
						case 'c': updateCurrKeyword(j-2,String.fromCharCode(filter.charCodeAt(j)-0x40)); j++; break;
						case 'f': updateCurrKeyword(j-2,'\f'); break;
						case 'n': updateCurrKeyword(j-2,'\n'); break;
						case 'r': updateCurrKeyword(j-2,'\r'); break;
						case 't': updateCurrKeyword(j-2,'\t'); break;
						case 'v': updateCurrKeyword(j-2,'\v'); break;
						case 'x': updateCurrKeyword(j-2,String.fromCharCode(parseInt(filter.substr(j,2),16))); j+=2; break;
						case 'u': updateCurrKeyword(j-2,String.fromCharCode(parseInt(filter.substr(j,4),16))); j+=4; break;
						case '0': updateCurrKeyword(j-2,'\0'); break;
						case 'b': stLastKeyword(j-2); j=this.regWalkMatch(filter,j); break;
						case 'B': stLastKeyword(j-2); j=this.regWalkMatch(filter,j); break;
						case 'd': stLastKeyword(j-2); j=this.regWalkMatch(filter,j); break;
						case 'D': stLastKeyword(j-2); j=this.regWalkMatch(filter,j); break;
						case 's': stLastKeyword(j-2); j=this.regWalkMatch(filter,j); break;
						case 'S': stLastKeyword(j-2); j=this.regWalkMatch(filter,j); break;
						case 'w': stLastKeyword(j-2); j=this.regWalkMatch(filter,j); break;
						case 'W': stLastKeyword(j-2); j=this.regWalkMatch(filter,j); break;
						case '0': case '1': case '2': case '3': case '4': case '5': case '6': case '7': case '8': case '9':
							stLastKeyword(j-2); j=this.walkNum(filter,j); break;
						default: updateCurrKeyword(j-2,filter[j-1]); break;
					}
					start=j;
					j--;
					isGroupNop=false;
					break;
				case '^':
					matchSK=true;
					start=2;
					break;
				case '$':
					stLastKeyword(j);
					processEnd=true;
					j=filter.length;
					break;
				case '*':
					stLastKeyword(j-1);
					start=j+1;
					break;
				case '+':
					stLastKeyword(j);
					start=j+1;
					break;
				case '?':
					stLastKeyword(j-1);
					start=j+1;
					break;
				case '.':
					stLastKeyword(j);
					j=this.regWalkMatch(filter,j+1);
					start=j;
					j--;
					isGroupNop=false;
					break;
				case '(':
					o_j=j;
					j++;
					switch(filter.substr(j,2)){
						case '?!':
							stLastKeyword(o_j);
							//skip the group
							j=this.regWalkGroup(filter,j-1);
							//skip group match operators
							j=this.regWalkMatch(filter,j);
							break;
						case '?=':
						case '?:':
							j+=2;
						default:
							let res=this.regexGroup2keywords(filter,j,true);
							let [_currStartKeyword,_currKeywords,_stLast_j,_isGroupNop,groupEnd_j]=res;
							//check if group match is optional
							let matchOptional;
							[matchOptional,j]=this.regMatchOptional(filter,groupEnd_j);
							if(!_isGroupNop) isGroupNop=false;
							if(matchOptional){
								//purge group keywords, treat group as empty
								//cannot store currKeyword yet, since the group might be a nop
								_currStartKeyword='';
								_currKeywords=[];
							}
							//extend first currKeyword
							updateCurrKeyword(o_j,_currStartKeyword);
							if(_currKeywords.length==0){
								if(_stLast_j==groupEnd_j-1 || _isGroupNop){
									//continue from group currKeyword, no need to store
								}else{
									start=j;
									stLastKeyword(j);
								}
							}else{
								start=j;
								stLastKeyword(j);
								if(_stLast_j==groupEnd_j-1){
									//continue from last currKeyword
									currKeyword=_currKeywords.pop();
								}
								for(let k=0;k<_currKeywords.length;k++){
									currKeywords.push(_currKeywords[k]);
								}
							}
					}
					start=j;
					j--;
					break;
				case ')':
					stLastKeyword(j);
					processEnd=true;
					j++;
					break;
				case '|':
					//'|' is more important than '^'
					//continue to test if isGroupNop is false
					purgeKeywords=true;
					break;
				case '{':
					let matchOptional;
					o_j=j;
					[matchOptional,j]=this.regMatchOptional(filter,j);
					if(matchOptional){
						stLastKeyword(o_j-1);
					}else{
						stLastKeyword(o_j);
					}
					start=j;
					j--;
					break;
				case '[':
					o_j=j;
					j=this.regWalkCharSet(filter,j);
					if(this.regIsCharSetNop(filter,o_j,j)){
						//continue currKeyword
						updateCurrKeyword(o_j);
					}else{
						stLastKeyword(o_j);
						isGroupNop=false;
					}
					j=this.regWalkMatch(filter,j);
					start=j;
					j--;
					break;
				default:
					isGroupNop=false;
			}
			if(processEnd) break;
		}
		if(purgeKeywords) return ['',[],stLast_j,isGroupNop,j];
		return [currStartKeyword,currKeywords,stLast_j,isGroupNop,j];
	}
	
	this.slowReason={
		'noKeyword': 'no keywords can be extracted from filter',
	}
	
	this.filter2keywords=function(){
		/**
		converts filter to keyword tokens
		invalid filters are stored and skipped
		all filters will be converted to lower-case due to default case-insensitivity
		*/
		let filters=this.filters;
		let startKeywords=[];
		let keywords=[];
		//keywordSequenceIndex: isDomain
		let isDomain={};
		//filter keyword sequences, each sequence starts with filters.length*n
		let seqSK=0;
		let seqK=filters.length;
		let keywordF=[];
		//slow filters (keywordIndex: this.slowReason.keys)
		let slow={};
		//keywordSequenceIndex: keywordFilterIndex (bijection, if keywordFilterIndex isn't mapped, value is 1)
		let keywordI=[];
		//invalid filters
		let invalid=[];
		for(let i=0;i<filters.length;i++){
			let filter=filters[i];
			let keywordSeq=[];
			switch(this.getFilterType(filter)){
				case 0:
					//convert filter to lower case for case-insensitive match
					filter=filter.toLowerCase();
					filter=filter.split('*');
					let j=0;
					if(filter[0].substr(0,2)=='||'){
						isDomainKeyword[i]=true;
					}else if(filter[0][0]=='|'){
						keywordSeq.push(seqSK+this.add(startKeywords,filter[0].substr(1)));
						j=1;
					}
					for(;j<filter.length;j++){
						keywordSeq.push(seqK+this.add(keywords,filter[j]));
					}
					keywordF.push(keywordSeq);
					keywordI.push(keywordF.length-1);
					break;
				case 1:
					let res=this.regexGroup2keywords(filter);
					let currStartKeyword=res[0];
					let currKeywords=res[1];
					if(currStartKeyword=='' && currKeywords.length==0){
						slow[i]='noKeyword';
						keywordI.push(-1);
					}else{
						let keywordSeq=[];
						if(currStartKeyword!='') keywordSeq.push(seqSK+this.add(startKeywords,currStartKeyword));
						for(let k=0;k<currKeywords.length;k++){
							keywordSeq.push(seqK+this.add(keywords,currKeywords[k]));
						}
						keywordF.push(keywordSeq);
						keywordI.push(keywordF.length-1);
					}
					break
				case -1:
					invalid.push(i);
					break;
			}
		}
		this.startKeywords=startKeywords;
		this.keywords=keywords;
		this.isDomain=isDomain;
		this.keywordF=keywordF;
		this.slow=slow;
		this.keywordI=keywordI;
		this.invalid=invalid;
	}
	
	this.buildKeywordTree=function(){
		/**
		builds keyword trees for keyword matching
		*/
		this.treeSK=new StartsWithM(this.startKeywords);
		this.treeK=new MatchStr(this.keywords);
		this.treeKF=new MatchStr(this.keywordF);
	}
	
	this.saveKeywordTree=function(){
	
	}
	
	this.loadKeywordTree=function(){
	
	}
	
	this.getDomainEndPos=function(s){
		/**
		gets the domain end pos of s
		no checking of the domain name is done
		*/
		return s.indexOf('/',s.indexOf(':')+3);
	}
	
	this.findAll=function(s){
		/**
		returns all filter indicies that match s
		*/
		let resSK=this.treeSK.findAll(s);
		let resK=this.treeK.findAll(s);
		
	}
	
	//init
	this.filters=filters;
	this.filtersCase=filtersCase;
}

