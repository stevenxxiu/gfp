/*
 * EditableGrid.js
 * 
 * Copyright 2010 Webismymind SPRL
 *
 * This file is part of EditableGrid.
 * 
 * EditableGrid is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or 
 * any later version.
 * 
 * EditableGrid is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with EditableGrid. If not, see http://www.gnu.org/licenses.
 * 
 */

if (typeof _$ == 'undefined') {
	function _$(elementId) { return document.getElementById(elementId); }
}

/**
 * Creates a new column
 * @constructor
 * @class Represents a column in the editable grid
 * @param {Object} config
 */
function Column(config)
{
	// default properties
    var props = {
        name: "",
        label: "",
		editable: true,
		renderable: true,
        datatype: "string",
        unit: null,
        precision: null,
        nansymbol: '',
        bar: true, // is the column to be displayed in a bar chart ? relevant only for numerical columns 
        headerRenderer: null,
        headerEditor: null,
        cellRenderer: null,
		cellEditor: null,
		cellValidators: [],
		enumProvider: null,
		optionValues: null,
        columnIndex: -1
    };

    // override default properties with the ones given
    for (var p in props) this[p] = (typeof config == 'undefined' || typeof config[p] == 'undefined') ? props[p] : config[p];
}

Column.prototype.getOptionValuesForRender = function(rowIndex) { 
	var values = this.enumProvider.getOptionValuesForRender(this.editablegrid, this, rowIndex);
	return values ? values : this.optionValues;
};

Column.prototype.getOptionValuesForEdit = function(rowIndex) { 
	var values = this.enumProvider.getOptionValuesForEdit(this.editablegrid, this, rowIndex);
	return values ? values : this.optionValues;
};

Column.prototype.isValid = function(value) {
	for (var i = 0; i < this.cellValidators.length; i++) if (!this.cellValidators[i].isValid(value)) return false;
	return true;
};

Column.prototype.isNumerical = function() {
	return this.datatype =='double' || this.datatype =='integer';
};

/**
 * Creates a new enumeration provider 
 * @constructor
 * @class Base class for all enumeration providers
 * @param {Object} config
 */
function EnumProvider(config)
{
	// default properties
    this.getOptionValuesForRender = function(grid, column, rowIndex) { return null; };
    this.getOptionValuesForEdit = function(grid, column, rowIndex) { return null; };

    // override default properties with the ones given
    for (var p in config) this[p] = config[p];
}

/**
 * Creates a new EditableGrid.
 * <p>You can specify here some configuration options (optional).
 * <br/>You can also set these same configuration options afterwards.
 * <p>These options are:
 * <ul>
 * <li>enableSort: enable sorting when clicking on column headers (default=true)</li>
 * <li>doubleclick: use double click to edit cells (default=false)</li>
 * <li>editmode: can be one of
 * <ul>
 * 		<li>absolute: cell editor comes over the cell (default)</li>
 * 		<li>static: cell editor comes inside the cell</li>
 * 		<li>fixed: cell editor comes in an external div</li>
 * </ul>
 * </li>
 * <li>editorzoneid: used only when editmode is set to fixed, it is the id of the div to use for cell editors</li>
 * <li>allowSimultaneousEdition: tells if several cells can be edited at the same time (default=false)<br/>
 * Warning: on some Linux browsers (eg. Epiphany), a blur event is sent when the user clicks on a 'select' input to expand it.
 * So practically, in these browsers you should set allowSimultaneousEdition to true if you want to use columns with option values and/or enum providers.
 * This also used to happen in older versions of Google Chrome Linux but it has been fixed, so upgrade if needed.</li>
 * <li>invalidClassName: CSS class to apply to text fields when the entered value is invalid (default="invalid")</li>
 * <li>ignoreLastRow: ignore last row when sorting and charting the data (typically for a 'total' row)</li>
 * <li>caption: text to use as the grid's caption</li>
 * </ul>
 * @constructor
 * @class EditableGrid
 */
function EditableGrid(name, config)
{
	if (typeof name != "string" || typeof config != "object") {
		alert("The EditableGrid constructor takes two arguments:\n- name (string)\n- config (object)\n\nGot instead " + (typeof name) + " and " + (typeof config) + ".");
	};
	
	// default properties
    var props = 
    {
   		enableSort: true,
		doubleclick: false,
        editmode: "absolute",
        editorzoneid: "",
		allowSimultaneousEdition: false,
		saveOnBlur: true,
   		invalidClassName: "invalid",
   		ignoreLastRow: false, // ignore last row for sorting and pie/bar charts
   		caption: null    
    };
    
	// override default properties with the ones given
	for (var p in props) this[p] = props[p];
	for (var p in config) this[p] = config[p];
    
    this.Browser = {
    		IE:  !!(window.attachEvent && navigator.userAgent.indexOf('Opera') === -1),
    		Opera: navigator.userAgent.indexOf('Opera') > -1,
    		WebKit: navigator.userAgent.indexOf('AppleWebKit/') > -1,
    		Gecko: navigator.userAgent.indexOf('Gecko') > -1 && navigator.userAgent.indexOf('KHTML') === -1,
    		MobileSafari: !!navigator.userAgent.match(/Apple.*Mobile.*Safari/)
    };
    
    // private data
    this.name = name;
    this.columns = [];
    this.data = [];
    this.xmlDoc = null;
    this.sortedColumnName = -1;
    this.sortDescending = false;
    this.baseUrl = this.detectDir();
    this.nbHeaderRows = 1;
    this.lastSelectedRowIndex = -1;
    
    if (this.enableSort) {
    	this.sortUpImage = new Image();
    	this.sortUpImage.src = this.baseUrl + "/images/bullet_arrow_up.png";
    	this.sortDownImage = new Image();
    	this.sortDownImage.src = this.baseUrl + "/images/bullet_arrow_down.png";
    }
	
	var _this=this;
	//sets new mouseClickedWrapper for each individual grid object
	if(!this.mouseClickedWrapper) this.mouseClickedWrapper=function(e){ _this.mouseClicked(e); };
}

