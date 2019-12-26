import $ from 'jquery'
import Slick from 'slickgrid'

import prefHtml from 'gfp/html/pref.html'
import prefStyle from 'gfp/css/pref.sass'
import {Filter} from 'gfp/filter'
import {InvalidFilter} from 'gfp/lib/filterClasses'
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

  constructor(grid, comparer, filterer, searchGui){
    this.grid = grid
    this.comparer = comparer
    this.filterer = filterer
    this.searchGui = searchGui
    this.config = searchGui.config
    this.filters = []
    this._filterObserver = this.filterObserver.bind(this)
    this.config.filters.observe(this._filterObserver)
  }

  destructor(){
    this.config.filters.unobserve(this._filterObserver)
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
    /**
    args:
      call: whether the action comes from pref
    */
    if(this._enterLock)
      return
    this._enterLock = true
    func()
    if(call){
      this.config.flushFilters()
      this.searchGui.filterResults()
    }
    this._enterLock = false
  }

  add(filter, call=true){
    this._editOp(call, () => {
      if(call){
        this.config.filters.add(filter)
      }else{
        if(!this.filterer(filter))
          return
      }
      const i = bisect(this.filters, filter, this.comparer)
      this.filters.splice(i, 0, filter)
      this._render(true, true, true)
      if(call)
        this.grid.scrollRowIntoView(i)
    })
  }

  remove(filters, is, call=true){
    this._editOp(call, () => {
      if(call){
        this.config.filters.remove(is.map((i) => this.filters[i]))
      }else{
        // use unique comparer for speed
        const comparer = (x, y) => x['text'] > y['text'] ? 1 : x['text'] < y['text'] ? -1 : 0
        is = indexOfSorted(this.filters.sort(comparer), filters.sort(comparer), comparer)
        this.filters.sort(this.comparer)
      }
      popMany(this.filters, is)
      this._render(true, true, true)
    })
  }

  addTemp(i){
    this.filters.splice(i, 0, Filter.fromText(''))
    this._render(true, true, true)
  }

  removeTemp(i){
    this.filters.splice(i, 1)
    this._render(true, true, true)
  }

  update(filter, i, call=true){
    this._editOp(call, () => {
      if(call){
        // remove & add since matcher doesn't support updates
        this.config.filters.remove([this.filters[i]])
        this.config.filters.add(filter)
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
    return this.config.filters
  }

  setValue(filters=null, call=true){
    this._editOp(call, () => {
      if(filters === null)
        filters = Array.from(this.config.filters)
      else if(call)
        this.config.filters.setValue(filters)
      this.filters = filters.filter(this.filterer).sort(this.comparer)
      this._render(true, true, true)
    })
  }

  getItem(i){
    return this.constructor.filterToitem(this.filters[i])
  }

  sort(){
    this.filters.sort(this.comparer)
    this._render(true, true, false)
  }

  filter(){
    this.filters = Array.from(this.config.filters).filter(this.filterer).sort(this.comparer)
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
    const self = this
    this.dialog.find('.import').click((_e) => {
      $('<textarea></textarea>')
        .dialog(Object.assign(this.dialogConfig, {
          title: 'Import',
          buttons: [{
            text: 'OK',
            click(){
              const filtersObject = JSON.parse($(this).val())
              const filters = []
              for(const key in filtersObject)
                filters.push(Filter.fromObject(key, filtersObject[key]))
              self.dataView.setValue(filters)
              $(this).dialog('close')
            },
          }, {text: 'Cancel', click(){$(this).dialog('close')}}],
          create(){setTimeout(() => this.select(), 0)},
        }))
      return false
    })
    this.dialog.find('.export').click((_e) => {
      const filtersObject = {}
      for(const filter of this.dataView.getValue())
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
    const gridDom = this.dialog.find('.grid')
    this.dataView = new DataView(null, null, null, this.searchGui)
    const grid = new Slick.Grid(gridDom, this.dataView, [
      {
        id: 'text', field: 'text', name: 'Filter Rule', width: 300, sortable: true,
        formatter: (row, cell, value, _columnDef, _dataContext) =>
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
        id: 'slow', field: 'slow', name: '!', width: 1, sortable: true, cssClass: 'slow-column',
        formatter: (row, cell, value, _columnDef, _dataContext) =>
          value ? '<img class="slow-image"></img>' : '',
      }, {
        id: 'enabled', field: 'enabled', name: 'Enabled', width: 45, sortable: true,
        formatter: (row, cell, value, _columnDef, _dataContext) =>
          `<input type="checkbox" name="" value="${value}" ${value ? 'checked' : ''} />`,
      }, {
        id: 'hitCount', field: 'hitCount', name: 'Hits', width: 1, sortable: true,
        editor: Slick.Editors.Integer, validator: (val) =>
          val < 0 ? {valid: false, msg: 'Must be >= 0'} : {valid: true, msg: null},
      }, {
        id: 'lastHit', field: 'lastHit', name: 'Last Hit', width: 110, sortable: true,
        formatter: (row, cell, value, columnDef, dataContext) => {
          if(!value || dataContext.hitCount == 0)
            return ''
          const date = new Date(value)
          return (
            `${date.getFullYear()}-${pad(date.getMonth() + 1, 2)}-${pad(date.getDate(), 2)} ` +
            `${pad(date.getHours(), 2)}:${pad(date.getMinutes(), 2)}:${pad(date.getSeconds(), 2)}:` +
            `${pad(date.getMilliseconds(), 3)}`
          )
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
    const binaryFilter = ['FfNn-', 'TtYy+']
    window.grid = grid
    const dateFormatter = grid.getColumns()[grid.getColumnIndex('lastHit')].formatter
    this.dataView.filterer = (val) => {
      val = DataView.filterToitem(val)
      for(const key in filterVals){
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
    const findBar = gridDom.find('.slick-headerrow')
    const openFindBar = () => findBar.show().find('input:first').focus()
    const closeFindBar = () => {
      findBar.hide().find('input').val('')
      filterVals = {}
      this.dataView.filter()
      this.dialog.focus()
    }
    grid.onHeaderRowCellRendered.subscribe((e, args) => {
      const searchField = $('<input></input>')
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
        const column = grid.getColumns()[args.cell]
        if(column.editable === false || column.autoEdit === false)
          return
        const item = this.dataView.getItem(args.row)
        item[column.field] = !item[column.field]
        new grid.onCellChange.notify({row: args.row, cell: args.cell, item: item}, new Slick.EventData())
      }
    })
    grid.onValidationError.subscribe((e, args) => alert(args.validationResults.msg))
    grid.onCellChange.subscribe((e, args) => this.dataView.update(DataView.itemToFilter(args.item), args.row))
    gridDom.on('blur', 'input.editor-text', () => Slick.GlobalEditorLock.commitCurrentEdit())
    grid.setSelectionModel(new Slick.RowSelectionModel())

    /* Add & Remove */
    let cancelled = true
    let tempI = null
    grid.onCellChange.subscribe((_e, _args) => cancelled = false)
    grid.onBeforeCellEditorDestroy.subscribe((_e, _args) => {
      if(cancelled && tempI !== null)
        setTimeout(() => {this.dataView.removeTemp(tempI); tempI = null}, 0)
      cancelled = true
    })
    const addFilter = () => {
      const is = grid.getSelectedRows()
      tempI = is[is.length - 1] || 0
      this.dataView.addTemp(tempI)
      grid.gotoCell(tempI, 0, true)
    }
    const removeFilter = () => this.dataView.remove(null, grid.getSelectedRows())
    this.dialog.find('.add').click((_e) => {addFilter(); return false})
    gridDom.keydown((e) => {
      if(e.target.nodeName == 'INPUT')
        return
      switch(e.keyCode){
        case 45: addFilter(); break
        case 46: removeFilter(); break
        case 65:
          if(e.ctrlKey || e.metaKey){
            const rows = []
            for(let i = 0; i < grid.getDataLength(); i++)
              rows.push(i)
            grid.setSelectedRows(rows)
            e.preventDefault()
          }
          break
      }
    })

    /* Initialize grid & dataView */
    grid.init()
    this.dataView.grid = grid
    this.dataView.setValue()

    /* Dialog */
    const height = gridDom.height()
    this.dialog.on('dialogresize', (e, ui) => {
      gridDom.css('height', `${height + (ui.size.height - ui.originalSize.height)}px`)
      grid.resizeCanvas()
    })
  }
}
