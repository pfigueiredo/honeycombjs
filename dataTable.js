/*jslint node: true */
'use strict';

function DataTable (values) {
    this.values = [];
    this.columns = [];
    this.ucColumns = [];
    this.rowSeed = -1;

    this.columns.push("Row");
    this.ucColumns.push("ROW");

    if (values && values.length > 0) {

        var props = Object.keys(values[0]);
        for (var i = 0, l = props.length; i < l; i++) {
            var prop = props[i];
            if (this.ucColumns.indexOf(prop.toUpperCase()) < 0) {
                this.ucColumns.push(prop.toUpperCase())
                this.columns.push(prop);
            }
        }

        for (var r = 0; r < values.length; r++) {
            this.values.push([]); //push [r]
            this.values[r].push(this.rowSeed = r);
            
            for (var c = 1; c < this.columns.length; c++) {
                this.values[r].push(values[r][this.columns[c]]);
            }
        }

    }
    
}

DataTable.prototype.containsColumn = function(column) {
    var index = this.columns.indexOf(column);
    if (index >= 0) return true;

    var ucCol = column.toUpperCase();
    index = this.ucColumns.indexOf(ucCol);
    if (index >= 0) return true;

    return false;
}

DataTable.prototype.columnIndex = function(column) {

    var index = this.columns.indexOf(column);
    if (index >= 0) return index;

    var ucCol = column.toUpperCase();
    index = this.ucColumns.indexOf(ucCol);
    if (index >= 0) return index;

    return -1;
}

DataTable.prototype.addColumn = function (column) {
    this.insureColumn(column);
}

DataTable.prototype.addRow = function () {
    var row = [++this.rowSeed];
    for (var i = 1; i < this.columns.length; i++) {
        row.push(null);
    }
    this.values.push(row);
}

DataTable.prototype.insureColumn = function (column) {
    if (!this.containsColumn(column)) {
        this.columns.push(column);
        this.ucColumns.push(column.toUpperCase())
        for (var r = 0; r < this.values.length; r++)
            this.values[r].push(null);
    }
}

DataTable.prototype.insureRow = function (row) {
    if (!this.values) this.values = [];
    while (this.values.lenght <= row)
        this.addRow();
}

DataTable.prototype.insureRowColumn = function (column, row) {
    this.insureColumn(column);
    if (!this.values) this.values = [];
    while (this.values.length <= row)
        this.addRow();
}

DataTable.prototype.setValue = function(column, row, value) {
    
    var columnIndex = this.columnIndex(column);

    if (!(columnIndex >=0 && row >= 0 && row < this.values.length)) {
        this.insureRowColumn(column, row);
        columnIndex = this.columnIndex(column);
    }

    return this.values[row][columnIndex] = value;
}

DataTable.prototype.getValue = function(column, row) {
    
    var columnIndex = this.columnIndex(column);

    if (!(columnIndex >=0 && row >= 0 && row < this.values.length)) {
        if (column == "row") {
            this.insureRowColumn(column, row);
            columnIndex = this.columnIndex(column);
        } else
            return null;
    }
    
    return this.values[row][columnIndex];

}

DataTable.prototype.toObjectArray = function() {
    var ret = [];
    if (this.values) {
        for (var r = 0; r < this.values.length; r++) {
            var obj = {};
            ret.push(obj);
            for (var c = 0; c < this.columns.length; c++) {
                obj[this.columns[c]] = this.values[r][c];
            }
        }
    }
    return ret;
}

DataTable.prototype.getRowObject = function (row) {
    if (this.values) {
        var obj = {};
        if (row >= 0 && row <= this.values.length) {
            for (var c = 0; c < this.columns.length; c++) {
                obj[this.columns[c]] = this.values[row][c];
            }
            return obj;
        }
    }
    return null;
}

DataTable.prototype.getRow = function (row) {
    if (this.values) {
        var obj = {};
        if (row >= 0 && row <= this.values.length) {
            return this.values[row].slice(0);
        }
    }
    return null;
}

DataTable.prototype.getColumn = function (column, row) {
    var retValues = [];
    if (this.values) {
        var columnIndex = this.columnIndex(column);
        if (columnIndex >= 0) {
            for (var r = 0; r < this.values.length; r++) {
                retValues.push(this.values[r][columnIndex]);
            }
        }
    }
    retValues.row = row;
    return retValues;
}

DataTable.prototype.getParentValue = function(valueColumn, row) {
    var parentId = this.getValue("_parent", row);
    if (parentId != null)
        return this.findValues("_id", parentId, valueColumn, 1);
    
    parentId = this.getValue("$parent", row);
    if (parentId != null)
        return this.findValues("$id", parentId, valueColumn, 1);

    return [];
}

DataTable.prototype.findValues = function (queryColumn, query, valueColumn, top) {

    var queryColumnIdx = 0, valueColumnIdx = 0;
    var retArr = [];

    if (isNaN(queryColumn))
        queryColumnIdx = this.columnIndex(queryColumn);
    else
        queryColumnIdx = Number(queryColumn);

    if (isNaN(valueColumn))
        valueColumnIdx = this.columnIndex(valueColumn);
    else
        valueColumnIdx = Number(valueColumn);

    for (var r = 0; r < this.values.length; r++) {

        var colValue = this.values[r][queryColumnIdx]; 

        if (colValue == query)
            retArr.push(this.values[r][valueColumnIdx]);
        else if (typeof colValue === 'string' || colValue instanceof String) {
            if (colValue.startsWith(query))
                retArr.push(this.values[r][valueColumnIdx]);
        }

        if (top && top <= retArr.length)
            break;

    }

    return retArr;

}

DataTable.prototype.getRange = function (startColumn, endColumn, starRow, endRow) {
    var startColumnIdx = 0, endColumnIdx = 0;
    var retArr = [];

    if (isNaN(startColumn)) 
        startColumnIdx = this.columnIndex(startColumn);
    else
        startColumnIdx = Number(startColumn);

    if (isNaN(endColumn)) 
        endColumnIdx = this.columnIndex(endColumn);
    else
        endColumnIdx = Number(endColumn);

    if (startColumnIdx < 0) startColumnIdx = 0;
    if (endColumnIdx < 0) endColumnIdx = 0;

    //try to get the range correcty
    //no garanties because i have each row as an object
    //and object properties have no garantied order
    for (var r = starRow; r < this.values.length && r <= endRow; r++) {
        retArr.push([]);
        for (var c = startColumnIdx; c < this.columns.length && c <= endColumnIdx; c++) {
            retArr[r].push(this.values[r][c]);
        }
    }
    return retArr;
}

module.exports = DataTable;