/**
 * Callback functions
 */

EditableGrid.prototype.tableLoaded = function() {};
EditableGrid.prototype.chartRendered = function() {};
EditableGrid.prototype.tableRendered = function(containerid, className, tableid) {};
EditableGrid.prototype.tableSorted = function() {};
EditableGrid.prototype.tableFiltered = function() {};
EditableGrid.prototype.modelChanged = function(rowIndex, columnIndex, oldValue, newValue, row) {};
EditableGrid.prototype.rowSelected = function(oldRowIndex, newRowIndex) {};
EditableGrid.prototype.isHeaderEditable = function(rowIndex, columnIndex) { return false; };
EditableGrid.prototype.isEditable =function(rowIndex, columnIndex) { return true; };
EditableGrid.prototype.readonlyWarning = function() {};

/**
 * Load metadata and data from an XML url
 */
EditableGrid.prototype.loadXML = function(url)
{
	// we use a trick to avoid getting an old version from the browser's cache
	var orig_url = url;
	var sep = url.indexOf('?') >= 0 ? '&' : '?'; 
	url += sep + Math.floor(Math.random() * 100000);
		
    with (this) {
    	
    	// IE
        if (window.ActiveXObject) 
        {
            xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
            xmlDoc.addEventListener('readystatechange', function() {
                if (xmlDoc.readyState == 4) {
                    processXML();
                    tableLoaded();
                }
            }, false);
            xmlDoc.load(url);
        }
        
        // Safari
        else if (/*Browser.WebKit && */ window.XMLHttpRequest) 
        {
           	xmlDoc = new XMLHttpRequest();
           	xmlDoc.addEventListener('readystatechange', function () {
           		if (xmlDoc.readyState == 4) {
       				xmlDoc = xmlDoc.responseXML;
       				if (!xmlDoc) { /* alert("Could not load XML from url '" + orig_url + "'"); */ return false; }
       				processXML();
       				tableLoaded();
       			}
       		}, false);
           	xmlDoc.open("GET", url, true);
           	xmlDoc.send("");
        }
        
        // Firefox (and other browsers) 
        else if (document.implementation && document.implementation.createDocument) 
        {
        	xmlDoc = document.implementation.createDocument("", "", null);
        	xmlDoc.addEventListener('load', function() {
        		processXML();
                tableLoaded();
        	}, false);
            xmlDoc.load(url);
        }
        
        // should never happen
        else { 
        	alert("Cannot load XML file with this browser!"); 
        	return false;
        }
    
        return true;
    }
};

/**
 * Process the XML content
 * @private
 */
EditableGrid.prototype.processXML = function()
{
	with (this) {
    	
		// clear model and pointer to current table
	    this.columns = [];
	    this.data = [];
		this.table = null;

        // load metadata (only one tag <metadata> --> metadata[0])
        var metadata = xmlDoc.getElementsByTagName("metadata");
        if (!metadata || metadata.length < 1) return false;
        var columnDeclarations = metadata[0].getElementsByTagName("column");
        for (var i = 0; i < columnDeclarations.length; i++) {
        	
        	// get column type
            var col = columnDeclarations[i];
            var datatype = col.getAttribute("datatype");

            // get enumerated values if any
        	var optionValues = null;
            var enumValues = col.getElementsByTagName("values");
            if (enumValues.length > 0) {
            	optionValues = {};
                enumValues = enumValues[0].getElementsByTagName("value");
                for (var v = 0; v < enumValues.length; v++) {
                	optionValues[enumValues[v].getAttribute("value")] = enumValues[v].firstChild ? enumValues[v].firstChild.nodeValue : "";
                }
            }

            // create new column           
            var column = new Column({
            	name: col.getAttribute("name"),
            	label: typeof col.getAttribute("label") == 'string' ? col.getAttribute("label") : col.getAttribute("name"),
            	datatype: col.getAttribute("datatype") ? col.getAttribute("datatype") : "string",
                editable : col.getAttribute("editable") == "true",
                bar : col.getAttribute("bar") ? col.getAttribute("bar") == "true" : true,
            	optionValues: optionValues,
            	enumProvider: (optionValues ? new EnumProvider() : null),
            	columnIndex: i
            });

            // parse column type
            parseColumnType(column);

			// create suited cell renderer
            _createCellRenderer(column);
			_createHeaderRenderer(column);
			
			// create suited cell editor
            _createCellEditor(column);  
			_createHeaderEditor(column);

			// add default cell validators based on the column type
			_addDefaultCellValidators(column);

            // add column
			column.editablegrid = this;
            columns.push(column);
        }
        
        // load content
        var rows = xmlDoc.getElementsByTagName("row");
        for (var i = 0; i < rows.length; i++) 
        {
        	// get all defined cell values
            var cellValues = {};
            var cols = rows[i].getElementsByTagName("column");
            for (var j = 0; j < cols.length; j++) {
            	var colname = cols[j].getAttribute("name");
            	if (!colname) {
            		if (j >= columns.length) alert("You defined too many columns for row " + (i+1));
            		else colname = columns[j].name; 
            	}
            	cellValues[colname] = cols[j].firstChild ? cols[j].firstChild.nodeValue : "";
            }

            // for each row we keep the orginal index, the id and all other attributes that may have been set in the XML
            var rowData = { originalIndex: i, id: rows[i].getAttribute("id") ? rows[i].getAttribute("id") : "" };  
            for (var attrIndex = 0; attrIndex < rows[i].attributes.length; attrIndex++) {
            	var node = rows[i].attributes.item(attrIndex);
            	if (node.nodeName != "id") rowData[node.nodeName] = node.nodeValue; 
            }

            // get column values for this rows
            rowData.columns = [];
            for (var c = 0; c < columns.length; c++) {
            	var cellValue = columns[c].name in cellValues ? cellValues[columns[c].name] : "";
            	rowData.columns.push(getTypedValue(c, cellValue));
            }
            
            // add row data in our model
       		data.push(rowData);
        }
    }
};

