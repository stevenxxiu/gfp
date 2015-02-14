
/**
base classes
*/

let prefLink={
  createLink: function(linkT){
    //create a link with settings cloned from link template
    let link=document.createElement('a');
    link.setAttribute('class',linkT.getAttribute('class'));
    link.setAttribute('style',linkT.getAttribute('style'));
    link.setAttribute('href','javascript:void(0);');
    link.appendChild(document.createTextNode('Config Filters'));
    link.addEventListener('click',prefLink.prefOpen,false);
    return link;
  },

  createLinkAccount: function(){
    /**
    create a link in the account menu when logged in
    */
    let linkT=document.querySelector('a.gbmlb[href*="/ManageAccount?"]');
    if(!linkT)
      return null;
    let link=prefLink.createLink(linkT);
    let linkParent=linkT.parentNode;
    linkParent.appendChild(document.createTextNode('\u2013'));
    linkParent.appendChild(link);
    return link;
  },

  createLinkSettings: function(){
    /**
    create a link in the gear icon dropdown menu
    */
    let linkTCont=document.querySelector('#ab_options > ul > li.ab_dropdownitem:nth-child(2)');
    if(!linkTCont)
      return null;
    let linkT=linkTCont.firstElementChild;
    let link=prefLink.createLink(linkT);
    let linkCont=linkTCont.cloneNode(false);
    linkCont.appendChild(link);
    linkTCont.parentNode.insertBefore(linkCont,linkTCont.nextElementSibling);
    return link;
  },

  prefOpen: function(){
    if(prefMeta.isUpdated){
      pref.show();
    }else{
      //renderAll resets the gui first if it's already open
      pref.renderAll();
      prefMeta.isUpdated=true;
    }
  },

  init: function(){
    prefLink.createLinkAccount();
    prefLink.createLinkSettings();
    GM_registerMenuCommand('GoogleSearchFilter+',prefLink.prefOpen,null);
  },
}

function draggable(dragButton,dragObj){
	let obj=this;
	this.dragBegin=function(e){
		let dragObj=obj.dragObj;
		if(isNaN(parseInt(dragObj.style.left))) dragObj.style.left='0px';
		if(isNaN(parseInt(dragObj.style.top))) dragObj.style.top='0px';
		let x=parseInt(dragObj.style.left);
		let y=parseInt(dragObj.style.top);
		obj.mouseX=e.clientX;
		obj.mouseY=e.clientY;
		window.addEventListener('mousemove',obj.drag,false);
		window.addEventListener('mouseup',obj.dragEnd,false);
		return false;
	};

	this.drag=function(e){
		let dragObj=obj.dragObj;
		let x=parseInt(dragObj.style.left);
		let y=parseInt(dragObj.style.top);
		dragObj.style.left=x+(e.clientX-obj.mouseX)+'px';
		dragObj.style.top=y+(e.clientY-obj.mouseY)+'px';
		obj.mouseX=e.clientX;
		obj.mouseY=e.clientY;
		return false;
	};

	this.dragEnd=function(){
		window.removeEventListener('mousemove',obj.drag,false);
		window.removeEventListener('mouseup',obj.dragEnd,false);
	};

	this.finalize=function(){
		this.dragButton.removeEventListener('mousedown',this.dragBegin,false);
	};

	dragButton.addEventListener('mousedown',this.dragBegin,false);

	//fields
	this.dragButton=dragButton;
	this.dragObj=dragObj;
	this.mouseX=0;
	this.mouseY=0;
}

/**
attaches draggable and exit functions to a pref modal dialog
*/

let prefModalObjs=[];

