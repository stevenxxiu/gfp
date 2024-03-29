import { NodeData, SearchGui } from 'gfp/gui'
import { cache } from 'gfp/utils'

export class ResultsData extends NodeData {
  *getChildren() {
    for (const child of this.node.querySelectorAll('.g')) {
      if (child.querySelector('.g')) {
        // Contains descendant `.g` elements. Skip so we don't have duplicate filter links.
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
    for (const child of this.node.querySelectorAll('g-inner-card > div')) {
      yield new NewsData(child)
    }
    for (const child of this.node.querySelectorAll('div[role="heading"] + div > div > div[data-ved]')) {
      yield new VideoData(child)
    }
  }
}

class CommonData extends NodeData {
  get linkArea() {
    // Right of the result's link
    let linkArea
    for (const selector of ['g-popup', 'div > a.fl', 'div.action-menu', 'cite']) {
      linkArea = this.node.querySelector(selector)
      if (linkArea) {
        linkArea = linkArea.parentNode
        break
      }
    }
    return cache(this, 'linkArea', linkArea)
  }
  get url() {
    return cache(this, 'url', this.node.querySelector('a[data-ved]').href)
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

class VideoData extends NodeData {
  get linkArea() {
    return cache(this, 'linkArea', this.node.querySelector('span + div > span'))
  }
  get url() {
    return cache(this, 'url', this.node.querySelector('a[data-ved]').href)
  }
  get title() {
    return cache(this, 'title', this.node.querySelector('div[role="heading"]').textContent)
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

class NewsData extends NodeData {
  get linkArea() {
    const query = this.node.querySelector('span[tabindex="-1"] + div > p > span')
    if (query == null) {
      // Drawing hasn't finished
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
    return cache(
      this,
      'summary',
      this.node.querySelector('div[data-ved] > div:first-child > div:nth-child(2)').textContent
    )
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