/**
 * Parse column type
 * @private
 */

EditableGrid.prototype.parseColumnType = function(column)
{
    // extract precision, unit and nansymbol from type if two given
    if (column.datatype.match(/(.*)\((.*),(.*),(.*)\)$/)) {
    	column.datatype = RegExp.$1;
    	column.unit = RegExp.$2.trim();
    	column.precision = parseInt(RegExp.$3);
    	column.nansymbol = RegExp.$4.trim();
    }

    // extract precision and unit from type if two given
    if (column.datatype.match(/(.*)\((.*),(.*)\)$/)) {
    	column.datatype = RegExp.$1.trim();
    	column.unit = RegExp.$2.trim();
    	column.precision = parseInt(RegExp.$3);
    }

    // extract precision or unit from type if any given
    if (column.datatype.match(/(.*)\((.*)\)$/)) {
    	column.datatype = RegExp.$1.trim();
    	var unit_or_precision = RegExp.$2.trim();
    	if (unit_or_precision.match(/^[0-9]*$/)) column.precision = parseInt(unit_or_precision);
    	else column.unit = unit_or_precision;
    }
    
    if (isNaN(column.precision)) column.precision = null;
    if (column.unit == '') column.unit = null;
    if (column.nansymbol == '') column.nansymbol = null;
};

/**
 * Get typed value
 * @private
 */

EditableGrid.prototype.getTypedValue = function(columnIndex, cellValue) 
{
	var colType = this.getColumnType(columnIndex);
	if (colType == 'boolean') cellValue = (cellValue && cellValue != 0 && cellValue != "false") ? true : false;
	if (colType == 'integer') { cellValue = parseInt(cellValue); } 
	if (colType == 'double') { cellValue = parseFloat(cellValue); }
	if (colType == 'string') { cellValue = "" + cellValue; }
	return cellValue;
};

/**
 * Attach to an existing HTML table, using given column definitions
 */
EditableGrid.prototype.attachToHTMLTable = function(_table, _columns)
{
    with (this) {

    	// we have our new columns
        columns = _columns;
        for (var c = 0; c < columns.length; c++) {
        	
        	// set column index and back pointer
        	var column = columns[c];
			column.editablegrid = this;
        	column.columnIndex = c;

            // parse column type
            parseColumnType(column);

			// create suited enum provider, renderer and editor if none given
        	if (!column.enumProvider) column.enumProvider = column.optionValues ? new EnumProvider() : null;
            if (!column.cellRenderer) _createCellRenderer(column);
            if (!column.headerRenderer) _createHeaderRenderer(column);
            if (!column.cellEditor) _createCellEditor(column);  
            if (!column.headerEditor) _createHeaderEditor(column);

			// add default cell validators based on the column type
			_addDefaultCellValidators(column);
        }

        // get pointers to table components
        this.table = _table;
        this.tHead = _table.tHead;
        this.tBody = _table.tBodies[0];
        
        // create table body if needed
        if (!tBody) {
        	tBody = document.createElement("TBODY");
        	table.insertBefore(tBody, table.firstChild);
        }

        // create table header if needed
        if (!tHead) {
        	tHead = document.createElement("THEAD");
        	table.insertBefore(tHead, tBody);
        }

        // if header is empty use first body row as header
        if (tHead.rows.length == 0 && tBody.rows.length > 0) 
        	tHead.appendChild(tBody.rows[0]);

        // check that header has exactly one row
        this.nbHeaderRows = tHead.rows.length;
        /*if (tHead.rows.length != 1) {
        	alert("You table header must have exactly row!");
        	return false;
        }*/

        // load header labels
       	var rows = tHead.rows;
       	for (var i = 0; i < rows.length; i++) {
       		var cols = rows[i].cells;
       		var columnIndexInModel = 0;
       		for (var j = 0; j < cols.length && columnIndexInModel < columns.length; j++) {
       			if (!columns[columnIndexInModel].label) columns[columnIndexInModel].label = cols[j].innerHTML;
       			var colspan = parseInt(cols[j].getAttribute("colspan"));
       			columnIndexInModel += colspan > 1 ? colspan : 1;
       		}
       	}

        // load content
        var rows = tBody.rows;
        for (var i = 0; i < rows.length; i++) {
            var rowData = [];
            var cols = rows[i].cells;
            for (var j = 0; j < cols.length && j < columns.length; j++) rowData.push(this.getTypedValue(j, cols[j].innerHTML));
       		data.push({originalIndex: i, id: rows[i].id, columns: rowData});
       		rows[i].id = this.name + '_' + rows[i].id;
        }
    }
};

