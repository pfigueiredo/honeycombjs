/*jslnode: true */
'use strict';

require('js-array-extensions');
var moment = require('moment');
var predicates = require('./predicates');
var fnHelpers = require('./fnHelpers');

var fn = {};
module.exports = fn;

var v = fnHelpers.getValue;

function _roman(num) {
    if (isNaN(num)) { return ""; }

    var romanNumerals = [
        ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX"], // ones
        ["", "X", "XX", "XXX", "XL", "L", "LX", "LXX", "LXXX", "XC"], // tens
        ["", "C", "CC", "CCC", "CD", "D", "DC", "DCC", "DCCC", "CM"], // hundreds
        ["", "M", "MM", "MMM", "(IV)", "(V)", "(VI)", "(VII)", "(VIII)" , "(XI)" ], // thousands
        ["", "(X)", "(XX)", "(XXX)", "(XL)", "(L)", "(LX)", "(LXX)", "(LXXX)", "(XC)"],
        ["", "(C)", "(CC)", "(CCC)", "(CD)", "(D)", "(DC)", "(DCC)", "(DCCC)", "(CM)"],
        ["", "(M)", "(MM)", "(MMM)", "[IV]", "[V]", "[VI]", "[VII]", "[VIII]" , "[XI]" ],
        ["", "[X]", "[XX]", "[XXX]", "[XL]", "[L]", "[LX]", "[LXX]", "[LXXX]", "[XC]"],
        ["", "[C]", "[CC]", "[CCC]", "[CD]", "[D]", "[DC]", "[DCC]", "[DCCC]", "[CM]"]
    ];

    if (num > 999999999) { return "#ERR"; }

    var intArr = (num).toString().split('').reverse();
    var len = intArr.length;
    var romanNumeral = "";
    var i = len;

    while (i-- > 0) {
        romanNumeral += romanNumerals[i][Number(intArr[i])];
    }

    return romanNumeral.replace(")(", "").replace("][", "");
}

fn.ROMAN = function(num) {
    if (Array.anyArray(num)) { 
        return _roman.crossApply(num);
    } 
    return _roman(num);
}

fn.MIN = function() {
    return Array.flatten.apply(null, arguments).min();
}

fn.MAX = function() {
    return Array.flatten.apply(null, arguments).max();
}

fn.COUNT = function() {
    var values = Array.flatten.apply(null, arguments);
    var ret = 0;

    for (var i = 0; i < values.length; i++) {
        if (values[i])
            ret++;
    }
    return ret;
}

fn.COUNTIF = function(range, criteria) {
    var ret = 0;
    var values = Array.normalize(range);
    var fnCriteria = new predicates.checkCriteria(criteria);

    for (var i = 0; i < values.length; i++) {
        try {
            var obj = values[i];
            if (fnCriteria(obj, i) && obj != null && obj !== undefined) {
                ret++;
            }
        } catch (err) { }
    }
    return ret;
}

fn.SUM = function(range) {
    var ret = 0;
    var values = Array.flatten.apply(null, arguments);
    for (var i = 0; i < values.length; i++) {
        try {
            var obj = values[i];
            if (!isNaN(obj))
                ret += Number(obj);
        } catch (err) { }
    }
    return ret;
}
fn.SUMIF = function(range, criteria, sumRange) {

    if (sumRange === undefined) sumRange = range;

    var r1 = Array.normalize(range);
    var r2 = Array.normalize(sumRange);
    var fnCriteria = new predicates.checkCriteria(criteria);
    var result = 0;
    var count = (r1.length > r2.length) ? r1.length : r2.length; 
    
    for (var i = 0; i < r1.length && i < r2.length; i++) {
        var valR1 = r1[i];
        var valR2 = r2[i];
        if (fnCriteria(valR1, i) && !isNaN(valR2)) {
            result += Number(valR2);
        }
    }

    return result;

}

