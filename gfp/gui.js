/* globals GM_addStyle */
import config from 'gfp/config'
import guiStyle from 'gfp/css/gui.scss'
import {BlockingFilter, MultiRegExpFilter} from 'gfp/filter'
import {CombinedMultiMatcher} from 'gfp/matcher'
import {cache} from 'gfp/utils'

export class NodeData {
  constructor(node){
    this.node = node
  }

  act(action, filter){
    // action: function which modifies the node
    if(this.action == action){
      this.redo(filter)
      return true
    }else{
      this.undo()
      delete this.redo
      delete this.undo
    }
    this.action = action
  }

  *getChildren(){}
  redo(){}  // re-apply action with different arguments
  undo(){}  // undo action
}

NodeData.attrs = ['url', 'title', 'summary']
NodeData.prototype.linkArea = null
NodeData.prototype.url = null
NodeData.prototype.title = null
NodeData.prototype.summary = null
NodeData.prototype.action = null

export class ResultsData extends NodeData {
  *getChildren(){
    for(let child of this.node.querySelectorAll('.g')){
      if(child.id == 'imagebox_bigimages'){
        yield new ImageContainerData(child)
      }else if(child.id == 'lclbox'){
        yield new MapContainerData(child)
      }else if(child.classList.contains('mnr-c')){
        yield new KnowledgeData(child)
      }else if(child.classList.contains('card-section')){
        yield new NewsData(child)
      }else if(!child.classList.contains('obcontainer')){
        yield new TextData(child)
      }
    }
  }
}

class CommonData extends NodeData {
  get linkArea(){return cache(this, 'linkArea', this.node.querySelector('cite').parentNode)}
  get url(){return cache(this, 'url', this.node.querySelector('h3.r>a').href)}
  get title(){return cache(this, 'title', this.node.querySelector('h2.r, h3.r').textContent)}
}

class KnowledgeData extends CommonData {}

class TextData extends CommonData {
  get summary(){return cache(this, 'summary', this.node.querySelector('div.s').textContent)}
}

class NewsData extends NodeData {
  get linkArea(){return cache(this, 'linkArea', this.node.querySelector('cite').parentNode)}
  get url(){return cache(this, 'url', this.node.querySelector('a').href)}
  get title(){return cache(this, 'title', this.node.querySelector('a').textContent)}
  get summary(){
    let node = this.node.querySelector('span.s')
    return cache(this, 'summary', node ? node.textContent : null)
  }
}

class MapContainerData extends NodeData {
  *getChildren(){for(let child of this.node.querySelectorAll('div.g')) yield new MapData(child)}
}

class MapData extends CommonData {}

class ImageContainerData extends NodeData {
  *getChildren(){for(let child of this.node.querySelectorAll('.bia')) yield new ImageData(child)}
}

class ImageData extends NodeData {
  get url(){return cache(this, 'url', this.node.href)}
}

export class SearchGui {
  constructor(){
    let observer = (type, filter) => {
      switch(type){
        case 'push': this.matcher.add(filter); break
        case 'remove': this.matcher.remove(filter); break
        case 'setValue':
          this.matcher = new CombinedMultiMatcher(3)
          for(let filter of config.filters)
            this.matcher.add(filter)
          break
      }
    }
    observer('setValue')
    config.filters.observe(observer)
    this.nodeData = new NodeData()
    this.nodeData.children = []
    this.createNodes()
    GM_addStyle(guiStyle.toString())
  }

  static isSearchPage(){
    return window.location.href.indexOf('/search?') > -1
  }

  static getResults(){
    return document.getElementById('ires')
  }

  createNodes(){
    /**
    Create once and clone to improve performance.
    */
    // dash
    this.dash = document.createElement('span')
    this.dash.textContent = '-'
    this.dash.classList.add('dash')
    // add filter link
    this.addLink = document.createElement('a')
    this.addLink.textContent = 'Filter'
    this.addLink.setAttribute('href', '#')
    this.addLink.classList.add('filter-add')
    // hidden result title
    this.showTitle = document.createElement('span')
    this.showTitle.classList.add('show-title')
    // hidden result 'show' link
    this.showLink = document.createElement('a')
    this.showLink.textContent = 'show'
    this.showLink.setAttribute('href', '#')
    this.showLink.classList.add('show-link')
  }

