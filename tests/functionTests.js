'use strict'

var parser = require("../rLang").parser;
var DataTable = require("../dataTable");
var Context = require("../context");
var assert = require('assert');

describe('Basic Functions', function () {

    it ('IF Function', function () {

        let myContext = new Context();

        let expression = "A = { IF(1 = 1, 2, 1) }"
        let fn = parser.parse(expression);
        let result = fn(myContext);
        assert.equal(result, 2);


    });

    it ('AND Function', function () {

        let myContext = new Context();

        let expression = "A = { IF(AND(1 = 1, 2 = 2), 2, 1) }"
        let fn = parser.parse(expression);
        let result = fn(myContext);
        assert.equal(result, 2);


    });

    it ('OR Function', function () {

        let myContext = new Context();

        let expression = "A = { IF(OR(1 = 0, 2 = 2), 2, 1) }"
        let fn = parser.parse(expression);
        let result = fn(myContext);
        assert.equal(result, 2);

    });

    it ('ROUND Function', function () {

        let myContext = new Context();

        let expression = "A = { ROUND(12.22232, 2) }"
        let fn = parser.parse(expression);
        let result = fn(myContext);
        assert.equal(result, 12.22);


        expression = "A = { ROUND(12.22632, 2) }"
        fn = parser.parse(expression);
        result = fn(myContext);
        assert.equal(result, 12.23);

    });

    it ('ROUNDUP Function', function () {

        let myContext = new Context();

        let expression = "A = { ROUNDUP(5.1242, 0) }"
        let fn = parser.parse(expression);
        let result = fn(myContext);
        assert.equal(result, 6);

        expression = "A = { ROUNDUP(5.1242, 1) }"
        fn = parser.parse(expression);
        result = fn(myContext);
        assert.equal(result, 5.2);

        expression = "A = { ROUNDUP(5.1242, 2) }"
        fn = parser.parse(expression);
        result = fn(myContext);
        assert.equal(result, 5.13);

        expression = "A = { ROUNDUP(5.1242, 3) }"
        fn = parser.parse(expression);
        result = fn(myContext);
        assert.equal(result, 5.125);

        expression = "A = { ROUNDUP(27842.5, -1) }"
        fn = parser.parse(expression);
        result = fn(myContext);
        assert.equal(result, 27850);

        expression = "A = { ROUNDUP(27842.5, -2) }"
        fn = parser.parse(expression);
        result = fn(myContext);
        assert.equal(result, 27900);

        expression = "A = { ROUNDUP(27842.5, -3) }"
        fn = parser.parse(expression);
        result = fn(myContext);
        assert.equal(result, 28000);

    });

    it ('ROUNDDOWN Function', function () {

        let myContext = new Context();

        let expression = "A = { ROUNDDOWN(5.1242, 0) }"
        let fn = parser.parse(expression);
        let result = fn(myContext);
        assert.equal(result, 5);

        expression = "A = { ROUNDDOWN(5.1242, 1) }"
        fn = parser.parse(expression);
        result = fn(myContext);
        assert.equal(result, 5.1);

        expression = "A = { ROUNDDOWN(5.1242, 2) }"
        fn = parser.parse(expression);
        result = fn(myContext);
        assert.equal(result, 5.12);

        expression = "A = { ROUNDDOWN(5.1242, 3) }"
        fn = parser.parse(expression);
        result = fn(myContext);
        assert.equal(result, 5.124);

        expression = "A = { ROUNDDOWN(27842.5, -1) }"
        fn = parser.parse(expression);
        result = fn(myContext);
        assert.equal(result, 27840);

        expression = "A = { ROUNDDOWN(27842.5, -2) }"
        fn = parser.parse(expression);
        result = fn(myContext);
        assert.equal(result, 27800);

        expression = "A = { ROUNDDOWN(27842.5, -3) }"
        fn = parser.parse(expression);
        result = fn(myContext);
        assert.equal(result, 27000);


    });

    it ('ABS Function', function () {
        let myContext = new Context();

        let expression = "A = { ABS(-5.1242, 0) }"
        let fn = parser.parse(expression);
        let result = fn(myContext);
        assert.equal(result, 5.1242);
    });

    it ('ODD Function', function () {
        let myContext = new Context();

        let expression = "A = { ODD(5, 0) }"
        let fn = parser.parse(expression);
        let result = fn(myContext);
        assert.equal(result, 5);

        expression = "A = { ODD(6, 0) }"
        fn = parser.parse(expression);
        result = fn(myContext);
        assert.equal(result, 5);

    });

    it ('EVEN Function', function () {
        let myContext = new Context();

        let expression = "A = { EVEN(5, 0) }"
        let fn = parser.parse(expression);
        let result = fn(myContext);
        assert.equal(result, 6);

        expression = "A = { EVEN(6, 0) }"
        fn = parser.parse(expression);
        result = fn(myContext);
        assert.equal(result, 6);
    });

    it ('SIGN Function', function () {
        let myContext = new Context();

        let expression = "A = { SIGN(5) }"
        let fn = parser.parse(expression);
        let result = fn(myContext);
        assert.equal(result, 1);

        expression = "A = { SIGN(-5) }"
        fn = parser.parse(expression);
        result = fn(myContext);
        assert.equal(result, -1);

        expression = "A = { SIGN(0) }"
        fn = parser.parse(expression);
        result = fn(myContext);
        assert.equal(result, 0);

    });

    it ('POWER Function', function () {
        let myContext = new Context();

        let expression = "A = { POWER(5, 2) }"
        let fn = parser.parse(expression);
        let result = fn(myContext);
        assert.equal(result, 5 * 5);

        expression = "A = { POWER(6, 3) }"
        fn = parser.parse(expression);
        result = fn(myContext);
        assert.equal(result, 6 * 6 * 6);
    });

    it ('SUM Function', function () {

        let table = [{V:1},{V:1},{V:true},{V:"1"},{V:1},{V:1},{V:1.1}];

        let myContext = new Context(null, {table:table}, null);

        let expression = "context { A } A = { SUM([V]) }"
        let fn = parser.parse(expression);

        let result = fn(myContext);
        assert.equal(result, 7.1);

    });

    it ('SUMIF Function', function () {

        let table = [{V:1, A:""},{V:1, A:""},{V:1, A:"Y"},{V:1.2, A:"Y"},{V:1, A:""},{V:1, A:""},{V:1.1, A:""}];

        let myContext = new Context(null, {table:table}, null);

        let expression = 'context { A } A = { SUMIF([A], "Y", [V]) }'
        let fn = parser.parse(expression);

        let result = fn(myContext);
        assert.equal(result, 2.2);
    });

    it ('SUMIF Function (bool == 1)', function () {

        let table = [{V:1, A:false},{V:1, A:false},{V:1, A:true},{V:1.2, A:true},{V:1, A:false},{V:1, A:false},{V:1.1, A:false}];

        let myContext = new Context(null, {table:table}, null);

        let expression = 'context { A } A = { SUMIF([A], 1, [V]) }'
        let fn = parser.parse(expression);

        let result = fn(myContext);
        assert.equal(result, 2.2);

    }); 

    // it ('SUMIF Function (bool == true)', function () {

    //     let table = [{V:1, A:false},{V:1, A:false},{V:1, A:true},{V:1.2, A:true},{V:1, A:false},{V:1, A:false},{V:1.1, A:false}];

    //     let myContext = new Context(null, {table:table}, null);

    //     let expression = 'A = { SUMIF([A], TRUE, [V]) }'
    //     let fn = parser.parse(expression);

    //     let result = fn(myContext);
    //     assert.equal(result, 2.2);


    // });

    it ('COUNT Function', function () {

        let table = [{V:1},{V:1},{V:1},{V:1},{V:1},{V:1},{V:1.1}];

        let myContext = new Context(null, {table:table}, null);

        let expression = "context { A } A = { COUNT([V]) }"
        let fn = parser.parse(expression);

        let result = fn(myContext);
        assert.equal(result, 7);

    });

    it ('COUNTIF Function', function () {

        let table = [{V:1, A:""},{V:1, A:""},{V:1, A:"Y"},{V:1.2, A:"Y"},{V:1, A:""},{V:1, A:""},{V:1.1, A:""}];

        let myContext = new Context(null, {table:table}, null);

        let expression = 'context { A } A = { COUNTIF([A], "Y", [V]) }'
        let fn = parser.parse(expression);

        let result = fn(myContext);
        assert.equal(result, 2);

    });

    it ('DATE Function', function () {

        let myContext = new Context();
        let expression = 'A = { DATE(2012, 2, 1) }'
        expression += 'B = { DATE("2012-02-01") }'
        expression += 'C = { DATE() }'
        let fn = parser.parse(expression);

        let result = fn(myContext);
        //Tenho de ver a forma correcta de fazer assert a isto

    });

    it ('ROMAN Function', function () {

        let myContext = new Context();
        let expression = 'A = { ROMAN(2012) }'
        let fn = parser.parse(expression);
        let result = fn(myContext);

        assert.equal(result, "MMXII");

    });

    it ('LOOKUP Function', function () {

        let table = [{V:1, A:"A"},{V:2, A:"B"},{V:3, A:"C"},{V:4, A:"D"},{V:5, A:"E"},{V:6, A:"F"},{V:7, A:"G"}];

        let myContext = new Context(null, {table:table}, null);;
        let expression = 'context { A } A = { LOOKUP("E", [A], [V]) }'
        let fn = parser.parse(expression);
        let result = fn(myContext);
        
        //console.log(fn.toString());

        assert.equal(result, 5);

    });

    it ('INDEX Function', function () {

        let table = [{V:1, A:"A"},{V:2, A:"B"},{V:3, A:"C"},{V:4, A:"D"},{V:5, A:"E"},{V:6, A:"F"},{V:7, A:"G"}];

        let myContext = new Context(null, {table:table}, null);;
        let expression = 'context { A } A = { INDEX([A], 6) }'
        let fn = parser.parse(expression);
        let result = fn(myContext);

        assert.equal(result, "F");

    });

    it ('MATCH Function', function () {

        let table = [{V:1, A:"A"},{V:2, A:"B"},{V:3, A:"C"},{V:4, A:"D"},{V:5, A:"E"},{V:6, A:"F"},{V:7, A:"G"}];

        let myContext = new Context(null, {table:table}, null);;
        let expression = 'context { A } A = { MATCH("G", [A], 0) }'
        let fn = parser.parse(expression);
        let result = fn(myContext);

        assert.equal(result, 7);

    });

    it ('MIN Function', function () {

        let table = [{A:3},{A:2},{A:1},{A:10},{A:9},{A:8},{A:7},{A:11},{A:12},{A:13},{A:6},{A:5}];

        let myContext = new Context(null, {table:table}, null);;
        let expression = 'context { A } A = { MIN([A]) }'
        let fn = parser.parse(expression);
        let result = fn(myContext);

        assert.equal(result, 1);

    });


    it ('MAX Function', function () {

        let table = [{A:3},{A:2},{A:1},{A:10},{A:9},{A:8},{A:7},{A:11},{A:12},{A:13},{A:6},{A:5}];

        let myContext = new Context(null, {table:table}, null);;
        let expression = 'context { A } A = { MAX([A]) }'
        let fn = parser.parse(expression);
        let result = fn(myContext);

        assert.equal(result, 13);

    });

    it ('LEN Function', function () {

        let myContext = new Context();;
        let expression = 'A = { LEN("Hello World.") }'
        let fn = parser.parse(expression);
        let result = fn(myContext);

        assert.equal(result, 12);

    });

    it ('LOWER Function', function () {

        let myContext = new Context();;
        let expression = 'A = { LOWER("Hello World.") }'
        let fn = parser.parse(expression);
        let result = fn(myContext);

        assert.equal(result, 'hello world.');

    });

    it ('UPPER Function', function () {

        let myContext = new Context();;
        let expression = 'A = { UPPER("Hello World.") }'
        let fn = parser.parse(expression);
        let result = fn(myContext);

        assert.equal(result, 'HELLO WORLD.');

    });

    it ('TRIM Function', function () {

        let myContext = new Context();;
        let expression = 'A = { TRIM("\t   Hello World.\t ") }'
        let fn = parser.parse(expression);
        let result = fn(myContext);

        assert.equal(result, 'Hello World.');

    });

    

    it ('ISEVEN Function', function () {

        let myContext = new Context();;
        let expression = 'A = { ISEVEN(12) }'
        let fn = parser.parse(expression);
        let result = fn(myContext);

        assert.equal(result, true);

        myContext = new Context();;
        expression = 'A = { ISEVEN(13) }'
        fn = parser.parse(expression);
        result = fn(myContext);

        assert.equal(result, false);

    });

    it ('ISODD Function', function () {

        let myContext = new Context();;
        let expression = 'A = { ISODD(12) }'
        let fn = parser.parse(expression);
        let result = fn(myContext);

        assert.equal(result, false);

        myContext = new Context();;
        expression = 'A = { ISODD(13) }'
        fn = parser.parse(expression);
        result = fn(myContext);

        assert.equal(result, true);

    });

    it ('ISLOGICAL Function', function () {

        let myContext = new Context();;
        let expression = 'A = { ISLOGICAL(2 = 2) }'
        let fn = parser.parse(expression);
        let result = fn(myContext);

        assert.equal(result, true);

        myContext = new Context();;
        expression = 'A = { ISLOGICAL(2 > 2) }'
        fn = parser.parse(expression);
        result = fn(myContext);

        assert.equal(result, true);

        myContext = new Context();;
        expression = 'A = { ISLOGICAL(1) }'
        fn = parser.parse(expression);
        result = fn(myContext);

        assert.equal(result, false);

        myContext = new Context();;
        expression = 'A = { ISLOGICAL(0) }'
        fn = parser.parse(expression);
        result = fn(myContext);

        assert.equal(result, false);

        myContext = new Context();;
        expression = 'A = { ISLOGICAL("true") }'
        fn = parser.parse(expression);
        result = fn(myContext);

        assert.equal(result, false);

    });



    it ('ISTEXT Function', function () {
        let myContext = new Context();
        let expression = 'A = { ISTEXT("Foo") }'
        let fn = parser.parse(expression);
        let result = fn(myContext);
        assert.equal(result, true);

        myContext = new Context();
        expression = 'A = { ISTEXT(10) }'
        fn = parser.parse(expression);
        result = fn(myContext);
        assert.equal(result, false);

        myContext = new Context();
        expression = 'A = { ISTEXT(10 > 10) }'
        fn = parser.parse(expression);
        result = fn(myContext);
        assert.equal(result, false);

    });

    it ('ISNONTEXT Function', function () {

        let myContext = new Context();
        let expression = 'A = { ISNONTEXT("Foo") }'
        let fn = parser.parse(expression);
        let result = fn(myContext);
        assert.equal(result, false);

        myContext = new Context();
        expression = 'A = { ISNONTEXT(10) }'
        fn = parser.parse(expression);
        result = fn(myContext);
        assert.equal(result, true);

        myContext = new Context();
        expression = 'A = { ISNONTEXT(10 > 10) }'
        fn = parser.parse(expression);
        result = fn(myContext);
        assert.equal(result, true);

    });

    it ('ISNUMBER Function', function () {
        
        let myContext = new Context();
        let expression = 'A = { ISNUMBER("Foo") }'
        let fn = parser.parse(expression);
        let result = fn(myContext);
        assert.equal(result, false);

        myContext = new Context();
        expression = 'A = { ISNUMBER(10) }'
        fn = parser.parse(expression);
        result = fn(myContext);
        assert.equal(result, true);

    });


    


});