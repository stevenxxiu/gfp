/* globals GM_addStyle */
import Config from 'gfp/config';
import {MultiRegExpFilter, WhitelistFilter} from 'gfp/filter';
import {FilterNotifier} from 'gfp/lib/filterNotifier';
import {CombinedMultiMatcher} from 'gfp/matcher';
import {guiStyle} from 'gfp/resource';

export class NodeData {
  constructor(node){
    this.node = node;
  }

  static cache(cls){
    class Decorated extends NodeData {}
    for(let prop of Object.keys(Object.getPrototypeOf(cls.prototype))){
      Object.defineProperty(Decorated.prototype, prop, {
        get: ((prop, method) => function(){
          // children is cached so we can ignore filtered nodes when re-filtering
          let res = method.call(this);
          if(prop == 'children')
            res = Array.from(res);
          Object.defineProperty(this, prop, {value: res});
          return res;
        })(prop, cls.prototype[prop])
      });
    }
    return Decorated;
  }
}

NodeData.attrs = ['url', 'title', 'summary'];
NodeData.prototype.children = [];
NodeData.prototype.linkArea = null;
NodeData.prototype.url = null;
NodeData.prototype.title = null;
NodeData.prototype.summary = null;

var ResultsData = NodeData.cache(class extends NodeData {
  *children(){
    for(let child of this.node.querySelectorAll('li.g')){
      switch(child.id){
        case 'imagebox':
        case 'imagebox_bigimages':
          yield ImageContainerData(child); break;
        case 'videobox':
          yield VideoContainerData(child); break;
        case 'newsbox':
          yield NewsContainerData(child); break;
        default:
          if(child.firstElementChild.childElementCount == 2){
            yield TextData(child);
          }else if(child.firstElementChild.childElementCount >= 1){
            if(child.querySelector('div.th'))
              yield VideoData(child);
          }
      }
    }
  }
});

var TextData = NodeData.cache(class extends NodeData {
  linkArea(){return this.node.querySelector('cite').parentNode;}
  url(){return this.node.querySelector('h3.r>a').href;}
  title(){return this.node.querySelector('h2.r, h3.r').textContent;}
  summary(){return this.node.querySelector('div.s').textContent;}
});

var VideoContainerData = NodeData.cache(class extends NodeData {
  *children(){for(let child of this.node.querySelectorAll('div.vresult')) yield new VideoData(child);}
  title(){return this.node.querySelector('h3.r').textContent;}
});

var VideoData = NodeData.cache(class extends NodeData {
  linkArea(){return this.node.querySelector('cite');}
  url(){return this.node.querySelector('h3.r>a').href;}
  title(){return this.node.querySelector('h3.r').textContent;}
  summary(){return this.node.querySelector('span.st').textContent;}
});

var ImageContainerData = NodeData.cache(class extends NodeData {
  *children(){for(let child of this.node.querySelectorAll('div>a')) yield new ImageData(child);}
  title(){return this.node.querySelector('h3.r').textContent;}
});

var ImageData = NodeData.cache(class extends NodeData {
  url(){return this.node.href;}
});

var NewsContainerData = NodeData.cache(class extends NodeData {
  *children(){for(let child of this.node.querySelectorAll('li.w0>div')) yield new NewsData(child);}
  title(){return this.node.querySelector('h3.r').textContent;}
});

var NewsData = NodeData.cache(class extends NodeData {
  linkArea(){return this.node.querySelector('.gl');}
  url(){return this.node.querySelector('a.l').href;}
  title(){return this.node.querySelector('a.l').textContent;}
  summary(){return this.node.querySelector('div[style]').textContent;}
});

export class SearchGui {
  constructor(){
    this.filters = Config.filters;
    this.matcher = new CombinedMultiMatcher(3);
    for(let filter of this.filters)
      this.matcher.add(filter);
    // save to prevent pref modifications
    this.allowHidden = Config.allowHidden;
    this.nodeDatas = [];
    this.createNodes();
    GM_addStyle(guiStyle);
  }

  static isHomePage(){
    return window.location.href.endsWith('/');
  }

  static isSearchPage(){
    return !this.isHomePage();
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
  }

  createAddLink(nodeData){
    if(!nodeData.linkArea)
      return;
    let dash = this.dash.cloneNode(true);
    nodeData.linkArea.appendChild(dash);
    let addLink = this.addLink.cloneNode(true);
    nodeData.linkArea.appendChild(addLink);
    addLink.onclick = () => {this.addFromResult(nodeData); return false;};
  }

  removeAddLink(nodeData){
    if(!nodeData.linkArea)
      return;
    nodeData.linkArea.removeChild(nodeData.linkArea.lastChild);
    nodeData.linkArea.removeChild(nodeData.linkArea.lastChild);
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
    let filter = this.matcher.matchesAny(nodeData, NodeData.attrs);
    if(filter){
      filter.hitCount++;
      filter.lastHit = new Date().getTime();
      if(!(filter instanceof WhitelistFilter))
        this.hideResult(nodeData, filter);
      return true;
    }
    this.createAddLink(nodeData);
    let filtered = true;
    if(nodeData.children === undefined){
      nodeData.children = [];
      for(let childData of nodeData.getChildren()){
        if(!this._filterResults(childData)){
          nodeData.children.push(childData);
          filtered = false;
        }
      }
    }else{
      for(let i = 0; i < nodeData.children.length;){
        if(this._filterResults(nodeData[i])){
          nodeData.children.splice(i, 1);
        }else{
          filtered = false;
          i++;
        }
      }
    }
  }

  filterResults(prev=false, node=null){
    let nodeDatas;
    if(prev){
      nodeDatas = this.nodeDatas;
    }else{
      nodeDatas = [new ResultsData(node || this.constructor.getResults())];
      this.nodeDatas.push(nodeDatas[0]);
    }
    let matched = false;
    let listener = (action) => {if(action == 'filter.hitCount') matched = true;};
    FilterNotifier.addListener(listener);
    for(let nodeData of nodeDatas)
      this._filterResults(nodeData);
    if(matched)
      Config.filters = this.filters;
    FilterNotifier.removeListener(listener);
  }
}
