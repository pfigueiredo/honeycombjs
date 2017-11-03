/*jslnode: true */
'use strict';

require('js-array-extensions');
var moment = require('moment');
var predicates = require('./predicates');
var fnHelpers = require('./fnHelpers');

var fn = {};
module.exports = fn;

var v = fnHelpers.getValue;

fn.FALSE = function() { return false; }
fn.TRUE = function() { return true; }

fn.IF = function(condition, eThen, eElse) {
    if (condition && condition.constructor === Array) {
        var ret = [];
        for (var r = 0; r < condition.length; r++) {
            ret.push(fn.IF((condition[r]), v(eThen, r), v(eElse, r)));
        }
        return ret;
    } else 
        return (condition) ? eThen : eElse;
}

fn.AND = function (a, b) {
    if (Array.anyArray(a,b)) {
        var ret = [];
        for (var r = 0; r < Array.maxLength(a, b); r++) {
            ret.push(fn.AND(v(a,r), v(b,r)));
        }
        return ret;
    } else
        return a && b;
};

fn.OR = function (a, b) {
    if ((a && a.constructor === Array) || (b && b.constructor === Array)) {
        var ret = [];
        for (var r = 0; r < Array.maxLength(a, b); r++) {
            ret.push(fn.OR(v(a,r), v(b,r)));
        }
        return ret;
    } else
        return a || b;
};

fn.NOT = function (a) {
    if (a && a.constructor === Array) {
        var ret = [];
        for (var r = 0; r < a.length; r++) {
            ret.push(fn.NOT(v(a,r)));
        }
        return ret;
    } else
        return !a; 
};

fn.EQ = function (a,b) {
    if ((a && a.constructor === Array) || (b && b.constructor === Array)) {
        var ret = [];
        for (var r = 0; r < Array.maxLength(a, b); r++) {
            ret.push(fn.EQ(v(a,r), v(b,r)));
        }
        return ret;
    } else
        return a == b;
}

fn.NEQ = function (a,b) {
    if ((a && a.constructor === Array) || (b && b.constructor === Array)) {
        var ret = [];
        for (var r = 0; r < Array.maxLength(a, b); r++) {
            ret.push(fn.NEQ(v(a,r), v(b,r)));
        }
        return ret;
    } else
        return a != b;
}

fn.GT = function (a,b) {
    if ((a && a.constructor === Array) || (b && b.constructor === Array)) {
        var ret = [];
        for (var r = 0; r < Array.maxLength(a, b); r++) {
            ret.push(fn.GT(v(a,r), v(b,r)));
        }
        return ret;
    } else
        return a > b;
}

fn.GTE = function (a,b) {
    if ((a && a.constructor === Array) || (b && b.constructor === Array)) {
        var ret = [];
        for (var r = 0; r < Array.maxLength(a, b); r++) {
            ret.push(fn.GTE(v(a,r), v(b,r)));
        }
        return ret;
    } else
        return a >= b;
}

fn.ST = function (a,b) {
    if ((a && a.constructor === Array) || (b && b.constructor === Array)) {
        var ret = [];
        for (var r = 0; r < Array.maxLength(a, b); r++) {
            ret.push(fn.ST(v(a,r), v(b,r)));
        }
        return ret;
    } else
        return a < b;
}

fn.STE = function (a,b) {
    if ((a && a.constructor === Array) || (b && b.constructor === Array)) {
        var ret = [];
        for (var r = 0; r < Array.maxLength(a, b); r++) {
            ret.push(fn.STE(v(a,r), v(b,r)));
        }
        return ret;
    } else
        return a <= b;
}

fn.ADD = function (a,b) {
    if ((a && a.constructor === Array) || (b && b.constructor === Array)) {
        var ret = [];
        for (var r = 0; r < Array.maxLength(a, b); r++) {
            ret.push(fn.ADD(v(a,r), v(b,r)));
        }
        return ret;
    } else
        return a + b;
}

fn.SUBTR = function (a,b) {
    if ((a && a.constructor === Array) || (b && b.constructor === Array)) {
        var ret = [];
        for (var r = 0; r < Array.maxLength(a, b); r++) {
            ret.push(fn.SUBTR(v(a,r), v(b,r)));
        }
        return ret;
    } else
        return a - b;
}

fn.MULT = function (a,b) {
    if ((a && a.constructor === Array) || (b && b.constructor === Array)) {
        var ret = [];
        for (var r = 0; r < Array.maxLength(a, b); r++) {
            ret.push(fn.MULT(v(a,r), v(b,r)));
        }
        return ret;
    } else
        return a * b;
}

fn.DIV = function (a,b) {
    if ((a && a.constructor === Array) || (b && b.constructor === Array)) {
        var ret = [];
        for (var r = 0; r < Array.maxLength(a, b); r++) {
            ret.push(fn.DIV(v(a,r), v(b,r)));
        }
        return ret;
    } else
        return a / b;
}

fn.POW = function (a,b) {
    if ((a && a.constructor === Array) || (b && b.constructor === Array)) {
        var ret = [];
        for (var r = 0; r < Array.maxLength(a, b); r++) {
            ret.push(fn.POW(v(a,r), v(b,r)));
        }
        return ret;
    } else
        return Math.pow(a, b);
}

fn.Percent = function (a) {
    if ((a && a.constructor === Array)) {
        var ret = [];
        for (var r = 0; r < a.length; r++) {
            ret.push(fn.Percent(v(a,r), 100.0));
        }
        return ret;
    } else
        return a / 100.0;
}