/* globals GM_addStyle */
import Config from 'gfp/config';
import {MultiRegExpFilter, WhitelistFilter} from 'gfp/filter';
import {FilterNotifier} from 'gfp/lib/filterNotifier';
import {CombinedMultiMatcher} from 'gfp/matcher';
import {guiStyle} from 'gfp/resource';

class NodeData {
  constructor(node){
    this.node = node;
  }

  *getChildren(){}
  getLinkArea(){return null;}
  getUrl(){return null;}
  getTitle(){return null;}
  getSummary(){return null;}

  get linkArea(){this.linkArea = this.getLinkArea(); return this.linkArea;}
  get url(){this.url = this.getUrl(); return this.url;}
  get title(){this.title = this.getTitle(); return this.title;}
  get summary(){this.summary = this.getSummary(); return this.summary;}
}

class ResultsData extends NodeData {
  *getResults(){
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
  getLinkArea(){return this.node.querySelector('cite').parentNode;}
  getUrl(){return this.node.querySelector('h3.r>a').href;}
  getTitle(){return (this.node.querySelector('h2.r') || this.node.querySelector('h3.r')).textContent;}
  getSummary(){return this.node.querySelector('div.s').textContent;}
}

class VideoContainerData extends NodeData {
  *getResults(){for(let child of this.node.querySelectorAll('div.vresult')) yield new VideoData(child);}
  getTitle(){return this.node.querySelector('h3.r').textContent;}
}

class VideoData extends NodeData {
  getLinkArea(){return this.node.querySelector('cite');}
  getUrl(){return this.node.querySelector('h3.r>a').href;}
  getTitle(){return this.node.querySelector('h3.r').textContent;}
  getSummary(){return this.node.querySelector('span.st').textContent;}
}

class ImageContainerData extends NodeData {
  *getResults(){for(let child of this.node.querySelectorAll('div>a')) yield new ImageData(child);}
  getTitle(){return this.node.querySelector('h3.r').textContent;}
}

class ImageData extends NodeData {
  getUrl(){return this.node.href;}
}

class NewsContainerData extends NodeData {
  *getResults(){for(let child of this.node.querySelectorAll('li.w0>div')) yield new NewsData(child);}
  getTitle(){return this.node.querySelector('h3.r').textContent;}
}

class NewsData extends NodeData {
  getLinkArea(){return this.node.querySelector('.gl');}
  getUrl(){return this.node.querySelector('a.l').href;}
  getTitle(){return this.node.querySelector('a.l').textContent;}
  getSummary(){return this.node.querySelector('div[style]').textContent;}
}

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
    let dash = document.createElement('span');
    dash.innerHTML='&nbsp;-&nbsp;';
    this.dash = dash;
    // add filter link
    let addLink = document.createElement('a');
    addLink.innerHTML = 'Filter';
    addLink.setAttribute('href', '#');
    addLink.setAttribute('class', 'filter-add');
    this.addLink = addLink;
    // hidden result title
    let showTitle = document.createElement('span');
    showTitle.setAttribute('class', 'show-title');
    this.showTitle = showTitle;
    // hidden result 'show' link
    let showLink = document.createElement('a');
    showLink.setAttribute('href', '#');
    showLink.setAttribute('class', 'show-link');
    this.showLink = showLink;
  }

  toggleResult(hide, node){
    if(this.allowHidden){
      node.style.display = hide ? 'none' : '';
      return;
    }
    for(let child of node.children)
      child.style.display = hide ? 'none' : '';
    let showTitle = node.querySelector('.showTitle');
    showTitle.style.display = hide ? '' : 'none';
    let showLink = node.querySelector('.showLink');
    showLink.style.display = hide ? '' : 'none';
    showLink.innerHTML = hide ? 'show' : 'hide';
  }

  hideResult(nodeData, filter){
    let node = nodeData.node;
    let showTitle = this.showTitle.cloneNode(false);
    let title = nodeData.title;
    if(title)
      showTitle.innerHTML = title + '&nbsp;&nbsp;';
    node.appendChild(showTitle);
    let showLink = this.showLink.cloneNode(false);
    showLink.innerHTML = 'show';
    showLink.title = filter.text;
    node.appendChild(showLink);
    let hide = false;
    this.toggleResult(true, node);
    showLink.onclick = (e) => {
      this.toggleResult(hide, node);
      hide = !hide;
      return false;
    };
  }

  createAddLink(nodeData){
    let linkArea = nodeData.linkArea;
    if(!linkArea)
      return;
    let dash = this.dash.cloneNode(true);
    linkArea.appendChild(dash);
    let addLink = this.addLink.cloneNode(true);
    linkArea.appendChild(addLink);
    addLink.onclick = () => {this.addFromResult(nodeData); return false;};
  }

  removeAddLink(nodeData){
    let linkArea = nodeData.linkArea;
    if(!linkArea)
      return;
    linkArea.removeChild(linkArea.lastChild);
    linkArea.removeChild(linkArea.lastChild);
  }

  addFromResult(nodeData){
    let domainUrl = '||' + nodeData.url.replace(/^[\w\-]+:\/+(?:www\.)?/, '');
    let text = prompt('Filter: ', domainUrl);
    this.matcher.add(MultiRegExpFilter.fromText(text));
    this.filterResultsRem();
  }

  _filterResults(nodeData){
    let filter = this.matcher.matchesAny(nodeData);
    if(filter){
      filter.hitCount++;
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

  filterResults(node=null){
    let nodeDatas;
    if(node){
      nodeDatas = [new ResultsData(node)];
      this.nodeDatas.push(nodeDatas[0]);
    }else{
      nodeDatas = this.nodeDatas;
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