/**
 * Creates a suitable cell renderer for the column
 * @private
 */
EditableGrid.prototype._createCellRenderer = function(column)
{
	column.cellRenderer = 
		column.enumProvider ? new EnumCellRenderer() :
		column.datatype == "integer" || column.datatype == "double" ? new NumberCellRenderer() :
    	column.datatype == "boolean" ? new CheckboxCellRenderer() : 
    	column.datatype == "email" ? new EmailCellRenderer() : 
        column.datatype == "website" || column.datatype == "url" ? new WebsiteCellRenderer() : 
        column.datatype == "date" ? new DateCellRenderer() : 
    	new CellRenderer();

	// give access to the column from the cell renderer
	if (column.cellRenderer) {
		column.cellRenderer.editablegrid = this;
		column.cellRenderer.column = column;
	}
};

/**
 * Creates a suitable header cell renderer for the column
 * @private
 */
EditableGrid.prototype._createHeaderRenderer = function(column)
{
	column.headerRenderer = (this.enableSort && column.datatype != "html") ? new SortHeaderRenderer(column.name) : new CellRenderer();

	// give access to the column from the header cell renderer
	if (column.headerRenderer) {
		column.headerRenderer.editablegrid = this;
		column.headerRenderer.column = column;
	}		
};

/**
 * Creates a suitable cell editor for the column
 * @private
 */
EditableGrid.prototype._createCellEditor = function(column)
{
	column.cellEditor = 
		column.enumProvider ? new SelectCellEditor() :
		column.datatype == "integer" || column.datatype == "double" ? new NumberCellEditor(column.datatype) :
		column.datatype == "boolean" ? null :
		column.datatype == "email" ? new TextCellEditor(column.precision) :
		column.datatype == "website" || column.datatype == "url" ? new TextCellEditor(column.precision) :
		column.datatype == "date" ? new TextCellEditor(column.precision, 10) :
		new TextCellEditor(column.precision);  
		
	// give access to the column from the cell editor
	if (column.cellEditor) {
		column.cellEditor.editablegrid = this;
		column.cellEditor.column = column;
	}
};

/**
 * Creates a suitable header cell editor for the column
 * @private
 */
EditableGrid.prototype._createHeaderEditor = function(column)
{
	column.headerEditor =  new TextCellEditor();  
		
	// give access to the column from the cell editor
	if (column.headerEditor) {
		column.headerEditor.editablegrid = this;
		column.headerEditor.column = column;
	}
};

/**
 * Returns the number of rows
 */
EditableGrid.prototype.getRowCount = function()
{
	return this.data.length;
};

/**
 * Returns the number of columns
 */
EditableGrid.prototype.getColumnCount = function()
{
	return this.columns.length;
};

/**
 * Returns the column
 * @param {Object} columnIndexOrName index or name of the column
 */
EditableGrid.prototype.getColumn = function(columnIndexOrName)
{
	var colIndex = this.getColumnIndex(columnIndexOrName);
	if (colIndex < 0) { alert("[getColumn] Column not found with index or name " + columnIndexOrName); return null; }
	return this.columns[colIndex];
};

/**
 * Returns the name of a column
 * @param {Object} columnIndexOrName index or name of the column
 */
EditableGrid.prototype.getColumnName = function(columnIndexOrName)
{
	return this.getColumn(columnIndexOrName).name;
};

/**
 * Returns the label of a column
 * @param {Object} columnIndexOrName index or name of the column
 */
EditableGrid.prototype.getColumnLabel = function(columnIndexOrName)
{
	return this.getColumn(columnIndexOrName).label;
};

/**
 * Returns the type of a column
 * @param {Object} columnIndexOrName index or name of the column
 */
EditableGrid.prototype.getColumnType = function(columnIndexOrName)
{
	return this.getColumn(columnIndexOrName).datatype;
};

/**
 * Returns the unit of a column
 * @param {Object} columnIndexOrName index or name of the column
 */
EditableGrid.prototype.getColumnUnit = function(columnIndexOrName)
{
	return this.getColumn(columnIndexOrName).unit;
};

/**
 * Returns the precision of a column
 * @param {Object} columnIndexOrName index or name of the column
 */
EditableGrid.prototype.getColumnPrecision = function(columnIndexOrName)
{
	return this.getColumn(columnIndexOrName).precision;
};

/**
 * Returns true if the column is to be displayed in a bar chart
 * @param {Object} columnIndexOrName index or name of the column
 */
EditableGrid.prototype.isColumnBar = function(columnIndexOrName)
{
	var column = this.getColumn(columnIndexOrName);
	return (column.bar && column.isNumerical());
};

