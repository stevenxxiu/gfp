export default function (searchGui, _config) {
  const mainNode = document.getElementById('main')
  if (!mainNode || !searchGui) {
    return searchGui
  }
  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const addedNode of mutation.addedNodes) {
        const node = addedNode.querySelector && addedNode.querySelector(':scope > #ires')
        if (node) {
          // All results have finished loading
          searchGui.nodeData.children.length = 0
          searchGui.filterResults(node)
        }
      }
    }
  }).observe(mainNode, { subtree: true, childList: true })
  return searchGui
}
