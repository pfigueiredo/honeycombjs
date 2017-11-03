'use strict'

var parser = require("../rLang").parser;
var DataTable = require("../dataTable");
var Context = require("../context");
var assert = require('assert');
var bug1 = require('./bug1Data').bug1Data;
var bug2 = require('./bug2Data').bug2Data;
var bug3 = require('./bug3Data').bug3Data;
var bug4 = require('./bug4Data').bug4Data;
var handler = require("../index").handler;

describe('Bugs', function () {
    // it ('Bug1 08.10.2016', function () {
    //     let myContext = new Context();
    //     var executionParameters = bug1;

    //     var ret = handler(
    //         executionParameters,
    //         null, null
    //     );

    //     // console.log(JSON.stringify(ret, null, 2));

    // });

    // it ('Bug1.1 08.16.2016', function () {
    //     let myContext = new Context();
    //     var executionParameters = {
    //         "Expressions": [
    //         {
    //             "Variable": "@P1",
    //             "Expression": "[SR[0]]",
    //             "Order": 0
    //         },
    //         {
    //             "Variable": "@P2",
    //             "Expression": "$SR[0]",
    //             "Order": 0
    //         },
    //         {
    //             "Variable": "@P3",
    //             "Expression": "INDEX([SR],1)",
    //             "Order": 0
    //         }
    //         ],
    //         "Context": [
    //         {
    //             "Data": {
    //             "DefaultTable": "UnitValue_Inputs",
    //             "UnitValue_Inputs": [
    //                 {
    //                 "VB": 530.00000000000000000000000000,
    //                 "SR": 6.3000000000000000000000000000,
    //                 "PNT": 40
    //                 }
    //             ]
    //             },
    //             "DebugExecutionResult": false
    //         }
    //         ]
    //     };

    //     var ret = handler(
    //         executionParameters,
    //         null, null
    //     );

    //     // console.log(JSON.stringify(ret, null, 2));

    // });

    // it ('Bug2 11.21.2016', function () {
    //     let myContext = new Context();
    //     var executionParameters = bug2;

    //     var ret = handler(
    //         executionParameters,
    //         null, null
    //     );

    //     //console.log(JSON.stringify(ret, null, 2));

    // });

    // it ('Bug3 12.15.2016', function () {
    //     let myContext = new Context();
    //     var executionParameters = bug3;

    //     var ret = handler(
    //         executionParameters,
    //         null, null
    //     );

    //     console.log(JSON.stringify(ret, null, 2));

    // });

    // it ('Bug4 01.06.2017', function () {
    //     let myContext = new Context();
    //     var executionParameters = bug4;

    //     var ret = handler(
    //         executionParameters,
    //         null, null
    //     );

    //     console.log(JSON.stringify(ret, null, 2));

    // });


});