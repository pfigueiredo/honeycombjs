/*jslnode: true */
'use strict';

require('js-array-extensions');
var moment = require('moment');
var predicates = require('./predicates');
var fnHelpers = require('./fnHelpers');
var DataTable = require('./dataTable');

var fn = {};
module.exports = fn;

var v = fnHelpers.getValue;

fn.PT_IRS = function(employee, irsTable, value) {

    const IRSTableCol = 3;
    const IRSConditionCol = 4;
    const WageCol = 5;
    const NumOfDependants = 6;
    const TaxCol = 7;

    var tax = 0;
    try {
        if (employee && irsTable && irsTable.values) {
            //IRS Table is expected to be in the correct order
            //Order by NumOfDependants DESC, Wage ASC, Year DESC
            for (var i = 0; i < irsTable.values.length; i++) {
            if (
                employee.PT.IRS.Table === irsTable.values[i][IRSTableCol]
                && employee.PT.IRS.Condition === irsTable.values[i][IRSConditionCol]
                && employee.PT.IRS.NumOfDependants >= irsTable.values[i][NumOfDependants]
                && value <= irsTable.values[i][WageCol]
                ) {
                    return irsTable.values[i][TaxCol];
                } 
            }
        }
    } catch (error) {
        Console.log('Error running function PT_IRS');
    }
    return tax;
}

fn.PT_IRS.deps = "Employee, IRS,"; //Dependency injection'

fn.PT_TSU = function (employee, tsuTable, getIncubency) {
    
    const TSUConditionCol = 3;
    const TSUEmployeeTaxCol = 4;
    const TSUCompanyTaxCol = 5;

    if (employee && tsuTable && tsuTable.values) {
        for (var i = 0; i < tsuTable.values.length; i++) {
            if (employee.PT.TSU.Condition === tsuTable.values[i][TSUConditionCol]) {
                return (getIncubency) 
                    ? tsuTable.values[i][TSUCompanyTaxCol]
                    : tsuTable.values[i][TSUEmployeeTaxCol]
            } 
        }
    }

    return 0;
}

fn.PT_TSU.deps = "Employee, TSU,";