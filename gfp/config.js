/* globals GM_getValue, GM_setValue */
import {Filter} from 'gfp/filter'

class Filters {
  constructor(filters){
    this._filters = filters
    this._callbacks = []
  }

  get(i){
    return this._filters[i]
  }

  trigger(type, value){
    for(let cb of this._callbacks)
      cb(type, value)
  }

  push(filter){
    this._filters.push(filter)
    this.trigger('push', filter)
  }

  remove(filter){
    this._filters.pop(this._filters.indexOf(filter))
    this.trigger('remove', filter)
  }

  update(filter){
    this.trigger('update', filter)
  }

  observe(cb){
    this._callbacks.push(cb)
  }

  unobserve(cb){
    this._callbacks.pop(this._callbacks.indexOf(cb))
  }

  [Symbol.iterator](){
    return this._filters[Symbol.iterator]()
  }
}

class Config {
  constructor(){
    this.plugins = ['customSearch', 'instant']
    this.allowHidden = GM_getValue('allowHidden', true)
    this.filtersObject = JSON.parse(GM_getValue('filters', '{}'))
    let filters = []
    for(let key in this.filtersObject)
      filters.push(Filter.fromObject(key, this.filtersObject[key]))
    this.filters = new Filters(filters)
    this.filters.observe((type, value) => {
      switch(type){
        case 'push': this.filtersObject[value.text] = value.toObject(); break
        case 'remove': delete this.filtersObject[value.text]; break
        case 'update': this.filtersObject[value.text] = value.toObject(); break
      }
    })
  }

  flushAllowHidden(){
    GM_setValue('allowHidden', this.allowHidden)
  }

  flushFilters(){
    GM_setValue('filters', JSON.stringify(this.filtersObject))
  }
}

export default new Config()