function prefModal(prefObj,titleBar,titleExitButton,exitButton,exitFunc){
	if(exitFunc==undefined) exitFunc=new Function();

	function _exitFunc(){
		exitFunc();
		dragObj.finalize();
		titleExitButton.removeEventListener('click',_exitFunc,false);
		exitButton.removeEventListener('click',_exitFunc,false);
		titleExitButton.removeEventListener('mousedown',titleNoDrag,false);
		if(prefModalObjs.length==1){
			window.removeEventListener('keypress',escapeKeyPress,false);
		}
		prefObj.style.display='none';
	}

	function titleNoDrag(e){
		//prevent dragging exit button
		e.preventDefault();
		//prevent dragging prefs using exit button
		e.stopPropagation();
	}

	function escapeKeyPress(e){
		//detect some event simulation which bubbles up to window
		if(e.target!=document.body) return;
		if(e.keyCode==27){
			//close current pref dialog only
			prefModalObjs[prefModalObjs.length-1].exit();
			prefModalObjs.pop();
		}
		e.stopPropagation();
	}

	titleExitButton.addEventListener('click',_exitFunc,false);
	exitButton.addEventListener('click',_exitFunc,false);
	titleExitButton.addEventListener('mousedown',titleNoDrag,false);
	if(prefModalObjs.length==0){
		window.addEventListener('keypress',escapeKeyPress,false);
	}

	//add dragging to titleBar
	let dragObj=new draggable(titleBar,prefObj);
	//display modal dialog
	prefObj.style.display='';
	//fields
	this.exit=_exitFunc;
	//update objects
	prefModalObjs.push(this);
}

/**
preferences
*/

let pref={};

/**
constants
*/

pref.c={
	guiNodeId: 'googleSearchFilterPlus',
	tGuiNodeId: 'tGoogleSearchFilterPlus',
	guiSettings: 'guiSettings',
}

/**
globals
*/

pref.guiObj=null;
pref.tGuiObj=null;

/**
pref settings:
	everything except for individual filters
*/

pref.settings={
	load: function(){
		let res=GM_getValue(pref.c.guiSettings);
		if(res==undefined){
			pref.s={}
			pref.settings.save();
		}else{
			pref.s=JSON.parse(res);
		}
	},

	save: function(){
		GM_setValue(pref.c.guiSettings,JSON.stringify(pref.s));
	},
}

/**
optional function, use when html needs to be loaded dynamically
only called once at init()
*/

pref.loadHTML=function(){

}

/**
main pref gui
*/

pref.gui={
	modalObj: null,

	init: function(){
		pref.gui.modalObj=new prefModal(pref.guiObj,_$('titleBar'),_$('exitButton'),_$('cancelButton'),pref.gui.close);
		pref.gui.load();
		_$('saveButton').addEventListener('click',pref.gui.save,false);
	},

	load: function(){
		let guiObj=pref.guiObj;
		let mouseX=pref.s.mouseX;
		let mouseY=pref.s.mouseY;
		if(!mouseX || !mouseY){
			//default x to middle of page, y to upper half of page
			mouseX=(window.innerWidth-guiObj.clientWidth)/2;
			mouseY=(window.innerHeight-guiObj.clientHeight)/3;
		}
		guiObj.style.left=mouseX+'px';
		guiObj.style.top=mouseY+'px';
	},

	save: function(){
		//grid gui settings are flushed when pref is closed
		pref.grid.grid2filters();
		gfpFilter.save();
	},

	close: function(){
		let guiObj=pref.guiObj;
		pref.s.mouseX=guiObj.offsetLeft;
		pref.s.mouseY=guiObj.offsetTop;
		pref.grid.save();
		pref.settings.save();
		if(!pref.chg.isEmpty()){
			pref.grid.finalize();
		}
	},
}

/**
import/export modal dialog
*/

