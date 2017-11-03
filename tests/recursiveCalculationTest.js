'use strict'

var parser = require("../rLang").parser;
var DataTable = require("../dataTable");
var Context = require("../context");
var assert = require('assert');

describe('Recursive Calculation', function () {

    it ('Recursively Assign', function () {

        let myContext = new Context();
        let expression = '' 
        expression += '[P[0:100]] = {row * 2}';
        expression += '[P2] = { P }';
        expression += '[P3] = { P }';
        expression += '[P4[1:10]] = { 5 }';

        expression += 'table2[P[0:100]] = {table2[row[+0]] * 2}';
        expression += 'table2[P5] = {table2[P[+0]]}';
        expression += 'table2[P6] = {table2[P[+0]]}';
        expression += 'table2[P7[1:10]] = {5}';

        let fn = parser.parse(expression);

        // console.log(fn.toString());

        fn(myContext);

        assert.equal(myContext.t.table.values.length, 101);
        assert.equal(myContext.t.table.getValue("P", 10), myContext.t.table.getValue("P", 10));
        assert.equal(myContext.t.table.getValue("P", 50), myContext.t.table.getValue("P", 50));
        assert.equal(myContext.t.table.getValue("P", 60), myContext.t.table2.getValue("P", 60));
        assert.equal(myContext.t.table.getValue("P", 5), myContext.t.table2.getValue("P", 5));

        assert.equal(myContext.t.table.getValue("P4", 0), null);
        assert.equal(myContext.t.table.getValue("P4", 1), 5);

        assert.equal(myContext.t.table2.getValue("P7", 10), 5);
        assert.equal(myContext.t.table2.getValue("P7", 11), null);

        //console.log(JSON.stringify(myContext));

    });

    it ('Calculate 6 digits of Pi using a running Sum', function () {

        let myContext = new Context();

        let expression = "[P[0:100]] = { row * 2 }";
        expression += "[PI] = { IF(row = 0, 3, 4/(P * (P + 1) * (P + 2))) * IF(OR(row = 0, ISODD(row)), 1, -1) + [PI[-1]] }";
        expression += "R = {ROUND([PI[#100]],6)}"
        let fn = parser.parse(expression);

        let result = fn(myContext);

        assert.equal(result, 3.141592);

    });

    it ('Calculate 6 digits of Pi using with a SUM over the PI column', function () {

        let myContext = new Context();

        let expression = "[P[0:100]] = { row * 2 }";
        expression += "[PI] = { IF(row = 0, 3, 4/(P * (P + 1) * (P + 2))) * IF(OR(row = 0, ISODD(row)), 1, -1) }";
        expression += "R = {ROUND(SUM([PI]),6)}"
        let fn = parser.parse(expression);
        let result = fn(myContext);

        assert.equal(result, 3.141592);

    });

    it ('Calculate 6 digits of Pi using with "Array functions"', function () {

        let myContext = new Context();

        let expression = "[P[0:100]] = { row * 2 }";
        expression += "R = { ROUND(SUM( IF([row] = 0, 3, 4/([P] * ([P] + 1) * ([P] + 2))) * IF(OR([row] = 0, ISODD([row])), 1, -1) ), 6) }";
        let fn = parser.parse(expression);
        let result = fn(myContext);

        assert.equal(result, 3.141592);

    });

    it ('Calculate the first 50 Fibonacci numbers', function () {

        let myContext = new Context();

        let expression = "[F[0:50]] = { IF([row[0]]<2, [row[0]], [F[-1]] + [F[-2]]) }";
        let fn = parser.parse(expression);
        let result = fn(myContext);

        assert.equal(result, 12586269025);

    });

    it ('Calculate the first 50 Fibonacci numbers, with variable inference (assume variable row as [row] or [row[0]])', function () {

        let myContext = new Context();

        // let expression = "[F[0:50]] = { IF(row < 2, row, [F[-1]] + [F[-2]]) }";
        let expression = "[F[0:50]] = { IF( row < 2, row, [F[-1]] + [F[-2]]) }";
        let fn = parser.parse(expression);
        let result = fn(myContext);

        assert.equal(result, 12586269025);

    });

});