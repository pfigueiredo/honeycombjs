'use strict'

var parser = require("../rLang").parser;
var DataTable = require("../dataTable");
var Context = require("../context");
var assert = require('assert');

describe('Calculation Order', function () {

    it ('Basic Order', function () {
        let myContext = new Context();

        let expression = '';

        expression += 'A = { B * 2 } B = { 6 }'

        let fn = parser.parse(expression);
        let result = fn(myContext);
        assert.equal(result, 12);


    });

    it ('Complex Order', function () {
        let myContext = new Context();

        let expression = '';

        expression += 'C = { 6 } A = { B * 2 } B = { C }'

        let fn = parser.parse(expression);

        let result = fn(myContext);
        assert.equal(12, result);


    });

    it ('Column Order', function () {
        let myContext = new Context();

        let expression = '';

        expression += '[C[0]] = { 6 } [A[0]] = { [B[0]] * 2 } [B[0]] = { [C[0]] }'

        let fn = parser.parse(expression);

        let result = fn(myContext);
        assert.equal(12, result);


    });


    it ('Column Order $', function () {
        let myContext = new Context();

        let expression = '';

        expression += '[C[#0]] = { 6 } [A[#0]] = { [B[#0]] * 2 } [B[#0]] = { [C[#0]] }'

        let fn = parser.parse(expression);

        let result = fn(myContext);
        assert.equal(12, result);


    });

     it ('Column and Range Orders', function () {
        let myContext = new Context();

        let expression = '';

        expression += '[C[#0]] = { 1 }'
        expression += 'R = { SUM([C]) }'
        expression += '[C[#1]] = { 1 }'
        expression += '[C[#2]] = { 1 }'
        expression += '[C[#3]] = { 1 }'
        expression += '[C[#4]] = { 1 }'
        expression += '[C[#5]] = { 1 }'
        expression += '[C[#6]] = { 1 }'

        let fn = parser.parse(expression);

        let result = fn(myContext);
        assert.equal(1, result);


    });

    it ('Column and Range Orders Advanced', function () {

        let expression = '';
        expression += 'a.Quantidade = {1}';
        expression += '[Quantidade[#0]] = {a.Quantidade}';
        expression += 'a.Valor = {[Quantidade]}';
        expression += '[Valor[#0]] = {a.Valor}';
        expression += 'b.Quantidade = {1}';
        expression += '[Quantidade[#1]] = {b.Quantidade}';
        expression += 'b.Valor = {SUM([Quantidade])}';
        expression += '[Valor[#1]] = {b.Valor}';
        expression += 'c.Quantidade = {1}';
        expression += '[Quantidade[#2]] = {c.Quantidade}';

        let myContext = new Context();
        let fn = parser.parse(expression);
        let result = fn(myContext);


});

    // it ('Dead code elimination', function () {
    //     let myContext = new Context();

    //     let expression = '';

    //     expression += '$A[0:10] = { 5 } C1 = { SUM([A]) } @D = { C1 }'
    //     expression += '$B[0:10] = { 5 } C2 = { SUM([B]) } D = { 10 }'

    //     let fn = parser.parse(expression);
    //     let result = fn(myContext);
    //     assert.equal(10, result);


    // });


});