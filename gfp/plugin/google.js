import { NodeData, SearchGui } from 'gfp/gui'
import { cache } from 'gfp/utils'

export class ResultsData extends NodeData {
  *getChildren() {
    for (const child of this.node.querySelectorAll('.g')) {
      if (
        child.classList.contains('obcontainer') ||
        child.classList.contains('kno-kp') ||
        child.classList.contains('g-blk')
      ) {
        // contains other .g elements, skip so we don't have duplicate links
      } else if (child.id === 'imagebox_bigimages') {
        yield new ImageContainerData(child)
      } else if (child.id === 'lclbox') {
        yield new MapContainerData(child)
      } else if (child.firstChild.nodeName === 'G-SECTION-WITH-HEADER') {
        yield new TweetContainerData(child)
      } else if (child.previousElementSibling && child.previousElementSibling.classList.contains('mod')) {
        yield new FeaturedSnippetData(child)
      } else {
        yield new TextData(child)
      }
    }
    for (const child of this.node.querySelectorAll('g-inner-card')) {
      yield new NewsVideoData(child)
    }
  }
}

class CommonData extends NodeData {
  get linkArea() {
    // query in order of preference
    let linkArea =
      this.node.querySelector('a.fl[href^="https://translate."]') || // "Translate this page"
      this.node.querySelector('.action-menu') || // after the action menu
      this.node.querySelector('span.b') || // after the bold "PDF" text
      this.node.querySelector('cite') // after the title
    if (linkArea) {
      linkArea = linkArea.parentNode
    }
    return cache(this, 'linkArea', linkArea)
  }
  get url() {
    return cache(this, 'url', this.node.querySelector('div[data-ved] > div:first-child > a').href)
  }
  get title() {
    return cache(this, 'title', this.node.querySelector('h3').textContent)
  }
}

class ImageContainerData extends NodeData {
  *getChildren() {
    for (const child of this.node.querySelectorAll('.bia')) {
      yield new ImageData(child)
    }
  }
}

class ImageData extends NodeData {
  get url() {
    return cache(this, 'url', this.node.href)
  }
}

class MapContainerData extends NodeData {
  *getChildren() {
    for (const child of this.node.querySelectorAll('div.g')) {
      yield new MapData(child)
    }
  }
}

class MapData extends CommonData {}

class NewsVideoData extends NodeData {
  get linkArea() {
    const query = this.node.querySelector('cite, span[style]')
    if (query == null) {
      // drawing hasn't finished
      return null
    }
    return cache(this, 'linkArea', query.parentNode)
  }
  get url() {
    return cache(this, 'url', this.node.querySelector('a').href)
  }
  get title() {
    return cache(this, 'title', this.node.querySelector('a').textContent)
  }
}

class TweetContainerData extends CommonData {
  get url() {
    return cache(this, 'url', this.node.querySelector('g-more-link > a').href)
  }
  get title() {
    return cache(this, 'title', this.node.querySelector('g-link').textContent)
  }
  *getChildren() {
    for (const child of this.node.querySelectorAll('g-inner-card')) {
      yield new TweetSubData(child)
    }
  }
}

class TweetSubData extends CommonData {
  get linkArea() {
    return cache(this, 'linkArea', this.node.querySelector('span.f'))
  }
  get title() {
    return ''
  }
  get url() {
    return cache(this, 'url', this.node.querySelector('a').href)
  }
  get summary() {
    return cache(this, 'summary', this.node.querySelector('a').textContent)
  }
}

class FeaturedSnippetData extends CommonData {
  get summary() {
    return cache(this, 'summary', this.node.previousElementSibling.textContent)
  }
}

class TextData extends CommonData {
  get summary() {
    return cache(this, 'summary', this.node.querySelector('div[data-ved] > div:nth-child(2)').textContent)
  }
}

export default function (searchGui, config) {
  if (window.location.href.indexOf('/search?') === -1) {
    return
  }
  searchGui = new SearchGui(ResultsData, config)
  searchGui.filterResults(document.getElementById('search'))
  return searchGui
}
