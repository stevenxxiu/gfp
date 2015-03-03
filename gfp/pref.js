/* global $, GM_addStyle, GM_getResourceText, GM_getResourceURL, GM_registerMenuCommand*/
import Config from 'gfp/config';
import {prefHTML, prefStyle} from 'gfp/resource';

export class Pref {
  constructor(){
    let dialog = null;
    let resourcesAdded = false;
    GM_registerMenuCommand('Google Search Filter +', () => {
      if(!resourcesAdded)
        this.addResources();
      if(dialog)
        return;
      dialog = new PrefDialog().on('dialogclose', () => dialog = null);
    }, null);
  }

  addResources(){
    GM_addStyle(prefStyle);
    GM_addStyle(GM_getResourceText('jquery-ui-css').replace(
      /url\("([^":]+)"\)/g, (match, url) => `url("${GM_getResourceURL('jquery-ui-css/' + url)}")`
    ));
  }
}

class PrefDialog {
  constructor(){
    this.dialog = $(prefHTML).dialog(Object.assign({title: 'Google Search Filter +'}, this.dialogConfig));
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
    $('#gfp-import').click((e) => {
      $('<textarea></textarea>')
        .dialog(Object.assign({
          title: 'Import',
          buttons: [
            {text: 'OK', click(){Config.filtersObject = JSON.parse($(this).val()); $(this).dialog('close');}},
            {text: 'Cancel', click(){$(this).dialog('close');}}
          ],
          create(){setTimeout(() => this.select(), 0);}
        }, this.dialogConfig));
      return false;
    });
  }

  bindExport(){
    $('#gfp-export').click((e) => {
      $('<textarea></textarea>')
        .attr('readonly', 'readonly')
        .val(JSON.stringify(Config.filtersObject, null, 2))
        .dialog(Object.assign({
          title: 'Export',
          buttons: [{text: 'Close', click(){$(this).dialog('close');}}],
          create(){setTimeout(() => {this.focus(); this.setSelectionRange(0, this.value.length, 'backward');}, 0);}
        }, this.dialogConfig));
      return false;
    });
  }

  addGrid(){

  }

  on(){
    return this.dialog.on.apply(this.dialog, arguments);
  }
}
