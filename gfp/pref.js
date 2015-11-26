/* global $, GM_addStyle, GM_registerMenuCommand, Slick*/
import config from 'gfp/config'
import prefStyle from 'gfp/css/pref.scss'
import prefHtml from 'gfp/html/pref.html'
import {InvalidFilter} from 'gfp/lib/filterClasses'
import {Filter} from 'gfp/filter'
import {CombinedMultiMatcher} from 'gfp/matcher'
import {addStyleResolve, bisect, pad} from 'gfp/utils'

export default class Pref {
  constructor(searchGui){
    this.searchGui = searchGui
    this.dialog = null
    this.resourcesAdded = false
    GM_registerMenuCommand('Google Search Filter +', this.openDialog.bind(this), null)
  }

  openDialog(){
    if(this.dialog)
      return
    this.addResources()
    this.dialog = new PrefDialog(this.searchGui).dialog.on('dialogclose', () => this.dialog = null)
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

class DataView {
  /**
  Supports filtering & sorting.
  config.filters is used as the actual data source.
  */

  constructor(grid, comparer, filterer){
    this.grid = grid
    this.filters = []
    this.comparer = comparer
    this.filterer = filterer
    this._filterObserver = this.filterObserver.bind(this)
    config.filters.observe(this._filterObserver)
  }

  destructor(){
    config.filters.unobserve(this._filterObserver)
  }

  static filterToitem(filter){
    return {
      text: filter.text,
      slow: CombinedMultiMatcher.isSlowFilter(filter),
      enabled: !filter.disabled,
      hitCount: filter.hitCount,
      lastHit: filter.lastHit,
    }
  }

  static itemToFilter(item){
    return Filter.fromObject(item.text, {
      disabled: !item.enabled,
      hitCount: item.hitCount,
      lastHit: item.lastHit,
    })
  }

  getLength(){
    return this.filters.length
  }

  _editOp(call, func){
    if(this._enterLock)
      return
    this._enterLock = true
    func()
    if(call)
      config.flushFilters()
    this._enterLock = false
  }

  push(filter, call=true){
    this._editOp(call, () => {
      if(call){
        config.filters.push(filter)
      }else{
        if(!this.filterer(filter))
          return
      }
      let i = bisect(this.filters, filter, this.comparer)
      this.filters.splice(i, 0, filter)
      this.grid.invalidateAllRows()
      this.grid.updateRowCount()
      this.grid.render()
      if(call)
        this.grid.scrollRowIntoView(i)
    })
  }

  remove(filter, i, call=true){
    this._editOp(call, () => {
      if(call){
        config.filters.remove(filter)
      }else{
        i = this.filters.indexOf(filter)
        if(!this.filterer(filter) || i == -1)
          return
      }
      this.filters.splice(i, 1)
      this.grid.invalidateAllRows()
      this.grid.updateRowCount()
      this.grid.render()
    })
  }

  update(filter, i, call=true){
    this._editOp(call, () => {
      if(call){
        // remove & push since the subfilter parent references will be different
        config.filters.remove(this.filters[i])
        config.filters.push(filter)
      }else{
        i = this.filters.indexOf(filter)
        if(!this.filterer(filter) || i == -1)
          return
      }
      this.filters.splice(i, 1)
      i = bisect(this.filters, filter, this.comparer)
      this.filters.splice(i, 0, filter)
      this.grid.invalidateAllRows()
      this.grid.render()
      if(call)
        this.grid.scrollRowIntoView(i)
    })
  }

  setValue(filters, call=true){
    if(call)
      config.filters.setValue(filters)
    this.filters = filters.filter(this.filterer).sort(this.comparer)
    this.grid.invalidateAllRows()
    this.grid.updateRowCount()
    this.grid.render()
  }

  getItem(i){
    return this.constructor.filterToitem(this.filters[i])
  }

  setComparer(comparer){
    this.comparer = comparer
    this.filters = this.filters.sort(this.comparer)
    this.grid.invalidateAllRows()
    this.grid.render()
  }

  setFilterer(filterer){
    this.filterer = filterer
    this.filters = this.filters.filter(this.filterer).sort(this.comparer)
    this.grid.invalidateAllRows()
    this.grid.updateRowCount()
    this.grid.render()
  }

  filterObserver(type, value){
    switch(type){
      case 'push': this.push(value, false); break
      case 'remove': this.remove(value, null, false); break
      case 'update': this.update(value, null, false); break
      case 'setValue': this.setValue(value, false); break
    }
  }
}

class PrefDialog {
  constructor(searchGui){
    this.searchGui = searchGui
    this.dialog = $(prefHtml).dialog(Object.assign(this.dialogConfig, {
      title: 'Google Search Filter +', 'closeOnEscape': false, close: this.destructor.bind(this),
    }))
    this.dataView = null
    this.bindImport()
    this.bindExport()
    this.addGrid()
  }

  destructor(){
    this.dataView.destructor()
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
    let self = this
    this.dialog.find('.import').click((_e) => {
      $('<textarea></textarea>')
        .dialog(Object.assign(this.dialogConfig, {
          title: 'Import',
          buttons: [{
            text: 'OK',
            click(){
              let filtersObject = JSON.parse($(this).val())
              let filters = []
              for(let key in filtersObject)
                filters.push(Filter.fromObject(key, filtersObject[key]))
              self.dataView.setValue(filters)
              $(this).dialog('close')
            },
          }, {text: 'Cancel', click(){$(this).dialog('close')}}],
          create(){setTimeout(() => this.select(), 0)},
        }))
      return false
    })
  }

  bindExport(){
    this.dialog.find('.export').click((_e) => {
      $('<textarea></textarea>')
        .attr('readonly', 'readonly')
        .val(JSON.stringify(config.filtersObject, null, 2))
        .dialog(Object.assign(this.dialogConfig, {
          title: 'Export',
          buttons: [{text: 'Close', click(){$(this).dialog('close')}}],
          create(){setTimeout(() => {this.focus(); this.setSelectionRange(0, this.value.length, 'backward')}, 0)},
        }))
      return false
    })
  }

  addGrid(){
    let gridDom = this.dialog.find('.grid')
    this.dataView = new DataView(null, null, () => true)
    let grid = new Slick.Grid(gridDom, this.dataView, [
      {
        id: 'text', field: 'text', name: 'Filter rule', width: 300, sortable: true,
        formatter: (row, cell, value, columnDef, _dataContext) =>
          `<span class="${value.startsWith('@@') ? 'whitelist' : 'blocking'}-filter">${value}</span>`,
        editor: Slick.Editors.Text, validator: (text) => {
          // spaces only don't count as being empty, since they can exist in urls
          if(!text)
            return {valid: false, msg: 'Empty filter'}
          if(Filter.fromText(text) instanceof InvalidFilter)
            return {valid: false, msg: 'Invalid filter'}
          if(Array.from(config.filters).some((filter) => filter.text == text))
            return {valid: false, msg: 'Duplicate filter'}
          return {valid: true, msg: null}
        },
      }, {
        // use css for the image since there can be many slow filters
        id: 'slow', field: 'slow', name: '!', width: 1, sortable: true,
        formatter: (row, cell, value, columnDef, _dataContext) =>
          value ? '<img class="slow-image"></img>' : '',
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
      autoEdit: false,
      editable: true,
      enableCellNavigation: true,
      enableColumnReorder: false,
      forceFitColumns: true,
      showHeaderRow: true,
      explicitInitialization: true,
    })
    // find bar
    let findBar = gridDom.find('.slick-headerrow')
    let openFindBar = () => {findBar.show(); findBar.find('input:first').focus()}
    let closeFindBar = () => {findBar.hide(); this.dialog.focus()}
    grid.onHeaderRowCellRendered.subscribe((e, args) => {
      let searchField = $('<input></input>').data('columnId', args.column.id)
      .keydown((e) => {if(e.keyCode == 27) closeFindBar()})
      $(args.node).empty().append(searchField)
    })
    this.dialog.attr('tabindex', 1)
    this.dialog.keydown((e) => {if((e.ctrlKey || e.metaKey) && e.keyCode == 70){openFindBar(); e.preventDefault()}})
    grid.init()
    closeFindBar()
    // sorting
    this.dataView.grid = grid
    grid.onSort.subscribe((e, args) => {
      let field = args.sortCol.field
      let res = args.sortAsc ? 1 : -1
      this.dataView.setComparer((x, y) => x[field] > y[field] ? res : x[field] < y[field] ? -res : 0)
    })
    grid.setSortColumn('text', true)
    new grid.onSort.notify({sortCol: {field: 'text'}, sortAsc: true}, new Slick.EventData())
    this.dataView.setValue(Array.from(config.filters), false)
    // editing
    grid.onClick.subscribe((e, args) => {
      if($(e.target).is(':checkbox')){
        let column = grid.getColumns()[args.cell]
        if(column.editable === false || column.autoEdit === false)
          return
        let item = this.dataView.getItem(args.row)
        item[column.field] = !item[column.field]
        new grid.onCellChange.notify({row: args.row, cell: args.cell, item: item}, new Slick.EventData())
      }
    })
    grid.onValidationError.subscribe((e, args) => alert(args.validationResults.msg))
    grid.onCellChange.subscribe((e, args) => {
      let column = grid.getColumns()[args.cell]
      switch(column.field){
        case 'hitCount': args.item[column.field] = parseInt(args.item[column.field]); break
        case 'lastHit': args.item[column.field] = parseInt(args.item[column.field]); break
      }
      this.dataView.update(DataView.itemToFilter(args.item), args.row)
      if(this.searchGui)
        this.searchGui.filterResults()
    })
    let height = gridDom.height()
    this.dialog.on('dialogresize', (e, ui) => {
      gridDom.css('height', `${height + (ui.size.height - ui.originalSize.height)}px`)
      grid.resizeCanvas()
    })
  }
}
