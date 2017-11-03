require('js-array-extensions');
var moment = require('moment');
var predicates = require('./predicates');

var helpers = {};
module.exports = helpers;

function getValue (obj, index) {
    if (index == null) return obj;

    else if (obj && obj.constructor === Array) {
        if (obj.length > index && index > -1)
            return obj[index];
        else
            return null;
    } else 
        return obj;
}

helpers.getValue = getValue; 

function maxLength() {
    var params = Array.prototype.slice.call(arguments);
    var maxLen = 0;
    for (var i = 0; i < params.length; i++) {
        var p = params[i];
        if (p != null) {
            var l = (p.constructor === Array) ? p.length : 1;
            if (maxLen < l) maxLen = l;
        }
    }
    return maxLen;
}

function minLength() {
    var params = Array.prototype.slice.call(arguments);
    var minLen = Number.MAX_VALUE;
    for (var i = 0; i < params.length; i++) {
        var p = params[i];
        if (p != null) {
            var l = (p.constructor === Array) ? p.length : 1;
            if (minLen > l) minLen = l;
        }
    }
    return minLen;
}

function anyArray () {
    var params = Array.prototype.slice.call(arguments);
    for (var i = 0; i < params.length; i++) {
        var p = params[i];
        if (p != null) {
            var isArr = (p.constructor === Array);
            if (isArr) return true;
        }
    }
    return false;
}

function normalize (range, concat) {

    /**********************************************************
     * most functions like SUM need a single dimentional array
     * others like vlookup need the range to be multidimentional
     **********************************************************/ 
    if (concat == null) concat = true;

    var arr = [];
    if (range) {
        if (range.constructor === Array)
            arr = range;
        else if (range.values && range.values.constructor === Array)
            arr = range.values;
    }

    /********************************************************** 
     * this mdRange property will be true for multidimentional ranges
     * lets not transform the array if we don't need to.
     **********************************************************/
    if (concat && arr.mdRange) arr = [].concat.apply([], arr);

    return arr;
}

Array.minLength = minLength;
Array.maxLength = maxLength;
Array.anyArray = anyArray;
Array.normalize = normalize;
Array.flatten = flatten;

function crossApply () {
    var params = Array.prototype.slice.call(arguments);
    var ret = [];
    if (params.length > 0) {
        var fnc = this;
        var fargs = [];
        for (var i = 0; i < params.length; i++) {
            fargs.push(params[i]);
        }
        for (var r = 0; r < maxLength.apply(null, fargs); r++) {
            var a = [];
            for (var i = 0; i < fargs.length; i++) {
                a.push(getValue(fargs[i], r));
            }
            ret.push(fnc.apply(null, a));
        }
    }
    return ret;
}

Function.prototype.crossApply = crossApply;

function flatten () {

    var arr = [];

    for (var i = 0; i < arguments.length; i++) {
        if (arguments[i] != null && arguments[i].constructor === Array) {
            arr = arr.concat(Array.flatten.apply(null, arguments[i]));
        } else {
            arr.push(arguments[i]);
        }
    }

    return arr;
}

