/* global $, GM_addStyle, GM_getResourceText, GM_getResourceURL, GM_registerMenuCommand*/
import config from 'gfp/config';
import prefStyle from 'gfp/css/pref.css';
import prefHTML from 'gfp/html/pref.html';
import {CombinedMultiMatcher} from 'gfp/matcher';
import {pad} from 'gfp/utils';

class Pref {
  constructor(){
    let dialog = null;
    let resourcesAdded = false;
    GM_registerMenuCommand('Google Search Filter +', () => {
      if(!resourcesAdded)
        this.addResources();
      if(dialog)
        return;
      dialog = new PrefDialog().dialog.on('dialogclose', () => dialog = null);
    }, null);
  }

  addResources(){
    GM_addStyle(prefStyle.toString());
    GM_addStyle(GM_getResourceText('jquery-ui-css').replace(
      /url\("([^":]+)"\)/g, (match, url) => `url("${GM_getResourceURL('jquery-ui-css/' + url)}")`
    ));
    GM_addStyle(GM_getResourceText('jqgrid-css'));
  }
}

class PrefDialog {
  constructor(){
    this.dialog = $(prefHTML).dialog(Object.assign({title: 'Google Search Filter +'}, this.dialogConfig));
    this.grid = this.dialog.find('.grid');
    this.bindImport();
    this.bindExport();
    this.addGrid();
  }

  get dialogConfig(){
    return {
      width: $(window).width()*0.5,
      height: $(window).height()*0.5,
      close(){$(this).remove();}
    };
  }

  bindImport(){
    this.dialog.find('.import').click((e) => {
      $('<textarea></textarea>')
        .dialog(Object.assign({
          title: 'Import',
          buttons: [{
              text: 'OK',
              click(){
                config.filtersObject = JSON.parse($(this).val());
                config.flushFilters();
                config.constructor.call(config);
                $(this).dialog('close');
              }
            }, {text: 'Cancel', click(){$(this).dialog('close');}}
          ],
          create(){setTimeout(() => this.select(), 0);}
        }, this.dialogConfig));
      return false;
    });
  }

  bindExport(){
    this.dialog.find('.export').click((e) => {
      $('<textarea></textarea>')
        .attr('readonly', 'readonly')
        .val(JSON.stringify(config.filtersObject, null, 2))
        .dialog(Object.assign({
          title: 'Export',
          buttons: [{text: 'Close', click(){$(this).dialog('close');}}],
          create(){setTimeout(() => {this.focus(); this.setSelectionRange(0, this.value.length, 'backward');}, 0);}
        }, this.dialogConfig));
      return false;
    });
  }

  addGrid(){
    let data = [];
    for(let filter of config.filters){
      data.push({
        id: filter.text,
        text: filter.text,
        slow: CombinedMultiMatcher.isSlowFilter(filter),
        enabled: !filter.disabled,
        hitCount: filter.hitCount,
        lastHit: filter.lastHit,
      });
    }
    this.grid.jqGrid({
      colNames: ['Filter rule', '!', 'Enabled', 'Hits', 'Last hit'],
      colModel: [
        {name: 'text', width: 10, editable: true},
        {name: 'slow', width: 1, align: 'right'},
        {name: 'enabled', width: 1, align: 'right'},
        {name: 'hitCount', width: 1, align: 'right'},
        {name: 'lastHit', width: 3, align: 'right', formatter: (value, options, rowObject) => {
          let date = new Date(value);
          return rowObject.hitCount > 0 ? (
            `${date.getFullYear()}-${pad(date.getMonth() + 1, 2)}-${pad(date.getDate(), 2)} ` +
            `${pad(date.getHours() + 1, 2)}:${pad(date.getMinutes(), 2)}:${pad(date.getSeconds(), 2)}:` +
            `${pad(date.getMilliseconds(), 3)}`
          ) : '';
        }},
      ],
      data: data,
      datatype: 'local',
      sortname: 'text',
      loadonce: true,
      rowNum: 20,
      scroll: 1,
      autowidth: true,
      forceFit: true,
      gridview: true,
      editCell: true,
    });
    let width = this.dialog.find('.ui-jqgrid').width();
    let height = this.grid.parents('.row').height() - this.dialog.find('.ui-jqgrid-hdiv').height();
    this.grid.jqGrid('setGridHeight', height);
    this.dialog.on('dialogresize', (e, ui) => {
      this.grid.jqGrid('setGridWidth', width + (ui.size.width - ui.originalSize.width));
      this.grid.jqGrid('setGridHeight', height + (ui.size.height - ui.originalSize.height));
    });
  }
}

export default new Pref();