fn.SUMPRODUCT = function(range1, range2) { throw { Message: "Not Implemented" }; }
fn.SUMSQ = function(a, p) { throw { Message: "Not Implemented" }; }
fn.SUMX2MY2 = function() { throw { Message: "Not Implemented" }; }
fn.SUMX2PY2 = function() { throw { Message: "Not Implemented" }; }
fn.SUMXMY2 = function() { throw { Message: "Not Implemented" }; }
fn.TRUNC = function() { throw { Message: "Not Implemented" }; }
fn.ASC = function() { throw { Message: "Not Implemented" }; }
fn.BAHTTEXT = function() { throw { Message: "Not Implemented" }; }
fn.CHAR = function() { throw { Message: "Not Implemented" }; }
fn.CLEAN = function() { throw { Message: "Not Implemented" }; }
fn.CODE = function() { throw { Message: "Not Implemented" }; }
fn.CONCATENATE = function() { throw { Message: "Not Implemented" }; }
fn.DOLLAR = function() { throw { Message: "Not Implemented" }; }
fn.EXACT = function() { throw { Message: "Not Implemented" }; }
fn.FIND = function() { throw { Message: "Not Implemented" }; }
fn.FIXED = function() { throw { Message: "Not Implemented" }; }
fn.JIS = function() { throw { Message: "Not Implemented" }; }
fn.LEFT = function() { throw { Message: "Not Implemented" }; }

function _len(value) {
    return (value != null) ? value.toString().length : 0;
}

fn.LEN = function(value) {
    if (Array.anyArray(value)) { 
        return _len.crossApply(value);
    } 
    return _len(value);  
}

function _lower(value) {
    return (value != null) ? value.toString().toLowerCase() : null;
}

fn.LOWER = function(value) { 
    if (Array.anyArray(value)) { 
        return _lower.crossApply(value);
    } 
    return _lower(value);
}

fn.MID = function() { throw { Message: "Not Implemented" }; }
fn.PHONETIC = function() { throw { Message: "Not Implemented" }; }
fn.PROPER = function() { throw { Message: "Not Implemented" }; }
fn.REPLACE = function() { throw { Message: "Not Implemented" }; }
fn.REPT = function() { throw { Message: "Not Implemented" }; }
fn.RIGHT = function() { throw { Message: "Not Implemented" }; }
fn.SEARCH = function() { throw { Message: "Not Implemented" }; }
fn.SUBSTITUTE = function() { throw { Message: "Not Implemented" }; }

function _t(value) {
    return (typeof(value) === 'string') ? value.toString() : "";
}

fn.T = function(value) {
    if (Array.anyArray(value)) { 
        return _t.crossApply(value);
    } 
    return _t(value);
}

function _text(value) {
    return (value != null) ? value.toString() : null;
}

fn.TEXT = function(value) {
    if (Array.anyArray(value)) { 
        return _text.crossApply(value);
    } 
    return _text(value);
}

function _trim(value) {
    return (value != null) ? value.toString().trim() : null;
}

fn.TRIM = function(value) {
    if (Array.anyArray(value)) { 
        return _trim.crossApply(value);
    } 
    return _trim(value);
}

function _upper(value) {
    return (value != null) ? value.toString().toUpperCase() : null;
}

fn.UPPER = function(value) {
    if (Array.anyArray(value)) { 
        return _upper.crossApply(value);
    } 
    return _upper(value);
}