/**
 * Returns true if the column is numerical (double or integer)
 * @param {Object} columnIndexOrName index or name of the column
 */
EditableGrid.prototype.isColumnNumerical = function(columnIndexOrName)
{
	var column = this.getColumn(columnIndexOrName);
	return column.isNumerical();;
};

/**
 * Returns the value at the specified index
 * @param {Integer} rowIndex
 * @param {Integer} columnIndex
 */
EditableGrid.prototype.getValueAt = function(rowIndex, columnIndex)
{
	// check and get column
	if (columnIndex < 0 || columnIndex >= this.columns.length) { alert("[getValueAt] Invalid column index " + columnIndex); return null; }
	var column = this.columns[columnIndex];
	
	// get value in model
	if (rowIndex < 0) return column.label;
	
	var rowData = this.data[rowIndex]['columns'];
	return rowData ? rowData[columnIndex] : null;
};

/**
 * Sets the value at the specified index
 * @param {Integer} rowIndex
 * @param {Integer} columnIndex
 * @param {Object} value
 * @param {Boolean} render
 */
EditableGrid.prototype.setValueAt = function(rowIndex, columnIndex, value, render)
{
	if (typeof render == "undefined") render = true;
	var previousValue = null;;
	
	// check and get column
	if (columnIndex < 0 || columnIndex >= this.columns.length) { alert("[setValueAt] Invalid column index " + columnIndex); return null; }
	var column = this.columns[columnIndex];
	
	// set new value in model
	if (rowIndex < 0) {
		previousValue = column.label;
		column.label = value;
	}
	else {
		var rowData = this.data[rowIndex]['columns'];
		previousValue = rowData[columnIndex];
		if (rowData) rowData[columnIndex] = this.getTypedValue(columnIndex, value);
	}
	
	// render new value
	if (render) {
		var renderer = rowIndex < 0 ? column.headerRenderer : column.cellRenderer;  
		renderer._render(rowIndex, columnIndex, this.getCell(rowIndex, columnIndex), value);
	}
	
	return previousValue;
};

/**
 * Find column index from its name
 * @param {Object} columnIndexOrName index or name of the column
 */
EditableGrid.prototype.getColumnIndex = function(columnIndexOrName)
{
	if (typeof columnIndexOrName == "undefined" || columnIndexOrName === "") return -1;
	
	// TODO: problem because the name of a column could be a valid index, and we cannot make the distinction here!
	
	// if columnIndexOrName is a number which is a valid index return it
	if (!isNaN(columnIndexOrName) && columnIndexOrName >= 0 && columnIndexOrName < this.columns.length) return columnIndexOrName;
	
	// otherwise search for the name
	for (var c = 0; c < this.columns.length; c++) if (this.columns[c].name == columnIndexOrName) return c;

	return -1;
};

/**
 * Get row object at given index
 * @param {Integer} index of the row
 */
EditableGrid.prototype.getRow = function(rowIndex)
{
	if (rowIndex < 0) return this.tHead.rows[rowIndex + this.nbHeaderRows];
	return this.tBody.rows[rowIndex];
};

/**
 * Get row id specified in XML or HTML
 * @param {Integer} index of the row
 */
EditableGrid.prototype.getRowId = function(rowIndex)
{
	return (rowIndex < 0 || rowIndex >= this.data.length) ? null : this.data[rowIndex]['id'];
};

/**
 * Get custom row attribute specified in XML
 * @param {Integer} index of the row
 * @param {String} name of the attribute
 */
EditableGrid.prototype.getRowAttribute = function(rowIndex, attributeName)
{
	return this.data[rowIndex][attributeName];
};

/**
 * Set custom row attribute
 * @param {Integer} index of the row
 * @param {String} name of the attribute
 * @param value of the attribute
 */
EditableGrid.prototype.setRowAttribute = function(rowIndex, attributeName, attributeValue)
{
	this.data[rowIndex][attributeName] = attributeValue;
};

/**
 * Remove row with given id
 * @param {Integer} rowId
 */
EditableGrid.prototype.removeRow = function(rowId)
{
	var tr = _$(this.name + "_" + rowId);
	var rowIndex = tr.rowIndex - this.nbHeaderRows; // remove header rows
	this.tBody.removeChild(tr);
	this.data.splice(rowIndex, 1);
};

/**
 * Get index of row with given id
 * @param {Integer} rowId or row object
 */
EditableGrid.prototype.getRowIndex = function(rowId) 
{
	var tr = typeof rowId == 'object' ? rowId : _$(this.name + "_" + rowId);
	return tr ? tr.rowIndex - this.nbHeaderRows : -1; // remove header rows
};

/**
 * Add row with given id and data
 * @param {Integer} rowId
 * @param {Integer} columns
 * @param {Boolean} dontSort
 */
EditableGrid.prototype.addRow = function(rowId, cellValues, dontSort)
{
	with (this) {
		
		// add row in data
		var rowData = [];
        for (var c = 0; c < columns.length; c++) {
        	var cellValue = columns[c].name in cellValues ? cellValues[columns[c].name] : "";
        	rowData.push(getTypedValue(c, cellValue));
        }
		var rowIndex = data.length;
		data.push({originalIndex: rowIndex, id: rowId, columns: rowData});
		
		// create row in table and render content
		var tr = tBody.insertRow(rowIndex);
		tr.id = this.name + "_" + rowId;
		for (var c = 0; c < columns.length; c++) {
			var td = tr.insertCell(c);
			columns[c].cellRenderer._render(rowIndex, c, td, getValueAt(rowIndex,c));
		}

		// resort table
		if (!dontSort) sort();
	}
};

