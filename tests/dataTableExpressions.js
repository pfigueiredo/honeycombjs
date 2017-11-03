'use strict'

var parser = require("../rLang").parser;
var DataTable = require("../dataTable");
var Context = require("../context");
var assert = require('assert');

describe('DataTable Expressions', function () {
    it ('should accept a default table in the context and access a column', function () {
        let table = new DataTable();
        table = new DataTable([{name:"name1"},{name:"name2"},{name:"name3"}]);
        
        let myContext = new Context(null, {table: table, defaulttable: "table"}, null);
        let expression = "R = { [name] } ";

        let fn = parser.parse(expression);
        let result = fn(myContext);

        assert.equal(result.length, 3)

    });

    it ('should get a value by row and index', function () {
        let table = new DataTable();
        table = new DataTable([{name:"name1"},{name:"name2"},{name:"name3"}]);
        
        let myContext = new Context(null, {table: table, defaulttable: "table"}, null);
        let expression = "R = { [name[#2]] } ";

        let fn = parser.parse(expression);
        let result = fn(myContext);

        assert.equal(result, "name3")

    });

    it ('should find values by the first column query', function () {
        let table = new DataTable();
        table = new DataTable([{name:"A", v:1},{name:"B", v:2},{name:"A", v:3}]);
        
        let myContext = new Context(null, {table: table, defaulttable: "table"}, null);
        let expression = "R = { [A.v] } ";

        let fn = parser.parse(expression);
        let result = fn(myContext);

        assert.deepEqual(result, [1,3])

    });

    it ('should find values by the first column query (2) promoting a var A.v to column query [A.v]', function () {
        let table = new DataTable();
        table = new DataTable([{name:"A", v:1},{name:"B", v:2},{name:"A", v:3}]);
        
        let myContext = new Context(null, {table: table, defaulttable: "table"}, null);
        let expression = "R = { A.v } ";

        let fn = parser.parse(expression);
        let result = fn(myContext);

        assert.deepEqual(result, [1,3])

    });

    it ('Correctly read complext variables and data from the datatable', function() {

        let table = new DataTable([{ Code:"a1222", Quantity: 1, Value:500 }]) 
        let expression = "context { Employee } [Quantity] = {Employee.NWP} with Code as a1222";
        let employee = {
            NWP: 40,
            Seniority: 360,
            Wage: 500
        };

        let myContext = new Context({Employee: employee}, {table: table, defaulttable: "table"}, null);

        let fn = parser.parse(expression);
        let result = fn(myContext);

        assert.equal(result, 40);

    });

    it ('complex dataTable calculations with column filter', function () {

        let table = new DataTable();
        let employee = { NWP: 40 };

        table = new DataTable([
            { Code:"a1000", Quantity: 1, Value:500 },    //500, T = (1, 2, 100, 0.3 * 500)
            { Code:"a1000", Quantity: 2, Value:100 },    //200, T = (1, 2, 100, 0.3 * 100)
            { Code:"a1000", Quantity: 100, Value:10.5 }, //105, T = (1, 2, 100, 0.3 * 10.2)
            { Code:"a1000", Quantity: 0.3, Value:100 },  //30, T = (1, 2, 100, 0.3 * 100)

            { Code:"a2000", Quantity: 5, Value:100 },    //500, T = (1, 2, 100, 0.3 * 100)
            { Code:"a2000", Quantity: 10, Value:100.2 }, //1002, T = (1, 2, 100, 0.3 * 100.2)
            { Code:"x2000", Quantity: 10, Value:100.2 }, //1002, T = (1, 2, 100, 0.3 * 100.2)
        ]);
        
        let myContext = new Context({Employee: employee}, {table: table, defaulttable: "table"}, null);
        let expression = "";
        expression += "context { a1000r, a2000r, Tr, R2, Employee, ENWP }"
        expression += "[Result] = { Quantity * Value } with Code as a1000"
        expression += "[Result2] = { Quantity * Value / 2 } with Code as a1000"
        expression += "[NWP] = { Employee.NWP } with Code as a1000"
        expression += "[Result] = { Value / Quantity } with Code as a2000"
        expression += "[Result2] = { Quantity } with Code as a"
        expression += "[T] = { Value * [a1000.Quantity] }"
        expression += "a1000r = { SUM([a1000.Result])  }"
        expression += "a2000r = { SUM([a2000.Result])  }"
        expression += "ENWP = { MAX([NWP])  }"
        expression += "Tr = { SUM([T]) }"
        expression += "R2 = { SUM([Result2]) }"

        let fn = parser.parse(expression);

        // console.log(fn.toString());

        let result = fn(myContext);
        // console.log(table);
        // console.log(myContext.g);

        assert.equal(myContext.g.a1000r, 1 * 500 + 2 * 100 + 100 * 10.5 + 0.3 * 100);
        assert.equal(myContext.g.a2000r, 100 / 5 + 100.2 / 10);
        assert.equal(myContext.g.R2, 1 + 2 + 100 + 0.3 + 5 + 10);
        assert.equal(myContext.g.ENWP, 40);

    });

});