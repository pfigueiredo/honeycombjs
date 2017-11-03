/*jslnode: true */
'use strict';

require('js-array-extensions');
var moment = require('moment');
var predicates = require('./predicates');
var fnHelpers = require('./fnHelpers');

var fn = {};
module.exports = fn;

var v = fnHelpers.getValue;

function _round(value, digits) { 
    return Math.round(value * Math.pow(10, digits)) / Math.pow(10, digits)
};

fn.ROUND = function(value, digits) {

    if (Array.anyArray(value, digits)) { 
        var ret = [];
        for (var i = 0; i < Array.maxLength(value, digits); i++) {
            ret.push(fn.ROUND(v(value, i), v(digits, i)));
        }
        return ret;         
    }

    return _round(value, digits); 
}

fn.ABS = function(value) { 
    if (Array.anyArray(value)) { 
        var ret = [];
        for (var i = 0; i < Array.maxLength(value); i++) {
            ret.push(fn.ABS(v(value, i)));
        }
        return ret;
    }
    return Math.abs(value);
}

fn.ACOS = function(value) { 
    if (Array.anyArray(value)) { 
        return Math.acos.crossApply(value);
    }
    return Math.acos(value); 
}


fn.ASIN = function(value) {
    if (Array.anyArray(value)) { 
        return Math.asin.crossApply(value);
    } 
    return Math.asin(value); 
}

fn.ATAN = function(value) {
    if (Array.anyArray(value)) { 
        return Math.atan.crossApply(value);
    } 
    return Math.atan(value); 
}

fn.ATAN2 = function(value, value2) {
    if (Array.anyArray(value, value2)) { 
        return Math.atan2.crossApply(value, value2);
    } 
    return Math.atan2(value, value2); 
}

fn.CEILING = function(value) {
    if (Array.anyArray(value)) { 
        return Math.ceil.crossApply(value);
    } 
    return Math.ceil(value); 
}

fn.COS = function(value) {
    if (Array.anyArray(value)) { 
        return Math.cos.crossApply(value);
    } 
    return Math.cos(value); 
}

function _degrees(value) {
    return Math.PI * value / 180.0;
}

fn.DEGREES = function(value) {
    if (Array.anyArray(value)) { 
        return _degrees.crossApply(value);
    } 
    return _degrees(value);
}

function _even(value) {
    value = Math.floor(value); 
    return (value % 2 == 0) ? value : value + 1;
}

fn.EVEN = function(value) { 
    if (Array.anyArray(value)) { 
        return _even.crossApply(value);
    } 
    return _even(value);
}

fn.EXP = function(value) { 
    if (Array.anyArray(value)) { 
        return Math.exp.crossApply(value);
    } 
    return Math.exp(value); 
}

fn.FLOOR = function(value) {
    if (Array.anyArray(value)) { 
        return Math.floor.crossApply(value);
    }  
    return Math.floor(value); 
}

fn.LOG = function(value) {
    if (Array.anyArray(value)) { 
        return Math.log.crossApply(value);
    }  
    return Math.log(value); 
}

fn.LOG10 = function(value) {
    if (Array.anyArray(value)) { 
        return Math.LOG10E.crossApply(value);
    }  
    return Math.LOG10E(value); 
}

fn.MOD = function(value1, value2) { 
    return value1 % value2; 
}

function _odd(value) {
    value = Math.ceil(value); 
    return (value % 2 != 0) ? value : value - 1;
}

fn.ODD = function(value) { 
    if (Array.anyArray(value)) { 
        return _odd.crossApply(value);
    }  
    return _odd(value);
}

fn.PI = function() {  
    return Math.PI; 
}

fn.POWER = function(value, power) {
    if (Array.anyArray(value, power)) { 
        return Math.pow.crossApply(value, power);
    }  
    return Math.pow(value, power); 
}

function _radians(value) {
    return (Math.PI / 180) * value;
}

fn.RADIANS = function(value) { 
    if (Array.anyArray(value)) { 
        return _radians.crossApply(value);
    }  
    return _radians(value);
}

fn.RAND = function() { 
    return (new Random()).NextDouble(); 
}

fn.RANDBETWEEN = function(a, b) {
    var myRand = new Random();
    if (Array.anyArray(value)) {
        var f = function (value, myRand) {
            return myRand.Next(a, b);        
        } 
        return f.crossApply(value, myRand);
    }  

    return myRand.Next(a, b); 
}

function _roundDown(value, precision) {
    return Math.floor(value * Math.pow(10, precision)) / Math.pow(10, precision);
}

function _roundUp(value, precision) {
    return Math.ceil(value * Math.pow(10, precision)) / Math.pow(10, precision);
}

fn.ROUNDDOWN = function(value, precision) { 
    if (Array.anyArray(value)) { 
        return _roundDown.crossApply(value, precision);
    }  
    return _roundDown(value, precision);
}

fn.ROUNDUP = function(value, precision) {
    if (Array.anyArray(value)) { 
        return _roundUp.crossApply(value, precision);
    }  
    return _roundUp(value, precision);
}

fn.SIGN = function(value) {
    if (Array.anyArray(value)) { 
        return Math.sign.crossApply(value);
    }
    return Math.sign(value); 
}

fn.SIN = function(value) {
    if (Array.anyArray(value)) { 
        return Math.sin.crossApply(value);
    } 
    return Math.sin(value); 
}

fn.SQRT = function(value) {
    if (Array.anyArray(value)) { 
        return Math.sqrt.crossApply(value);
    } 
    return Math.sqrt(value); 
}

fn.TAN = function(value) {
    if (Array.anyArray(value)) { 
        return Math.tan.crossApply(value);
    } 
    return Math.tan(value); 
}

fn.ACOSH = function() { throw { Message: "Not Implemented" }; }
fn.ASINH = function() { throw { Message: "Not Implemented" }; }
fn.ATANH = function() { throw { Message: "Not Implemented" }; }
fn.COMBIN = function() { throw { Message: "Not Implemented" }; }
fn.COSH = function() { throw { Message: "Not Implemented" }; }
fn.GCD = function() { throw { Message: "Not Implemented" }; }
fn.LCM = function() { throw { Message: "Not Implemented" }; }
fn.LN = function() { throw { Message: "Not Implemented" }; }
fn.FACT = function(value) { throw { Message: "Not Implemented" }; }
fn.FACT= function() { throw { Message: "Not Implemented" }; }
fn.MDETERM = function() { throw { Message: "Not Implemented" }; }
fn.MINVERSE = function() { throw { Message: "Not Implemented" }; }
fn.MMULT = function() { throw { Message: "Not Implemented" }; }
fn.MROUND = function() { throw { Message: "Not Implemented" }; }
fn.MULTINOMIAL = function() { throw { Message: "Not Implemented" }; }
fn.PRODUCT = function() { throw { Message: "Not Implemented" }; }
fn.QUOTIENT = function() { throw { Message: "Not Implemented" }; }
fn.SQRTPI = function() { throw { Message: "Not Implemented" }; }
fn.SUBTOTAL = function() { throw { Message: "Not Implemented" }; }
fn.SINH = function() { throw { Message: "Not Implemented" }; }
fn.SERIESSUM = function() { throw { Message: "Not Implemented" }; }
fn.TANH = function() { throw { Message: "Not Implemented" }; }