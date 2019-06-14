
export default function(searchGui, _config){
  let mainNode = document.getElementById('rso')
  if(!mainNode || !searchGui)
    return searchGui
  new MutationObserver((mutations) => {
    // all results have finished loading
    let res = []
    for(let mutation of mutations)
      for(let addedNode of mutation.addedNodes)
        if(addedNode.classList && addedNode.classList.contains('g'))
          res.push(addedNode)
    searchGui.filterResults({querySelectorAll: (selector) => selector == '.g' ? res : []})
  }).observe(mainNode, {subtree: true, childList: true})
  return searchGui
}