fn.VALUE = function() { throw { Message: "Not Implemented" }; }
fn.ACCR= function() { throw { Message: "Not Implemented" }; }
fn.ACCRdoubleM = function() { throw { Message: "Not Implemented" }; }
fn.AMORDEGRC = function() { throw { Message: "Not Implemented" }; }
fn.AMORLINC = function() { throw { Message: "Not Implemented" }; }
fn.COUPDAYBS = function() { throw { Message: "Not Implemented" }; }
fn.COUPDAYS = function() { throw { Message: "Not Implemented" }; }
fn.COUPDAYSNC = function() { throw { Message: "Not Implemented" }; }
fn.COUPNCD = function() { throw { Message: "Not Implemented" }; }
fn.COUPNUM = function() { throw { Message: "Not Implemented" }; }
fn.COUPPCD = function() { throw { Message: "Not Implemented" }; }
fn.CUMIPMT = function() { throw { Message: "Not Implemented" }; }
fn.CUMPRINC = function() { throw { Message: "Not Implemented" }; }
fn.DB = function() { throw { Message: "Not Implemented" }; }
fn.DDB = function() { throw { Message: "Not Implemented" }; }
fn.DISC = function() { throw { Message: "Not Implemented" }; }
fn.DOLLARDE = function() { throw { Message: "Not Implemented" }; }
fn.DOLLARFR = function() { throw { Message: "Not Implemented" }; }
fn.DURATION = function() { throw { Message: "Not Implemented" }; }
fn.EFFECT = function() { throw { Message: "Not Implemented" }; }
fn.FV = function() { throw { Message: "Not Implemented" }; }
fn.FVSCHEDULE = function() { throw { Message: "Not Implemented" }; }
fn.doubleRATE = function() { throw { Message: "Not Implemented" }; }
fn.IPMT = function() { throw { Message: "Not Implemented" }; }
fn.IRR = function() { throw { Message: "Not Implemented" }; }
fn.ISPMT = function() { throw { Message: "Not Implemented" }; }
fn.MDURATION = function() { throw { Message: "Not Implemented" }; }
fn.MIRR = function() { throw { Message: "Not Implemented" }; }
fn.NOMINAL = function() { throw { Message: "Not Implemented" }; }
fn.NPER = function() { throw { Message: "Not Implemented" }; }
fn.NPV = function() { throw { Message: "Not Implemented" }; }
fn.ODDFPRICE = function() { throw { Message: "Not Implemented" }; }
fn.ODDFYIELD = function() { throw { Message: "Not Implemented" }; }
fn.ODDLPRICE = function() { throw { Message: "Not Implemented" }; }
fn.ODDLYIELD = function() { throw { Message: "Not Implemented" }; }
fn.PMT = function() { throw { Message: "Not Implemented" }; }
fn.PPMT = function() { throw { Message: "Not Implemented" }; }
fn.PRICE = function() { throw { Message: "Not Implemented" }; }
fn.PRICEDISC = function() { throw { Message: "Not Implemented" }; }
fn.PRICEMAT = function() { throw { Message: "Not Implemented" }; }
fn.PV = function() { throw { Message: "Not Implemented" }; }
fn.RATE = function() { throw { Message: "Not Implemented" }; }
fn.RECEIVED = function() { throw { Message: "Not Implemented" }; }
fn.SLN = function() { throw { Message: "Not Implemented" }; }
fn.SYD = function() { throw { Message: "Not Implemented" }; }
fn.TBILLEQ = function() { throw { Message: "Not Implemented" }; }
fn.TBILLPRICE = function() { throw { Message: "Not Implemented" }; }
fn.TBILLYIELD = function() { throw { Message: "Not Implemented" }; }
fn.VDB = function() { throw { Message: "Not Implemented" }; }
fn.XIRR = function() { throw { Message: "Not Implemented" }; }
fn.XNPV = function() { throw { Message: "Not Implemented" }; }
fn.YIELD = function() { throw { Message: "Not Implemented" }; }
fn.YIELDDISC = function() { throw { Message: "Not Implemented" }; }
fn.YIELDMAT = function() { throw { Message: "Not Implemented" }; }
fn.CELL = function() { throw { Message: "Not Implemented" }; }
fn.INFO = function() { throw { Message: "Not Implemented" }; }

function _isBlank(value) {
    return value == null || value.ToString() == string.Empty;
}

fn.ISBLANK = function(value) { 
    if (Array.anyArray(value)) { 
        return _isBlank.crossApply(value);
    } 
    return _isBlank(value);
}

fn.ISERR = function() { throw { Message: "Not Implemented" }; }
fn.ISERROR = function() { throw { Message: "Not Implemented" }; }

function _isEven(value) {
    return value % 2 == 0;
}

fn.ISEVEN = function(value) { 
    if (Array.anyArray(value)) { 
        return _isEven.crossApply(value);
    } 
    return _isEven(value);
}

function _isLogical(value) {
    return typeof(value) === 'boolean';
}

fn.ISLOGICAL = function(value) {
    if (Array.anyArray(value)) { 
        return _isLogical.crossApply(value);
    } 
    return _isLogical(value);
}

function _isNA(value) {
    return (value == fn.NA());
}

fn.ISNA = function(value) {
    if (Array.anyArray(value)) { 
        return _isNA.crossApply(value);
    } 
    return _isNA(value);
}


function _isNonText(value) {
    return typeof(value) !== 'string';
}

fn.ISNONTEXT = function(value) {
    if (Array.anyArray(value)) { 
        return _isNonText.crossApply(value);
    } 
    return _isNonText(value);
}

function _isNumber(value) {
    return value != null && !isNaN(value)
}

fn.ISNUMBER = function(value) { 
    if (Array.anyArray(value)) { 
        return _isNumber.crossApply(value);
    } 
    return _isNumber(value);
}

function _isOdd(value) {
    return value % 2 != 0;
}

fn.ISODD = function(value) { 
    if (Array.anyArray(value)) { 
        return _isOdd.crossApply(value);
    } 
    return _isOdd(value);
}