/**
 * Sets the column header cell renderer for the specified column index
 * @param {Object} columnIndexOrName index or name of the column
 * @param {CellRenderer} cellRenderer
 */
EditableGrid.prototype.setHeaderRenderer = function(columnIndexOrName, cellRenderer)
{
	var columnIndex = this.getColumnIndex(columnIndexOrName);
	if (columnIndex < 0) alert("[setHedareRenderer] Invalid column: " + columnIndexOrName);
	else {
		var column = this.columns[columnIndex];
		column.headerRenderer = (this.enableSort && column.datatype != "html") ? new SortHeaderRenderer(column.name, cellRenderer) : cellRenderer;

		// give access to the column from the cell renderer
		if (cellRenderer) {
			if (this.enableSort && column.datatype != "html") {
				column.headerRenderer.editablegrid = this;
				column.headerRenderer.column = column;
			}
			cellRenderer.editablegrid = this;
			cellRenderer.column = column;
		}
	}
};

/**
 * Sets the cell renderer for the specified column index
 * @param {Object} columnIndexOrName index or name of the column
 * @param {CellRenderer} cellRenderer
 */
EditableGrid.prototype.setCellRenderer = function(columnIndexOrName, cellRenderer)
{
	var columnIndex = this.getColumnIndex(columnIndexOrName);
	if (columnIndex < 0) alert("[setCellRenderer] Invalid column: " + columnIndexOrName);
	else {
		var column = this.columns[columnIndex];
		column.cellRenderer = cellRenderer;
	
		// give access to the column from the cell renderer
		if (cellRenderer) {
			cellRenderer.editablegrid = this;
			cellRenderer.column = column;
		}
	}
};

/**
 * Sets the cell editor for the specified column index
 * @param {Object} columnIndexOrName index or name of the column
 * @param {CellEditor} cellEditor
 */
EditableGrid.prototype.setCellEditor = function(columnIndexOrName, cellEditor)
{
	var columnIndex = this.getColumnIndex(columnIndexOrName);
	if (columnIndex < 0) alert("[setCellEditor] Invalid column: " + columnIndexOrName);
	else {
		var column = this.columns[columnIndex];
		column.cellEditor = cellEditor;
	
		// give access to the column from the cell editor
		if (cellEditor) {
			cellEditor.editablegrid = this;
			cellEditor.column = column;
		}
	}
};

/**
 * Sets the header cell editor for the specified column index
 * @param {Object} columnIndexOrName index or name of the column
 * @param {CellEditor} cellEditor
 */
EditableGrid.prototype.setHeaderEditor = function(columnIndexOrName, cellEditor)
{
	var columnIndex = this.getColumnIndex(columnIndexOrName);
	if (columnIndex < 0) alert("[setHeaderEditor] Invalid column: " + columnIndexOrName);
	else {
		var column = this.columns[columnIndex];
		column.headerEditor = cellEditor;
	
		// give access to the column from the cell editor
		if (cellEditor) {
			cellEditor.editablegrid = this;
			cellEditor.column = column;
		}
	}
};

/**
 * Sets the enum provider for the specified column index
 * @param {Object} columnIndexOrName index or name of the column
 * @param {EnumProvider} enumProvider
 */
EditableGrid.prototype.setEnumProvider = function(columnIndexOrName, enumProvider)
{
	var columnIndex = this.getColumnIndex(columnIndexOrName);
	if (columnIndex < 0) alert("[setEnumProvider] Invalid column: " + columnIndexOrName);
	else this.columns[columnIndex].enumProvider = enumProvider;
	
	// we must recreate the cell renderer and editor for this column
	this._createCellRenderer(this.columns[columnIndex]);
	this._createCellEditor(this.columns[columnIndex]);
};

/**
 * Clear all cell validators for the specified column index
 * @param {Object} columnIndexOrName index or name of the column
 */
EditableGrid.prototype.clearCellValidators = function(columnIndexOrName)
{
	var columnIndex = this.getColumnIndex(columnIndexOrName);
	if (columnIndex < 0) alert("[clearCellValidators] Invalid column: " + columnIndexOrName);
	else this.columns[columnIndex].cellValidators = [];
};

/**
 * Adds default cell validators for the specified column index (according to the column type)
 * @param {Object} columnIndexOrName index or name of the column
 */
EditableGrid.prototype.addDefaultCellValidators = function(columnIndexOrName)
{
	var columnIndex = this.getColumnIndex(columnIndexOrName);
	if (columnIndex < 0) alert("[addDefaultCellValidators] Invalid column: " + columnIndexOrName);
	return this._addDefaultCellValidators(this.columns[columnIndex]);
};

/**
 * Adds default cell validators for the specified column
 * @private
 */
