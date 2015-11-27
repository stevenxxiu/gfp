/* global $, GM_addStyle, GM_registerMenuCommand, Slick*/
import config from 'gfp/config'
import prefStyle from 'gfp/css/pref.scss'
import prefHtml from 'gfp/html/pref.html'
import {InvalidFilter} from 'gfp/lib/filterClasses'
import {Filter} from 'gfp/filter'
import {CombinedMultiMatcher} from 'gfp/matcher'
import {addStyleResolve, bisect, pad, indexOfSorted, popMany} from 'gfp/utils'

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

  _render(resetSelection, resetRows, resetRowCount){
    if(resetSelection){
      this.grid.resetActiveCell()
      this.grid.setSelectedRows([])
    }
    if(resetRows)
      this.grid.invalidateAllRows()
    if(resetRowCount)
      this.grid.updateRowCount()
    this.grid.render()
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

  add(filter, call=true){
    this._editOp(call, () => {
      if(call){
        config.filters.add(filter)
      }else{
        if(!this.filterer(filter))
          return
      }
      let i = bisect(this.filters, filter, this.comparer)
      this.filters.splice(i, 0, filter)
      this._render(true, true, true)
      if(call)
        this.grid.scrollRowIntoView(i)
    })
  }

  addTemp(filter, i){
    this.filters.splice(i, 0, filter)
    this._render(true, true, true)
  }

  remove(filters, is, call=true){
    this._editOp(call, () => {
      if(call){
        config.filters.remove(is.map((i) => this.filters[i]))
      }else{
        // use unique comparer for speed
        let comparer = (x, y) => x['text'] > y['text'] ? 1 : x['text'] < y['text'] ? -1 : 0
        is = indexOfSorted(this.filters.sort(comparer), filters.sort(comparer), comparer)
        this.filters.sort(this.comparer)
      }
      popMany(this.filters, is)
      this._render(true, true, true)
    })
  }

  update(filter, i, call=true){
    this._editOp(call, () => {
      if(call){
        // remove & add since the subfilter parent references will be different
        config.filters.remove([this.filters[i]])
        config.filters.add(filter)
      }else{
        i = this.filters.indexOf(filter)
        if(i == -1)
          return
      }
      this.filters.splice(i, 1)
      i = bisect(this.filters, filter, this.comparer)
      this.filters.splice(i, 0, filter)
      this._render(false, true, false)
      if(call)
        this.grid.scrollRowIntoView(i)
    })
  }

  getValue(){
    return config.filters
  }

  setValue(filters=null, call=true){
    if(filters === null)
      filters = Array.from(config.filters)
    else if(call)
      config.filters.setValue(filters)
    this.filters = filters.filter(this.filterer).sort(this.comparer)
    this._render(true, true, true)
  }

  getItem(i){
    return this.constructor.filterToitem(this.filters[i])
  }

  sort(){
    this.filters.sort(this.comparer)
    this._render(true, true, false)
  }

  filter(){
    this.filters = Array.from(config.filters).filter(this.filterer).sort(this.comparer)
    this._render(true, true, true)
  }

  filterObserver(type, value){
    switch(type){
      case 'add': this.add(value, false); break
      case 'remove': this.remove([value], null, false); break
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
    this.addImportExport()
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

  addImportExport(){
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
                filters.add(Filter.fromObject(key, filtersObject[key]))
              self.dataView.setValue(filters)
              $(this).dialog('close')
            },
          }, {text: 'Cancel', click(){$(this).dialog('close')}}],
          create(){setTimeout(() => this.select(), 0)},
        }))
      return false
    })
    this.dialog.find('.export').click((_e) => {
      let filtersObject = {}
      for(let filter of this.dataView.getValue())
        filtersObject[filter.text] = filter.toObject()
      $('<textarea></textarea>')
        .attr('readonly', 'readonly')
        .val(JSON.stringify(filtersObject, null, 2))
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
    this.dataView = new DataView(null, null, null)
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
          if(Array.from(this.dataView.getValue()).some((filter) => filter.text == text))
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
        editor: Slick.Editors.Integer, validator: (val) =>
          val < 0 ? {valid: false, msg: 'Must be >= 0'} : {valid: true, msg: null},
      }, {
        id: 'lastHit', field: 'lastHit', name: 'Last hit', width: 110, sortable: true,
        formatter: (row, cell, value, columnDef, dataContext) => {
          let date = new Date(value)
          return dataContext.hitCount > 0 ? (
            `${date.getFullYear()}-${pad(date.getMonth() + 1, 2)}-${pad(date.getDate(), 2)} ` +
            `${pad(date.getHours() + 1, 2)}:${pad(date.getMinutes(), 2)}:${pad(date.getSeconds(), 2)}:` +
            `${pad(date.getMilliseconds(), 3)}`
          ) : ''
        }, editor: Slick.Editors.Integer,
      },
    ], {
      autoEdit: false,
      editable: true,
      enableCellNavigation: true,
      enableColumnReorder: false,
      explicitInitialization: true,
      forceFitColumns: true,
      showHeaderRow: true,
    })

    /* Find bar */
    let filterVals = {}
    let binaryFilter = ['FfNn-', 'TtYy+']
    window.grid = grid
    let dateFormatter = grid.getColumns()[grid.getColumnIndex('lastHit')].formatter
    this.dataView.filterer = (val) => {
      val = DataView.filterToitem(val)
      for(let key in filterVals){
        switch(key){
          case 'text': if(!val[key].includes(filterVals[key])) return false; break
          case 'slow': if(!binaryFilter[+val[key]].includes(filterVals[key])) return false; break
          case 'enabled': if(!binaryFilter[+val[key]].includes(filterVals[key])) return false; break
          case 'hitCount': if(!val[key].toString().includes(filterVals[key])) return false; break
          case 'lastHit': if(!dateFormatter(null, null, val[key], null, val).includes(filterVals[key]))
            return false; break
        }
      }
      return true
    }
    let findBar = gridDom.find('.slick-headerrow')
    let openFindBar = () => findBar.show().find('input:first').focus()
    let closeFindBar = () => {
      findBar.hide().find('input').val('')
      filterVals = {}
      this.dataView.filter()
      this.dialog.focus()
    }
    grid.onHeaderRowCellRendered.subscribe((e, args) => {
      let searchField = $('<input></input>')
        .keydown((e) => {if(e.keyCode == 27) closeFindBar()})
        .on('input', (_e) => {filterVals[args.column.field] = searchField.val(); this.dataView.filter()})
      $(args.node).empty().append(searchField)
    })
    findBar.hide()
    this.dialog.attr('tabindex', 1)
    this.dialog.keydown((e) => {if((e.ctrlKey || e.metaKey) && e.keyCode == 70){openFindBar(); e.preventDefault()}})

    /* Sorting */
    let [sortField, sortRes] = ['text', 1]
    this.dataView.comparer = (x, y) =>
      x[sortField] > y[sortField] ? sortRes : x[sortField] < y[sortField] ? -sortRes : 0
    grid.setSortColumn(sortField, !!sortRes)
    grid.onSort.subscribe((e, args) => {
      [sortField, sortRes] = [args.sortCol.field, args.sortAsc ? 1 : -1]
      this.dataView.sort()
    })

    /* Editing */
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
      this.dataView.update(DataView.itemToFilter(args.item), args.row)
      if(this.searchGui)
        this.searchGui.filterResults()
    })
    grid.setSelectionModel(new Slick.RowSelectionModel())
    this.dialog.keydown((e) => {if(e.keyCode == 46) this.dataView.remove(null, grid.getSelectedRows())})

    /* Initialize grid & dataView */
    grid.init()
    this.dataView.grid = grid
    this.dataView.setValue()

    /* Dialog */
    let height = gridDom.height()
    this.dialog.on('dialogresize', (e, ui) => {
      gridDom.css('height', `${height + (ui.size.height - ui.originalSize.height)}px`)
      grid.resizeCanvas()
    })
  }
}
