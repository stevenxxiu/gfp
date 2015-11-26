/* globals GM_getValue, GM_setValue */
import {Filter} from 'gfp/filter'
import {bisect, indexOfSorted, popMany} from 'gfp/utils'

class Filters {
  constructor(filters){
    this._comparer = (x, y) => x['text'] > y['text'] ? 1 : x['text'] < y['text'] ? -1 : 0
    this._filters = filters.sort(this._comparer)
    this._callbacks = []
  }

  get length(){
    return this._filters.length
  }

  [Symbol.iterator](){
    return this._filters[Symbol.iterator]()
  }

  _trigger(type, value){
    for(let cb of this._callbacks)
      cb(type, value)
  }

  add(filter){
    this._filters.splice(bisect(this._filters, filter, this._comparer), 0, filter)
    this._trigger('add', filter)
  }

  remove(filters){
    popMany(this._filters, indexOfSorted(this._filters, filters.sort(this._comparer), this._comparer))
    this._trigger('remove', filters)
  }

  update(filter){
    this._trigger('update', filter)
  }

  setValue(filters){
    this._filters = filters.sort(this._comparer)
    this._trigger('setValue', filters)
  }

  observe(cb){
    this._callbacks.push(cb)
  }

  unobserve(cb){
    this._callbacks.splice(this._callbacks.indexOf(cb), 1)
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
        case 'add':
          this.filtersObject[value.text] = value.toObject()
          break
        case 'remove':
          for(let filter of value)
            delete this.filtersObject[filter.text]
          break
        case 'update':
          this.filtersObject[value.text] = value.toObject()
          break
        case 'setValue':
          this.filtersObject = {}
          for(let filter of value)
            this.filtersObject[filter.text] = filter.toObject()
          break
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
