'use strict'

var parser = require("../rLang").parser;
var DataTable = require("../dataTable");
var Context = require("../context");
var assert = require('assert');

describe('Calculation', function () {

    it ('should allow simple expressions i.e. =2+3', function () {
        let expression = '= 2 + 3';
        let fn = parser.parse(expression);
        let result = fn(new Context());
        assert.equal(result, 5);
    });

    it ('should allow named/variable expressions i.e. A={2+3}', function () {
        let expression = 'A={2 + 3}';
        let fn = parser.parse(expression);
        let result = fn(new Context());
        assert.equal(result, 5);
    });

    it ('should know how to add and subtract', function () {
        let expression = 'A = {2 + 3}';
        let fn = parser.parse(expression);
        let result = fn(new Context());
        assert.equal(result, 5);

        expression = 'A = {3 - 1}';
        fn = parser.parse(expression);
        result = fn(new Context());
        assert.equal(result, 2);

        expression = 'A = {6 + 1 - 3}';
        fn = parser.parse(expression);
        result = fn(new Context());
        assert.equal(result, 4);

    });

    it ('should know how to multiply and divide', function () {
        let expression = 'A = {2 * 3}';
        let fn = parser.parse(expression);
        let result = fn(new Context());
        assert.equal(result, 2 * 3);

        expression = 'A = {3 / 2}';
        fn = parser.parse(expression);
        result = fn(new Context());
        assert.equal(result, 3 / 2);

        expression = 'A = {6 * 2 / 3}';
        fn = parser.parse(expression);
        result = fn(new Context());
        assert.equal(result, 6 * 2 / 3);

    });

    it ('should know how to do arithmetic precedence', function () {
        let expression = 'A = {2 * 3 + 2 / 2}';
        let fn = parser.parse(expression);
        let result = fn(new Context());
        assert.equal(result, 2 * 3 + 2 / 2);

        expression = 'A = {3 + 2 * 3}';
        fn = parser.parse(expression);
        result = fn(new Context());
        assert.equal(result, 3 + 2 * 3);

        expression = 'A = {6 * (2 + 3)}';
        fn = parser.parse(expression);
        result = fn(new Context());
        assert.equal(result, 6 * (2 + 3));

    });

    it ('should know how to use the "%" (percentage) operator', function () {
        let expression = 'A = {2 * 3.2%}';
        let fn = parser.parse(expression);
        let result = fn(new Context());
        assert.equal(result, 2 * (3.2 / 100));
    });

    it ('should know how to use the "^" (power) operator', function () {
        let expression = 'A = {2.2^3.2}';
        let fn = parser.parse(expression);
        let result = fn(new Context());
        assert.equal(result, Math.pow(2.2,3.2));
    });

    it ('should know how to use native (js) variables', function () {
        let expression = 'A = {2} B = {A * 2}';
        let fn = parser.parse(expression);
        let result = fn(new Context());
        assert.equal(result, 4);

        expression = 'A = {22.2} B = {A}';
        fn = parser.parse(expression);
        result = fn(new Context());

        assert.equal(result, 22.2);

    });

    it ('should know how to use native object (js) variables', function () {
        let expression = 'A.test = {2} B.result = {A.test * 2}';
        let fn = parser.parse(expression);
        let result = fn(new Context());

        assert.equal(result, 4);

        expression = 'A.tt = {22.2} B.tt = {A.tt}';
        fn = parser.parse(expression);

        result = fn(new Context());

        assert.equal(result, 22.2);

    });


    it ('should know how to use cell variables', function () {

        let myContext = new Context();

        let expression = '[A] = {2} [B] = {[A] * 2}';
        let fn = parser.parse(expression);

        //console.log(fn.toString());

        let result = fn(myContext);

        //console.log(JSON.stringify(myContext));

        assert.equal(myContext.t.table.getValue("B", 0), 4);

    });

    it ('should know how to work with strings', function () {

        let expression = 'A = {"Hello World."}';
        let fn = parser.parse(expression);

        let result = fn(new Context());
        assert.equal(result, "Hello World.");

        expression = 'Foo = {"Foo"} Bar = {"Bar"} R = {Foo & " " & Bar}';
        fn = parser.parse(expression);

        result = fn(new Context());
        assert.equal(result, "Foo Bar");

        expression = 'Q = {"\\"Quoted\\""}';
        fn = parser.parse(expression);

        result = fn(new Context());
        assert.equal(result, '"Quoted"');

    });

    it ('should know how to use external functions', function () {

        let myContext = new Context();
        
        myContext.fn.MyAdd = function (a, b) { return a + b; };

        let expression = 'A = { MyAdd(MyAdd(1, 1),100 * 10%) }';
        let fn = parser.parse(expression);

        let result = fn(myContext);
        assert.equal(result, 2 + 10);

    });

    it ('should know how to handle arrays', function () {

        let myContext = new Context();
        
        let expression =  'A = { {1} }';
        
        var fn = parser.parse(expression);
        var result = fn(myContext);
        assert.deepEqual(result, [1]);

        expression = ' A = { {1, 2, 3, 4} }';

        fn = parser.parse(expression);
        result = fn(myContext);
        assert.deepEqual(result, [1, 2, 3, 4]);

        expression = ' A = { {1, 2, 3, 4; 5, 6, 7, 8; 9, 10, 11, 12 } }';

        fn = parser.parse(expression);
        result = fn(myContext);
        assert.deepEqual(result, [[1,2,3,4],[5,6,7,8],[9,10,11,12]]);


    });

    it ('should know allow to import variables from the context', function () {

        let myContext = new Context({ EMP : { NAME : "John" } });
        let expression = "context { EMP } R = { EMP.NAME }";
        var fn = parser.parse(expression);

        var result = fn(myContext);

        assert.equal(result, "John");

    });
    

});
