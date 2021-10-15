function nodeListQuerySelector(nodeList, selector) {
  // - Can't wrap parent/grandparent's `querySelector()`, as it will include elements not in `addedNodes`.
  // - Can't use node's `querySelector()`, as it doesn't include the node itself.
  // - Can't create a parent element and move the nodes in it, as the nodes don't get added after the
  //   MutationObserver.
  for (const node of nodeList) {
    if (node.matches(selector)) {
      return node
    }
    // Call `querySelector()` as well, as `node` can be a results container node
    const res = node.querySelector(selector)
    if (res) {
      return res
    }
  }
}

function nodeListQuerySelectorAll(nodeList, selector) {
  const matchedNodes = []
  for (const node of nodeList) {
    if (node.matches(selector)) {
      matchedNodes.push(node)
    }
    Array.prototype.push.apply(matchedNodes, node.querySelectorAll(selector))
  }
  return matchedNodes
}

function mutationObserver(mutations, searchGui) {
  // All results have finished loading. This includes *Google*'s own nodes that load later too, such as news items.
  const res = []
  for (const mutation of mutations) {
    for (const addedNode of mutation.addedNodes) {
      if (addedNode.nodeType !== 3) {
        res.push(addedNode)
      }
    }
  }
  if (res.length) {
    searchGui.filterResults({
      querySelector: (selector) => nodeListQuerySelector(res, selector),
      querySelectorAll: (selector) => nodeListQuerySelectorAll(res, selector),
    })
  }
}

export default function (searchGui, _config) {
  const mainNode = document.getElementById('rso')
  if (!mainNode || !searchGui) {
    return searchGui
  }
  new MutationObserver((mutations) => mutationObserver(mutations, searchGui)).observe(mainNode, {
    subtree: true,
    childList: true,
  })
  return searchGui
}
