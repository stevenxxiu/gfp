import $ from 'jquery'

import Config from 'gfp/config'
import Pref from 'gfp/pref'
import { Filter } from 'gfp/filter'
import { pad } from 'gfp/utils'

function main() {
  window.store = (() => {
    const filters = {
      'slow filter': {},
      '@@whitelist filter ': {},
      ' fast filter ': {},
      ' matched ': {
        hitCount: 1,
        lastHit: new Date(2000, 0, 2, 2, 4, 5, 6).getTime(),
      },
    }
    for (let i = 0; i < 50; i++) filters[` filter ${pad(i, 2)} `] = {}
    return { filters: JSON.stringify(filters) }
  })()
  window.GM_addStyle = (text) => {
    if (text === '') {
      return
    }
    const style = document.createElement('style')
    style.textContent = text
    document.head.appendChild(style)
  }
  window.GM_getResourceText = () => ''
  window.GM_getResourceURL = () => ''
  window.GM_registerMenuCommand = (name, cb) => $(cb)
  window.GM_getValue = (name, value) => (name in window.store ? window.store[name] : value)
  window.GM_setValue = (name, value) => (window.store[name] = value)
  const config = new Config()
  const searchGui = { config: config, filterResults: () => {} }
  new Pref(searchGui)
  $(() => {
    const controls = $(`<div style="text-align: center; position: absolute; left: 0; right: 0; bottom: 80px;">
      <div style="display: inline-block;">
        <button class="inc-hit-count">Increase hit count</button>
        <button class="add-filter">Add filter</button>
      </div>
    </div>`)
      .buttonset()
      .appendTo('body')
    controls.find('button').focus(function () {
      $(this).removeClass('ui-state-focus')
    })
    controls.find('.inc-hit-count').click(() => {
      const filter = config.filters._filters[1]
      filter.hitCount++
      config.filters.update(filter)
    })
    controls.find('.add-filter').click(() => {
      config.filters.add(Filter.fromText(` added filter ${pad(config.filters.length, 3)} `))
    })
  })
}

main()
