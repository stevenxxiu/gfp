
export default function(searchGui, _config){
  let mainNode = document.getElementById('main')
  if(!mainNode || !searchGui)
    return searchGui
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
  return searchGui
}
