
export default function(searchGui, _config){
  let mainNode = document.getElementById('rso')
  if(!mainNode || !searchGui)
    return searchGui
  new MutationObserver((mutations) => {
    // all results have finished loading this includes google's own nodes that load later too, such as news items
    let res = []
    for(let mutation of mutations)
      for(let addedNode of mutation.addedNodes)
        if(addedNode.nodeType != 3)
          res.push(addedNode)
    if(res.length){
      // can't wrap parent/grandparent's querySelectorAll, as it will include elements not in addedNodes
      // can't use node's querySelectorAll, as it doesn't include self
      // can't create a parent element and move the nodes in it, as the nodes don't get added after the MutationObserver
      searchGui.filterResults({querySelectorAll: function* (selector){
        for(let node of res){
          if(selector == '.g' && node.classList.contains('g'))
            yield node
          if(selector == 'g-inner-card' && node.nodeName == 'G-INNER-CARD')
            yield node
        }
      }})
    }
  }).observe(mainNode, {subtree: true, childList: true})
  return searchGui
}
