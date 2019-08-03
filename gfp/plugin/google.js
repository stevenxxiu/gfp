import {NodeData, SearchGui} from 'gfp/gui'
import {cache} from 'gfp/utils'

export class ResultsData extends NodeData {
  *getChildren(){
    for(let child of this.node.querySelectorAll('.g')){
      if(child.classList.contains('obcontainer') || child.classList.contains('mnr-c')){
      }else if(child.id == 'imagebox_bigimages'){
        yield new ImageContainerData(child)
      }else if(child.id == 'lclbox'){
        yield new MapContainerData(child)
      }else if(child.firstChild.nodeName == 'G-SECTION-WITH-HEADER'){
        yield new TweetContainerData(child)
      }else{
        yield new TextData(child)
      }
    }
    for(let child of this.node.querySelectorAll('g-inner-card'))
      yield new NewsVideoData(child)
  }
}

class CommonData extends NodeData {
  get linkArea(){return cache(this, 'linkArea', this.node.querySelector('cite').parentNode)}
  get url(){return cache(this, 'url', this.node.querySelector('.r > a').href)}
  get title(){return cache(this, 'title', this.node.querySelector('h3').textContent)}
}

class ImageContainerData extends NodeData {
  *getChildren(){for(let child of this.node.querySelectorAll('.bia')) yield new ImageData(child)}
}

class ImageData extends NodeData {
  get url(){return cache(this, 'url', this.node.href)}
}

class MapContainerData extends NodeData {
  *getChildren(){for(let child of this.node.querySelectorAll('div.g')) yield new MapData(child)}
}

class MapData extends CommonData {}

class NewsVideoData extends NodeData {
  get linkArea(){
    let query = this.node.querySelector('cite, span[style]')
    if(query == null) return null // drawing hasn't finished
    return cache(this, 'linkArea', query.parentNode)
  }
  get url(){return cache(this, 'url', this.node.querySelector('a').href)}
  get title(){return cache(this, 'title', this.node.querySelector('a').textContent)}
}

class TweetContainerData extends CommonData {
  get url(){return cache(this, 'url', this.node.querySelector('g-more-link > a').href)}
  get title(){return cache(this, 'title', this.node.querySelector('g-link').textContent)}
  *getChildren(){for(let child of this.node.querySelectorAll('g-inner-card')) yield new TweetSubData(child)}
}

class TweetSubData extends CommonData {
  get linkArea(){return cache(this, 'linkArea', this.node.querySelector('span.f'))}
  get title(){return ''}
  get url(){return cache(this, 'url', this.node.querySelector('a').href)}
  get summary(){return cache(this, 'summary', this.node.querySelector('a').textContent)}
}

class TextData extends CommonData {
  get summary(){return cache(this, 'summary', this.node.querySelector('div.s').textContent)}
}

export default function(searchGui, config){
  if(window.location.href.indexOf('/search?') == -1)
    return
  searchGui = new SearchGui(ResultsData, config)
  searchGui.filterResults(document.getElementById('ires'))
  return searchGui
}