EditableGrid.prototype._addDefaultCellValidators = function(column)
{
	if (column.datatype == "integer" || column.datatype == "double") column.cellValidators.push(new NumberCellValidator(column.datatype));
	else if (column.datatype == "email") column.cellValidators.push(new EmailCellValidator());
	else if (column.datatype == "website" || column.datatype == "url") column.cellValidators.push(new WebsiteCellValidator());
	else if (column.datatype == "date") column.cellValidators.push(new DateCellValidator(this));
};

/**
 * Adds a cell validator for the specified column index
 * @param {Object} columnIndexOrName index or name of the column
 * @param {CellValidator} cellValidator
 */
EditableGrid.prototype.addCellValidator = function(columnIndexOrName, cellValidator)
{
	var columnIndex = this.getColumnIndex(columnIndexOrName);
	if (columnIndex < 0) alert("[addCellValidator] Invalid column: " + columnIndexOrName);
	else this.columns[columnIndex].cellValidators.push(cellValidator);
};

/**
 * Sets the table caption: set as null to remove
 * @param columnIndexOrName
 * @param caption
 * @return
 */
EditableGrid.prototype.setCaption = function(caption)
{
	this.caption = caption;
};

/**
 * Get cell element at given row and column
 */
EditableGrid.prototype.getCell = function(rowIndex, columnIndex)
{
	var row = this.getRow(rowIndex);
	return row.cells[columnIndex];
};

/**
 * Get cell X position relative to the first non static offset parent
 * @private
 */
EditableGrid.prototype.getCellX = function(oElement)
{
	var iReturnValue = 0;
	while (oElement != null && this.isStatic(oElement)) try {
		iReturnValue += oElement.offsetLeft;
		oElement = oElement.offsetParent;
	} catch(err) { oElement = null; }
	return iReturnValue;
};

/**
 * Get cell Y position relative to the first non static offset parent
 * @private
 */
EditableGrid.prototype.getCellY = function(oElement)
{
	var iReturnValue = 0;
	while (oElement != null && this.isStatic(oElement)) try {
		iReturnValue += oElement.offsetTop;
		oElement = oElement.offsetParent;
	} catch(err) { oElement = null; }
	return iReturnValue;
};

/**
 * Renders the grid as an HTML table in the document
 * @param {String} containerid 
 * id of the div in which you wish to render the HTML table (this parameter is ignored if you used attachToHTMLTable)
 * @param {String} className 
 * CSS class name to be applied to the table (this parameter is ignored if you used attachToHTMLTable)
 * @param {String} tableid
 * ID to give to the table (this parameter is ignored if you used attachToHTMLTable)
 * @see EditableGrid#attachToHTMLTable
 * @see EditableGrid#loadXML
 */
EditableGrid.prototype.renderGrid = function(containerid, className, tableid)
{
    with (this) {

    	// if we are already attached to an existing table, just update the cell contents
    	if (typeof table != "undefined" && table) {
    		
    		// render headers
    		_renderHeaders();
			   
    		// render content
            var rows = tBody.rows;
            for (var i = 0; i < rows.length; i++) {
                var rowData = [];
                var cols = rows[i].cells;
                for (var j = 0; j < cols.length && j < columns.length; j++) 
                	if (columns[j].renderable) columns[j].cellRenderer._render(i, j, cols[j], getValueAt(i,j));
            }

            // attach handler on click or double click 
        	if (doubleclick) table.addEventListener('dblclick', mouseClickedWrapper, false);
        	else table.addEventListener('click', mouseClickedWrapper, false);
    	}
    	
    	// we must render a whole new table
    	else {
    		
    		if (!_$(containerid)) return alert("Unable to get element [" + containerid + "]");

    		// create editablegrid table and add it to our container 
    		this.table = document.createElement("table");
    		table.className = className || "editablegrid";          
			if (typeof tableid != "undefined") table.id = tableid;
    		while (_$(containerid).hasChildNodes()) _$(containerid).removeChild(_$(containerid).firstChild);
    		_$(containerid).appendChild(table);
        
    		// create header
    		if (caption) {
    			var captionElement = document.createElement("CAPTION");
    			captionElement.innerHTML = this.caption;
    			table.appendChild(captionElement);
    		}
    		
    		this.tHead = document.createElement("THEAD");
    		table.appendChild(tHead);
    		var trHeader = tHead.insertRow(0);
    		var columnCount = getColumnCount();
    		for (var c = 0; c < columnCount; c++) {
    			var headerCell = document.createElement("TH");
    			var td = trHeader.appendChild(headerCell);
        		columns[c].headerRenderer._render(-1, c, td, columns[c].label);
    		}
        
    		// create body and rows
    		this.tBody = document.createElement("TBODY");
    		table.appendChild(tBody);
    		var rowCount = getRowCount();
    		for (i = 0; i < rowCount; i++) {
    			var tr = tBody.insertRow(i);
    			tr.id = this.name + "_" + data[i]['id'];
    			for (j = 0; j < columnCount; j++) {
        		
    				// create cell and render its content
    				var td = tr.insertCell(j);
    				columns[j].cellRenderer._render(i, j, td, getValueAt(i,j));
    			}
    		}

    		// attach handler on click or double click 
        	if (doubleclick) _$(containerid).addEventListener('dblclick', mouseClickedWrapper, false);
        	else _$(containerid).addEventListener('click', mouseClickedWrapper, false);
    	}
    	
		// resort table
		sort();
		
		// callback
		tableRendered(containerid, className, tableid);
    }
};

