
export default function(searchGui){
  let resultsObserver = new MutationObserver((mutations) => {
    // all results have finished loading
    let res = []
    for(let mutation of mutations)
      for(let addedNode of mutation.addedNodes)
        if(addedNode.classList && addedNode.classList.contains('g'))
          res.push(addedNode)
    searchGui.filterResults({querySelectorAll: () => res})
  })
  let mainNode = document.getElementById('rso')
  if(!mainNode || !searchGui)
    return
  resultsObserver.observe(mainNode, {subtree: true, childList: true})
  return searchGui
}
