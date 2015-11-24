/* global $, GM_addStyle, GM_registerMenuCommand, Slick*/
import config from 'gfp/config'
import prefStyle from 'gfp/css/pref.scss'
import prefHtml from 'gfp/html/pref.html'
import {InvalidFilter} from 'gfp/lib/filterClasses'
import {Filter} from 'gfp/filter'
import {CombinedMultiMatcher} from 'gfp/matcher'
import {addStyleResolve, pad} from 'gfp/utils'

class Pref {
  constructor(){
    this.dialog = null
    this.resourcesAdded = false
    GM_registerMenuCommand('Google Search Filter +', this.openDialog.bind(this), null)
  }

  openDialog(){
    if(this.dialog)
      return
    this.addResources()
    this.dialog = new PrefDialog().dialog.on('dialogclose', () => this.dialog = null)
  }

  addResources(){
    if(this.resourcesAdded)
      return
    addStyleResolve('jquery-ui-css')
    addStyleResolve('slickgrid-css')
    GM_addStyle(prefStyle.toString())
    this.resourcesAdded = true
  }
}

class PrefDialog {
  constructor(){
    this.dialog = $(prefHtml).dialog(this.dialogConfig, Object.assign({
      title: 'Google Search Filter +', 'closeOnEscape': false, close: this.destructor.bind(this),
    }))
    this.data = []
    this.grid = null
    this.filterObserver = null
    this.entryToFilterMap = new Map()
    this.filterToEntryMap = new Map()
    this.bindImport()
    this.bindExport()
    this.addGrid()
    this.addGridListeners()
    // observe last to populate grid
    this.observeFilters()
  }

  destructor(){
    this.unobserveFilters()
    this.dialog.remove()
  }

  get dialogConfig(){
    return {
      width: $(window).width()*0.5,
      height: $(window).height()*0.5,
      close(){$(this).remove()},
    }
  }

  bindImport(){
    this.dialog.find('.import').click((_e) => {
      $('<textarea></textarea>')
        .dialog(Object.assign({
          title: 'Import',
          buttons: [{
            text: 'OK',
            click(){
              config.filtersObject = JSON.parse($(this).val())
              let filters = []
              for(let key in config.filtersObject)
                filters.push(Filter.fromObject(key, config.filtersObject[key]))
              config.filters.setValue(filters)
              config.flushFilters()
              $(this).dialog('close')
            },
          }, {text: 'Cancel', click(){$(this).dialog('close')}}],
          create(){setTimeout(() => this.select(), 0)},
        }, this.dialogConfig))
      return false
    })
  }

  bindExport(){
    this.dialog.find('.export').click((_e) => {
      $('<textarea></textarea>')
        .attr('readonly', 'readonly')
        .val(JSON.stringify(config.filtersObject, null, 2))
        .dialog(Object.assign({
          title: 'Export',
          buttons: [{text: 'Close', click(){$(this).dialog('close')}}],
          create(){setTimeout(() => {this.focus(); this.setSelectionRange(0, this.value.length, 'backward')}, 0)},
        }, this.dialogConfig))
      return false
    })
  }

  triggerGrid(evt, args, e){
    // adapted from slickgrid source
    e = e || new Slick.EventData()
    args = args || {}
    args.grid = this.grid
    return evt.notify(args, e, this.grid)
  }

  filterToEntry(filter){
    return {
      text: filter.text,
      slow: CombinedMultiMatcher.isSlowFilter(filter),
      enabled: !filter.disabled,
      hitCount: filter.hitCount,
      lastHit: filter.lastHit,
    }
  }

  entryToFilter(data){
    return Filter.fromObject(data.text, {
      disabled: !data.enabled,
      hitCount: data.hitCount,
      lastHit: data.lastHit,
    })
  }

  observeFilters(){
    this.filterObserver = (type, filter) => {
      let entry
      switch(type){
        case 'push':
          // XXX update grid if entry does not already exist
          entry = this.filterToEntry(filter)
          this.data.push(entry)
          this.entryToFilterMap.set(entry, filter)
          this.filterToEntryMap.set(filter, entry)
          break
        case 'remove':
          // XXX update grid if entry does not already exist
          entry = this.entryToFilterMap.delete(filter)
          this.data.splice(this.data.indexOf(entry), 1)
          this.filterToEntryMap.delete(entry)
          break
        case 'update':
          // XXX update grid if entry does not already exist
          entry = this.filterToEntry(filter)
          Object.assign(this.filterToEntryMap.get(filter), entry)
          break
        case 'setValue':
          this.data.length = 0
          for(let filter of config.filters){
            let entry = this.filterToEntry(filter)
            this.data.push(entry)
            this.entryToFilterMap.set(entry, filter)
            this.filterToEntryMap.set(filter, entry)
          }
          this.grid.updateRowCount()
          this.triggerGrid(this.grid.onSort, {sortCol: {field: 'text'}, sortAsc: true})
          this.grid.setSortColumn('text', true)
          break
      }
    }
    this.filterObserver('setValue')
    config.filters.observe(this.filterObserver)
  }

