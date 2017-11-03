'use strict'

var parser = require("../rLang").parser;
var DataTable = require("../dataTable");
var Context = require("../context");
var assert = require('assert');

describe('Domain Functions', function () {

    it ('IRS Function', function () {


        let irsTable = [
            {
                DetailId: 0,
                Year: 0,
                IRSTableId: 1,
                IRSConditionId: 2,
                Wage: 100,
                NumOfDependants: 2,
                TaxPercentage: 2
            },
            {
                DetailId: 0,
                Year: 0,
                IRSTableId: 1,
                IRSConditionId: 2,
                Wage: 900,
                NumOfDependants: 2,
                TaxPercentage: 5
            }
        ]

        let EMP = { 
            name: "Luis",
            PT: {
                IRS: {
                    Table: 1,
                    Condition: 2,
                    TaxPercentage: 0.22,
                    NumOfDependants: 2
                }
            }
        };

        let myContext = new Context({Employee: EMP}, {IRS: irsTable}, null);

        let expression = "R = { PT.IRS(501) }";

        let fn = parser.parse(expression);
        let result = fn(myContext);
        assert.equal(result, 5);



    });


});