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
    this.dialog = $(prefHtml).dialog(Object.assign({
      title: 'Google Search Filter +', 'closeOnEscape': false,
    }, this.dialogConfig))
    this.grid = this.dialog.find('.grid')
    this.bindImport()
    this.bindExport()
    this.addGrid()
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
              config.flushFilters()
              config.constructor.call(config)
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

  addGrid(){
    let data = []
    let dataToFilter = new Map()
    let filterToData = new Map()
    for(let filter of config.filters){
      let entry = {
        text: filter.text,
        slow: CombinedMultiMatcher.isSlowFilter(filter),
        enabled: !filter.disabled,
        hitCount: filter.hitCount,
        lastHit: filter.lastHit,
      }
      data.push(entry)
      dataToFilter.set(filter, entry)
      filterToData.set(entry, filter)
    }
    let grid = new Slick.Grid(this.grid, data, [
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
    function trigger(evt, args, e){
      // adapted from slickgrid source
      e = e || new Slick.EventData()
      args = args || {}
      args.grid = grid
      return evt.notify(args, e, grid)
    }
    grid.onSort.subscribe((e, args) => {
      let field = args.sortCol.field
      let res = args.sortAsc ? 1 : -1
      data.sort((x, y) => x[field] > y[field] ? res : x[field] < y[field] ? -res : 0)
      grid.invalidateAllRows()
      grid.render()
    })
    grid.setSortColumn('text', true)
    trigger(grid.onSort, {sortCol: {field: 'text'}, sortAsc: true})
    grid.onClick.subscribe((e, args) => {
      if($(e.target).is(':checkbox')){
        let column = args.grid.getColumns()[args.cell]
        if(column.editable === false || column.autoEdit === false)
          return
        data[args.row][column.field] = !data[args.row][column.field]
        trigger(grid.onCellChange, {row: args.row, cell: args.cell, item: data[args.row]})
      }
    })
    grid.onValidationError.subscribe((e, args) => {
      alert(args.validationResults.msg)
    })
    grid.onCellChange.subscribe((e, args) => {
      // XXX update filters
      let column = args.grid.getColumns()[args.cell]
      switch(column.field){
        case 'hitCount':
          data[args.row][column.field] = parseInt(data[args.row][column.field])
          break
        case 'lastHit':
          data[args.row][column.field] = parseInt(data[args.row][column.field])
          grid.invalidateRow(args.row)
          grid.render()
          break
      }
    })
    let height = this.grid.height()
    this.dialog.on('dialogresize', (e, ui) => {
      this.grid.css('height', `${height + (ui.size.height - ui.originalSize.height)}px`)
      grid.resizeCanvas()
    })
  }
}

export default new Pref()