  unobserveFilters(){
    config.filters.unobserve(this.filterObserver)
  }

  addGrid(){
    let gridDom = this.dialog.find('.grid')
    this.grid = new Slick.Grid(gridDom, this.data, [
      {
        id: 'text', field: 'text', name: 'Filter rule', width: 300, sortable: true,
        editor: Slick.Editors.Text, validator: (text) => {
          // spaces only don't count as being empty, since they can exist in urls
          if(!text)
            return {valid: false, msg: 'Empty filter'}
          if(Filter.fromText(text) instanceof InvalidFilter)
            return {valid: false, msg: 'Invalid filter'}
          return {valid: true, msg: null}
        },
      }, {
        // use css for the image since there can be many slow filters
        id: 'slow', field: 'slow', name: '!', width: 1, sortable: true,
        formatter: (row, cell, value, columnDef, dataContext) =>
          dataContext.slow ? '<img class="slow-image"></img>' : '',
      }, {
        id: 'enabled', field: 'enabled', name: 'Enabled', width: 40, sortable: true,
        formatter: (row, cell, value, columnDef, _dataContext) =>
          `<input type="checkbox" name="" value="${value}" ${value ? 'checked' : ''} />`,
      }, {
        id: 'hitCount', field: 'hitCount', name: 'Hits', width: 1, sortable: true,
        editor: Slick.Editors.Text, validator: (text) => {
          let val = parseInt(text)
          if(isNaN(val) || val < 0)
            return {valid: false, msg: 'must be a number >= 0'}
          return {valid: true, msg: null}
        },
      }, {
        id: 'lastHit', field: 'lastHit', name: 'Last hit', width: 110, sortable: true,
        formatter: (row, cell, value, columnDef, dataContext) => {
          let date = new Date(value)
          return dataContext.hitCount > 0 ? (
            `${date.getFullYear()}-${pad(date.getMonth() + 1, 2)}-${pad(date.getDate(), 2)} ` +
            `${pad(date.getHours() + 1, 2)}:${pad(date.getMinutes(), 2)}:${pad(date.getSeconds(), 2)}:` +
            `${pad(date.getMilliseconds(), 3)}`
          ) : ''
        }, editor: Slick.Editors.Text, validator: (text) => {
          let val = parseInt(text)
          if(isNaN(val))
            return {valid: false, msg: 'must be a number'}
          return {valid: true, msg: null}
        },
      },
    ], {
      enableCellNavigation: true,
      enableColumnReorder: false,
      forceFitColumns: true,
      editable: true,
      autoEdit: false,
    })
    let height = gridDom.height()
    this.dialog.on('dialogresize', (e, ui) => {
      gridDom.css('height', `${height + (ui.size.height - ui.originalSize.height)}px`)
      this.grid.resizeCanvas()
    })
  }

  addGridListeners(){
    this.grid.onSort.subscribe((e, args) => {
      let field = args.sortCol.field
      let res = args.sortAsc ? 1 : -1
      this.data.sort((x, y) => x[field] > y[field] ? res : x[field] < y[field] ? -res : 0)
      this.grid.invalidateAllRows()
      this.grid.render()
    })
    this.grid.onClick.subscribe((e, args) => {
      if($(e.target).is(':checkbox')){
        let column = args.grid.getColumns()[args.cell]
        if(column.editable === false || column.autoEdit === false)
          return
        this.data[args.row][column.field] = !this.data[args.row][column.field]
        this.triggerGrid(this.grid.onCellChange, {row: args.row, cell: args.cell, item: this.data[args.row]})
      }
    })
    this.grid.onValidationError.subscribe((e, args) => {
      alert(args.validationResults.msg)
    })
    this.grid.onCellChange.subscribe((e, args) => {
      let column = args.grid.getColumns()[args.cell]
      let entry = this.data[args.row]
      switch(column.field){
        case 'hitCount':
          entry[column.field] = parseInt(entry[column.field])
          break
        case 'lastHit':
          entry[column.field] = parseInt(entry[column.field])
          this.grid.invalidateRow(args.row)
          this.grid.render()
          break
      }
      if(column.field == 'text'){
        config.filters.remove(this.entryToFilterMap.get(entry))
        config.filters.push(Filter.fromText(entry[column.field]))
      }else{
        let filter = this.entryToFilterMap.get(entry)
        Object.assign(filter, this.entryToFilter(entry))
        config.filters.update(filter)
      }
    })
  }
}

export default new Pref()
