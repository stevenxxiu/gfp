/* globals GM_addStyle */
import Config from 'gfp/config';
import {BlockingFilter, MultiRegExpFilter} from 'gfp/filter';
import {FilterNotifier} from 'gfp/lib/filterNotifier';
import {CombinedMultiMatcher} from 'gfp/matcher';
import {guiStyle} from 'gfp/resource';
import {cache} from 'gfp/utils';

export class NodeData {
  constructor(node){
    this.node = node;
  }

  *getChildren(){}
  undo(){}
}

NodeData.attrs = ['url', 'title', 'summary'];
NodeData.prototype.linkArea = null;
NodeData.prototype.url = null;
NodeData.prototype.title = null;
NodeData.prototype.summary = null;

export class ResultsData extends NodeData {
  *getChildren(){
    for(let child of this.node.querySelectorAll('li.g')){
      switch(child.id){
        case 'imagebox':
        case 'imagebox_bigimages':
          yield new ImageContainerData(child); break;
        case 'videobox':
          yield new VideoContainerData(child); break;
        case 'newsbox':
          yield new NewsContainerData(child); break;
        default:
          if(child.firstElementChild.childElementCount == 2){
            yield new TextData(child);
          }else if(child.firstElementChild.childElementCount >= 1){
            if(child.querySelector('div.th'))
              yield new VideoData(child);
          }
      }
    }
  }
}

class TextData extends NodeData {
  get linkArea(){return cache(this, 'linkArea', this.node.querySelector('cite').parentNode);}
  get url(){return cache(this, 'url', this.node.querySelector('h3.r>a').href);}
  get title(){return cache(this, 'title', this.node.querySelector('h2.r, h3.r').textContent);}
  get summary(){return cache(this, 'summary', this.node.querySelector('div.s').textContent);}
}

class VideoContainerData extends NodeData {
  *getChildren(){for(let child of this.node.querySelectorAll('div.vresult')) yield new VideoData(child);}
  get title(){return cache(this, 'title', this.node.querySelector('h3.r').textContent);}
}

class VideoData extends NodeData {
  get linkArea(){return cache(this, 'linkArea', this.node.querySelector('cite'));}
  get url(){return cache(this, 'url', this.node.querySelector('h3.r>a').href);}
  get title(){return cache(this, 'title', this.node.querySelector('h3.r').textContent);}
  get summary(){return cache(this, 'summary', this.node.querySelector('span.st').textContent);}
}

class ImageContainerData extends NodeData {
  *getChildren(){for(let child of this.node.querySelectorAll('div>a')) yield new ImageData(child);}
  get title(){return cache(this, 'title', this.node.querySelector('h3.r').textContent);}
}

class ImageData extends NodeData {
  get url(){return cache(this, 'url', this.node.href);}
}

class NewsContainerData extends NodeData {
  *getChildren(){for(let child of this.node.querySelectorAll('li.w0>div')) yield new NewsData(child);}
  get title(){return cache(this, 'title', this.node.querySelector('h3.r').textContent);}
}

class NewsData extends NodeData {
  get linkArea(){return cache(this, 'linkArea', this.node.querySelector('.gl'));}
  get url(){return cache(this, 'url', this.node.querySelector('a.l').href);}
  get title(){return cache(this, 'title', this.node.querySelector('a.l').textContent);}
  get summary(){return cache(this, 'summary', this.node.querySelector('div[style]').textContent);}
}

export class SearchGui {
  constructor(){
    this.filters = Config.filters;
    this.matcher = new CombinedMultiMatcher(3);
    for(let filter of this.filters)
      this.matcher.add(filter);
    // save to prevent pref modifications
    this.allowHidden = Config.allowHidden;
    this.nodeData = {children: []};
    this.createNodes();
    GM_addStyle(guiStyle);
  }

  static isSearchPage(){
    return window.location.href.indexOf('/search?') > -1;
  }

  static getResults(){
    return document.getElementById('ires');
  }

