'use strict'

var parser = require("../rLang").parser;
var DataTable = require("../dataTable");
var Context = require("../context");
var assert = require('assert');

describe('Functions over multidimentional arrays', function () {
    it ('Add Function', function () {

        let mArray = [2, [2, 2, 2], 2, [2, [2, 2]]];
        let myContext = new Context({A: mArray}, null, null);
        let expression = "context { A, B } R = { A + 1 }";

        var fn = parser.parse(expression);

        // console.log(fn.toString());

        var result = fn(myContext);
        assert.deepEqual(result, [3, [3, 3, 3], 3, [3, [3, 3]]]);

    });

    it ('Subtract Function', function () {

        let mArray = [2, [2, 2, 2], 2, [2, [2, 2]]];
        let myContext = new Context({A: mArray}, null, null);
        let expression = "context { A } R = { A - 1 }";
        var fn = parser.parse(expression);

        var result = fn(myContext);
        assert.deepEqual(result, [1, [1, 1, 1], 1, [1, [1, 1]]]);

    });

    it ('Negative Function', function () {

        let mArray = [2, [2, 2, 2], 2, [2, [2, 2]]];
        let myContext = new Context({A: mArray}, null, null);
        let expression = "context { A } R = { -A  }";
        var fn = parser.parse(expression);

        var result = fn(myContext);
        assert.deepEqual(result, [-2, [-2, -2, -2], -2, [-2, [-2, -2]]]);

    });

    it ('SUM Function', function () {

        let mArray = [2, [2, 2, 2], 2, [2, [2, 2]]];
        let myContext = new Context({A: mArray}, null, null);
        let expression = "context { A } R = { SUM(A)  }";
        var fn = parser.parse(expression);

        var result = fn(myContext);
        assert.equal(result, 16);

        expression = "context { A } R = { SUM(A, 1)  }";
        fn = parser.parse(expression);

        result = fn(myContext);
        assert.equal(result, 17);

    });

    it ('COUNT Function', function () {

        let mArray = [2, [2, 2, 2], 2, [2, [2, 2]]];
        let myContext = new Context({A: mArray}, null, null);
        let expression = "context { A } R = { COUNT(A)  }";
        var fn = parser.parse(expression);

        var result = fn(myContext);
        assert.equal(result, 8);

    });

});

