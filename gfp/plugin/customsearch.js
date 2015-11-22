
export default function(searchGui){
  // //check if url is a google custom search url
  // let location = window.location.href
  // if(location.indexOf('/cse?') == -1 && location.indexOf('/custom?') == -1)
  //   return

  // //set searchGui first so searchGui.filterResults() produces no errors
  // searchGui.getResultType=function() null

  // //wait when ajax loads search results
  // let cse=document.getElementById('cse')

  // let resultsCallback=function(e){
  //   searchGui.getResults=function() document.querySelector('.gsc-results')
  //   searchGui.r={
  //     res: {
  //       getResults: function(node) node.querySelectorAll('.gsc-table-result'),
  //       getLinkArea: function() null,
  //       getUrl: function() null,
  //       getTitle: function() null,
  //       getSummary: function() null,
  //     },
  //     text: {
  //       getResults: function() null,
  //       getLinkArea: function(node) node.querySelector('.gsc-url-bottom'),
  //       getUrl: function(node) node.querySelector('a.gs-title').href,
  //       getTitle: function(node) node.querySelector('a.gs-title').textContent,
  //       getSummary: function(node) node.querySelector('.gs-snippet').textContent,
  //     },
  //   }
  //   searchGui.getResultType=function(node,filterClass){
  //     if(node.classList.contains('gsc-results')){
  //       return searchGui.r.res
  //     }else if(node.classList.contains('gsc-table-result')){
  //       return searchGui.r.text
  //     }
  //   }

  //   //google custom search layout
  //   prefLink.createLink=function(){
  //     let linkParent=searchGui.getResults()
  //     let link=document.createElement('a')
  //     link.setAttribute('style','float:right; margin-top:10px; color:#0000CC; font-size:14px; text-decoration:none;')
  //     link.setAttribute('href','javascript:void(0);')
  //     link.appendChild(document.createTextNode('Config Filters'))
  //     linkParent.insertBefore(document.createElement('br'),linkParent.firstElementChild)
  //     linkParent.insertBefore(link,linkParent.firstElementChild)
  //     return link
  //   }
  //   prefLink.init()
  //   GM_addStyle('.gs-visibleUrl-long{display: inline !important}')

  //   //there are no previous results, filter directly
  //   searchGui.filterResults()
  // }
  // //hook draw
  // CustomSearchControl=unsafeWindow.google.search.CustomSearchControl
  // let o_draw=CustomSearchControl.prototype.draw
  // CustomSearchControl.prototype.draw=function(){
  //   //privileged code
  //   o_draw.apply(this,arguments)
  //   let cse=document.querySelector('#cse')

  //   let o_resultsTable=null
  //   //observer callback after loading the first set of results
  //   let loadNextCallback=function(mutations){
  //     /**
  //     returns:
  //       whether new results have loaded
  //     */
  //     let resultsTable=cse.querySelector('.gsc-table-result')
  //     if(resultsTable==null || o_resultsTable==resultsTable)
  //       return false
  //     o_resultsTable=resultsTable
  //     window.dispatchEvent(new CustomEvent('results'))
  //     return true
  //   }
  //   let loadNextObserver=new MutationObserver(loadNextCallback)

  //   //observer callback when loading the first set of results
  //   let loadFirstCallback=function(mutations){
  //     //wait until the first results have loaded before disconnecting
  //     if(!loadNextCallback())
  //       return false
  //     loadFirstObserver.disconnect()
  //     let results=cse.querySelector('.gsc-results')
  //     if(results==null)
  //       return
  //     loadNextObserver.observe(results,{attributes: true})
  //   }
  //   let loadFirstObserver=new MutationObserver(loadFirstCallback)

  //   //wait until the first set of results have loaded
  //   loadFirstObserver.observe(cse,{subtree: true, childList: true})
  // }
  // //resultsCallback needs privileged functions
  // window.addEventListener('results',resultsCallback,false)
}
