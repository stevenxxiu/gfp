/* global $, GM_addStyle, GM_registerMenuCommand, Slick*/
import config from 'gfp/config'
import prefStyle from 'gfp/css/pref.css'
import prefHTML from 'gfp/html/pref.html'
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
    this.dialog = $(prefHTML).dialog(Object.assign({title: 'Google Search Filter +'}, this.dialogConfig))
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
    for(let filter of config.filters){
      data.push({
        text: filter.text,
        slow: CombinedMultiMatcher.isSlowFilter(filter),
        enabled: !filter.disabled,
        hitCount: filter.hitCount,
        lastHit: filter.lastHit,
      })
    }
    let slickGrid = new Slick.Grid(this.grid, data, [
      {id: 'text', field: 'text', name: 'Filter rule', width: 300, sortable: true},
      {id: 'slow', field: 'slow', name: '!', width: 1, sortable: true},
      {id: 'enabled', field: 'enabled', name: 'Enabled', width: 40, sortable: true},
      {id: 'hitCount', field: 'hitCount', name: 'Hits', width: 1, sortable: true}, {
        id: 'lastHit', field: 'lastHit', name: 'Last hit', width: 110, sortable: true,
        formatter: (row, cell, value, columnDef, dataContext) => {
          let date = new Date(value)
          return dataContext.hitCount > 0 ? (
            `${date.getFullYear()}-${pad(date.getMonth() + 1, 2)}-${pad(date.getDate(), 2)} ` +
            `${pad(date.getHours() + 1, 2)}:${pad(date.getMinutes(), 2)}:${pad(date.getSeconds(), 2)}:` +
            `${pad(date.getMilliseconds(), 3)}`
          ) : ''
        },
      },
    ], {
      enableCellNavigation: true,
      enableColumnReorder: false,
      forceFitColumns: true,
    })
    slickGrid.onSort.subscribe((e, args) => {
      let field = args.sortCol.field
      let res = args.sortAsc ? 1 : -1
      data.sort((x, y) => x[field] > y[field] ? res : x[field] < y[field] ? -res : 0)
      slickGrid.invalidateAllRows()
      slickGrid.render()
    })
    let height = this.grid.height()
    this.dialog.on('dialogresize', (e, ui) => {
      this.grid.css('height', `${height + (ui.size.height - ui.originalSize.height)}px`)
      slickGrid.resizeCanvas()
    })
  }
}

export default new Pref()
