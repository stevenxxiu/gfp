
let ext={
	gmonkeyr: {
		/**
		filters results whenever googlemonkeyr adds a results page
		the initial results page (including the initial page of instant results) is not processed by this extension
		*/
		
		init: function(){
			o_getResults=searchGui.getResults;
			searchGui.getResults=function(){
				return _$('GoogleTabledResults') || o_getResults();
			};
			
			let o_getResultType=searchGui.getResultType;
			searchGui.getResultType=function(node,filterClass){
				if(node==null)
					return null;
				else if(node.id=='GoogleTabledResults')
					return searchGui.r.res;
				else
					return o_getResultType(node,filterClass);
			};
		},
		
		loaded: function(){
			let isDescendent=function(node,ancestor){
				while(node){
					if(node==ancestor)
						return true;
					node=node.parentNode;
				}
				return false;
			}
			
			let procNodeNum=0;
			
			let results=searchGui.getResults();
			let resultsObserver=new MutationObserver(function(mutations){
				mutations.forEach(function(mutation){
					for(let i=0;i<mutation.addedNodes.length;i++){
						node=mutation.addedNodes[i];
						if(!node || node.nodeName!='LI'){
							continue;
						}
						if(procNodeNum>0){
							procNodeNum--;
							continue;
						}
						let res=searchGui._filterResults(node,searchGui.r.res);
						if(res){
							searchGui.remNodes.push(res);
						}
						//the pref window could be opened before loading the next page
						//	and it isn't known whether there are new hits, so default to this being false
						prefMeta.isUpdated=false;
						gfpFilter.save();
					}
				});
			});
			
			let observeResults=function(results){
				//googlemonkeyr adds already processed nodes again
				procNodeNum=searchGui.r.res.getResults(results).length;
				//use parentNode, googlemonkeyr copies the results node
				resultsObserver.observe(results.parentNode,{childList: true, subtree: true});
			};
			
			if(results){
				observeResults(results);
			}
			//use instant if the extension's enabled
			if(config.ext.indexOf('instant')>-1){
				window.addEventListener('instantResults',function(e){
					results=searchGui.getResults();
					observeResults(results);
				},false);
			}
		},
	},
	
	customSearch: {
		init: function(){
			//check if url is a google custom search url
			let location=window.location.href;
			if(location.indexOf('/cse?')==-1 && location.indexOf('/custom?')==-1){
				return;
			}
			
			//set searchGui first so searchGui.filterResults() produces no errors
			searchGui.getResultType=function() null;
			
			//wait when ajax loads search results
			let cse=document.getElementById('cse');
			
			let resultsCallback=function(e){
				searchGui.getResults=function() document.querySelector('.gsc-results');
				searchGui.r={
					res: {
						getResults: function(node) node.querySelectorAll('.gsc-table-result'),
						getLinkArea: function() null,
						getUrl: function() null,
						getTitle: function() null,
						getSummary: function() null,
					},
					text: {
						getResults: function() null,
						getLinkArea: function(node) node.querySelector('.gsc-url-bottom'),
						getUrl: function(node) node.querySelector('a.gs-title').href,
						getTitle: function(node) node.querySelector('a.gs-title').textContent,
						getSummary: function(node) node.querySelector('.gs-snippet').textContent,
					},
				}
				searchGui.getResultType=function(node,filterClass){
					if(node.classList.contains('gsc-results')){
						return searchGui.r.res;
					}else if(node.classList.contains('gsc-table-result')){
						return searchGui.r.text;
					}
				}
				
				//google custom search layout
				prefLink.createLink=function(){
					let linkParent=searchGui.getResults();
					let link=document.createElement('a');
					link.setAttribute('style','float:right; margin-top:10px; color:#0000CC; font-size:14px; text-decoration:none;');
					link.setAttribute('href','javascript:void(0);');
					link.appendChild(document.createTextNode('Config Filters'));
					linkParent.insertBefore(document.createElement('br'),linkParent.firstElementChild);
					linkParent.insertBefore(link,linkParent.firstElementChild);
					return link;
				}
				prefLink.init();
				
				//there are no previous results, filter directly
				searchGui.filterResults();
				
				GM_addStyle('.gs-visibleUrl-long{display: inline !important}');
			};
			//hook draw
			CustomSearchControl=unsafeWindow.google.search.CustomSearchControl;
			let o_draw=CustomSearchControl.prototype.draw;
			CustomSearchControl.prototype.draw=function(){
				//privileged code
				o_draw.apply(this,arguments);
				//wait until a result is inserted
				let cse=document.querySelector('#cse');
				let observer=new MutationObserver(function(mutations){
					if(cse.querySelector('.gsc-table-result')!=null){
						observer.disconnect();
						window.dispatchEvent(new CustomEvent('results'));
					}
				});
				observer.observe(cse,{subtree: true, childList: true});
			}
			//resultsCallback needs privileged functions
			window.addEventListener('results',resultsCallback,false);
		},
	},
	
	instant: {
		init: function(){
			//initialize searchGui if we haven't already (e.g. on the home page)
			if(!searchGui.initialized)
				searchGui.init();
			
			//results parent node
			let resultsNode;
			
			let resultsObserver=new MutationObserver(function(mutations){
				mutations.forEach(function(mutation) {
					//filter nodes whenever they are added, instead of doing batch filters
					for(let i=0;i<mutation.addedNodes.length;i++){
						addedNode=mutation.addedNodes[i];
						if(addedNode.id=='ires'){
							//we have a new query, google only adds this node with all results added (to test this properly, disable all other userscripts)
							searchGui.filterResults();
							prefMeta.isUpdated=false;
							//other extensions might use this
							window.dispatchEvent(new CustomEvent('instantResults'));
						}
					};
				});
			});
			
			let mainNode=document.getElementById('main');
			if(!mainNode)
				return false;
			resultsObserver.observe(mainNode,{subtree: true, childList: true});
		},
	},
	
	init: function(){
		for(let i=0;i<config.ext.length;i++){
			let e=ext[config.ext[i]];
			if('init' in e) e.init();
		}
	},
	
	loaded: function(){
		for(let i=0;i<config.ext.length;i++){
			let e=ext[config.ext[i]];
			if('loaded' in e) e.loaded();
		}
	},
}