pref.tGui={
	modalObj: null,

	init: function(titleStr,saveFunc){
		if(pref.tGui.modalObj) return null;
		_$('tTitle').innerHTML=titleStr;
		let modalObj=new prefModal(pref.tGuiObj,_$('tTitleBar'),_$('tExitButton'),_$('tCancelButton'),function(){
			_$('tText').value='';
			_$('tTitle').innerHTML='';
			pref.tGui.modalObj=null;
			saveButton.removeEventListener('click',_saveFunc,false);
		});
		let saveButton=_$('tOkButton');
		function _saveFunc(){
			saveFunc();
			modalObj.exit();
		}
		saveButton.addEventListener('click',_saveFunc,false);
		pref.tGui.modalObj=modalObj;
		pref.tGui.load();
		return modalObj;
	},

	load: function(){
		let tGuiObj=pref.tGuiObj;
		//default x, y to middle of page
		mouseX=(window.innerWidth-tGuiObj.clientWidth)/2;
		mouseY=(window.innerHeight-tGuiObj.clientHeight)/2;
		tGuiObj.style.left=mouseX+'px';
		tGuiObj.style.top=mouseY+'px';
	},
}

/**
tracks and merges filter changes in prefGui
	prefGui can change filters, but knownFilters is only updated after saving
	this is needed so a deep-copy of knownFilters isn't necessary everytime the filter dialog is opened
*/

