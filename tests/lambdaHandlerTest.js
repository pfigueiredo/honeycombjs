/*jslint node: true */
'use strict';

var handler = require("../index").handler;
var assert = require('assert');
var examples = require('./timesheetData');
var examples2 = require('./timesheetData2');

describe('Lambda', function () {

    it ('Must be able to run multiple tables', function () {

        var executionParameters = {
            Expressions: [],
            Context: []
        };

        executionParameters.Expressions.push({Variable:"Quant", Expression:"2"});
        executionParameters.Expressions.push({Variable:"BWS441", Expression:"12 / Quant"});
        executionParameters.Expressions.push({Variable:"BWS442.Quantity", Expression:"Quant"});
        executionParameters.Context.push({ Id: 1, Data: { table1:[], table2:[] }, Variables: {Quant:{value:2}} });
        executionParameters.Context.push({ Id: 2, Data: { table1:[], table2:[] }, Variables: {Quant:{value:3}} });
        executionParameters.Exports = ["BWS441", "BWS442"];

        //console.log(JSON.stringify(executionParameters, null, 2));

        var ret = handler(
            executionParameters,
            null, null
        )

        //console.log(JSON.stringify(ret, null, 2));

        assert.equal(ret.Result[0].Id, 1);
        assert.equal(ret.Result[1].Id, 2);
        
        assert.equal(ret.Result[0].ResultItems["BWS441"], 6);
        assert.equal(ret.Result[0].ResultItems["BWS442"].Quantity, 2);


    });

    

});