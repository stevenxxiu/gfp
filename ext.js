
let ext={
	gmonkeyr: {
		loaded: function(){
			let footAnim=_$('navcnt');
			if(!footAnim) return false;
			footAnim=footAnim.firstElementChild;
			if(footAnim.nodeName=='DIV' && footAnim.textContent=='Loading'){
				let results=searchGui.getResults();
				let resultsListener=function(e){
					let node=e.target;
					switch(node.nodeName){
						case 'HR':
							results.removeEventListener('DOMNodeInserted',resultsListener,false);
							return;
						case 'LI':
							break;
						default:
							return;
					}
					let res=searchGui._filterResults(node,searchGui.r.res);
					if(res){
						searchGui.remNodes.push(res);
					}
					//the pref window could be opened before loading the next page
					//	and it isn't known whether there are new hits, so default to this being true
					prefMeta.isUpdated=false;
					gfpFilter.save();
				};
				let defaultDisp=footAnim.style.display;
				//add resultsListener only after loading image hides, so no additional events fire when page loads
				footAnim.addEventListener('DOMAttrModified',function(e){
					if(footAnim.style.display==defaultDisp){
						results.addEventListener('DOMNodeInserted',resultsListener,false);
					}
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
				
				GM_addStyle('.gs-visibleUrl{display: inline !important}');
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
				observer.observe(cse,config={subtree: true, childList: true});
			}
			//resultsCallback needs privileged functions
			window.addEventListener('results',resultsCallback,false);
		},
	},
	
	instant: {
		init: function(){
			//last hidden node
			let lastHideNode;
			//last processed res node
			let lastProcNode;
			//if results are completely new
			let isNew=false;
			//all results loaded
			let isLoaded=false;
			//results parent node
			let resultsNode;
			
			function filterNodes(currNode,isNew){
				if(!searchGui.initialized){
					searchGui.init();
				}
				if(!isNew){
					currNode=currNode.nextElementSibling;
				}
				let lastNode;
				while(currNode){
					let res=searchGui._filterResults(currNode,searchGui.r.res);
					if(res){
						searchGui.remNodes.push(res);
					}else{
						prefMeta.isUpdated=false;
					}
					currNode.style.display='';
					lastNode=currNode;
					currNode=currNode.nextElementSibling;
				}
				return lastNode;
			}
			
			function isInDom(node){
				return node.parentNode && node.parentNode.offsetWidth!=0;
			}
			
			//hook XMLHttpRequest to get catch google results
			
			let XMLHttpRequest=unsafeWindow.XMLHttpRequest;
			
			XMLHttpRequest.prototype.__defineSetter__('onreadystatechange',function(func){
				if(this.listener){
					this.removeEventListener('readystatechange',this.listener,false);
				}
				this.o_listener=func;
				this.listener=function(){
					func.call(this,arguments);
					let currNode;
					if(lastHideNode && isInDom(lastHideNode)){
						currNode=lastHideNode.nextElementSibling;
						if(currNode){
							isNew=false;
						}else{
							return;
						}
					}else{
						currNode=$X('//ol[@id="rso"]/li',9);
						if(currNode){
							searchGui.remNodes=[new searchGui.remNode(currNode.parentNode,searchGui.r.res)];
							lastProcNode=currNode;
							isNew=true;
						}else{
							return;
						}
					}
					while(currNode){
						currNode.style.display='none';
						lastHideNode=currNode;
						currNode=currNode.nextElementSibling;
					}
					isLoaded=(this.readyState==4);
					window.postMessage('xhr','*');
				};
				this.addEventListener('readystatechange',this.listener,false);
			});
			
			let o_open=XMLHttpRequest.prototype.open;
			XMLHttpRequest.prototype.open=function(method,url){
				if(url.substr(0,3)!='/s?'){
					if(this.listener){
						this.removeEventListener('readystatechange',this.listener,false);
						this.addEventListener('readystatechange',this.o_listener,false);
					}
				}
				return o_open.apply(this,arguments);
			}
			
			//listen to xhr node hide requests
			window.addEventListener('message',function(e){
				if(e.data!='xhr') return;
				//safety check
				if(!lastProcNode) return;
				lastProcNode=filterNodes(lastProcNode,isNew);
				if(isLoaded){
					if(!prefMeta.isUpdated){
						gfpFilter.save();
					}
					isLoaded=false;
				}
			},false);
			
			//listen to cached requests
			unsafeWindow.addEventListener('message',function(e){
				if(e.data!='comm.df') return;
				//if already filtered
				if(lastProcNode && isInDom(lastProcNode)) return;
				resultsNode.style.display='';
				let currNode=$X('//ol[@id="rso"]/li',9);
				if(currNode){
					searchGui.remNodes=[new searchGui.remNode(currNode.parentNode,searchGui.r.res)];
					lastProcNode=filterNodes(currNode,true);
					if(!prefMeta.isUpdated){
						gfpFilter.save();
					}
					isLoaded=false;
				}
			},false);
			
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