pref.chg={
	//current filters (added/changed filters)
	filters: {},
	//removed filters
	removed: {},
	//currFilters==knownFilters, used so knownFilters only need to be copied once
	//	when this is true, filters is the changes need to be made to knownFilters to make it current
	//	when this is false, filters is a copy of the current filters
	currIsDelta: true,

	isRemoved: function(keys,len){
		return pref.chg.getRemoved(keys,len)==true;
	},

	getRemoved: function(keys,len){
		/**
		returns removed (does not have to be true/false)
		*/
		if(!len) len=keys.length;
		let removed=pref.chg.removed;
		for(let i=0;i<len;i++){
			removed=removed[keys[i]];
			if(!removed) return null;
		}
		return removed;
	},

	setRemoved: function(keys,len){
		if(!len) len=keys.length;
		len--;
		let removed=pref.chg.removed;
		for(let i=0;i<len;i++){
			if(keys[i] in removed){
				removed=removed[keys[i]];
			}else{
				for(;i<len;i++){
					let tmp={};
					removed[keys[i]]=tmp;
					removed=tmp;
				}
				break;
			}
		}
		removed[keys[len]]=true;
	},

	removeFilters: function(filters,removed){
		for(let key in removed){
			if(removed[key]==true){
				delete filters[key];
			}else if(removed[key]!=undefined){
				pref.chg.removeFilters(filters[key].subfilters,removed[key]);
			}
		}
	},

	removeFilter: function(text){
		/**
		doesn't assume text exists
		*/
		let keys=gfpFilter.getKeys(text);
		if(pref.chg.currIsDelta){
			let ret=gfpFilter.getSubfilter(keys,Filter.knownFilters);
			if(ret){
				pref.chg.setRemoved(keys);
				return ret;
			}else{
				return gfpFilter.popSubfilter(keys,pref.chg.filters);
			}
		}else{
			return gfpFilter.popSubfilter(keys,pref.chg.filters);
		}
	},

	getFilter: function(text){
		/**
		doesn't assume text exists
		*/
		let keys=gfpFilter.getKeys(text);
		if(pref.chg.currIsDelta){
			let ret=gfpFilter.getSubfilter(keys,Filter.knownFilters);
			//check if filter is removed
			if(ret){
				if(!pref.chg.isRemoved(keys)){
					return ret;
				}
			}
			return gfpFilter.getSubfilter(keys,pref.chg.filters);
		}else{
			return gfpFilter.getSubfilter(keys,pref.chg.filters);
		}
	},

	hasFilter: function(text){
		let keys=gfpFilter.getKeys(text);
		let level=gfpFilter.isDuplicate(keys,Filter.knownFilters);
		if(level){
			if(!pref.chg.isRemoved(keys,level)){
				return true;
			}
		}
		return gfpFilter.isDuplicate(keys,pref.chg.filters)>0;
	},

	addFilter: function(filter){
		/**
		args:
			filter: filter text object
		*/
		return gfpFilter.fromObjectCompiled(filter,pref.chg.filters);
	},

	mergeFiltersFlush: function(filters,filtersM,removed){
		pref.chg.removeFilters(filters,removed);
		pref.chg._mergeFiltersFlush(filters,filtersM);
	},

	_mergeFiltersFlush: function(filters,filtersM){
		/**
		merges filters and flushes to filters
		uses pointers from filtersM
		*/
		//faster going through filtersM as this is likely to be smaller
		for(let text in filtersM){
			if(text in filters){
				let filter=filters[text];
				let filterM=filtersM[text];
				if('subfilters' in filterM){
					//can't check if subfilters is empty without a loop
					if('subfilters' in filter){
						//go deeper
						pref.chg._mergeFiltersFlush(filter.subfilters,filterM.subfilters);
					}else{
						//copy to filter
						filter.subfilters=filterM.subfilters;
					}
				}else{
					//filters are not necessarily equal if final subfilter (hitcount, etc.)
					filters[text]=filterM;
				}
			}else{
				filters[text]=filtersM[text];
			}
		}
	},

	mergeFiltersFlushM: function(filters,filtersM,removed){
		/**
		merges filters
		uses pointers from filtersM
		*/
		//javascript doesn't care if the iterator is changed when iterating, so can flush to filtersM directly
		for(let text in filters){
			let rem=removed[text];
			if(rem!=true){
				if(text in filtersM){
					let filter=filters[text];
					let filterM=filtersM[text];
					if('subfilters' in filter){
						if('subfilters' in filterM){
							//will not happen when 'a$$b$$c' --> 'a$$b'
							pref.chg.mergeFiltersFlushM(filter.subfilters,filterM.subfilters,rem||{});
						}
					}
				}else if(rem==undefined){
					filtersM[text]=filters[text];
				}else{
					//clone filter, since it can't be modified
					let filter=gfpFilter.clone(filters[text]);
					filter.subfilters={};
					filtersM[text]=filter;
					pref.chg.mergeFiltersFlushM(filter.subfilters,{},rem);
				}
			}
		}
		return filtersM;
	},

	mergeFilters: function(filters){
		/**
		merges filters with currFilters
		*/
		pref.chg.filters=pref.chg.mergeFiltersFlushM(pref.chg.filters,filters,{});
		return pref.chg.filters;
	},

	flush: function(flush2known){
		/**
		flushes changes (removes filters delta)
		args:
			flush2known: if true, flushes to knownFilters; if false, makes filters a copy of currFilters
		*/
		if(flush2known){
			if(pref.chg.currIsDelta){
				pref.chg.mergeFiltersFlush(Filter.knownFilters,pref.chg.filters,pref.chg.removed);
			}else{
				Filter.knownFilters=pref.chg.filters;
			}
			pref.chg.clear();
			return Filter.knownFilters;
		}else{
			if(pref.chg.currIsDelta){
				pref.chg.mergeFiltersFlushM(Filter.knownFilters,pref.chg.filters,pref.chg.removed);
				pref.chg.currIsDelta=false;
			}
			return pref.chg.filters;
		}
	},

	isEmpty: function(){
		for(let key in pref.chg.filters) return false;
		if(pref.chg.currIsDelta){
			for(let key in pref.chg.removed) return false;
		}
		return true;
	},

	clear: function(){
		pref.chg.filters={};
		pref.chg.removed={};
		pref.chg.currIsDelta=true;
	},

	init: function(filters){
		/**
		initializes filters to filters
		assumes this is not a pointer to knownFilters
		*/
		pref.chg.filters=filters;
		pref.chg.removed={};
		pref.chg.currIsDelta=false;
	},
}

/**
filterGrid
	grid gui, add, import, export, load, save
*/