describe('Basic Array Functions', function () {

    it ('IF Function', function () {

        let myContext = new Context();

        let expression = "A = { IF({1, 2} = 1, 2, 1) }"
        let fn = parser.parse(expression);
        let result = fn(myContext);
        assert.deepEqual(result, [2, 1]);


    });

    it ('AND Function', function () {

        let myContext = new Context();

        let expression = "A = { IF(AND({1, 1} = 1, {2, 1} = 2), 2, 1) }"
        let fn = parser.parse(expression);
        let result = fn(myContext);
        assert.deepEqual(result, [2, 1]);


    });

    it ('OR Function', function () {

        let myContext = new Context();

        let expression = "A = { IF(OR({1, 1} = 0, {2, 1} = 2), 2, 1) }"
        let fn = parser.parse(expression);
        let result = fn(myContext);
        assert.deepEqual(result, [2, 1]);

    });

    it ('ROUND Function', function () {

        let myContext = new Context();

        let expression = "A = { ROUND({12.22232, 12.22232}, 2) }"
        let fn = parser.parse(expression);
        let result = fn(myContext);
        assert.deepEqual(result, [12.22, 12.22]);


        expression = "A = { ROUND({12.22632, 12.22632}, {2,3}) }"
        fn = parser.parse(expression);
        result = fn(myContext);
        assert.deepEqual(result, [12.23, 12.226]);

    });

    it ('ROUNDUP Function', function () {

        let myContext = new Context();

        let expression = "A = { ROUNDUP({5.1242}, 0) }"
        let fn = parser.parse(expression);
        let result = fn(myContext);
        assert.deepEqual(result, [6]);

        expression = "A = { ROUNDUP({5.1242}, 1) }"
        fn = parser.parse(expression);
        result = fn(myContext);
        assert.deepEqual(result, [5.2]);

        expression = "A = { ROUNDUP({5.1242}, 2) }"
        fn = parser.parse(expression);
        result = fn(myContext);
        assert.deepEqual(result, [5.13]);

        expression = "A = { ROUNDUP({5.1242}, 3) }"
        fn = parser.parse(expression);
        result = fn(myContext);
        assert.deepEqual(result, [5.125]);

        expression = "A = { ROUNDUP({27842.5}, -1) }"
        fn = parser.parse(expression);
        result = fn(myContext);
        assert.deepEqual(result, [27850]);

        expression = "A = { ROUNDUP({27842.5}, -2) }"
        fn = parser.parse(expression);
        result = fn(myContext);
        assert.deepEqual(result, [27900]);

        expression = "A = { ROUNDUP({27842.5}, -3) }"
        fn = parser.parse(expression);
        result = fn(myContext);
        assert.deepEqual(result, [28000]);

    });

    it ('ROUNDDOWN Function', function () {

        let myContext = new Context();

        let expression = "A = { ROUNDDOWN({5.1242}, 0) }"
        let fn = parser.parse(expression);
        let result = fn(myContext);
        assert.deepEqual(result, [5]);

        expression = "A = { ROUNDDOWN({5.1242}, 1) }"
        fn = parser.parse(expression);
        result = fn(myContext);
        assert.deepEqual(result, [5.1]);

        expression = "A = { ROUNDDOWN({5.1242}, 2) }"
        fn = parser.parse(expression);
        result = fn(myContext);
        assert.deepEqual(result, [5.12]);

        expression = "A = { ROUNDDOWN({5.1242}, 3) }"
        fn = parser.parse(expression);
        result = fn(myContext);
        assert.deepEqual(result, [5.124]);

        expression = "A = { ROUNDDOWN({27842.5}, -1) }"
        fn = parser.parse(expression);
        result = fn(myContext);
        assert.deepEqual(result, [27840]);

        expression = "A = { ROUNDDOWN({27842.5}, -2) }"
        fn = parser.parse(expression);
        result = fn(myContext);
        assert.deepEqual(result, [27800]);

        expression = "A = { ROUNDDOWN({27842.5}, -3) }"
        fn = parser.parse(expression);
        result = fn(myContext);
        assert.deepEqual(result, [27000]);


    });

    it ('ABS Function', function () {
        let myContext = new Context();

        let expression = "A = { ABS({-5.1242, -5.1241}, 0) }"
        let fn = parser.parse(expression);
        let result = fn(myContext);
        assert.deepEqual(result, [5.1242, 5.1241]);
    });

    it ('ODD Function', function () {
        let myContext = new Context();

        let expression = "A = { ODD({5}, 0) }"
        let fn = parser.parse(expression);
        let result = fn(myContext);
        assert.deepEqual(result, [5]);

        expression = "A = { ODD({6}, 0) }"
        fn = parser.parse(expression);
        result = fn(myContext);
        assert.deepEqual(result, [5]);

    });

    it ('EVEN Function', function () {
        let myContext = new Context();

        let expression = "A = { EVEN({5}, 0) }"
        let fn = parser.parse(expression);
        let result = fn(myContext);
        assert.deepEqual(result, [6]);

        expression = "A = { EVEN({6}) }"
        fn = parser.parse(expression);
        result = fn(myContext);
        assert.deepEqual(result, [6]);
    });

    it ('SIGN Function', function () {
        let myContext = new Context();

        let expression = "A = { SIGN({5}) }"
        let fn = parser.parse(expression);
        let result = fn(myContext);
        assert.deepEqual(result, [1]);

        expression = "A = { SIGN({-5, 5}) }"
        fn = parser.parse(expression);
        result = fn(myContext);
        assert.deepEqual(result, [-1, 1]);

        expression = "A = { SIGN({0}) }"
        fn = parser.parse(expression);
        result = fn(myContext);
        assert.deepEqual(result, [0]);

    });

    it ('POWER Function', function () {
        let myContext = new Context();

        let expression = "A = { POWER(5, {2, 3}) }"
        let fn = parser.parse(expression);
        let result = fn(myContext);
        assert.deepEqual(result, [5 * 5, 5 * 5 * 5]);

        expression = "A = { POWER(6, {3}) }"
        fn = parser.parse(expression);
        result = fn(myContext);
        assert.deepEqual(result, [6 * 6 * 6]);
    });

    it ('ROMAN Function', function () {

        let myContext = new Context();
        let expression = 'A = { ROMAN({2012}) }'
        let fn = parser.parse(expression);
        let result = fn(myContext);

        assert.deepEqual(result, ["MMXII"]);

    });

    it ('ISEVEN Function', function () {

        let myContext = new Context();;
        let expression = 'A = { ISEVEN({12}) }'
        let fn = parser.parse(expression);
        let result = fn(myContext);

        assert.deepEqual(result, [true]);

        myContext = new Context();;
        expression = 'A = { ISEVEN({13}) }'
        fn = parser.parse(expression);
        result = fn(myContext);

        assert.deepEqual(result, [false]);

    });

    it ('ISODD Function', function () {

        let myContext = new Context();;
        let expression = 'A = { ISODD({12}) }'
        let fn = parser.parse(expression);
        let result = fn(myContext);

        assert.deepEqual(result, [false]);

        myContext = new Context();;
        expression = 'A = { ISODD({13}) }'
        fn = parser.parse(expression);
        result = fn(myContext);

        assert.deepEqual(result, [true]);

    });

    it ('ISLOGICAL Function', function () {

        let myContext = new Context();;
        let expression = 'A = { ISLOGICAL({2} = 2) }'
        let fn = parser.parse(expression);
        let result = fn(myContext);

        assert.deepEqual(result, [true]);

        myContext = new Context();
        expression = 'A = { ISLOGICAL({2} > 2) }'
        fn = parser.parse(expression);
        result = fn(myContext);

        assert.deepEqual(result, [true]);

        myContext = new Context();
        expression = 'A = { ISLOGICAL({1}) }'
        fn = parser.parse(expression);
        result = fn(myContext);

        assert.deepEqual(result, [false]);

        myContext = new Context();;
        expression = 'A = { ISLOGICAL({0}) }'
        fn = parser.parse(expression);
        result = fn(myContext);

        assert.deepEqual(result, [false]);

        myContext = new Context();
        expression = 'A = { ISLOGICAL({"true"}) }'
        fn = parser.parse(expression);
        result = fn(myContext);

        assert.deepEqual(result, [false]);

    });



    it ('ISTEXT Function', function () {
        let myContext = new Context();
        let expression = 'A = { ISTEXT({"Foo"}) }'
        let fn = parser.parse(expression);
        let result = fn(myContext);
        assert.deepEqual(result, [true]);

        myContext = new Context();
        expression = 'A = { ISTEXT({10}) }'
        fn = parser.parse(expression);
        result = fn(myContext);
        assert.deepEqual(result, [false]);

        myContext = new Context();
        expression = 'A = { ISTEXT({10} > 10) }'
        fn = parser.parse(expression);
        result = fn(myContext);
        assert.deepEqual(result, [false]);

    });

    it ('ISNONTEXT Function', function () {

        let myContext = new Context();
        let expression = 'A = { ISNONTEXT({"Foo"}) }'
        let fn = parser.parse(expression);
        let result = fn(myContext);
        assert.deepEqual(result, [false]);

        myContext = new Context();
        expression = 'A = { ISNONTEXT({10}) }'
        fn = parser.parse(expression);
        result = fn(myContext);
        assert.deepEqual(result, [true]);

        myContext = new Context();
        expression = 'A = { ISNONTEXT({10} > {10}) }'
        fn = parser.parse(expression);
        result = fn(myContext);
        assert.deepEqual(result, [true]);

    });

    it ('ISNUMBER Function', function () {
        
        let myContext = new Context();
        let expression = 'A = { ISNUMBER({"Foo", 10}) }'
        let fn = parser.parse(expression);
        let result = fn(myContext);
        assert.deepEqual(result, [false, true]);

        myContext = new Context();
        expression = 'A = { ISNUMBER({10}) }'
        fn = parser.parse(expression);
        result = fn(myContext);
        assert.deepEqual(result, [true]);

    });
});