  createNodes(){
    /**
    Create once and clone to improve performance.
    */
    // dash
    this.dash = document.createElement('span');
    this.dash.textContent = '-';
    this.dash.classList.add('dash');
    // add filter link
    this.addLink = document.createElement('a');
    this.addLink.textContent = 'Filter';
    this.addLink.setAttribute('href', '#');
    this.addLink.classList.add('filter-add');
    // hidden result title
    this.showTitle = document.createElement('span');
    this.showTitle.classList.add('show-title');
    // hidden result 'show' link
    this.showLink = document.createElement('a');
    this.showLink.textContent = 'show';
    this.showLink.setAttribute('href', '#');
    this.showLink.classList.add('show-link');
  }

  toggleResult(nodeData, showTitle, showLink, initial=false){
    for(let child of nodeData.node.children)
      if(child != showTitle && child != showLink)
        child.classList.toggle('hide');
    if(initial)
      return;
    if(showTitle)
      showTitle.classList.toggle('hide');
    showLink.classList.toggle('hide');
    showLink.textContent = showLink.classList.contains('hide') ? 'hide' : 'show';
  }

  hideResult(nodeData, filter){
    if(this.allowHidden && filter.collapse){
      nodeData.node.classList.add('hide');
      nodeData.undo = () => nodeData.node.classList.remove('hide');
      return;
    }
    let showTitle;
    if(nodeData.title !== null){
      showTitle = this.showTitle.cloneNode(false);
      showTitle.textContent = nodeData.title;
      nodeData.node.appendChild(showTitle);
    }
    let showLink = this.showLink.cloneNode(true);
    showLink.title = filter.text;
    nodeData.node.appendChild(showLink);
    this.toggleResult(nodeData, showTitle, showLink, true);
    showLink.onclick = () => {
      this.toggleResult(nodeData, showTitle, showLink);
      return false;
    };
    nodeData.undo = () => {
      if(!showLink.classList.contains('hide'))
        this.toggleResult(nodeData, showTitle, showLink);
      nodeData.node.removeChild(showTitle);
      nodeData.node.removeChild(showLink);
    };
  }

  addFilterLink(nodeData, filter=null){
    if(!nodeData.linkArea)
      return;
    let dash = this.dash.cloneNode(true);
    nodeData.linkArea.appendChild(dash);
    let addLink = this.addLink.cloneNode(true);
    if(filter)
      addLink.title = filter.text;
    nodeData.linkArea.appendChild(addLink);
    addLink.onclick = () => {
      this.addFromResult(nodeData);
      return false;
    };
    nodeData.undo = () => {
      nodeData.linkArea.removeChild(dash);
      nodeData.linkArea.removeChild(addLink);
    };
  }

  addFromResult(nodeData){
    let domainUrl = '||' + nodeData.url.replace(/^[\w\-]+:\/+(?:www\.)?/, '');
    let text = prompt('Filter: ', domainUrl);
    if(text === null)
      return;
    let filter = MultiRegExpFilter.fromText(text);
    this.filters.push(filter);
    this.matcher.add(filter);
    this.filterResults(true);
  }

  _filterResults(nodeData){
    nodeData.undo();
    delete nodeData.undo;
    let filter = this.matcher.matchesAny(nodeData, NodeData.attrs);
    if(filter){
      filter.hitCount++;
      filter.lastHit = new Date().getTime();
      if(filter instanceof BlockingFilter)
        this.hideResult(nodeData, filter);
      else
        this.addFilterLink(nodeData, filter);
      return true;
    }
    if(NodeData.attrs.some((attr) => nodeData.attr !== null))
      this.addFilterLink(nodeData);
    if(nodeData.children === undefined)
      nodeData.children = Array.from(nodeData.getChildren());
    let filtered = true;
    for(let childData of nodeData.children){
      if(!this._filterResults(childData))
        filtered = false;
    }
    return filtered;
  }

  filterResults(node=null){
    let matched = false;
    let listener = (action) => {if(action == 'filter.hitCount') matched = true;};
    FilterNotifier.addListener(listener);
    if(node){
      let nodeData = new ResultsData(node);
      this.nodeData.children.push(nodeData);
      this._filterResults(nodeData);
    }else{
      this._filterResults(this.nodeData);
    }
    if(matched)
      Config.filters = this.filters;
    FilterNotifier.removeListener(listener);
  }
}