/**
 * Render all column headers 
 * @private
 */
EditableGrid.prototype._renderHeaders = function() 
{
	with (this) {
		var rows = tHead.rows;
		for (var i = 0; i < 1 /*rows.length*/; i++) {
			var rowData = [];
			var cols = rows[i].cells;
       		var columnIndexInModel = 0;
       		for (var j = 0; j < cols.length && columnIndexInModel < columns.length; j++) {
				columns[columnIndexInModel].headerRenderer._render(-1, columnIndexInModel, cols[j], columns[columnIndexInModel].label);
       			var colspan = parseInt(cols[j].getAttribute("colspan"));
       			columnIndexInModel += colspan > 1 ? colspan : 1;
       		}
		}
	}
};

EditableGrid.prototype.unattach = function()
{
    with (this) {
		if (doubleclick) table.removeEventListener('dblclick', mouseClickedWrapper, false);
		else table.removeEventListener('click', mouseClickedWrapper, false);
	}
};

/**
 * Mouse click handler
 * @param {Object} e
 * @private
 */
EditableGrid.prototype.mouseClicked = function(e) 
{
	e = e || window.event;
	with (this) {
		
		// get row and column index from the clicked cell
		var target = e.target || e.srcElement;
		
		// go up parents to find a cell or a link under the clicked position
		while (target) if (target.tagName == "A" || target.tagName == "TD" || target.tagName == "TH") break; else target = target.parentNode;
		if (!target || !target.parentNode || !target.parentNode.parentNode || (target.parentNode.parentNode.tagName != "TBODY" && target.parentNode.parentNode.tagName != "THEAD") || target.hasAttribute('isEditing')) return;
		
		// don't handle clicks on links
		if (target.tagName == "A") return;
		
		// get cell position in table
		var rowIndex = target.parentNode.rowIndex - nbHeaderRows; // remove header rows
		var columnIndex = target.cellIndex;

		var column = columns[columnIndex];
		if (column) {
			
			// if another row has been selected: callback
			if (rowIndex > -1 && rowIndex != lastSelectedRowIndex) {
				rowSelected(lastSelectedRowIndex, rowIndex);				
				lastSelectedRowIndex = rowIndex;
			}
			
			// edit current cell value
			if (!column.editable) { readonlyWarning(column); }
			else {
				if (rowIndex < 0) { 
					if (column.headerEditor && isHeaderEditable(rowIndex, columnIndex)) 
						column.headerEditor.edit(rowIndex, columnIndex, target, column.label);
				}
				else if (column.cellEditor && isEditable(rowIndex, columnIndex))
					column.cellEditor.edit(rowIndex, columnIndex, target, getValueAt(rowIndex, columnIndex));
			}
		}
	}
};

/**
 * Sort on a column
 * @param {Object} columnIndexOrName index or name of the column
 * @param {Boolean} descending
 */
EditableGrid.prototype.sort = function(columnIndexOrName, descending)
{
	with (this) {
		
		if (typeof columnIndexOrName  == 'undefined') columnIndexOrName = sortedColumnName;
		if (typeof descending  == 'undefined') descending = sortDescending;

		var columnIndex = columnIndexOrName;
		if (columnIndex !== -1) {
			columnIndex = this.getColumnIndex(columnIndexOrName);
			if (columnIndex < 0) {
				alert("[sort] Invalid column: " + columnIndexOrName);
				return false;
			}
		}
		
		var type = columnIndex < 0 ? "" : getColumnType(columnIndex);
		var row_array = [];
		var rows = tBody.rows;
		for (var i = 0; i < rows.length - (ignoreLastRow ? 1 : 0); i++) row_array.push([columnIndex < 0 ? null : getValueAt(i, columnIndex), i, rows[i], data[i].originalIndex]);
		row_array.sort(columnIndex < 0 ? unsort :
					   type == "integer" || type == "double" ? sort_numeric :
					   type == "boolean" ? sort_boolean :
					   type == "date" ? sort_date :
					   sort_alpha);
		
		if (descending) row_array = row_array.reverse();
		if (ignoreLastRow) row_array.push([columnIndex < 0 ? null : getValueAt(rows.length - 1, columnIndex), rows.length - 1, rows[rows.length - 1], data[rows.length - 1].originalIndex]);
		
		var _data = data;
		data = [];
		for (var i = 0; i < row_array.length; i++) {
			data.push(_data[row_array[i][1]]);
			tBody.appendChild(row_array[i][2]);
		}
		delete row_array;
		
		// callback
		tableSorted();
	}
};


/**
 * Filter the content of the table
 * @param {Element} filter Element input element used to filter
 */
EditableGrid.prototype.filter = function(str)
{
	with (this) {
    	var words = str.toLowerCase().split(" ");
		var ele;
		for (var r = 1; r < table.rows.length; r++){
			ele = table.rows[r].innerHTML.replace(/<[^>]+>/g,"");
		    var displayStyle = 'none';
	        for (var i = 0; i < words.length; i++) {
		    	if (ele.toLowerCase().indexOf(words[i])>=0)
						displayStyle = '';
		    	 else {
					displayStyle = 'none';
					break;
			    }
	        }   
			table.rows[r].style.display = displayStyle;
		}
   		// callback
		tableFiltered();  
		
	}
};