pref.grid={
	//current row index, used to specify the next inserted row id
	currRowId: 0,
	//editableGrid obj
	editableGrid: null,
	//html of header before render
	headerHTML: null,
	//last td column style node
	lastColumnStyle: [],
	cellWidthSub: null,
	lastCellWidth: 0,

	filterGrid: null,

	load: function(){
		/**
		loads grid gui information: column sort
		this and filters2grid should be independant, since the save button saves the filter settings,
			and doesn't need to save the gui information
		*/
		let editableGrid=pref.grid.editableGrid;
		let sortedColumnName=pref.s.sortedColumnName;
		let sortDescending=pref.s.sortDescending;
		if(sortedColumnName==undefined || sortDescending==undefined){
			sortedColumnName='filter';
			sortDescending=false;
		}
		editableGrid.sortedColumnName=sortedColumnName;
		editableGrid.sortDescending=sortDescending;
		editableGrid.sort();
		editableGrid.columns[0].headerRenderer._render(-1,0,editableGrid.tHead.rows[0].cells[0],editableGrid.columns[0].label);
	},

	save: function(){
		/**
		saves grid gui information
		*/
		let editableGrid=pref.grid.editableGrid;
		pref.s.sortedColumnName=editableGrid.sortedColumnName;
		pref.s.sortDescending=editableGrid.sortDescending;
	},

	grid2filters: function(flush){
		/**
		pref.chg.flush
		defaults flush to true
		*/
		if(flush==undefined) flush=true;
		return pref.chg.flush(flush);
	},

	filters2grid: function(filters){
		/**
		if grid exists: swap gui filters with filters
		else: render new grid from filters
		*/
		let editableGrid=pref.grid.editableGrid;
		if(editableGrid){
			//save grid gui info
			pref.grid.save();
		}
		let filterGridBody=pref.grid.filterGrid.childNodes[3];
		let currRowId=0;
		let rowsHTML='';
		gfpFilter.iterate(filters,function(filter,filterParts){
			rowsHTML+=pref.grid.renderRowHTML(filter,filterParts,currRowId);
			currRowId++;
		});
		filterGridBody.innerHTML=rowsHTML;
		//reset changes
		if(gfpFilter.isPtr(filters)){
			pref.chg.clear();
		}else{
			pref.chg.init(filters);
		}
		pref.grid.currRowId=currRowId;
		//render grid
		pref.grid.gridInit();
	},

	addFilter: function(){
		let editableGrid=pref.grid.editableGrid;
		let currRowId=pref.grid.currRowId;
		pref.grid.addRow(currRowId.toString(),{
			'filter': '',
			'slow': false,
			'enabled': true,
			'hits': 0,
			'action': currRowId.toString(),
		});
		pref.grid.currRowId++;
		let rowIndex=editableGrid.getRowIndex(currRowId);
		let row=editableGrid.getRow(rowIndex);
		//hook isSame to make sure modelChanged always fires
		let o_isSame=editableGrid.isSame;
		editableGrid.isSame=function() false;
		//override modelChanged to get added filter
		let o_modelChanged=editableGrid.modelChanged;
		editableGrid.modelChanged=function(rowIndex,columnIndex,oldValue,newValue,row){
			//create new filter object
			let filterText=newValue;
			if(pref.chg.hasFilter(filterText)){
				alert('Filter already exists');
				pref.grid.removeRow(currRowId);
				//restore isSame
				editableGrid.isSame=o_isSame;
				//restore modelChanged
				editableGrid.modelChanged=o_modelChanged;
				return;
			}
			let filterTextObj={'text':filterText};
			let filter=pref.chg.addFilter(filterTextObj);
			//if filter is empty
			if(filter==null){
				pref.grid.removeRow(currRowId);
				//restore isSame
				editableGrid.isSame=o_isSame;
				//restore modelChanged
				editableGrid.modelChanged=o_modelChanged;
				return;
			}
			//render new filter row
			pref.grid.renderRow(filter,pref.chg.filters,row);
			//re-sort table
			pref.grid.editableGrid.sort();
			row.scrollIntoView(false);
			//restore isSame
			editableGrid.isSame=o_isSame;
			//restore modelChanged
			editableGrid.modelChanged=o_modelChanged;
		};
		//edit filter
		row.scrollIntoView(false);
		editableGrid.columns[0].cellEditor.edit(rowIndex,0,row.childNodes[0],'');
	},

	importFilters: function(){
		pref.tGui.init('Import Filters',function(){
			let newFilters;
			try{
				newFilters=gfpFilter.parseCompiled(_$('tText').value);
			}catch(e){
				alert('Invalid import format');
				return;
			}
			let mergeFilters=confirm('Merge with current filters?');
			if(mergeFilters){
				//merge changes
				pref.grid.grid2filters(false);
				newFilters=pref.chg.mergeFilters(newFilters);
			}else{
				pref.chg.init(newFilters);
			}
			//render new grid
			pref.grid.filters2grid(newFilters);
		});
	},

	exportFilters: function(){
		let res=pref.tGui.init('Export Filters',new Function());
		if(res){
			_$('tText').value=gfpFilter.stringify(pref.grid.grid2filters(false));
		}
	},

	updateLastColumnWidth: function(){
		/**
		adjusts right-most column (header, body) to fill up all space
		*/
		let filterGrid=pref.grid.filterGrid;
		let cellWidthSub;
		if(!pref.grid.cellWidthSub){
			//initialize width for the first time
			let lastHeaderCell=filterGrid.tHead.firstElementChild.lastElementChild;
			//cell border+padding
			let cStyles=window.getComputedStyle(lastHeaderCell,null);
			let cellWidthBP=lastHeaderCell.offsetWidth-lastHeaderCell.clientWidth+parseInt(cStyles.paddingLeft)+parseInt(cStyles.paddingRight);
			cellWidthSub=cellWidthBP+lastHeaderCell.offsetLeft;
			pref.grid.cellWidthSub=cellWidthSub;
			//add last header style
			let style=document.createElement('style');
			style.innerHTML='.gfp .filterGrid>thead>tr>th:last-child {width: '+(filterGrid.tHead.clientWidth-cellWidthSub)+'px;}';
			pref.grid.lastColumnStyle.push(style);
			document.body.appendChild(style);
			//add last cell style
			style=document.createElement('style');
			pref.grid.lastColumnStyle.push(style);
			document.body.appendChild(style);
		}else{
			cellWidthSub=pref.grid.cellWidthSub;
		}
		let lastCellWidth=filterGrid.childNodes[3].clientWidth-cellWidthSub;
		if(lastCellWidth!=pref.grid.lastCellWidth){
			//update last cell style node
			pref.grid.lastColumnStyle[1].innerHTML='.gfp .filterGrid>tbody>tr>td:last-child {width: '+lastCellWidth+'px;}';
			pref.grid.lastCellWidth=lastCellWidth;
		}
	},

	getFilterClass: function(filter){
		if(filter instanceof WhitelistFilter){
			return 'whitelistFilter';
		}else if(filter instanceof InvalidFilter){
			return 'invalidFilter';
		}else if(filter instanceof CommentFilter){
			return 'commentFilter';
		}
	},

	renderRow: function(filter,filters,row){
		/**
		render an existing row
		processes filter to determine if filter is slow
		args:
			filters: filters which contain filter
			row: the row element if exists, renders the element; if not, returns the html
		*/
		let editableGrid=pref.grid.editableGrid;
		let text=(filter.fullText||filter.text);
		let keys=gfpFilter.getKeys(text);
		let isDisabled=(filter.disabled==undefined?false:filter.disabled);
		if(isDisabled){
			row.classList.add('disabledFilter');
		}else{
			row.classList.remove('disabledFilter');
		}
		let className=pref.grid.getFilterClass(filter);
		let rowIndex=row.rowIndex-editableGrid.nbHeaderRows;
		row.childNodes[0].setAttribute('class',className);
		editableGrid.setValueAt(rowIndex,0,text);
		editableGrid.setValueAt(rowIndex,1,gfpFilter.isSlowFilterKeys(keys,filters));
		editableGrid.setValueAt(rowIndex,2,!isDisabled);
		editableGrid.setValueAt(rowIndex,3,filter.hitCount||0);
	},

	renderRowHTML: function(filter,filterParts,rowId){
		/**
		render raw html of row
		args:
			rowId: row's id
		*/
		let rowHTML='';
		let text=(filter.fullText||filter.text);
		let isDisabled=(filter.disabled==undefined?false:filter.disabled);
		if(isDisabled){
			rowHTML+='<tr id="'+rowId.toString()+'" class="disabledFilter">';
		}else{
			rowHTML+='<tr id="'+rowId.toString()+'">';
		}
		let className=pref.grid.getFilterClass(filter);
		if(className){
			rowHTML+='<td class="'+className+'">'+text+'</td>';
		}else{
			rowHTML+='<td>'+text+'</td>';
		}
		rowHTML+='<td>'+gfpFilter.isSlowFilter(filter,filterParts).toString()+'</td>';
		rowHTML+='<td>'+(!isDisabled).toString()+'</td>';
		rowHTML+='<td>'+(filter.hitCount||0).toString()+'</td>';
		rowHTML+='<td>'+rowId.toString()+'</td>';
		rowHTML+='</tr>';
		return rowHTML;
	},

	addRow: function(rowId,data){
		pref.grid.editableGrid.addRow(rowId,data);
		pref.grid.updateLastColumnWidth();
	},

	removeRow: function(rowId){
		pref.grid.editableGrid.removeRow(rowId);
		pref.grid.updateLastColumnWidth();
	},

	removeRowFilter: function(row,rowId){
		let filterText=row.childNodes[0].textContent;
		pref.chg.removeFilter(filterText);
		pref.grid.removeRow(rowId);
	},

	gridInit: function(){
		let filterGrid=pref.grid.filterGrid;
		//check if header is already rendered
		if(pref.grid.headerHTML){
			filterGrid.tHead.innerHTML=pref.grid.headerHTML;
		}else{
			pref.grid.headerHTML=filterGrid.tHead.innerHTML;
		}
		if(pref.grid.editableGrid){
			//unattach previous grid from table
			pref.grid.editableGrid.unattach();
		}
		let editableGrid=new EditableGrid('filterGrid',{
			enableSort: true,
			editmode: 'static',				//static, fixed, absolute
			editorzoneid: 'edition',		//used only if editmode is set to 'fixed'
		});
        editableGrid.sortUpImage.src='bullet_arrow_up.png';
        editableGrid.sortDownImage.src='bullet_arrow_down.png';
		editableGrid.attachToHTMLTable(filterGrid,[
				new Column({name: 'filter',		datatype: 'string'}),
				new Column({name: 'slow',		datatype: 'boolean'}),
				new Column({name: 'enabled',	datatype: 'boolean'}),
				new Column({name: 'hits',		datatype: 'integer'}),
				new Column({name: 'action',		datatype: 'html', editable: false})
		]);
		with(editableGrid){
			setCellRenderer('slow',new CellRenderer({
				render: function(cell,value){
					cell.innerHTML=value?'<img src="slow.png"/>':'';
				}
			}));
			addCellValidator('hits',new CellValidator({
				isValid: function(value){
					return parseInt(value)>=0;
				}
			}));
			//render delete filter column
			setCellRenderer('action',new CellRenderer({render: function(cell,value){
				let node=document.createElement('a');
				node.setAttribute('style','cursor:pointer;');
				node.innerHTML='<img src="delete.png" border="0" alt="Delete filter" title="Delete filter"/>';
				node.addEventListener('click',function(){
					if(confirm('Are you sure you want to delete this filter?')){
						pref.grid.removeRowFilter(cell.parentNode,value);
					}
				},false);
				cell.appendChild(node);
			}}));
			modelChanged=function(rowIndex,columnIndex,oldValue,newValue,row){
				//save filter changes
				//save old filter to copy it's properties
				let o_filter;
				let filterText;
				if(columnIndex==0){
					let o_filterText=oldValue;
					filterText=newValue;
					//check if filterText already exists
					if(pref.chg.hasFilter(filterText) && !gfpFilter.isDuplicateText(o_filterText,filterText)){
						alert('Filter already exists');
						this.setValueAt(rowIndex,columnIndex,oldValue);
						return;
					}
					//remove old filter since filter name has changed
					o_filter=pref.chg.removeFilter(o_filterText);
				}else{
					filterText=row.childNodes[0].textContent;
					o_filter=pref.chg.getFilter(filterText);
				}
				//create new filter object
				let filterTextObj={};
				filterTextObj.text=(o_filter.fullText||o_filter.text);
				filterTextObj.disabled=(o_filter.disabled||false).toString();
				filterTextObj.hitCount=(o_filter.hitCount||0).toString();
				switch(columnIndex){
					case 0: filterTextObj.text=newValue; break;
					case 2: filterTextObj.disabled=(!newValue).toString(); break;
					case 3: filterTextObj.hitCount=newValue.toString(); break;
				}
				let filter=pref.chg.addFilter(filterTextObj);
				//if filter is empty
				if(filter==null){
					pref.grid.removeRow(editableGrid.getRowId(rowIndex));
					return;
				}
				//render new filter row
				pref.grid.renderRow(filter,pref.chg.filters,row);
				if(columnIndex==0){
					//re-sort table
					pref.grid.editableGrid.sort();
					row.scrollIntoView(false);
				}
			};
			renderGrid();
		}
		pref.grid.editableGrid=editableGrid;
		//render first then update, since this might add a previously not present scrollbar
		pref.grid.updateLastColumnWidth();
		pref.grid.load();
	},

	init: function(){
		pref.grid.filterGrid=_$('filterGrid');
		pref.chg.init({});
		pref.grid.filters2grid(Filter.knownFilters);
		_$('addFilterButton').addEventListener('click',pref.grid.addFilter,false);
		_$('importFiltersButton').addEventListener('click',pref.grid.importFilters,false);
		_$('exportFiltersButton').addEventListener('click',pref.grid.exportFilters,false);
	},

	finalize: function(){
		//restore default values
		with(pref.grid){
			currRowId=0;
			editableGrid=null;
			cellWidthSub=null;
			lastCellWidth=0;
		}
		let lastColumnStyle=pref.grid.lastColumnStyle;
		for(let i=0;i<lastColumnStyle.length;i++){
			let style=lastColumnStyle[i];
			style.parentNode.removeChild(style);
		}
		pref.grid.lastColumnStyle=[];
		pref.chg.clear();
		_$('addFilterButton').removeEventListener('click',pref.grid.addFilter,false);
		_$('importFiltersButton').removeEventListener('click',pref.grid.importFilters,false);
		_$('exportFiltersButton').removeEventListener('click',pref.grid.exportFilters,false);
	},
}

/**
init
*/

pref.init=function(){
	pref.loadHTML();
	pref.guiObj=_$(pref.c.guiNodeId);
	pref.tGuiObj=_$(pref.c.tGuiNodeId);
	gfpFilter.compileAll(Filter.knownFilters);
}

pref.renderAll=function(){
	if(pref.grid.editableGrid){
		pref.grid.finalize();
	}else{
		pref.init();
	}
	pref.settings.load();
	pref.gui.init();
	pref.grid.init();
}

pref.show=function(){
	if(pref.grid.editableGrid){
		if(pref.guiObj.style.display!='none') return;
	}else{
		pref.init();
	}
	pref.settings.load();
	pref.gui.init();
	if(!pref.grid.editableGrid){
		pref.grid.init();
	}
}
