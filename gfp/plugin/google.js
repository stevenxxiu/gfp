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
      }else if(child.classList.contains('card-section')){
        yield new NewsData(child)
      }else if(child.childElementCount == 2){
        yield new TweetData(child)
      }else if(child.childElementCount == 3){
        yield new TweetContainerData(child)
      }else{
        yield new TextData(child)
      }
    }
  }
}

class CommonData extends NodeData {
  get linkArea(){return cache(this, 'linkArea', this.node.querySelector('cite').parentNode)}
  get url(){return cache(this, 'url', this.node.querySelector('h3.r > a').href)}
  get title(){return cache(this, 'title', this.node.querySelector('h2.r, h3.r').textContent)}
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

class NewsData extends NodeData {
  get linkArea(){return cache(this, 'linkArea', this.node.querySelector('cite').parentNode)}
  get url(){return cache(this, 'url', this.node.querySelector('a').href)}
  get title(){return cache(this, 'title', this.node.querySelector('a').textContent)}
  get summary(){
    let node = this.node.querySelector('span.s')
    return cache(this, 'summary', node ? node.textContent : null)
  }
}

class TweetData extends CommonData {
  get url(){return cache(this, 'url', this.node.querySelector('h3.r > div > a').href)}
  get summary(){return cache(this, 'summary', this.node.querySelector('div[role="heading"]').textContent)}
}

class TweetContainerData extends CommonData {
  get url(){return cache(this, 'url', this.node.querySelector('h3.r > div > a').href)}
  *getChildren(){for(let child of this.node.querySelectorAll('ol')) yield new TweetSubData(child)}
}

class TweetSubData extends TweetData {
  get url(){return cache(this, 'url', this.node.querySelector('h3.r > div > a').href)}
  get linkArea(){return cache(this, 'linkArea', this.node.querySelector('h3.r + div a'))}
  get summary(){return cache(this, 'summary', this.node.querySelector('div[role="heading"]').textContent)}
}

class TextData extends CommonData {
  get summary(){return cache(this, 'summary', this.node.querySelector('div.s').textContent)}
}

export default function(searchGui){
  if(window.location.href.indexOf('/search?') == -1)
    return
  searchGui = new SearchGui(ResultsData)
  searchGui.filterResults(document.getElementById('ires'))
  return searchGui
}
