import {NodeData, SearchGui} from 'gfp/gui'
import {cache} from 'gfp/utils'

class ResultsData extends NodeData {
  *getChildren(){
    for(let child of this.node.querySelectorAll('.gsc-table-result'))
      yield new TextData(child)
  }
}

class TextData extends NodeData {
  get linkArea(){return cache(this, 'linkArea', this.node.querySelector('.gsc-url-bottom'))}
  get url(){return cache(this, 'url', this.node.querySelector('a.gs-title').href)}
  get title(){return cache(this, 'title', this.node.querySelector('a.gs-title').textContent)}
  get summary(){return cache(this, 'summary', this.node.querySelector('.gs-snippet').textContent)}
}

export default function(searchGui){
  if(window.location.href.indexOf('/cse?') == -1 && window.location.href.indexOf('/custom?') == -1)
    return
  let resultsObserver = new MutationObserver((mutations) => {
    for(let mutation of mutations){
      for(let addedNode of mutation.addedNodes){
        if(addedNode.classList && addedNode.classList.contains('gcsc-branding')){
          // all results have finished loading
          searchGui.nodeData.children.length = 0
          searchGui.filterResults(document.querySelector('.gsc-results'))
        }
      }
    }
  })
  let mainNode = document.getElementById('cse')
  if(!mainNode)
    return
  resultsObserver.observe(mainNode, {subtree: true, childList: true})
  searchGui = new SearchGui(ResultsData)
  return searchGui
}
