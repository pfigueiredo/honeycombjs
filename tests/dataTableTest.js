'use strict'

var DataTable = require('../dataTable');
var assert = require('assert');

describe('DataTable', function () {
    it ('should construct', function () {
        let table = new DataTable();
        assert(table.values.length == 0);

        table = new DataTable([{name:"name1"},{name:"name2"},{name:"name3"}]);
        assert.equal(table.values.length, 3);
    });

    it ('should add auto increment column', function () {
        let table = new DataTable([{name:"name1"},{name:"name2"},{name:"name3"}]);
        assert.equal(table.getColumn("row").length, 3);
        assert.equal(table.getValue("row", 2), 2);
    });

    it ('should add rows', function () {
        let table = new DataTable([{name:"name1"},{name:"name2"},{name:"name3"}]);
        table.addRow();
        assert.equal(table.getColumn("row").length, 4);
        assert.equal(table.getValue("row", 3), 3);

        // console.log(JSON.stringify(table));
        
    });

    it ('should add, change and get values', function () {

        let table = new DataTable();
        var name = table.setValue("name", 2, "nome@2");

        // console.log(JSON.stringify(table));

        assert.equal(table.values.length, 3);
        assert.equal(name, "nome@2");

        name = table.getValue("name", 2);
        assert.equal(name, "nome@2");

        table.setValue("name", 2, "nome@2_altered");
        name = table.getValue("name", 2);
        assert.equal(name, "nome@2_altered");



    });

    it ('test adding 10k rows, change values and get 1 column array', function () {

        let objProto = {
            name: "", id: 0, test1: "",  test2: "",  test3: ""
        };

        let table = new DataTable([objProto]);
        let numberRows = 10000;

        for (var i = 1; i < numberRows; i++) {
            table.addRow();
        }

        assert.equal(table.values.length, numberRows);

        for (var i = 1; i < numberRows; i++) {
            table.setValue("name", i, "name " + i);    
        }

        // let lastObject = table.getRow(numberRows -1);

        assert.equal(table.getValue("row", numberRows -1), numberRows -1);
        assert.equal(table.getValue("name", numberRows -1), "name " + (numberRows -1));
        assert.equal(table.getValue("id", numberRows -1), null);
        assert.equal(table.getValue("otherProp", numberRows -1), undefined);

        var col = table.getColumn("name");

        assert(col.length, numberRows -1);
        assert(col[numberRows -1], "name " + (numberRows -1));

    });


});