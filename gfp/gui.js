import guiStyle from 'gfp/css/gui.sass'
import { BlockingFilter, MultiRegExpFilter } from 'gfp/filter'
import { CombinedMultiMatcher } from 'gfp/matcher'

export class NodeData {
  constructor(node) {
    this.node = node
  }

  act(action, filter) {
    // Action: function which modifies the node
    if (this.action === action) {
      this.redo(filter)
      return true
    } else {
      this.undo()
      delete this.redo
      delete this.undo
    }
    this.action = action
  }

  *getChildren() {}
  redo() {} // Re-apply action with different arguments
  undo() {} // Undo action
}

NodeData.attrs = ['url', 'title', 'summary']
NodeData.prototype.linkArea = null
NodeData.prototype.url = null
NodeData.prototype.title = null
NodeData.prototype.summary = null
NodeData.prototype.action = null

export class SearchGui {
  constructor(ResultsData, config) {
    this.ResultsData = ResultsData
    this.config = config
    const observer = (type, value) => {
      switch (type) {
        case 'add':
          this.matcher.add(value)
          break
        case 'remove':
          for (const filter of value) {
            this.matcher.remove(filter)
          }
          break
        case 'setValue':
          this.matcher = new CombinedMultiMatcher(NodeData.attrs.length)
          for (const filter of value) {
            this.matcher.add(filter)
          }
          break
      }
    }
    observer('setValue', this.config.filters)
    this.config.filters.observe(observer)
    this.nodeData = new NodeData()
    this.nodeData.children = []
    this.createNodes()
    GM_addStyle(guiStyle.toString())
  }

  /**
   * Create once and clone, to improve performance.
   */
  createNodes() {
    // Add filter link
    this.addLink = document.createElement('a')
    this.addLink.textContent = 'Filter'
    this.addLink.setAttribute('href', '#')
    this.addLink.classList.add('filter-add')
    // Hidden result title
    this.showTitle = document.createElement('span')
    this.showTitle.classList.add('show-title')
    // Hidden result 'show' link
    this.showLink = document.createElement('a')
    this.showLink.textContent = 'show'
    this.showLink.setAttribute('href', '#')
    this.showLink.classList.add('show-link')
  }

  toggleResult(nodeData, showTitle, showLink, initial = false) {
    for (const child of nodeData.node.children) {
      if (child !== showTitle && child !== showLink) {
        child.classList.toggle('hide')
      }
    }
    if (initial) {
      return
    }
    if (showTitle) {
      showTitle.classList.toggle('hide')
    }
    showLink.classList.toggle('hide')
    showLink.textContent = showLink.classList.contains('hide') ? 'hide' : 'show'
  }

  hideResult(nodeData, filter = null) {
    if (!nodeData.node || nodeData.act(this.hideResult, filter)) {
      return
    }
    if (this.config.allowHidden && (!filter || filter.collapse)) {
      nodeData.node.classList.add('hide')
      nodeData.undo = () => nodeData.node.classList.remove('hide')
      return
    }
    let showTitle = null
    if (nodeData.title !== null) {
      showTitle = this.showTitle.cloneNode(false)
      showTitle.textContent = nodeData.title
      nodeData.node.appendChild(showTitle)
    }
    const showLink = this.showLink.cloneNode(true)
    if (filter) {
      showLink.title = filter.text
    }
    nodeData.node.appendChild(showLink)
    this.toggleResult(nodeData, showTitle, showLink, true)
    showLink.onclick = () => {
      this.toggleResult(nodeData, showTitle, showLink)
      return false
    }
    nodeData.redo = (filter) => {
      if (filter) {
        showLink.title = filter.text
      }
    }
    nodeData.undo = () => {
      if (!showLink.classList.contains('hide')) {
        this.toggleResult(nodeData, showTitle, showLink)
      }
      if (showTitle) {
        showTitle.remove()
      }
      showLink.remove()
    }
  }

  addFilterLink(nodeData, filter = null) {
    if (!nodeData.node || nodeData.act(this.addFilterLink, filter)) {
      return
    }
    if (!nodeData.linkArea) {
      return
    }
    const addLink = this.addLink.cloneNode(true)
    if (filter) {
      addLink.title = filter.text
    }
    nodeData.linkArea.appendChild(addLink)
    addLink.onclick = () => {
      this.addFromResult(nodeData)
      return false
    }
    nodeData.redo = (filter) => {
      if (filter) {
        addLink.title = filter.text
      }
    }
    nodeData.undo = () => {
      addLink.remove()
    }
  }

  addFromResult(nodeData) {
    const domainUrl = '||' + nodeData.url.replace(/^[\w-]+:\/+(?:www\.)?/, '')
    const text = prompt('Filter: ', domainUrl)
    if (text === null) {
      return
    }
    this.config.filters.add(MultiRegExpFilter.fromText(text))
    this.filterResults()
  }

  _filterResults(nodeData) {
    // Store all children so we can re-filter
    if (nodeData.children === undefined) {
      nodeData.children = Array.from(nodeData.getChildren())
    }
    const filter = this.matcher.matchesAny(nodeData, NodeData.attrs)
    if (filter) {
      filter.hitCount++
      filter.lastHit = new Date().getTime()
      this.config.filters.update(filter)
      if (filter instanceof BlockingFilter) {
        this.hideResult(nodeData, filter)
        return true
      } else {
        this.addFilterLink(nodeData, filter)
        return false
      }
    }
    let filtered = !!nodeData.children.length
    for (const childData of nodeData.children) {
      if (childData.node.querySelector('a.filter-add')) {
        continue
      }
      if (!this._filterResults(childData)) {
        filtered = false
      }
    }
    if (filtered) {
      this.hideResult(nodeData)
    } else if (NodeData.attrs.some((attr) => nodeData[attr] !== null)) {
      this.addFilterLink(nodeData)
    }
    return filtered
  }

  filterResults(node = null) {
    /**
    args:
      node: Used when additional search results pop up.
    */
    let matched = false
    const observer = (type, _filter) => {
      if (type === 'update') {
        matched = true
      }
    }
    this.config.filters.observe(observer)
    if (node) {
      // Only need to filter the new node
      const nodeData = new this.ResultsData(node)
      this.nodeData.children.push(nodeData)
      this._filterResults(nodeData)
    } else {
      this._filterResults(this.nodeData)
    }
    if (matched) {
      this.config.flushFilters()
    }
    this.config.filters.unobserve(observer)
  }
}