fn.ISREF = function(value) { return false; }

function _isText(value) {
    return typeof(value) === 'string';
}

fn.ISTEXT = function(value) { 
    if (Array.anyArray(value)) { 
        return _isText.crossApply(value);
    } 
    return _isText(value);
}

function _n(value) {
    return Number(value);
}

fn.N = function(value) { 
    if (Array.anyArray(value)) { 
        return _n.crossApply(value);
    } 
    return _n(value);
}

fn.NA = function() { return "#NA"; }

function _type(value) {
    if (value == null || value == undefined) return 0;
    else if (typeof(value) === 'string') return 2;
    else if (typeof(value) === 'boolean') return 4;
    else if (typeof(value) === 'Range') return 64; //TODO Correct me
    else if (typeof(value) === 'number') return 1;
    else return 16;
}

fn.TYPE = function(value) {
    if (Array.anyArray(value)) { 
        return _type.crossApply(value);
    } 
    return _type(value);
}

// ranges and extended functions



fn.DISTINCT = function(range) {
    return Array.distinct(Array.normalize(range));
}

fn.DISTINCTIF = function(range, criteria) {
    return Array.distinct(
        Array.normalize(range).where(
            predicates.checkCriteria(criteria)
        )
    );
}

fn.RANGEIF = function(range, criteria, returnRange) {

    if (returnRange === undefined) returnRange = range;

    var r1 = Array.normalize(range);
    var r2 = Array.normalize(returnRange);
    var values = [];
    var fnCriteria = predicates.checkCriteria(criteria);

    for (var i = 0; i < r1.length && i < r2.length; i++) {
        var valR1 = r1[i];
        var valR2 = r2[i];

        if (fnCriteria(valR1, i) && valR2 != null && valR2 != undefined) {
            values.Add(valR2);
        }
    }

    return values;

}

fn.FIRST = function(range) {
    return Array.normalize(range).firstOrDefault();
}

fn.LAST = function(range) {
    return Array.normalize(range).lastOrDefault();
}

fn.TAKE = function(count, range) {
    return Array.normalize(range).take(count);
}

fn.TOP = function(count, range) {
    return Array.normalize(range).take(count);
}

fn.BOTTOM = function(count, range) {
    return Array.normalize(range).reverse().take(count);
}

fn.SKIP = function(count, range) {
    return Array.normalize(range).skip(count);
}

fn.REVERSE = function(range) {
    return Array.normalize(range).reverse();
}

fn.ASC = function(range) {
    return Array.normalize(range).orderBy(comparer.ascending);
}

fn.DESC = function(range) {
    return Array.normalize(range).orderBy(comparer.descending);
}

fn.ANY = function(range) {
    return Array.normalize(range).any();
}

fn.AVERAGE = function(range) {
    var sum = 0; var count = 0;
    range = Array.normalize(range);

    for (var i = 0; i < range.length; i++) {    
        var value = range[i];
        if (!isNaN(value)) {
            sum += Number(value);
            count++;
        }
    }
    return sum / count;
}

fn.LOOKUP = function(value, lookupRange, resultRange) {

    var r1 = Array.normalize(lookupRange);
    var r2 = Array.normalize(resultRange);

    for (var i = 0; i < r1.length && i < r2.length; i++) {

        var valR1 = r1[i];
        var valR2 = r2[i];

        if (valR1 === value) {
            return valR2;
        }
    }

    return null;
}

fn.VLOOKUP = function(value, range, column) {
    var rArr = Array.normalize(range, false);
    if (!isNaN(column)) {
        column = Number(column);
        if (column > 0) {
            for (var i = 0; i < rArr.length; i++) {
                var innerArr = rArr[i];
                if (innerArr.constructor === Array && innerArr.length > 0) {
                    var obj = innerArr[0];
                    if (obj === value) {
                        if (innerArr.length < column)
                            return innerArr[column];
                        else
                            return null;
                    }
                }           
            }
        }
    }
    return null;
}

fn.INDEX = function(range, value) {
    var rArr = Array.normalize(range);
    if (!isNaN(value)) {
        value = Number(value);
        if (value > 0 && value <= rArr.length)
            return rArr[value - 1];
    }
    return null;
}

fn.MATCH = function(lookup_value, lookup_range, match_type) {
    var rArr = Array.normalize(lookup_range);
    for (var i = 0; i < rArr.length; i++) {
        if (rArr[i] === lookup_value) return i + 1;
    }
    return 0;
}

