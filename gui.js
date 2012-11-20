
/**
pref metadata class
*/

let prefMeta={
	//if the pref grid has changed (e.g. hitcounts, new filters are added) so pref requires to be re-rendered
	isUpdated: false,
};

/**
search results gui
	hiding search results, adding filter dialog
*/

let searchGui={
	resHidden: false,
	//remNodes is an array-based tree of 'remNode's
	remNodes: null,
	initialized: false,
	
	isHomePage: function(){
		let loc=window.location.href;
		return loc[loc.length-1]=='/';
	},
	
	getQuery: function(){
		return document.querySelector('input[type="text"][title="Search"]');
	},
	
	getResults: function(){
		return _$('GoogleTabledResults');
	},
	
	directLink: function(url){
		if(!(url[0]=='/')) return url;
		return url.substring(7,url.indexOf('&')||url.length);
	},
	
	r: {
		res: {
			getResults: function(node) node.querySelectorAll('li.g'),
			getLinkArea: function() null,
			getUrl: function() null,
			getTitle: function() null,
			getSummary: function() null,
		},
		text: {
			getResults: function() null,
			getLinkArea: function(node) node.querySelector('.vshid'),
			getUrl: function(node) node.querySelector('a.l').href,
			getTitle: function(node) (node.querySelector('h2.r')||node.querySelector('h3.r')).textContent,
			getSummary: function(node) node.querySelector('div.s').textContent,
		},
		book: {
			getResults: function() null,
			getLinkArea: function(node) node.querySelector('cite').parentNode,
			getUrl: function(node) node.querySelector('h3.r>a').href,
			getTitle: function(node) node.querySelector('h3.r').textContent,
			getSummary: function(node) node.querySelector('div.s').textContent,
		},
		videoCtn: {
			getResults: function(node) node.querySelectorAll('div.vresult'),
			getLinkArea: function() null,
			getUrl: function() null,
			getTitle: function(node) node.querySelector('h3.r').textContent,
			getSummary: function() null,
		},
		video: {
			getResults: function() null,
			getLinkArea: function(node) node.querySelector('cite'),
			getUrl: function(node) node.querySelector('h3.r>a').href,
			getTitle: function(node) node.querySelector('h3.r').textContent,
			getSummary: function(node) node.querySelector('span.st').textContent,
		},
		imageCtn: {
			getResults: function(node) node.querySelectorAll('div>a'),
			getLinkArea: function() null,
			getUrl: function() null,
			getTitle: function(node) node.querySelector('h3.r').textContent,
			getSummary: function() null,
		},
		image: {
			getResults: function() null,
			getLinkArea: function() null,
			getUrl: function(node) node.href,
			getTitle: function() null,
			getSummary: function() null,
		},
		newsCtn: {
			getResults: function(node) node.querySelectorAll('li.w0>div'),
			getLinkArea: function() null,
			getUrl: function() null,
			getTitle: function(node) node.querySelector('h3.r').textContent,
			getSummary: function() null,
		},
		news: {
			getResults: function() null,
			getLinkArea: function(node) node.querySelector('.gl'),
			getUrl: function(node) node.querySelector('a.l').href,
			getTitle: function(node) node.querySelector('a.l').textContent,
			getSummary: function(node) node.querySelector('div[style]').textContent,
		},
	},
	
	nodeData: function(node,filterClass){
		this.__defineGetter__('linkArea',function(){let linkArea=filterClass.getLinkArea(node); this.linkArea=linkArea; return linkArea;});
		this.__defineGetter__('url',function(){let url=filterClass.getUrl(node); this.url=url; return url;});
		this.__defineGetter__('title',function(){let title=filterClass.getTitle(node); this.title=title; return title;});
		this.__defineGetter__('summary',function(){let summary=filterClass.getSummary(node); this.summary=summary; return summary;});
	},
	
	remNode: function(node,filterClass){
		this.node=node;
		this.filterClass=filterClass;
	},
	
	getResultType: function(node,filterClass){
		/**
		args:
			filterClass: parent result filter class
		returns: resultClass
		*/
		switch(filterClass){
			case searchGui.r.videoCtn:
				return searchGui.r.video;
			case searchGui.r.imageCtn:
				return searchGui.r.image;
			case searchGui.r.newsCtn:
				return searchGui.r.news;
		}
		switch(node.id){
			case 'res':
			case 'GoogleTabledResults':
				return searchGui.r.res;
			case 'imagebox':
			case 'imagebox_bigimages':
				return searchGui.r.imageCtn;
			case 'videobox':
				return searchGui.r.videoCtn;
			case 'newsbox':
				return searchGui.r.newsCtn;
		}
		if(node.firstElementChild.childElementCount>2)
			return searchGui.r.text;
		else if(node.firstElementChild.childElementCount>=1){
			if(node.querySelector('div.th')){
				return searchGui.r.video;
			}else{
				return null;
			}
		}
		return null;
	},
	
	addStyles: function(){
		GM_addStyle(
			'.filterAdd{color: #1122CC !important; font-size="90%"; text-decoration: none;} .filterAdd:hover{text-decoration: underline;}'+
			'.showTitle{color: #999999 !important; font-size="90%";}'+
			'.showLink{color: #999999 !important; font-size="90%"; text-decoration: none;}}'
		);
	},
	
	initNodes: function(){
		/**
		buffer nodes
		*/
		//dash
		let dash=document.createElement('span');
		with(dash){
			innerHTML='&nbsp;-&nbsp;';
		}
		searchGui.dash=dash;
		//add filter link
		let addLink=document.createElement('a');
		with(addLink){
			innerHTML='Filter';
			href='javascript:void(0);';
			setAttribute('class','filterAdd');
		}
		searchGui.addLink=addLink;
		//add filter container
		let addCtn=document.createElement('span');
		with(addCtn){
			appendChild(dash.cloneNode(true));
			appendChild(addLink.cloneNode(true));
		}
		searchGui.addCtn=addCtn;
		//hidden result title
		let showTitle=document.createElement('span');
		with(showTitle){
			setAttribute('class','showTitle');
		}
		searchGui.showTitle=showTitle;
		//hidden result 'show' link
		let showLink=document.createElement('a');
		with(showLink){
			href='javascript:void(0);';
			setAttribute('class','showLink');
		}
		searchGui.showLink=showLink;
	},
	
	showResult: function(node,contentNodes,showTitle,showLink){
		/**
		re-show hidden filtered result
		*/
		if(searchGui.resHidden){
			node.style.display='';
		}else{
			for(let i=0;i<contentNodes.length;i++){
				contentNodes[i].style.display='';
			}
			showTitle.style.display='none';
			showLink.innerHTML='hide';
			let hideListener=function(e){
				searchGui.hideResult(node,null,null,contentNodes,showTitle,showLink);
				e.preventDefault();
				this.removeEventListener('click',hideListener,false);
			};
			showLink.addEventListener('click',hideListener,false);
		}
	},
	
	hideResult: function(node,filter,nodeData,contentNodes,showTitle,showLink){
		/**
		hide filtered result
		args:
			contentNodes (optional): content nodes that will be hidden
			showTitle (optional): title that will be shown
			showLink (optional): link that will be shown, changed to 'hide'
		*/
		//hide node
		if(searchGui.resHidden){
			node.style.display='none';
		}else{
			//show only title and 'show' link
			if(filter){
				contentNodes=[];
				for(let i=0;i<node.childNodes.length;i++){
					let childNode=node.childNodes[i];
					if(childNode.style){
						childNode.style.display='none';
						contentNodes.push(childNode);
					}
				}
				showTitle=searchGui.showTitle.cloneNode(false);
				let title=nodeData.title;
				if(title){
					showTitle.innerHTML=title+'&nbsp;&nbsp;';
				}
				node.appendChild(showTitle);
				showLink=searchGui.showLink.cloneNode(false);
				showLink.innerHTML='show';
				showLink.title=filter.fullText||filter.text;
				node.appendChild(showLink);
			}else{
				for(let i=0;i<contentNodes.length;i++){
					contentNodes[i].style.display='none';
				}
				showTitle.style.display='';
				showLink.innerHTML='show';
			}
			let showListener=function(e){
				searchGui.showResult(node,contentNodes,showTitle,showLink);
				e.preventDefault();
				this.removeEventListener('click',showListener,false);
			};
			showLink.addEventListener('click',showListener,false);
		}
		return true;
	},
	
	createAddLink: function(node,nodeData){
		let linkArea=nodeData.linkArea;
		if(!linkArea) return;
		linkArea.appendChild(searchGui.dash.cloneNode(true));
		let addLink=searchGui.addLink.cloneNode(true);
		linkArea.appendChild(addLink);
		let addListener=function(e){
			searchGui.addFromResult(nodeData);
		}
		addLink.addEventListener('click',addListener,false);
	},
	
	removeAddLink: function(nodeData){
		let linkArea=nodeData.linkArea;
		if(!linkArea) return;
		linkArea.removeChild(linkArea.lastChild);
		linkArea.removeChild(linkArea.lastChild);
	},
	
	addFromResult: function(nodeData){
		//trim domainUrl
		let domainUrl='||'+nodeData.url.replace(/^[\w\-]+:\/+(?:www\.)?/,'');
		let text=prompt('Filter: ',domainUrl);
		if(text==null) return;
		let keys=gfpFilter.getKeys(text);
		if(gfpFilter.isDuplicate(keys,Filter.knownFilters)){
			alert('Filter already exists');
			return;
		}
		//add filter
		let filter=gfpFilter.fromTextCompiled(text,Filter.knownFilters);
		gfpMatcher.add(filter,keys);
		prefMeta.isUpdated=false;
		searchGui.filterResultsRem();
	},
	
	_filterResultsRem: function(remNodes){
		/**
		filters 'remNode's in the remNodes tree
		returns:
			if all nodes in remNodes are hidden
		*/
		let node,remNode,rnChildren,filterClass;
		if(remNodes.constructor==Array){
			//check if parent node needs to be hidden
			rnChildren=remNodes;
			remNode=remNodes[0];
		}else{
			remNode=remNodes;
		}
		node=remNode.node;
		filterClass=remNode.filterClass;
		let _nodeData=new searchGui.nodeData(node,filterClass);
		let filter=defaultMatcher.matchesAny(_nodeData);
		if(filter){
			filter.hitCount++;
			if(!(filter instanceof WhitelistFilter)){
				searchGui.removeAddLink(_nodeData);
				searchGui.hideResult(node,filter,_nodeData);
				return true;
			}else{
				return false;
			}
		}
		if(rnChildren){
			//hide child nodes
			let allHidden=true;
			for(let i=1;i<rnChildren.length;i++){
				let res=searchGui._filterResultsRem(rnChildren[i]);
				if(res){
					rnChildren.splice(i,1);
					i--;
				}else{
					allHidden=false;
				}
			}
			if(allHidden){
				if(searchGui.resHidden){
					//hide parent node
					searchGui.hideResult(node,null,_nodeData);
				}
			}
			return allHidden;
		}else{
			return false;
		}
	},
	
	_filterResults: function(node,filterClass){
		/**
		parses a html node into a remNodes tree and filters the 'remNode's
		returns:
			filtered remNodes tree
		*/
		let filterClass=searchGui.getResultType(node,filterClass);
		if(filterClass==null){
			//unkown node type
			return null;
		}
		let _nodeData=new searchGui.nodeData(node,filterClass);
		let filter=defaultMatcher.matchesAny(_nodeData);
		if(filter){
			filter.hitCount++;
			if(!(filter instanceof WhitelistFilter)){
				searchGui.hideResult(node,filter,_nodeData);
			}
			return null;
		}
		searchGui.createAddLink(node,_nodeData);
		//html resNodes
		let resNodes=filterClass.getResults(node);
		if(!resNodes){
			return new searchGui.remNode(node,filterClass);
		}
		//filter subnodes
		let remNodes=[new searchGui.remNode(node,filterClass)];
		for(let i=0;i<resNodes.length;i++){
			let _node=resNodes[i];
			let res=searchGui._filterResults(_node,filterClass);
			if(res){
				remNodes.push(res);
			}
		}
		if(remNodes.length==1){
			if(searchGui.resHidden){
				//hide parent node
				searchGui.hideResult(node,null,_nodeData);
			}
			return null;
		}
		return remNodes;
	},
	
	filterResultsRem: function(){
		searchGui._filterResultsRem(searchGui.remNodes);
		gfpFilter.save();
	},
	
	filterResults: function(){
		searchGui.remNodes=searchGui._filterResults(searchGui.getResults());
		gfpFilter.save();
	},
	
	init: function(){
		let resHidden=GM_getValue('resHidden');
		if(resHidden==undefined){
			resHidden=config.resHidden;
			GM_setValue('resHidden',resHidden);
		}
		searchGui.resHidden=resHidden;
		searchGui.addStyles();
		searchGui.initNodes();
		searchGui.initialized=true;
	},
}

let prefLink={
	createLink: function(){
		//clone from link template
		let linkT=document.querySelector('a.gbmlb[href*="/ManageAccount?"]');
		if(!linkT)
			return null;
		let link=document.createElement('a');
		link.setAttribute('class',linkT.getAttribute('class'));
		link.setAttribute('style',linkT.getAttribute('style'));
		link.setAttribute('href','javascript:void(0);');
		link.appendChild(document.createTextNode('Config Filters'));
		let linkParent=linkT.parentNode;
		linkParent.appendChild(document.createTextNode('\u2013'));
		linkParent.appendChild(link);
		return link;
	},
	
	prefOpen: function(){
		if(prefMeta.isUpdated){
			pref.show();
		}else{
			//renderAll resets the gui first if it's already open
			pref.renderAll();
			prefMeta.isUpdated=true;
		}
	},
	
	init: function(){
		let link=prefLink.createLink();
		if(link!=null){
			link.addEventListener('click',prefLink.prefOpen,false);
		}
		GM_registerMenuCommand('GoogleSearchFilter+',prefLink.prefOpen,null);
	},
}
