export default function (searchGui, _config) {
  const mainNode = document.getElementById('rso')
  if (!mainNode || !searchGui) {
    return searchGui
  }
  new MutationObserver((mutations) => {
    // all results have finished loading this includes google's own nodes that load later too, such as news items
    const res = []
    for (const mutation of mutations) {
      for (const addedNode of mutation.addedNodes) {
        if (addedNode.nodeType != 3) {
          res.push(addedNode)
        }
      }
    }
    if (res.length) {
      searchGui.filterResults({
        querySelectorAll: (selector) => {
          // - Can't wrap parent/grandparent's `querySelectorAll`, as it will include elements not in `addedNodes`.
          // - Can't use node's `querySelectorAll`, as it doesn't include the node itself.
          // - Can't create a parent element and move the nodes in it, as the nodes don't get added after the
          //   MutationObserver.
          const matchedNodes = []
          for (const node of res) {
            if (node.matches(selector)) {
              matchedNodes.push(node)
            }
            // call `querySelectorAll` as well, as `node` can be a results container node
            Array.prototype.push.apply(matchedNodes, node.querySelectorAll(selector))
          }
          return matchedNodes
        },
      })
    }
  }).observe(mainNode, { subtree: true, childList: true })
  return searchGui
}