  toggleResult(nodeData, showTitle, showLink, initial=false){
    for(let child of nodeData.node.children)
      if(child != showTitle && child != showLink)
        child.classList.toggle('hide')
    if(initial)
      return
    if(showTitle)
      showTitle.classList.toggle('hide')
    showLink.classList.toggle('hide')
    showLink.textContent = showLink.classList.contains('hide') ? 'hide' : 'show'
  }

  hideResult(nodeData, filter=null){
    if(nodeData.act(this.hideResult, filter))
      return
    if(config.allowHidden && filter.collapse){
      nodeData.node.classList.add('hide')
      nodeData.undo = () => nodeData.node.classList.remove('hide')
      return
    }
    let showTitle = null
    if(nodeData.title !== null){
      showTitle = this.showTitle.cloneNode(false)
      showTitle.textContent = nodeData.title
      nodeData.node.appendChild(showTitle)
    }
    let showLink = this.showLink.cloneNode(true)
    if(filter)
      showLink.title = filter.text
    nodeData.node.appendChild(showLink)
    this.toggleResult(nodeData, showTitle, showLink, true)
    showLink.onclick = () => {
      this.toggleResult(nodeData, showTitle, showLink)
      return false
    }
    nodeData.redo = (filter) => {
      if(filter)
        showLink.title = filter.text
    }
    nodeData.undo = () => {
      if(!showLink.classList.contains('hide'))
        this.toggleResult(nodeData, showTitle, showLink)
      if(showTitle)
        nodeData.node.removeChild(showTitle)
      nodeData.node.removeChild(showLink)
    }
  }

  addFilterLink(nodeData, filter=null){
    if(nodeData.act(this.addFilterLink, filter))
      return
    if(!nodeData.linkArea)
      return
    let dash = this.dash.cloneNode(true)
    nodeData.linkArea.appendChild(dash)
    let addLink = this.addLink.cloneNode(true)
    if(filter)
      addLink.title = filter.text
    nodeData.linkArea.appendChild(addLink)
    addLink.onclick = () => {
      this.addFromResult(nodeData)
      return false
    }
    nodeData.redo = (filter) => {
      if(filter)
        addLink.title = filter.text
    }
    nodeData.undo = () => {
      nodeData.linkArea.removeChild(dash)
      nodeData.linkArea.removeChild(addLink)
    }
  }

  addFromResult(nodeData){
    let domainUrl = '||' + nodeData.url.replace(/^[\w\-]+:\/+(?:www\.)?/, '')
    let text = prompt('Filter: ', domainUrl)
    if(text === null)
      return
    config.filters.push(MultiRegExpFilter.fromText(text))
    this.filterResults()
  }

  _filterResults(nodeData){
    // store all children so we can re-filter
    if(nodeData.children === undefined)
      nodeData.children = Array.from(nodeData.getChildren())
    let filter = this.matcher.matchesAny(nodeData, NodeData.attrs)
    if(filter){
      filter.hitCount++
      filter.lastHit = new Date().getTime()
      config.filters.update(filter)
      if(filter instanceof BlockingFilter){
        this.hideResult(nodeData, filter)
        return true
      }else{
        this.addFilterLink(nodeData, filter)
        return false
      }
    }
    let filtered = !!nodeData.children.length
    for(let childData of nodeData.children){
      if(!this._filterResults(childData))
        filtered = false
    }
    if(filtered)
      this.hideResult(nodeData)
    else if(NodeData.attrs.some((attr) => nodeData[attr] !== null))
      this.addFilterLink(nodeData)
    return filtered
  }

  filterResults(node=null){
    /**
    args:
      node: Used when additional search results pop up.
    */
    let matched = false
    let observer = (type, _filter) => {if(type == 'update') matched = true}
    config.filters.observe(observer)
    if(node){
      // only need to filter the new node
      let nodeData = new ResultsData(node)
      this.nodeData.children.push(nodeData)
      this._filterResults(nodeData)
    }else{
      this._filterResults(this.nodeData)
    }
    if(matched)
      config.flushFilters()
    config.filters.unobserve(observer)
  }
}
