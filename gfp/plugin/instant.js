import {SearchGui} from 'gfp/gui'

export default function(searchGui){
  let resultsObserver = new MutationObserver((mutations) => {
    for(let mutation of mutations){
      for(let addedNode of mutation.addedNodes){
        let node = addedNode.querySelector && addedNode.querySelector(':scope > #ires')
        if(node){
          // we have a new query, google only adds this node with all results added
          searchGui.nodeData.children.length = 0
          searchGui.filterResults(node)
        }
      }
    }
  })
  let mainNode = document.getElementById('main')
  if(!mainNode)
    return
  resultsObserver.observe(mainNode, {subtree: true, childList: true})
  if(!searchGui)
    searchGui = new SearchGui()
  return searchGui
}
