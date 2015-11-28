import {SearchGui} from 'gfp/gui'
import {ResultsData} from 'gfp/plugin/google'

export default function(searchGui){
  let mainNode = document.getElementById('main')
  if(!mainNode)
    return
  new MutationObserver((mutations) => {
    for(let mutation of mutations){
      for(let addedNode of mutation.addedNodes){
        let node = addedNode.querySelector && addedNode.querySelector(':scope > #ires')
        if(node){
          // all results have finished loading
          searchGui.nodeData.children.length = 0
          searchGui.filterResults(node)
        }
      }
    }
  }).observe(mainNode, {subtree: true, childList: true})
  if(!searchGui)
    searchGui = new SearchGui(ResultsData)
  return searchGui
}
