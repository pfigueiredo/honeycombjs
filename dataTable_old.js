/*jslint node: true */
'use strict';

function DataTable (values) {
    this.values = (values) ? values : [];
    this.columns = [];
    this.rowSeed = -1;

    for (var i = 0; i < this.values.length; i++) {
        if (i == 0) { //first row object contains default columns names
            for (var prop in this.values[0]) {
                if (this.values[0].hasOwnProperty(prop))
                this.columns.push(prop);
            }
        }
        this.values[i].row = this.rowSeed = i;
    }
}

function ObjSetter(obj, prop, val) {
    if (obj) {
        if (obj.hasOwnProperty(prop)) {
            return obj[prop] = val;
        } else {
            for (var p in obj) {
                if (obj.hasOwnProperty(p) && prop.toLowerCase() === p.toLowerCase()) {
                    return obj[p] = val;
                }
            }
            return obj[prop] = val;
        }
    }
}

function ObjGetter(obj, prop) {
    if (obj) {
        if (obj.hasOwnProperty(prop)) {
            return obj[prop];
        } else {
            for (var p in obj) {
                if (obj.hasOwnProperty(p) && prop.toLowerCase() === p.toLowerCase()) {
                    return obj[p];
                }
            }
            return obj[prop];
        }
    }
}

DataTable.prototype.containsColumn = function(column) {
    for (var i = 0; i < this.columns.length; i++) {
        if (this.columns[i] === column)
            return true;
    }
    return false;
}

DataTable.prototype.columnIndex = function(column) {
    for (var i = 0; i < this.columns.length; i++) {
        if (this.columns[i] === column)
            return i;
    }
    return -1;
}

DataTable.prototype.addColumn = function (column) {
    this.insureColumn(column);
}

DataTable.prototype.addRow = function () {
    var row = {row: ++this.rowSeed};
    for (var i = 0; i < this.columns.length; i++) {
        if (this.columns[i] != "row")
            row[this.columns[i]] = null;
    }
    this.values.push(row);
}

DataTable.prototype.insureColumn = function (column) {
    if (column != "row" && !this.containsColumn(column)) {
        this.columns.push(column);
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
    
    this.insureRowColumn(column, row);

    if (row >= 0 && row < this.values.length) {
        return ObjSetter(this.values[row], column, value);
    }
    
    return null;
}

DataTable.prototype.getValue = function(column, row) {
    
    if (column == "row") this.insureRowColumn(column, row);
    if (row >= 0 && row < this.values.length) {
        return ObjGetter(this.values[row], column);
    }
    
    return null;
}

DataTable.prototype.getRow = function (row) {
    if (this.values) {
        if (row >= 0 && row <= this.values.length) {
            return this.values[row];
        }
    }
    return null;
}

DataTable.prototype.getColumn = function (column, row) {
    var retValues = [];
    if (this.values) {
        for (var i = 0; i < this.values.length; i++) {
            retValues.push(ObjGetter(this.values[i], column));
        }
    }
    retValues.row = row;
    return retValues;
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

    if (startColumnIdx < 0) return startColumnIdx = 0;
    if (endColumnIdx < 0) return endColumnIdx = 0;

    //try to get the range correcty
    //no garanties because i have each row as an object
    //and object properties have no garantied order
    for (var r = starRow; r < this.values.lenght && r <= endRow; r++) {
        var obj = this.values[r];
        retArr.push([]);
        for (var c = startColumnIdx; c < this.columns.length && c <= endColumnIdx; c++) {
            name = this.columns[c];
            retArr[r].push(obj[name]);
        }
    }
    return retArr;
}

module.exports = DataTable;
