(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.$honeycomb = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

},{}],2:[function(require,module,exports){
(function (process){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
    var last = parts[i];
    if (last === '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Split a filename into [root, dir, basename, ext], unix version
// 'root' is just a slash, or nothing.
var splitPathRe =
    /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
var splitPath = function(filename) {
  return splitPathRe.exec(filename).slice(1);
};

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
  var resolvedPath = '',
      resolvedAbsolute = false;

  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    var path = (i >= 0) ? arguments[i] : process.cwd();

    // Skip empty and invalid entries
    if (typeof path !== 'string') {
      throw new TypeError('Arguments to path.resolve must be strings');
    } else if (!path) {
      continue;
    }

    resolvedPath = path + '/' + resolvedPath;
    resolvedAbsolute = path.charAt(0) === '/';
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when process.cwd() fails)

  // Normalize the path
  resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
  var isAbsolute = exports.isAbsolute(path),
      trailingSlash = substr(path, -1) === '/';

  // Normalize the path
  path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (isAbsolute ? '/' : '') + path;
};

// posix version
exports.isAbsolute = function(path) {
  return path.charAt(0) === '/';
};

// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    if (typeof p !== 'string') {
      throw new TypeError('Arguments to path.join must be strings');
    }
    return p;
  }).join('/'));
};


// path.relative(from, to)
// posix version
exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

exports.sep = '/';
exports.delimiter = ':';

exports.dirname = function(path) {
  var result = splitPath(path),
      root = result[0],
      dir = result[1];

  if (!root && !dir) {
    // No dirname whatsoever
    return '.';
  }

  if (dir) {
    // It has a dirname, strip trailing slash
    dir = dir.substr(0, dir.length - 1);
  }

  return root + dir;
};


exports.basename = function(path, ext) {
  var f = splitPath(path)[2];
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPath(path)[3];
};

function filter (xs, f) {
    if (xs.filter) return xs.filter(f);
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (f(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// String.prototype.substr - negative index don't work in IE8
var substr = 'ab'.substr(-1) === 'b'
    ? function (str, start, len) { return str.substr(start, len) }
    : function (str, start, len) {
        if (start < 0) start = str.length + start;
        return str.substr(start, len);
    }
;

}).call(this,require('_process'))

},{"_process":3}],3:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],4:[function(require,module,exports){
/*jslint node: true */
'use strict';

function DataTable (values) {
    this.values = [];
    this.columns = [];
    this.ucColumns = [];
    this.rowSeed = -1;

    this.columns.push("Row");
    this.ucColumns.push("ROW");

    if (values && values.length > 0) {

        var props = Object.keys(values[0]);
        for (var i = 0, l = props.length; i < l; i++) {
            var prop = props[i];
            if (this.ucColumns.indexOf(prop.toUpperCase()) < 0) {
                this.ucColumns.push(prop.toUpperCase())
                this.columns.push(prop);
            }
        }

        for (var r = 0; r < values.length; r++) {
            this.values.push([]); //push [r]
            this.values[r].push(this.rowSeed = r);
            
            for (var c = 1; c < this.columns.length; c++) {
                this.values[r].push(values[r][this.columns[c]]);
            }
        }

    }
    
}

DataTable.prototype.containsColumn = function(column) {
    var index = this.columns.indexOf(column);
    if (index >= 0) return true;

    var ucCol = column.toUpperCase();
    index = this.ucColumns.indexOf(ucCol);
    if (index >= 0) return true;

    return false;
}

DataTable.prototype.columnIndex = function(column) {

    var index = this.columns.indexOf(column);
    if (index >= 0) return index;

    var ucCol = column.toUpperCase();
    index = this.ucColumns.indexOf(ucCol);
    if (index >= 0) return index;

    return -1;
}

DataTable.prototype.addColumn = function (column) {
    this.insureColumn(column);
}

DataTable.prototype.addRow = function () {
    var row = [++this.rowSeed];
    for (var i = 1; i < this.columns.length; i++) {
        row.push(null);
    }
    this.values.push(row);
}

DataTable.prototype.insureColumn = function (column) {
    if (!this.containsColumn(column)) {
        this.columns.push(column);
        this.ucColumns.push(column.toUpperCase())
        for (var r = 0; r < this.values.length; r++)
            this.values[r].push(null);
    }
}

DataTable.prototype.insureRow = function (row) {
    if (!this.values) this.values = [];
    while (this.values.lenght <= row)
        this.addRow();
}

DataTable.prototype.insureRowColumn = function (column, row) {
    this.insureColumn(column);
    if (!this.values) this.values = [];
    while (this.values.length <= row)
        this.addRow();
}

DataTable.prototype.setValue = function(column, row, value) {
    
    var columnIndex = this.columnIndex(column);

    if (!(columnIndex >=0 && row >= 0 && row < this.values.length)) {
        this.insureRowColumn(column, row);
        columnIndex = this.columnIndex(column);
    }

    return this.values[row][columnIndex] = value;
}

DataTable.prototype.getValue = function(column, row) {
    
    var columnIndex = this.columnIndex(column);

    if (!(columnIndex >=0 && row >= 0 && row < this.values.length)) {
        if (column == "row") {
            this.insureRowColumn(column, row);
            columnIndex = this.columnIndex(column);
        } else
            return null;
    }
    
    return this.values[row][columnIndex];

}

DataTable.prototype.toObjectArray = function() {
    var ret = [];
    if (this.values) {
        for (var r = 0; r < this.values.length; r++) {
            var obj = {};
            ret.push(obj);
            for (var c = 0; c < this.columns.length; c++) {
                obj[this.columns[c]] = this.values[r][c];
            }
        }
    }
    return ret;
}

DataTable.prototype.getRowObject = function (row) {
    if (this.values) {
        var obj = {};
        if (row >= 0 && row <= this.values.length) {
            for (var c = 0; c < this.columns.length; c++) {
                obj[this.columns[c]] = this.values[row][c];
            }
            return obj;
        }
    }
    return null;
}

DataTable.prototype.getRow = function (row) {
    if (this.values) {
        var obj = {};
        if (row >= 0 && row <= this.values.length) {
            return this.values[row].slice(0);
        }
    }
    return null;
}

DataTable.prototype.getColumn = function (column, row) {
    var retValues = [];
    if (this.values) {
        var columnIndex = this.columnIndex(column);
        if (columnIndex >= 0) {
            for (var r = 0; r < this.values.length; r++) {
                retValues.push(this.values[r][columnIndex]);
            }
        }
    }
    retValues.row = row;
    return retValues;
}

DataTable.prototype.getParentValue = function(valueColumn, row) {
    var parentId = this.getValue("_parent", row);
    if (parentId != null)
        return this.findValues("_id", parentId, valueColumn, 1);
    
    parentId = this.getValue("$parent", row);
    if (parentId != null)
        return this.findValues("$id", parentId, valueColumn, 1);

    return [];
}

DataTable.prototype.findValues = function (queryColumn, query, valueColumn, top) {

    var queryColumnIdx = 0, valueColumnIdx = 0;
    var retArr = [];

    if (isNaN(queryColumn))
        queryColumnIdx = this.columnIndex(queryColumn);
    else
        queryColumnIdx = Number(queryColumn);

    if (isNaN(valueColumn))
        valueColumnIdx = this.columnIndex(valueColumn);
    else
        valueColumnIdx = Number(valueColumn);

    for (var r = 0; r < this.values.length; r++) {

        var colValue = this.values[r][queryColumnIdx]; 

        if (colValue == query)
            retArr.push(this.values[r][valueColumnIdx]);
        else if (typeof colValue === 'string' || colValue instanceof String) {
            if (colValue.startsWith(query))
                retArr.push(this.values[r][valueColumnIdx]);
        }

        if (top && top <= retArr.length)
            break;

    }

    return retArr;

}

DataTable.prototype.getRange = function (startColumn, endColumn, starRow, endRow) {
    var startColumnIdx = 0, endColumnIdx = 0;
    var retArr = [];

    if (isNaN(startColumn)) 
        startColumnIdx = this.columnIndex(startColumn);
    else
        startColumnIdx = Number(startColumn);

    if (isNaN(endColumn)) 
        endColumnIdx = this.columnIndex(endColumn);
    else
        endColumnIdx = Number(endColumn);

    if (startColumnIdx < 0) startColumnIdx = 0;
    if (endColumnIdx < 0) endColumnIdx = 0;

    //try to get the range correcty
    //no garanties because i have each row as an object
    //and object properties have no garantied order
    for (var r = starRow; r < this.values.length && r <= endRow; r++) {
        retArr.push([]);
        for (var c = startColumnIdx; c < this.columns.length && c <= endColumnIdx; c++) {
            retArr[r].push(this.values[r][c]);
        }
    }
    return retArr;
}

module.exports = DataTable;

},{}],5:[function(require,module,exports){
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
},{"./fnHelpers":11,"./predicates":17,"js-array-extensions":15,"moment":16}],6:[function(require,module,exports){
/*jslint node: true */
'use strict';

var DataTable = require('./dataTable');
var builtInFunctions = require('./functions');
var baseFunctions = require('./baseFunctions');
var dateFunctions = require('./dateFunctions');
var mathFunctions = require('./mathFunctions')
var domainFunctions = require('./domainFunctions')

function mergeFunctions(fn, functions) {
    if (functions) {
        var fncs = Object.keys(functions);
        for (var i = 0, l = fncs.length; i < l; i++) {
            var fnc = functions[fncs[i]]
            if(typeof fnc === "function") {
                fn[fncs[i]] = fnc;
            }
        }
    }
    return fn;
}

function Context(globals, tables, functions) {

    if (typeof globals === "object" && globals instanceof Array) {
        globals = (globals.length > 0) ? globals[0] : {};
    }

    this.g = globals;
    this.t = {};
    this.fn = builtInFunctions;
    this.defaultTable = null;

    mergeFunctions(this.fn, baseFunctions);
    mergeFunctions(this.fn, dateFunctions);
    mergeFunctions(this.fn, mathFunctions);
    mergeFunctions(this.fn, domainFunctions);

    if (functions) {
        mergeFunctions(this.fn, functions);
    }

    if (tables) {
        var names = Object.keys(tables);
        for (var n = 0; n < names.length; n++) {
            var name = names[n];
            if (name.toLowerCase() == "defaulttable") {
                this.defaultTable = tables[name];
            } else {
                var table = tables[name];
                if (table.constructor === DataTable) {
                    this.t[name] = table;
                } else if (table.constructor === Array) {
                    this.t[name] = new DataTable(table);
                }
            }
        }
    }

    this.injector =  {
        dependencies: Object.assign({}, this.t, this.g),
        // register: function(key, value) {
        //     this.dependencies[key] = value;
        // },
        resolve: function() {
            var func, depDef, deps, scope, args = [], self = this;
            if (typeof arguments[0] === "function") {
                func = arguments[0]; 
                depDef = (func.dependencies && typeof func.dependencies === 'string') ? func.dependencies : null;
                depDef = depDef || (func.deps && typeof func.deps === 'string') ? func.deps : null;
                deps = null;
                scope = arguments[1] || {};
                if (depDef) {
                    deps = depDef.replace(/ /g, '').split(',');
                    return function() {
                        var a = Array.prototype.slice.call(arguments, 0);
                        for(var i=0; i<deps.length; i++) {
                            var d = deps[i];
                            args.push(self.dependencies[d] && d != '' ? self.dependencies[d] : a.shift());
                        }
                        return func.apply(scope || {}, args);
                    }
                }
                return arguments[0]; 
            }
            throw "injector.resolve expects parameter '0' to be a function";        
        }
    }
}

Context.prototype.table = function (name) {
    if (!this.t[name]) {
        if (name === "table") {
            if (this.defaultTable && this.t[this.defaultTable]) {
                this.t["table"] = this.t[this.defaultTable];
            }
            else {
                var keys = Object.keys(this.t);
                if (keys && keys.length > 0) {
                    this.t["table"] = this.t[keys[0]];
                }
            }
        }
        
        if (!this.t[name])
            this.t[name] = new DataTable([]); 
    }
    return this.t[name];
};

module.exports = Context;
},{"./baseFunctions":5,"./dataTable":7,"./dateFunctions":8,"./domainFunctions":9,"./functions":12,"./mathFunctions":14}],7:[function(require,module,exports){
arguments[4][4][0].apply(exports,arguments)
},{"dup":4}],8:[function(require,module,exports){
/*jslnode: true */
'use strict';

require('js-array-extensions');
var moment = require('moment');
var predicates = require('./predicates');
var fnHelpers = require('./fnHelpers');

var fn = {};
module.exports = fn;

var v = fnHelpers.getValue;

function toOADate (date) {
    date = moment.utc(date).toDate();
    return (date - new Date(Date.UTC(1899, 11, 30))) / (24 * 60 * 60 * 1000)
}

function isLastDayOfFebruary(date) {
    date = moment.utc(date);
    return date.month() == 2 && date.day() == date.daysInMonth();
}


fn.DATE = function(year, month, day, hour, minute, second) {
    if (!year) return moment.utc().toDate();
    else if (!month) {
        if (Array.anyArray(year)) {
            var f = function (year) {
                return moment.utc(year).toDate();    
            };
            return f.crossApply(year);
        } else
            return moment.utc(year).toDate();
    }

    if (Array.anyArray(year, month, day, hour, minute, second)) {
        var f = function (year, month, day, hour, minute, second) {
            return moment.utc({year: year, month: month - 1, day: day, minute: minute, second: second}).toDate();            
        };
        return f.crossApply(year, month, day, hour, minute, second);
    }

    return moment.utc({year: year, month: month - 1, day: day, minute: minute, second: second}).toDate();
}

function _dateValue (date) {
    return toOADate(date); 
}

fn.DATEVALUE = function(date) {
    if (Array.anyArray(date)) {
        return _dateValue.crossApply(year);
    } 
    return _dateValue(date); 
}

function _days360 (startDate, endDate, xEuropean) {
    if (xEuropean === undefined) xEuropean = true;

    startDate = moment.utc(startDate);
    endDate = moment.utc(endDate);

    var StartDay = startDate.day();
    var StartMonth = startDate.month();
    var StartYear = startDate.year();
    var EndDay = endDate.day();
    var EndMonth = endDate.month();
    var EndYear = endDate.year();

    if (StartDay == 31 || isLastDayOfFebruary(startDate)) {
        StartDay = 30;
    }

    if (StartDay == 30 && EndDay == 31) {
        EndDay = 30;
    }

    return ((EndYear - StartYear) * 360) + ((EndMonth - StartMonth) * 30) + (EndDay - StartDay);
}

fn.DAYS360 = function(startDate, endDate, xEuropean) {
    if (Array.anyArray(startDate, endDate)) {
        return _days360.crossApply(startDate, endDate, xEuropean);
    } else
        return _days360(startDate, endDate, xEuropean);
}

function _eDate(date, months) {
    return moment.utc(date).add(months, 'M').toDate();
}

fn.EDATE = function(date, months) { 
     if (Array.anyArray(date, month))
        return _eDate.crossApply(date, months);
    else
        return _eDate(date, months);
}

function _eoMonth(date, months) {
    if (date == null) date = new Date();
    if (months == null || isNaN(months)) months = 0; 
    var dref = moment.utc(date).add(months, 'M').add(1, 'M');
    return moment.utc({year:dref.year, month: dref.month, day: 1}).add(-1, 'd').toDate();
}

fn.EOMONTH = function(date, months) {
    if (Array.anyArray(date)) {
        return _eoMonth.crossApply(date, months);
    } else
        return _eoMonth(date, months);
}

function _datePart (date, type) {
    if (type == "h") return moment.utc(date).hour();
    else if (type == "m") return moment.utc(date).minute();
    else if (type == "M") return moment.utc(date).month();
    else if (type == "d") return moment.utc(date).date();
    else if (type == "s") return moment.utc(date).second();
    else if (type == "y") return moment.utc(date).year();
    else return 0;
}

fn.HOUR = function(date) {  
    if (Array.anyArray(date)) {
        return _datePart.crossApply(date, 'h');
    } else
        return _datePart(date, 'h');
}

fn.MINUTE = function(date) {  
    if (Array.anyArray(date)) {
        return _datePart.crossApply(date, 'm');
    } else
        return _datePart(date, 'm');
}

fn.MONTH = function(date) {  
    if (Array.anyArray(date)) {
        return _datePart.crossApply(date, 'M');
    } else
        return _datePart(date, 'M');
}

fn.YEAR = function(date) {  
    if (Array.anyArray(date)) {
        return _datePart.crossApply(date, 'y');
    } else
        return _datePart(date, 'y');
}

fn.SECOND = function(date) {  
    if (Array.anyArray(date)) {
        return _datePart.crossApply(date, 's');
    } else
        return _datePart(date, 's');
}

fn.DAY = function(date) {  
    if (Array.anyArray(date)) {
        return _datePart.crossApply(date, 'd');
    } else
        return _datePart(date, 'd');
}

fn.NETWORKDAYS = function() { throw { Message: "Not Implemented" }; }

fn.NOW = function() { return moment.utc().toDate(); }

function _time (hours, minutes, seconds) {
    var d;
    if (hours === undefined) d = moment.utc().toDate();
    else if (minutes === undefined) d = moment.utc(value).toDate(); 
    else d = moment.utc().hour(hours).minute(minutes).second(seconds).toDate();
    return (d.getMinutes() / 60.0 + d.getHours) / 24.0;
}

fn.TIME = function(hours, minutes, seconds) {
    if (Array.anyArray(hours, minutes, seconds)) {
        return _time.crossApply(hours, minutes, seconds);
    } else
        return _time(hours, minutes, seconds);
}

function _timeValue(time) {
    var d = moment.utc(value).toDate();
    return (d.getMinutes() / 60.0 + d.getHours) / 24.0;
}

fn.TIMEVALUE = function(time) {
    if (Array.anyArray(time)) {
        return _timeValue.crossApply(time);
    } else
        return _timeValue(time);
}

fn.TODAY = function() { return moment.utc({hour:0}).toDate(); }

function _weekday(date, returnType) {
    if (returnType === undefined) returnType = 1; 
    return (moment.utc(date).isoWeekday() - returnType + 7) % 7; 
}

fn.WEEKDAY = function(date, returnType) {
    if (Array.anyArray(date, returnType)) {
        return _weekday.crossApply(date, returnType);
    } else
        return _weekday(date, returnType); 
}

function _weeknum (date, dayOfWeek) { 
    return moment.utc(date).isoWeekday(dayOfWeek).isoWeek(); 
}

fn.WEEKNUM = function(date, dayOfWeek) { 
    if (Array.anyArray(date, dayOfWeek)) {
        return _weeknum.crossApply(date, dayOfWeek);
    } else
        return _weeknum(date, dayOfWeek);
}

fn.WORKDAY = function() { throw { Message: "Not Implemented" }; }
fn.YEARFRAC = function() { throw { Message: "Not Implemented" }; }

function _dateDiff(start, end) {
    start = moment.utc(start);
    end = moment.utc(end);
    return end.diff(start).toDate();
}

fn.DATEDIFF = function(start, end) {
    if (Array.anyArray(start, end)) {
        return _dateDiff.crossApply(start, end);
    } else
        return _dateDiff(start, end);
}

function _dateAddPart(value, date, part) {
    date = moment.utc(date);
    return date.add(value, part).toDate();
}

fn.ADDSECONDS = function(value, date) {
    if (Array.anyArray(value, date)) {
        return _dateAddPart.crossApply(value, date, 's');
    } else
        return _dateAddPart(value, date, 's');
}

fn.ADDMINUTES = function(value, date) {
    if (Array.anyArray(value, date)) {
        return _dateAddPart.crossApply(value, date, 'm');
    } else
        return _dateAddPart(value, date, 'm');
}

fn.ADDHOURS = function(value, date) {
    if (Array.anyArray(value, date)) {
        return _dateAddPart.crossApply(value, date, 'h');
    } else
        return _dateAddPart(value, date, 'h');
}

fn.ADDDAYS = function(value, date) {
    if (Array.anyArray(value, date)) {
        return _dateAddPart.crossApply(value, date, 'd');
    } else
        return _dateAddPart(value, date, 'd');
}

fn.ADDMONTHS = function(value, date) {
    if (Array.anyArray(value, date)) {
        return _dateAddPart.crossApply(value, date, 'M');
    } else
        return _dateAddPart(value, date, 'M');
}

fn.ADDYEARS = function(value, date) {
    if (Array.anyArray(value, date)) {
        return _dateAddPart.crossApply(value, date, 'y');
    } else
        return _dateAddPart(value, date, 'y');
}
},{"./fnHelpers":11,"./predicates":17,"js-array-extensions":15,"moment":16}],9:[function(require,module,exports){
/*jslnode: true */
'use strict';

require('js-array-extensions');
var moment = require('moment');
var predicates = require('./predicates');
var fnHelpers = require('./fnHelpers');
var DataTable = require('./DataTable');

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
},{"./DataTable":4,"./fnHelpers":11,"./predicates":17,"js-array-extensions":15,"moment":16}],10:[function(require,module,exports){

const SymbolTable = require("./symbolTable").SymbolTable

/*jslint node: true */
'use strict';

/**********************************************************
 * Program
 **********************************************************/
function Program (expressions) {
    this.expressions = expressions || [];
}

Program.prototype.getChildExpressions = function() {
    return this.expressions;
}

Program.prototype.AddExpression = function (expression) {

    var lastExpression = this.expressions[this.expressions.length-1];
    var isCompatible = false;

    if ((lastExpression && lastExpression.constructor === AssignExpressionGroup) ||
        (lastExpression.identifier && lastExpression.identifier.constructor == ColumnExpression)
    ) {
        if (expression && expression.identifier && expression.identifier.constructor === ColumnExpression) {
            isCompatible = (
                expression.identifier.table == (lastExpression.table || lastExpression.identifier.table)
                && lastExpression.filter === expression.filter
                && lastExpression.filterColumn === expression.filterColumn
            );
        }
    }

    if (isCompatible) { 
        if (lastExpression.constructor === AssignExpressionGroup) {
            lastExpression.expressions.push(expression);
            // console.log('adding another expression to the group');
        } else {
            // console.log('joinning to expressions into a group');
            var ae = new AssignExpressionGroup();
            ae.expressions.push(lastExpression);
            ae.expressions.push(expression);
            ae.table = lastExpression.identifier.table;
            ae.filterColumn = lastExpression.filterColumn;
            ae.filter = lastExpression.filter;
            this.expressions[this.expressions.length-1] = ae;
        }
    } else
        this.expressions.push(expression);

}

module.exports.Program = Program;

/**********************************************************
 * AssignExpressionGroup
 **********************************************************/

function AssignExpressionGroup () {
    this.expressions = [];
    this.table = null;
    this.filterColumn = null;
    this.filter = null;
}

AssignExpressionGroup.prototype.getSignature = function () {
    var ret = [];
    for (var e = 0; e < this.expressions.length; e++) {
        if (this.expressions[e].getSignature)
            ret.push(this.expressions[e].getSignature())
    }
    return ret;
}

AssignExpressionGroup.prototype.getChildExpressions = function() {
    ret = [];
    for (var e = 0; e < this.expressions.length; e++) {
        var children = this.expressions[e].getChildExpressions();
        ret.push.apply(ret, children);
    }
    return ret;
}

AssignExpressionGroup.prototype.toJsGet = function (symbolTable, insideAssignLoop) {
    throw {Message: "Can't generate Get from assign expression group" };
}

AssignExpressionGroup.prototype.toJsSet = function (expression, symbolTable, insideAssignLoop) {
    symbolTable.registerSymbol(this.table, "T");

    // var fnsJs = symbolTable.getFunctionsJsSet();
    // symbolTable.clearFunctions();

    var js = "$rStack.push($r); for ($r = 0; $r == 0 || $r < " + this.table + ".values.length; $r++) {\n"

    for (var e = 0; e < this.expressions.length; e++) {
        var ejs = this.expressions[e].toJsGroupSet(expression, symbolTable, insideAssignLoop);    
        js += ejs;
    }

    js += "\n}; $r = $rStack.pop() || 0;"
    return js;
}

module.exports.AssignExpressionGroup = AssignExpressionGroup;

/**********************************************************
 * AssignExpression 
 **********************************************************/
function AssignExpression(identifier, expression, filterColumn, filter) {
    this.identifier = identifier;
    this.expression = expression;
    this.filterColumn = filterColumn;
    this.filter = filter;
}

module.exports.AssignExpression = AssignExpression;

AssignExpression.prototype.getIdentifier = function () {
    return this.identifier;
}

AssignExpression.prototype.getChildExpressions = function () {
    return [this.expression];
}

AssignExpression.prototype.toJsGet = function(symbolTable, insideAssignLoop) {
    throw {Message: "Can't generate Get from assign expression" };
}

AssignExpression.prototype.toJsGroupSet = function(expression, symbolTable, insideAssignLoop) {
    return this.identifier.toJsGroupSet(this.expression, symbolTable, this.identifier.isRange, this.filterColumn, this.filter);
}

AssignExpression.prototype.toJsSet = function(expression, symbolTable, insideAssignLoop) {
    return this.identifier.toJsSet(this.expression, symbolTable, this.identifier.isRange, this.filterColumn, this.filter);
}

/**********************************************************
 * IdentifierExpression 
 **********************************************************/ 

function IdentifierExpression (name, prop) {
    this.modifier = "";
    if (name.startsWith("$")) {
        name = name.substring(1);
        this.modifier = "$";
    }
    this.name = name + ((!prop) ? "" : ("." + prop));
    this.prop = prop;
    this.promotedExpression = null;
}

module.exports.IdentifierExpression = IdentifierExpression;

IdentifierExpression.prototype.fillSymbolTable = function(table) {
    table.registerSymbol(this.name, "V");
}

IdentifierExpression.prototype.promote = function(table) {

    if (table.searchSymbol(this.name, "V") == null) {
        var promote = true;
        if (this.name.indexOf('.') > 0) {
            var query = this.name.split('.')[0];
            if (table.searchSymbol(query, "V") != null) {
                table.registerSymbol(this.name, "V");        
                promote = false;
            }   
        }
        if (promote) {
            this.promotedExpression = this.toTableExpression();    
        }
    }
}

IdentifierExpression.prototype.getSignature = function () {
    if (this.promotedExpression != null)
        return this.promotedExpression.getSignature();
    else
        return [this.name];
}

IdentifierExpression.prototype.toTableExpression = function() {
    var table = "table";
    if (this.name.indexOf('.') > 0) {
        var sT = this.name.split('.');
        return new ColumnExpression(table, sT[1], this.modifier + sT[0]);
    } else
        return new CellExpression(table, this.name, new RowNumber(0, '+'));
}

IdentifierExpression.prototype.toJsGet = function (symbolTable, insideAssignLoop) {
    if (this.promotedExpression) {
        return this.promotedExpression.toJsGet(symbolTable, insideAssignLoop);
    } else
        return this.name;
};

IdentifierExpression.prototype.toJsSet = function (expression, symbolTable, insideAssignLoop, filterColumn, filter) {
    var expJs = expression.toJsGet(symbolTable, insideAssignLoop);
    var fnsJs = symbolTable.getFunctionsJsSet();
    symbolTable.clearFunctions();

    return fnsJs + "$$ = " + this.name + " = " + expJs;
};

/**********************************************************
 * CellExpression 
 **********************************************************/

function CellExpression(table, column, row) {
    this.table = (table) ? table : "table"; //TODO check if default table or variable
    this.column = column;
    this.row = row;
}

module.exports.CellExpression = CellExpression;

CellExpression.prototype.fillSymbolTable = function(table) {
    table.registerSymbol(this.table, "T");
}

CellExpression.prototype.getSignature = function () {
    return ["$" + this.table + "[" + this.column + "]" ]; // + ((this.row && !this.row.relative) ? this.row.modifier + this.row.row : "") ];
}

CellExpression.prototype.toJsGet = function (symbolTable, insideAssignLoop) {
    symbolTable.registerSymbol(this.table, "T");
    return this.table + ".getValue('" + 
        this.column + "'," + 
        this.row.toJsGet(symbolTable, insideAssignLoop) + ")" 
};

CellExpression.prototype.toJsSet = function (expression, symbolTable, insideAssignLoop) {

    var expJs = expression.toJsGet(symbolTable, insideAssignLoop);
    var fnsJs = symbolTable.getFunctionsJsSet();
    symbolTable.clearFunctions();

    return fnsJs + "$$ = " + this.table + ".setValue('" + 
        this.column + "'," + 
        this.row.toJsGet(symbolTable, insideAssignLoop) + "," +
        expJs + ")"; 
};

/**********************************************************
 * RowNumber 
 **********************************************************/

function RowNumber(row, modifier) {
    this.row = isNaN(row) ? 0 : Number(row);
    this.modifier = modifier;
    this.relative = (modifier != '$');
}

module.exports.RowNumber = RowNumber;

RowNumber.prototype.toJsGet = function (symbolTable, insideAssignLoop) {
    if (this.relative) {
        return "$r " + this.modifier + this.row;
    } else {
        return this.row;
    }
};


/**********************************************************
 * ColumnExpression 
 **********************************************************/

function ColumnExpression(table, column, query) {
    this.table = (table) ? table : "table";
    this.column = column;
    this.query = query;
}

module.exports.ColumnExpression = ColumnExpression;

ColumnExpression.prototype.fillSymbolTable = function(table) {
    table.registerSymbol(this.table, "T");
}

ColumnExpression.prototype.getSignature = function () {
    return ["$" + this.table + "[" + this.column + "]"];
}

ColumnExpression.prototype.toJsGet = function(symbolTable, insideAssignLoop) {
    symbolTable.registerSymbol(this.table, "T");
    if (!this.query) {
        var js = this.table + ".getColumn('" + this.column + "', $r)";
        var symbolName = symbolTable.registerFunction("Column", js);
        return symbolName;
    } else if (this.query.toLowerCase() === "$parent" ) {
        var js = this.table + ".getParentValue('" + this.column + "', $r)";
        var symbolName = symbolTable.registerFunction("GetParentValue", js);
        return symbolName;
    } else {
        var js = this.table + ".findValues(1, '" + this.query + "', '"+ this.column + "')";
        var symbolName = symbolTable.registerFunction("FindValues", js);
        return symbolName;
    }
}

ColumnExpression.prototype.toJsGroupSet = function(expression, symbolTable, insideAssignLoop, filterColumn, filter) {
    symbolTable.registerSymbol(this.table, "T");
    var js = "";
    var expJs = expression.toJsGet(symbolTable, true);
    var fnsJs = symbolTable.getFunctionsJsSet();
    symbolTable.clearFunctions();

    if (filterColumn && filter) {
        js += 'if (String(' + this.table + '.getValue("' + filterColumn + '", $r)).startsWith("' + filter + '")) {'
    }

    js += fnsJs + "$$ = " + this.table + ".setValue('" + 
        this.column + "', $r," +
        expJs + ");"; 

    if (filterColumn && filter) {
        js += '}'
    }
    return js;
}

ColumnExpression.prototype.toJsSet = function(expression, symbolTable, insideAssignLoop, filterColumn, filter) {

    var js = "$rStack.push($r); for ($r = 0; $r == 0 || $r < " + this.table + ".values.length; $r++) {\n"

    js += this.toJsGroupSet(expression, symbolTable, insideAssignLoop, filterColumn, filter);

    js += "\n}; $r = $rStack.pop() || 0;"
    return js;
}

/**********************************************************
 * RangeExpression 
 **********************************************************/

function RangeExpression(table, startColumn, endColumn, startRow, endRow) {
    this.table = (table) ? table : "table";
    this.startColumn = startColumn;
    this.endColumn = endColumn;

    this.startRow = (startRow instanceof RowNumber) ? startRow : new RowNumber(startRow, '$');
    this.endRow = (endRow instanceof RowNumber) ? endRow : new RowNumber(endRow, '$');
}

RangeExpression.prototype.fillSymbolTable = function(table) {
    table.registerSymbol(this.table, "T");
}

RangeExpression.prototype.getSignature = function () {
    if (this.startColumn == this.endColumn)
        return ["$" + this.table + "[" + this.startColumn + "]"];
    else
        return ["$" + this.table + "[" + this.startColumn + "]", "$" + this.table + "[" + this.endColumn + "]"];
}

module.exports.RangeExpression = RangeExpression;

RangeExpression.prototype.toJsGet = function(symbolTable, insideAssignLoop) {
    symbolTable.registerSymbol(this.table, "T");
    var js = this.table + ".getRange('" + this.startColumn + 
        "','" + this.endColumn + 
        "', " + this.startRow.toJsGet(symbolTable, insideAssignLoop) + 
        ", "  + this.endRow.toJsGet(symbolTable, insideAssignLoop) + ")";

    var symbolName = symbolTable.registerFunction("Range", js);
    return symbolName;
}

RangeExpression.prototype.toJsSet = function(expression, symbolTable, insideAssignLoop) {
    symbolTable.registerSymbol(this.table, "T");

    var expJs = expression.toJsGet(symbolTable, true);
    var fnsJs = symbolTable.getFunctionsJsSet();
    symbolTable.clearFunctions();

    var js = "$rStack.push($r); for ($r = " + this.startRow.row + "; $r <= " + this.endRow.row + "; $r++) { " 
        js += fnsJs + "$$ = " + this.table + ".setValue('" + 
            this.startColumn + "', $r," +
            expJs + ");"; 
    js += " }; $r = $rStack.pop() || 0;"
    return js;
}

/**********************************************************
 * FunctionCallExpression 
 **********************************************************/

function FunctionCallExpression(identifier, fnParameters) {
    this.Identifier = identifier;
    this.CallParameters = fnParameters;
}

module.exports.FunctionCallExpression = FunctionCallExpression;

FunctionCallExpression.prototype.getChildExpressions = function () {
    return this.CallParameters;
}

FunctionCallExpression.prototype.toJsGet = function (symbolTable, insideAssignLoop) {
    var params = null;
    symbolTable.registerSymbol(this.Identifier, "F");
    for (var i = 0; i < this.CallParameters.length; i++) {
        if (params == null)
            params = this.CallParameters[i].toJsGet(symbolTable, insideAssignLoop);
        else
            params += "," + this.CallParameters[i].toJsGet(symbolTable, insideAssignLoop);
    }
    
    // var symbolName = symbolTable.registerFunction(this.Identifier, "$.fn." + this.Identifier + "(" + params + ")");
    var symbolName = symbolTable.registerFunction(this.Identifier, "$.injector.resolve($.fn." + this.Identifier + ")(" + params + ")");
    return symbolName;
};

/**********************************************************
 * VariableDefListExpression 
 **********************************************************/
function VariableDefListExpression(defArray) {
    this.defArray = defArray;
}

module.exports.VariableDefListExpression = VariableDefListExpression;

VariableDefListExpression.prototype.fillSymbolTable = function(table) {
    if (this.defArray) {
        for (var i = 0; i < this.defArray.length; i++)
            table.registerSymbol(this.defArray[i], 'V');
    }
}

VariableDefListExpression.prototype.getChildExpressions = function () {
    return [];
}

VariableDefListExpression.prototype.getSignature = function () {
    return this.defArray.slice(0);
}

VariableDefListExpression.prototype.toJsGet = function (symbolTable, insideAssignLoop) {
    throw { Message: "Can not get from a VariableDefListExpression" };
};

VariableDefListExpression.prototype.toJsSet = function (expression, symbolTable, insideAssignLoop) {
    // if (this.defArray) {
    //     for (var i = 0; i < this.defArray.length; i++)
    //         symbolTable.registerSymbol(this.defArray[i], 'V');
    // }
};

/**********************************************************
 * OperatorExpression 
 **********************************************************/

function OperatorExpression (expression1, expression2, operator) {
    this.expression1 = expression1;
    this.expression2 = expression2;
    this.operator = operator;
}

module.exports.OperatorExpression = OperatorExpression;

OperatorExpression.prototype.getChildExpressions = function () {
    return [this.expression1, this.expression2];
}

OperatorExpression.prototype.toJsGet = function (symbolTable, insideAssignLoop) {

    var js;

    if (this.operator === "+") {
        js = "$.fn.ADD(" + this.expression1.toJsGet(symbolTable, insideAssignLoop)
            + ", " + this.expression2.toJsGet(symbolTable, insideAssignLoop) + ")"; 
    } else if (this.operator === "-") {
        js = "$.fn.SUBTR(" + this.expression1.toJsGet(symbolTable, insideAssignLoop)
            + ", " + this.expression2.toJsGet(symbolTable, insideAssignLoop) + ")"; 
    } else if (this.operator === "*") {
        js = "$.fn.MULT(" + this.expression1.toJsGet(symbolTable, insideAssignLoop)
            + ", " + this.expression2.toJsGet(symbolTable, insideAssignLoop) + ")"; 
    } else if (this.operator === "/") {
        js = "$.fn.DIV(" + this.expression1.toJsGet(symbolTable, insideAssignLoop)
            + ", " + this.expression2.toJsGet(symbolTable, insideAssignLoop) + ")"; 
    } else if (this.operator === "==") {
        js = "$.fn.EQ(" + this.expression1.toJsGet(symbolTable, insideAssignLoop)
            + ", " + this.expression2.toJsGet(symbolTable, insideAssignLoop) + ")"; 
    } else if (this.operator === "!=") {
        js = "$.fn.NEQ(" + this.expression1.toJsGet(symbolTable, insideAssignLoop)
            + ", " + this.expression2.toJsGet(symbolTable, insideAssignLoop) + ")"; 
    } else if (this.operator === ">") {
        js = "$.fn.GT(" + this.expression1.toJsGet(symbolTable, insideAssignLoop)
            + ", " + this.expression2.toJsGet(symbolTable, insideAssignLoop) + ")"; 
    } else if (this.operator === ">=") {
        js = "$.fn.GTE(" + this.expression1.toJsGet(symbolTable, insideAssignLoop)
            + ", " + this.expression2.toJsGet(symbolTable, insideAssignLoop) + ")"; 
    } else if (this.operator === "<") {
        js = "$.fn.ST(" + this.expression1.toJsGet(symbolTable, insideAssignLoop)
            + ", " + this.expression2.toJsGet(symbolTable, insideAssignLoop) + ")"; 
    } else if (this.operator === "<=") {
        js = "$.fn.STE(" + this.expression1.toJsGet(symbolTable, insideAssignLoop)
            + ", " + this.expression2.toJsGet(symbolTable, insideAssignLoop) + ")"; 
    } else {
        js = this.expression1.toJsGet(symbolTable, insideAssignLoop) + this.operator 
            + this.expression2.toJsGet(symbolTable, insideAssignLoop);
    }

    // return js;
    var symbolName = symbolTable.registerFunction("Op", js);
    return symbolName;

}

OperatorExpression.prototype.toJsSet = function (expression, symbolTable, insideAssignLoop) {
    throw {Message: "Can not set to a complex expression"};
}

/**********************************************************
 * NumberExpression 
 **********************************************************/

function NumberExpression(text) {
    this.Text = text;
}

module.exports.NumberExpression = NumberExpression;

NumberExpression.prototype.toJsGet = function (symbolTable, insideAssignLoop) {
    return Number(this.Text).toString();
};

/**********************************************************
 * StringExpression 
 **********************************************************/

function StringExpression(text) {
    this.Text = text;
}

module.exports.StringExpression = StringExpression;

StringExpression.prototype.toJsGet = function (symbolTable, insideAssignLoop) {
    return this.Text;
};

/**********************************************************
 * ArrayExpression 
 **********************************************************/

function ArrayExpression(arr) {
    this.Array = arr;
}

module.exports.ArrayExpression = ArrayExpression;

ArrayExpression.prototype.toJsGet = function (symbolTable, insideAssignLoop) {
    return JSON.stringify(this.Array);
};

/**********************************************************
 * ParentisisExpression 
 **********************************************************/

function ParentisisExpression(expression) {
    this.expression = expression;
}

module.exports.ParentisisExpression = ParentisisExpression;

ParentisisExpression.prototype.getChildExpressions = function () {
    return [this.expression];
}

ParentisisExpression.prototype.toJsGet = function (symbolTable, insideAssignLoop) {
    return '(' + this.expression.toJsGet(symbolTable, insideAssignLoop) + ')';
};

/**********************************************************
 * NegativeExpression 
 **********************************************************/

function NegativeExpression(expression) {
    this.expression = expression;
}

module.exports.NegativeExpression = NegativeExpression;

NegativeExpression.prototype.getChildExpressions = function () {
    return [this.expression];
}

NegativeExpression.prototype.toJsGet = function (symbolTable, insideAssignLoop) {
    return '$.fn.MULT(' + this.expression.toJsGet(symbolTable, insideAssignLoop) + ', -1)';
};

/**********************************************************
 * NotExpression 
 **********************************************************/

function NotExpression(expression) {
    this.expression = expression;
}

module.exports.NotExpression = NotExpression;

NotExpression.prototype.getChildExpressions = function () {
    return [this.expression];
}

NotExpression.prototype.toJsGet = function (symbolTable, insideAssignLoop) {
    return '$.fn.NOT(' + this.expression.toJsGet(symbolTable, insideAssignLoop) + ')';
};

/**********************************************************
 * PercentExpression 
 **********************************************************/

function PercentExpression(expression) {
    this.expression = expression;
}

module.exports.PercentExpression = PercentExpression;

PercentExpression.prototype.getChildExpressions = function () {
    return [this.expression];
}

PercentExpression.prototype.toJsGet = function (symbolTable, insideAssignLoop) {
    return "$.fn.Percent(" + this.expression.toJsGet(symbolTable, insideAssignLoop) + ")";
};

/**********************************************************
 * PowExpression 
 **********************************************************/

function PowExpression(baseExpression, expExpression) {
    this.B = baseExpression;
    this.E = expExpression;
}

module.exports.PowExpression = PowExpression;

PowExpression.prototype.getChildExpressions = function () {
    return [this.E, this.B];
}

PowExpression.prototype.toJsGet = function (symbolTable, insideAssignLoop) {
    return "$.fn.POW(" + this.B.toJsGet(symbolTable, insideAssignLoop) + "," + this.E.toJsGet(symbolTable, insideAssignLoop) + ")";
};

/*********************************************************
 * getExpressionDependecies
 *********************************************************
 * devolve a lista de todas as dependencias de uma 
 * determinada expressão
 *********************************************************/
function getExpressionDependecies(expression) {
    var deps = [];

    if (expression.getChildExpressions) {
        var children = expression.getChildExpressions();
        for (var i = 0; i < children.length; i++) {
            if (children[i].getSignature) {
                deps.push.apply(deps, children[i].getSignature())
            } else
                deps.push.apply(deps, getExpressionDependecies(children[i]));
        }
    }

    return deps;
}

/*********************************************************
 * getAssignedVars
 *********************************************************
 * devolve a lista de todas as variaveis que são assignadas
 * por uma determinada expressão.
 *********************************************************/
function getAssignedVars(expression) {
    var ret = []

    if (expression.constructor === AssignExpression) {
        var signature = expression.identifier.getSignature();
        if (signature.length) {
            for (var s = 0; s < signature.length; s++)
                if (ret.indexOf(signature[s]) < 0)
                    ret.push(signature[s]);
        }
    } else if (expression.constructor === VariableDefListExpression) {
        var signature = expression.getSignature();
        if (signature.length) {
            for (var s = 0; s < signature.length; s++)
                if (ret.indexOf(signature[s]) < 0)
                    ret.push(signature[s]);
        }
    } else if (expression.constructor === AssignExpressionGroup) {
        for (var e = 0; e < expression.expressions.length; e++) {
            var signature = getAssignedVars(expression.expressions[e]);
            for (var s = 0; s < signature.length; s++)
                if (ret.indexOf(signature[s]) < 0)
                    ret.push(signature[s]);
        }
    }

    return ret;
}

/**************************************************
 * getUnresolvedVars
 **************************************************
 * devolve a lista de todas as pontenciais variaveis
 * não resolvidas: i.e. a lista de todas as variaveis
 * assignadas não pertencentes ao contexto
 **************************************************/
function getUnresolvedVars(expressions) {
    var contextVars = [];
    var ret = [];
    if (expressions && expressions.length) {
        for (var e = 0; e < expressions.length; e++) {
            var exp = expressions[e];
            if (exp.constructor === AssignExpression) {
                var signature = exp.identifier.getSignature();
                if (signature.length) {
                    for (var s = 0; s < signature.length; s++) {
                        if (contextVars.indexOf(signature[0]) < 0) {
                            if (ret.indexOf(signature[s]) < 0)
                                ret.push(signature[s]);
                        }
                    }
                }
            } if (exp.constructor === AssignExpressionGroup) {
                var signature = getUnresolvedVars(exp.expressions);
                for (var s = 0; s < signature.length; s++)
                    if (ret.indexOf(signature[s]) < 0)
                        ret.push(signature[s]);
            } else if (exp.constructor === VariableDefListExpression) {
                var signature = exp.getSignature();
                if (signature.length) {
                    for (var s = 0; s < signature.length; s++)
                        contextVars.push(signature[s]);
                }       
            }
        }
    }
    return ret;
}

/*********************************************************
 * sortExpressions
 *********************************************************
 * ordena a lista de expressões de acordo com as suas
 * dependencias e variaveis resolvidas
 *********************************************************/
function sortExpressions(org_expressions) {
    var expressions = org_expressions.slice(0);
    var sortedExpressions = [];
    var resolvedSignatures = [];
    var suspectedVariables = [];
    var unresolvedVars = getUnresolvedVars(org_expressions);
    var done = false;
    var ntry = 0;
    while (!done) {
        for (var i = 0; i < expressions.length; i++) {
            var e = expressions[i];
            var deps = getExpressionDependecies(e);
            var assignVars = getAssignedVars(e);

            var resolved = true;
            var foundToResolve = false;
            for (var d = 0; d < deps.length; d++) {
                if (unresolvedVars.indexOf(deps[d]) >= 0) {
                    var foundToResolve = true;
                    if (resolvedSignatures.indexOf(deps[d]) < 0 
                        && assignVars.indexOf(deps[d]) < 0
                        && deps[d] != "$table[row]") 
                    {
                        //if (deps[d].startsWith("$") && suspectedVariables.indexOf(deps[d]) < 0) {
                        if (suspectedVariables.indexOf(deps[d]) < 0) {
                            suspectedVariables.push(deps[d]);
                        }
                        resolved = false;
                        break;
                    }
                }
            }

            if (resolved) {
                var signatures = assignVars;
                for (var s = 0; s < signatures.length; s++) {
                    if (resolvedSignatures.indexOf(signatures[s]) < 0)
                        resolvedSignatures.push(signatures[s])

                    if (foundToResolve && unresolvedVars.indexOf(signatures[s]) >= 0) {
                        var idx = unresolvedVars.indexOf(signatures[s]);
                        unresolvedVars.splice(idx, 1);            
                    }
                        
                }

                sortedExpressions.push(e);
                ntry = 0;
            }
        }

        for (var i = 0; i < sortedExpressions.length; i++) {
            var idx = expressions.indexOf(sortedExpressions[i]);
            if (idx >= 0) {
                expressions.splice(idx, 1);
            }
        }

        ntry++;
        done = (expressions.length == 0 || ntry > 2);


        //lets first treat suspected variables that are columns
        if (done) {
            if (suspectedVariables.length > 0) {

                var regex = /^\$[a-zA-Z_][a-zA-Z_0-9]*\[[a-zA-Z_][a-zA-Z_0-9]*\]\$[0-9]+$/g;
                var found = false;
                for (var sv = 0; sv < suspectedVariables.length; sv++) {
                    var suspectedSg = suspectedVariables[sv];
                    for (var rv = 0; rv < resolvedSignatures.length; rv++) {
                        var resolvedSg = resolvedSignatures[rv];
                        if (resolvedSg.startsWith(suspectedSg) && regex.test(resolvedSg)) {
                            resolvedSignatures.push(suspectedVariables.splice(sv,1)[0]);
                            found = true;
                            break;
                        }
                    } 

                }

                if (found) {
                    ntry = 0;
                    done = false;
                }
            }
        }


        //lets assume others as resolved :()
        if (done) {
            if (suspectedVariables.length > 0) {
                resolvedSignatures.push(suspectedVariables.splice(0,1)[0]);
                ntry = 0;
                done = false;
            }
        }
        
    }
    return sortedExpressions;
}

/**********************************************************
 * Remove code that do not contribute to any output
 * (table or global variable)
 **********************************************************/
function CleanExpressions(org_expressions) {
    var expressions = org_expressions.slice(0);
    var resolvedSignatures = [];
    var resolvedExpressions = [];
    var done = false;
    var ntry = 0; 
    while (!done) {
        for (var i = 0; i < expressions.length; i++) {
            var e = expressions[i];
            if (e.identifier && e.identifier.getSignature) {
                var sigValid = true;
                for (var s = 0; s < e.identifier.getSignature().length; s++) {
                    var signature = e.identifier.getSignature()[s];
                    if (signature.startsWith('@') || resolvedSignatures.indexOf(signature) >= 0)
                        sigValid &= true;
                    else
                        sigValid = false;
                }
                e.branchIsValid = sigValid;
            }
                
            if (i == org_expressions.length -1)
                e.branchIsValid = true;

            if (e.branchIsValid) {
                if (e.identifier && e.identifier.getSignature)
                    resolvedSignatures.push.apply(resolvedSignatures, e.identifier.getSignature())

                resolvedSignatures.push.apply(resolvedSignatures, GetExpressionDependecies(e));
                resolvedExpressions.push(e);
                ntry = 0;
            }
        }

        for (var i = 0; i < resolvedExpressions.length; i++) {
            var idx = expressions.indexOf(resolvedExpressions[i]);
            if (idx >= 0) {
                expressions.splice(idx, 1);
            }
        }

        ntry++;
        done = (expressions.length == 0 || ntry > 1);
    }

    var ret = [];

    // Debug dead code elimination
    // var SymbolTable = require("./symbolTable").SymbolTable;
    // var table = new SymbolTable();

    for (var i = 0; i < org_expressions.length; i++) {
        var idx = resolvedExpressions.indexOf(org_expressions[i]);
        if (idx >= 0) {
            ret.push(org_expressions[i]);
        } 
        // Debug dead code elimination
        // else
        //     console.log(org_expressions[i].toJsSet(null,table,false) + "\n");
    }

    return ret;

}

function fillSymbolTable(table, expressions)  {
    for (var e = 0; e < expressions.length; e++) {
        var expression = expressions[e];
        if (expression.constructor === AssignExpression) {
            expression.identifier.fillSymbolTable(table);
        } else if (expression.constructor === VariableDefListExpression) {
            var signature = expression.fillSymbolTable(table);
        } else if (expression.constructor === AssignExpressionGroup) {
            fillSymbolTable(table, expression.expressions);
        }
    }
}

function getAllIdentifiers(expressions) {
    var deps = [];
    for (var e = 0; e < expressions.length; e++) {
        var expression = expressions[e];
        if (expression.getChildExpressions) {
            var children = expression.getChildExpressions();
            for (var i = 0; i < children.length; i++) {
                if (children[i].constructor === IdentifierExpression) {
                    deps.push(children[i]);
                } else
                    deps.push.apply(deps, getAllIdentifiers([children[i]]));
            }
        }
    }

    return deps;
}

function promoteIdentifiers(table, expressions) {
    var idents = getAllIdentifiers(expressions);
    for (var i = 0; i < idents.length; i++) {
        if (idents[i].promote)
            idents[i].promote(table);
    }
}

function CreateFunction(program, outputLang) {
    return CreateFunctionJs(program);
}

/**********************************************************
 * CreateFunction Js
 **********************************************************/
function CreateFunctionJs(program) {

    var table = new SymbolTable();

    var expression = program.expressions;

    var functionBody = "";
    
    if (expression.constructor === Array) {


        /***********************************************
         * fill assigned variables into the symbolTable 
         * and promote to another type as needed  
         ***********************************************/
        fillSymbolTable(table, expression);
        promoteIdentifiers(table, expression);

        //need to sort and remove dead tree branches from [expression]
        var sorted = sortExpressions(expression);
        var cleaned = sorted;

        for (var i = 0; i < cleaned.length; i++) {
            var exp = cleaned[i];
            if (exp.constructor === AssignExpressionGroup) {
                exp.expressions = sortExpressions(exp.expressions);
            }
            functionBody += cleaned[i].toJsSet(null,table,false) + "\n";
        }

    } else {
        functionBody += expression.toJsSet(null,table,false) + "\n";
    }
    
    if (table && table.symbols) {

        var symbols = table.getRootSymbols()

        for (var v = 0; v < symbols.length; v++) {
            functionBody += '$.g["'+ symbols[v] +'"] = ' + symbols[v] + ';\n'
        }
    }



    // if ($ && $.globals) {
    //     var $gNames = Object.keys($.globals);
    //     for (var n = 0; n < $gNames.length; n++) {
    //         var $name = $gNames[n];
    //         var $value = $globals[name];
    //     }
    // }

    functionBody += "return ($$) ? $$ : 0;";

    var symbolDeclarations = "var $$ = 0;\n";
    symbolDeclarations += "var $r = 0;\n";
    symbolDeclarations += "var $rStack = [];\n";

    symbolDeclarations += "if (!$.g) $.g = {};\n";
    symbolDeclarations += "if (!$.fn) $.fn = {};\n";


    for (var s = 0; s < table.symbols.length; s++) {
        var symbol = table.symbols[s]
        symbolDeclarations += symbol.getDeclaration();
    }
        
    functionBody = symbolDeclarations + functionBody;

    try {
        return Function("$", functionBody);
    } catch (error) {
        console.log(functionBody);
        throw error;
    }
    
}

module.exports.CreateFunction = CreateFunction;
},{"./symbolTable":19}],11:[function(require,module,exports){
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


},{"./predicates":17,"js-array-extensions":15,"moment":16}],12:[function(require,module,exports){
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


},{"./fnHelpers":11,"./predicates":17,"js-array-extensions":15,"moment":16}],13:[function(require,module,exports){
(function (process){
'use strict';

var SymbolTable = require("./symbolTable");
var DataTable = require("./dataTable");
var Context = require("./context");
var parser = require("./rLang").parser;
var appVersion = "1.2.073117.1";

function measureTime(start) {
    if (!process || !process.hrtime) return [0,-1]
    if ( !start ) return process.hrtime();
    var end = process.hrtime(start);
    return end;
}

function Compile (formula, expressions) {

    var expression = "";

    if (formula)
        expression = formula;
    else if (expressions.constructor === Array) {
        for (var i = 0; i < expressions.length; i++) {
            if (expressions[i].Variable) {
                var v = expressions[i].Variable;
                var e = expressions[i].Expression;
                if (v && e) {
                    expression += v + " = {" + e + "}\n";
                }
            } else if (expressions[i].ContextDefinition && expressions[i].ContextDefinition === Array) {
                expression += "context { " + expressions[i].ContextDefinition.join(',') +  " }\n";
            }
        } 
    } else
        throw { Message: "expressions must be an array of expression definitions"}

    var fn = parser.parse(expression);
    return fn;
}

function ExecuteList(fn, event) {
    var ctx = event.Context;
    var retVars = event.Exports;
    var globals = event.Globals;
    var returnData = [];
    if (ctx && ctx.constructor === Array) {
        for (var i = 0; i < ctx.length; i++) {

            var variables = (globals && globals.Variables) 
                ? Object.assign({}, globals.Variables, ctx[i].Variables) 
                : ctx[i].Variables;

            var data = (globals && globals.Data) 
                ? Object.assign({}, globals.Data, ctx[i].Data) 
                : ctx[i].Data;

            var startTime = measureTime();
            var context = new Context(variables, data, null)
            var r = fn(context, retVars);
            var result = { Id: ctx[i].Id, ResultItems: [], Result: r };

            returnData.push(result);

            result.ResultItems = context.g;
            if (ctx[i].returnTables) result.tables = context.t;

            var endTime = measureTime(startTime);
            result.Duration = endTime[0] + endTime[1] / 1e9;

            

        }
    } else
        throw { Message: "Context must be an array of timesheet contexts"}

    return returnData;
}

exports.context = Context;
exports.parser = parser;
exports.symbolTable = SymbolTable;
exports.dataTable = DataTable;

exports.handler = (event, context, callback) => {
    //console.log('Received event:', JSON.stringify(event, null, 2));
        
    var ret = {};
    var err = null;

    try {
        if (event && (event.Expressions || event.Formula)) {
            
            var startTime = measureTime();

            var fn = Compile(event.Formula, event.Expressions);

            var compileTime = measureTime(startTime);

            ret.Result = ExecuteList(fn, event);

            var totalTime = measureTime(startTime);

            ret.Ok = true;
            ret.Message = "Ok."
            ret.Duration = totalTime[0] + totalTime[1] / 1e9;
            ret.CompileDuration = compileTime[0] + compileTime[1] / 1e9;

            if (event.debug || event.Debug) {
                ret.Code = fn.toString();
            }
        }
    } catch (error) {
         ret.Ok = false;
         ret.Error = error;
         ret.Message = (error) ? ((error.message) ? error.message : error) : "Error" ;
         if (error && !error.message) {
             console.log('error:', JSON.stringify(error, null, 2));
         }
         err = error;
    }
        
    ret.version = appVersion;

    if (callback) {
        //lambda will not throw errors;
        callback(null, ret);
    } else {
        //normal calls will throw errors for unit tests
        if (err) throw err;
        return ret;
    }
    
};
}).call(this,require('_process'))

},{"./context":6,"./dataTable":7,"./rLang":18,"./symbolTable":19,"_process":3}],14:[function(require,module,exports){
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
},{"./fnHelpers":11,"./predicates":17,"js-array-extensions":15,"moment":16}],15:[function(require,module,exports){


"use strict"
;

var _MESSAGE_OF_NULL_REFERENCES         = function(argName) { return argName + " is null (a) references."; };
var _MESSAGE_OF_NULL_ARGUMENTS          = function(argName) { return argName + " is null (an) arguments"; };
var _MESSAGE_OF_INVALID_ARGUMENTS       = function(argName, needsType) { return argName + " is (an) invalid arguments." + ( !needsType ? "It's have to " + needsType : ""); };
var _MESSAGE_OF_NOT_SUPPORT_ARGUMENTS	= function(argName, argObject) { return  typeof argObject + " type of " + argName + " argument is not support"; };


var foreach = foreach || {

    "continue": true,
    "break"   : false

};

var comparer = comparer || {
    _ascending  : function(a, b) { return a - b },
    ascending   : this._ascending,
    asc         : this.ascending,
    _descending : function(a, b) { return b - a },
    descending  : this._descending,
    desc        : this.descending
};


function isFunction( fn ) {
    return typeof fn === 'function';
}

function isArray( obj ) {
    return typeof obj === "object" && obj instanceof Array;
}


function isObject( obj ) {
    return typeof obj === "object" && (isArray(obj) === false );
}

function isNumber( obj ) {
    return typeof obj === "number" || obj instanceof Number;
}

function isString( obj ) {
    return typeof obj === "string" || obj instanceof String;
}

function isBoolean( obj ) {
    return typeof obj === "boolean";
}

function isContains( source, object ) {

	if( arguments.length === 0 )		throw "second argument needs an array";
	if( !source )						throw _MESSAGE_OF_NULL_ARGUMENTS("source");
	if( !object )						throw _MESSAGE_OF_NULL_ARGUMENTS("object");

	if( source.isString() ) {
		return source.indexOf(object) >= 0;
	} else if ( source.isArray() ) {
		for(var i=0; i<source.length; i++) {
			if( source[i] == object ) return true;
		}

		return false;
	}

	throw _MESSAGE_OF_NOT_SUPPORT_ARGUMENTS("source", source);

}

function _cloneObject( obj ) {

    console.info(obj.toString() + " cloned type = " + typeof obj);

    if( isString(obj) || isNumber(obj) || isBoolean(obj)) {
        return obj.constructor(obj);
    }

    if( isArray(obj)) {
        return Array.clone(obj);
    }

    var prop = Object.getOwnPropertyNames(obj);
    if( prop && prop.length === 0) {
        return new Object(obj);
    }
    var newObj = {};
    for(var i=0; i<prop.length; i++) {

        var item = obj[prop[ i ]];

        if( isObject(item) ) {
            _cloneObject(item);
        }

        newObj[ prop[i] ] = item;
    }

    return newObj;

};

function print( obj ) {

    if( isString(obj) || isNumber(obj) || isBoolean(obj)) {
        console.info("print :      " + obj);
        return;
    }

        var prop = Object.getOwnPropertyNames(obj);
        if( prop && prop.length === 0) {
            return;
        }
        for(var i=0; i<prop.length; i++) {

            console.info("print : " + prop[i]);

            var item = obj[prop[ i ]];

                print(item);
        }
}


// Object.clone = function(obj) {
//     return _cloneObject(obj);
// };


// Object.prototype.isFunction = function() {
//     return isFunction(this);
// };

// Object.prototype.isArray = function() {
//     return isArray(this);
// };

// Object.prototype.isObject = function() {
//     return isObject(this);
// };

// Object.prototype.isNumber = function() {
//     return isNumber(this);
// };

// Object.prototype.isString = function() {
//     return isString(this);
// };

// Object.prototype.equals = function( destination ) {

// 	if( isArray(this) && destination.isArray() ) return !(this > destination || this < destination);
// 	else if( isObject(this)) {
// 		return this == destination;
// 	}

// 	return this == destination;

// };


Array.clone = function( array ) {

    array   = (array && array.isArray()) ? array : [ array ];

    var arr = [];
    for(var i=0; i<array.length; i++) {
        arr.push( Object.clone(array[ i ]) );
    }

    return arr;
};

Array.prototype.foreach = function(fn, args) {

    if( this.isArray())
    {
        if(fn.isFunction()) {

            var num, obj, param;
            for(var i=0;i<this.length;i++) {

                num     = i;
                obj     = this[i];
                param   = args;

                if( fn.length === 1 ) num = obj;

                var isContinue = fn.apply(this, [ num, this[i], args ]);

                if ( isContinue === false ) break;

            }
        }
    }
};


Array.prototype.any = function( predicate ) {


    if( predicate && predicate.isFunction()) {
        for (var i = 0, item; item = this[i]; i++)
        {
            if (predicate(item)) return true;
        }

        return false;
    }
    else {
        if( this.length > 0 ) return true;
    }

};


Array.prototype.first = function( predicate )
{
    if ( predicate && predicate.isFunction()) {

        for(var i=0;i<this.length;i++) {
            if(predicate(this[i])) return this[i];
        }

        throw _MESSAGE_OF_NULL_REFERENCES("no predicate")
    }
    else {
        var ret = this.length > 0 ? this[0] : null;
        if( ret === null ) throw _MESSAGE_OF_NULL_REFERENCES("ret");

        return ret;
    }
};


Array.prototype.firstOrDefault = function( predicate ) {
    if ( predicate && predicate.isFunction()) {

        for(var i=0;i<this.length;i++) {
            if(predicate(this[i])) return this[i];
        }

        return null;
    }
    else {
        return this.length > 0 ? this[0] : null;
    }
};

Array.prototype.firstOrNew = function ( predicate ) {
    var first = this.firstOrDefault(predicate);

    return first || [];
};


Array.prototype.lastOrDefault = function( predicate ) {
    if ( predicate && predicate.isFunction()) {

        for(var i=this.length-1;i>=0;i--) {
            if(predicate(this[i])) return this[i];
        }

        return null;
    }
    else {
        var ret = this.length > 0 ? this[this.length-1] : null;
        if( ret === null ) return null;

        return ret;
   }
};

Array.prototype.lastOrNew = function( predicate ) {
    var last = this.lastOrDefault(predicate);

    return last || [];
};

Array.prototype.last = function( predicate ) {
    var last = this.lastOrDefault(predicate);
    return last;
};



Array.prototype.select = function( selector ) {
    if( selector && selector.isFunction()) {
        var arr = [];
        for(var i=0; i<this.length; i++) {
            arr.push( selector(this[i]) );
        }

        return arr;
    }
    else {
    }
};

Array.prototype.where = function( selector ) {
    var arr = [], i;
    if( selector && selector.isFunction()) {
        for(i=0; i<this.length; i++) {
            if( selector(this[i])) {
                arr.push(this[i]);
            }
        }

        return arr;
    } else {
        for(i=0; i<this.length; i++ ) {
            if( this[i] == selector ) {
                arr.push(this[i]);
            }
        }

        return arr;
    }
};



Array.prototype.orderBy = function( _comparer ) {

    _comparer = _comparer || comparer.ascending;

    return this.sort(_comparer);
};


Array.prototype.take = function( number ) {

    if( arguments.length === 0 ) number = 0;

    if( number && number.isNumber()) {
        number = number > this.length ? this.length : number;

        var arr = [];
        for(var i=0; i<number; i++) {
            arr.push( this[i] );
        }

        return arr;
    }
};

Array.prototype.skip = function( number ) {

    if( arguments.length === 0 ) number = 0;

    if( number && number.isNumber()) {
        number = number > this.length ? this.length : number;

        var arr = [];
        for(var i=number; i<this.length; i++) {
            arr.push( this[i] );
        }

        return arr;
    }

}

Array.prototype.sum = function( selector ) {

    var sum = 0, i;
    if( selector && selector.isFunction()) {

        for(i=0; i<this.length; i++) {
            sum += selector( this[i] );
        }

    } else {

        for(i=0; i<this.length; i++) {

            var current = this[i];

            if( current.isNumber()) {
                sum += current;
            } else if( current.isString()) {

                if( current.indexOf(".") > 0) {
                    sum += parseFloat(current);
                }
                else {
                    sum += parseInt(current);
                }
            }
        }
    }

    return sum;
};

Array.prototype.average = function( selector ) {

    if( this.length === 0 ) return 0;

    var sum = this.sum(selector);
    return sum / this.length;
};

Array.prototype.max = function( predicate ) {

    var max, i;

    if( this.length === 0 ) max = null;
    if( this.length > 0 ) max = this[0];

    if( predicate && predicate.isFunction() ) {

        for(i=0; i<this.length; i++ ) {
            var pred = predicate(this[i]);
            if( pred && max < this[i] ) {
                max = this[i];
            }
        }

    } else {

        for(i=0; i<this.length; i++) {
            var dest = this[i];
            if( max < dest ) {
                max = dest;
            }
        }
    }

    return max;
}

Array.prototype.min = function( predicate ) {
    var min, i;

    if( this.length === 0 ) min = null;

    if( this.length > 0 ) min = this[0];

    if( predicate && predicate.isFunction() ) {

        for(i=0; i<this.length; i++ ) {
            var pred = predicate(this[i]);
            if( pred && min > this[i] ) {
                min = this[i];
            }
        }

    } else {

        for(i=0; i<this.length; i++) {
            var dest = this[i];
            if( min > dest ) {
                min = dest;
            }
        }
    }

    return min;
}


Array.range = function( start, max, step ) {

    if( arguments.length === 0 )        throw "range method needs one or more arguments"
    if( start && !start.isNumber())     throw _MESSAGE_OF_INVALID_ARGUMENTS("start", "Number");
    if( max   && !max.isNumber())       throw _MESSAGE_OF_INVALID_ARGUMENTS("max", "Number");
    if( step  && !step.isNumber())      throw _MESSAGE_OF_INVALID_ARGUMENTS("step", "Number");


    var arr = [];
    _range(arr, start, max, step);

    return arr;
};


function _range( arr, start, max, step ) {
    step = step || 1;

    if( !arr || !arr.isArray() ) throw _MESSAGE_OF_NULL_ARGUMENTS("arr");
    if( !max ) {
        max     = start;
        start   = 0;
    }

    if( start >= max ) return;

    for(var i=start; i<max; i+= step) {
        arr.push( i );
    }
}


Array.prototype.range = function( start, max, step ) {

    if( arguments.length === 0 )        throw "range method needs one or more arguments";
    if( start && !start.isNumber())     throw _MESSAGE_OF_INVALID_ARGUMENTS("start", "Number");
    if( max   && !max.isNumber())       throw _MESSAGE_OF_INVALID_ARGUMENTS("max", "Number");
    if( step  && !step.isNumber())      throw _MESSAGE_OF_INVALID_ARGUMENTS("step", "Number");

    _range(this, start, max, step);

    return this;
};


function _union( first, second ) {

    var i;

	if (arguments.length < 1)       throw "second argument needs an array";

    first  = (first  && first.isArray())    ? first : [ first ];
	var arr = Array.clone(first);

	for(i=1; i<arguments.length; i++) {
		second = arguments[i];
		if( !second ) continue;

		second = (second && second.isArray())   ? second : [ second ];

		for(i=0; i<second.length; i++) {
			arr.push( Object.clone(second[ i ]) );
	    }
	}

	return arr;
}


Object.union = _union;

Array.union = _union;

Array.prototype.union = Array.prototype.union || function( second ) {

    if( arguments.length === 0 )        throw "second argument needs an array";
    if( second && !second.isArray())    throw _MESSAGE_OF_INVALID_ARGUMENTS("second", "Array");

	return _union.apply(this, arguments);
};



Array.distinct = function( first, second ) {

	var arr = [];
	for(var i=0; i<arguments.length; i++) {

		if (!arguments[i] ) 			throw _MESSAGE_OF_NULL_ARGUMENTS(i + " index argument");
		if (!arguments[i].isArray())	throw _MESSAGE_OF_INVALID_ARGUMENTS(i + " index argument", "Array");
		if (arguments.length === 0)		continue;

		for(var x=0; x<arguments[i].length; x++) {
			var pickup = arguments[i][x];
			if( !isContains(arr, pickup)) arr.push(pickup);
		}
	}

	return arr;
};

Array.prototype.distinct = Array.distinct;



function _join( first, second, primaryKey, foreignKey, selector ) {

	if( !first )		throw _MESSAGE_OF_NULL_ARGUMENTS("first");
	if( !second )       throw _MESSAGE_OF_NULL_ARGUMENTS("second");

	if( !first.isArray() )			throw _MESSAGE_OF_NOT_SUPPORT_ARGUMENTS("first", first);
	if( !second.isArray() )			throw _MESSAGE_OF_NOT_SUPPORT_ARGUMENTS("second", second);

	var arr = [];
	primaryKey = primaryKey || function(a) { return a; };
	foreignKey = foreignKey || function(b) { return b; };
	selector   = selector   || function(a,b) { return a; };

	for(var l=0; l<first.length; l++) {
		for(var r=0; r<second.length; r++) {

			var args = [ first[l], second[r] ];
			var a 	 = primaryKey(first[l]);
			var b 	 = foreignKey(second[r]);

			var isMatch = a === b;
			if( isMatch !== undefined && isMatch ) {
				var result = selector.apply(this, args);
				arr.push(result);
			}
		}
	}

	return arr;
}

Array.innerJoin = Array.innerJoin || _join;

Array.prototype.innerJoin = Array.prototype.innerJoin || function( dest, primaryKey, foreignKey, selector ) {
	return _join( this, dest, primaryKey, foreignKey, selector );
};



},{}],16:[function(require,module,exports){
//! moment.js
//! version : 2.14.1
//! authors : Tim Wood, Iskren Chernev, Moment.js contributors
//! license : MIT
//! momentjs.com

;(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    global.moment = factory()
}(this, function () { 'use strict';

    var hookCallback;

    function utils_hooks__hooks () {
        return hookCallback.apply(null, arguments);
    }

    // This is done to register the method called with moment()
    // without creating circular dependencies.
    function setHookCallback (callback) {
        hookCallback = callback;
    }

    function isArray(input) {
        return input instanceof Array || Object.prototype.toString.call(input) === '[object Array]';
    }

    function isObject(input) {
        return Object.prototype.toString.call(input) === '[object Object]';
    }

    function isObjectEmpty(obj) {
        var k;
        for (k in obj) {
            // even if its not own property I'd still call it non-empty
            return false;
        }
        return true;
    }

    function isDate(input) {
        return input instanceof Date || Object.prototype.toString.call(input) === '[object Date]';
    }

    function map(arr, fn) {
        var res = [], i;
        for (i = 0; i < arr.length; ++i) {
            res.push(fn(arr[i], i));
        }
        return res;
    }

    function hasOwnProp(a, b) {
        return Object.prototype.hasOwnProperty.call(a, b);
    }

    function extend(a, b) {
        for (var i in b) {
            if (hasOwnProp(b, i)) {
                a[i] = b[i];
            }
        }

        if (hasOwnProp(b, 'toString')) {
            a.toString = b.toString;
        }

        if (hasOwnProp(b, 'valueOf')) {
            a.valueOf = b.valueOf;
        }

        return a;
    }

    function create_utc__createUTC (input, format, locale, strict) {
        return createLocalOrUTC(input, format, locale, strict, true).utc();
    }

    function defaultParsingFlags() {
        // We need to deep clone this object.
        return {
            empty           : false,
            unusedTokens    : [],
            unusedInput     : [],
            overflow        : -2,
            charsLeftOver   : 0,
            nullInput       : false,
            invalidMonth    : null,
            invalidFormat   : false,
            userInvalidated : false,
            iso             : false,
            parsedDateParts : [],
            meridiem        : null
        };
    }

    function getParsingFlags(m) {
        if (m._pf == null) {
            m._pf = defaultParsingFlags();
        }
        return m._pf;
    }

    var some;
    if (Array.prototype.some) {
        some = Array.prototype.some;
    } else {
        some = function (fun) {
            var t = Object(this);
            var len = t.length >>> 0;

            for (var i = 0; i < len; i++) {
                if (i in t && fun.call(this, t[i], i, t)) {
                    return true;
                }
            }

            return false;
        };
    }

    function valid__isValid(m) {
        if (m._isValid == null) {
            var flags = getParsingFlags(m);
            var parsedParts = some.call(flags.parsedDateParts, function (i) {
                return i != null;
            });
            m._isValid = !isNaN(m._d.getTime()) &&
                flags.overflow < 0 &&
                !flags.empty &&
                !flags.invalidMonth &&
                !flags.invalidWeekday &&
                !flags.nullInput &&
                !flags.invalidFormat &&
                !flags.userInvalidated &&
                (!flags.meridiem || (flags.meridiem && parsedParts));

            if (m._strict) {
                m._isValid = m._isValid &&
                    flags.charsLeftOver === 0 &&
                    flags.unusedTokens.length === 0 &&
                    flags.bigHour === undefined;
            }
        }
        return m._isValid;
    }

    function valid__createInvalid (flags) {
        var m = create_utc__createUTC(NaN);
        if (flags != null) {
            extend(getParsingFlags(m), flags);
        }
        else {
            getParsingFlags(m).userInvalidated = true;
        }

        return m;
    }

    function isUndefined(input) {
        return input === void 0;
    }

    // Plugins that add properties should also add the key here (null value),
    // so we can properly clone ourselves.
    var momentProperties = utils_hooks__hooks.momentProperties = [];

    function copyConfig(to, from) {
        var i, prop, val;

        if (!isUndefined(from._isAMomentObject)) {
            to._isAMomentObject = from._isAMomentObject;
        }
        if (!isUndefined(from._i)) {
            to._i = from._i;
        }
        if (!isUndefined(from._f)) {
            to._f = from._f;
        }
        if (!isUndefined(from._l)) {
            to._l = from._l;
        }
        if (!isUndefined(from._strict)) {
            to._strict = from._strict;
        }
        if (!isUndefined(from._tzm)) {
            to._tzm = from._tzm;
        }
        if (!isUndefined(from._isUTC)) {
            to._isUTC = from._isUTC;
        }
        if (!isUndefined(from._offset)) {
            to._offset = from._offset;
        }
        if (!isUndefined(from._pf)) {
            to._pf = getParsingFlags(from);
        }
        if (!isUndefined(from._locale)) {
            to._locale = from._locale;
        }

        if (momentProperties.length > 0) {
            for (i in momentProperties) {
                prop = momentProperties[i];
                val = from[prop];
                if (!isUndefined(val)) {
                    to[prop] = val;
                }
            }
        }

        return to;
    }

    var updateInProgress = false;

    // Moment prototype object
    function Moment(config) {
        copyConfig(this, config);
        this._d = new Date(config._d != null ? config._d.getTime() : NaN);
        // Prevent infinite loop in case updateOffset creates new moment
        // objects.
        if (updateInProgress === false) {
            updateInProgress = true;
            utils_hooks__hooks.updateOffset(this);
            updateInProgress = false;
        }
    }

    function isMoment (obj) {
        return obj instanceof Moment || (obj != null && obj._isAMomentObject != null);
    }

    function absFloor (number) {
        if (number < 0) {
            // -0 -> 0
            return Math.ceil(number) || 0;
        } else {
            return Math.floor(number);
        }
    }

    function toInt(argumentForCoercion) {
        var coercedNumber = +argumentForCoercion,
            value = 0;

        if (coercedNumber !== 0 && isFinite(coercedNumber)) {
            value = absFloor(coercedNumber);
        }

        return value;
    }

    // compare two arrays, return the number of differences
    function compareArrays(array1, array2, dontConvert) {
        var len = Math.min(array1.length, array2.length),
            lengthDiff = Math.abs(array1.length - array2.length),
            diffs = 0,
            i;
        for (i = 0; i < len; i++) {
            if ((dontConvert && array1[i] !== array2[i]) ||
                (!dontConvert && toInt(array1[i]) !== toInt(array2[i]))) {
                diffs++;
            }
        }
        return diffs + lengthDiff;
    }

    function warn(msg) {
        if (utils_hooks__hooks.suppressDeprecationWarnings === false &&
                (typeof console !==  'undefined') && console.warn) {
            console.warn('Deprecation warning: ' + msg);
        }
    }

    function deprecate(msg, fn) {
        var firstTime = true;

        return extend(function () {
            if (utils_hooks__hooks.deprecationHandler != null) {
                utils_hooks__hooks.deprecationHandler(null, msg);
            }
            if (firstTime) {
                warn(msg + '\nArguments: ' + Array.prototype.slice.call(arguments).join(', ') + '\n' + (new Error()).stack);
                firstTime = false;
            }
            return fn.apply(this, arguments);
        }, fn);
    }

    var deprecations = {};

    function deprecateSimple(name, msg) {
        if (utils_hooks__hooks.deprecationHandler != null) {
            utils_hooks__hooks.deprecationHandler(name, msg);
        }
        if (!deprecations[name]) {
            warn(msg);
            deprecations[name] = true;
        }
    }

    utils_hooks__hooks.suppressDeprecationWarnings = false;
    utils_hooks__hooks.deprecationHandler = null;

    function isFunction(input) {
        return input instanceof Function || Object.prototype.toString.call(input) === '[object Function]';
    }

    function locale_set__set (config) {
        var prop, i;
        for (i in config) {
            prop = config[i];
            if (isFunction(prop)) {
                this[i] = prop;
            } else {
                this['_' + i] = prop;
            }
        }
        this._config = config;
        // Lenient ordinal parsing accepts just a number in addition to
        // number + (possibly) stuff coming from _ordinalParseLenient.
        this._ordinalParseLenient = new RegExp(this._ordinalParse.source + '|' + (/\d{1,2}/).source);
    }

    function mergeConfigs(parentConfig, childConfig) {
        var res = extend({}, parentConfig), prop;
        for (prop in childConfig) {
            if (hasOwnProp(childConfig, prop)) {
                if (isObject(parentConfig[prop]) && isObject(childConfig[prop])) {
                    res[prop] = {};
                    extend(res[prop], parentConfig[prop]);
                    extend(res[prop], childConfig[prop]);
                } else if (childConfig[prop] != null) {
                    res[prop] = childConfig[prop];
                } else {
                    delete res[prop];
                }
            }
        }
        for (prop in parentConfig) {
            if (hasOwnProp(parentConfig, prop) &&
                    !hasOwnProp(childConfig, prop) &&
                    isObject(parentConfig[prop])) {
                // make sure changes to properties don't modify parent config
                res[prop] = extend({}, res[prop]);
            }
        }
        return res;
    }

    function Locale(config) {
        if (config != null) {
            this.set(config);
        }
    }

    var keys;

    if (Object.keys) {
        keys = Object.keys;
    } else {
        keys = function (obj) {
            var i, res = [];
            for (i in obj) {
                if (hasOwnProp(obj, i)) {
                    res.push(i);
                }
            }
            return res;
        };
    }

    var defaultCalendar = {
        sameDay : '[Today at] LT',
        nextDay : '[Tomorrow at] LT',
        nextWeek : 'dddd [at] LT',
        lastDay : '[Yesterday at] LT',
        lastWeek : '[Last] dddd [at] LT',
        sameElse : 'L'
    };

    function locale_calendar__calendar (key, mom, now) {
        var output = this._calendar[key] || this._calendar['sameElse'];
        return isFunction(output) ? output.call(mom, now) : output;
    }

    var defaultLongDateFormat = {
        LTS  : 'h:mm:ss A',
        LT   : 'h:mm A',
        L    : 'MM/DD/YYYY',
        LL   : 'MMMM D, YYYY',
        LLL  : 'MMMM D, YYYY h:mm A',
        LLLL : 'dddd, MMMM D, YYYY h:mm A'
    };

    function longDateFormat (key) {
        var format = this._longDateFormat[key],
            formatUpper = this._longDateFormat[key.toUpperCase()];

        if (format || !formatUpper) {
            return format;
        }

        this._longDateFormat[key] = formatUpper.replace(/MMMM|MM|DD|dddd/g, function (val) {
            return val.slice(1);
        });

        return this._longDateFormat[key];
    }

    var defaultInvalidDate = 'Invalid date';

    function invalidDate () {
        return this._invalidDate;
    }

    var defaultOrdinal = '%d';
    var defaultOrdinalParse = /\d{1,2}/;

    function ordinal (number) {
        return this._ordinal.replace('%d', number);
    }

    var defaultRelativeTime = {
        future : 'in %s',
        past   : '%s ago',
        s  : 'a few seconds',
        m  : 'a minute',
        mm : '%d minutes',
        h  : 'an hour',
        hh : '%d hours',
        d  : 'a day',
        dd : '%d days',
        M  : 'a month',
        MM : '%d months',
        y  : 'a year',
        yy : '%d years'
    };

    function relative__relativeTime (number, withoutSuffix, string, isFuture) {
        var output = this._relativeTime[string];
        return (isFunction(output)) ?
            output(number, withoutSuffix, string, isFuture) :
            output.replace(/%d/i, number);
    }

    function pastFuture (diff, output) {
        var format = this._relativeTime[diff > 0 ? 'future' : 'past'];
        return isFunction(format) ? format(output) : format.replace(/%s/i, output);
    }

    var aliases = {};

    function addUnitAlias (unit, shorthand) {
        var lowerCase = unit.toLowerCase();
        aliases[lowerCase] = aliases[lowerCase + 's'] = aliases[shorthand] = unit;
    }

    function normalizeUnits(units) {
        return typeof units === 'string' ? aliases[units] || aliases[units.toLowerCase()] : undefined;
    }

    function normalizeObjectUnits(inputObject) {
        var normalizedInput = {},
            normalizedProp,
            prop;

        for (prop in inputObject) {
            if (hasOwnProp(inputObject, prop)) {
                normalizedProp = normalizeUnits(prop);
                if (normalizedProp) {
                    normalizedInput[normalizedProp] = inputObject[prop];
                }
            }
        }

        return normalizedInput;
    }

    var priorities = {};

    function addUnitPriority(unit, priority) {
        priorities[unit] = priority;
    }

    function getPrioritizedUnits(unitsObj) {
        var units = [];
        for (var u in unitsObj) {
            units.push({unit: u, priority: priorities[u]});
        }
        units.sort(function (a, b) {
            return a.priority - b.priority;
        });
        return units;
    }

    function makeGetSet (unit, keepTime) {
        return function (value) {
            if (value != null) {
                get_set__set(this, unit, value);
                utils_hooks__hooks.updateOffset(this, keepTime);
                return this;
            } else {
                return get_set__get(this, unit);
            }
        };
    }

    function get_set__get (mom, unit) {
        return mom.isValid() ?
            mom._d['get' + (mom._isUTC ? 'UTC' : '') + unit]() : NaN;
    }

    function get_set__set (mom, unit, value) {
        if (mom.isValid()) {
            mom._d['set' + (mom._isUTC ? 'UTC' : '') + unit](value);
        }
    }

    // MOMENTS

    function stringGet (units) {
        units = normalizeUnits(units);
        if (isFunction(this[units])) {
            return this[units]();
        }
        return this;
    }


    function stringSet (units, value) {
        if (typeof units === 'object') {
            units = normalizeObjectUnits(units);
            var prioritized = getPrioritizedUnits(units);
            for (var i = 0; i < prioritized.length; i++) {
                this[prioritized[i].unit](units[prioritized[i].unit]);
            }
        } else {
            units = normalizeUnits(units);
            if (isFunction(this[units])) {
                return this[units](value);
            }
        }
        return this;
    }

    function zeroFill(number, targetLength, forceSign) {
        var absNumber = '' + Math.abs(number),
            zerosToFill = targetLength - absNumber.length,
            sign = number >= 0;
        return (sign ? (forceSign ? '+' : '') : '-') +
            Math.pow(10, Math.max(0, zerosToFill)).toString().substr(1) + absNumber;
    }

    var formattingTokens = /(\[[^\[]*\])|(\\)?([Hh]mm(ss)?|Mo|MM?M?M?|Do|DDDo|DD?D?D?|ddd?d?|do?|w[o|w]?|W[o|W]?|Qo?|YYYYYY|YYYYY|YYYY|YY|gg(ggg?)?|GG(GGG?)?|e|E|a|A|hh?|HH?|kk?|mm?|ss?|S{1,9}|x|X|zz?|ZZ?|.)/g;

    var localFormattingTokens = /(\[[^\[]*\])|(\\)?(LTS|LT|LL?L?L?|l{1,4})/g;

    var formatFunctions = {};

    var formatTokenFunctions = {};

    // token:    'M'
    // padded:   ['MM', 2]
    // ordinal:  'Mo'
    // callback: function () { this.month() + 1 }
    function addFormatToken (token, padded, ordinal, callback) {
        var func = callback;
        if (typeof callback === 'string') {
            func = function () {
                return this[callback]();
            };
        }
        if (token) {
            formatTokenFunctions[token] = func;
        }
        if (padded) {
            formatTokenFunctions[padded[0]] = function () {
                return zeroFill(func.apply(this, arguments), padded[1], padded[2]);
            };
        }
        if (ordinal) {
            formatTokenFunctions[ordinal] = function () {
                return this.localeData().ordinal(func.apply(this, arguments), token);
            };
        }
    }

    function removeFormattingTokens(input) {
        if (input.match(/\[[\s\S]/)) {
            return input.replace(/^\[|\]$/g, '');
        }
        return input.replace(/\\/g, '');
    }

    function makeFormatFunction(format) {
        var array = format.match(formattingTokens), i, length;

        for (i = 0, length = array.length; i < length; i++) {
            if (formatTokenFunctions[array[i]]) {
                array[i] = formatTokenFunctions[array[i]];
            } else {
                array[i] = removeFormattingTokens(array[i]);
            }
        }

        return function (mom) {
            var output = '', i;
            for (i = 0; i < length; i++) {
                output += array[i] instanceof Function ? array[i].call(mom, format) : array[i];
            }
            return output;
        };
    }

    // format date using native date object
    function formatMoment(m, format) {
        if (!m.isValid()) {
            return m.localeData().invalidDate();
        }

        format = expandFormat(format, m.localeData());
        formatFunctions[format] = formatFunctions[format] || makeFormatFunction(format);

        return formatFunctions[format](m);
    }

    function expandFormat(format, locale) {
        var i = 5;

        function replaceLongDateFormatTokens(input) {
            return locale.longDateFormat(input) || input;
        }

        localFormattingTokens.lastIndex = 0;
        while (i >= 0 && localFormattingTokens.test(format)) {
            format = format.replace(localFormattingTokens, replaceLongDateFormatTokens);
            localFormattingTokens.lastIndex = 0;
            i -= 1;
        }

        return format;
    }

    var match1         = /\d/;            //       0 - 9
    var match2         = /\d\d/;          //      00 - 99
    var match3         = /\d{3}/;         //     000 - 999
    var match4         = /\d{4}/;         //    0000 - 9999
    var match6         = /[+-]?\d{6}/;    // -999999 - 999999
    var match1to2      = /\d\d?/;         //       0 - 99
    var match3to4      = /\d\d\d\d?/;     //     999 - 9999
    var match5to6      = /\d\d\d\d\d\d?/; //   99999 - 999999
    var match1to3      = /\d{1,3}/;       //       0 - 999
    var match1to4      = /\d{1,4}/;       //       0 - 9999
    var match1to6      = /[+-]?\d{1,6}/;  // -999999 - 999999

    var matchUnsigned  = /\d+/;           //       0 - inf
    var matchSigned    = /[+-]?\d+/;      //    -inf - inf

    var matchOffset    = /Z|[+-]\d\d:?\d\d/gi; // +00:00 -00:00 +0000 -0000 or Z
    var matchShortOffset = /Z|[+-]\d\d(?::?\d\d)?/gi; // +00 -00 +00:00 -00:00 +0000 -0000 or Z

    var matchTimestamp = /[+-]?\d+(\.\d{1,3})?/; // 123456789 123456789.123

    // any word (or two) characters or numbers including two/three word month in arabic.
    // includes scottish gaelic two word and hyphenated months
    var matchWord = /[0-9]*['a-z\u00A0-\u05FF\u0700-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+|[\u0600-\u06FF\/]+(\s*?[\u0600-\u06FF]+){1,2}/i;


    var regexes = {};

    function addRegexToken (token, regex, strictRegex) {
        regexes[token] = isFunction(regex) ? regex : function (isStrict, localeData) {
            return (isStrict && strictRegex) ? strictRegex : regex;
        };
    }

    function getParseRegexForToken (token, config) {
        if (!hasOwnProp(regexes, token)) {
            return new RegExp(unescapeFormat(token));
        }

        return regexes[token](config._strict, config._locale);
    }

    // Code from http://stackoverflow.com/questions/3561493/is-there-a-regexp-escape-function-in-javascript
    function unescapeFormat(s) {
        return regexEscape(s.replace('\\', '').replace(/\\(\[)|\\(\])|\[([^\]\[]*)\]|\\(.)/g, function (matched, p1, p2, p3, p4) {
            return p1 || p2 || p3 || p4;
        }));
    }

    function regexEscape(s) {
        return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    }

    var tokens = {};

    function addParseToken (token, callback) {
        var i, func = callback;
        if (typeof token === 'string') {
            token = [token];
        }
        if (typeof callback === 'number') {
            func = function (input, array) {
                array[callback] = toInt(input);
            };
        }
        for (i = 0; i < token.length; i++) {
            tokens[token[i]] = func;
        }
    }

    function addWeekParseToken (token, callback) {
        addParseToken(token, function (input, array, config, token) {
            config._w = config._w || {};
            callback(input, config._w, config, token);
        });
    }

    function addTimeToArrayFromToken(token, input, config) {
        if (input != null && hasOwnProp(tokens, token)) {
            tokens[token](input, config._a, config, token);
        }
    }

    var YEAR = 0;
    var MONTH = 1;
    var DATE = 2;
    var HOUR = 3;
    var MINUTE = 4;
    var SECOND = 5;
    var MILLISECOND = 6;
    var WEEK = 7;
    var WEEKDAY = 8;

    var indexOf;

    if (Array.prototype.indexOf) {
        indexOf = Array.prototype.indexOf;
    } else {
        indexOf = function (o) {
            // I know
            var i;
            for (i = 0; i < this.length; ++i) {
                if (this[i] === o) {
                    return i;
                }
            }
            return -1;
        };
    }

    function daysInMonth(year, month) {
        return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    }

    // FORMATTING

    addFormatToken('M', ['MM', 2], 'Mo', function () {
        return this.month() + 1;
    });

    addFormatToken('MMM', 0, 0, function (format) {
        return this.localeData().monthsShort(this, format);
    });

    addFormatToken('MMMM', 0, 0, function (format) {
        return this.localeData().months(this, format);
    });

    // ALIASES

    addUnitAlias('month', 'M');

    // PRIORITY

    addUnitPriority('month', 8);

    // PARSING

    addRegexToken('M',    match1to2);
    addRegexToken('MM',   match1to2, match2);
    addRegexToken('MMM',  function (isStrict, locale) {
        return locale.monthsShortRegex(isStrict);
    });
    addRegexToken('MMMM', function (isStrict, locale) {
        return locale.monthsRegex(isStrict);
    });

    addParseToken(['M', 'MM'], function (input, array) {
        array[MONTH] = toInt(input) - 1;
    });

    addParseToken(['MMM', 'MMMM'], function (input, array, config, token) {
        var month = config._locale.monthsParse(input, token, config._strict);
        // if we didn't find a month name, mark the date as invalid.
        if (month != null) {
            array[MONTH] = month;
        } else {
            getParsingFlags(config).invalidMonth = input;
        }
    });

    // LOCALES

    var MONTHS_IN_FORMAT = /D[oD]?(\[[^\[\]]*\]|\s+)+MMMM?/;
    var defaultLocaleMonths = 'January_February_March_April_May_June_July_August_September_October_November_December'.split('_');
    function localeMonths (m, format) {
        return isArray(this._months) ? this._months[m.month()] :
            this._months[(this._months.isFormat || MONTHS_IN_FORMAT).test(format) ? 'format' : 'standalone'][m.month()];
    }

    var defaultLocaleMonthsShort = 'Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec'.split('_');
    function localeMonthsShort (m, format) {
        return isArray(this._monthsShort) ? this._monthsShort[m.month()] :
            this._monthsShort[MONTHS_IN_FORMAT.test(format) ? 'format' : 'standalone'][m.month()];
    }

    function units_month__handleStrictParse(monthName, format, strict) {
        var i, ii, mom, llc = monthName.toLocaleLowerCase();
        if (!this._monthsParse) {
            // this is not used
            this._monthsParse = [];
            this._longMonthsParse = [];
            this._shortMonthsParse = [];
            for (i = 0; i < 12; ++i) {
                mom = create_utc__createUTC([2000, i]);
                this._shortMonthsParse[i] = this.monthsShort(mom, '').toLocaleLowerCase();
                this._longMonthsParse[i] = this.months(mom, '').toLocaleLowerCase();
            }
        }

        if (strict) {
            if (format === 'MMM') {
                ii = indexOf.call(this._shortMonthsParse, llc);
                return ii !== -1 ? ii : null;
            } else {
                ii = indexOf.call(this._longMonthsParse, llc);
                return ii !== -1 ? ii : null;
            }
        } else {
            if (format === 'MMM') {
                ii = indexOf.call(this._shortMonthsParse, llc);
                if (ii !== -1) {
                    return ii;
                }
                ii = indexOf.call(this._longMonthsParse, llc);
                return ii !== -1 ? ii : null;
            } else {
                ii = indexOf.call(this._longMonthsParse, llc);
                if (ii !== -1) {
                    return ii;
                }
                ii = indexOf.call(this._shortMonthsParse, llc);
                return ii !== -1 ? ii : null;
            }
        }
    }

    function localeMonthsParse (monthName, format, strict) {
        var i, mom, regex;

        if (this._monthsParseExact) {
            return units_month__handleStrictParse.call(this, monthName, format, strict);
        }

        if (!this._monthsParse) {
            this._monthsParse = [];
            this._longMonthsParse = [];
            this._shortMonthsParse = [];
        }

        // TODO: add sorting
        // Sorting makes sure if one month (or abbr) is a prefix of another
        // see sorting in computeMonthsParse
        for (i = 0; i < 12; i++) {
            // make the regex if we don't have it already
            mom = create_utc__createUTC([2000, i]);
            if (strict && !this._longMonthsParse[i]) {
                this._longMonthsParse[i] = new RegExp('^' + this.months(mom, '').replace('.', '') + '$', 'i');
                this._shortMonthsParse[i] = new RegExp('^' + this.monthsShort(mom, '').replace('.', '') + '$', 'i');
            }
            if (!strict && !this._monthsParse[i]) {
                regex = '^' + this.months(mom, '') + '|^' + this.monthsShort(mom, '');
                this._monthsParse[i] = new RegExp(regex.replace('.', ''), 'i');
            }
            // test the regex
            if (strict && format === 'MMMM' && this._longMonthsParse[i].test(monthName)) {
                return i;
            } else if (strict && format === 'MMM' && this._shortMonthsParse[i].test(monthName)) {
                return i;
            } else if (!strict && this._monthsParse[i].test(monthName)) {
                return i;
            }
        }
    }

    // MOMENTS

    function setMonth (mom, value) {
        var dayOfMonth;

        if (!mom.isValid()) {
            // No op
            return mom;
        }

        if (typeof value === 'string') {
            if (/^\d+$/.test(value)) {
                value = toInt(value);
            } else {
                value = mom.localeData().monthsParse(value);
                // TODO: Another silent failure?
                if (typeof value !== 'number') {
                    return mom;
                }
            }
        }

        dayOfMonth = Math.min(mom.date(), daysInMonth(mom.year(), value));
        mom._d['set' + (mom._isUTC ? 'UTC' : '') + 'Month'](value, dayOfMonth);
        return mom;
    }

    function getSetMonth (value) {
        if (value != null) {
            setMonth(this, value);
            utils_hooks__hooks.updateOffset(this, true);
            return this;
        } else {
            return get_set__get(this, 'Month');
        }
    }

    function getDaysInMonth () {
        return daysInMonth(this.year(), this.month());
    }

    var defaultMonthsShortRegex = matchWord;
    function monthsShortRegex (isStrict) {
        if (this._monthsParseExact) {
            if (!hasOwnProp(this, '_monthsRegex')) {
                computeMonthsParse.call(this);
            }
            if (isStrict) {
                return this._monthsShortStrictRegex;
            } else {
                return this._monthsShortRegex;
            }
        } else {
            if (!hasOwnProp(this, '_monthsShortRegex')) {
                this._monthsShortRegex = defaultMonthsShortRegex;
            }
            return this._monthsShortStrictRegex && isStrict ?
                this._monthsShortStrictRegex : this._monthsShortRegex;
        }
    }

    var defaultMonthsRegex = matchWord;
    function monthsRegex (isStrict) {
        if (this._monthsParseExact) {
            if (!hasOwnProp(this, '_monthsRegex')) {
                computeMonthsParse.call(this);
            }
            if (isStrict) {
                return this._monthsStrictRegex;
            } else {
                return this._monthsRegex;
            }
        } else {
            if (!hasOwnProp(this, '_monthsRegex')) {
                this._monthsRegex = defaultMonthsRegex;
            }
            return this._monthsStrictRegex && isStrict ?
                this._monthsStrictRegex : this._monthsRegex;
        }
    }

    function computeMonthsParse () {
        function cmpLenRev(a, b) {
            return b.length - a.length;
        }

        var shortPieces = [], longPieces = [], mixedPieces = [],
            i, mom;
        for (i = 0; i < 12; i++) {
            // make the regex if we don't have it already
            mom = create_utc__createUTC([2000, i]);
            shortPieces.push(this.monthsShort(mom, ''));
            longPieces.push(this.months(mom, ''));
            mixedPieces.push(this.months(mom, ''));
            mixedPieces.push(this.monthsShort(mom, ''));
        }
        // Sorting makes sure if one month (or abbr) is a prefix of another it
        // will match the longer piece.
        shortPieces.sort(cmpLenRev);
        longPieces.sort(cmpLenRev);
        mixedPieces.sort(cmpLenRev);
        for (i = 0; i < 12; i++) {
            shortPieces[i] = regexEscape(shortPieces[i]);
            longPieces[i] = regexEscape(longPieces[i]);
        }
        for (i = 0; i < 24; i++) {
            mixedPieces[i] = regexEscape(mixedPieces[i]);
        }

        this._monthsRegex = new RegExp('^(' + mixedPieces.join('|') + ')', 'i');
        this._monthsShortRegex = this._monthsRegex;
        this._monthsStrictRegex = new RegExp('^(' + longPieces.join('|') + ')', 'i');
        this._monthsShortStrictRegex = new RegExp('^(' + shortPieces.join('|') + ')', 'i');
    }

    // FORMATTING

    addFormatToken('Y', 0, 0, function () {
        var y = this.year();
        return y <= 9999 ? '' + y : '+' + y;
    });

    addFormatToken(0, ['YY', 2], 0, function () {
        return this.year() % 100;
    });

    addFormatToken(0, ['YYYY',   4],       0, 'year');
    addFormatToken(0, ['YYYYY',  5],       0, 'year');
    addFormatToken(0, ['YYYYYY', 6, true], 0, 'year');

    // ALIASES

    addUnitAlias('year', 'y');

    // PRIORITIES

    addUnitPriority('year', 1);

    // PARSING

    addRegexToken('Y',      matchSigned);
    addRegexToken('YY',     match1to2, match2);
    addRegexToken('YYYY',   match1to4, match4);
    addRegexToken('YYYYY',  match1to6, match6);
    addRegexToken('YYYYYY', match1to6, match6);

    addParseToken(['YYYYY', 'YYYYYY'], YEAR);
    addParseToken('YYYY', function (input, array) {
        array[YEAR] = input.length === 2 ? utils_hooks__hooks.parseTwoDigitYear(input) : toInt(input);
    });
    addParseToken('YY', function (input, array) {
        array[YEAR] = utils_hooks__hooks.parseTwoDigitYear(input);
    });
    addParseToken('Y', function (input, array) {
        array[YEAR] = parseInt(input, 10);
    });

    // HELPERS

    function daysInYear(year) {
        return isLeapYear(year) ? 366 : 365;
    }

    function isLeapYear(year) {
        return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    }

    // HOOKS

    utils_hooks__hooks.parseTwoDigitYear = function (input) {
        return toInt(input) + (toInt(input) > 68 ? 1900 : 2000);
    };

    // MOMENTS

    var getSetYear = makeGetSet('FullYear', true);

    function getIsLeapYear () {
        return isLeapYear(this.year());
    }

    function createDate (y, m, d, h, M, s, ms) {
        //can't just apply() to create a date:
        //http://stackoverflow.com/questions/181348/instantiating-a-javascript-object-by-calling-prototype-constructor-apply
        var date = new Date(y, m, d, h, M, s, ms);

        //the date constructor remaps years 0-99 to 1900-1999
        if (y < 100 && y >= 0 && isFinite(date.getFullYear())) {
            date.setFullYear(y);
        }
        return date;
    }

    function createUTCDate (y) {
        var date = new Date(Date.UTC.apply(null, arguments));

        //the Date.UTC function remaps years 0-99 to 1900-1999
        if (y < 100 && y >= 0 && isFinite(date.getUTCFullYear())) {
            date.setUTCFullYear(y);
        }
        return date;
    }

    // start-of-first-week - start-of-year
    function firstWeekOffset(year, dow, doy) {
        var // first-week day -- which january is always in the first week (4 for iso, 1 for other)
            fwd = 7 + dow - doy,
            // first-week day local weekday -- which local weekday is fwd
            fwdlw = (7 + createUTCDate(year, 0, fwd).getUTCDay() - dow) % 7;

        return -fwdlw + fwd - 1;
    }

    //http://en.wikipedia.org/wiki/ISO_week_date#Calculating_a_date_given_the_year.2C_week_number_and_weekday
    function dayOfYearFromWeeks(year, week, weekday, dow, doy) {
        var localWeekday = (7 + weekday - dow) % 7,
            weekOffset = firstWeekOffset(year, dow, doy),
            dayOfYear = 1 + 7 * (week - 1) + localWeekday + weekOffset,
            resYear, resDayOfYear;

        if (dayOfYear <= 0) {
            resYear = year - 1;
            resDayOfYear = daysInYear(resYear) + dayOfYear;
        } else if (dayOfYear > daysInYear(year)) {
            resYear = year + 1;
            resDayOfYear = dayOfYear - daysInYear(year);
        } else {
            resYear = year;
            resDayOfYear = dayOfYear;
        }

        return {
            year: resYear,
            dayOfYear: resDayOfYear
        };
    }

    function weekOfYear(mom, dow, doy) {
        var weekOffset = firstWeekOffset(mom.year(), dow, doy),
            week = Math.floor((mom.dayOfYear() - weekOffset - 1) / 7) + 1,
            resWeek, resYear;

        if (week < 1) {
            resYear = mom.year() - 1;
            resWeek = week + weeksInYear(resYear, dow, doy);
        } else if (week > weeksInYear(mom.year(), dow, doy)) {
            resWeek = week - weeksInYear(mom.year(), dow, doy);
            resYear = mom.year() + 1;
        } else {
            resYear = mom.year();
            resWeek = week;
        }

        return {
            week: resWeek,
            year: resYear
        };
    }

    function weeksInYear(year, dow, doy) {
        var weekOffset = firstWeekOffset(year, dow, doy),
            weekOffsetNext = firstWeekOffset(year + 1, dow, doy);
        return (daysInYear(year) - weekOffset + weekOffsetNext) / 7;
    }

    // FORMATTING

    addFormatToken('w', ['ww', 2], 'wo', 'week');
    addFormatToken('W', ['WW', 2], 'Wo', 'isoWeek');

    // ALIASES

    addUnitAlias('week', 'w');
    addUnitAlias('isoWeek', 'W');

    // PRIORITIES

    addUnitPriority('week', 5);
    addUnitPriority('isoWeek', 5);

    // PARSING

    addRegexToken('w',  match1to2);
    addRegexToken('ww', match1to2, match2);
    addRegexToken('W',  match1to2);
    addRegexToken('WW', match1to2, match2);

    addWeekParseToken(['w', 'ww', 'W', 'WW'], function (input, week, config, token) {
        week[token.substr(0, 1)] = toInt(input);
    });

    // HELPERS

    // LOCALES

    function localeWeek (mom) {
        return weekOfYear(mom, this._week.dow, this._week.doy).week;
    }

    var defaultLocaleWeek = {
        dow : 0, // Sunday is the first day of the week.
        doy : 6  // The week that contains Jan 1st is the first week of the year.
    };

    function localeFirstDayOfWeek () {
        return this._week.dow;
    }

    function localeFirstDayOfYear () {
        return this._week.doy;
    }

    // MOMENTS

    function getSetWeek (input) {
        var week = this.localeData().week(this);
        return input == null ? week : this.add((input - week) * 7, 'd');
    }

    function getSetISOWeek (input) {
        var week = weekOfYear(this, 1, 4).week;
        return input == null ? week : this.add((input - week) * 7, 'd');
    }

    // FORMATTING

    addFormatToken('d', 0, 'do', 'day');

    addFormatToken('dd', 0, 0, function (format) {
        return this.localeData().weekdaysMin(this, format);
    });

    addFormatToken('ddd', 0, 0, function (format) {
        return this.localeData().weekdaysShort(this, format);
    });

    addFormatToken('dddd', 0, 0, function (format) {
        return this.localeData().weekdays(this, format);
    });

    addFormatToken('e', 0, 0, 'weekday');
    addFormatToken('E', 0, 0, 'isoWeekday');

    // ALIASES

    addUnitAlias('day', 'd');
    addUnitAlias('weekday', 'e');
    addUnitAlias('isoWeekday', 'E');

    // PRIORITY
    addUnitPriority('day', 11);
    addUnitPriority('weekday', 11);
    addUnitPriority('isoWeekday', 11);

    // PARSING

    addRegexToken('d',    match1to2);
    addRegexToken('e',    match1to2);
    addRegexToken('E',    match1to2);
    addRegexToken('dd',   function (isStrict, locale) {
        return locale.weekdaysMinRegex(isStrict);
    });
    addRegexToken('ddd',   function (isStrict, locale) {
        return locale.weekdaysShortRegex(isStrict);
    });
    addRegexToken('dddd',   function (isStrict, locale) {
        return locale.weekdaysRegex(isStrict);
    });

    addWeekParseToken(['dd', 'ddd', 'dddd'], function (input, week, config, token) {
        var weekday = config._locale.weekdaysParse(input, token, config._strict);
        // if we didn't get a weekday name, mark the date as invalid
        if (weekday != null) {
            week.d = weekday;
        } else {
            getParsingFlags(config).invalidWeekday = input;
        }
    });

    addWeekParseToken(['d', 'e', 'E'], function (input, week, config, token) {
        week[token] = toInt(input);
    });

    // HELPERS

    function parseWeekday(input, locale) {
        if (typeof input !== 'string') {
            return input;
        }

        if (!isNaN(input)) {
            return parseInt(input, 10);
        }

        input = locale.weekdaysParse(input);
        if (typeof input === 'number') {
            return input;
        }

        return null;
    }

    function parseIsoWeekday(input, locale) {
        if (typeof input === 'string') {
            return locale.weekdaysParse(input) % 7 || 7;
        }
        return isNaN(input) ? null : input;
    }

    // LOCALES

    var defaultLocaleWeekdays = 'Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday'.split('_');
    function localeWeekdays (m, format) {
        return isArray(this._weekdays) ? this._weekdays[m.day()] :
            this._weekdays[this._weekdays.isFormat.test(format) ? 'format' : 'standalone'][m.day()];
    }

    var defaultLocaleWeekdaysShort = 'Sun_Mon_Tue_Wed_Thu_Fri_Sat'.split('_');
    function localeWeekdaysShort (m) {
        return this._weekdaysShort[m.day()];
    }

    var defaultLocaleWeekdaysMin = 'Su_Mo_Tu_We_Th_Fr_Sa'.split('_');
    function localeWeekdaysMin (m) {
        return this._weekdaysMin[m.day()];
    }

    function day_of_week__handleStrictParse(weekdayName, format, strict) {
        var i, ii, mom, llc = weekdayName.toLocaleLowerCase();
        if (!this._weekdaysParse) {
            this._weekdaysParse = [];
            this._shortWeekdaysParse = [];
            this._minWeekdaysParse = [];

            for (i = 0; i < 7; ++i) {
                mom = create_utc__createUTC([2000, 1]).day(i);
                this._minWeekdaysParse[i] = this.weekdaysMin(mom, '').toLocaleLowerCase();
                this._shortWeekdaysParse[i] = this.weekdaysShort(mom, '').toLocaleLowerCase();
                this._weekdaysParse[i] = this.weekdays(mom, '').toLocaleLowerCase();
            }
        }

        if (strict) {
            if (format === 'dddd') {
                ii = indexOf.call(this._weekdaysParse, llc);
                return ii !== -1 ? ii : null;
            } else if (format === 'ddd') {
                ii = indexOf.call(this._shortWeekdaysParse, llc);
                return ii !== -1 ? ii : null;
            } else {
                ii = indexOf.call(this._minWeekdaysParse, llc);
                return ii !== -1 ? ii : null;
            }
        } else {
            if (format === 'dddd') {
                ii = indexOf.call(this._weekdaysParse, llc);
                if (ii !== -1) {
                    return ii;
                }
                ii = indexOf.call(this._shortWeekdaysParse, llc);
                if (ii !== -1) {
                    return ii;
                }
                ii = indexOf.call(this._minWeekdaysParse, llc);
                return ii !== -1 ? ii : null;
            } else if (format === 'ddd') {
                ii = indexOf.call(this._shortWeekdaysParse, llc);
                if (ii !== -1) {
                    return ii;
                }
                ii = indexOf.call(this._weekdaysParse, llc);
                if (ii !== -1) {
                    return ii;
                }
                ii = indexOf.call(this._minWeekdaysParse, llc);
                return ii !== -1 ? ii : null;
            } else {
                ii = indexOf.call(this._minWeekdaysParse, llc);
                if (ii !== -1) {
                    return ii;
                }
                ii = indexOf.call(this._weekdaysParse, llc);
                if (ii !== -1) {
                    return ii;
                }
                ii = indexOf.call(this._shortWeekdaysParse, llc);
                return ii !== -1 ? ii : null;
            }
        }
    }

    function localeWeekdaysParse (weekdayName, format, strict) {
        var i, mom, regex;

        if (this._weekdaysParseExact) {
            return day_of_week__handleStrictParse.call(this, weekdayName, format, strict);
        }

        if (!this._weekdaysParse) {
            this._weekdaysParse = [];
            this._minWeekdaysParse = [];
            this._shortWeekdaysParse = [];
            this._fullWeekdaysParse = [];
        }

        for (i = 0; i < 7; i++) {
            // make the regex if we don't have it already

            mom = create_utc__createUTC([2000, 1]).day(i);
            if (strict && !this._fullWeekdaysParse[i]) {
                this._fullWeekdaysParse[i] = new RegExp('^' + this.weekdays(mom, '').replace('.', '\.?') + '$', 'i');
                this._shortWeekdaysParse[i] = new RegExp('^' + this.weekdaysShort(mom, '').replace('.', '\.?') + '$', 'i');
                this._minWeekdaysParse[i] = new RegExp('^' + this.weekdaysMin(mom, '').replace('.', '\.?') + '$', 'i');
            }
            if (!this._weekdaysParse[i]) {
                regex = '^' + this.weekdays(mom, '') + '|^' + this.weekdaysShort(mom, '') + '|^' + this.weekdaysMin(mom, '');
                this._weekdaysParse[i] = new RegExp(regex.replace('.', ''), 'i');
            }
            // test the regex
            if (strict && format === 'dddd' && this._fullWeekdaysParse[i].test(weekdayName)) {
                return i;
            } else if (strict && format === 'ddd' && this._shortWeekdaysParse[i].test(weekdayName)) {
                return i;
            } else if (strict && format === 'dd' && this._minWeekdaysParse[i].test(weekdayName)) {
                return i;
            } else if (!strict && this._weekdaysParse[i].test(weekdayName)) {
                return i;
            }
        }
    }

    // MOMENTS

    function getSetDayOfWeek (input) {
        if (!this.isValid()) {
            return input != null ? this : NaN;
        }
        var day = this._isUTC ? this._d.getUTCDay() : this._d.getDay();
        if (input != null) {
            input = parseWeekday(input, this.localeData());
            return this.add(input - day, 'd');
        } else {
            return day;
        }
    }

    function getSetLocaleDayOfWeek (input) {
        if (!this.isValid()) {
            return input != null ? this : NaN;
        }
        var weekday = (this.day() + 7 - this.localeData()._week.dow) % 7;
        return input == null ? weekday : this.add(input - weekday, 'd');
    }

    function getSetISODayOfWeek (input) {
        if (!this.isValid()) {
            return input != null ? this : NaN;
        }

        // behaves the same as moment#day except
        // as a getter, returns 7 instead of 0 (1-7 range instead of 0-6)
        // as a setter, sunday should belong to the previous week.

        if (input != null) {
            var weekday = parseIsoWeekday(input, this.localeData());
            return this.day(this.day() % 7 ? weekday : weekday - 7);
        } else {
            return this.day() || 7;
        }
    }

    var defaultWeekdaysRegex = matchWord;
    function weekdaysRegex (isStrict) {
        if (this._weekdaysParseExact) {
            if (!hasOwnProp(this, '_weekdaysRegex')) {
                computeWeekdaysParse.call(this);
            }
            if (isStrict) {
                return this._weekdaysStrictRegex;
            } else {
                return this._weekdaysRegex;
            }
        } else {
            if (!hasOwnProp(this, '_weekdaysRegex')) {
                this._weekdaysRegex = defaultWeekdaysRegex;
            }
            return this._weekdaysStrictRegex && isStrict ?
                this._weekdaysStrictRegex : this._weekdaysRegex;
        }
    }

    var defaultWeekdaysShortRegex = matchWord;
    function weekdaysShortRegex (isStrict) {
        if (this._weekdaysParseExact) {
            if (!hasOwnProp(this, '_weekdaysRegex')) {
                computeWeekdaysParse.call(this);
            }
            if (isStrict) {
                return this._weekdaysShortStrictRegex;
            } else {
                return this._weekdaysShortRegex;
            }
        } else {
            if (!hasOwnProp(this, '_weekdaysShortRegex')) {
                this._weekdaysShortRegex = defaultWeekdaysShortRegex;
            }
            return this._weekdaysShortStrictRegex && isStrict ?
                this._weekdaysShortStrictRegex : this._weekdaysShortRegex;
        }
    }

    var defaultWeekdaysMinRegex = matchWord;
    function weekdaysMinRegex (isStrict) {
        if (this._weekdaysParseExact) {
            if (!hasOwnProp(this, '_weekdaysRegex')) {
                computeWeekdaysParse.call(this);
            }
            if (isStrict) {
                return this._weekdaysMinStrictRegex;
            } else {
                return this._weekdaysMinRegex;
            }
        } else {
            if (!hasOwnProp(this, '_weekdaysMinRegex')) {
                this._weekdaysMinRegex = defaultWeekdaysMinRegex;
            }
            return this._weekdaysMinStrictRegex && isStrict ?
                this._weekdaysMinStrictRegex : this._weekdaysMinRegex;
        }
    }


    function computeWeekdaysParse () {
        function cmpLenRev(a, b) {
            return b.length - a.length;
        }

        var minPieces = [], shortPieces = [], longPieces = [], mixedPieces = [],
            i, mom, minp, shortp, longp;
        for (i = 0; i < 7; i++) {
            // make the regex if we don't have it already
            mom = create_utc__createUTC([2000, 1]).day(i);
            minp = this.weekdaysMin(mom, '');
            shortp = this.weekdaysShort(mom, '');
            longp = this.weekdays(mom, '');
            minPieces.push(minp);
            shortPieces.push(shortp);
            longPieces.push(longp);
            mixedPieces.push(minp);
            mixedPieces.push(shortp);
            mixedPieces.push(longp);
        }
        // Sorting makes sure if one weekday (or abbr) is a prefix of another it
        // will match the longer piece.
        minPieces.sort(cmpLenRev);
        shortPieces.sort(cmpLenRev);
        longPieces.sort(cmpLenRev);
        mixedPieces.sort(cmpLenRev);
        for (i = 0; i < 7; i++) {
            shortPieces[i] = regexEscape(shortPieces[i]);
            longPieces[i] = regexEscape(longPieces[i]);
            mixedPieces[i] = regexEscape(mixedPieces[i]);
        }

        this._weekdaysRegex = new RegExp('^(' + mixedPieces.join('|') + ')', 'i');
        this._weekdaysShortRegex = this._weekdaysRegex;
        this._weekdaysMinRegex = this._weekdaysRegex;

        this._weekdaysStrictRegex = new RegExp('^(' + longPieces.join('|') + ')', 'i');
        this._weekdaysShortStrictRegex = new RegExp('^(' + shortPieces.join('|') + ')', 'i');
        this._weekdaysMinStrictRegex = new RegExp('^(' + minPieces.join('|') + ')', 'i');
    }

    // FORMATTING

    function hFormat() {
        return this.hours() % 12 || 12;
    }

    function kFormat() {
        return this.hours() || 24;
    }

    addFormatToken('H', ['HH', 2], 0, 'hour');
    addFormatToken('h', ['hh', 2], 0, hFormat);
    addFormatToken('k', ['kk', 2], 0, kFormat);

    addFormatToken('hmm', 0, 0, function () {
        return '' + hFormat.apply(this) + zeroFill(this.minutes(), 2);
    });

    addFormatToken('hmmss', 0, 0, function () {
        return '' + hFormat.apply(this) + zeroFill(this.minutes(), 2) +
            zeroFill(this.seconds(), 2);
    });

    addFormatToken('Hmm', 0, 0, function () {
        return '' + this.hours() + zeroFill(this.minutes(), 2);
    });

    addFormatToken('Hmmss', 0, 0, function () {
        return '' + this.hours() + zeroFill(this.minutes(), 2) +
            zeroFill(this.seconds(), 2);
    });

    function meridiem (token, lowercase) {
        addFormatToken(token, 0, 0, function () {
            return this.localeData().meridiem(this.hours(), this.minutes(), lowercase);
        });
    }

    meridiem('a', true);
    meridiem('A', false);

    // ALIASES

    addUnitAlias('hour', 'h');

    // PRIORITY
    addUnitPriority('hour', 13);

    // PARSING

    function matchMeridiem (isStrict, locale) {
        return locale._meridiemParse;
    }

    addRegexToken('a',  matchMeridiem);
    addRegexToken('A',  matchMeridiem);
    addRegexToken('H',  match1to2);
    addRegexToken('h',  match1to2);
    addRegexToken('HH', match1to2, match2);
    addRegexToken('hh', match1to2, match2);

    addRegexToken('hmm', match3to4);
    addRegexToken('hmmss', match5to6);
    addRegexToken('Hmm', match3to4);
    addRegexToken('Hmmss', match5to6);

    addParseToken(['H', 'HH'], HOUR);
    addParseToken(['a', 'A'], function (input, array, config) {
        config._isPm = config._locale.isPM(input);
        config._meridiem = input;
    });
    addParseToken(['h', 'hh'], function (input, array, config) {
        array[HOUR] = toInt(input);
        getParsingFlags(config).bigHour = true;
    });
    addParseToken('hmm', function (input, array, config) {
        var pos = input.length - 2;
        array[HOUR] = toInt(input.substr(0, pos));
        array[MINUTE] = toInt(input.substr(pos));
        getParsingFlags(config).bigHour = true;
    });
    addParseToken('hmmss', function (input, array, config) {
        var pos1 = input.length - 4;
        var pos2 = input.length - 2;
        array[HOUR] = toInt(input.substr(0, pos1));
        array[MINUTE] = toInt(input.substr(pos1, 2));
        array[SECOND] = toInt(input.substr(pos2));
        getParsingFlags(config).bigHour = true;
    });
    addParseToken('Hmm', function (input, array, config) {
        var pos = input.length - 2;
        array[HOUR] = toInt(input.substr(0, pos));
        array[MINUTE] = toInt(input.substr(pos));
    });
    addParseToken('Hmmss', function (input, array, config) {
        var pos1 = input.length - 4;
        var pos2 = input.length - 2;
        array[HOUR] = toInt(input.substr(0, pos1));
        array[MINUTE] = toInt(input.substr(pos1, 2));
        array[SECOND] = toInt(input.substr(pos2));
    });

    // LOCALES

    function localeIsPM (input) {
        // IE8 Quirks Mode & IE7 Standards Mode do not allow accessing strings like arrays
        // Using charAt should be more compatible.
        return ((input + '').toLowerCase().charAt(0) === 'p');
    }

    var defaultLocaleMeridiemParse = /[ap]\.?m?\.?/i;
    function localeMeridiem (hours, minutes, isLower) {
        if (hours > 11) {
            return isLower ? 'pm' : 'PM';
        } else {
            return isLower ? 'am' : 'AM';
        }
    }


    // MOMENTS

    // Setting the hour should keep the time, because the user explicitly
    // specified which hour he wants. So trying to maintain the same hour (in
    // a new timezone) makes sense. Adding/subtracting hours does not follow
    // this rule.
    var getSetHour = makeGetSet('Hours', true);

    var baseConfig = {
        calendar: defaultCalendar,
        longDateFormat: defaultLongDateFormat,
        invalidDate: defaultInvalidDate,
        ordinal: defaultOrdinal,
        ordinalParse: defaultOrdinalParse,
        relativeTime: defaultRelativeTime,

        months: defaultLocaleMonths,
        monthsShort: defaultLocaleMonthsShort,

        week: defaultLocaleWeek,

        weekdays: defaultLocaleWeekdays,
        weekdaysMin: defaultLocaleWeekdaysMin,
        weekdaysShort: defaultLocaleWeekdaysShort,

        meridiemParse: defaultLocaleMeridiemParse
    };

    // internal storage for locale config files
    var locales = {};
    var globalLocale;

    function normalizeLocale(key) {
        return key ? key.toLowerCase().replace('_', '-') : key;
    }

    // pick the locale from the array
    // try ['en-au', 'en-gb'] as 'en-au', 'en-gb', 'en', as in move through the list trying each
    // substring from most specific to least, but move to the next array item if it's a more specific variant than the current root
    function chooseLocale(names) {
        var i = 0, j, next, locale, split;

        while (i < names.length) {
            split = normalizeLocale(names[i]).split('-');
            j = split.length;
            next = normalizeLocale(names[i + 1]);
            next = next ? next.split('-') : null;
            while (j > 0) {
                locale = loadLocale(split.slice(0, j).join('-'));
                if (locale) {
                    return locale;
                }
                if (next && next.length >= j && compareArrays(split, next, true) >= j - 1) {
                    //the next array item is better than a shallower substring of this one
                    break;
                }
                j--;
            }
            i++;
        }
        return null;
    }

    function loadLocale(name) {
        var oldLocale = null;
        // TODO: Find a better way to register and load all the locales in Node
        if (!locales[name] && (typeof module !== 'undefined') &&
                module && module.exports) {
            try {
                oldLocale = globalLocale._abbr;
                require('./locale/' + name);
                // because defineLocale currently also sets the global locale, we
                // want to undo that for lazy loaded locales
                locale_locales__getSetGlobalLocale(oldLocale);
            } catch (e) { }
        }
        return locales[name];
    }

    // This function will load locale and then set the global locale.  If
    // no arguments are passed in, it will simply return the current global
    // locale key.
    function locale_locales__getSetGlobalLocale (key, values) {
        var data;
        if (key) {
            if (isUndefined(values)) {
                data = locale_locales__getLocale(key);
            }
            else {
                data = defineLocale(key, values);
            }

            if (data) {
                // moment.duration._locale = moment._locale = data;
                globalLocale = data;
            }
        }

        return globalLocale._abbr;
    }

    function defineLocale (name, config) {
        if (config !== null) {
            var parentConfig = baseConfig;
            config.abbr = name;
            if (locales[name] != null) {
                deprecateSimple('defineLocaleOverride',
                        'use moment.updateLocale(localeName, config) to change ' +
                        'an existing locale. moment.defineLocale(localeName, ' +
                        'config) should only be used for creating a new locale ' +
                        'See http://momentjs.com/guides/#/warnings/define-locale/ for more info.');
                parentConfig = locales[name]._config;
            } else if (config.parentLocale != null) {
                if (locales[config.parentLocale] != null) {
                    parentConfig = locales[config.parentLocale]._config;
                } else {
                    // treat as if there is no base config
                    deprecateSimple('parentLocaleUndefined',
                            'specified parentLocale is not defined yet. See http://momentjs.com/guides/#/warnings/parent-locale/');
                }
            }
            locales[name] = new Locale(mergeConfigs(parentConfig, config));

            // backwards compat for now: also set the locale
            locale_locales__getSetGlobalLocale(name);

            return locales[name];
        } else {
            // useful for testing
            delete locales[name];
            return null;
        }
    }

    function updateLocale(name, config) {
        if (config != null) {
            var locale, parentConfig = baseConfig;
            // MERGE
            if (locales[name] != null) {
                parentConfig = locales[name]._config;
            }
            config = mergeConfigs(parentConfig, config);
            locale = new Locale(config);
            locale.parentLocale = locales[name];
            locales[name] = locale;

            // backwards compat for now: also set the locale
            locale_locales__getSetGlobalLocale(name);
        } else {
            // pass null for config to unupdate, useful for tests
            if (locales[name] != null) {
                if (locales[name].parentLocale != null) {
                    locales[name] = locales[name].parentLocale;
                } else if (locales[name] != null) {
                    delete locales[name];
                }
            }
        }
        return locales[name];
    }

    // returns locale data
    function locale_locales__getLocale (key) {
        var locale;

        if (key && key._locale && key._locale._abbr) {
            key = key._locale._abbr;
        }

        if (!key) {
            return globalLocale;
        }

        if (!isArray(key)) {
            //short-circuit everything else
            locale = loadLocale(key);
            if (locale) {
                return locale;
            }
            key = [key];
        }

        return chooseLocale(key);
    }

    function locale_locales__listLocales() {
        return keys(locales);
    }

    function checkOverflow (m) {
        var overflow;
        var a = m._a;

        if (a && getParsingFlags(m).overflow === -2) {
            overflow =
                a[MONTH]       < 0 || a[MONTH]       > 11  ? MONTH :
                a[DATE]        < 1 || a[DATE]        > daysInMonth(a[YEAR], a[MONTH]) ? DATE :
                a[HOUR]        < 0 || a[HOUR]        > 24 || (a[HOUR] === 24 && (a[MINUTE] !== 0 || a[SECOND] !== 0 || a[MILLISECOND] !== 0)) ? HOUR :
                a[MINUTE]      < 0 || a[MINUTE]      > 59  ? MINUTE :
                a[SECOND]      < 0 || a[SECOND]      > 59  ? SECOND :
                a[MILLISECOND] < 0 || a[MILLISECOND] > 999 ? MILLISECOND :
                -1;

            if (getParsingFlags(m)._overflowDayOfYear && (overflow < YEAR || overflow > DATE)) {
                overflow = DATE;
            }
            if (getParsingFlags(m)._overflowWeeks && overflow === -1) {
                overflow = WEEK;
            }
            if (getParsingFlags(m)._overflowWeekday && overflow === -1) {
                overflow = WEEKDAY;
            }

            getParsingFlags(m).overflow = overflow;
        }

        return m;
    }

    // iso 8601 regex
    // 0000-00-00 0000-W00 or 0000-W00-0 + T + 00 or 00:00 or 00:00:00 or 00:00:00.000 + +00:00 or +0000 or +00)
    var extendedIsoRegex = /^\s*((?:[+-]\d{6}|\d{4})-(?:\d\d-\d\d|W\d\d-\d|W\d\d|\d\d\d|\d\d))(?:(T| )(\d\d(?::\d\d(?::\d\d(?:[.,]\d+)?)?)?)([\+\-]\d\d(?::?\d\d)?|\s*Z)?)?/;
    var basicIsoRegex = /^\s*((?:[+-]\d{6}|\d{4})(?:\d\d\d\d|W\d\d\d|W\d\d|\d\d\d|\d\d))(?:(T| )(\d\d(?:\d\d(?:\d\d(?:[.,]\d+)?)?)?)([\+\-]\d\d(?::?\d\d)?|\s*Z)?)?/;

    var tzRegex = /Z|[+-]\d\d(?::?\d\d)?/;

    var isoDates = [
        ['YYYYYY-MM-DD', /[+-]\d{6}-\d\d-\d\d/],
        ['YYYY-MM-DD', /\d{4}-\d\d-\d\d/],
        ['GGGG-[W]WW-E', /\d{4}-W\d\d-\d/],
        ['GGGG-[W]WW', /\d{4}-W\d\d/, false],
        ['YYYY-DDD', /\d{4}-\d{3}/],
        ['YYYY-MM', /\d{4}-\d\d/, false],
        ['YYYYYYMMDD', /[+-]\d{10}/],
        ['YYYYMMDD', /\d{8}/],
        // YYYYMM is NOT allowed by the standard
        ['GGGG[W]WWE', /\d{4}W\d{3}/],
        ['GGGG[W]WW', /\d{4}W\d{2}/, false],
        ['YYYYDDD', /\d{7}/]
    ];

    // iso time formats and regexes
    var isoTimes = [
        ['HH:mm:ss.SSSS', /\d\d:\d\d:\d\d\.\d+/],
        ['HH:mm:ss,SSSS', /\d\d:\d\d:\d\d,\d+/],
        ['HH:mm:ss', /\d\d:\d\d:\d\d/],
        ['HH:mm', /\d\d:\d\d/],
        ['HHmmss.SSSS', /\d\d\d\d\d\d\.\d+/],
        ['HHmmss,SSSS', /\d\d\d\d\d\d,\d+/],
        ['HHmmss', /\d\d\d\d\d\d/],
        ['HHmm', /\d\d\d\d/],
        ['HH', /\d\d/]
    ];

    var aspNetJsonRegex = /^\/?Date\((\-?\d+)/i;

    // date from iso format
    function configFromISO(config) {
        var i, l,
            string = config._i,
            match = extendedIsoRegex.exec(string) || basicIsoRegex.exec(string),
            allowTime, dateFormat, timeFormat, tzFormat;

        if (match) {
            getParsingFlags(config).iso = true;

            for (i = 0, l = isoDates.length; i < l; i++) {
                if (isoDates[i][1].exec(match[1])) {
                    dateFormat = isoDates[i][0];
                    allowTime = isoDates[i][2] !== false;
                    break;
                }
            }
            if (dateFormat == null) {
                config._isValid = false;
                return;
            }
            if (match[3]) {
                for (i = 0, l = isoTimes.length; i < l; i++) {
                    if (isoTimes[i][1].exec(match[3])) {
                        // match[2] should be 'T' or space
                        timeFormat = (match[2] || ' ') + isoTimes[i][0];
                        break;
                    }
                }
                if (timeFormat == null) {
                    config._isValid = false;
                    return;
                }
            }
            if (!allowTime && timeFormat != null) {
                config._isValid = false;
                return;
            }
            if (match[4]) {
                if (tzRegex.exec(match[4])) {
                    tzFormat = 'Z';
                } else {
                    config._isValid = false;
                    return;
                }
            }
            config._f = dateFormat + (timeFormat || '') + (tzFormat || '');
            configFromStringAndFormat(config);
        } else {
            config._isValid = false;
        }
    }

    // date from iso format or fallback
    function configFromString(config) {
        var matched = aspNetJsonRegex.exec(config._i);

        if (matched !== null) {
            config._d = new Date(+matched[1]);
            return;
        }

        configFromISO(config);
        if (config._isValid === false) {
            delete config._isValid;
            utils_hooks__hooks.createFromInputFallback(config);
        }
    }

    utils_hooks__hooks.createFromInputFallback = deprecate(
        'moment construction falls back to js Date. This is ' +
        'discouraged and will be removed in upcoming major ' +
        'release. Please refer to ' +
        'http://momentjs.com/guides/#/warnings/js-date/ for more info.',
        function (config) {
            config._d = new Date(config._i + (config._useUTC ? ' UTC' : ''));
        }
    );

    // Pick the first defined of two or three arguments.
    function defaults(a, b, c) {
        if (a != null) {
            return a;
        }
        if (b != null) {
            return b;
        }
        return c;
    }

    function currentDateArray(config) {
        // hooks is actually the exported moment object
        var nowValue = new Date(utils_hooks__hooks.now());
        if (config._useUTC) {
            return [nowValue.getUTCFullYear(), nowValue.getUTCMonth(), nowValue.getUTCDate()];
        }
        return [nowValue.getFullYear(), nowValue.getMonth(), nowValue.getDate()];
    }

    // convert an array to a date.
    // the array should mirror the parameters below
    // note: all values past the year are optional and will default to the lowest possible value.
    // [year, month, day , hour, minute, second, millisecond]
    function configFromArray (config) {
        var i, date, input = [], currentDate, yearToUse;

        if (config._d) {
            return;
        }

        currentDate = currentDateArray(config);

        //compute day of the year from weeks and weekdays
        if (config._w && config._a[DATE] == null && config._a[MONTH] == null) {
            dayOfYearFromWeekInfo(config);
        }

        //if the day of the year is set, figure out what it is
        if (config._dayOfYear) {
            yearToUse = defaults(config._a[YEAR], currentDate[YEAR]);

            if (config._dayOfYear > daysInYear(yearToUse)) {
                getParsingFlags(config)._overflowDayOfYear = true;
            }

            date = createUTCDate(yearToUse, 0, config._dayOfYear);
            config._a[MONTH] = date.getUTCMonth();
            config._a[DATE] = date.getUTCDate();
        }

        // Default to current date.
        // * if no year, month, day of month are given, default to today
        // * if day of month is given, default month and year
        // * if month is given, default only year
        // * if year is given, don't default anything
        for (i = 0; i < 3 && config._a[i] == null; ++i) {
            config._a[i] = input[i] = currentDate[i];
        }

        // Zero out whatever was not defaulted, including time
        for (; i < 7; i++) {
            config._a[i] = input[i] = (config._a[i] == null) ? (i === 2 ? 1 : 0) : config._a[i];
        }

        // Check for 24:00:00.000
        if (config._a[HOUR] === 24 &&
                config._a[MINUTE] === 0 &&
                config._a[SECOND] === 0 &&
                config._a[MILLISECOND] === 0) {
            config._nextDay = true;
            config._a[HOUR] = 0;
        }

        config._d = (config._useUTC ? createUTCDate : createDate).apply(null, input);
        // Apply timezone offset from input. The actual utcOffset can be changed
        // with parseZone.
        if (config._tzm != null) {
            config._d.setUTCMinutes(config._d.getUTCMinutes() - config._tzm);
        }

        if (config._nextDay) {
            config._a[HOUR] = 24;
        }
    }

    function dayOfYearFromWeekInfo(config) {
        var w, weekYear, week, weekday, dow, doy, temp, weekdayOverflow;

        w = config._w;
        if (w.GG != null || w.W != null || w.E != null) {
            dow = 1;
            doy = 4;

            // TODO: We need to take the current isoWeekYear, but that depends on
            // how we interpret now (local, utc, fixed offset). So create
            // a now version of current config (take local/utc/offset flags, and
            // create now).
            weekYear = defaults(w.GG, config._a[YEAR], weekOfYear(local__createLocal(), 1, 4).year);
            week = defaults(w.W, 1);
            weekday = defaults(w.E, 1);
            if (weekday < 1 || weekday > 7) {
                weekdayOverflow = true;
            }
        } else {
            dow = config._locale._week.dow;
            doy = config._locale._week.doy;

            weekYear = defaults(w.gg, config._a[YEAR], weekOfYear(local__createLocal(), dow, doy).year);
            week = defaults(w.w, 1);

            if (w.d != null) {
                // weekday -- low day numbers are considered next week
                weekday = w.d;
                if (weekday < 0 || weekday > 6) {
                    weekdayOverflow = true;
                }
            } else if (w.e != null) {
                // local weekday -- counting starts from begining of week
                weekday = w.e + dow;
                if (w.e < 0 || w.e > 6) {
                    weekdayOverflow = true;
                }
            } else {
                // default to begining of week
                weekday = dow;
            }
        }
        if (week < 1 || week > weeksInYear(weekYear, dow, doy)) {
            getParsingFlags(config)._overflowWeeks = true;
        } else if (weekdayOverflow != null) {
            getParsingFlags(config)._overflowWeekday = true;
        } else {
            temp = dayOfYearFromWeeks(weekYear, week, weekday, dow, doy);
            config._a[YEAR] = temp.year;
            config._dayOfYear = temp.dayOfYear;
        }
    }

    // constant that refers to the ISO standard
    utils_hooks__hooks.ISO_8601 = function () {};

    // date from string and format string
    function configFromStringAndFormat(config) {
        // TODO: Move this to another part of the creation flow to prevent circular deps
        if (config._f === utils_hooks__hooks.ISO_8601) {
            configFromISO(config);
            return;
        }

        config._a = [];
        getParsingFlags(config).empty = true;

        // This array is used to make a Date, either with `new Date` or `Date.UTC`
        var string = '' + config._i,
            i, parsedInput, tokens, token, skipped,
            stringLength = string.length,
            totalParsedInputLength = 0;

        tokens = expandFormat(config._f, config._locale).match(formattingTokens) || [];

        for (i = 0; i < tokens.length; i++) {
            token = tokens[i];
            parsedInput = (string.match(getParseRegexForToken(token, config)) || [])[0];
            // console.log('token', token, 'parsedInput', parsedInput,
            //         'regex', getParseRegexForToken(token, config));
            if (parsedInput) {
                skipped = string.substr(0, string.indexOf(parsedInput));
                if (skipped.length > 0) {
                    getParsingFlags(config).unusedInput.push(skipped);
                }
                string = string.slice(string.indexOf(parsedInput) + parsedInput.length);
                totalParsedInputLength += parsedInput.length;
            }
            // don't parse if it's not a known token
            if (formatTokenFunctions[token]) {
                if (parsedInput) {
                    getParsingFlags(config).empty = false;
                }
                else {
                    getParsingFlags(config).unusedTokens.push(token);
                }
                addTimeToArrayFromToken(token, parsedInput, config);
            }
            else if (config._strict && !parsedInput) {
                getParsingFlags(config).unusedTokens.push(token);
            }
        }

        // add remaining unparsed input length to the string
        getParsingFlags(config).charsLeftOver = stringLength - totalParsedInputLength;
        if (string.length > 0) {
            getParsingFlags(config).unusedInput.push(string);
        }

        // clear _12h flag if hour is <= 12
        if (config._a[HOUR] <= 12 &&
            getParsingFlags(config).bigHour === true &&
            config._a[HOUR] > 0) {
            getParsingFlags(config).bigHour = undefined;
        }

        getParsingFlags(config).parsedDateParts = config._a.slice(0);
        getParsingFlags(config).meridiem = config._meridiem;
        // handle meridiem
        config._a[HOUR] = meridiemFixWrap(config._locale, config._a[HOUR], config._meridiem);

        configFromArray(config);
        checkOverflow(config);
    }


    function meridiemFixWrap (locale, hour, meridiem) {
        var isPm;

        if (meridiem == null) {
            // nothing to do
            return hour;
        }
        if (locale.meridiemHour != null) {
            return locale.meridiemHour(hour, meridiem);
        } else if (locale.isPM != null) {
            // Fallback
            isPm = locale.isPM(meridiem);
            if (isPm && hour < 12) {
                hour += 12;
            }
            if (!isPm && hour === 12) {
                hour = 0;
            }
            return hour;
        } else {
            // this is not supposed to happen
            return hour;
        }
    }

    // date from string and array of format strings
    function configFromStringAndArray(config) {
        var tempConfig,
            bestMoment,

            scoreToBeat,
            i,
            currentScore;

        if (config._f.length === 0) {
            getParsingFlags(config).invalidFormat = true;
            config._d = new Date(NaN);
            return;
        }

        for (i = 0; i < config._f.length; i++) {
            currentScore = 0;
            tempConfig = copyConfig({}, config);
            if (config._useUTC != null) {
                tempConfig._useUTC = config._useUTC;
            }
            tempConfig._f = config._f[i];
            configFromStringAndFormat(tempConfig);

            if (!valid__isValid(tempConfig)) {
                continue;
            }

            // if there is any input that was not parsed add a penalty for that format
            currentScore += getParsingFlags(tempConfig).charsLeftOver;

            //or tokens
            currentScore += getParsingFlags(tempConfig).unusedTokens.length * 10;

            getParsingFlags(tempConfig).score = currentScore;

            if (scoreToBeat == null || currentScore < scoreToBeat) {
                scoreToBeat = currentScore;
                bestMoment = tempConfig;
            }
        }

        extend(config, bestMoment || tempConfig);
    }

    function configFromObject(config) {
        if (config._d) {
            return;
        }

        var i = normalizeObjectUnits(config._i);
        config._a = map([i.year, i.month, i.day || i.date, i.hour, i.minute, i.second, i.millisecond], function (obj) {
            return obj && parseInt(obj, 10);
        });

        configFromArray(config);
    }

    function createFromConfig (config) {
        var res = new Moment(checkOverflow(prepareConfig(config)));
        if (res._nextDay) {
            // Adding is smart enough around DST
            res.add(1, 'd');
            res._nextDay = undefined;
        }

        return res;
    }

    function prepareConfig (config) {
        var input = config._i,
            format = config._f;

        config._locale = config._locale || locale_locales__getLocale(config._l);

        if (input === null || (format === undefined && input === '')) {
            return valid__createInvalid({nullInput: true});
        }

        if (typeof input === 'string') {
            config._i = input = config._locale.preparse(input);
        }

        if (isMoment(input)) {
            return new Moment(checkOverflow(input));
        } else if (isArray(format)) {
            configFromStringAndArray(config);
        } else if (isDate(input)) {
            config._d = input;
        } else if (format) {
            configFromStringAndFormat(config);
        }  else {
            configFromInput(config);
        }

        if (!valid__isValid(config)) {
            config._d = null;
        }

        return config;
    }

    function configFromInput(config) {
        var input = config._i;
        if (input === undefined) {
            config._d = new Date(utils_hooks__hooks.now());
        } else if (isDate(input)) {
            config._d = new Date(input.valueOf());
        } else if (typeof input === 'string') {
            configFromString(config);
        } else if (isArray(input)) {
            config._a = map(input.slice(0), function (obj) {
                return parseInt(obj, 10);
            });
            configFromArray(config);
        } else if (typeof(input) === 'object') {
            configFromObject(config);
        } else if (typeof(input) === 'number') {
            // from milliseconds
            config._d = new Date(input);
        } else {
            utils_hooks__hooks.createFromInputFallback(config);
        }
    }

    function createLocalOrUTC (input, format, locale, strict, isUTC) {
        var c = {};

        if (typeof(locale) === 'boolean') {
            strict = locale;
            locale = undefined;
        }

        if ((isObject(input) && isObjectEmpty(input)) ||
                (isArray(input) && input.length === 0)) {
            input = undefined;
        }
        // object construction must be done this way.
        // https://github.com/moment/moment/issues/1423
        c._isAMomentObject = true;
        c._useUTC = c._isUTC = isUTC;
        c._l = locale;
        c._i = input;
        c._f = format;
        c._strict = strict;

        return createFromConfig(c);
    }

    function local__createLocal (input, format, locale, strict) {
        return createLocalOrUTC(input, format, locale, strict, false);
    }

    var prototypeMin = deprecate(
        'moment().min is deprecated, use moment.max instead. http://momentjs.com/guides/#/warnings/min-max/',
        function () {
            var other = local__createLocal.apply(null, arguments);
            if (this.isValid() && other.isValid()) {
                return other < this ? this : other;
            } else {
                return valid__createInvalid();
            }
        }
    );

    var prototypeMax = deprecate(
        'moment().max is deprecated, use moment.min instead. http://momentjs.com/guides/#/warnings/min-max/',
        function () {
            var other = local__createLocal.apply(null, arguments);
            if (this.isValid() && other.isValid()) {
                return other > this ? this : other;
            } else {
                return valid__createInvalid();
            }
        }
    );

    // Pick a moment m from moments so that m[fn](other) is true for all
    // other. This relies on the function fn to be transitive.
    //
    // moments should either be an array of moment objects or an array, whose
    // first element is an array of moment objects.
    function pickBy(fn, moments) {
        var res, i;
        if (moments.length === 1 && isArray(moments[0])) {
            moments = moments[0];
        }
        if (!moments.length) {
            return local__createLocal();
        }
        res = moments[0];
        for (i = 1; i < moments.length; ++i) {
            if (!moments[i].isValid() || moments[i][fn](res)) {
                res = moments[i];
            }
        }
        return res;
    }

    // TODO: Use [].sort instead?
    function min () {
        var args = [].slice.call(arguments, 0);

        return pickBy('isBefore', args);
    }

    function max () {
        var args = [].slice.call(arguments, 0);

        return pickBy('isAfter', args);
    }

    var now = function () {
        return Date.now ? Date.now() : +(new Date());
    };

    function Duration (duration) {
        var normalizedInput = normalizeObjectUnits(duration),
            years = normalizedInput.year || 0,
            quarters = normalizedInput.quarter || 0,
            months = normalizedInput.month || 0,
            weeks = normalizedInput.week || 0,
            days = normalizedInput.day || 0,
            hours = normalizedInput.hour || 0,
            minutes = normalizedInput.minute || 0,
            seconds = normalizedInput.second || 0,
            milliseconds = normalizedInput.millisecond || 0;

        // representation for dateAddRemove
        this._milliseconds = +milliseconds +
            seconds * 1e3 + // 1000
            minutes * 6e4 + // 1000 * 60
            hours * 1000 * 60 * 60; //using 1000 * 60 * 60 instead of 36e5 to avoid floating point rounding errors https://github.com/moment/moment/issues/2978
        // Because of dateAddRemove treats 24 hours as different from a
        // day when working around DST, we need to store them separately
        this._days = +days +
            weeks * 7;
        // It is impossible translate months into days without knowing
        // which months you are are talking about, so we have to store
        // it separately.
        this._months = +months +
            quarters * 3 +
            years * 12;

        this._data = {};

        this._locale = locale_locales__getLocale();

        this._bubble();
    }

    function isDuration (obj) {
        return obj instanceof Duration;
    }

    // FORMATTING

    function offset (token, separator) {
        addFormatToken(token, 0, 0, function () {
            var offset = this.utcOffset();
            var sign = '+';
            if (offset < 0) {
                offset = -offset;
                sign = '-';
            }
            return sign + zeroFill(~~(offset / 60), 2) + separator + zeroFill(~~(offset) % 60, 2);
        });
    }

    offset('Z', ':');
    offset('ZZ', '');

    // PARSING

    addRegexToken('Z',  matchShortOffset);
    addRegexToken('ZZ', matchShortOffset);
    addParseToken(['Z', 'ZZ'], function (input, array, config) {
        config._useUTC = true;
        config._tzm = offsetFromString(matchShortOffset, input);
    });

    // HELPERS

    // timezone chunker
    // '+10:00' > ['10',  '00']
    // '-1530'  > ['-15', '30']
    var chunkOffset = /([\+\-]|\d\d)/gi;

    function offsetFromString(matcher, string) {
        var matches = ((string || '').match(matcher) || []);
        var chunk   = matches[matches.length - 1] || [];
        var parts   = (chunk + '').match(chunkOffset) || ['-', 0, 0];
        var minutes = +(parts[1] * 60) + toInt(parts[2]);

        return parts[0] === '+' ? minutes : -minutes;
    }

    // Return a moment from input, that is local/utc/zone equivalent to model.
    function cloneWithOffset(input, model) {
        var res, diff;
        if (model._isUTC) {
            res = model.clone();
            diff = (isMoment(input) || isDate(input) ? input.valueOf() : local__createLocal(input).valueOf()) - res.valueOf();
            // Use low-level api, because this fn is low-level api.
            res._d.setTime(res._d.valueOf() + diff);
            utils_hooks__hooks.updateOffset(res, false);
            return res;
        } else {
            return local__createLocal(input).local();
        }
    }

    function getDateOffset (m) {
        // On Firefox.24 Date#getTimezoneOffset returns a floating point.
        // https://github.com/moment/moment/pull/1871
        return -Math.round(m._d.getTimezoneOffset() / 15) * 15;
    }

    // HOOKS

    // This function will be called whenever a moment is mutated.
    // It is intended to keep the offset in sync with the timezone.
    utils_hooks__hooks.updateOffset = function () {};

    // MOMENTS

    // keepLocalTime = true means only change the timezone, without
    // affecting the local hour. So 5:31:26 +0300 --[utcOffset(2, true)]-->
    // 5:31:26 +0200 It is possible that 5:31:26 doesn't exist with offset
    // +0200, so we adjust the time as needed, to be valid.
    //
    // Keeping the time actually adds/subtracts (one hour)
    // from the actual represented time. That is why we call updateOffset
    // a second time. In case it wants us to change the offset again
    // _changeInProgress == true case, then we have to adjust, because
    // there is no such time in the given timezone.
    function getSetOffset (input, keepLocalTime) {
        var offset = this._offset || 0,
            localAdjust;
        if (!this.isValid()) {
            return input != null ? this : NaN;
        }
        if (input != null) {
            if (typeof input === 'string') {
                input = offsetFromString(matchShortOffset, input);
            } else if (Math.abs(input) < 16) {
                input = input * 60;
            }
            if (!this._isUTC && keepLocalTime) {
                localAdjust = getDateOffset(this);
            }
            this._offset = input;
            this._isUTC = true;
            if (localAdjust != null) {
                this.add(localAdjust, 'm');
            }
            if (offset !== input) {
                if (!keepLocalTime || this._changeInProgress) {
                    add_subtract__addSubtract(this, create__createDuration(input - offset, 'm'), 1, false);
                } else if (!this._changeInProgress) {
                    this._changeInProgress = true;
                    utils_hooks__hooks.updateOffset(this, true);
                    this._changeInProgress = null;
                }
            }
            return this;
        } else {
            return this._isUTC ? offset : getDateOffset(this);
        }
    }

    function getSetZone (input, keepLocalTime) {
        if (input != null) {
            if (typeof input !== 'string') {
                input = -input;
            }

            this.utcOffset(input, keepLocalTime);

            return this;
        } else {
            return -this.utcOffset();
        }
    }

    function setOffsetToUTC (keepLocalTime) {
        return this.utcOffset(0, keepLocalTime);
    }

    function setOffsetToLocal (keepLocalTime) {
        if (this._isUTC) {
            this.utcOffset(0, keepLocalTime);
            this._isUTC = false;

            if (keepLocalTime) {
                this.subtract(getDateOffset(this), 'm');
            }
        }
        return this;
    }

    function setOffsetToParsedOffset () {
        if (this._tzm) {
            this.utcOffset(this._tzm);
        } else if (typeof this._i === 'string') {
            this.utcOffset(offsetFromString(matchOffset, this._i));
        }
        return this;
    }

    function hasAlignedHourOffset (input) {
        if (!this.isValid()) {
            return false;
        }
        input = input ? local__createLocal(input).utcOffset() : 0;

        return (this.utcOffset() - input) % 60 === 0;
    }

    function isDaylightSavingTime () {
        return (
            this.utcOffset() > this.clone().month(0).utcOffset() ||
            this.utcOffset() > this.clone().month(5).utcOffset()
        );
    }

    function isDaylightSavingTimeShifted () {
        if (!isUndefined(this._isDSTShifted)) {
            return this._isDSTShifted;
        }

        var c = {};

        copyConfig(c, this);
        c = prepareConfig(c);

        if (c._a) {
            var other = c._isUTC ? create_utc__createUTC(c._a) : local__createLocal(c._a);
            this._isDSTShifted = this.isValid() &&
                compareArrays(c._a, other.toArray()) > 0;
        } else {
            this._isDSTShifted = false;
        }

        return this._isDSTShifted;
    }

    function isLocal () {
        return this.isValid() ? !this._isUTC : false;
    }

    function isUtcOffset () {
        return this.isValid() ? this._isUTC : false;
    }

    function isUtc () {
        return this.isValid() ? this._isUTC && this._offset === 0 : false;
    }

    // ASP.NET json date format regex
    var aspNetRegex = /^(\-)?(?:(\d*)[. ])?(\d+)\:(\d+)(?:\:(\d+)\.?(\d{3})?\d*)?$/;

    // from http://docs.closure-library.googlecode.com/git/closure_goog_date_date.js.source.html
    // somewhat more in line with 4.4.3.2 2004 spec, but allows decimal anywhere
    // and further modified to allow for strings containing both week and day
    var isoRegex = /^(-)?P(?:(-?[0-9,.]*)Y)?(?:(-?[0-9,.]*)M)?(?:(-?[0-9,.]*)W)?(?:(-?[0-9,.]*)D)?(?:T(?:(-?[0-9,.]*)H)?(?:(-?[0-9,.]*)M)?(?:(-?[0-9,.]*)S)?)?$/;

    function create__createDuration (input, key) {
        var duration = input,
            // matching against regexp is expensive, do it on demand
            match = null,
            sign,
            ret,
            diffRes;

        if (isDuration(input)) {
            duration = {
                ms : input._milliseconds,
                d  : input._days,
                M  : input._months
            };
        } else if (typeof input === 'number') {
            duration = {};
            if (key) {
                duration[key] = input;
            } else {
                duration.milliseconds = input;
            }
        } else if (!!(match = aspNetRegex.exec(input))) {
            sign = (match[1] === '-') ? -1 : 1;
            duration = {
                y  : 0,
                d  : toInt(match[DATE])        * sign,
                h  : toInt(match[HOUR])        * sign,
                m  : toInt(match[MINUTE])      * sign,
                s  : toInt(match[SECOND])      * sign,
                ms : toInt(match[MILLISECOND]) * sign
            };
        } else if (!!(match = isoRegex.exec(input))) {
            sign = (match[1] === '-') ? -1 : 1;
            duration = {
                y : parseIso(match[2], sign),
                M : parseIso(match[3], sign),
                w : parseIso(match[4], sign),
                d : parseIso(match[5], sign),
                h : parseIso(match[6], sign),
                m : parseIso(match[7], sign),
                s : parseIso(match[8], sign)
            };
        } else if (duration == null) {// checks for null or undefined
            duration = {};
        } else if (typeof duration === 'object' && ('from' in duration || 'to' in duration)) {
            diffRes = momentsDifference(local__createLocal(duration.from), local__createLocal(duration.to));

            duration = {};
            duration.ms = diffRes.milliseconds;
            duration.M = diffRes.months;
        }

        ret = new Duration(duration);

        if (isDuration(input) && hasOwnProp(input, '_locale')) {
            ret._locale = input._locale;
        }

        return ret;
    }

    create__createDuration.fn = Duration.prototype;

    function parseIso (inp, sign) {
        // We'd normally use ~~inp for this, but unfortunately it also
        // converts floats to ints.
        // inp may be undefined, so careful calling replace on it.
        var res = inp && parseFloat(inp.replace(',', '.'));
        // apply sign while we're at it
        return (isNaN(res) ? 0 : res) * sign;
    }

    function positiveMomentsDifference(base, other) {
        var res = {milliseconds: 0, months: 0};

        res.months = other.month() - base.month() +
            (other.year() - base.year()) * 12;
        if (base.clone().add(res.months, 'M').isAfter(other)) {
            --res.months;
        }

        res.milliseconds = +other - +(base.clone().add(res.months, 'M'));

        return res;
    }

    function momentsDifference(base, other) {
        var res;
        if (!(base.isValid() && other.isValid())) {
            return {milliseconds: 0, months: 0};
        }

        other = cloneWithOffset(other, base);
        if (base.isBefore(other)) {
            res = positiveMomentsDifference(base, other);
        } else {
            res = positiveMomentsDifference(other, base);
            res.milliseconds = -res.milliseconds;
            res.months = -res.months;
        }

        return res;
    }

    function absRound (number) {
        if (number < 0) {
            return Math.round(-1 * number) * -1;
        } else {
            return Math.round(number);
        }
    }

    // TODO: remove 'name' arg after deprecation is removed
    function createAdder(direction, name) {
        return function (val, period) {
            var dur, tmp;
            //invert the arguments, but complain about it
            if (period !== null && !isNaN(+period)) {
                deprecateSimple(name, 'moment().' + name  + '(period, number) is deprecated. Please use moment().' + name + '(number, period). ' +
                'See http://momentjs.com/guides/#/warnings/add-inverted-param/ for more info.');
                tmp = val; val = period; period = tmp;
            }

            val = typeof val === 'string' ? +val : val;
            dur = create__createDuration(val, period);
            add_subtract__addSubtract(this, dur, direction);
            return this;
        };
    }

    function add_subtract__addSubtract (mom, duration, isAdding, updateOffset) {
        var milliseconds = duration._milliseconds,
            days = absRound(duration._days),
            months = absRound(duration._months);

        if (!mom.isValid()) {
            // No op
            return;
        }

        updateOffset = updateOffset == null ? true : updateOffset;

        if (milliseconds) {
            mom._d.setTime(mom._d.valueOf() + milliseconds * isAdding);
        }
        if (days) {
            get_set__set(mom, 'Date', get_set__get(mom, 'Date') + days * isAdding);
        }
        if (months) {
            setMonth(mom, get_set__get(mom, 'Month') + months * isAdding);
        }
        if (updateOffset) {
            utils_hooks__hooks.updateOffset(mom, days || months);
        }
    }

    var add_subtract__add      = createAdder(1, 'add');
    var add_subtract__subtract = createAdder(-1, 'subtract');

    function getCalendarFormat(myMoment, now) {
        var diff = myMoment.diff(now, 'days', true);
        return diff < -6 ? 'sameElse' :
                diff < -1 ? 'lastWeek' :
                diff < 0 ? 'lastDay' :
                diff < 1 ? 'sameDay' :
                diff < 2 ? 'nextDay' :
                diff < 7 ? 'nextWeek' : 'sameElse';
    }

    function moment_calendar__calendar (time, formats) {
        // We want to compare the start of today, vs this.
        // Getting start-of-today depends on whether we're local/utc/offset or not.
        var now = time || local__createLocal(),
            sod = cloneWithOffset(now, this).startOf('day'),
            format = utils_hooks__hooks.calendarFormat(this, sod) || 'sameElse';

        var output = formats && (isFunction(formats[format]) ? formats[format].call(this, now) : formats[format]);

        return this.format(output || this.localeData().calendar(format, this, local__createLocal(now)));
    }

    function clone () {
        return new Moment(this);
    }

    function isAfter (input, units) {
        var localInput = isMoment(input) ? input : local__createLocal(input);
        if (!(this.isValid() && localInput.isValid())) {
            return false;
        }
        units = normalizeUnits(!isUndefined(units) ? units : 'millisecond');
        if (units === 'millisecond') {
            return this.valueOf() > localInput.valueOf();
        } else {
            return localInput.valueOf() < this.clone().startOf(units).valueOf();
        }
    }

    function isBefore (input, units) {
        var localInput = isMoment(input) ? input : local__createLocal(input);
        if (!(this.isValid() && localInput.isValid())) {
            return false;
        }
        units = normalizeUnits(!isUndefined(units) ? units : 'millisecond');
        if (units === 'millisecond') {
            return this.valueOf() < localInput.valueOf();
        } else {
            return this.clone().endOf(units).valueOf() < localInput.valueOf();
        }
    }

    function isBetween (from, to, units, inclusivity) {
        inclusivity = inclusivity || '()';
        return (inclusivity[0] === '(' ? this.isAfter(from, units) : !this.isBefore(from, units)) &&
            (inclusivity[1] === ')' ? this.isBefore(to, units) : !this.isAfter(to, units));
    }

    function isSame (input, units) {
        var localInput = isMoment(input) ? input : local__createLocal(input),
            inputMs;
        if (!(this.isValid() && localInput.isValid())) {
            return false;
        }
        units = normalizeUnits(units || 'millisecond');
        if (units === 'millisecond') {
            return this.valueOf() === localInput.valueOf();
        } else {
            inputMs = localInput.valueOf();
            return this.clone().startOf(units).valueOf() <= inputMs && inputMs <= this.clone().endOf(units).valueOf();
        }
    }

    function isSameOrAfter (input, units) {
        return this.isSame(input, units) || this.isAfter(input,units);
    }

    function isSameOrBefore (input, units) {
        return this.isSame(input, units) || this.isBefore(input,units);
    }

    function diff (input, units, asFloat) {
        var that,
            zoneDelta,
            delta, output;

        if (!this.isValid()) {
            return NaN;
        }

        that = cloneWithOffset(input, this);

        if (!that.isValid()) {
            return NaN;
        }

        zoneDelta = (that.utcOffset() - this.utcOffset()) * 6e4;

        units = normalizeUnits(units);

        if (units === 'year' || units === 'month' || units === 'quarter') {
            output = monthDiff(this, that);
            if (units === 'quarter') {
                output = output / 3;
            } else if (units === 'year') {
                output = output / 12;
            }
        } else {
            delta = this - that;
            output = units === 'second' ? delta / 1e3 : // 1000
                units === 'minute' ? delta / 6e4 : // 1000 * 60
                units === 'hour' ? delta / 36e5 : // 1000 * 60 * 60
                units === 'day' ? (delta - zoneDelta) / 864e5 : // 1000 * 60 * 60 * 24, negate dst
                units === 'week' ? (delta - zoneDelta) / 6048e5 : // 1000 * 60 * 60 * 24 * 7, negate dst
                delta;
        }
        return asFloat ? output : absFloor(output);
    }

    function monthDiff (a, b) {
        // difference in months
        var wholeMonthDiff = ((b.year() - a.year()) * 12) + (b.month() - a.month()),
            // b is in (anchor - 1 month, anchor + 1 month)
            anchor = a.clone().add(wholeMonthDiff, 'months'),
            anchor2, adjust;

        if (b - anchor < 0) {
            anchor2 = a.clone().add(wholeMonthDiff - 1, 'months');
            // linear across the month
            adjust = (b - anchor) / (anchor - anchor2);
        } else {
            anchor2 = a.clone().add(wholeMonthDiff + 1, 'months');
            // linear across the month
            adjust = (b - anchor) / (anchor2 - anchor);
        }

        //check for negative zero, return zero if negative zero
        return -(wholeMonthDiff + adjust) || 0;
    }

    utils_hooks__hooks.defaultFormat = 'YYYY-MM-DDTHH:mm:ssZ';
    utils_hooks__hooks.defaultFormatUtc = 'YYYY-MM-DDTHH:mm:ss[Z]';

    function toString () {
        return this.clone().locale('en').format('ddd MMM DD YYYY HH:mm:ss [GMT]ZZ');
    }

    function moment_format__toISOString () {
        var m = this.clone().utc();
        if (0 < m.year() && m.year() <= 9999) {
            if (isFunction(Date.prototype.toISOString)) {
                // native implementation is ~50x faster, use it when we can
                return this.toDate().toISOString();
            } else {
                return formatMoment(m, 'YYYY-MM-DD[T]HH:mm:ss.SSS[Z]');
            }
        } else {
            return formatMoment(m, 'YYYYYY-MM-DD[T]HH:mm:ss.SSS[Z]');
        }
    }

    function format (inputString) {
        if (!inputString) {
            inputString = this.isUtc() ? utils_hooks__hooks.defaultFormatUtc : utils_hooks__hooks.defaultFormat;
        }
        var output = formatMoment(this, inputString);
        return this.localeData().postformat(output);
    }

    function from (time, withoutSuffix) {
        if (this.isValid() &&
                ((isMoment(time) && time.isValid()) ||
                 local__createLocal(time).isValid())) {
            return create__createDuration({to: this, from: time}).locale(this.locale()).humanize(!withoutSuffix);
        } else {
            return this.localeData().invalidDate();
        }
    }

    function fromNow (withoutSuffix) {
        return this.from(local__createLocal(), withoutSuffix);
    }

    function to (time, withoutSuffix) {
        if (this.isValid() &&
                ((isMoment(time) && time.isValid()) ||
                 local__createLocal(time).isValid())) {
            return create__createDuration({from: this, to: time}).locale(this.locale()).humanize(!withoutSuffix);
        } else {
            return this.localeData().invalidDate();
        }
    }

    function toNow (withoutSuffix) {
        return this.to(local__createLocal(), withoutSuffix);
    }

    // If passed a locale key, it will set the locale for this
    // instance.  Otherwise, it will return the locale configuration
    // variables for this instance.
    function locale (key) {
        var newLocaleData;

        if (key === undefined) {
            return this._locale._abbr;
        } else {
            newLocaleData = locale_locales__getLocale(key);
            if (newLocaleData != null) {
                this._locale = newLocaleData;
            }
            return this;
        }
    }

    var lang = deprecate(
        'moment().lang() is deprecated. Instead, use moment().localeData() to get the language configuration. Use moment().locale() to change languages.',
        function (key) {
            if (key === undefined) {
                return this.localeData();
            } else {
                return this.locale(key);
            }
        }
    );

    function localeData () {
        return this._locale;
    }

    function startOf (units) {
        units = normalizeUnits(units);
        // the following switch intentionally omits break keywords
        // to utilize falling through the cases.
        switch (units) {
            case 'year':
                this.month(0);
                /* falls through */
            case 'quarter':
            case 'month':
                this.date(1);
                /* falls through */
            case 'week':
            case 'isoWeek':
            case 'day':
            case 'date':
                this.hours(0);
                /* falls through */
            case 'hour':
                this.minutes(0);
                /* falls through */
            case 'minute':
                this.seconds(0);
                /* falls through */
            case 'second':
                this.milliseconds(0);
        }

        // weeks are a special case
        if (units === 'week') {
            this.weekday(0);
        }
        if (units === 'isoWeek') {
            this.isoWeekday(1);
        }

        // quarters are also special
        if (units === 'quarter') {
            this.month(Math.floor(this.month() / 3) * 3);
        }

        return this;
    }

    function endOf (units) {
        units = normalizeUnits(units);
        if (units === undefined || units === 'millisecond') {
            return this;
        }

        // 'date' is an alias for 'day', so it should be considered as such.
        if (units === 'date') {
            units = 'day';
        }

        return this.startOf(units).add(1, (units === 'isoWeek' ? 'week' : units)).subtract(1, 'ms');
    }

    function to_type__valueOf () {
        return this._d.valueOf() - ((this._offset || 0) * 60000);
    }

    function unix () {
        return Math.floor(this.valueOf() / 1000);
    }

    function toDate () {
        return new Date(this.valueOf());
    }

    function toArray () {
        var m = this;
        return [m.year(), m.month(), m.date(), m.hour(), m.minute(), m.second(), m.millisecond()];
    }

    function toObject () {
        var m = this;
        return {
            years: m.year(),
            months: m.month(),
            date: m.date(),
            hours: m.hours(),
            minutes: m.minutes(),
            seconds: m.seconds(),
            milliseconds: m.milliseconds()
        };
    }

    function toJSON () {
        // new Date(NaN).toJSON() === null
        return this.isValid() ? this.toISOString() : null;
    }

    function moment_valid__isValid () {
        return valid__isValid(this);
    }

    function parsingFlags () {
        return extend({}, getParsingFlags(this));
    }

    function invalidAt () {
        return getParsingFlags(this).overflow;
    }

    function creationData() {
        return {
            input: this._i,
            format: this._f,
            locale: this._locale,
            isUTC: this._isUTC,
            strict: this._strict
        };
    }

    // FORMATTING

    addFormatToken(0, ['gg', 2], 0, function () {
        return this.weekYear() % 100;
    });

    addFormatToken(0, ['GG', 2], 0, function () {
        return this.isoWeekYear() % 100;
    });

    function addWeekYearFormatToken (token, getter) {
        addFormatToken(0, [token, token.length], 0, getter);
    }

    addWeekYearFormatToken('gggg',     'weekYear');
    addWeekYearFormatToken('ggggg',    'weekYear');
    addWeekYearFormatToken('GGGG',  'isoWeekYear');
    addWeekYearFormatToken('GGGGG', 'isoWeekYear');

    // ALIASES

    addUnitAlias('weekYear', 'gg');
    addUnitAlias('isoWeekYear', 'GG');

    // PRIORITY

    addUnitPriority('weekYear', 1);
    addUnitPriority('isoWeekYear', 1);


    // PARSING

    addRegexToken('G',      matchSigned);
    addRegexToken('g',      matchSigned);
    addRegexToken('GG',     match1to2, match2);
    addRegexToken('gg',     match1to2, match2);
    addRegexToken('GGGG',   match1to4, match4);
    addRegexToken('gggg',   match1to4, match4);
    addRegexToken('GGGGG',  match1to6, match6);
    addRegexToken('ggggg',  match1to6, match6);

    addWeekParseToken(['gggg', 'ggggg', 'GGGG', 'GGGGG'], function (input, week, config, token) {
        week[token.substr(0, 2)] = toInt(input);
    });

    addWeekParseToken(['gg', 'GG'], function (input, week, config, token) {
        week[token] = utils_hooks__hooks.parseTwoDigitYear(input);
    });

    // MOMENTS

    function getSetWeekYear (input) {
        return getSetWeekYearHelper.call(this,
                input,
                this.week(),
                this.weekday(),
                this.localeData()._week.dow,
                this.localeData()._week.doy);
    }

    function getSetISOWeekYear (input) {
        return getSetWeekYearHelper.call(this,
                input, this.isoWeek(), this.isoWeekday(), 1, 4);
    }

    function getISOWeeksInYear () {
        return weeksInYear(this.year(), 1, 4);
    }

    function getWeeksInYear () {
        var weekInfo = this.localeData()._week;
        return weeksInYear(this.year(), weekInfo.dow, weekInfo.doy);
    }

    function getSetWeekYearHelper(input, week, weekday, dow, doy) {
        var weeksTarget;
        if (input == null) {
            return weekOfYear(this, dow, doy).year;
        } else {
            weeksTarget = weeksInYear(input, dow, doy);
            if (week > weeksTarget) {
                week = weeksTarget;
            }
            return setWeekAll.call(this, input, week, weekday, dow, doy);
        }
    }

    function setWeekAll(weekYear, week, weekday, dow, doy) {
        var dayOfYearData = dayOfYearFromWeeks(weekYear, week, weekday, dow, doy),
            date = createUTCDate(dayOfYearData.year, 0, dayOfYearData.dayOfYear);

        this.year(date.getUTCFullYear());
        this.month(date.getUTCMonth());
        this.date(date.getUTCDate());
        return this;
    }

    // FORMATTING

    addFormatToken('Q', 0, 'Qo', 'quarter');

    // ALIASES

    addUnitAlias('quarter', 'Q');

    // PRIORITY

    addUnitPriority('quarter', 7);

    // PARSING

    addRegexToken('Q', match1);
    addParseToken('Q', function (input, array) {
        array[MONTH] = (toInt(input) - 1) * 3;
    });

    // MOMENTS

    function getSetQuarter (input) {
        return input == null ? Math.ceil((this.month() + 1) / 3) : this.month((input - 1) * 3 + this.month() % 3);
    }

    // FORMATTING

    addFormatToken('D', ['DD', 2], 'Do', 'date');

    // ALIASES

    addUnitAlias('date', 'D');

    // PRIOROITY
    addUnitPriority('date', 9);

    // PARSING

    addRegexToken('D',  match1to2);
    addRegexToken('DD', match1to2, match2);
    addRegexToken('Do', function (isStrict, locale) {
        return isStrict ? locale._ordinalParse : locale._ordinalParseLenient;
    });

    addParseToken(['D', 'DD'], DATE);
    addParseToken('Do', function (input, array) {
        array[DATE] = toInt(input.match(match1to2)[0], 10);
    });

    // MOMENTS

    var getSetDayOfMonth = makeGetSet('Date', true);

    // FORMATTING

    addFormatToken('DDD', ['DDDD', 3], 'DDDo', 'dayOfYear');

    // ALIASES

    addUnitAlias('dayOfYear', 'DDD');

    // PRIORITY
    addUnitPriority('dayOfYear', 4);

    // PARSING

    addRegexToken('DDD',  match1to3);
    addRegexToken('DDDD', match3);
    addParseToken(['DDD', 'DDDD'], function (input, array, config) {
        config._dayOfYear = toInt(input);
    });

    // HELPERS

    // MOMENTS

    function getSetDayOfYear (input) {
        var dayOfYear = Math.round((this.clone().startOf('day') - this.clone().startOf('year')) / 864e5) + 1;
        return input == null ? dayOfYear : this.add((input - dayOfYear), 'd');
    }

    // FORMATTING

    addFormatToken('m', ['mm', 2], 0, 'minute');

    // ALIASES

    addUnitAlias('minute', 'm');

    // PRIORITY

    addUnitPriority('minute', 14);

    // PARSING

    addRegexToken('m',  match1to2);
    addRegexToken('mm', match1to2, match2);
    addParseToken(['m', 'mm'], MINUTE);

    // MOMENTS

    var getSetMinute = makeGetSet('Minutes', false);

    // FORMATTING

    addFormatToken('s', ['ss', 2], 0, 'second');

    // ALIASES

    addUnitAlias('second', 's');

    // PRIORITY

    addUnitPriority('second', 15);

    // PARSING

    addRegexToken('s',  match1to2);
    addRegexToken('ss', match1to2, match2);
    addParseToken(['s', 'ss'], SECOND);

    // MOMENTS

    var getSetSecond = makeGetSet('Seconds', false);

    // FORMATTING

    addFormatToken('S', 0, 0, function () {
        return ~~(this.millisecond() / 100);
    });

    addFormatToken(0, ['SS', 2], 0, function () {
        return ~~(this.millisecond() / 10);
    });

    addFormatToken(0, ['SSS', 3], 0, 'millisecond');
    addFormatToken(0, ['SSSS', 4], 0, function () {
        return this.millisecond() * 10;
    });
    addFormatToken(0, ['SSSSS', 5], 0, function () {
        return this.millisecond() * 100;
    });
    addFormatToken(0, ['SSSSSS', 6], 0, function () {
        return this.millisecond() * 1000;
    });
    addFormatToken(0, ['SSSSSSS', 7], 0, function () {
        return this.millisecond() * 10000;
    });
    addFormatToken(0, ['SSSSSSSS', 8], 0, function () {
        return this.millisecond() * 100000;
    });
    addFormatToken(0, ['SSSSSSSSS', 9], 0, function () {
        return this.millisecond() * 1000000;
    });


    // ALIASES

    addUnitAlias('millisecond', 'ms');

    // PRIORITY

    addUnitPriority('millisecond', 16);

    // PARSING

    addRegexToken('S',    match1to3, match1);
    addRegexToken('SS',   match1to3, match2);
    addRegexToken('SSS',  match1to3, match3);

    var token;
    for (token = 'SSSS'; token.length <= 9; token += 'S') {
        addRegexToken(token, matchUnsigned);
    }

    function parseMs(input, array) {
        array[MILLISECOND] = toInt(('0.' + input) * 1000);
    }

    for (token = 'S'; token.length <= 9; token += 'S') {
        addParseToken(token, parseMs);
    }
    // MOMENTS

    var getSetMillisecond = makeGetSet('Milliseconds', false);

    // FORMATTING

    addFormatToken('z',  0, 0, 'zoneAbbr');
    addFormatToken('zz', 0, 0, 'zoneName');

    // MOMENTS

    function getZoneAbbr () {
        return this._isUTC ? 'UTC' : '';
    }

    function getZoneName () {
        return this._isUTC ? 'Coordinated Universal Time' : '';
    }

    var momentPrototype__proto = Moment.prototype;

    momentPrototype__proto.add               = add_subtract__add;
    momentPrototype__proto.calendar          = moment_calendar__calendar;
    momentPrototype__proto.clone             = clone;
    momentPrototype__proto.diff              = diff;
    momentPrototype__proto.endOf             = endOf;
    momentPrototype__proto.format            = format;
    momentPrototype__proto.from              = from;
    momentPrototype__proto.fromNow           = fromNow;
    momentPrototype__proto.to                = to;
    momentPrototype__proto.toNow             = toNow;
    momentPrototype__proto.get               = stringGet;
    momentPrototype__proto.invalidAt         = invalidAt;
    momentPrototype__proto.isAfter           = isAfter;
    momentPrototype__proto.isBefore          = isBefore;
    momentPrototype__proto.isBetween         = isBetween;
    momentPrototype__proto.isSame            = isSame;
    momentPrototype__proto.isSameOrAfter     = isSameOrAfter;
    momentPrototype__proto.isSameOrBefore    = isSameOrBefore;
    momentPrototype__proto.isValid           = moment_valid__isValid;
    momentPrototype__proto.lang              = lang;
    momentPrototype__proto.locale            = locale;
    momentPrototype__proto.localeData        = localeData;
    momentPrototype__proto.max               = prototypeMax;
    momentPrototype__proto.min               = prototypeMin;
    momentPrototype__proto.parsingFlags      = parsingFlags;
    momentPrototype__proto.set               = stringSet;
    momentPrototype__proto.startOf           = startOf;
    momentPrototype__proto.subtract          = add_subtract__subtract;
    momentPrototype__proto.toArray           = toArray;
    momentPrototype__proto.toObject          = toObject;
    momentPrototype__proto.toDate            = toDate;
    momentPrototype__proto.toISOString       = moment_format__toISOString;
    momentPrototype__proto.toJSON            = toJSON;
    momentPrototype__proto.toString          = toString;
    momentPrototype__proto.unix              = unix;
    momentPrototype__proto.valueOf           = to_type__valueOf;
    momentPrototype__proto.creationData      = creationData;

    // Year
    momentPrototype__proto.year       = getSetYear;
    momentPrototype__proto.isLeapYear = getIsLeapYear;

    // Week Year
    momentPrototype__proto.weekYear    = getSetWeekYear;
    momentPrototype__proto.isoWeekYear = getSetISOWeekYear;

    // Quarter
    momentPrototype__proto.quarter = momentPrototype__proto.quarters = getSetQuarter;

    // Month
    momentPrototype__proto.month       = getSetMonth;
    momentPrototype__proto.daysInMonth = getDaysInMonth;

    // Week
    momentPrototype__proto.week           = momentPrototype__proto.weeks        = getSetWeek;
    momentPrototype__proto.isoWeek        = momentPrototype__proto.isoWeeks     = getSetISOWeek;
    momentPrototype__proto.weeksInYear    = getWeeksInYear;
    momentPrototype__proto.isoWeeksInYear = getISOWeeksInYear;

    // Day
    momentPrototype__proto.date       = getSetDayOfMonth;
    momentPrototype__proto.day        = momentPrototype__proto.days             = getSetDayOfWeek;
    momentPrototype__proto.weekday    = getSetLocaleDayOfWeek;
    momentPrototype__proto.isoWeekday = getSetISODayOfWeek;
    momentPrototype__proto.dayOfYear  = getSetDayOfYear;

    // Hour
    momentPrototype__proto.hour = momentPrototype__proto.hours = getSetHour;

    // Minute
    momentPrototype__proto.minute = momentPrototype__proto.minutes = getSetMinute;

    // Second
    momentPrototype__proto.second = momentPrototype__proto.seconds = getSetSecond;

    // Millisecond
    momentPrototype__proto.millisecond = momentPrototype__proto.milliseconds = getSetMillisecond;

    // Offset
    momentPrototype__proto.utcOffset            = getSetOffset;
    momentPrototype__proto.utc                  = setOffsetToUTC;
    momentPrototype__proto.local                = setOffsetToLocal;
    momentPrototype__proto.parseZone            = setOffsetToParsedOffset;
    momentPrototype__proto.hasAlignedHourOffset = hasAlignedHourOffset;
    momentPrototype__proto.isDST                = isDaylightSavingTime;
    momentPrototype__proto.isLocal              = isLocal;
    momentPrototype__proto.isUtcOffset          = isUtcOffset;
    momentPrototype__proto.isUtc                = isUtc;
    momentPrototype__proto.isUTC                = isUtc;

    // Timezone
    momentPrototype__proto.zoneAbbr = getZoneAbbr;
    momentPrototype__proto.zoneName = getZoneName;

    // Deprecations
    momentPrototype__proto.dates  = deprecate('dates accessor is deprecated. Use date instead.', getSetDayOfMonth);
    momentPrototype__proto.months = deprecate('months accessor is deprecated. Use month instead', getSetMonth);
    momentPrototype__proto.years  = deprecate('years accessor is deprecated. Use year instead', getSetYear);
    momentPrototype__proto.zone   = deprecate('moment().zone is deprecated, use moment().utcOffset instead. http://momentjs.com/guides/#/warnings/zone/', getSetZone);
    momentPrototype__proto.isDSTShifted = deprecate('isDSTShifted is deprecated. See http://momentjs.com/guides/#/warnings/dst-shifted/ for more information', isDaylightSavingTimeShifted);

    var momentPrototype = momentPrototype__proto;

    function moment__createUnix (input) {
        return local__createLocal(input * 1000);
    }

    function moment__createInZone () {
        return local__createLocal.apply(null, arguments).parseZone();
    }

    function preParsePostFormat (string) {
        return string;
    }

    var prototype__proto = Locale.prototype;

    prototype__proto.calendar        = locale_calendar__calendar;
    prototype__proto.longDateFormat  = longDateFormat;
    prototype__proto.invalidDate     = invalidDate;
    prototype__proto.ordinal         = ordinal;
    prototype__proto.preparse        = preParsePostFormat;
    prototype__proto.postformat      = preParsePostFormat;
    prototype__proto.relativeTime    = relative__relativeTime;
    prototype__proto.pastFuture      = pastFuture;
    prototype__proto.set             = locale_set__set;

    // Month
    prototype__proto.months            =        localeMonths;
    prototype__proto.monthsShort       =        localeMonthsShort;
    prototype__proto.monthsParse       =        localeMonthsParse;
    prototype__proto.monthsRegex       = monthsRegex;
    prototype__proto.monthsShortRegex  = monthsShortRegex;

    // Week
    prototype__proto.week = localeWeek;
    prototype__proto.firstDayOfYear = localeFirstDayOfYear;
    prototype__proto.firstDayOfWeek = localeFirstDayOfWeek;

    // Day of Week
    prototype__proto.weekdays       =        localeWeekdays;
    prototype__proto.weekdaysMin    =        localeWeekdaysMin;
    prototype__proto.weekdaysShort  =        localeWeekdaysShort;
    prototype__proto.weekdaysParse  =        localeWeekdaysParse;

    prototype__proto.weekdaysRegex       =        weekdaysRegex;
    prototype__proto.weekdaysShortRegex  =        weekdaysShortRegex;
    prototype__proto.weekdaysMinRegex    =        weekdaysMinRegex;

    // Hours
    prototype__proto.isPM = localeIsPM;
    prototype__proto.meridiem = localeMeridiem;

    function lists__get (format, index, field, setter) {
        var locale = locale_locales__getLocale();
        var utc = create_utc__createUTC().set(setter, index);
        return locale[field](utc, format);
    }

    function listMonthsImpl (format, index, field) {
        if (typeof format === 'number') {
            index = format;
            format = undefined;
        }

        format = format || '';

        if (index != null) {
            return lists__get(format, index, field, 'month');
        }

        var i;
        var out = [];
        for (i = 0; i < 12; i++) {
            out[i] = lists__get(format, i, field, 'month');
        }
        return out;
    }

    // ()
    // (5)
    // (fmt, 5)
    // (fmt)
    // (true)
    // (true, 5)
    // (true, fmt, 5)
    // (true, fmt)
    function listWeekdaysImpl (localeSorted, format, index, field) {
        if (typeof localeSorted === 'boolean') {
            if (typeof format === 'number') {
                index = format;
                format = undefined;
            }

            format = format || '';
        } else {
            format = localeSorted;
            index = format;
            localeSorted = false;

            if (typeof format === 'number') {
                index = format;
                format = undefined;
            }

            format = format || '';
        }

        var locale = locale_locales__getLocale(),
            shift = localeSorted ? locale._week.dow : 0;

        if (index != null) {
            return lists__get(format, (index + shift) % 7, field, 'day');
        }

        var i;
        var out = [];
        for (i = 0; i < 7; i++) {
            out[i] = lists__get(format, (i + shift) % 7, field, 'day');
        }
        return out;
    }

    function lists__listMonths (format, index) {
        return listMonthsImpl(format, index, 'months');
    }

    function lists__listMonthsShort (format, index) {
        return listMonthsImpl(format, index, 'monthsShort');
    }

    function lists__listWeekdays (localeSorted, format, index) {
        return listWeekdaysImpl(localeSorted, format, index, 'weekdays');
    }

    function lists__listWeekdaysShort (localeSorted, format, index) {
        return listWeekdaysImpl(localeSorted, format, index, 'weekdaysShort');
    }

    function lists__listWeekdaysMin (localeSorted, format, index) {
        return listWeekdaysImpl(localeSorted, format, index, 'weekdaysMin');
    }

    locale_locales__getSetGlobalLocale('en', {
        ordinalParse: /\d{1,2}(th|st|nd|rd)/,
        ordinal : function (number) {
            var b = number % 10,
                output = (toInt(number % 100 / 10) === 1) ? 'th' :
                (b === 1) ? 'st' :
                (b === 2) ? 'nd' :
                (b === 3) ? 'rd' : 'th';
            return number + output;
        }
    });

    // Side effect imports
    utils_hooks__hooks.lang = deprecate('moment.lang is deprecated. Use moment.locale instead.', locale_locales__getSetGlobalLocale);
    utils_hooks__hooks.langData = deprecate('moment.langData is deprecated. Use moment.localeData instead.', locale_locales__getLocale);

    var mathAbs = Math.abs;

    function duration_abs__abs () {
        var data           = this._data;

        this._milliseconds = mathAbs(this._milliseconds);
        this._days         = mathAbs(this._days);
        this._months       = mathAbs(this._months);

        data.milliseconds  = mathAbs(data.milliseconds);
        data.seconds       = mathAbs(data.seconds);
        data.minutes       = mathAbs(data.minutes);
        data.hours         = mathAbs(data.hours);
        data.months        = mathAbs(data.months);
        data.years         = mathAbs(data.years);

        return this;
    }

    function duration_add_subtract__addSubtract (duration, input, value, direction) {
        var other = create__createDuration(input, value);

        duration._milliseconds += direction * other._milliseconds;
        duration._days         += direction * other._days;
        duration._months       += direction * other._months;

        return duration._bubble();
    }

    // supports only 2.0-style add(1, 's') or add(duration)
    function duration_add_subtract__add (input, value) {
        return duration_add_subtract__addSubtract(this, input, value, 1);
    }

    // supports only 2.0-style subtract(1, 's') or subtract(duration)
    function duration_add_subtract__subtract (input, value) {
        return duration_add_subtract__addSubtract(this, input, value, -1);
    }

    function absCeil (number) {
        if (number < 0) {
            return Math.floor(number);
        } else {
            return Math.ceil(number);
        }
    }

    function bubble () {
        var milliseconds = this._milliseconds;
        var days         = this._days;
        var months       = this._months;
        var data         = this._data;
        var seconds, minutes, hours, years, monthsFromDays;

        // if we have a mix of positive and negative values, bubble down first
        // check: https://github.com/moment/moment/issues/2166
        if (!((milliseconds >= 0 && days >= 0 && months >= 0) ||
                (milliseconds <= 0 && days <= 0 && months <= 0))) {
            milliseconds += absCeil(monthsToDays(months) + days) * 864e5;
            days = 0;
            months = 0;
        }

        // The following code bubbles up values, see the tests for
        // examples of what that means.
        data.milliseconds = milliseconds % 1000;

        seconds           = absFloor(milliseconds / 1000);
        data.seconds      = seconds % 60;

        minutes           = absFloor(seconds / 60);
        data.minutes      = minutes % 60;

        hours             = absFloor(minutes / 60);
        data.hours        = hours % 24;

        days += absFloor(hours / 24);

        // convert days to months
        monthsFromDays = absFloor(daysToMonths(days));
        months += monthsFromDays;
        days -= absCeil(monthsToDays(monthsFromDays));

        // 12 months -> 1 year
        years = absFloor(months / 12);
        months %= 12;

        data.days   = days;
        data.months = months;
        data.years  = years;

        return this;
    }

    function daysToMonths (days) {
        // 400 years have 146097 days (taking into account leap year rules)
        // 400 years have 12 months === 4800
        return days * 4800 / 146097;
    }

    function monthsToDays (months) {
        // the reverse of daysToMonths
        return months * 146097 / 4800;
    }

    function as (units) {
        var days;
        var months;
        var milliseconds = this._milliseconds;

        units = normalizeUnits(units);

        if (units === 'month' || units === 'year') {
            days   = this._days   + milliseconds / 864e5;
            months = this._months + daysToMonths(days);
            return units === 'month' ? months : months / 12;
        } else {
            // handle milliseconds separately because of floating point math errors (issue #1867)
            days = this._days + Math.round(monthsToDays(this._months));
            switch (units) {
                case 'week'   : return days / 7     + milliseconds / 6048e5;
                case 'day'    : return days         + milliseconds / 864e5;
                case 'hour'   : return days * 24    + milliseconds / 36e5;
                case 'minute' : return days * 1440  + milliseconds / 6e4;
                case 'second' : return days * 86400 + milliseconds / 1000;
                // Math.floor prevents floating point math errors here
                case 'millisecond': return Math.floor(days * 864e5) + milliseconds;
                default: throw new Error('Unknown unit ' + units);
            }
        }
    }

    // TODO: Use this.as('ms')?
    function duration_as__valueOf () {
        return (
            this._milliseconds +
            this._days * 864e5 +
            (this._months % 12) * 2592e6 +
            toInt(this._months / 12) * 31536e6
        );
    }

    function makeAs (alias) {
        return function () {
            return this.as(alias);
        };
    }

    var asMilliseconds = makeAs('ms');
    var asSeconds      = makeAs('s');
    var asMinutes      = makeAs('m');
    var asHours        = makeAs('h');
    var asDays         = makeAs('d');
    var asWeeks        = makeAs('w');
    var asMonths       = makeAs('M');
    var asYears        = makeAs('y');

    function duration_get__get (units) {
        units = normalizeUnits(units);
        return this[units + 's']();
    }

    function makeGetter(name) {
        return function () {
            return this._data[name];
        };
    }

    var milliseconds = makeGetter('milliseconds');
    var seconds      = makeGetter('seconds');
    var minutes      = makeGetter('minutes');
    var hours        = makeGetter('hours');
    var days         = makeGetter('days');
    var months       = makeGetter('months');
    var years        = makeGetter('years');

    function weeks () {
        return absFloor(this.days() / 7);
    }

    var round = Math.round;
    var thresholds = {
        s: 45,  // seconds to minute
        m: 45,  // minutes to hour
        h: 22,  // hours to day
        d: 26,  // days to month
        M: 11   // months to year
    };

    // helper function for moment.fn.from, moment.fn.fromNow, and moment.duration.fn.humanize
    function substituteTimeAgo(string, number, withoutSuffix, isFuture, locale) {
        return locale.relativeTime(number || 1, !!withoutSuffix, string, isFuture);
    }

    function duration_humanize__relativeTime (posNegDuration, withoutSuffix, locale) {
        var duration = create__createDuration(posNegDuration).abs();
        var seconds  = round(duration.as('s'));
        var minutes  = round(duration.as('m'));
        var hours    = round(duration.as('h'));
        var days     = round(duration.as('d'));
        var months   = round(duration.as('M'));
        var years    = round(duration.as('y'));

        var a = seconds < thresholds.s && ['s', seconds]  ||
                minutes <= 1           && ['m']           ||
                minutes < thresholds.m && ['mm', minutes] ||
                hours   <= 1           && ['h']           ||
                hours   < thresholds.h && ['hh', hours]   ||
                days    <= 1           && ['d']           ||
                days    < thresholds.d && ['dd', days]    ||
                months  <= 1           && ['M']           ||
                months  < thresholds.M && ['MM', months]  ||
                years   <= 1           && ['y']           || ['yy', years];

        a[2] = withoutSuffix;
        a[3] = +posNegDuration > 0;
        a[4] = locale;
        return substituteTimeAgo.apply(null, a);
    }

    // This function allows you to set the rounding function for relative time strings
    function duration_humanize__getSetRelativeTimeRounding (roundingFunction) {
        if (roundingFunction === undefined) {
            return round;
        }
        if (typeof(roundingFunction) === 'function') {
            round = roundingFunction;
            return true;
        }
        return false;
    }

    // This function allows you to set a threshold for relative time strings
    function duration_humanize__getSetRelativeTimeThreshold (threshold, limit) {
        if (thresholds[threshold] === undefined) {
            return false;
        }
        if (limit === undefined) {
            return thresholds[threshold];
        }
        thresholds[threshold] = limit;
        return true;
    }

    function humanize (withSuffix) {
        var locale = this.localeData();
        var output = duration_humanize__relativeTime(this, !withSuffix, locale);

        if (withSuffix) {
            output = locale.pastFuture(+this, output);
        }

        return locale.postformat(output);
    }

    var iso_string__abs = Math.abs;

    function iso_string__toISOString() {
        // for ISO strings we do not use the normal bubbling rules:
        //  * milliseconds bubble up until they become hours
        //  * days do not bubble at all
        //  * months bubble up until they become years
        // This is because there is no context-free conversion between hours and days
        // (think of clock changes)
        // and also not between days and months (28-31 days per month)
        var seconds = iso_string__abs(this._milliseconds) / 1000;
        var days         = iso_string__abs(this._days);
        var months       = iso_string__abs(this._months);
        var minutes, hours, years;

        // 3600 seconds -> 60 minutes -> 1 hour
        minutes           = absFloor(seconds / 60);
        hours             = absFloor(minutes / 60);
        seconds %= 60;
        minutes %= 60;

        // 12 months -> 1 year
        years  = absFloor(months / 12);
        months %= 12;


        // inspired by https://github.com/dordille/moment-isoduration/blob/master/moment.isoduration.js
        var Y = years;
        var M = months;
        var D = days;
        var h = hours;
        var m = minutes;
        var s = seconds;
        var total = this.asSeconds();

        if (!total) {
            // this is the same as C#'s (Noda) and python (isodate)...
            // but not other JS (goog.date)
            return 'P0D';
        }

        return (total < 0 ? '-' : '') +
            'P' +
            (Y ? Y + 'Y' : '') +
            (M ? M + 'M' : '') +
            (D ? D + 'D' : '') +
            ((h || m || s) ? 'T' : '') +
            (h ? h + 'H' : '') +
            (m ? m + 'M' : '') +
            (s ? s + 'S' : '');
    }

    var duration_prototype__proto = Duration.prototype;

    duration_prototype__proto.abs            = duration_abs__abs;
    duration_prototype__proto.add            = duration_add_subtract__add;
    duration_prototype__proto.subtract       = duration_add_subtract__subtract;
    duration_prototype__proto.as             = as;
    duration_prototype__proto.asMilliseconds = asMilliseconds;
    duration_prototype__proto.asSeconds      = asSeconds;
    duration_prototype__proto.asMinutes      = asMinutes;
    duration_prototype__proto.asHours        = asHours;
    duration_prototype__proto.asDays         = asDays;
    duration_prototype__proto.asWeeks        = asWeeks;
    duration_prototype__proto.asMonths       = asMonths;
    duration_prototype__proto.asYears        = asYears;
    duration_prototype__proto.valueOf        = duration_as__valueOf;
    duration_prototype__proto._bubble        = bubble;
    duration_prototype__proto.get            = duration_get__get;
    duration_prototype__proto.milliseconds   = milliseconds;
    duration_prototype__proto.seconds        = seconds;
    duration_prototype__proto.minutes        = minutes;
    duration_prototype__proto.hours          = hours;
    duration_prototype__proto.days           = days;
    duration_prototype__proto.weeks          = weeks;
    duration_prototype__proto.months         = months;
    duration_prototype__proto.years          = years;
    duration_prototype__proto.humanize       = humanize;
    duration_prototype__proto.toISOString    = iso_string__toISOString;
    duration_prototype__proto.toString       = iso_string__toISOString;
    duration_prototype__proto.toJSON         = iso_string__toISOString;
    duration_prototype__proto.locale         = locale;
    duration_prototype__proto.localeData     = localeData;

    // Deprecations
    duration_prototype__proto.toIsoString = deprecate('toIsoString() is deprecated. Please use toISOString() instead (notice the capitals)', iso_string__toISOString);
    duration_prototype__proto.lang = lang;

    // Side effect imports

    // FORMATTING

    addFormatToken('X', 0, 0, 'unix');
    addFormatToken('x', 0, 0, 'valueOf');

    // PARSING

    addRegexToken('x', matchSigned);
    addRegexToken('X', matchTimestamp);
    addParseToken('X', function (input, array, config) {
        config._d = new Date(parseFloat(input, 10) * 1000);
    });
    addParseToken('x', function (input, array, config) {
        config._d = new Date(toInt(input));
    });

    // Side effect imports


    utils_hooks__hooks.version = '2.14.1';

    setHookCallback(local__createLocal);

    utils_hooks__hooks.fn                    = momentPrototype;
    utils_hooks__hooks.min                   = min;
    utils_hooks__hooks.max                   = max;
    utils_hooks__hooks.now                   = now;
    utils_hooks__hooks.utc                   = create_utc__createUTC;
    utils_hooks__hooks.unix                  = moment__createUnix;
    utils_hooks__hooks.months                = lists__listMonths;
    utils_hooks__hooks.isDate                = isDate;
    utils_hooks__hooks.locale                = locale_locales__getSetGlobalLocale;
    utils_hooks__hooks.invalid               = valid__createInvalid;
    utils_hooks__hooks.duration              = create__createDuration;
    utils_hooks__hooks.isMoment              = isMoment;
    utils_hooks__hooks.weekdays              = lists__listWeekdays;
    utils_hooks__hooks.parseZone             = moment__createInZone;
    utils_hooks__hooks.localeData            = locale_locales__getLocale;
    utils_hooks__hooks.isDuration            = isDuration;
    utils_hooks__hooks.monthsShort           = lists__listMonthsShort;
    utils_hooks__hooks.weekdaysMin           = lists__listWeekdaysMin;
    utils_hooks__hooks.defineLocale          = defineLocale;
    utils_hooks__hooks.updateLocale          = updateLocale;
    utils_hooks__hooks.locales               = locale_locales__listLocales;
    utils_hooks__hooks.weekdaysShort         = lists__listWeekdaysShort;
    utils_hooks__hooks.normalizeUnits        = normalizeUnits;
    utils_hooks__hooks.relativeTimeRounding = duration_humanize__getSetRelativeTimeRounding;
    utils_hooks__hooks.relativeTimeThreshold = duration_humanize__getSetRelativeTimeThreshold;
    utils_hooks__hooks.calendarFormat        = getCalendarFormat;
    utils_hooks__hooks.prototype             = momentPrototype;

    var _moment = utils_hooks__hooks;

    return _moment;

}));
},{}],17:[function(require,module,exports){

var predicates = {};
module.exports = predicates;

function getValue (obj, index) {
    if (index == null || index == undefined) return obj;

    else if (obj && obj.constructor === Array) {
        if (obj.length > index && index > -1)
            return obj[index];
        else
            return null;
    } else 
        return obj;
}

function getCriteriaData(criteria) {
    var o = '=';
    var v = criteria;

    if (typeof(c) === 'string') {
        if (criteria.startsWith('>=')) {
            o = '>=';
            v = criteria.substring(2);
        } else if (criteria.startsWith('<=')) {
            o = '<=';
            v = criteria.substring(2);
        } else if (criteria.startsWith('<>')) {
            o = '<>';
            v = criteria.substring(2);
        } else if (criteria.startsWith('>')) {
            o = '>';
            v = criteria.substring(1);
        } else if (criteria.startsWith('<')) {
            o = '<';
            v = criteria.substring(1);
        }  else if (criteria.startsWith('=')) {
            v = criteria.substring(1);
        }
    }

    return [o,v];
}

function Criteria (criteria) {

    if (criteria && criteria.constructor === Array) {
        this.operation = [];
        this.value = [];
        
        for (var i = 0; i < criteria.length; i++) {
            var d = getCriteriaData(criteria[i]);
            this.operation.push(d[0]);
            this.value.push(d[1]);
        }

    } else {
        var d = getCriteriaData(criteria);
        this.operation = d[0];
        this.value = d[1];
    }
    
}

Criteria.prototype.check = function (value, row) {

    var val = getValue(this.value, row);
    var op = getValue(this.operation, row);

    if (op == '=') 
        return val == value || (typeof(val) === 'boolean' && typeof(value) !== 'boolean');
    else if (op == '<>')
        return val !== value;
    else if (op == '<')
        return val < value;
    else if (op == '>')
        return val > value;
    else if (op == '>=')
        return val >= value;
    else if (op == '<=')
        return val <= value;
    
}

predicates.Criteria = Criteria;

predicates.checkCriteria = function (criteria) {
    var criteria = new Criteria(criteria);
    return function (value, row) {
        return criteria.check(value, row)
    }
}
},{}],18:[function(require,module,exports){
(function (process){
/* parser generated by jison 0.4.17 */
/*
  Returns a Parser object of the following structure:

  Parser: {
    yy: {}
  }

  Parser.prototype: {
    yy: {},
    trace: function(),
    symbols_: {associative list: name ==> number},
    terminals_: {associative list: number ==> name},
    productions_: [...],
    performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate, $$, _$),
    table: [...],
    defaultActions: {...},
    parseError: function(str, hash),
    parse: function(input),

    lexer: {
        EOF: 1,
        parseError: function(str, hash),
        setInput: function(input),
        input: function(),
        unput: function(str),
        more: function(),
        less: function(n),
        pastInput: function(),
        upcomingInput: function(),
        showPosition: function(),
        test_match: function(regex_match_array, rule_index),
        next: function(),
        lex: function(),
        begin: function(condition),
        popState: function(),
        _currentRules: function(),
        topState: function(),
        pushState: function(condition),

        options: {
            ranges: boolean           (optional: true ==> token location info will include a .range[] member)
            flex: boolean             (optional: true ==> flex-like lexing behaviour where the rules are tested exhaustively to find the longest match)
            backtrack_lexer: boolean  (optional: true ==> lexer regexes are tested in order and for each matching regex the action code is invoked; the lexer terminates the scan when a token is returned by the action code)
        },

        performAction: function(yy, yy_, $avoiding_name_collisions, YY_START),
        rules: [...],
        conditions: {associative list: name ==> set},
    }
  }


  token location info (@$, _$, etc.): {
    first_line: n,
    last_line: n,
    first_column: n,
    last_column: n,
    range: [start_number, end_number]       (where the numbers are indexes into the input string, regular zero-based)
  }


  the parseError function receives a 'hash' object with these members for lexer and parser errors: {
    text:        (matched text)
    token:       (the produced terminal token, if any)
    line:        (yylineno)
  }
  while parser (grammar) errors will also provide these members, i.e. parser errors deliver a superset of attributes: {
    loc:         (yylloc)
    expected:    (string describing the set of expected tokens)
    recoverable: (boolean: TRUE when the parser has a error recovery rule available for this particular error)
  }
*/
var rLang = (function(){
var o=function(k,v,o,l){for(o=o||{},l=k.length;l--;o[k[l]]=v);return o},$V0=[1,9],$V1=[1,7],$V2=[1,8],$V3=[1,24],$V4=[1,20],$V5=[1,13],$V6=[1,14],$V7=[1,17],$V8=[1,18],$V9=[5,13,16,48],$Va=[2,13],$Vb=[1,29],$Vc=[1,44],$Vd=[1,33],$Ve=[1,34],$Vf=[1,35],$Vg=[1,36],$Vh=[1,37],$Vi=[1,38],$Vj=[1,39],$Vk=[1,40],$Vl=[1,41],$Vm=[1,42],$Vn=[1,43],$Vo=[1,45],$Vp=[5,6,11,18,21,22,23,24,25,26,27,28,29,30,31,32,34],$Vq=[1,51],$Vr=[1,56],$Vs=[1,55],$Vt=[1,57],$Vu=[1,62],$Vv=[1,69],$Vw=[1,70],$Vx=[1,68],$Vy=[1,71],$Vz=[5,6,11,18,23,24,25,27,28,29,30,31,34],$VA=[18,34],$VB=[2,49],$VC=[11,42],$VD=[1,95],$VE=[11,18,42],$VF=[11,18],$VG=[47,49],$VH=[1,112],$VI=[2,14],$VJ=[5,6,11,18,21,22,23,24,25,27,28,29,30,31,34],$VK=[5,6,11,18,27,28,29,30,31,34],$VL=[1,114];
var parser = {trace: function trace() { },
yy: {},
symbols_: {"error":2,"program":3,"assignList":4,"EOF":5,"=":6,"expression":7,"assignExpression":8,"tableRange":9,"{":10,"}":11,"with":12,"IDENTIFIER":13,"as":14,"variable":15,"context":16,"variableDefList":17,",":18,"variableDef":19,".":20,"*":21,"/":22,"+":23,"&":24,"-":25,"^":26,">":27,"<":28,">=":29,"<=":30,"<>":31,"%":32,"(":33,")":34,"atomExpression":35,"NUMBER":36,"STRING":37,"range":38,"fnParams":39,"arrayExpression":40,"arrayList":41,";":42,"arrayRow":43,"arrayValue":44,"rangePart":45,"!":46,":":47,"[":48,"]":49,"rowNumber":50,"#":51,"$accept":0,"$end":1},
terminals_: {2:"error",5:"EOF",6:"=",10:"{",11:"}",12:"with",13:"IDENTIFIER",14:"as",16:"context",18:",",20:".",21:"*",22:"/",23:"+",24:"&",25:"-",26:"^",27:">",28:"<",29:">=",30:"<=",31:"<>",32:"%",33:"(",34:")",36:"NUMBER",37:"STRING",42:";",46:"!",47:":",48:"[",49:"]",51:"#"},
productions_: [0,[3,2],[3,3],[4,2],[4,1],[8,5],[8,9],[8,5],[8,4],[17,3],[17,1],[19,1],[19,3],[15,1],[15,3],[7,3],[7,3],[7,3],[7,3],[7,3],[7,3],[7,3],[7,3],[7,3],[7,3],[7,3],[7,3],[7,2],[7,2],[7,3],[7,1],[35,1],[35,1],[35,1],[35,1],[35,4],[35,6],[35,1],[35,1],[40,3],[41,3],[41,1],[43,3],[43,1],[44,1],[44,2],[44,1],[39,3],[39,1],[39,0],[38,1],[38,3],[45,3],[9,3],[9,4],[9,5],[9,6],[9,6],[9,8],[9,4],[9,6],[9,7],[9,9],[9,7],[9,9],[50,1],[50,2],[50,2],[50,2]],
performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate /* action[1] */, $$ /* vstack */, _$ /* lstack */) {
/* this == yyval */

var $0 = $$.length - 1;
switch (yystate) {
case 1:
 return exp.CreateFunction($$[$0-1]); 
break;
case 2:
 return exp.CreateFunction( new exp.Program([new exp.AssignExpression(new exp.IdentifierExpression("_R"), $$[$0-1])])); 
break;
case 3:
 if ($$[$0]) $$[$0-1].AddExpression($$[$0]); this.$ = $$[$0-1]; 
break;
case 4:
 this.$ = new exp.Program([ $$[$0] ]); 
break;
case 5: case 7:
 this.$ = new exp.AssignExpression($$[$0-4], $$[$0-1]); 
break;
case 6:
 this.$ = new exp.AssignExpression($$[$0-8], $$[$0-5], $$[$0-2], $$[$0]); 
break;
case 8:
 this.$ = new exp.VariableDefListExpression($$[$0-1]); 
break;
case 9: case 47:
 $$[$0-2].push($$[$0]); this.$ = $$[$0-2]; 
break;
case 10: case 43:
 this.$ = [ $$[$0] ]; 
break;
case 11: case 30: case 31: case 34: case 37: case 41:
 this.$ = $$[$0]; 
break;
case 12:
 this.$ = $$[$0-2] + '.' + $$[$0] 
break;
case 13:
 this.$ = new exp.IdentifierExpression($$[$0]); 
break;
case 14:
 this.$ = new exp.IdentifierExpression($$[$0-2], $$[$0]); 
break;
case 15:
this.$ = new exp.OperatorExpression($$[$0-2], $$[$0], '*');
break;
case 16:
this.$ = new exp.OperatorExpression($$[$0-2], $$[$0], '/');
break;
case 17: case 18:
this.$ = new exp.OperatorExpression($$[$0-2], $$[$0], '+');
break;
case 19:
this.$ = new exp.OperatorExpression($$[$0-2], $$[$0], '-');
break;
case 20:
this.$ = new exp.PowExpression($$[$0-2], $$[$0]); 
break;
case 21:
this.$ = new exp.OperatorExpression($$[$0-2], $$[$0], '>');
break;
case 22:
this.$ = new exp.OperatorExpression($$[$0-2], $$[$0], '<');
break;
case 23:
this.$ = new exp.OperatorExpression($$[$0-2], $$[$0], '>=');
break;
case 24:
this.$ = new exp.OperatorExpression($$[$0-2], $$[$0], '<=');
break;
case 25:
this.$ = new exp.OperatorExpression($$[$0-2], $$[$0], '!=');
break;
case 26:
this.$ = new exp.OperatorExpression($$[$0-2], $$[$0], '==');
break;
case 27:
this.$ = new exp.NegativeExpression($$[$0]);
break;
case 28:
this.$ = new exp.PercentExpression($$[$0-1]);
break;
case 29:
this.$ = new exp.ParentisisExpression($$[$0-1]);
break;
case 32:
 this.$ = new exp.NumberExpression(yytext); 
break;
case 33:
 this.$ = new exp.StringExpression(yytext); 
break;
case 35:
this.$ = new exp.FunctionCallExpression($$[$0-3], $$[$0-1]);
break;
case 36:
this.$ = new exp.FunctionCallExpression($$[$0-5] + '_' + $$[$0-3], $$[$0-1]);
break;
case 38:
 
      this.$ = $$[$0];
      /*var signature = $$[$0].getSignature()[0];
      if (signature.indexOf('.') > 0) {
        signature = signature.split('.')[0];
      }

      if (variables.indexOf(signature) >= 0) { 
        this.$ = $$[$0]; 
      } else { 
        this.$ = $$[$0].toTableExpression();
        //console.log($$[$0].getSignature());
      }*/ 
  
break;
case 39:
 this.$ = new exp.ArrayExpression($$[$0-1]); 
break;
case 40:
 this.$ = ($$[$0-2].row) ? [$$[$0-2]] : $$[$0-2]; this.$.push($$[$0]); this.$.mdRange = true; 
break;
case 42:
 $$[$0-2].push($$[$0]); $$[$0-2].row = true; this.$ = $$[$0-2]; 
break;
case 44:
 this.$ = Number(yytext); 
break;
case 45:
 this.$ = Number(yytext) * -1; 
break;
case 46:
 this.$ = yytext; 
break;
case 48:
 this.$ = [ $$[$0] ];
break;
case 49:
 this.$ = []; 
break;
case 50:
 this.$ = $$[$0] 
break;
case 51:
 $$[$0].table = $$[$0-2]; this.$ = $$[$0]; 
break;
case 52:
 this.$ = new exp.RangeExpression(null, $$[$0-2], $$[$0], 0, Number.MAX_VALUE); 
break;
case 53:
 this.$ = new exp.ColumnExpression("table", $$[$0-1]); 
break;
case 54:
 this.$ = new exp.ColumnExpression($$[$0-3], $$[$0-1]); 
break;
case 55:
 this.$ = new exp.ColumnExpression("table", $$[$0-1], $$[$0-3]) 
break;
case 56:
 this.$ = new exp.ColumnExpression($$[$0-5], $$[$0-1], $$[$0-3]); 
break;
case 57:
 this.$ = new exp.CellExpression(null, $$[$0-4], $$[$0-2]); 
break;
case 58:
 this.$ = new exp.RangeExpression(null, $$[$0-6], $$[$0-6], $$[$0-4], $$[$0-2]); 
break;
case 59:
 this.$ = new exp.CellExpression(null, $$[$0-3], $$[$0-1]); 
break;
case 60:
 this.$ = new exp.RangeExpression(null, $$[$0-5], $$[$0-5], $$[$0-3], $$[$0-1]); 
break;
case 61: case 63:
 this.$ = new exp.CellExpression($$[$0-6], $$[$0-4], $$[$0-2]); 
break;
case 62: case 64:
 this.$ = new exp.RangeExpression($$[$0-8], $$[$0-6], $$[$0-6], $$[$0-4], $$[$0-2]); 
break;
case 65:
 this.$ = new exp.RowNumber($$[$0], '+'); 
break;
case 66: case 67:
 this.$ = new exp.RowNumber($$[$0], $$[$0-1]); 
break;
case 68:
 this.$ = new exp.RowNumber($$[$0], '$'); 
break;
}
},
table: [{3:1,4:2,6:[1,3],8:4,9:5,13:$V0,15:6,16:$V1,48:$V2},{1:[3]},{5:[1,10],8:11,9:5,13:$V0,15:6,16:$V1,48:$V2},{7:12,9:16,10:$V3,13:$V4,15:22,25:$V5,33:$V6,35:15,36:$V7,37:$V8,38:19,40:21,45:23,48:$V2},o($V9,[2,4]),{6:[1,25]},{6:[1,26]},{10:[1,27]},{13:[1,28]},{6:$Va,20:[1,31],46:[1,30],48:$Vb},{1:[2,1]},o($V9,[2,3]),{5:[1,32],6:$Vc,21:$Vd,22:$Ve,23:$Vf,24:$Vg,25:$Vh,26:$Vi,27:$Vj,28:$Vk,29:$Vl,30:$Vm,31:$Vn,32:$Vo},{7:46,9:16,10:$V3,13:$V4,15:22,25:$V5,33:$V6,35:15,36:$V7,37:$V8,38:19,40:21,45:23,48:$V2},{7:47,9:16,10:$V3,13:$V4,15:22,25:$V5,33:$V6,35:15,36:$V7,37:$V8,38:19,40:21,45:23,48:$V2},o($Vp,[2,30]),o($Vp,[2,31]),o($Vp,[2,32]),o($Vp,[2,33]),o($Vp,[2,34]),o($Vp,$Va,{20:[1,49],33:[1,48],46:[1,50],47:$Vq,48:$Vb}),o($Vp,[2,37]),o($Vp,[2,38]),o($Vp,[2,50]),{25:$Vr,36:$Vs,37:$Vt,41:52,43:53,44:54},{10:[1,58]},{10:[1,59]},{13:$Vu,17:60,19:61},{20:[1,64],48:[1,65],49:[1,63]},{13:[1,66],23:$Vv,25:$Vw,36:$Vx,50:67,51:$Vy},{13:[1,72]},{13:[1,73]},{1:[2,2]},{7:74,9:16,10:$V3,13:$V4,15:22,25:$V5,33:$V6,35:15,36:$V7,37:$V8,38:19,40:21,45:23,48:$V2},{7:75,9:16,10:$V3,13:$V4,15:22,25:$V5,33:$V6,35:15,36:$V7,37:$V8,38:19,40:21,45:23,48:$V2},{7:76,9:16,10:$V3,13:$V4,15:22,25:$V5,33:$V6,35:15,36:$V7,37:$V8,38:19,40:21,45:23,48:$V2},{7:77,9:16,10:$V3,13:$V4,15:22,25:$V5,33:$V6,35:15,36:$V7,37:$V8,38:19,40:21,45:23,48:$V2},{7:78,9:16,10:$V3,13:$V4,15:22,25:$V5,33:$V6,35:15,36:$V7,37:$V8,38:19,40:21,45:23,48:$V2},{7:79,9:16,10:$V3,13:$V4,15:22,25:$V5,33:$V6,35:15,36:$V7,37:$V8,38:19,40:21,45:23,48:$V2},{7:80,9:16,10:$V3,13:$V4,15:22,25:$V5,33:$V6,35:15,36:$V7,37:$V8,38:19,40:21,45:23,48:$V2},{7:81,9:16,10:$V3,13:$V4,15:22,25:$V5,33:$V6,35:15,36:$V7,37:$V8,38:19,40:21,45:23,48:$V2},{7:82,9:16,10:$V3,13:$V4,15:22,25:$V5,33:$V6,35:15,36:$V7,37:$V8,38:19,40:21,45:23,48:$V2},{7:83,9:16,10:$V3,13:$V4,15:22,25:$V5,33:$V6,35:15,36:$V7,37:$V8,38:19,40:21,45:23,48:$V2},{7:84,9:16,10:$V3,13:$V4,15:22,25:$V5,33:$V6,35:15,36:$V7,37:$V8,38:19,40:21,45:23,48:$V2},{7:85,9:16,10:$V3,13:$V4,15:22,25:$V5,33:$V6,35:15,36:$V7,37:$V8,38:19,40:21,45:23,48:$V2},o($Vp,[2,28]),o($Vz,[2,27],{21:$Vd,22:$Ve,26:$Vi,32:$Vo}),{6:$Vc,21:$Vd,22:$Ve,23:$Vf,24:$Vg,25:$Vh,26:$Vi,27:$Vj,28:$Vk,29:$Vl,30:$Vm,31:$Vn,32:$Vo,34:[1,86]},o($VA,$VB,{35:15,9:16,38:19,40:21,15:22,45:23,39:87,7:88,10:$V3,13:$V4,25:$V5,33:$V6,36:$V7,37:$V8,48:$V2}),{13:[1,89]},{13:[1,90],45:91},{13:[1,92]},{11:[1,93],42:[1,94]},o($VC,[2,41],{18:$VD}),o($VE,[2,43]),o($VE,[2,44]),{36:[1,96]},o($VE,[2,46]),{7:97,9:16,10:$V3,13:$V4,15:22,25:$V5,33:$V6,35:15,36:$V7,37:$V8,38:19,40:21,45:23,48:$V2},{7:98,9:16,10:$V3,13:$V4,15:22,25:$V5,33:$V6,35:15,36:$V7,37:$V8,38:19,40:21,45:23,48:$V2},{11:[1,99],18:[1,100]},o($VF,[2,10]),o($VF,[2,11],{20:[1,101]}),o($Vp,[2,53]),{13:[1,102]},{23:$Vv,25:$Vw,36:$Vx,50:103,51:$Vy},{20:[1,105],48:[1,106],49:[1,104]},{47:[1,108],49:[1,107]},o($VG,[2,65]),{36:[1,109]},{36:[1,110]},{36:[1,111]},{48:$VH},{6:$VI},o($VJ,[2,15],{26:$Vi,32:$Vo}),o($VJ,[2,16],{26:$Vi,32:$Vo}),o($Vz,[2,17],{21:$Vd,22:$Ve,26:$Vi,32:$Vo}),o($Vz,[2,18],{21:$Vd,22:$Ve,26:$Vi,32:$Vo}),o($Vz,[2,19],{21:$Vd,22:$Ve,26:$Vi,32:$Vo}),o([5,6,11,18,21,22,23,24,25,26,27,28,29,30,31,34],[2,20],{32:$Vo}),o($VK,[2,21],{21:$Vd,22:$Ve,23:$Vf,24:$Vg,25:$Vh,26:$Vi,32:$Vo}),o($VK,[2,22],{21:$Vd,22:$Ve,23:$Vf,24:$Vg,25:$Vh,26:$Vi,32:$Vo}),o($VK,[2,23],{21:$Vd,22:$Ve,23:$Vf,24:$Vg,25:$Vh,26:$Vi,32:$Vo}),o($VK,[2,24],{21:$Vd,22:$Ve,23:$Vf,24:$Vg,25:$Vh,26:$Vi,32:$Vo}),o($VK,[2,25],{21:$Vd,22:$Ve,23:$Vf,24:$Vg,25:$Vh,26:$Vi,32:$Vo}),o($VK,[2,26],{21:$Vd,22:$Ve,23:$Vf,24:$Vg,25:$Vh,26:$Vi,32:$Vo}),o($Vp,[2,29]),{18:$VL,34:[1,113]},o($VA,[2,48],{6:$Vc,21:$Vd,22:$Ve,23:$Vf,24:$Vg,25:$Vh,26:$Vi,27:$Vj,28:$Vk,29:$Vl,30:$Vm,31:$Vn,32:$Vo}),o($Vp,$VI,{33:[1,115]}),{47:$Vq,48:$VH},o($Vp,[2,51]),o($Vp,[2,52]),o($Vp,[2,39]),{25:$Vr,36:$Vs,37:$Vt,43:116,44:54},{25:$Vr,36:$Vs,37:$Vt,44:117},o($VE,[2,45]),{6:$Vc,11:[1,118],21:$Vd,22:$Ve,23:$Vf,24:$Vg,25:$Vh,26:$Vi,27:$Vj,28:$Vk,29:$Vl,30:$Vm,31:$Vn,32:$Vo},{6:$Vc,11:[1,119],21:$Vd,22:$Ve,23:$Vf,24:$Vg,25:$Vh,26:$Vi,27:$Vj,28:$Vk,29:$Vl,30:$Vm,31:$Vn,32:$Vo},o($V9,[2,8]),{13:$Vu,19:120},{13:[1,121]},{49:[1,122]},{47:[1,124],49:[1,123]},o($Vp,[2,54]),{13:[1,125]},{23:$Vv,25:$Vw,36:$Vx,50:126,51:$Vy},o($Vp,[2,59]),{23:$Vv,25:$Vw,36:$Vx,50:127,51:$Vy},o($VG,[2,66]),o($VG,[2,67]),o($VG,[2,68]),{23:$Vv,25:$Vw,36:$Vx,50:128,51:$Vy},o($Vp,[2,35]),{7:129,9:16,10:$V3,13:$V4,15:22,25:$V5,33:$V6,35:15,36:$V7,37:$V8,38:19,40:21,45:23,48:$V2},o($VA,$VB,{35:15,9:16,38:19,40:21,15:22,45:23,7:88,39:130,10:$V3,13:$V4,25:$V5,33:$V6,36:$V7,37:$V8,48:$V2}),o($VC,[2,40],{18:$VD}),o($VE,[2,42]),o($V9,[2,5],{12:[1,131]}),o($V9,[2,7]),o($VF,[2,9]),o($VF,[2,12]),o($Vp,[2,55]),{49:[1,132]},{23:$Vv,25:$Vw,36:$Vx,50:133,51:$Vy},{49:[1,134]},{47:[1,136],49:[1,135]},{49:[1,137]},{47:[1,139],49:[1,138]},o($VA,[2,47],{6:$Vc,21:$Vd,22:$Ve,23:$Vf,24:$Vg,25:$Vh,26:$Vi,27:$Vj,28:$Vk,29:$Vl,30:$Vm,31:$Vn,32:$Vo}),{18:$VL,34:[1,140]},{13:[1,141]},o($Vp,[2,57]),{49:[1,142]},o($Vp,[2,56]),{49:[1,143]},{23:$Vv,25:$Vw,36:$Vx,50:144,51:$Vy},o($Vp,[2,60]),{49:[1,145]},{23:$Vv,25:$Vw,36:$Vx,50:146,51:$Vy},o($Vp,[2,36]),{14:[1,147]},{49:[1,148]},o($Vp,[2,61]),{49:[1,149]},o($Vp,[2,63]),{49:[1,150]},{13:[1,151]},o($Vp,[2,58]),{49:[1,152]},{49:[1,153]},o($V9,[2,6]),o($Vp,[2,62]),o($Vp,[2,64])],
defaultActions: {10:[2,1],32:[2,2],73:[2,14]},
parseError: function parseError(str, hash) {
    if (hash.recoverable) {
        this.trace(str);
    } else {
        function _parseError (msg, hash) {
            this.message = msg;
            this.hash = hash;
        }
        _parseError.prototype = Error;

        throw new _parseError(str, hash);
    }
},
parse: function parse(input) {
    var self = this, stack = [0], tstack = [], vstack = [null], lstack = [], table = this.table, yytext = '', yylineno = 0, yyleng = 0, recovering = 0, TERROR = 2, EOF = 1;
    var args = lstack.slice.call(arguments, 1);
    var lexer = Object.create(this.lexer);
    var sharedState = { yy: {} };
    for (var k in this.yy) {
        if (Object.prototype.hasOwnProperty.call(this.yy, k)) {
            sharedState.yy[k] = this.yy[k];
        }
    }
    lexer.setInput(input, sharedState.yy);
    sharedState.yy.lexer = lexer;
    sharedState.yy.parser = this;
    if (typeof lexer.yylloc == 'undefined') {
        lexer.yylloc = {};
    }
    var yyloc = lexer.yylloc;
    lstack.push(yyloc);
    var ranges = lexer.options && lexer.options.ranges;
    if (typeof sharedState.yy.parseError === 'function') {
        this.parseError = sharedState.yy.parseError;
    } else {
        this.parseError = Object.getPrototypeOf(this).parseError;
    }
    function popStack(n) {
        stack.length = stack.length - 2 * n;
        vstack.length = vstack.length - n;
        lstack.length = lstack.length - n;
    }
    _token_stack:
        var lex = function () {
            var token;
            token = lexer.lex() || EOF;
            if (typeof token !== 'number') {
                token = self.symbols_[token] || token;
            }
            return token;
        };
    var symbol, preErrorSymbol, state, action, a, r, yyval = {}, p, len, newState, expected;
    while (true) {
        state = stack[stack.length - 1];
        if (this.defaultActions[state]) {
            action = this.defaultActions[state];
        } else {
            if (symbol === null || typeof symbol == 'undefined') {
                symbol = lex();
            }
            action = table[state] && table[state][symbol];
        }
                    if (typeof action === 'undefined' || !action.length || !action[0]) {
                var errStr = '';
                expected = [];
                for (p in table[state]) {
                    if (this.terminals_[p] && p > TERROR) {
                        expected.push('\'' + this.terminals_[p] + '\'');
                    }
                }
                if (lexer.showPosition) {
                    errStr = 'Parse error on line ' + (yylineno + 1) + ':\n' + lexer.showPosition() + '\nExpecting ' + expected.join(', ') + ', got \'' + (this.terminals_[symbol] || symbol) + '\'';
                } else {
                    errStr = 'Parse error on line ' + (yylineno + 1) + ': Unexpected ' + (symbol == EOF ? 'end of input' : '\'' + (this.terminals_[symbol] || symbol) + '\'');
                }
                this.parseError(errStr, {
                    text: lexer.match,
                    token: this.terminals_[symbol] || symbol,
                    line: lexer.yylineno,
                    loc: yyloc,
                    expected: expected
                });
            }
        if (action[0] instanceof Array && action.length > 1) {
            throw new Error('Parse Error: multiple actions possible at state: ' + state + ', token: ' + symbol);
        }
        switch (action[0]) {
        case 1:
            stack.push(symbol);
            vstack.push(lexer.yytext);
            lstack.push(lexer.yylloc);
            stack.push(action[1]);
            symbol = null;
            if (!preErrorSymbol) {
                yyleng = lexer.yyleng;
                yytext = lexer.yytext;
                yylineno = lexer.yylineno;
                yyloc = lexer.yylloc;
                if (recovering > 0) {
                    recovering--;
                }
            } else {
                symbol = preErrorSymbol;
                preErrorSymbol = null;
            }
            break;
        case 2:
            len = this.productions_[action[1]][1];
            yyval.$ = vstack[vstack.length - len];
            yyval._$ = {
                first_line: lstack[lstack.length - (len || 1)].first_line,
                last_line: lstack[lstack.length - 1].last_line,
                first_column: lstack[lstack.length - (len || 1)].first_column,
                last_column: lstack[lstack.length - 1].last_column
            };
            if (ranges) {
                yyval._$.range = [
                    lstack[lstack.length - (len || 1)].range[0],
                    lstack[lstack.length - 1].range[1]
                ];
            }
            r = this.performAction.apply(yyval, [
                yytext,
                yyleng,
                yylineno,
                sharedState.yy,
                action[1],
                vstack,
                lstack
            ].concat(args));
            if (typeof r !== 'undefined') {
                return r;
            }
            if (len) {
                stack = stack.slice(0, -1 * len * 2);
                vstack = vstack.slice(0, -1 * len);
                lstack = lstack.slice(0, -1 * len);
            }
            stack.push(this.productions_[action[1]][0]);
            vstack.push(yyval.$);
            lstack.push(yyval._$);
            newState = table[stack[stack.length - 2]][stack[stack.length - 1]];
            stack.push(newState);
            break;
        case 3:
            return true;
        }
    }
    return true;
}};

    var exp = require("./expressions");
/* generated by jison-lex 0.3.4 */
var lexer = (function(){
var lexer = ({

EOF:1,

parseError:function parseError(str, hash) {
        if (this.yy.parser) {
            this.yy.parser.parseError(str, hash);
        } else {
            throw new Error(str);
        }
    },

// resets the lexer, sets new input
setInput:function (input, yy) {
        this.yy = yy || this.yy || {};
        this._input = input;
        this._more = this._backtrack = this.done = false;
        this.yylineno = this.yyleng = 0;
        this.yytext = this.matched = this.match = '';
        this.conditionStack = ['INITIAL'];
        this.yylloc = {
            first_line: 1,
            first_column: 0,
            last_line: 1,
            last_column: 0
        };
        if (this.options.ranges) {
            this.yylloc.range = [0,0];
        }
        this.offset = 0;
        return this;
    },

// consumes and returns one char from the input
input:function () {
        var ch = this._input[0];
        this.yytext += ch;
        this.yyleng++;
        this.offset++;
        this.match += ch;
        this.matched += ch;
        var lines = ch.match(/(?:\r\n?|\n).*/g);
        if (lines) {
            this.yylineno++;
            this.yylloc.last_line++;
        } else {
            this.yylloc.last_column++;
        }
        if (this.options.ranges) {
            this.yylloc.range[1]++;
        }

        this._input = this._input.slice(1);
        return ch;
    },

// unshifts one char (or a string) into the input
unput:function (ch) {
        var len = ch.length;
        var lines = ch.split(/(?:\r\n?|\n)/g);

        this._input = ch + this._input;
        this.yytext = this.yytext.substr(0, this.yytext.length - len);
        //this.yyleng -= len;
        this.offset -= len;
        var oldLines = this.match.split(/(?:\r\n?|\n)/g);
        this.match = this.match.substr(0, this.match.length - 1);
        this.matched = this.matched.substr(0, this.matched.length - 1);

        if (lines.length - 1) {
            this.yylineno -= lines.length - 1;
        }
        var r = this.yylloc.range;

        this.yylloc = {
            first_line: this.yylloc.first_line,
            last_line: this.yylineno + 1,
            first_column: this.yylloc.first_column,
            last_column: lines ?
                (lines.length === oldLines.length ? this.yylloc.first_column : 0)
                 + oldLines[oldLines.length - lines.length].length - lines[0].length :
              this.yylloc.first_column - len
        };

        if (this.options.ranges) {
            this.yylloc.range = [r[0], r[0] + this.yyleng - len];
        }
        this.yyleng = this.yytext.length;
        return this;
    },

// When called from action, caches matched text and appends it on next action
more:function () {
        this._more = true;
        return this;
    },

// When called from action, signals the lexer that this rule fails to match the input, so the next matching rule (regex) should be tested instead.
reject:function () {
        if (this.options.backtrack_lexer) {
            this._backtrack = true;
        } else {
            return this.parseError('Lexical error on line ' + (this.yylineno + 1) + '. You can only invoke reject() in the lexer when the lexer is of the backtracking persuasion (options.backtrack_lexer = true).\n' + this.showPosition(), {
                text: "",
                token: null,
                line: this.yylineno
            });

        }
        return this;
    },

// retain first n characters of the match
less:function (n) {
        this.unput(this.match.slice(n));
    },

// displays already matched input, i.e. for error messages
pastInput:function () {
        var past = this.matched.substr(0, this.matched.length - this.match.length);
        return (past.length > 20 ? '...':'') + past.substr(-20).replace(/\n/g, "");
    },

// displays upcoming input, i.e. for error messages
upcomingInput:function () {
        var next = this.match;
        if (next.length < 20) {
            next += this._input.substr(0, 20-next.length);
        }
        return (next.substr(0,20) + (next.length > 20 ? '...' : '')).replace(/\n/g, "");
    },

// displays the character position where the lexing error occurred, i.e. for error messages
showPosition:function () {
        var pre = this.pastInput();
        var c = new Array(pre.length + 1).join("-");
        return pre + this.upcomingInput() + "\n" + c + "^";
    },

// test the lexed token: return FALSE when not a match, otherwise return token
test_match:function (match, indexed_rule) {
        var token,
            lines,
            backup;

        if (this.options.backtrack_lexer) {
            // save context
            backup = {
                yylineno: this.yylineno,
                yylloc: {
                    first_line: this.yylloc.first_line,
                    last_line: this.last_line,
                    first_column: this.yylloc.first_column,
                    last_column: this.yylloc.last_column
                },
                yytext: this.yytext,
                match: this.match,
                matches: this.matches,
                matched: this.matched,
                yyleng: this.yyleng,
                offset: this.offset,
                _more: this._more,
                _input: this._input,
                yy: this.yy,
                conditionStack: this.conditionStack.slice(0),
                done: this.done
            };
            if (this.options.ranges) {
                backup.yylloc.range = this.yylloc.range.slice(0);
            }
        }

        lines = match[0].match(/(?:\r\n?|\n).*/g);
        if (lines) {
            this.yylineno += lines.length;
        }
        this.yylloc = {
            first_line: this.yylloc.last_line,
            last_line: this.yylineno + 1,
            first_column: this.yylloc.last_column,
            last_column: lines ?
                         lines[lines.length - 1].length - lines[lines.length - 1].match(/\r?\n?/)[0].length :
                         this.yylloc.last_column + match[0].length
        };
        this.yytext += match[0];
        this.match += match[0];
        this.matches = match;
        this.yyleng = this.yytext.length;
        if (this.options.ranges) {
            this.yylloc.range = [this.offset, this.offset += this.yyleng];
        }
        this._more = false;
        this._backtrack = false;
        this._input = this._input.slice(match[0].length);
        this.matched += match[0];
        token = this.performAction.call(this, this.yy, this, indexed_rule, this.conditionStack[this.conditionStack.length - 1]);
        if (this.done && this._input) {
            this.done = false;
        }
        if (token) {
            return token;
        } else if (this._backtrack) {
            // recover context
            for (var k in backup) {
                this[k] = backup[k];
            }
            return false; // rule action called reject() implying the next rule should be tested instead.
        }
        return false;
    },

// return next match in input
next:function () {
        if (this.done) {
            return this.EOF;
        }
        if (!this._input) {
            this.done = true;
        }

        var token,
            match,
            tempMatch,
            index;
        if (!this._more) {
            this.yytext = '';
            this.match = '';
        }
        var rules = this._currentRules();
        for (var i = 0; i < rules.length; i++) {
            tempMatch = this._input.match(this.rules[rules[i]]);
            if (tempMatch && (!match || tempMatch[0].length > match[0].length)) {
                match = tempMatch;
                index = i;
                if (this.options.backtrack_lexer) {
                    token = this.test_match(tempMatch, rules[i]);
                    if (token !== false) {
                        return token;
                    } else if (this._backtrack) {
                        match = false;
                        continue; // rule action called reject() implying a rule MISmatch.
                    } else {
                        // else: this is a lexer rule which consumes input without producing a token (e.g. whitespace)
                        return false;
                    }
                } else if (!this.options.flex) {
                    break;
                }
            }
        }
        if (match) {
            token = this.test_match(match, rules[index]);
            if (token !== false) {
                return token;
            }
            // else: this is a lexer rule which consumes input without producing a token (e.g. whitespace)
            return false;
        }
        if (this._input === "") {
            return this.EOF;
        } else {
            return this.parseError('Lexical error on line ' + (this.yylineno + 1) + '. Unrecognized text.\n' + this.showPosition(), {
                text: "",
                token: null,
                line: this.yylineno
            });
        }
    },

// return next match that has a token
lex:function lex() {
        var r = this.next();
        if (r) {
            return r;
        } else {
            return this.lex();
        }
    },

// activates a new lexer condition state (pushes the new lexer condition state onto the condition stack)
begin:function begin(condition) {
        this.conditionStack.push(condition);
    },

// pop the previously active lexer condition state off the condition stack
popState:function popState() {
        var n = this.conditionStack.length - 1;
        if (n > 0) {
            return this.conditionStack.pop();
        } else {
            return this.conditionStack[0];
        }
    },

// produce the lexer rule set which is active for the currently active lexer condition state
_currentRules:function _currentRules() {
        if (this.conditionStack.length && this.conditionStack[this.conditionStack.length - 1]) {
            return this.conditions[this.conditionStack[this.conditionStack.length - 1]].rules;
        } else {
            return this.conditions["INITIAL"].rules;
        }
    },

// return the currently active lexer condition state; when an index argument is provided it produces the N-th previous condition state, if available
topState:function topState(n) {
        n = this.conditionStack.length - 1 - Math.abs(n || 0);
        if (n >= 0) {
            return this.conditionStack[n];
        } else {
            return "INITIAL";
        }
    },

// alias for begin(condition)
pushState:function pushState(condition) {
        this.begin(condition);
    },

// return the number of states currently on the stack
stateStackSize:function stateStackSize() {
        return this.conditionStack.length;
    },
options: {},
performAction: function anonymous(yy,yy_,$avoiding_name_collisions,YY_START) {
var YYSTATE=YY_START;
switch($avoiding_name_collisions) {
case 0:/* skip whitespace */
break;
case 1:return 36;
break;
case 2:return 21;
break;
case 3:return 22;
break;
case 4:return '->';
break;
case 5:return 25;
break;
case 6:return 23;
break;
case 7:return 24;
break;
case 8:return 26;
break;
case 9:return 33;
break;
case 10:return 34;
break;
case 11:return 32;
break;
case 12:return 10;
break;
case 13:return 11;
break;
case 14:return 48;
break;
case 15:return 49;
break;
case 16:return 20;
break;
case 17:return 47;
break;
case 18:return 42;
break;
case 19:return 18;
break;
case 20:return '?'
break;
case 21:return 51;
break;
case 22:return 46;
break;
case 23:return 29;
break;
case 24:return 27;
break;
case 25:return 31;
break;
case 26:return 30;
break;
case 27:return 28;
break;
case 28:return 6;
break;
case 29:return 14
break;
case 30:return 16
break;
case 31:return 12
break;
case 32:return "param"
break;
case 33:return 13;
break;
case 34:return 37;
break;
case 35:return 5;
break;
}
},
rules: [/^(?:\s+)/,/^(?:[0-9]+(\.[0-9]+)?\b)/,/^(?:\*)/,/^(?:\/)/,/^(?:->)/,/^(?:-)/,/^(?:\+)/,/^(?:&)/,/^(?:\^)/,/^(?:\()/,/^(?:\))/,/^(?:%)/,/^(?:\{)/,/^(?:\})/,/^(?:\[)/,/^(?:\])/,/^(?:\.)/,/^(?::)/,/^(?:;)/,/^(?:,)/,/^(?:\?)/,/^(?:#)/,/^(?:!)/,/^(?:>=)/,/^(?:>)/,/^(?:<>)/,/^(?:<=)/,/^(?:<)/,/^(?:=)/,/^(?:as\b)/,/^(?:context\b)/,/^(?:with\b)/,/^(?:param\b)/,/^(?:[$_a-zA-Zà-úÀ-Ú][_a-zA-Zà-úÀ-Ú0-9]*)/,/^(?:"(\\.|[^"])*")/,/^(?:$)/],
conditions: {"INITIAL":{"rules":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35],"inclusive":true}}
});
return lexer;
})();
parser.lexer = lexer;
function Parser () {
  this.yy = {};
}
Parser.prototype = parser;parser.Parser = Parser;
return new Parser;
})();


if (typeof require !== 'undefined' && typeof exports !== 'undefined') {
exports.parser = rLang;
exports.Parser = rLang.Parser;
exports.parse = function () { return rLang.parse.apply(rLang, arguments); };
exports.main = function commonjsMain(args) {
    if (!args[1]) {
        console.log('Usage: '+args[0]+' FILE');
        process.exit(1);
    }
    var source = require('fs').readFileSync(require('path').normalize(args[1]), "utf8");
    return exports.parser.parse(source);
};
if (typeof module !== 'undefined' && require.main === module) {
  exports.main(process.argv.slice(1));
}
}
}).call(this,require('_process'))

},{"./expressions":10,"_process":3,"fs":1,"path":2}],19:[function(require,module,exports){
/*jslint node: true */
'use strict';

function SymbolTable() {
    this.symbols = [];
    this.functions = [];
    this.functionSymbolSeed = 0;
}

function Symbol(name, type, table) {
    this.definition = name;
    this.type = type;
    this.privateDefinition = name + "_" + type;
    this.table = table;
}

function FunctionSymbol(name, symbolName, callSignature) {
    this.name = name;
    this.callSignature = callSignature;
    this.symbolName = symbolName;
}

FunctionSymbol.prototype.getJsDefinition = function () {
    return "var " + this.symbolName + " = " + this.callSignature + ";";
}

module.exports.SymbolTable = SymbolTable;
module.exports.Symbol = Symbol;

Symbol.prototype.tryGetGlobal = function(name) {
     return '((typeof $.g["'+ name +'"] != "undefined") ? $.g["' + name +'"] : {})' 
}

Symbol.prototype.getDeclaration = function () {
    if (this.type == "V") {
        var tokens = this.definition.split(".");


        var declaration = "var " + tokens[0] + " = " + this.tryGetGlobal(tokens[0]) + ";\n";
        var completeName = tokens[0];

        for (var i = 1; i < tokens.length; i++) {
            completeName += "." + tokens[i];
            declaration += 'if ( typeof ' + completeName + ' == "undefined") ' + completeName + ' = {};\n';
        }

        return declaration;
    }

    if (this.type == "G") return "if (!$.g." + this.definition + ") $.g." + this.definition + " = {};\n"
    if (this.type == "T") return "var " + this.definition + " = $.table('"+ this.definition +"');\n";
    return "";
}

SymbolTable.prototype.getRootSymbols = function () {
    var ret = [];
    for (var s = 0; s < this.symbols.length; s++) {
        var symbol = this.symbols[s];
        if ((symbol.type == "V") && ret.indexOf(symbol.definition) < 0) {
            if (symbol.definition.indexOf(".") > 0)
                ret.push(symbol.definition.split('.')[0]);
            else
                ret.push(symbol.definition);
        } 
    }
    return ret;
}

SymbolTable.prototype.registerSymbol = function (name, type, table) {
    this.addSymbol(new Symbol(name, type, table));
}

SymbolTable.prototype.addSymbol = function (symbol) {
    if (!this.containsSymbol(symbol)) {
        this.symbols.push(symbol);
        //console.log('registering symbol ' + symbol.definition + ' ' + symbol.type + ' table: ' + symbol.table);
    }
}

SymbolTable.prototype.searchSymbol = function (name, type) {
    for (var i = 0; i < this.symbols.length; i++) {
        if (this.symbols[i].definition === name) {
            if (!type) return this.symbols[i];
            else if (type && this.symbols[i].type === type) return this.symbols[i];
        }
    }
    return null;
}

SymbolTable.prototype.containsSymbol = function (symbol) {
    for (var i = 0; i < this.symbols.length; i++) {
        if (this.symbols[i].privateDefinition === symbol.privateDefinition)
            return true;
    }
    return false;
}

SymbolTable.prototype.registerFunction = function (name, callSignature) {
    for (var i = 0; i < this.functions.length; i++) {
        if (this.functions[i].callSignature === callSignature)
            return this.functions[i].symbolName;
    }
    
    var symbolName = "var" + name + "" + ++this.functionSymbolSeed;
    var f = new FunctionSymbol(name, symbolName, callSignature);
    this.functions.push(f);
    return symbolName;

}

SymbolTable.prototype.getFunctionsJsSet = function () {
    var js = "";
    for (var i = 0; i < this.functions.length; i++) {
        js += this.functions[i].getJsDefinition() + "\n";
    }
    return js;
} 

SymbolTable.prototype.clearFunctions = function () {
    this.functions.splice(0, this.functions.length);
}
},{}]},{},[13])(13)
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL1VzZXJzL3BlZHJvL0FwcERhdGEvUm9hbWluZy9ucG0vbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi4uLy4uLy4uLy4uLy4uLy4uLy4uL1VzZXJzL3BlZHJvL0FwcERhdGEvUm9hbWluZy9ucG0vbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbGliL19lbXB0eS5qcyIsIi4uLy4uLy4uLy4uLy4uLy4uLy4uL1VzZXJzL3BlZHJvL0FwcERhdGEvUm9hbWluZy9ucG0vbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL3BhdGgtYnJvd3NlcmlmeS9pbmRleC5qcyIsIi4uLy4uLy4uLy4uLy4uLy4uLy4uL1VzZXJzL3BlZHJvL0FwcERhdGEvUm9hbWluZy9ucG0vbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL3Byb2Nlc3MvYnJvd3Nlci5qcyIsIkRhdGFUYWJsZS5qcyIsImJhc2VGdW5jdGlvbnMuanMiLCJjb250ZXh0LmpzIiwiZGF0ZUZ1bmN0aW9ucy5qcyIsImRvbWFpbkZ1bmN0aW9ucy5qcyIsImV4cHJlc3Npb25zLmpzIiwiZm5IZWxwZXJzLmpzIiwiZnVuY3Rpb25zLmpzIiwiaW5kZXguanMiLCJtYXRoRnVuY3Rpb25zLmpzIiwibm9kZV9tb2R1bGVzL2pzLWFycmF5LWV4dGVuc2lvbnMvc3JjL2FycmF5LmV4dGVuc2lvbnMuanMiLCJub2RlX21vZHVsZXMvbW9tZW50L21vbWVudC5qcyIsInByZWRpY2F0ZXMuanMiLCJyTGFuZy5qcyIsInN5bWJvbFRhYmxlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7OztBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ2hPQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDelBBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUxBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDL0dBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFoQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUM5aEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDcElBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwUUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2htQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbG1JQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUMzRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ3IxQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiIiwiLy8gQ29weXJpZ2h0IEpveWVudCwgSW5jLiBhbmQgb3RoZXIgTm9kZSBjb250cmlidXRvcnMuXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGFcbi8vIGNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGVcbi8vIFwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZ1xuLy8gd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLFxuLy8gZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdFxuLy8gcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlXG4vLyBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZFxuLy8gaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTU1xuLy8gT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRlxuLy8gTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTlxuLy8gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sXG4vLyBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1Jcbi8vIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEVcbi8vIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG5cbi8vIHJlc29sdmVzIC4gYW5kIC4uIGVsZW1lbnRzIGluIGEgcGF0aCBhcnJheSB3aXRoIGRpcmVjdG9yeSBuYW1lcyB0aGVyZVxuLy8gbXVzdCBiZSBubyBzbGFzaGVzLCBlbXB0eSBlbGVtZW50cywgb3IgZGV2aWNlIG5hbWVzIChjOlxcKSBpbiB0aGUgYXJyYXlcbi8vIChzbyBhbHNvIG5vIGxlYWRpbmcgYW5kIHRyYWlsaW5nIHNsYXNoZXMgLSBpdCBkb2VzIG5vdCBkaXN0aW5ndWlzaFxuLy8gcmVsYXRpdmUgYW5kIGFic29sdXRlIHBhdGhzKVxuZnVuY3Rpb24gbm9ybWFsaXplQXJyYXkocGFydHMsIGFsbG93QWJvdmVSb290KSB7XG4gIC8vIGlmIHRoZSBwYXRoIHRyaWVzIHRvIGdvIGFib3ZlIHRoZSByb290LCBgdXBgIGVuZHMgdXAgPiAwXG4gIHZhciB1cCA9IDA7XG4gIGZvciAodmFyIGkgPSBwYXJ0cy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgIHZhciBsYXN0ID0gcGFydHNbaV07XG4gICAgaWYgKGxhc3QgPT09ICcuJykge1xuICAgICAgcGFydHMuc3BsaWNlKGksIDEpO1xuICAgIH0gZWxzZSBpZiAobGFzdCA9PT0gJy4uJykge1xuICAgICAgcGFydHMuc3BsaWNlKGksIDEpO1xuICAgICAgdXArKztcbiAgICB9IGVsc2UgaWYgKHVwKSB7XG4gICAgICBwYXJ0cy5zcGxpY2UoaSwgMSk7XG4gICAgICB1cC0tO1xuICAgIH1cbiAgfVxuXG4gIC8vIGlmIHRoZSBwYXRoIGlzIGFsbG93ZWQgdG8gZ28gYWJvdmUgdGhlIHJvb3QsIHJlc3RvcmUgbGVhZGluZyAuLnNcbiAgaWYgKGFsbG93QWJvdmVSb290KSB7XG4gICAgZm9yICg7IHVwLS07IHVwKSB7XG4gICAgICBwYXJ0cy51bnNoaWZ0KCcuLicpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBwYXJ0cztcbn1cblxuLy8gU3BsaXQgYSBmaWxlbmFtZSBpbnRvIFtyb290LCBkaXIsIGJhc2VuYW1lLCBleHRdLCB1bml4IHZlcnNpb25cbi8vICdyb290JyBpcyBqdXN0IGEgc2xhc2gsIG9yIG5vdGhpbmcuXG52YXIgc3BsaXRQYXRoUmUgPVxuICAgIC9eKFxcLz98KShbXFxzXFxTXSo/KSgoPzpcXC57MSwyfXxbXlxcL10rP3wpKFxcLlteLlxcL10qfCkpKD86W1xcL10qKSQvO1xudmFyIHNwbGl0UGF0aCA9IGZ1bmN0aW9uKGZpbGVuYW1lKSB7XG4gIHJldHVybiBzcGxpdFBhdGhSZS5leGVjKGZpbGVuYW1lKS5zbGljZSgxKTtcbn07XG5cbi8vIHBhdGgucmVzb2x2ZShbZnJvbSAuLi5dLCB0bylcbi8vIHBvc2l4IHZlcnNpb25cbmV4cG9ydHMucmVzb2x2ZSA9IGZ1bmN0aW9uKCkge1xuICB2YXIgcmVzb2x2ZWRQYXRoID0gJycsXG4gICAgICByZXNvbHZlZEFic29sdXRlID0gZmFsc2U7XG5cbiAgZm9yICh2YXIgaSA9IGFyZ3VtZW50cy5sZW5ndGggLSAxOyBpID49IC0xICYmICFyZXNvbHZlZEFic29sdXRlOyBpLS0pIHtcbiAgICB2YXIgcGF0aCA9IChpID49IDApID8gYXJndW1lbnRzW2ldIDogcHJvY2Vzcy5jd2QoKTtcblxuICAgIC8vIFNraXAgZW1wdHkgYW5kIGludmFsaWQgZW50cmllc1xuICAgIGlmICh0eXBlb2YgcGF0aCAhPT0gJ3N0cmluZycpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0FyZ3VtZW50cyB0byBwYXRoLnJlc29sdmUgbXVzdCBiZSBzdHJpbmdzJyk7XG4gICAgfSBlbHNlIGlmICghcGF0aCkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgcmVzb2x2ZWRQYXRoID0gcGF0aCArICcvJyArIHJlc29sdmVkUGF0aDtcbiAgICByZXNvbHZlZEFic29sdXRlID0gcGF0aC5jaGFyQXQoMCkgPT09ICcvJztcbiAgfVxuXG4gIC8vIEF0IHRoaXMgcG9pbnQgdGhlIHBhdGggc2hvdWxkIGJlIHJlc29sdmVkIHRvIGEgZnVsbCBhYnNvbHV0ZSBwYXRoLCBidXRcbiAgLy8gaGFuZGxlIHJlbGF0aXZlIHBhdGhzIHRvIGJlIHNhZmUgKG1pZ2h0IGhhcHBlbiB3aGVuIHByb2Nlc3MuY3dkKCkgZmFpbHMpXG5cbiAgLy8gTm9ybWFsaXplIHRoZSBwYXRoXG4gIHJlc29sdmVkUGF0aCA9IG5vcm1hbGl6ZUFycmF5KGZpbHRlcihyZXNvbHZlZFBhdGguc3BsaXQoJy8nKSwgZnVuY3Rpb24ocCkge1xuICAgIHJldHVybiAhIXA7XG4gIH0pLCAhcmVzb2x2ZWRBYnNvbHV0ZSkuam9pbignLycpO1xuXG4gIHJldHVybiAoKHJlc29sdmVkQWJzb2x1dGUgPyAnLycgOiAnJykgKyByZXNvbHZlZFBhdGgpIHx8ICcuJztcbn07XG5cbi8vIHBhdGgubm9ybWFsaXplKHBhdGgpXG4vLyBwb3NpeCB2ZXJzaW9uXG5leHBvcnRzLm5vcm1hbGl6ZSA9IGZ1bmN0aW9uKHBhdGgpIHtcbiAgdmFyIGlzQWJzb2x1dGUgPSBleHBvcnRzLmlzQWJzb2x1dGUocGF0aCksXG4gICAgICB0cmFpbGluZ1NsYXNoID0gc3Vic3RyKHBhdGgsIC0xKSA9PT0gJy8nO1xuXG4gIC8vIE5vcm1hbGl6ZSB0aGUgcGF0aFxuICBwYXRoID0gbm9ybWFsaXplQXJyYXkoZmlsdGVyKHBhdGguc3BsaXQoJy8nKSwgZnVuY3Rpb24ocCkge1xuICAgIHJldHVybiAhIXA7XG4gIH0pLCAhaXNBYnNvbHV0ZSkuam9pbignLycpO1xuXG4gIGlmICghcGF0aCAmJiAhaXNBYnNvbHV0ZSkge1xuICAgIHBhdGggPSAnLic7XG4gIH1cbiAgaWYgKHBhdGggJiYgdHJhaWxpbmdTbGFzaCkge1xuICAgIHBhdGggKz0gJy8nO1xuICB9XG5cbiAgcmV0dXJuIChpc0Fic29sdXRlID8gJy8nIDogJycpICsgcGF0aDtcbn07XG5cbi8vIHBvc2l4IHZlcnNpb25cbmV4cG9ydHMuaXNBYnNvbHV0ZSA9IGZ1bmN0aW9uKHBhdGgpIHtcbiAgcmV0dXJuIHBhdGguY2hhckF0KDApID09PSAnLyc7XG59O1xuXG4vLyBwb3NpeCB2ZXJzaW9uXG5leHBvcnRzLmpvaW4gPSBmdW5jdGlvbigpIHtcbiAgdmFyIHBhdGhzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAwKTtcbiAgcmV0dXJuIGV4cG9ydHMubm9ybWFsaXplKGZpbHRlcihwYXRocywgZnVuY3Rpb24ocCwgaW5kZXgpIHtcbiAgICBpZiAodHlwZW9mIHAgIT09ICdzdHJpbmcnKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdBcmd1bWVudHMgdG8gcGF0aC5qb2luIG11c3QgYmUgc3RyaW5ncycpO1xuICAgIH1cbiAgICByZXR1cm4gcDtcbiAgfSkuam9pbignLycpKTtcbn07XG5cblxuLy8gcGF0aC5yZWxhdGl2ZShmcm9tLCB0bylcbi8vIHBvc2l4IHZlcnNpb25cbmV4cG9ydHMucmVsYXRpdmUgPSBmdW5jdGlvbihmcm9tLCB0bykge1xuICBmcm9tID0gZXhwb3J0cy5yZXNvbHZlKGZyb20pLnN1YnN0cigxKTtcbiAgdG8gPSBleHBvcnRzLnJlc29sdmUodG8pLnN1YnN0cigxKTtcblxuICBmdW5jdGlvbiB0cmltKGFycikge1xuICAgIHZhciBzdGFydCA9IDA7XG4gICAgZm9yICg7IHN0YXJ0IDwgYXJyLmxlbmd0aDsgc3RhcnQrKykge1xuICAgICAgaWYgKGFycltzdGFydF0gIT09ICcnKSBicmVhaztcbiAgICB9XG5cbiAgICB2YXIgZW5kID0gYXJyLmxlbmd0aCAtIDE7XG4gICAgZm9yICg7IGVuZCA+PSAwOyBlbmQtLSkge1xuICAgICAgaWYgKGFycltlbmRdICE9PSAnJykgYnJlYWs7XG4gICAgfVxuXG4gICAgaWYgKHN0YXJ0ID4gZW5kKSByZXR1cm4gW107XG4gICAgcmV0dXJuIGFyci5zbGljZShzdGFydCwgZW5kIC0gc3RhcnQgKyAxKTtcbiAgfVxuXG4gIHZhciBmcm9tUGFydHMgPSB0cmltKGZyb20uc3BsaXQoJy8nKSk7XG4gIHZhciB0b1BhcnRzID0gdHJpbSh0by5zcGxpdCgnLycpKTtcblxuICB2YXIgbGVuZ3RoID0gTWF0aC5taW4oZnJvbVBhcnRzLmxlbmd0aCwgdG9QYXJ0cy5sZW5ndGgpO1xuICB2YXIgc2FtZVBhcnRzTGVuZ3RoID0gbGVuZ3RoO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKGZyb21QYXJ0c1tpXSAhPT0gdG9QYXJ0c1tpXSkge1xuICAgICAgc2FtZVBhcnRzTGVuZ3RoID0gaTtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuXG4gIHZhciBvdXRwdXRQYXJ0cyA9IFtdO1xuICBmb3IgKHZhciBpID0gc2FtZVBhcnRzTGVuZ3RoOyBpIDwgZnJvbVBhcnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgb3V0cHV0UGFydHMucHVzaCgnLi4nKTtcbiAgfVxuXG4gIG91dHB1dFBhcnRzID0gb3V0cHV0UGFydHMuY29uY2F0KHRvUGFydHMuc2xpY2Uoc2FtZVBhcnRzTGVuZ3RoKSk7XG5cbiAgcmV0dXJuIG91dHB1dFBhcnRzLmpvaW4oJy8nKTtcbn07XG5cbmV4cG9ydHMuc2VwID0gJy8nO1xuZXhwb3J0cy5kZWxpbWl0ZXIgPSAnOic7XG5cbmV4cG9ydHMuZGlybmFtZSA9IGZ1bmN0aW9uKHBhdGgpIHtcbiAgdmFyIHJlc3VsdCA9IHNwbGl0UGF0aChwYXRoKSxcbiAgICAgIHJvb3QgPSByZXN1bHRbMF0sXG4gICAgICBkaXIgPSByZXN1bHRbMV07XG5cbiAgaWYgKCFyb290ICYmICFkaXIpIHtcbiAgICAvLyBObyBkaXJuYW1lIHdoYXRzb2V2ZXJcbiAgICByZXR1cm4gJy4nO1xuICB9XG5cbiAgaWYgKGRpcikge1xuICAgIC8vIEl0IGhhcyBhIGRpcm5hbWUsIHN0cmlwIHRyYWlsaW5nIHNsYXNoXG4gICAgZGlyID0gZGlyLnN1YnN0cigwLCBkaXIubGVuZ3RoIC0gMSk7XG4gIH1cblxuICByZXR1cm4gcm9vdCArIGRpcjtcbn07XG5cblxuZXhwb3J0cy5iYXNlbmFtZSA9IGZ1bmN0aW9uKHBhdGgsIGV4dCkge1xuICB2YXIgZiA9IHNwbGl0UGF0aChwYXRoKVsyXTtcbiAgLy8gVE9ETzogbWFrZSB0aGlzIGNvbXBhcmlzb24gY2FzZS1pbnNlbnNpdGl2ZSBvbiB3aW5kb3dzP1xuICBpZiAoZXh0ICYmIGYuc3Vic3RyKC0xICogZXh0Lmxlbmd0aCkgPT09IGV4dCkge1xuICAgIGYgPSBmLnN1YnN0cigwLCBmLmxlbmd0aCAtIGV4dC5sZW5ndGgpO1xuICB9XG4gIHJldHVybiBmO1xufTtcblxuXG5leHBvcnRzLmV4dG5hbWUgPSBmdW5jdGlvbihwYXRoKSB7XG4gIHJldHVybiBzcGxpdFBhdGgocGF0aClbM107XG59O1xuXG5mdW5jdGlvbiBmaWx0ZXIgKHhzLCBmKSB7XG4gICAgaWYgKHhzLmZpbHRlcikgcmV0dXJuIHhzLmZpbHRlcihmKTtcbiAgICB2YXIgcmVzID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB4cy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAoZih4c1tpXSwgaSwgeHMpKSByZXMucHVzaCh4c1tpXSk7XG4gICAgfVxuICAgIHJldHVybiByZXM7XG59XG5cbi8vIFN0cmluZy5wcm90b3R5cGUuc3Vic3RyIC0gbmVnYXRpdmUgaW5kZXggZG9uJ3Qgd29yayBpbiBJRThcbnZhciBzdWJzdHIgPSAnYWInLnN1YnN0cigtMSkgPT09ICdiJ1xuICAgID8gZnVuY3Rpb24gKHN0ciwgc3RhcnQsIGxlbikgeyByZXR1cm4gc3RyLnN1YnN0cihzdGFydCwgbGVuKSB9XG4gICAgOiBmdW5jdGlvbiAoc3RyLCBzdGFydCwgbGVuKSB7XG4gICAgICAgIGlmIChzdGFydCA8IDApIHN0YXJ0ID0gc3RyLmxlbmd0aCArIHN0YXJ0O1xuICAgICAgICByZXR1cm4gc3RyLnN1YnN0cihzdGFydCwgbGVuKTtcbiAgICB9XG47XG4iLCIvLyBzaGltIGZvciB1c2luZyBwcm9jZXNzIGluIGJyb3dzZXJcbnZhciBwcm9jZXNzID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcblxuLy8gY2FjaGVkIGZyb20gd2hhdGV2ZXIgZ2xvYmFsIGlzIHByZXNlbnQgc28gdGhhdCB0ZXN0IHJ1bm5lcnMgdGhhdCBzdHViIGl0XG4vLyBkb24ndCBicmVhayB0aGluZ3MuICBCdXQgd2UgbmVlZCB0byB3cmFwIGl0IGluIGEgdHJ5IGNhdGNoIGluIGNhc2UgaXQgaXNcbi8vIHdyYXBwZWQgaW4gc3RyaWN0IG1vZGUgY29kZSB3aGljaCBkb2Vzbid0IGRlZmluZSBhbnkgZ2xvYmFscy4gIEl0J3MgaW5zaWRlIGFcbi8vIGZ1bmN0aW9uIGJlY2F1c2UgdHJ5L2NhdGNoZXMgZGVvcHRpbWl6ZSBpbiBjZXJ0YWluIGVuZ2luZXMuXG5cbnZhciBjYWNoZWRTZXRUaW1lb3V0O1xudmFyIGNhY2hlZENsZWFyVGltZW91dDtcblxuZnVuY3Rpb24gZGVmYXVsdFNldFRpbW91dCgpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3NldFRpbWVvdXQgaGFzIG5vdCBiZWVuIGRlZmluZWQnKTtcbn1cbmZ1bmN0aW9uIGRlZmF1bHRDbGVhclRpbWVvdXQgKCkge1xuICAgIHRocm93IG5ldyBFcnJvcignY2xlYXJUaW1lb3V0IGhhcyBub3QgYmVlbiBkZWZpbmVkJyk7XG59XG4oZnVuY3Rpb24gKCkge1xuICAgIHRyeSB7XG4gICAgICAgIGlmICh0eXBlb2Ygc2V0VGltZW91dCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IHNldFRpbWVvdXQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gZGVmYXVsdFNldFRpbW91dDtcbiAgICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IGRlZmF1bHRTZXRUaW1vdXQ7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIGlmICh0eXBlb2YgY2xlYXJUaW1lb3V0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBjbGVhclRpbWVvdXQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBkZWZhdWx0Q2xlYXJUaW1lb3V0O1xuICAgICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBkZWZhdWx0Q2xlYXJUaW1lb3V0O1xuICAgIH1cbn0gKCkpXG5mdW5jdGlvbiBydW5UaW1lb3V0KGZ1bikge1xuICAgIGlmIChjYWNoZWRTZXRUaW1lb3V0ID09PSBzZXRUaW1lb3V0KSB7XG4gICAgICAgIC8vbm9ybWFsIGVudmlyb21lbnRzIGluIHNhbmUgc2l0dWF0aW9uc1xuICAgICAgICByZXR1cm4gc2V0VGltZW91dChmdW4sIDApO1xuICAgIH1cbiAgICAvLyBpZiBzZXRUaW1lb3V0IHdhc24ndCBhdmFpbGFibGUgYnV0IHdhcyBsYXR0ZXIgZGVmaW5lZFxuICAgIGlmICgoY2FjaGVkU2V0VGltZW91dCA9PT0gZGVmYXVsdFNldFRpbW91dCB8fCAhY2FjaGVkU2V0VGltZW91dCkgJiYgc2V0VGltZW91dCkge1xuICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gc2V0VGltZW91dDtcbiAgICAgICAgcmV0dXJuIHNldFRpbWVvdXQoZnVuLCAwKTtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgLy8gd2hlbiB3aGVuIHNvbWVib2R5IGhhcyBzY3Jld2VkIHdpdGggc2V0VGltZW91dCBidXQgbm8gSS5FLiBtYWRkbmVzc1xuICAgICAgICByZXR1cm4gY2FjaGVkU2V0VGltZW91dChmdW4sIDApO1xuICAgIH0gY2F0Y2goZSl7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyBXaGVuIHdlIGFyZSBpbiBJLkUuIGJ1dCB0aGUgc2NyaXB0IGhhcyBiZWVuIGV2YWxlZCBzbyBJLkUuIGRvZXNuJ3QgdHJ1c3QgdGhlIGdsb2JhbCBvYmplY3Qgd2hlbiBjYWxsZWQgbm9ybWFsbHlcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRTZXRUaW1lb3V0LmNhbGwobnVsbCwgZnVuLCAwKTtcbiAgICAgICAgfSBjYXRjaChlKXtcbiAgICAgICAgICAgIC8vIHNhbWUgYXMgYWJvdmUgYnV0IHdoZW4gaXQncyBhIHZlcnNpb24gb2YgSS5FLiB0aGF0IG11c3QgaGF2ZSB0aGUgZ2xvYmFsIG9iamVjdCBmb3IgJ3RoaXMnLCBob3BmdWxseSBvdXIgY29udGV4dCBjb3JyZWN0IG90aGVyd2lzZSBpdCB3aWxsIHRocm93IGEgZ2xvYmFsIGVycm9yXG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkU2V0VGltZW91dC5jYWxsKHRoaXMsIGZ1biwgMCk7XG4gICAgICAgIH1cbiAgICB9XG5cblxufVxuZnVuY3Rpb24gcnVuQ2xlYXJUaW1lb3V0KG1hcmtlcikge1xuICAgIGlmIChjYWNoZWRDbGVhclRpbWVvdXQgPT09IGNsZWFyVGltZW91dCkge1xuICAgICAgICAvL25vcm1hbCBlbnZpcm9tZW50cyBpbiBzYW5lIHNpdHVhdGlvbnNcbiAgICAgICAgcmV0dXJuIGNsZWFyVGltZW91dChtYXJrZXIpO1xuICAgIH1cbiAgICAvLyBpZiBjbGVhclRpbWVvdXQgd2Fzbid0IGF2YWlsYWJsZSBidXQgd2FzIGxhdHRlciBkZWZpbmVkXG4gICAgaWYgKChjYWNoZWRDbGVhclRpbWVvdXQgPT09IGRlZmF1bHRDbGVhclRpbWVvdXQgfHwgIWNhY2hlZENsZWFyVGltZW91dCkgJiYgY2xlYXJUaW1lb3V0KSB7XG4gICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGNsZWFyVGltZW91dDtcbiAgICAgICAgcmV0dXJuIGNsZWFyVGltZW91dChtYXJrZXIpO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICAvLyB3aGVuIHdoZW4gc29tZWJvZHkgaGFzIHNjcmV3ZWQgd2l0aCBzZXRUaW1lb3V0IGJ1dCBubyBJLkUuIG1hZGRuZXNzXG4gICAgICAgIHJldHVybiBjYWNoZWRDbGVhclRpbWVvdXQobWFya2VyKTtcbiAgICB9IGNhdGNoIChlKXtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIFdoZW4gd2UgYXJlIGluIEkuRS4gYnV0IHRoZSBzY3JpcHQgaGFzIGJlZW4gZXZhbGVkIHNvIEkuRS4gZG9lc24ndCAgdHJ1c3QgdGhlIGdsb2JhbCBvYmplY3Qgd2hlbiBjYWxsZWQgbm9ybWFsbHlcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRDbGVhclRpbWVvdXQuY2FsbChudWxsLCBtYXJrZXIpO1xuICAgICAgICB9IGNhdGNoIChlKXtcbiAgICAgICAgICAgIC8vIHNhbWUgYXMgYWJvdmUgYnV0IHdoZW4gaXQncyBhIHZlcnNpb24gb2YgSS5FLiB0aGF0IG11c3QgaGF2ZSB0aGUgZ2xvYmFsIG9iamVjdCBmb3IgJ3RoaXMnLCBob3BmdWxseSBvdXIgY29udGV4dCBjb3JyZWN0IG90aGVyd2lzZSBpdCB3aWxsIHRocm93IGEgZ2xvYmFsIGVycm9yLlxuICAgICAgICAgICAgLy8gU29tZSB2ZXJzaW9ucyBvZiBJLkUuIGhhdmUgZGlmZmVyZW50IHJ1bGVzIGZvciBjbGVhclRpbWVvdXQgdnMgc2V0VGltZW91dFxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZENsZWFyVGltZW91dC5jYWxsKHRoaXMsIG1hcmtlcik7XG4gICAgICAgIH1cbiAgICB9XG5cblxuXG59XG52YXIgcXVldWUgPSBbXTtcbnZhciBkcmFpbmluZyA9IGZhbHNlO1xudmFyIGN1cnJlbnRRdWV1ZTtcbnZhciBxdWV1ZUluZGV4ID0gLTE7XG5cbmZ1bmN0aW9uIGNsZWFuVXBOZXh0VGljaygpIHtcbiAgICBpZiAoIWRyYWluaW5nIHx8ICFjdXJyZW50UXVldWUpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIGlmIChjdXJyZW50UXVldWUubGVuZ3RoKSB7XG4gICAgICAgIHF1ZXVlID0gY3VycmVudFF1ZXVlLmNvbmNhdChxdWV1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcXVldWVJbmRleCA9IC0xO1xuICAgIH1cbiAgICBpZiAocXVldWUubGVuZ3RoKSB7XG4gICAgICAgIGRyYWluUXVldWUoKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGRyYWluUXVldWUoKSB7XG4gICAgaWYgKGRyYWluaW5nKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIHRpbWVvdXQgPSBydW5UaW1lb3V0KGNsZWFuVXBOZXh0VGljayk7XG4gICAgZHJhaW5pbmcgPSB0cnVlO1xuXG4gICAgdmFyIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB3aGlsZShsZW4pIHtcbiAgICAgICAgY3VycmVudFF1ZXVlID0gcXVldWU7XG4gICAgICAgIHF1ZXVlID0gW107XG4gICAgICAgIHdoaWxlICgrK3F1ZXVlSW5kZXggPCBsZW4pIHtcbiAgICAgICAgICAgIGlmIChjdXJyZW50UXVldWUpIHtcbiAgICAgICAgICAgICAgICBjdXJyZW50UXVldWVbcXVldWVJbmRleF0ucnVuKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcXVldWVJbmRleCA9IC0xO1xuICAgICAgICBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgfVxuICAgIGN1cnJlbnRRdWV1ZSA9IG51bGw7XG4gICAgZHJhaW5pbmcgPSBmYWxzZTtcbiAgICBydW5DbGVhclRpbWVvdXQodGltZW91dCk7XG59XG5cbnByb2Nlc3MubmV4dFRpY2sgPSBmdW5jdGlvbiAoZnVuKSB7XG4gICAgdmFyIGFyZ3MgPSBuZXcgQXJyYXkoYXJndW1lbnRzLmxlbmd0aCAtIDEpO1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMSkge1xuICAgICAgICBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG4gICAgICAgIH1cbiAgICB9XG4gICAgcXVldWUucHVzaChuZXcgSXRlbShmdW4sIGFyZ3MpKTtcbiAgICBpZiAocXVldWUubGVuZ3RoID09PSAxICYmICFkcmFpbmluZykge1xuICAgICAgICBydW5UaW1lb3V0KGRyYWluUXVldWUpO1xuICAgIH1cbn07XG5cbi8vIHY4IGxpa2VzIHByZWRpY3RpYmxlIG9iamVjdHNcbmZ1bmN0aW9uIEl0ZW0oZnVuLCBhcnJheSkge1xuICAgIHRoaXMuZnVuID0gZnVuO1xuICAgIHRoaXMuYXJyYXkgPSBhcnJheTtcbn1cbkl0ZW0ucHJvdG90eXBlLnJ1biA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLmZ1bi5hcHBseShudWxsLCB0aGlzLmFycmF5KTtcbn07XG5wcm9jZXNzLnRpdGxlID0gJ2Jyb3dzZXInO1xucHJvY2Vzcy5icm93c2VyID0gdHJ1ZTtcbnByb2Nlc3MuZW52ID0ge307XG5wcm9jZXNzLmFyZ3YgPSBbXTtcbnByb2Nlc3MudmVyc2lvbiA9ICcnOyAvLyBlbXB0eSBzdHJpbmcgdG8gYXZvaWQgcmVnZXhwIGlzc3Vlc1xucHJvY2Vzcy52ZXJzaW9ucyA9IHt9O1xuXG5mdW5jdGlvbiBub29wKCkge31cblxucHJvY2Vzcy5vbiA9IG5vb3A7XG5wcm9jZXNzLmFkZExpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3Mub25jZSA9IG5vb3A7XG5wcm9jZXNzLm9mZiA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUxpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlQWxsTGlzdGVuZXJzID0gbm9vcDtcbnByb2Nlc3MuZW1pdCA9IG5vb3A7XG5cbnByb2Nlc3MuYmluZGluZyA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmJpbmRpbmcgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcblxucHJvY2Vzcy5jd2QgPSBmdW5jdGlvbiAoKSB7IHJldHVybiAnLycgfTtcbnByb2Nlc3MuY2hkaXIgPSBmdW5jdGlvbiAoZGlyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmNoZGlyIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5wcm9jZXNzLnVtYXNrID0gZnVuY3Rpb24oKSB7IHJldHVybiAwOyB9O1xuIiwiLypqc2xpbnQgbm9kZTogdHJ1ZSAqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG5mdW5jdGlvbiBEYXRhVGFibGUgKHZhbHVlcykge1xyXG4gICAgdGhpcy52YWx1ZXMgPSBbXTtcclxuICAgIHRoaXMuY29sdW1ucyA9IFtdO1xyXG4gICAgdGhpcy51Y0NvbHVtbnMgPSBbXTtcclxuICAgIHRoaXMucm93U2VlZCA9IC0xO1xyXG5cclxuICAgIHRoaXMuY29sdW1ucy5wdXNoKFwiUm93XCIpO1xyXG4gICAgdGhpcy51Y0NvbHVtbnMucHVzaChcIlJPV1wiKTtcclxuXHJcbiAgICBpZiAodmFsdWVzICYmIHZhbHVlcy5sZW5ndGggPiAwKSB7XHJcblxyXG4gICAgICAgIHZhciBwcm9wcyA9IE9iamVjdC5rZXlzKHZhbHVlc1swXSk7XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSBwcm9wcy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcclxuICAgICAgICAgICAgdmFyIHByb3AgPSBwcm9wc1tpXTtcclxuICAgICAgICAgICAgaWYgKHRoaXMudWNDb2x1bW5zLmluZGV4T2YocHJvcC50b1VwcGVyQ2FzZSgpKSA8IDApIHtcclxuICAgICAgICAgICAgICAgIHRoaXMudWNDb2x1bW5zLnB1c2gocHJvcC50b1VwcGVyQ2FzZSgpKVxyXG4gICAgICAgICAgICAgICAgdGhpcy5jb2x1bW5zLnB1c2gocHJvcCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZvciAodmFyIHIgPSAwOyByIDwgdmFsdWVzLmxlbmd0aDsgcisrKSB7XHJcbiAgICAgICAgICAgIHRoaXMudmFsdWVzLnB1c2goW10pOyAvL3B1c2ggW3JdXHJcbiAgICAgICAgICAgIHRoaXMudmFsdWVzW3JdLnB1c2godGhpcy5yb3dTZWVkID0gcik7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBmb3IgKHZhciBjID0gMTsgYyA8IHRoaXMuY29sdW1ucy5sZW5ndGg7IGMrKykge1xyXG4gICAgICAgICAgICAgICAgdGhpcy52YWx1ZXNbcl0ucHVzaCh2YWx1ZXNbcl1bdGhpcy5jb2x1bW5zW2NdXSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgfVxyXG4gICAgXHJcbn1cclxuXHJcbkRhdGFUYWJsZS5wcm90b3R5cGUuY29udGFpbnNDb2x1bW4gPSBmdW5jdGlvbihjb2x1bW4pIHtcclxuICAgIHZhciBpbmRleCA9IHRoaXMuY29sdW1ucy5pbmRleE9mKGNvbHVtbik7XHJcbiAgICBpZiAoaW5kZXggPj0gMCkgcmV0dXJuIHRydWU7XHJcblxyXG4gICAgdmFyIHVjQ29sID0gY29sdW1uLnRvVXBwZXJDYXNlKCk7XHJcbiAgICBpbmRleCA9IHRoaXMudWNDb2x1bW5zLmluZGV4T2YodWNDb2wpO1xyXG4gICAgaWYgKGluZGV4ID49IDApIHJldHVybiB0cnVlO1xyXG5cclxuICAgIHJldHVybiBmYWxzZTtcclxufVxyXG5cclxuRGF0YVRhYmxlLnByb3RvdHlwZS5jb2x1bW5JbmRleCA9IGZ1bmN0aW9uKGNvbHVtbikge1xyXG5cclxuICAgIHZhciBpbmRleCA9IHRoaXMuY29sdW1ucy5pbmRleE9mKGNvbHVtbik7XHJcbiAgICBpZiAoaW5kZXggPj0gMCkgcmV0dXJuIGluZGV4O1xyXG5cclxuICAgIHZhciB1Y0NvbCA9IGNvbHVtbi50b1VwcGVyQ2FzZSgpO1xyXG4gICAgaW5kZXggPSB0aGlzLnVjQ29sdW1ucy5pbmRleE9mKHVjQ29sKTtcclxuICAgIGlmIChpbmRleCA+PSAwKSByZXR1cm4gaW5kZXg7XHJcblxyXG4gICAgcmV0dXJuIC0xO1xyXG59XHJcblxyXG5EYXRhVGFibGUucHJvdG90eXBlLmFkZENvbHVtbiA9IGZ1bmN0aW9uIChjb2x1bW4pIHtcclxuICAgIHRoaXMuaW5zdXJlQ29sdW1uKGNvbHVtbik7XHJcbn1cclxuXHJcbkRhdGFUYWJsZS5wcm90b3R5cGUuYWRkUm93ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgdmFyIHJvdyA9IFsrK3RoaXMucm93U2VlZF07XHJcbiAgICBmb3IgKHZhciBpID0gMTsgaSA8IHRoaXMuY29sdW1ucy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgIHJvdy5wdXNoKG51bGwpO1xyXG4gICAgfVxyXG4gICAgdGhpcy52YWx1ZXMucHVzaChyb3cpO1xyXG59XHJcblxyXG5EYXRhVGFibGUucHJvdG90eXBlLmluc3VyZUNvbHVtbiA9IGZ1bmN0aW9uIChjb2x1bW4pIHtcclxuICAgIGlmICghdGhpcy5jb250YWluc0NvbHVtbihjb2x1bW4pKSB7XHJcbiAgICAgICAgdGhpcy5jb2x1bW5zLnB1c2goY29sdW1uKTtcclxuICAgICAgICB0aGlzLnVjQ29sdW1ucy5wdXNoKGNvbHVtbi50b1VwcGVyQ2FzZSgpKVxyXG4gICAgICAgIGZvciAodmFyIHIgPSAwOyByIDwgdGhpcy52YWx1ZXMubGVuZ3RoOyByKyspXHJcbiAgICAgICAgICAgIHRoaXMudmFsdWVzW3JdLnB1c2gobnVsbCk7XHJcbiAgICB9XHJcbn1cclxuXHJcbkRhdGFUYWJsZS5wcm90b3R5cGUuaW5zdXJlUm93ID0gZnVuY3Rpb24gKHJvdykge1xyXG4gICAgaWYgKCF0aGlzLnZhbHVlcykgdGhpcy52YWx1ZXMgPSBbXTtcclxuICAgIHdoaWxlICh0aGlzLnZhbHVlcy5sZW5naHQgPD0gcm93KVxyXG4gICAgICAgIHRoaXMuYWRkUm93KCk7XHJcbn1cclxuXHJcbkRhdGFUYWJsZS5wcm90b3R5cGUuaW5zdXJlUm93Q29sdW1uID0gZnVuY3Rpb24gKGNvbHVtbiwgcm93KSB7XHJcbiAgICB0aGlzLmluc3VyZUNvbHVtbihjb2x1bW4pO1xyXG4gICAgaWYgKCF0aGlzLnZhbHVlcykgdGhpcy52YWx1ZXMgPSBbXTtcclxuICAgIHdoaWxlICh0aGlzLnZhbHVlcy5sZW5ndGggPD0gcm93KVxyXG4gICAgICAgIHRoaXMuYWRkUm93KCk7XHJcbn1cclxuXHJcbkRhdGFUYWJsZS5wcm90b3R5cGUuc2V0VmFsdWUgPSBmdW5jdGlvbihjb2x1bW4sIHJvdywgdmFsdWUpIHtcclxuICAgIFxyXG4gICAgdmFyIGNvbHVtbkluZGV4ID0gdGhpcy5jb2x1bW5JbmRleChjb2x1bW4pO1xyXG5cclxuICAgIGlmICghKGNvbHVtbkluZGV4ID49MCAmJiByb3cgPj0gMCAmJiByb3cgPCB0aGlzLnZhbHVlcy5sZW5ndGgpKSB7XHJcbiAgICAgICAgdGhpcy5pbnN1cmVSb3dDb2x1bW4oY29sdW1uLCByb3cpO1xyXG4gICAgICAgIGNvbHVtbkluZGV4ID0gdGhpcy5jb2x1bW5JbmRleChjb2x1bW4pO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB0aGlzLnZhbHVlc1tyb3ddW2NvbHVtbkluZGV4XSA9IHZhbHVlO1xyXG59XHJcblxyXG5EYXRhVGFibGUucHJvdG90eXBlLmdldFZhbHVlID0gZnVuY3Rpb24oY29sdW1uLCByb3cpIHtcclxuICAgIFxyXG4gICAgdmFyIGNvbHVtbkluZGV4ID0gdGhpcy5jb2x1bW5JbmRleChjb2x1bW4pO1xyXG5cclxuICAgIGlmICghKGNvbHVtbkluZGV4ID49MCAmJiByb3cgPj0gMCAmJiByb3cgPCB0aGlzLnZhbHVlcy5sZW5ndGgpKSB7XHJcbiAgICAgICAgaWYgKGNvbHVtbiA9PSBcInJvd1wiKSB7XHJcbiAgICAgICAgICAgIHRoaXMuaW5zdXJlUm93Q29sdW1uKGNvbHVtbiwgcm93KTtcclxuICAgICAgICAgICAgY29sdW1uSW5kZXggPSB0aGlzLmNvbHVtbkluZGV4KGNvbHVtbik7XHJcbiAgICAgICAgfSBlbHNlXHJcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICByZXR1cm4gdGhpcy52YWx1ZXNbcm93XVtjb2x1bW5JbmRleF07XHJcblxyXG59XHJcblxyXG5EYXRhVGFibGUucHJvdG90eXBlLnRvT2JqZWN0QXJyYXkgPSBmdW5jdGlvbigpIHtcclxuICAgIHZhciByZXQgPSBbXTtcclxuICAgIGlmICh0aGlzLnZhbHVlcykge1xyXG4gICAgICAgIGZvciAodmFyIHIgPSAwOyByIDwgdGhpcy52YWx1ZXMubGVuZ3RoOyByKyspIHtcclxuICAgICAgICAgICAgdmFyIG9iaiA9IHt9O1xyXG4gICAgICAgICAgICByZXQucHVzaChvYmopO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBjID0gMDsgYyA8IHRoaXMuY29sdW1ucy5sZW5ndGg7IGMrKykge1xyXG4gICAgICAgICAgICAgICAgb2JqW3RoaXMuY29sdW1uc1tjXV0gPSB0aGlzLnZhbHVlc1tyXVtjXTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiByZXQ7XHJcbn1cclxuXHJcbkRhdGFUYWJsZS5wcm90b3R5cGUuZ2V0Um93T2JqZWN0ID0gZnVuY3Rpb24gKHJvdykge1xyXG4gICAgaWYgKHRoaXMudmFsdWVzKSB7XHJcbiAgICAgICAgdmFyIG9iaiA9IHt9O1xyXG4gICAgICAgIGlmIChyb3cgPj0gMCAmJiByb3cgPD0gdGhpcy52YWx1ZXMubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIGZvciAodmFyIGMgPSAwOyBjIDwgdGhpcy5jb2x1bW5zLmxlbmd0aDsgYysrKSB7XHJcbiAgICAgICAgICAgICAgICBvYmpbdGhpcy5jb2x1bW5zW2NdXSA9IHRoaXMudmFsdWVzW3Jvd11bY107XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIG9iajtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gbnVsbDtcclxufVxyXG5cclxuRGF0YVRhYmxlLnByb3RvdHlwZS5nZXRSb3cgPSBmdW5jdGlvbiAocm93KSB7XHJcbiAgICBpZiAodGhpcy52YWx1ZXMpIHtcclxuICAgICAgICB2YXIgb2JqID0ge307XHJcbiAgICAgICAgaWYgKHJvdyA+PSAwICYmIHJvdyA8PSB0aGlzLnZhbHVlcy5sZW5ndGgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMudmFsdWVzW3Jvd10uc2xpY2UoMCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIG51bGw7XHJcbn1cclxuXHJcbkRhdGFUYWJsZS5wcm90b3R5cGUuZ2V0Q29sdW1uID0gZnVuY3Rpb24gKGNvbHVtbiwgcm93KSB7XHJcbiAgICB2YXIgcmV0VmFsdWVzID0gW107XHJcbiAgICBpZiAodGhpcy52YWx1ZXMpIHtcclxuICAgICAgICB2YXIgY29sdW1uSW5kZXggPSB0aGlzLmNvbHVtbkluZGV4KGNvbHVtbik7XHJcbiAgICAgICAgaWYgKGNvbHVtbkluZGV4ID49IDApIHtcclxuICAgICAgICAgICAgZm9yICh2YXIgciA9IDA7IHIgPCB0aGlzLnZhbHVlcy5sZW5ndGg7IHIrKykge1xyXG4gICAgICAgICAgICAgICAgcmV0VmFsdWVzLnB1c2godGhpcy52YWx1ZXNbcl1bY29sdW1uSW5kZXhdKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHJldFZhbHVlcy5yb3cgPSByb3c7XHJcbiAgICByZXR1cm4gcmV0VmFsdWVzO1xyXG59XHJcblxyXG5EYXRhVGFibGUucHJvdG90eXBlLmdldFBhcmVudFZhbHVlID0gZnVuY3Rpb24odmFsdWVDb2x1bW4sIHJvdykge1xyXG4gICAgdmFyIHBhcmVudElkID0gdGhpcy5nZXRWYWx1ZShcIl9wYXJlbnRcIiwgcm93KTtcclxuICAgIGlmIChwYXJlbnRJZCAhPSBudWxsKVxyXG4gICAgICAgIHJldHVybiB0aGlzLmZpbmRWYWx1ZXMoXCJfaWRcIiwgcGFyZW50SWQsIHZhbHVlQ29sdW1uLCAxKTtcclxuICAgIFxyXG4gICAgcGFyZW50SWQgPSB0aGlzLmdldFZhbHVlKFwiJHBhcmVudFwiLCByb3cpO1xyXG4gICAgaWYgKHBhcmVudElkICE9IG51bGwpXHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZmluZFZhbHVlcyhcIiRpZFwiLCBwYXJlbnRJZCwgdmFsdWVDb2x1bW4sIDEpO1xyXG5cclxuICAgIHJldHVybiBbXTtcclxufVxyXG5cclxuRGF0YVRhYmxlLnByb3RvdHlwZS5maW5kVmFsdWVzID0gZnVuY3Rpb24gKHF1ZXJ5Q29sdW1uLCBxdWVyeSwgdmFsdWVDb2x1bW4sIHRvcCkge1xyXG5cclxuICAgIHZhciBxdWVyeUNvbHVtbklkeCA9IDAsIHZhbHVlQ29sdW1uSWR4ID0gMDtcclxuICAgIHZhciByZXRBcnIgPSBbXTtcclxuXHJcbiAgICBpZiAoaXNOYU4ocXVlcnlDb2x1bW4pKVxyXG4gICAgICAgIHF1ZXJ5Q29sdW1uSWR4ID0gdGhpcy5jb2x1bW5JbmRleChxdWVyeUNvbHVtbik7XHJcbiAgICBlbHNlXHJcbiAgICAgICAgcXVlcnlDb2x1bW5JZHggPSBOdW1iZXIocXVlcnlDb2x1bW4pO1xyXG5cclxuICAgIGlmIChpc05hTih2YWx1ZUNvbHVtbikpXHJcbiAgICAgICAgdmFsdWVDb2x1bW5JZHggPSB0aGlzLmNvbHVtbkluZGV4KHZhbHVlQ29sdW1uKTtcclxuICAgIGVsc2VcclxuICAgICAgICB2YWx1ZUNvbHVtbklkeCA9IE51bWJlcih2YWx1ZUNvbHVtbik7XHJcblxyXG4gICAgZm9yICh2YXIgciA9IDA7IHIgPCB0aGlzLnZhbHVlcy5sZW5ndGg7IHIrKykge1xyXG5cclxuICAgICAgICB2YXIgY29sVmFsdWUgPSB0aGlzLnZhbHVlc1tyXVtxdWVyeUNvbHVtbklkeF07IFxyXG5cclxuICAgICAgICBpZiAoY29sVmFsdWUgPT0gcXVlcnkpXHJcbiAgICAgICAgICAgIHJldEFyci5wdXNoKHRoaXMudmFsdWVzW3JdW3ZhbHVlQ29sdW1uSWR4XSk7XHJcbiAgICAgICAgZWxzZSBpZiAodHlwZW9mIGNvbFZhbHVlID09PSAnc3RyaW5nJyB8fCBjb2xWYWx1ZSBpbnN0YW5jZW9mIFN0cmluZykge1xyXG4gICAgICAgICAgICBpZiAoY29sVmFsdWUuc3RhcnRzV2l0aChxdWVyeSkpXHJcbiAgICAgICAgICAgICAgICByZXRBcnIucHVzaCh0aGlzLnZhbHVlc1tyXVt2YWx1ZUNvbHVtbklkeF0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHRvcCAmJiB0b3AgPD0gcmV0QXJyLmxlbmd0aClcclxuICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiByZXRBcnI7XHJcblxyXG59XHJcblxyXG5EYXRhVGFibGUucHJvdG90eXBlLmdldFJhbmdlID0gZnVuY3Rpb24gKHN0YXJ0Q29sdW1uLCBlbmRDb2x1bW4sIHN0YXJSb3csIGVuZFJvdykge1xyXG4gICAgdmFyIHN0YXJ0Q29sdW1uSWR4ID0gMCwgZW5kQ29sdW1uSWR4ID0gMDtcclxuICAgIHZhciByZXRBcnIgPSBbXTtcclxuXHJcbiAgICBpZiAoaXNOYU4oc3RhcnRDb2x1bW4pKSBcclxuICAgICAgICBzdGFydENvbHVtbklkeCA9IHRoaXMuY29sdW1uSW5kZXgoc3RhcnRDb2x1bW4pO1xyXG4gICAgZWxzZVxyXG4gICAgICAgIHN0YXJ0Q29sdW1uSWR4ID0gTnVtYmVyKHN0YXJ0Q29sdW1uKTtcclxuXHJcbiAgICBpZiAoaXNOYU4oZW5kQ29sdW1uKSkgXHJcbiAgICAgICAgZW5kQ29sdW1uSWR4ID0gdGhpcy5jb2x1bW5JbmRleChlbmRDb2x1bW4pO1xyXG4gICAgZWxzZVxyXG4gICAgICAgIGVuZENvbHVtbklkeCA9IE51bWJlcihlbmRDb2x1bW4pO1xyXG5cclxuICAgIGlmIChzdGFydENvbHVtbklkeCA8IDApIHN0YXJ0Q29sdW1uSWR4ID0gMDtcclxuICAgIGlmIChlbmRDb2x1bW5JZHggPCAwKSBlbmRDb2x1bW5JZHggPSAwO1xyXG5cclxuICAgIC8vdHJ5IHRvIGdldCB0aGUgcmFuZ2UgY29ycmVjdHlcclxuICAgIC8vbm8gZ2FyYW50aWVzIGJlY2F1c2UgaSBoYXZlIGVhY2ggcm93IGFzIGFuIG9iamVjdFxyXG4gICAgLy9hbmQgb2JqZWN0IHByb3BlcnRpZXMgaGF2ZSBubyBnYXJhbnRpZWQgb3JkZXJcclxuICAgIGZvciAodmFyIHIgPSBzdGFyUm93OyByIDwgdGhpcy52YWx1ZXMubGVuZ3RoICYmIHIgPD0gZW5kUm93OyByKyspIHtcclxuICAgICAgICByZXRBcnIucHVzaChbXSk7XHJcbiAgICAgICAgZm9yICh2YXIgYyA9IHN0YXJ0Q29sdW1uSWR4OyBjIDwgdGhpcy5jb2x1bW5zLmxlbmd0aCAmJiBjIDw9IGVuZENvbHVtbklkeDsgYysrKSB7XHJcbiAgICAgICAgICAgIHJldEFycltyXS5wdXNoKHRoaXMudmFsdWVzW3JdW2NdKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gcmV0QXJyO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IERhdGFUYWJsZTtcclxuIiwiLypqc2xub2RlOiB0cnVlICovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnJlcXVpcmUoJ2pzLWFycmF5LWV4dGVuc2lvbnMnKTtcclxudmFyIG1vbWVudCA9IHJlcXVpcmUoJ21vbWVudCcpO1xyXG52YXIgcHJlZGljYXRlcyA9IHJlcXVpcmUoJy4vcHJlZGljYXRlcycpO1xyXG52YXIgZm5IZWxwZXJzID0gcmVxdWlyZSgnLi9mbkhlbHBlcnMnKTtcclxuXHJcbnZhciBmbiA9IHt9O1xyXG5tb2R1bGUuZXhwb3J0cyA9IGZuO1xyXG5cclxudmFyIHYgPSBmbkhlbHBlcnMuZ2V0VmFsdWU7XHJcblxyXG5mbi5GQUxTRSA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gZmFsc2U7IH1cclxuZm4uVFJVRSA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gdHJ1ZTsgfVxyXG5cclxuZm4uSUYgPSBmdW5jdGlvbihjb25kaXRpb24sIGVUaGVuLCBlRWxzZSkge1xyXG4gICAgaWYgKGNvbmRpdGlvbiAmJiBjb25kaXRpb24uY29uc3RydWN0b3IgPT09IEFycmF5KSB7XHJcbiAgICAgICAgdmFyIHJldCA9IFtdO1xyXG4gICAgICAgIGZvciAodmFyIHIgPSAwOyByIDwgY29uZGl0aW9uLmxlbmd0aDsgcisrKSB7XHJcbiAgICAgICAgICAgIHJldC5wdXNoKGZuLklGKChjb25kaXRpb25bcl0pLCB2KGVUaGVuLCByKSwgdihlRWxzZSwgcikpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHJldDtcclxuICAgIH0gZWxzZSBcclxuICAgICAgICByZXR1cm4gKGNvbmRpdGlvbikgPyBlVGhlbiA6IGVFbHNlO1xyXG59XHJcblxyXG5mbi5BTkQgPSBmdW5jdGlvbiAoYSwgYikge1xyXG4gICAgaWYgKEFycmF5LmFueUFycmF5KGEsYikpIHtcclxuICAgICAgICB2YXIgcmV0ID0gW107XHJcbiAgICAgICAgZm9yICh2YXIgciA9IDA7IHIgPCBBcnJheS5tYXhMZW5ndGgoYSwgYik7IHIrKykge1xyXG4gICAgICAgICAgICByZXQucHVzaChmbi5BTkQodihhLHIpLCB2KGIscikpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHJldDtcclxuICAgIH0gZWxzZVxyXG4gICAgICAgIHJldHVybiBhICYmIGI7XHJcbn07XHJcblxyXG5mbi5PUiA9IGZ1bmN0aW9uIChhLCBiKSB7XHJcbiAgICBpZiAoKGEgJiYgYS5jb25zdHJ1Y3RvciA9PT0gQXJyYXkpIHx8IChiICYmIGIuY29uc3RydWN0b3IgPT09IEFycmF5KSkge1xyXG4gICAgICAgIHZhciByZXQgPSBbXTtcclxuICAgICAgICBmb3IgKHZhciByID0gMDsgciA8IEFycmF5Lm1heExlbmd0aChhLCBiKTsgcisrKSB7XHJcbiAgICAgICAgICAgIHJldC5wdXNoKGZuLk9SKHYoYSxyKSwgdihiLHIpKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiByZXQ7XHJcbiAgICB9IGVsc2VcclxuICAgICAgICByZXR1cm4gYSB8fCBiO1xyXG59O1xyXG5cclxuZm4uTk9UID0gZnVuY3Rpb24gKGEpIHtcclxuICAgIGlmIChhICYmIGEuY29uc3RydWN0b3IgPT09IEFycmF5KSB7XHJcbiAgICAgICAgdmFyIHJldCA9IFtdO1xyXG4gICAgICAgIGZvciAodmFyIHIgPSAwOyByIDwgYS5sZW5ndGg7IHIrKykge1xyXG4gICAgICAgICAgICByZXQucHVzaChmbi5OT1QodihhLHIpKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiByZXQ7XHJcbiAgICB9IGVsc2VcclxuICAgICAgICByZXR1cm4gIWE7IFxyXG59O1xyXG5cclxuZm4uRVEgPSBmdW5jdGlvbiAoYSxiKSB7XHJcbiAgICBpZiAoKGEgJiYgYS5jb25zdHJ1Y3RvciA9PT0gQXJyYXkpIHx8IChiICYmIGIuY29uc3RydWN0b3IgPT09IEFycmF5KSkge1xyXG4gICAgICAgIHZhciByZXQgPSBbXTtcclxuICAgICAgICBmb3IgKHZhciByID0gMDsgciA8IEFycmF5Lm1heExlbmd0aChhLCBiKTsgcisrKSB7XHJcbiAgICAgICAgICAgIHJldC5wdXNoKGZuLkVRKHYoYSxyKSwgdihiLHIpKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiByZXQ7XHJcbiAgICB9IGVsc2VcclxuICAgICAgICByZXR1cm4gYSA9PSBiO1xyXG59XHJcblxyXG5mbi5ORVEgPSBmdW5jdGlvbiAoYSxiKSB7XHJcbiAgICBpZiAoKGEgJiYgYS5jb25zdHJ1Y3RvciA9PT0gQXJyYXkpIHx8IChiICYmIGIuY29uc3RydWN0b3IgPT09IEFycmF5KSkge1xyXG4gICAgICAgIHZhciByZXQgPSBbXTtcclxuICAgICAgICBmb3IgKHZhciByID0gMDsgciA8IEFycmF5Lm1heExlbmd0aChhLCBiKTsgcisrKSB7XHJcbiAgICAgICAgICAgIHJldC5wdXNoKGZuLk5FUSh2KGEsciksIHYoYixyKSkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gcmV0O1xyXG4gICAgfSBlbHNlXHJcbiAgICAgICAgcmV0dXJuIGEgIT0gYjtcclxufVxyXG5cclxuZm4uR1QgPSBmdW5jdGlvbiAoYSxiKSB7XHJcbiAgICBpZiAoKGEgJiYgYS5jb25zdHJ1Y3RvciA9PT0gQXJyYXkpIHx8IChiICYmIGIuY29uc3RydWN0b3IgPT09IEFycmF5KSkge1xyXG4gICAgICAgIHZhciByZXQgPSBbXTtcclxuICAgICAgICBmb3IgKHZhciByID0gMDsgciA8IEFycmF5Lm1heExlbmd0aChhLCBiKTsgcisrKSB7XHJcbiAgICAgICAgICAgIHJldC5wdXNoKGZuLkdUKHYoYSxyKSwgdihiLHIpKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiByZXQ7XHJcbiAgICB9IGVsc2VcclxuICAgICAgICByZXR1cm4gYSA+IGI7XHJcbn1cclxuXHJcbmZuLkdURSA9IGZ1bmN0aW9uIChhLGIpIHtcclxuICAgIGlmICgoYSAmJiBhLmNvbnN0cnVjdG9yID09PSBBcnJheSkgfHwgKGIgJiYgYi5jb25zdHJ1Y3RvciA9PT0gQXJyYXkpKSB7XHJcbiAgICAgICAgdmFyIHJldCA9IFtdO1xyXG4gICAgICAgIGZvciAodmFyIHIgPSAwOyByIDwgQXJyYXkubWF4TGVuZ3RoKGEsIGIpOyByKyspIHtcclxuICAgICAgICAgICAgcmV0LnB1c2goZm4uR1RFKHYoYSxyKSwgdihiLHIpKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiByZXQ7XHJcbiAgICB9IGVsc2VcclxuICAgICAgICByZXR1cm4gYSA+PSBiO1xyXG59XHJcblxyXG5mbi5TVCA9IGZ1bmN0aW9uIChhLGIpIHtcclxuICAgIGlmICgoYSAmJiBhLmNvbnN0cnVjdG9yID09PSBBcnJheSkgfHwgKGIgJiYgYi5jb25zdHJ1Y3RvciA9PT0gQXJyYXkpKSB7XHJcbiAgICAgICAgdmFyIHJldCA9IFtdO1xyXG4gICAgICAgIGZvciAodmFyIHIgPSAwOyByIDwgQXJyYXkubWF4TGVuZ3RoKGEsIGIpOyByKyspIHtcclxuICAgICAgICAgICAgcmV0LnB1c2goZm4uU1QodihhLHIpLCB2KGIscikpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHJldDtcclxuICAgIH0gZWxzZVxyXG4gICAgICAgIHJldHVybiBhIDwgYjtcclxufVxyXG5cclxuZm4uU1RFID0gZnVuY3Rpb24gKGEsYikge1xyXG4gICAgaWYgKChhICYmIGEuY29uc3RydWN0b3IgPT09IEFycmF5KSB8fCAoYiAmJiBiLmNvbnN0cnVjdG9yID09PSBBcnJheSkpIHtcclxuICAgICAgICB2YXIgcmV0ID0gW107XHJcbiAgICAgICAgZm9yICh2YXIgciA9IDA7IHIgPCBBcnJheS5tYXhMZW5ndGgoYSwgYik7IHIrKykge1xyXG4gICAgICAgICAgICByZXQucHVzaChmbi5TVEUodihhLHIpLCB2KGIscikpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHJldDtcclxuICAgIH0gZWxzZVxyXG4gICAgICAgIHJldHVybiBhIDw9IGI7XHJcbn1cclxuXHJcbmZuLkFERCA9IGZ1bmN0aW9uIChhLGIpIHtcclxuICAgIGlmICgoYSAmJiBhLmNvbnN0cnVjdG9yID09PSBBcnJheSkgfHwgKGIgJiYgYi5jb25zdHJ1Y3RvciA9PT0gQXJyYXkpKSB7XHJcbiAgICAgICAgdmFyIHJldCA9IFtdO1xyXG4gICAgICAgIGZvciAodmFyIHIgPSAwOyByIDwgQXJyYXkubWF4TGVuZ3RoKGEsIGIpOyByKyspIHtcclxuICAgICAgICAgICAgcmV0LnB1c2goZm4uQUREKHYoYSxyKSwgdihiLHIpKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiByZXQ7XHJcbiAgICB9IGVsc2VcclxuICAgICAgICByZXR1cm4gYSArIGI7XHJcbn1cclxuXHJcbmZuLlNVQlRSID0gZnVuY3Rpb24gKGEsYikge1xyXG4gICAgaWYgKChhICYmIGEuY29uc3RydWN0b3IgPT09IEFycmF5KSB8fCAoYiAmJiBiLmNvbnN0cnVjdG9yID09PSBBcnJheSkpIHtcclxuICAgICAgICB2YXIgcmV0ID0gW107XHJcbiAgICAgICAgZm9yICh2YXIgciA9IDA7IHIgPCBBcnJheS5tYXhMZW5ndGgoYSwgYik7IHIrKykge1xyXG4gICAgICAgICAgICByZXQucHVzaChmbi5TVUJUUih2KGEsciksIHYoYixyKSkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gcmV0O1xyXG4gICAgfSBlbHNlXHJcbiAgICAgICAgcmV0dXJuIGEgLSBiO1xyXG59XHJcblxyXG5mbi5NVUxUID0gZnVuY3Rpb24gKGEsYikge1xyXG4gICAgaWYgKChhICYmIGEuY29uc3RydWN0b3IgPT09IEFycmF5KSB8fCAoYiAmJiBiLmNvbnN0cnVjdG9yID09PSBBcnJheSkpIHtcclxuICAgICAgICB2YXIgcmV0ID0gW107XHJcbiAgICAgICAgZm9yICh2YXIgciA9IDA7IHIgPCBBcnJheS5tYXhMZW5ndGgoYSwgYik7IHIrKykge1xyXG4gICAgICAgICAgICByZXQucHVzaChmbi5NVUxUKHYoYSxyKSwgdihiLHIpKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiByZXQ7XHJcbiAgICB9IGVsc2VcclxuICAgICAgICByZXR1cm4gYSAqIGI7XHJcbn1cclxuXHJcbmZuLkRJViA9IGZ1bmN0aW9uIChhLGIpIHtcclxuICAgIGlmICgoYSAmJiBhLmNvbnN0cnVjdG9yID09PSBBcnJheSkgfHwgKGIgJiYgYi5jb25zdHJ1Y3RvciA9PT0gQXJyYXkpKSB7XHJcbiAgICAgICAgdmFyIHJldCA9IFtdO1xyXG4gICAgICAgIGZvciAodmFyIHIgPSAwOyByIDwgQXJyYXkubWF4TGVuZ3RoKGEsIGIpOyByKyspIHtcclxuICAgICAgICAgICAgcmV0LnB1c2goZm4uRElWKHYoYSxyKSwgdihiLHIpKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiByZXQ7XHJcbiAgICB9IGVsc2VcclxuICAgICAgICByZXR1cm4gYSAvIGI7XHJcbn1cclxuXHJcbmZuLlBPVyA9IGZ1bmN0aW9uIChhLGIpIHtcclxuICAgIGlmICgoYSAmJiBhLmNvbnN0cnVjdG9yID09PSBBcnJheSkgfHwgKGIgJiYgYi5jb25zdHJ1Y3RvciA9PT0gQXJyYXkpKSB7XHJcbiAgICAgICAgdmFyIHJldCA9IFtdO1xyXG4gICAgICAgIGZvciAodmFyIHIgPSAwOyByIDwgQXJyYXkubWF4TGVuZ3RoKGEsIGIpOyByKyspIHtcclxuICAgICAgICAgICAgcmV0LnB1c2goZm4uUE9XKHYoYSxyKSwgdihiLHIpKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiByZXQ7XHJcbiAgICB9IGVsc2VcclxuICAgICAgICByZXR1cm4gTWF0aC5wb3coYSwgYik7XHJcbn1cclxuXHJcbmZuLlBlcmNlbnQgPSBmdW5jdGlvbiAoYSkge1xyXG4gICAgaWYgKChhICYmIGEuY29uc3RydWN0b3IgPT09IEFycmF5KSkge1xyXG4gICAgICAgIHZhciByZXQgPSBbXTtcclxuICAgICAgICBmb3IgKHZhciByID0gMDsgciA8IGEubGVuZ3RoOyByKyspIHtcclxuICAgICAgICAgICAgcmV0LnB1c2goZm4uUGVyY2VudCh2KGEsciksIDEwMC4wKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiByZXQ7XHJcbiAgICB9IGVsc2VcclxuICAgICAgICByZXR1cm4gYSAvIDEwMC4wO1xyXG59IiwiLypqc2xpbnQgbm9kZTogdHJ1ZSAqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIgRGF0YVRhYmxlID0gcmVxdWlyZSgnLi9kYXRhVGFibGUnKTtcclxudmFyIGJ1aWx0SW5GdW5jdGlvbnMgPSByZXF1aXJlKCcuL2Z1bmN0aW9ucycpO1xyXG52YXIgYmFzZUZ1bmN0aW9ucyA9IHJlcXVpcmUoJy4vYmFzZUZ1bmN0aW9ucycpO1xyXG52YXIgZGF0ZUZ1bmN0aW9ucyA9IHJlcXVpcmUoJy4vZGF0ZUZ1bmN0aW9ucycpO1xyXG52YXIgbWF0aEZ1bmN0aW9ucyA9IHJlcXVpcmUoJy4vbWF0aEZ1bmN0aW9ucycpXHJcbnZhciBkb21haW5GdW5jdGlvbnMgPSByZXF1aXJlKCcuL2RvbWFpbkZ1bmN0aW9ucycpXHJcblxyXG5mdW5jdGlvbiBtZXJnZUZ1bmN0aW9ucyhmbiwgZnVuY3Rpb25zKSB7XHJcbiAgICBpZiAoZnVuY3Rpb25zKSB7XHJcbiAgICAgICAgdmFyIGZuY3MgPSBPYmplY3Qua2V5cyhmdW5jdGlvbnMpO1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBsID0gZm5jcy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcclxuICAgICAgICAgICAgdmFyIGZuYyA9IGZ1bmN0aW9uc1tmbmNzW2ldXVxyXG4gICAgICAgICAgICBpZih0eXBlb2YgZm5jID09PSBcImZ1bmN0aW9uXCIpIHtcclxuICAgICAgICAgICAgICAgIGZuW2ZuY3NbaV1dID0gZm5jO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIGZuO1xyXG59XHJcblxyXG5mdW5jdGlvbiBDb250ZXh0KGdsb2JhbHMsIHRhYmxlcywgZnVuY3Rpb25zKSB7XHJcblxyXG4gICAgaWYgKHR5cGVvZiBnbG9iYWxzID09PSBcIm9iamVjdFwiICYmIGdsb2JhbHMgaW5zdGFuY2VvZiBBcnJheSkge1xyXG4gICAgICAgIGdsb2JhbHMgPSAoZ2xvYmFscy5sZW5ndGggPiAwKSA/IGdsb2JhbHNbMF0gOiB7fTtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLmcgPSBnbG9iYWxzO1xyXG4gICAgdGhpcy50ID0ge307XHJcbiAgICB0aGlzLmZuID0gYnVpbHRJbkZ1bmN0aW9ucztcclxuICAgIHRoaXMuZGVmYXVsdFRhYmxlID0gbnVsbDtcclxuXHJcbiAgICBtZXJnZUZ1bmN0aW9ucyh0aGlzLmZuLCBiYXNlRnVuY3Rpb25zKTtcclxuICAgIG1lcmdlRnVuY3Rpb25zKHRoaXMuZm4sIGRhdGVGdW5jdGlvbnMpO1xyXG4gICAgbWVyZ2VGdW5jdGlvbnModGhpcy5mbiwgbWF0aEZ1bmN0aW9ucyk7XHJcbiAgICBtZXJnZUZ1bmN0aW9ucyh0aGlzLmZuLCBkb21haW5GdW5jdGlvbnMpO1xyXG5cclxuICAgIGlmIChmdW5jdGlvbnMpIHtcclxuICAgICAgICBtZXJnZUZ1bmN0aW9ucyh0aGlzLmZuLCBmdW5jdGlvbnMpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICh0YWJsZXMpIHtcclxuICAgICAgICB2YXIgbmFtZXMgPSBPYmplY3Qua2V5cyh0YWJsZXMpO1xyXG4gICAgICAgIGZvciAodmFyIG4gPSAwOyBuIDwgbmFtZXMubGVuZ3RoOyBuKyspIHtcclxuICAgICAgICAgICAgdmFyIG5hbWUgPSBuYW1lc1tuXTtcclxuICAgICAgICAgICAgaWYgKG5hbWUudG9Mb3dlckNhc2UoKSA9PSBcImRlZmF1bHR0YWJsZVwiKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmRlZmF1bHRUYWJsZSA9IHRhYmxlc1tuYW1lXTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHZhciB0YWJsZSA9IHRhYmxlc1tuYW1lXTtcclxuICAgICAgICAgICAgICAgIGlmICh0YWJsZS5jb25zdHJ1Y3RvciA9PT0gRGF0YVRhYmxlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50W25hbWVdID0gdGFibGU7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHRhYmxlLmNvbnN0cnVjdG9yID09PSBBcnJheSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudFtuYW1lXSA9IG5ldyBEYXRhVGFibGUodGFibGUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuaW5qZWN0b3IgPSAge1xyXG4gICAgICAgIGRlcGVuZGVuY2llczogT2JqZWN0LmFzc2lnbih7fSwgdGhpcy50LCB0aGlzLmcpLFxyXG4gICAgICAgIC8vIHJlZ2lzdGVyOiBmdW5jdGlvbihrZXksIHZhbHVlKSB7XHJcbiAgICAgICAgLy8gICAgIHRoaXMuZGVwZW5kZW5jaWVzW2tleV0gPSB2YWx1ZTtcclxuICAgICAgICAvLyB9LFxyXG4gICAgICAgIHJlc29sdmU6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICB2YXIgZnVuYywgZGVwRGVmLCBkZXBzLCBzY29wZSwgYXJncyA9IFtdLCBzZWxmID0gdGhpcztcclxuICAgICAgICAgICAgaWYgKHR5cGVvZiBhcmd1bWVudHNbMF0gPT09IFwiZnVuY3Rpb25cIikge1xyXG4gICAgICAgICAgICAgICAgZnVuYyA9IGFyZ3VtZW50c1swXTsgXHJcbiAgICAgICAgICAgICAgICBkZXBEZWYgPSAoZnVuYy5kZXBlbmRlbmNpZXMgJiYgdHlwZW9mIGZ1bmMuZGVwZW5kZW5jaWVzID09PSAnc3RyaW5nJykgPyBmdW5jLmRlcGVuZGVuY2llcyA6IG51bGw7XHJcbiAgICAgICAgICAgICAgICBkZXBEZWYgPSBkZXBEZWYgfHwgKGZ1bmMuZGVwcyAmJiB0eXBlb2YgZnVuYy5kZXBzID09PSAnc3RyaW5nJykgPyBmdW5jLmRlcHMgOiBudWxsO1xyXG4gICAgICAgICAgICAgICAgZGVwcyA9IG51bGw7XHJcbiAgICAgICAgICAgICAgICBzY29wZSA9IGFyZ3VtZW50c1sxXSB8fCB7fTtcclxuICAgICAgICAgICAgICAgIGlmIChkZXBEZWYpIHtcclxuICAgICAgICAgICAgICAgICAgICBkZXBzID0gZGVwRGVmLnJlcGxhY2UoLyAvZywgJycpLnNwbGl0KCcsJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgYSA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvcih2YXIgaT0wOyBpPGRlcHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBkID0gZGVwc1tpXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFyZ3MucHVzaChzZWxmLmRlcGVuZGVuY2llc1tkXSAmJiBkICE9ICcnID8gc2VsZi5kZXBlbmRlbmNpZXNbZF0gOiBhLnNoaWZ0KCkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmdW5jLmFwcGx5KHNjb3BlIHx8IHt9LCBhcmdzKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYXJndW1lbnRzWzBdOyBcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aHJvdyBcImluamVjdG9yLnJlc29sdmUgZXhwZWN0cyBwYXJhbWV0ZXIgJzAnIHRvIGJlIGEgZnVuY3Rpb25cIjsgICAgICAgIFxyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuQ29udGV4dC5wcm90b3R5cGUudGFibGUgPSBmdW5jdGlvbiAobmFtZSkge1xyXG4gICAgaWYgKCF0aGlzLnRbbmFtZV0pIHtcclxuICAgICAgICBpZiAobmFtZSA9PT0gXCJ0YWJsZVwiKSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLmRlZmF1bHRUYWJsZSAmJiB0aGlzLnRbdGhpcy5kZWZhdWx0VGFibGVdKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnRbXCJ0YWJsZVwiXSA9IHRoaXMudFt0aGlzLmRlZmF1bHRUYWJsZV07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKHRoaXMudCk7XHJcbiAgICAgICAgICAgICAgICBpZiAoa2V5cyAmJiBrZXlzLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnRbXCJ0YWJsZVwiXSA9IHRoaXMudFtrZXlzWzBdXTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICBpZiAoIXRoaXMudFtuYW1lXSlcclxuICAgICAgICAgICAgdGhpcy50W25hbWVdID0gbmV3IERhdGFUYWJsZShbXSk7IFxyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoaXMudFtuYW1lXTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gQ29udGV4dDsiLCIvKmpzbG5vZGU6IHRydWUgKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxucmVxdWlyZSgnanMtYXJyYXktZXh0ZW5zaW9ucycpO1xyXG52YXIgbW9tZW50ID0gcmVxdWlyZSgnbW9tZW50Jyk7XHJcbnZhciBwcmVkaWNhdGVzID0gcmVxdWlyZSgnLi9wcmVkaWNhdGVzJyk7XHJcbnZhciBmbkhlbHBlcnMgPSByZXF1aXJlKCcuL2ZuSGVscGVycycpO1xyXG5cclxudmFyIGZuID0ge307XHJcbm1vZHVsZS5leHBvcnRzID0gZm47XHJcblxyXG52YXIgdiA9IGZuSGVscGVycy5nZXRWYWx1ZTtcclxuXHJcbmZ1bmN0aW9uIHRvT0FEYXRlIChkYXRlKSB7XHJcbiAgICBkYXRlID0gbW9tZW50LnV0YyhkYXRlKS50b0RhdGUoKTtcclxuICAgIHJldHVybiAoZGF0ZSAtIG5ldyBEYXRlKERhdGUuVVRDKDE4OTksIDExLCAzMCkpKSAvICgyNCAqIDYwICogNjAgKiAxMDAwKVxyXG59XHJcblxyXG5mdW5jdGlvbiBpc0xhc3REYXlPZkZlYnJ1YXJ5KGRhdGUpIHtcclxuICAgIGRhdGUgPSBtb21lbnQudXRjKGRhdGUpO1xyXG4gICAgcmV0dXJuIGRhdGUubW9udGgoKSA9PSAyICYmIGRhdGUuZGF5KCkgPT0gZGF0ZS5kYXlzSW5Nb250aCgpO1xyXG59XHJcblxyXG5cclxuZm4uREFURSA9IGZ1bmN0aW9uKHllYXIsIG1vbnRoLCBkYXksIGhvdXIsIG1pbnV0ZSwgc2Vjb25kKSB7XHJcbiAgICBpZiAoIXllYXIpIHJldHVybiBtb21lbnQudXRjKCkudG9EYXRlKCk7XHJcbiAgICBlbHNlIGlmICghbW9udGgpIHtcclxuICAgICAgICBpZiAoQXJyYXkuYW55QXJyYXkoeWVhcikpIHtcclxuICAgICAgICAgICAgdmFyIGYgPSBmdW5jdGlvbiAoeWVhcikge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG1vbWVudC51dGMoeWVhcikudG9EYXRlKCk7ICAgIFxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICByZXR1cm4gZi5jcm9zc0FwcGx5KHllYXIpO1xyXG4gICAgICAgIH0gZWxzZVxyXG4gICAgICAgICAgICByZXR1cm4gbW9tZW50LnV0Yyh5ZWFyKS50b0RhdGUoKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoQXJyYXkuYW55QXJyYXkoeWVhciwgbW9udGgsIGRheSwgaG91ciwgbWludXRlLCBzZWNvbmQpKSB7XHJcbiAgICAgICAgdmFyIGYgPSBmdW5jdGlvbiAoeWVhciwgbW9udGgsIGRheSwgaG91ciwgbWludXRlLCBzZWNvbmQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIG1vbWVudC51dGMoe3llYXI6IHllYXIsIG1vbnRoOiBtb250aCAtIDEsIGRheTogZGF5LCBtaW51dGU6IG1pbnV0ZSwgc2Vjb25kOiBzZWNvbmR9KS50b0RhdGUoKTsgICAgICAgICAgICBcclxuICAgICAgICB9O1xyXG4gICAgICAgIHJldHVybiBmLmNyb3NzQXBwbHkoeWVhciwgbW9udGgsIGRheSwgaG91ciwgbWludXRlLCBzZWNvbmQpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBtb21lbnQudXRjKHt5ZWFyOiB5ZWFyLCBtb250aDogbW9udGggLSAxLCBkYXk6IGRheSwgbWludXRlOiBtaW51dGUsIHNlY29uZDogc2Vjb25kfSkudG9EYXRlKCk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIF9kYXRlVmFsdWUgKGRhdGUpIHtcclxuICAgIHJldHVybiB0b09BRGF0ZShkYXRlKTsgXHJcbn1cclxuXHJcbmZuLkRBVEVWQUxVRSA9IGZ1bmN0aW9uKGRhdGUpIHtcclxuICAgIGlmIChBcnJheS5hbnlBcnJheShkYXRlKSkge1xyXG4gICAgICAgIHJldHVybiBfZGF0ZVZhbHVlLmNyb3NzQXBwbHkoeWVhcik7XHJcbiAgICB9IFxyXG4gICAgcmV0dXJuIF9kYXRlVmFsdWUoZGF0ZSk7IFxyXG59XHJcblxyXG5mdW5jdGlvbiBfZGF5czM2MCAoc3RhcnREYXRlLCBlbmREYXRlLCB4RXVyb3BlYW4pIHtcclxuICAgIGlmICh4RXVyb3BlYW4gPT09IHVuZGVmaW5lZCkgeEV1cm9wZWFuID0gdHJ1ZTtcclxuXHJcbiAgICBzdGFydERhdGUgPSBtb21lbnQudXRjKHN0YXJ0RGF0ZSk7XHJcbiAgICBlbmREYXRlID0gbW9tZW50LnV0YyhlbmREYXRlKTtcclxuXHJcbiAgICB2YXIgU3RhcnREYXkgPSBzdGFydERhdGUuZGF5KCk7XHJcbiAgICB2YXIgU3RhcnRNb250aCA9IHN0YXJ0RGF0ZS5tb250aCgpO1xyXG4gICAgdmFyIFN0YXJ0WWVhciA9IHN0YXJ0RGF0ZS55ZWFyKCk7XHJcbiAgICB2YXIgRW5kRGF5ID0gZW5kRGF0ZS5kYXkoKTtcclxuICAgIHZhciBFbmRNb250aCA9IGVuZERhdGUubW9udGgoKTtcclxuICAgIHZhciBFbmRZZWFyID0gZW5kRGF0ZS55ZWFyKCk7XHJcblxyXG4gICAgaWYgKFN0YXJ0RGF5ID09IDMxIHx8IGlzTGFzdERheU9mRmVicnVhcnkoc3RhcnREYXRlKSkge1xyXG4gICAgICAgIFN0YXJ0RGF5ID0gMzA7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKFN0YXJ0RGF5ID09IDMwICYmIEVuZERheSA9PSAzMSkge1xyXG4gICAgICAgIEVuZERheSA9IDMwO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiAoKEVuZFllYXIgLSBTdGFydFllYXIpICogMzYwKSArICgoRW5kTW9udGggLSBTdGFydE1vbnRoKSAqIDMwKSArIChFbmREYXkgLSBTdGFydERheSk7XHJcbn1cclxuXHJcbmZuLkRBWVMzNjAgPSBmdW5jdGlvbihzdGFydERhdGUsIGVuZERhdGUsIHhFdXJvcGVhbikge1xyXG4gICAgaWYgKEFycmF5LmFueUFycmF5KHN0YXJ0RGF0ZSwgZW5kRGF0ZSkpIHtcclxuICAgICAgICByZXR1cm4gX2RheXMzNjAuY3Jvc3NBcHBseShzdGFydERhdGUsIGVuZERhdGUsIHhFdXJvcGVhbik7XHJcbiAgICB9IGVsc2VcclxuICAgICAgICByZXR1cm4gX2RheXMzNjAoc3RhcnREYXRlLCBlbmREYXRlLCB4RXVyb3BlYW4pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBfZURhdGUoZGF0ZSwgbW9udGhzKSB7XHJcbiAgICByZXR1cm4gbW9tZW50LnV0YyhkYXRlKS5hZGQobW9udGhzLCAnTScpLnRvRGF0ZSgpO1xyXG59XHJcblxyXG5mbi5FREFURSA9IGZ1bmN0aW9uKGRhdGUsIG1vbnRocykgeyBcclxuICAgICBpZiAoQXJyYXkuYW55QXJyYXkoZGF0ZSwgbW9udGgpKVxyXG4gICAgICAgIHJldHVybiBfZURhdGUuY3Jvc3NBcHBseShkYXRlLCBtb250aHMpO1xyXG4gICAgZWxzZVxyXG4gICAgICAgIHJldHVybiBfZURhdGUoZGF0ZSwgbW9udGhzKTtcclxufVxyXG5cclxuZnVuY3Rpb24gX2VvTW9udGgoZGF0ZSwgbW9udGhzKSB7XHJcbiAgICBpZiAoZGF0ZSA9PSBudWxsKSBkYXRlID0gbmV3IERhdGUoKTtcclxuICAgIGlmIChtb250aHMgPT0gbnVsbCB8fCBpc05hTihtb250aHMpKSBtb250aHMgPSAwOyBcclxuICAgIHZhciBkcmVmID0gbW9tZW50LnV0YyhkYXRlKS5hZGQobW9udGhzLCAnTScpLmFkZCgxLCAnTScpO1xyXG4gICAgcmV0dXJuIG1vbWVudC51dGMoe3llYXI6ZHJlZi55ZWFyLCBtb250aDogZHJlZi5tb250aCwgZGF5OiAxfSkuYWRkKC0xLCAnZCcpLnRvRGF0ZSgpO1xyXG59XHJcblxyXG5mbi5FT01PTlRIID0gZnVuY3Rpb24oZGF0ZSwgbW9udGhzKSB7XHJcbiAgICBpZiAoQXJyYXkuYW55QXJyYXkoZGF0ZSkpIHtcclxuICAgICAgICByZXR1cm4gX2VvTW9udGguY3Jvc3NBcHBseShkYXRlLCBtb250aHMpO1xyXG4gICAgfSBlbHNlXHJcbiAgICAgICAgcmV0dXJuIF9lb01vbnRoKGRhdGUsIG1vbnRocyk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIF9kYXRlUGFydCAoZGF0ZSwgdHlwZSkge1xyXG4gICAgaWYgKHR5cGUgPT0gXCJoXCIpIHJldHVybiBtb21lbnQudXRjKGRhdGUpLmhvdXIoKTtcclxuICAgIGVsc2UgaWYgKHR5cGUgPT0gXCJtXCIpIHJldHVybiBtb21lbnQudXRjKGRhdGUpLm1pbnV0ZSgpO1xyXG4gICAgZWxzZSBpZiAodHlwZSA9PSBcIk1cIikgcmV0dXJuIG1vbWVudC51dGMoZGF0ZSkubW9udGgoKTtcclxuICAgIGVsc2UgaWYgKHR5cGUgPT0gXCJkXCIpIHJldHVybiBtb21lbnQudXRjKGRhdGUpLmRhdGUoKTtcclxuICAgIGVsc2UgaWYgKHR5cGUgPT0gXCJzXCIpIHJldHVybiBtb21lbnQudXRjKGRhdGUpLnNlY29uZCgpO1xyXG4gICAgZWxzZSBpZiAodHlwZSA9PSBcInlcIikgcmV0dXJuIG1vbWVudC51dGMoZGF0ZSkueWVhcigpO1xyXG4gICAgZWxzZSByZXR1cm4gMDtcclxufVxyXG5cclxuZm4uSE9VUiA9IGZ1bmN0aW9uKGRhdGUpIHsgIFxyXG4gICAgaWYgKEFycmF5LmFueUFycmF5KGRhdGUpKSB7XHJcbiAgICAgICAgcmV0dXJuIF9kYXRlUGFydC5jcm9zc0FwcGx5KGRhdGUsICdoJyk7XHJcbiAgICB9IGVsc2VcclxuICAgICAgICByZXR1cm4gX2RhdGVQYXJ0KGRhdGUsICdoJyk7XHJcbn1cclxuXHJcbmZuLk1JTlVURSA9IGZ1bmN0aW9uKGRhdGUpIHsgIFxyXG4gICAgaWYgKEFycmF5LmFueUFycmF5KGRhdGUpKSB7XHJcbiAgICAgICAgcmV0dXJuIF9kYXRlUGFydC5jcm9zc0FwcGx5KGRhdGUsICdtJyk7XHJcbiAgICB9IGVsc2VcclxuICAgICAgICByZXR1cm4gX2RhdGVQYXJ0KGRhdGUsICdtJyk7XHJcbn1cclxuXHJcbmZuLk1PTlRIID0gZnVuY3Rpb24oZGF0ZSkgeyAgXHJcbiAgICBpZiAoQXJyYXkuYW55QXJyYXkoZGF0ZSkpIHtcclxuICAgICAgICByZXR1cm4gX2RhdGVQYXJ0LmNyb3NzQXBwbHkoZGF0ZSwgJ00nKTtcclxuICAgIH0gZWxzZVxyXG4gICAgICAgIHJldHVybiBfZGF0ZVBhcnQoZGF0ZSwgJ00nKTtcclxufVxyXG5cclxuZm4uWUVBUiA9IGZ1bmN0aW9uKGRhdGUpIHsgIFxyXG4gICAgaWYgKEFycmF5LmFueUFycmF5KGRhdGUpKSB7XHJcbiAgICAgICAgcmV0dXJuIF9kYXRlUGFydC5jcm9zc0FwcGx5KGRhdGUsICd5Jyk7XHJcbiAgICB9IGVsc2VcclxuICAgICAgICByZXR1cm4gX2RhdGVQYXJ0KGRhdGUsICd5Jyk7XHJcbn1cclxuXHJcbmZuLlNFQ09ORCA9IGZ1bmN0aW9uKGRhdGUpIHsgIFxyXG4gICAgaWYgKEFycmF5LmFueUFycmF5KGRhdGUpKSB7XHJcbiAgICAgICAgcmV0dXJuIF9kYXRlUGFydC5jcm9zc0FwcGx5KGRhdGUsICdzJyk7XHJcbiAgICB9IGVsc2VcclxuICAgICAgICByZXR1cm4gX2RhdGVQYXJ0KGRhdGUsICdzJyk7XHJcbn1cclxuXHJcbmZuLkRBWSA9IGZ1bmN0aW9uKGRhdGUpIHsgIFxyXG4gICAgaWYgKEFycmF5LmFueUFycmF5KGRhdGUpKSB7XHJcbiAgICAgICAgcmV0dXJuIF9kYXRlUGFydC5jcm9zc0FwcGx5KGRhdGUsICdkJyk7XHJcbiAgICB9IGVsc2VcclxuICAgICAgICByZXR1cm4gX2RhdGVQYXJ0KGRhdGUsICdkJyk7XHJcbn1cclxuXHJcbmZuLk5FVFdPUktEQVlTID0gZnVuY3Rpb24oKSB7IHRocm93IHsgTWVzc2FnZTogXCJOb3QgSW1wbGVtZW50ZWRcIiB9OyB9XHJcblxyXG5mbi5OT1cgPSBmdW5jdGlvbigpIHsgcmV0dXJuIG1vbWVudC51dGMoKS50b0RhdGUoKTsgfVxyXG5cclxuZnVuY3Rpb24gX3RpbWUgKGhvdXJzLCBtaW51dGVzLCBzZWNvbmRzKSB7XHJcbiAgICB2YXIgZDtcclxuICAgIGlmIChob3VycyA9PT0gdW5kZWZpbmVkKSBkID0gbW9tZW50LnV0YygpLnRvRGF0ZSgpO1xyXG4gICAgZWxzZSBpZiAobWludXRlcyA9PT0gdW5kZWZpbmVkKSBkID0gbW9tZW50LnV0Yyh2YWx1ZSkudG9EYXRlKCk7IFxyXG4gICAgZWxzZSBkID0gbW9tZW50LnV0YygpLmhvdXIoaG91cnMpLm1pbnV0ZShtaW51dGVzKS5zZWNvbmQoc2Vjb25kcykudG9EYXRlKCk7XHJcbiAgICByZXR1cm4gKGQuZ2V0TWludXRlcygpIC8gNjAuMCArIGQuZ2V0SG91cnMpIC8gMjQuMDtcclxufVxyXG5cclxuZm4uVElNRSA9IGZ1bmN0aW9uKGhvdXJzLCBtaW51dGVzLCBzZWNvbmRzKSB7XHJcbiAgICBpZiAoQXJyYXkuYW55QXJyYXkoaG91cnMsIG1pbnV0ZXMsIHNlY29uZHMpKSB7XHJcbiAgICAgICAgcmV0dXJuIF90aW1lLmNyb3NzQXBwbHkoaG91cnMsIG1pbnV0ZXMsIHNlY29uZHMpO1xyXG4gICAgfSBlbHNlXHJcbiAgICAgICAgcmV0dXJuIF90aW1lKGhvdXJzLCBtaW51dGVzLCBzZWNvbmRzKTtcclxufVxyXG5cclxuZnVuY3Rpb24gX3RpbWVWYWx1ZSh0aW1lKSB7XHJcbiAgICB2YXIgZCA9IG1vbWVudC51dGModmFsdWUpLnRvRGF0ZSgpO1xyXG4gICAgcmV0dXJuIChkLmdldE1pbnV0ZXMoKSAvIDYwLjAgKyBkLmdldEhvdXJzKSAvIDI0LjA7XHJcbn1cclxuXHJcbmZuLlRJTUVWQUxVRSA9IGZ1bmN0aW9uKHRpbWUpIHtcclxuICAgIGlmIChBcnJheS5hbnlBcnJheSh0aW1lKSkge1xyXG4gICAgICAgIHJldHVybiBfdGltZVZhbHVlLmNyb3NzQXBwbHkodGltZSk7XHJcbiAgICB9IGVsc2VcclxuICAgICAgICByZXR1cm4gX3RpbWVWYWx1ZSh0aW1lKTtcclxufVxyXG5cclxuZm4uVE9EQVkgPSBmdW5jdGlvbigpIHsgcmV0dXJuIG1vbWVudC51dGMoe2hvdXI6MH0pLnRvRGF0ZSgpOyB9XHJcblxyXG5mdW5jdGlvbiBfd2Vla2RheShkYXRlLCByZXR1cm5UeXBlKSB7XHJcbiAgICBpZiAocmV0dXJuVHlwZSA9PT0gdW5kZWZpbmVkKSByZXR1cm5UeXBlID0gMTsgXHJcbiAgICByZXR1cm4gKG1vbWVudC51dGMoZGF0ZSkuaXNvV2Vla2RheSgpIC0gcmV0dXJuVHlwZSArIDcpICUgNzsgXHJcbn1cclxuXHJcbmZuLldFRUtEQVkgPSBmdW5jdGlvbihkYXRlLCByZXR1cm5UeXBlKSB7XHJcbiAgICBpZiAoQXJyYXkuYW55QXJyYXkoZGF0ZSwgcmV0dXJuVHlwZSkpIHtcclxuICAgICAgICByZXR1cm4gX3dlZWtkYXkuY3Jvc3NBcHBseShkYXRlLCByZXR1cm5UeXBlKTtcclxuICAgIH0gZWxzZVxyXG4gICAgICAgIHJldHVybiBfd2Vla2RheShkYXRlLCByZXR1cm5UeXBlKTsgXHJcbn1cclxuXHJcbmZ1bmN0aW9uIF93ZWVrbnVtIChkYXRlLCBkYXlPZldlZWspIHsgXHJcbiAgICByZXR1cm4gbW9tZW50LnV0YyhkYXRlKS5pc29XZWVrZGF5KGRheU9mV2VlaykuaXNvV2VlaygpOyBcclxufVxyXG5cclxuZm4uV0VFS05VTSA9IGZ1bmN0aW9uKGRhdGUsIGRheU9mV2VlaykgeyBcclxuICAgIGlmIChBcnJheS5hbnlBcnJheShkYXRlLCBkYXlPZldlZWspKSB7XHJcbiAgICAgICAgcmV0dXJuIF93ZWVrbnVtLmNyb3NzQXBwbHkoZGF0ZSwgZGF5T2ZXZWVrKTtcclxuICAgIH0gZWxzZVxyXG4gICAgICAgIHJldHVybiBfd2Vla251bShkYXRlLCBkYXlPZldlZWspO1xyXG59XHJcblxyXG5mbi5XT1JLREFZID0gZnVuY3Rpb24oKSB7IHRocm93IHsgTWVzc2FnZTogXCJOb3QgSW1wbGVtZW50ZWRcIiB9OyB9XHJcbmZuLllFQVJGUkFDID0gZnVuY3Rpb24oKSB7IHRocm93IHsgTWVzc2FnZTogXCJOb3QgSW1wbGVtZW50ZWRcIiB9OyB9XHJcblxyXG5mdW5jdGlvbiBfZGF0ZURpZmYoc3RhcnQsIGVuZCkge1xyXG4gICAgc3RhcnQgPSBtb21lbnQudXRjKHN0YXJ0KTtcclxuICAgIGVuZCA9IG1vbWVudC51dGMoZW5kKTtcclxuICAgIHJldHVybiBlbmQuZGlmZihzdGFydCkudG9EYXRlKCk7XHJcbn1cclxuXHJcbmZuLkRBVEVESUZGID0gZnVuY3Rpb24oc3RhcnQsIGVuZCkge1xyXG4gICAgaWYgKEFycmF5LmFueUFycmF5KHN0YXJ0LCBlbmQpKSB7XHJcbiAgICAgICAgcmV0dXJuIF9kYXRlRGlmZi5jcm9zc0FwcGx5KHN0YXJ0LCBlbmQpO1xyXG4gICAgfSBlbHNlXHJcbiAgICAgICAgcmV0dXJuIF9kYXRlRGlmZihzdGFydCwgZW5kKTtcclxufVxyXG5cclxuZnVuY3Rpb24gX2RhdGVBZGRQYXJ0KHZhbHVlLCBkYXRlLCBwYXJ0KSB7XHJcbiAgICBkYXRlID0gbW9tZW50LnV0YyhkYXRlKTtcclxuICAgIHJldHVybiBkYXRlLmFkZCh2YWx1ZSwgcGFydCkudG9EYXRlKCk7XHJcbn1cclxuXHJcbmZuLkFERFNFQ09ORFMgPSBmdW5jdGlvbih2YWx1ZSwgZGF0ZSkge1xyXG4gICAgaWYgKEFycmF5LmFueUFycmF5KHZhbHVlLCBkYXRlKSkge1xyXG4gICAgICAgIHJldHVybiBfZGF0ZUFkZFBhcnQuY3Jvc3NBcHBseSh2YWx1ZSwgZGF0ZSwgJ3MnKTtcclxuICAgIH0gZWxzZVxyXG4gICAgICAgIHJldHVybiBfZGF0ZUFkZFBhcnQodmFsdWUsIGRhdGUsICdzJyk7XHJcbn1cclxuXHJcbmZuLkFERE1JTlVURVMgPSBmdW5jdGlvbih2YWx1ZSwgZGF0ZSkge1xyXG4gICAgaWYgKEFycmF5LmFueUFycmF5KHZhbHVlLCBkYXRlKSkge1xyXG4gICAgICAgIHJldHVybiBfZGF0ZUFkZFBhcnQuY3Jvc3NBcHBseSh2YWx1ZSwgZGF0ZSwgJ20nKTtcclxuICAgIH0gZWxzZVxyXG4gICAgICAgIHJldHVybiBfZGF0ZUFkZFBhcnQodmFsdWUsIGRhdGUsICdtJyk7XHJcbn1cclxuXHJcbmZuLkFEREhPVVJTID0gZnVuY3Rpb24odmFsdWUsIGRhdGUpIHtcclxuICAgIGlmIChBcnJheS5hbnlBcnJheSh2YWx1ZSwgZGF0ZSkpIHtcclxuICAgICAgICByZXR1cm4gX2RhdGVBZGRQYXJ0LmNyb3NzQXBwbHkodmFsdWUsIGRhdGUsICdoJyk7XHJcbiAgICB9IGVsc2VcclxuICAgICAgICByZXR1cm4gX2RhdGVBZGRQYXJ0KHZhbHVlLCBkYXRlLCAnaCcpO1xyXG59XHJcblxyXG5mbi5BREREQVlTID0gZnVuY3Rpb24odmFsdWUsIGRhdGUpIHtcclxuICAgIGlmIChBcnJheS5hbnlBcnJheSh2YWx1ZSwgZGF0ZSkpIHtcclxuICAgICAgICByZXR1cm4gX2RhdGVBZGRQYXJ0LmNyb3NzQXBwbHkodmFsdWUsIGRhdGUsICdkJyk7XHJcbiAgICB9IGVsc2VcclxuICAgICAgICByZXR1cm4gX2RhdGVBZGRQYXJ0KHZhbHVlLCBkYXRlLCAnZCcpO1xyXG59XHJcblxyXG5mbi5BRERNT05USFMgPSBmdW5jdGlvbih2YWx1ZSwgZGF0ZSkge1xyXG4gICAgaWYgKEFycmF5LmFueUFycmF5KHZhbHVlLCBkYXRlKSkge1xyXG4gICAgICAgIHJldHVybiBfZGF0ZUFkZFBhcnQuY3Jvc3NBcHBseSh2YWx1ZSwgZGF0ZSwgJ00nKTtcclxuICAgIH0gZWxzZVxyXG4gICAgICAgIHJldHVybiBfZGF0ZUFkZFBhcnQodmFsdWUsIGRhdGUsICdNJyk7XHJcbn1cclxuXHJcbmZuLkFERFlFQVJTID0gZnVuY3Rpb24odmFsdWUsIGRhdGUpIHtcclxuICAgIGlmIChBcnJheS5hbnlBcnJheSh2YWx1ZSwgZGF0ZSkpIHtcclxuICAgICAgICByZXR1cm4gX2RhdGVBZGRQYXJ0LmNyb3NzQXBwbHkodmFsdWUsIGRhdGUsICd5Jyk7XHJcbiAgICB9IGVsc2VcclxuICAgICAgICByZXR1cm4gX2RhdGVBZGRQYXJ0KHZhbHVlLCBkYXRlLCAneScpO1xyXG59IiwiLypqc2xub2RlOiB0cnVlICovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnJlcXVpcmUoJ2pzLWFycmF5LWV4dGVuc2lvbnMnKTtcclxudmFyIG1vbWVudCA9IHJlcXVpcmUoJ21vbWVudCcpO1xyXG52YXIgcHJlZGljYXRlcyA9IHJlcXVpcmUoJy4vcHJlZGljYXRlcycpO1xyXG52YXIgZm5IZWxwZXJzID0gcmVxdWlyZSgnLi9mbkhlbHBlcnMnKTtcclxudmFyIERhdGFUYWJsZSA9IHJlcXVpcmUoJy4vRGF0YVRhYmxlJyk7XHJcblxyXG52YXIgZm4gPSB7fTtcclxubW9kdWxlLmV4cG9ydHMgPSBmbjtcclxuXHJcbnZhciB2ID0gZm5IZWxwZXJzLmdldFZhbHVlO1xyXG5cclxuZm4uUFRfSVJTID0gZnVuY3Rpb24oZW1wbG95ZWUsIGlyc1RhYmxlLCB2YWx1ZSkge1xyXG5cclxuICAgIGNvbnN0IElSU1RhYmxlQ29sID0gMztcclxuICAgIGNvbnN0IElSU0NvbmRpdGlvbkNvbCA9IDQ7XHJcbiAgICBjb25zdCBXYWdlQ29sID0gNTtcclxuICAgIGNvbnN0IE51bU9mRGVwZW5kYW50cyA9IDY7XHJcbiAgICBjb25zdCBUYXhDb2wgPSA3O1xyXG5cclxuICAgIHZhciB0YXggPSAwO1xyXG4gICAgdHJ5IHtcclxuICAgICAgICBpZiAoZW1wbG95ZWUgJiYgaXJzVGFibGUgJiYgaXJzVGFibGUudmFsdWVzKSB7XHJcbiAgICAgICAgICAgIC8vSVJTIFRhYmxlIGlzIGV4cGVjdGVkIHRvIGJlIGluIHRoZSBjb3JyZWN0IG9yZGVyXHJcbiAgICAgICAgICAgIC8vT3JkZXIgYnkgTnVtT2ZEZXBlbmRhbnRzIERFU0MsIFdhZ2UgQVNDLCBZZWFyIERFU0NcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBpcnNUYWJsZS52YWx1ZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgaWYgKFxyXG4gICAgICAgICAgICAgICAgZW1wbG95ZWUuUFQuSVJTLlRhYmxlID09PSBpcnNUYWJsZS52YWx1ZXNbaV1bSVJTVGFibGVDb2xdXHJcbiAgICAgICAgICAgICAgICAmJiBlbXBsb3llZS5QVC5JUlMuQ29uZGl0aW9uID09PSBpcnNUYWJsZS52YWx1ZXNbaV1bSVJTQ29uZGl0aW9uQ29sXVxyXG4gICAgICAgICAgICAgICAgJiYgZW1wbG95ZWUuUFQuSVJTLk51bU9mRGVwZW5kYW50cyA+PSBpcnNUYWJsZS52YWx1ZXNbaV1bTnVtT2ZEZXBlbmRhbnRzXVxyXG4gICAgICAgICAgICAgICAgJiYgdmFsdWUgPD0gaXJzVGFibGUudmFsdWVzW2ldW1dhZ2VDb2xdXHJcbiAgICAgICAgICAgICAgICApIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gaXJzVGFibGUudmFsdWVzW2ldW1RheENvbF07XHJcbiAgICAgICAgICAgICAgICB9IFxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICBDb25zb2xlLmxvZygnRXJyb3IgcnVubmluZyBmdW5jdGlvbiBQVF9JUlMnKTtcclxuICAgIH1cclxuICAgIHJldHVybiB0YXg7XHJcbn1cclxuXHJcbmZuLlBUX0lSUy5kZXBzID0gXCJFbXBsb3llZSwgSVJTLFwiOyAvL0RlcGVuZGVuY3kgaW5qZWN0aW9uJ1xyXG5cclxuZm4uUFRfVFNVID0gZnVuY3Rpb24gKGVtcGxveWVlLCB0c3VUYWJsZSwgZ2V0SW5jdWJlbmN5KSB7XHJcbiAgICBcclxuICAgIGNvbnN0IFRTVUNvbmRpdGlvbkNvbCA9IDM7XHJcbiAgICBjb25zdCBUU1VFbXBsb3llZVRheENvbCA9IDQ7XHJcbiAgICBjb25zdCBUU1VDb21wYW55VGF4Q29sID0gNTtcclxuXHJcbiAgICBpZiAoZW1wbG95ZWUgJiYgdHN1VGFibGUgJiYgdHN1VGFibGUudmFsdWVzKSB7XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0c3VUYWJsZS52YWx1ZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgaWYgKGVtcGxveWVlLlBULlRTVS5Db25kaXRpb24gPT09IHRzdVRhYmxlLnZhbHVlc1tpXVtUU1VDb25kaXRpb25Db2xdKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gKGdldEluY3ViZW5jeSkgXHJcbiAgICAgICAgICAgICAgICAgICAgPyB0c3VUYWJsZS52YWx1ZXNbaV1bVFNVQ29tcGFueVRheENvbF1cclxuICAgICAgICAgICAgICAgICAgICA6IHRzdVRhYmxlLnZhbHVlc1tpXVtUU1VFbXBsb3llZVRheENvbF1cclxuICAgICAgICAgICAgfSBcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIDA7XHJcbn1cclxuXHJcbmZuLlBUX1RTVS5kZXBzID0gXCJFbXBsb3llZSwgVFNVLFwiOyIsIlxyXG5jb25zdCBTeW1ib2xUYWJsZSA9IHJlcXVpcmUoXCIuL3N5bWJvbFRhYmxlXCIpLlN5bWJvbFRhYmxlXHJcblxyXG4vKmpzbGludCBub2RlOiB0cnVlICovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXHJcbiAqIFByb2dyYW1cclxuICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXHJcbmZ1bmN0aW9uIFByb2dyYW0gKGV4cHJlc3Npb25zKSB7XHJcbiAgICB0aGlzLmV4cHJlc3Npb25zID0gZXhwcmVzc2lvbnMgfHwgW107XHJcbn1cclxuXHJcblByb2dyYW0ucHJvdG90eXBlLmdldENoaWxkRXhwcmVzc2lvbnMgPSBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiB0aGlzLmV4cHJlc3Npb25zO1xyXG59XHJcblxyXG5Qcm9ncmFtLnByb3RvdHlwZS5BZGRFeHByZXNzaW9uID0gZnVuY3Rpb24gKGV4cHJlc3Npb24pIHtcclxuXHJcbiAgICB2YXIgbGFzdEV4cHJlc3Npb24gPSB0aGlzLmV4cHJlc3Npb25zW3RoaXMuZXhwcmVzc2lvbnMubGVuZ3RoLTFdO1xyXG4gICAgdmFyIGlzQ29tcGF0aWJsZSA9IGZhbHNlO1xyXG5cclxuICAgIGlmICgobGFzdEV4cHJlc3Npb24gJiYgbGFzdEV4cHJlc3Npb24uY29uc3RydWN0b3IgPT09IEFzc2lnbkV4cHJlc3Npb25Hcm91cCkgfHxcclxuICAgICAgICAobGFzdEV4cHJlc3Npb24uaWRlbnRpZmllciAmJiBsYXN0RXhwcmVzc2lvbi5pZGVudGlmaWVyLmNvbnN0cnVjdG9yID09IENvbHVtbkV4cHJlc3Npb24pXHJcbiAgICApIHtcclxuICAgICAgICBpZiAoZXhwcmVzc2lvbiAmJiBleHByZXNzaW9uLmlkZW50aWZpZXIgJiYgZXhwcmVzc2lvbi5pZGVudGlmaWVyLmNvbnN0cnVjdG9yID09PSBDb2x1bW5FeHByZXNzaW9uKSB7XHJcbiAgICAgICAgICAgIGlzQ29tcGF0aWJsZSA9IChcclxuICAgICAgICAgICAgICAgIGV4cHJlc3Npb24uaWRlbnRpZmllci50YWJsZSA9PSAobGFzdEV4cHJlc3Npb24udGFibGUgfHwgbGFzdEV4cHJlc3Npb24uaWRlbnRpZmllci50YWJsZSlcclxuICAgICAgICAgICAgICAgICYmIGxhc3RFeHByZXNzaW9uLmZpbHRlciA9PT0gZXhwcmVzc2lvbi5maWx0ZXJcclxuICAgICAgICAgICAgICAgICYmIGxhc3RFeHByZXNzaW9uLmZpbHRlckNvbHVtbiA9PT0gZXhwcmVzc2lvbi5maWx0ZXJDb2x1bW5cclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKGlzQ29tcGF0aWJsZSkgeyBcclxuICAgICAgICBpZiAobGFzdEV4cHJlc3Npb24uY29uc3RydWN0b3IgPT09IEFzc2lnbkV4cHJlc3Npb25Hcm91cCkge1xyXG4gICAgICAgICAgICBsYXN0RXhwcmVzc2lvbi5leHByZXNzaW9ucy5wdXNoKGV4cHJlc3Npb24pO1xyXG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZygnYWRkaW5nIGFub3RoZXIgZXhwcmVzc2lvbiB0byB0aGUgZ3JvdXAnKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZygnam9pbm5pbmcgdG8gZXhwcmVzc2lvbnMgaW50byBhIGdyb3VwJyk7XHJcbiAgICAgICAgICAgIHZhciBhZSA9IG5ldyBBc3NpZ25FeHByZXNzaW9uR3JvdXAoKTtcclxuICAgICAgICAgICAgYWUuZXhwcmVzc2lvbnMucHVzaChsYXN0RXhwcmVzc2lvbik7XHJcbiAgICAgICAgICAgIGFlLmV4cHJlc3Npb25zLnB1c2goZXhwcmVzc2lvbik7XHJcbiAgICAgICAgICAgIGFlLnRhYmxlID0gbGFzdEV4cHJlc3Npb24uaWRlbnRpZmllci50YWJsZTtcclxuICAgICAgICAgICAgYWUuZmlsdGVyQ29sdW1uID0gbGFzdEV4cHJlc3Npb24uZmlsdGVyQ29sdW1uO1xyXG4gICAgICAgICAgICBhZS5maWx0ZXIgPSBsYXN0RXhwcmVzc2lvbi5maWx0ZXI7XHJcbiAgICAgICAgICAgIHRoaXMuZXhwcmVzc2lvbnNbdGhpcy5leHByZXNzaW9ucy5sZW5ndGgtMV0gPSBhZTtcclxuICAgICAgICB9XHJcbiAgICB9IGVsc2VcclxuICAgICAgICB0aGlzLmV4cHJlc3Npb25zLnB1c2goZXhwcmVzc2lvbik7XHJcblxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cy5Qcm9ncmFtID0gUHJvZ3JhbTtcclxuXHJcbi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXHJcbiAqIEFzc2lnbkV4cHJlc3Npb25Hcm91cFxyXG4gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cclxuXHJcbmZ1bmN0aW9uIEFzc2lnbkV4cHJlc3Npb25Hcm91cCAoKSB7XHJcbiAgICB0aGlzLmV4cHJlc3Npb25zID0gW107XHJcbiAgICB0aGlzLnRhYmxlID0gbnVsbDtcclxuICAgIHRoaXMuZmlsdGVyQ29sdW1uID0gbnVsbDtcclxuICAgIHRoaXMuZmlsdGVyID0gbnVsbDtcclxufVxyXG5cclxuQXNzaWduRXhwcmVzc2lvbkdyb3VwLnByb3RvdHlwZS5nZXRTaWduYXR1cmUgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICB2YXIgcmV0ID0gW107XHJcbiAgICBmb3IgKHZhciBlID0gMDsgZSA8IHRoaXMuZXhwcmVzc2lvbnMubGVuZ3RoOyBlKyspIHtcclxuICAgICAgICBpZiAodGhpcy5leHByZXNzaW9uc1tlXS5nZXRTaWduYXR1cmUpXHJcbiAgICAgICAgICAgIHJldC5wdXNoKHRoaXMuZXhwcmVzc2lvbnNbZV0uZ2V0U2lnbmF0dXJlKCkpXHJcbiAgICB9XHJcbiAgICByZXR1cm4gcmV0O1xyXG59XHJcblxyXG5Bc3NpZ25FeHByZXNzaW9uR3JvdXAucHJvdG90eXBlLmdldENoaWxkRXhwcmVzc2lvbnMgPSBmdW5jdGlvbigpIHtcclxuICAgIHJldCA9IFtdO1xyXG4gICAgZm9yICh2YXIgZSA9IDA7IGUgPCB0aGlzLmV4cHJlc3Npb25zLmxlbmd0aDsgZSsrKSB7XHJcbiAgICAgICAgdmFyIGNoaWxkcmVuID0gdGhpcy5leHByZXNzaW9uc1tlXS5nZXRDaGlsZEV4cHJlc3Npb25zKCk7XHJcbiAgICAgICAgcmV0LnB1c2guYXBwbHkocmV0LCBjaGlsZHJlbik7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gcmV0O1xyXG59XHJcblxyXG5Bc3NpZ25FeHByZXNzaW9uR3JvdXAucHJvdG90eXBlLnRvSnNHZXQgPSBmdW5jdGlvbiAoc3ltYm9sVGFibGUsIGluc2lkZUFzc2lnbkxvb3ApIHtcclxuICAgIHRocm93IHtNZXNzYWdlOiBcIkNhbid0IGdlbmVyYXRlIEdldCBmcm9tIGFzc2lnbiBleHByZXNzaW9uIGdyb3VwXCIgfTtcclxufVxyXG5cclxuQXNzaWduRXhwcmVzc2lvbkdyb3VwLnByb3RvdHlwZS50b0pzU2V0ID0gZnVuY3Rpb24gKGV4cHJlc3Npb24sIHN5bWJvbFRhYmxlLCBpbnNpZGVBc3NpZ25Mb29wKSB7XHJcbiAgICBzeW1ib2xUYWJsZS5yZWdpc3RlclN5bWJvbCh0aGlzLnRhYmxlLCBcIlRcIik7XHJcblxyXG4gICAgLy8gdmFyIGZuc0pzID0gc3ltYm9sVGFibGUuZ2V0RnVuY3Rpb25zSnNTZXQoKTtcclxuICAgIC8vIHN5bWJvbFRhYmxlLmNsZWFyRnVuY3Rpb25zKCk7XHJcblxyXG4gICAgdmFyIGpzID0gXCIkclN0YWNrLnB1c2goJHIpOyBmb3IgKCRyID0gMDsgJHIgPT0gMCB8fCAkciA8IFwiICsgdGhpcy50YWJsZSArIFwiLnZhbHVlcy5sZW5ndGg7ICRyKyspIHtcXG5cIlxyXG5cclxuICAgIGZvciAodmFyIGUgPSAwOyBlIDwgdGhpcy5leHByZXNzaW9ucy5sZW5ndGg7IGUrKykge1xyXG4gICAgICAgIHZhciBlanMgPSB0aGlzLmV4cHJlc3Npb25zW2VdLnRvSnNHcm91cFNldChleHByZXNzaW9uLCBzeW1ib2xUYWJsZSwgaW5zaWRlQXNzaWduTG9vcCk7ICAgIFxyXG4gICAgICAgIGpzICs9IGVqcztcclxuICAgIH1cclxuXHJcbiAgICBqcyArPSBcIlxcbn07ICRyID0gJHJTdGFjay5wb3AoKSB8fCAwO1wiXHJcbiAgICByZXR1cm4ganM7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzLkFzc2lnbkV4cHJlc3Npb25Hcm91cCA9IEFzc2lnbkV4cHJlc3Npb25Hcm91cDtcclxuXHJcbi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXHJcbiAqIEFzc2lnbkV4cHJlc3Npb24gXHJcbiAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xyXG5mdW5jdGlvbiBBc3NpZ25FeHByZXNzaW9uKGlkZW50aWZpZXIsIGV4cHJlc3Npb24sIGZpbHRlckNvbHVtbiwgZmlsdGVyKSB7XHJcbiAgICB0aGlzLmlkZW50aWZpZXIgPSBpZGVudGlmaWVyO1xyXG4gICAgdGhpcy5leHByZXNzaW9uID0gZXhwcmVzc2lvbjtcclxuICAgIHRoaXMuZmlsdGVyQ29sdW1uID0gZmlsdGVyQ29sdW1uO1xyXG4gICAgdGhpcy5maWx0ZXIgPSBmaWx0ZXI7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzLkFzc2lnbkV4cHJlc3Npb24gPSBBc3NpZ25FeHByZXNzaW9uO1xyXG5cclxuQXNzaWduRXhwcmVzc2lvbi5wcm90b3R5cGUuZ2V0SWRlbnRpZmllciA9IGZ1bmN0aW9uICgpIHtcclxuICAgIHJldHVybiB0aGlzLmlkZW50aWZpZXI7XHJcbn1cclxuXHJcbkFzc2lnbkV4cHJlc3Npb24ucHJvdG90eXBlLmdldENoaWxkRXhwcmVzc2lvbnMgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICByZXR1cm4gW3RoaXMuZXhwcmVzc2lvbl07XHJcbn1cclxuXHJcbkFzc2lnbkV4cHJlc3Npb24ucHJvdG90eXBlLnRvSnNHZXQgPSBmdW5jdGlvbihzeW1ib2xUYWJsZSwgaW5zaWRlQXNzaWduTG9vcCkge1xyXG4gICAgdGhyb3cge01lc3NhZ2U6IFwiQ2FuJ3QgZ2VuZXJhdGUgR2V0IGZyb20gYXNzaWduIGV4cHJlc3Npb25cIiB9O1xyXG59XHJcblxyXG5Bc3NpZ25FeHByZXNzaW9uLnByb3RvdHlwZS50b0pzR3JvdXBTZXQgPSBmdW5jdGlvbihleHByZXNzaW9uLCBzeW1ib2xUYWJsZSwgaW5zaWRlQXNzaWduTG9vcCkge1xyXG4gICAgcmV0dXJuIHRoaXMuaWRlbnRpZmllci50b0pzR3JvdXBTZXQodGhpcy5leHByZXNzaW9uLCBzeW1ib2xUYWJsZSwgdGhpcy5pZGVudGlmaWVyLmlzUmFuZ2UsIHRoaXMuZmlsdGVyQ29sdW1uLCB0aGlzLmZpbHRlcik7XHJcbn1cclxuXHJcbkFzc2lnbkV4cHJlc3Npb24ucHJvdG90eXBlLnRvSnNTZXQgPSBmdW5jdGlvbihleHByZXNzaW9uLCBzeW1ib2xUYWJsZSwgaW5zaWRlQXNzaWduTG9vcCkge1xyXG4gICAgcmV0dXJuIHRoaXMuaWRlbnRpZmllci50b0pzU2V0KHRoaXMuZXhwcmVzc2lvbiwgc3ltYm9sVGFibGUsIHRoaXMuaWRlbnRpZmllci5pc1JhbmdlLCB0aGlzLmZpbHRlckNvbHVtbiwgdGhpcy5maWx0ZXIpO1xyXG59XHJcblxyXG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxyXG4gKiBJZGVudGlmaWVyRXhwcmVzc2lvbiBcclxuICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovIFxyXG5cclxuZnVuY3Rpb24gSWRlbnRpZmllckV4cHJlc3Npb24gKG5hbWUsIHByb3ApIHtcclxuICAgIHRoaXMubW9kaWZpZXIgPSBcIlwiO1xyXG4gICAgaWYgKG5hbWUuc3RhcnRzV2l0aChcIiRcIikpIHtcclxuICAgICAgICBuYW1lID0gbmFtZS5zdWJzdHJpbmcoMSk7XHJcbiAgICAgICAgdGhpcy5tb2RpZmllciA9IFwiJFwiO1xyXG4gICAgfVxyXG4gICAgdGhpcy5uYW1lID0gbmFtZSArICgoIXByb3ApID8gXCJcIiA6IChcIi5cIiArIHByb3ApKTtcclxuICAgIHRoaXMucHJvcCA9IHByb3A7XHJcbiAgICB0aGlzLnByb21vdGVkRXhwcmVzc2lvbiA9IG51bGw7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzLklkZW50aWZpZXJFeHByZXNzaW9uID0gSWRlbnRpZmllckV4cHJlc3Npb247XHJcblxyXG5JZGVudGlmaWVyRXhwcmVzc2lvbi5wcm90b3R5cGUuZmlsbFN5bWJvbFRhYmxlID0gZnVuY3Rpb24odGFibGUpIHtcclxuICAgIHRhYmxlLnJlZ2lzdGVyU3ltYm9sKHRoaXMubmFtZSwgXCJWXCIpO1xyXG59XHJcblxyXG5JZGVudGlmaWVyRXhwcmVzc2lvbi5wcm90b3R5cGUucHJvbW90ZSA9IGZ1bmN0aW9uKHRhYmxlKSB7XHJcblxyXG4gICAgaWYgKHRhYmxlLnNlYXJjaFN5bWJvbCh0aGlzLm5hbWUsIFwiVlwiKSA9PSBudWxsKSB7XHJcbiAgICAgICAgdmFyIHByb21vdGUgPSB0cnVlO1xyXG4gICAgICAgIGlmICh0aGlzLm5hbWUuaW5kZXhPZignLicpID4gMCkge1xyXG4gICAgICAgICAgICB2YXIgcXVlcnkgPSB0aGlzLm5hbWUuc3BsaXQoJy4nKVswXTtcclxuICAgICAgICAgICAgaWYgKHRhYmxlLnNlYXJjaFN5bWJvbChxdWVyeSwgXCJWXCIpICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIHRhYmxlLnJlZ2lzdGVyU3ltYm9sKHRoaXMubmFtZSwgXCJWXCIpOyAgICAgICAgXHJcbiAgICAgICAgICAgICAgICBwcm9tb3RlID0gZmFsc2U7XHJcbiAgICAgICAgICAgIH0gICBcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHByb21vdGUpIHtcclxuICAgICAgICAgICAgdGhpcy5wcm9tb3RlZEV4cHJlc3Npb24gPSB0aGlzLnRvVGFibGVFeHByZXNzaW9uKCk7ICAgIFxyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuSWRlbnRpZmllckV4cHJlc3Npb24ucHJvdG90eXBlLmdldFNpZ25hdHVyZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgIGlmICh0aGlzLnByb21vdGVkRXhwcmVzc2lvbiAhPSBudWxsKVxyXG4gICAgICAgIHJldHVybiB0aGlzLnByb21vdGVkRXhwcmVzc2lvbi5nZXRTaWduYXR1cmUoKTtcclxuICAgIGVsc2VcclxuICAgICAgICByZXR1cm4gW3RoaXMubmFtZV07XHJcbn1cclxuXHJcbklkZW50aWZpZXJFeHByZXNzaW9uLnByb3RvdHlwZS50b1RhYmxlRXhwcmVzc2lvbiA9IGZ1bmN0aW9uKCkge1xyXG4gICAgdmFyIHRhYmxlID0gXCJ0YWJsZVwiO1xyXG4gICAgaWYgKHRoaXMubmFtZS5pbmRleE9mKCcuJykgPiAwKSB7XHJcbiAgICAgICAgdmFyIHNUID0gdGhpcy5uYW1lLnNwbGl0KCcuJyk7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBDb2x1bW5FeHByZXNzaW9uKHRhYmxlLCBzVFsxXSwgdGhpcy5tb2RpZmllciArIHNUWzBdKTtcclxuICAgIH0gZWxzZVxyXG4gICAgICAgIHJldHVybiBuZXcgQ2VsbEV4cHJlc3Npb24odGFibGUsIHRoaXMubmFtZSwgbmV3IFJvd051bWJlcigwLCAnKycpKTtcclxufVxyXG5cclxuSWRlbnRpZmllckV4cHJlc3Npb24ucHJvdG90eXBlLnRvSnNHZXQgPSBmdW5jdGlvbiAoc3ltYm9sVGFibGUsIGluc2lkZUFzc2lnbkxvb3ApIHtcclxuICAgIGlmICh0aGlzLnByb21vdGVkRXhwcmVzc2lvbikge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnByb21vdGVkRXhwcmVzc2lvbi50b0pzR2V0KHN5bWJvbFRhYmxlLCBpbnNpZGVBc3NpZ25Mb29wKTtcclxuICAgIH0gZWxzZVxyXG4gICAgICAgIHJldHVybiB0aGlzLm5hbWU7XHJcbn07XHJcblxyXG5JZGVudGlmaWVyRXhwcmVzc2lvbi5wcm90b3R5cGUudG9Kc1NldCA9IGZ1bmN0aW9uIChleHByZXNzaW9uLCBzeW1ib2xUYWJsZSwgaW5zaWRlQXNzaWduTG9vcCwgZmlsdGVyQ29sdW1uLCBmaWx0ZXIpIHtcclxuICAgIHZhciBleHBKcyA9IGV4cHJlc3Npb24udG9Kc0dldChzeW1ib2xUYWJsZSwgaW5zaWRlQXNzaWduTG9vcCk7XHJcbiAgICB2YXIgZm5zSnMgPSBzeW1ib2xUYWJsZS5nZXRGdW5jdGlvbnNKc1NldCgpO1xyXG4gICAgc3ltYm9sVGFibGUuY2xlYXJGdW5jdGlvbnMoKTtcclxuXHJcbiAgICByZXR1cm4gZm5zSnMgKyBcIiQkID0gXCIgKyB0aGlzLm5hbWUgKyBcIiA9IFwiICsgZXhwSnM7XHJcbn07XHJcblxyXG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxyXG4gKiBDZWxsRXhwcmVzc2lvbiBcclxuICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXHJcblxyXG5mdW5jdGlvbiBDZWxsRXhwcmVzc2lvbih0YWJsZSwgY29sdW1uLCByb3cpIHtcclxuICAgIHRoaXMudGFibGUgPSAodGFibGUpID8gdGFibGUgOiBcInRhYmxlXCI7IC8vVE9ETyBjaGVjayBpZiBkZWZhdWx0IHRhYmxlIG9yIHZhcmlhYmxlXHJcbiAgICB0aGlzLmNvbHVtbiA9IGNvbHVtbjtcclxuICAgIHRoaXMucm93ID0gcm93O1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cy5DZWxsRXhwcmVzc2lvbiA9IENlbGxFeHByZXNzaW9uO1xyXG5cclxuQ2VsbEV4cHJlc3Npb24ucHJvdG90eXBlLmZpbGxTeW1ib2xUYWJsZSA9IGZ1bmN0aW9uKHRhYmxlKSB7XHJcbiAgICB0YWJsZS5yZWdpc3RlclN5bWJvbCh0aGlzLnRhYmxlLCBcIlRcIik7XHJcbn1cclxuXHJcbkNlbGxFeHByZXNzaW9uLnByb3RvdHlwZS5nZXRTaWduYXR1cmUgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICByZXR1cm4gW1wiJFwiICsgdGhpcy50YWJsZSArIFwiW1wiICsgdGhpcy5jb2x1bW4gKyBcIl1cIiBdOyAvLyArICgodGhpcy5yb3cgJiYgIXRoaXMucm93LnJlbGF0aXZlKSA/IHRoaXMucm93Lm1vZGlmaWVyICsgdGhpcy5yb3cucm93IDogXCJcIikgXTtcclxufVxyXG5cclxuQ2VsbEV4cHJlc3Npb24ucHJvdG90eXBlLnRvSnNHZXQgPSBmdW5jdGlvbiAoc3ltYm9sVGFibGUsIGluc2lkZUFzc2lnbkxvb3ApIHtcclxuICAgIHN5bWJvbFRhYmxlLnJlZ2lzdGVyU3ltYm9sKHRoaXMudGFibGUsIFwiVFwiKTtcclxuICAgIHJldHVybiB0aGlzLnRhYmxlICsgXCIuZ2V0VmFsdWUoJ1wiICsgXHJcbiAgICAgICAgdGhpcy5jb2x1bW4gKyBcIicsXCIgKyBcclxuICAgICAgICB0aGlzLnJvdy50b0pzR2V0KHN5bWJvbFRhYmxlLCBpbnNpZGVBc3NpZ25Mb29wKSArIFwiKVwiIFxyXG59O1xyXG5cclxuQ2VsbEV4cHJlc3Npb24ucHJvdG90eXBlLnRvSnNTZXQgPSBmdW5jdGlvbiAoZXhwcmVzc2lvbiwgc3ltYm9sVGFibGUsIGluc2lkZUFzc2lnbkxvb3ApIHtcclxuXHJcbiAgICB2YXIgZXhwSnMgPSBleHByZXNzaW9uLnRvSnNHZXQoc3ltYm9sVGFibGUsIGluc2lkZUFzc2lnbkxvb3ApO1xyXG4gICAgdmFyIGZuc0pzID0gc3ltYm9sVGFibGUuZ2V0RnVuY3Rpb25zSnNTZXQoKTtcclxuICAgIHN5bWJvbFRhYmxlLmNsZWFyRnVuY3Rpb25zKCk7XHJcblxyXG4gICAgcmV0dXJuIGZuc0pzICsgXCIkJCA9IFwiICsgdGhpcy50YWJsZSArIFwiLnNldFZhbHVlKCdcIiArIFxyXG4gICAgICAgIHRoaXMuY29sdW1uICsgXCInLFwiICsgXHJcbiAgICAgICAgdGhpcy5yb3cudG9Kc0dldChzeW1ib2xUYWJsZSwgaW5zaWRlQXNzaWduTG9vcCkgKyBcIixcIiArXHJcbiAgICAgICAgZXhwSnMgKyBcIilcIjsgXHJcbn07XHJcblxyXG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxyXG4gKiBSb3dOdW1iZXIgXHJcbiAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xyXG5cclxuZnVuY3Rpb24gUm93TnVtYmVyKHJvdywgbW9kaWZpZXIpIHtcclxuICAgIHRoaXMucm93ID0gaXNOYU4ocm93KSA/IDAgOiBOdW1iZXIocm93KTtcclxuICAgIHRoaXMubW9kaWZpZXIgPSBtb2RpZmllcjtcclxuICAgIHRoaXMucmVsYXRpdmUgPSAobW9kaWZpZXIgIT0gJyQnKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMuUm93TnVtYmVyID0gUm93TnVtYmVyO1xyXG5cclxuUm93TnVtYmVyLnByb3RvdHlwZS50b0pzR2V0ID0gZnVuY3Rpb24gKHN5bWJvbFRhYmxlLCBpbnNpZGVBc3NpZ25Mb29wKSB7XHJcbiAgICBpZiAodGhpcy5yZWxhdGl2ZSkge1xyXG4gICAgICAgIHJldHVybiBcIiRyIFwiICsgdGhpcy5tb2RpZmllciArIHRoaXMucm93O1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5yb3c7XHJcbiAgICB9XHJcbn07XHJcblxyXG5cclxuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcclxuICogQ29sdW1uRXhwcmVzc2lvbiBcclxuICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXHJcblxyXG5mdW5jdGlvbiBDb2x1bW5FeHByZXNzaW9uKHRhYmxlLCBjb2x1bW4sIHF1ZXJ5KSB7XHJcbiAgICB0aGlzLnRhYmxlID0gKHRhYmxlKSA/IHRhYmxlIDogXCJ0YWJsZVwiO1xyXG4gICAgdGhpcy5jb2x1bW4gPSBjb2x1bW47XHJcbiAgICB0aGlzLnF1ZXJ5ID0gcXVlcnk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzLkNvbHVtbkV4cHJlc3Npb24gPSBDb2x1bW5FeHByZXNzaW9uO1xyXG5cclxuQ29sdW1uRXhwcmVzc2lvbi5wcm90b3R5cGUuZmlsbFN5bWJvbFRhYmxlID0gZnVuY3Rpb24odGFibGUpIHtcclxuICAgIHRhYmxlLnJlZ2lzdGVyU3ltYm9sKHRoaXMudGFibGUsIFwiVFwiKTtcclxufVxyXG5cclxuQ29sdW1uRXhwcmVzc2lvbi5wcm90b3R5cGUuZ2V0U2lnbmF0dXJlID0gZnVuY3Rpb24gKCkge1xyXG4gICAgcmV0dXJuIFtcIiRcIiArIHRoaXMudGFibGUgKyBcIltcIiArIHRoaXMuY29sdW1uICsgXCJdXCJdO1xyXG59XHJcblxyXG5Db2x1bW5FeHByZXNzaW9uLnByb3RvdHlwZS50b0pzR2V0ID0gZnVuY3Rpb24oc3ltYm9sVGFibGUsIGluc2lkZUFzc2lnbkxvb3ApIHtcclxuICAgIHN5bWJvbFRhYmxlLnJlZ2lzdGVyU3ltYm9sKHRoaXMudGFibGUsIFwiVFwiKTtcclxuICAgIGlmICghdGhpcy5xdWVyeSkge1xyXG4gICAgICAgIHZhciBqcyA9IHRoaXMudGFibGUgKyBcIi5nZXRDb2x1bW4oJ1wiICsgdGhpcy5jb2x1bW4gKyBcIicsICRyKVwiO1xyXG4gICAgICAgIHZhciBzeW1ib2xOYW1lID0gc3ltYm9sVGFibGUucmVnaXN0ZXJGdW5jdGlvbihcIkNvbHVtblwiLCBqcyk7XHJcbiAgICAgICAgcmV0dXJuIHN5bWJvbE5hbWU7XHJcbiAgICB9IGVsc2UgaWYgKHRoaXMucXVlcnkudG9Mb3dlckNhc2UoKSA9PT0gXCIkcGFyZW50XCIgKSB7XHJcbiAgICAgICAgdmFyIGpzID0gdGhpcy50YWJsZSArIFwiLmdldFBhcmVudFZhbHVlKCdcIiArIHRoaXMuY29sdW1uICsgXCInLCAkcilcIjtcclxuICAgICAgICB2YXIgc3ltYm9sTmFtZSA9IHN5bWJvbFRhYmxlLnJlZ2lzdGVyRnVuY3Rpb24oXCJHZXRQYXJlbnRWYWx1ZVwiLCBqcyk7XHJcbiAgICAgICAgcmV0dXJuIHN5bWJvbE5hbWU7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHZhciBqcyA9IHRoaXMudGFibGUgKyBcIi5maW5kVmFsdWVzKDEsICdcIiArIHRoaXMucXVlcnkgKyBcIicsICdcIisgdGhpcy5jb2x1bW4gKyBcIicpXCI7XHJcbiAgICAgICAgdmFyIHN5bWJvbE5hbWUgPSBzeW1ib2xUYWJsZS5yZWdpc3RlckZ1bmN0aW9uKFwiRmluZFZhbHVlc1wiLCBqcyk7XHJcbiAgICAgICAgcmV0dXJuIHN5bWJvbE5hbWU7XHJcbiAgICB9XHJcbn1cclxuXHJcbkNvbHVtbkV4cHJlc3Npb24ucHJvdG90eXBlLnRvSnNHcm91cFNldCA9IGZ1bmN0aW9uKGV4cHJlc3Npb24sIHN5bWJvbFRhYmxlLCBpbnNpZGVBc3NpZ25Mb29wLCBmaWx0ZXJDb2x1bW4sIGZpbHRlcikge1xyXG4gICAgc3ltYm9sVGFibGUucmVnaXN0ZXJTeW1ib2wodGhpcy50YWJsZSwgXCJUXCIpO1xyXG4gICAgdmFyIGpzID0gXCJcIjtcclxuICAgIHZhciBleHBKcyA9IGV4cHJlc3Npb24udG9Kc0dldChzeW1ib2xUYWJsZSwgdHJ1ZSk7XHJcbiAgICB2YXIgZm5zSnMgPSBzeW1ib2xUYWJsZS5nZXRGdW5jdGlvbnNKc1NldCgpO1xyXG4gICAgc3ltYm9sVGFibGUuY2xlYXJGdW5jdGlvbnMoKTtcclxuXHJcbiAgICBpZiAoZmlsdGVyQ29sdW1uICYmIGZpbHRlcikge1xyXG4gICAgICAgIGpzICs9ICdpZiAoU3RyaW5nKCcgKyB0aGlzLnRhYmxlICsgJy5nZXRWYWx1ZShcIicgKyBmaWx0ZXJDb2x1bW4gKyAnXCIsICRyKSkuc3RhcnRzV2l0aChcIicgKyBmaWx0ZXIgKyAnXCIpKSB7J1xyXG4gICAgfVxyXG5cclxuICAgIGpzICs9IGZuc0pzICsgXCIkJCA9IFwiICsgdGhpcy50YWJsZSArIFwiLnNldFZhbHVlKCdcIiArIFxyXG4gICAgICAgIHRoaXMuY29sdW1uICsgXCInLCAkcixcIiArXHJcbiAgICAgICAgZXhwSnMgKyBcIik7XCI7IFxyXG5cclxuICAgIGlmIChmaWx0ZXJDb2x1bW4gJiYgZmlsdGVyKSB7XHJcbiAgICAgICAganMgKz0gJ30nXHJcbiAgICB9XHJcbiAgICByZXR1cm4ganM7XHJcbn1cclxuXHJcbkNvbHVtbkV4cHJlc3Npb24ucHJvdG90eXBlLnRvSnNTZXQgPSBmdW5jdGlvbihleHByZXNzaW9uLCBzeW1ib2xUYWJsZSwgaW5zaWRlQXNzaWduTG9vcCwgZmlsdGVyQ29sdW1uLCBmaWx0ZXIpIHtcclxuXHJcbiAgICB2YXIganMgPSBcIiRyU3RhY2sucHVzaCgkcik7IGZvciAoJHIgPSAwOyAkciA9PSAwIHx8ICRyIDwgXCIgKyB0aGlzLnRhYmxlICsgXCIudmFsdWVzLmxlbmd0aDsgJHIrKykge1xcblwiXHJcblxyXG4gICAganMgKz0gdGhpcy50b0pzR3JvdXBTZXQoZXhwcmVzc2lvbiwgc3ltYm9sVGFibGUsIGluc2lkZUFzc2lnbkxvb3AsIGZpbHRlckNvbHVtbiwgZmlsdGVyKTtcclxuXHJcbiAgICBqcyArPSBcIlxcbn07ICRyID0gJHJTdGFjay5wb3AoKSB8fCAwO1wiXHJcbiAgICByZXR1cm4ganM7XHJcbn1cclxuXHJcbi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXHJcbiAqIFJhbmdlRXhwcmVzc2lvbiBcclxuICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXHJcblxyXG5mdW5jdGlvbiBSYW5nZUV4cHJlc3Npb24odGFibGUsIHN0YXJ0Q29sdW1uLCBlbmRDb2x1bW4sIHN0YXJ0Um93LCBlbmRSb3cpIHtcclxuICAgIHRoaXMudGFibGUgPSAodGFibGUpID8gdGFibGUgOiBcInRhYmxlXCI7XHJcbiAgICB0aGlzLnN0YXJ0Q29sdW1uID0gc3RhcnRDb2x1bW47XHJcbiAgICB0aGlzLmVuZENvbHVtbiA9IGVuZENvbHVtbjtcclxuXHJcbiAgICB0aGlzLnN0YXJ0Um93ID0gKHN0YXJ0Um93IGluc3RhbmNlb2YgUm93TnVtYmVyKSA/IHN0YXJ0Um93IDogbmV3IFJvd051bWJlcihzdGFydFJvdywgJyQnKTtcclxuICAgIHRoaXMuZW5kUm93ID0gKGVuZFJvdyBpbnN0YW5jZW9mIFJvd051bWJlcikgPyBlbmRSb3cgOiBuZXcgUm93TnVtYmVyKGVuZFJvdywgJyQnKTtcclxufVxyXG5cclxuUmFuZ2VFeHByZXNzaW9uLnByb3RvdHlwZS5maWxsU3ltYm9sVGFibGUgPSBmdW5jdGlvbih0YWJsZSkge1xyXG4gICAgdGFibGUucmVnaXN0ZXJTeW1ib2wodGhpcy50YWJsZSwgXCJUXCIpO1xyXG59XHJcblxyXG5SYW5nZUV4cHJlc3Npb24ucHJvdG90eXBlLmdldFNpZ25hdHVyZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgIGlmICh0aGlzLnN0YXJ0Q29sdW1uID09IHRoaXMuZW5kQ29sdW1uKVxyXG4gICAgICAgIHJldHVybiBbXCIkXCIgKyB0aGlzLnRhYmxlICsgXCJbXCIgKyB0aGlzLnN0YXJ0Q29sdW1uICsgXCJdXCJdO1xyXG4gICAgZWxzZVxyXG4gICAgICAgIHJldHVybiBbXCIkXCIgKyB0aGlzLnRhYmxlICsgXCJbXCIgKyB0aGlzLnN0YXJ0Q29sdW1uICsgXCJdXCIsIFwiJFwiICsgdGhpcy50YWJsZSArIFwiW1wiICsgdGhpcy5lbmRDb2x1bW4gKyBcIl1cIl07XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzLlJhbmdlRXhwcmVzc2lvbiA9IFJhbmdlRXhwcmVzc2lvbjtcclxuXHJcblJhbmdlRXhwcmVzc2lvbi5wcm90b3R5cGUudG9Kc0dldCA9IGZ1bmN0aW9uKHN5bWJvbFRhYmxlLCBpbnNpZGVBc3NpZ25Mb29wKSB7XHJcbiAgICBzeW1ib2xUYWJsZS5yZWdpc3RlclN5bWJvbCh0aGlzLnRhYmxlLCBcIlRcIik7XHJcbiAgICB2YXIganMgPSB0aGlzLnRhYmxlICsgXCIuZ2V0UmFuZ2UoJ1wiICsgdGhpcy5zdGFydENvbHVtbiArIFxyXG4gICAgICAgIFwiJywnXCIgKyB0aGlzLmVuZENvbHVtbiArIFxyXG4gICAgICAgIFwiJywgXCIgKyB0aGlzLnN0YXJ0Um93LnRvSnNHZXQoc3ltYm9sVGFibGUsIGluc2lkZUFzc2lnbkxvb3ApICsgXHJcbiAgICAgICAgXCIsIFwiICArIHRoaXMuZW5kUm93LnRvSnNHZXQoc3ltYm9sVGFibGUsIGluc2lkZUFzc2lnbkxvb3ApICsgXCIpXCI7XHJcblxyXG4gICAgdmFyIHN5bWJvbE5hbWUgPSBzeW1ib2xUYWJsZS5yZWdpc3RlckZ1bmN0aW9uKFwiUmFuZ2VcIiwganMpO1xyXG4gICAgcmV0dXJuIHN5bWJvbE5hbWU7XHJcbn1cclxuXHJcblJhbmdlRXhwcmVzc2lvbi5wcm90b3R5cGUudG9Kc1NldCA9IGZ1bmN0aW9uKGV4cHJlc3Npb24sIHN5bWJvbFRhYmxlLCBpbnNpZGVBc3NpZ25Mb29wKSB7XHJcbiAgICBzeW1ib2xUYWJsZS5yZWdpc3RlclN5bWJvbCh0aGlzLnRhYmxlLCBcIlRcIik7XHJcblxyXG4gICAgdmFyIGV4cEpzID0gZXhwcmVzc2lvbi50b0pzR2V0KHN5bWJvbFRhYmxlLCB0cnVlKTtcclxuICAgIHZhciBmbnNKcyA9IHN5bWJvbFRhYmxlLmdldEZ1bmN0aW9uc0pzU2V0KCk7XHJcbiAgICBzeW1ib2xUYWJsZS5jbGVhckZ1bmN0aW9ucygpO1xyXG5cclxuICAgIHZhciBqcyA9IFwiJHJTdGFjay5wdXNoKCRyKTsgZm9yICgkciA9IFwiICsgdGhpcy5zdGFydFJvdy5yb3cgKyBcIjsgJHIgPD0gXCIgKyB0aGlzLmVuZFJvdy5yb3cgKyBcIjsgJHIrKykgeyBcIiBcclxuICAgICAgICBqcyArPSBmbnNKcyArIFwiJCQgPSBcIiArIHRoaXMudGFibGUgKyBcIi5zZXRWYWx1ZSgnXCIgKyBcclxuICAgICAgICAgICAgdGhpcy5zdGFydENvbHVtbiArIFwiJywgJHIsXCIgK1xyXG4gICAgICAgICAgICBleHBKcyArIFwiKTtcIjsgXHJcbiAgICBqcyArPSBcIiB9OyAkciA9ICRyU3RhY2sucG9wKCkgfHwgMDtcIlxyXG4gICAgcmV0dXJuIGpzO1xyXG59XHJcblxyXG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxyXG4gKiBGdW5jdGlvbkNhbGxFeHByZXNzaW9uIFxyXG4gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cclxuXHJcbmZ1bmN0aW9uIEZ1bmN0aW9uQ2FsbEV4cHJlc3Npb24oaWRlbnRpZmllciwgZm5QYXJhbWV0ZXJzKSB7XHJcbiAgICB0aGlzLklkZW50aWZpZXIgPSBpZGVudGlmaWVyO1xyXG4gICAgdGhpcy5DYWxsUGFyYW1ldGVycyA9IGZuUGFyYW1ldGVycztcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMuRnVuY3Rpb25DYWxsRXhwcmVzc2lvbiA9IEZ1bmN0aW9uQ2FsbEV4cHJlc3Npb247XHJcblxyXG5GdW5jdGlvbkNhbGxFeHByZXNzaW9uLnByb3RvdHlwZS5nZXRDaGlsZEV4cHJlc3Npb25zID0gZnVuY3Rpb24gKCkge1xyXG4gICAgcmV0dXJuIHRoaXMuQ2FsbFBhcmFtZXRlcnM7XHJcbn1cclxuXHJcbkZ1bmN0aW9uQ2FsbEV4cHJlc3Npb24ucHJvdG90eXBlLnRvSnNHZXQgPSBmdW5jdGlvbiAoc3ltYm9sVGFibGUsIGluc2lkZUFzc2lnbkxvb3ApIHtcclxuICAgIHZhciBwYXJhbXMgPSBudWxsO1xyXG4gICAgc3ltYm9sVGFibGUucmVnaXN0ZXJTeW1ib2wodGhpcy5JZGVudGlmaWVyLCBcIkZcIik7XHJcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuQ2FsbFBhcmFtZXRlcnMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICBpZiAocGFyYW1zID09IG51bGwpXHJcbiAgICAgICAgICAgIHBhcmFtcyA9IHRoaXMuQ2FsbFBhcmFtZXRlcnNbaV0udG9Kc0dldChzeW1ib2xUYWJsZSwgaW5zaWRlQXNzaWduTG9vcCk7XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICBwYXJhbXMgKz0gXCIsXCIgKyB0aGlzLkNhbGxQYXJhbWV0ZXJzW2ldLnRvSnNHZXQoc3ltYm9sVGFibGUsIGluc2lkZUFzc2lnbkxvb3ApO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICAvLyB2YXIgc3ltYm9sTmFtZSA9IHN5bWJvbFRhYmxlLnJlZ2lzdGVyRnVuY3Rpb24odGhpcy5JZGVudGlmaWVyLCBcIiQuZm4uXCIgKyB0aGlzLklkZW50aWZpZXIgKyBcIihcIiArIHBhcmFtcyArIFwiKVwiKTtcclxuICAgIHZhciBzeW1ib2xOYW1lID0gc3ltYm9sVGFibGUucmVnaXN0ZXJGdW5jdGlvbih0aGlzLklkZW50aWZpZXIsIFwiJC5pbmplY3Rvci5yZXNvbHZlKCQuZm4uXCIgKyB0aGlzLklkZW50aWZpZXIgKyBcIikoXCIgKyBwYXJhbXMgKyBcIilcIik7XHJcbiAgICByZXR1cm4gc3ltYm9sTmFtZTtcclxufTtcclxuXHJcbi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXHJcbiAqIFZhcmlhYmxlRGVmTGlzdEV4cHJlc3Npb24gXHJcbiAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xyXG5mdW5jdGlvbiBWYXJpYWJsZURlZkxpc3RFeHByZXNzaW9uKGRlZkFycmF5KSB7XHJcbiAgICB0aGlzLmRlZkFycmF5ID0gZGVmQXJyYXk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzLlZhcmlhYmxlRGVmTGlzdEV4cHJlc3Npb24gPSBWYXJpYWJsZURlZkxpc3RFeHByZXNzaW9uO1xyXG5cclxuVmFyaWFibGVEZWZMaXN0RXhwcmVzc2lvbi5wcm90b3R5cGUuZmlsbFN5bWJvbFRhYmxlID0gZnVuY3Rpb24odGFibGUpIHtcclxuICAgIGlmICh0aGlzLmRlZkFycmF5KSB7XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmRlZkFycmF5Lmxlbmd0aDsgaSsrKVxyXG4gICAgICAgICAgICB0YWJsZS5yZWdpc3RlclN5bWJvbCh0aGlzLmRlZkFycmF5W2ldLCAnVicpO1xyXG4gICAgfVxyXG59XHJcblxyXG5WYXJpYWJsZURlZkxpc3RFeHByZXNzaW9uLnByb3RvdHlwZS5nZXRDaGlsZEV4cHJlc3Npb25zID0gZnVuY3Rpb24gKCkge1xyXG4gICAgcmV0dXJuIFtdO1xyXG59XHJcblxyXG5WYXJpYWJsZURlZkxpc3RFeHByZXNzaW9uLnByb3RvdHlwZS5nZXRTaWduYXR1cmUgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICByZXR1cm4gdGhpcy5kZWZBcnJheS5zbGljZSgwKTtcclxufVxyXG5cclxuVmFyaWFibGVEZWZMaXN0RXhwcmVzc2lvbi5wcm90b3R5cGUudG9Kc0dldCA9IGZ1bmN0aW9uIChzeW1ib2xUYWJsZSwgaW5zaWRlQXNzaWduTG9vcCkge1xyXG4gICAgdGhyb3cgeyBNZXNzYWdlOiBcIkNhbiBub3QgZ2V0IGZyb20gYSBWYXJpYWJsZURlZkxpc3RFeHByZXNzaW9uXCIgfTtcclxufTtcclxuXHJcblZhcmlhYmxlRGVmTGlzdEV4cHJlc3Npb24ucHJvdG90eXBlLnRvSnNTZXQgPSBmdW5jdGlvbiAoZXhwcmVzc2lvbiwgc3ltYm9sVGFibGUsIGluc2lkZUFzc2lnbkxvb3ApIHtcclxuICAgIC8vIGlmICh0aGlzLmRlZkFycmF5KSB7XHJcbiAgICAvLyAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmRlZkFycmF5Lmxlbmd0aDsgaSsrKVxyXG4gICAgLy8gICAgICAgICBzeW1ib2xUYWJsZS5yZWdpc3RlclN5bWJvbCh0aGlzLmRlZkFycmF5W2ldLCAnVicpO1xyXG4gICAgLy8gfVxyXG59O1xyXG5cclxuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcclxuICogT3BlcmF0b3JFeHByZXNzaW9uIFxyXG4gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cclxuXHJcbmZ1bmN0aW9uIE9wZXJhdG9yRXhwcmVzc2lvbiAoZXhwcmVzc2lvbjEsIGV4cHJlc3Npb24yLCBvcGVyYXRvcikge1xyXG4gICAgdGhpcy5leHByZXNzaW9uMSA9IGV4cHJlc3Npb24xO1xyXG4gICAgdGhpcy5leHByZXNzaW9uMiA9IGV4cHJlc3Npb24yO1xyXG4gICAgdGhpcy5vcGVyYXRvciA9IG9wZXJhdG9yO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cy5PcGVyYXRvckV4cHJlc3Npb24gPSBPcGVyYXRvckV4cHJlc3Npb247XHJcblxyXG5PcGVyYXRvckV4cHJlc3Npb24ucHJvdG90eXBlLmdldENoaWxkRXhwcmVzc2lvbnMgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICByZXR1cm4gW3RoaXMuZXhwcmVzc2lvbjEsIHRoaXMuZXhwcmVzc2lvbjJdO1xyXG59XHJcblxyXG5PcGVyYXRvckV4cHJlc3Npb24ucHJvdG90eXBlLnRvSnNHZXQgPSBmdW5jdGlvbiAoc3ltYm9sVGFibGUsIGluc2lkZUFzc2lnbkxvb3ApIHtcclxuXHJcbiAgICB2YXIganM7XHJcblxyXG4gICAgaWYgKHRoaXMub3BlcmF0b3IgPT09IFwiK1wiKSB7XHJcbiAgICAgICAganMgPSBcIiQuZm4uQUREKFwiICsgdGhpcy5leHByZXNzaW9uMS50b0pzR2V0KHN5bWJvbFRhYmxlLCBpbnNpZGVBc3NpZ25Mb29wKVxyXG4gICAgICAgICAgICArIFwiLCBcIiArIHRoaXMuZXhwcmVzc2lvbjIudG9Kc0dldChzeW1ib2xUYWJsZSwgaW5zaWRlQXNzaWduTG9vcCkgKyBcIilcIjsgXHJcbiAgICB9IGVsc2UgaWYgKHRoaXMub3BlcmF0b3IgPT09IFwiLVwiKSB7XHJcbiAgICAgICAganMgPSBcIiQuZm4uU1VCVFIoXCIgKyB0aGlzLmV4cHJlc3Npb24xLnRvSnNHZXQoc3ltYm9sVGFibGUsIGluc2lkZUFzc2lnbkxvb3ApXHJcbiAgICAgICAgICAgICsgXCIsIFwiICsgdGhpcy5leHByZXNzaW9uMi50b0pzR2V0KHN5bWJvbFRhYmxlLCBpbnNpZGVBc3NpZ25Mb29wKSArIFwiKVwiOyBcclxuICAgIH0gZWxzZSBpZiAodGhpcy5vcGVyYXRvciA9PT0gXCIqXCIpIHtcclxuICAgICAgICBqcyA9IFwiJC5mbi5NVUxUKFwiICsgdGhpcy5leHByZXNzaW9uMS50b0pzR2V0KHN5bWJvbFRhYmxlLCBpbnNpZGVBc3NpZ25Mb29wKVxyXG4gICAgICAgICAgICArIFwiLCBcIiArIHRoaXMuZXhwcmVzc2lvbjIudG9Kc0dldChzeW1ib2xUYWJsZSwgaW5zaWRlQXNzaWduTG9vcCkgKyBcIilcIjsgXHJcbiAgICB9IGVsc2UgaWYgKHRoaXMub3BlcmF0b3IgPT09IFwiL1wiKSB7XHJcbiAgICAgICAganMgPSBcIiQuZm4uRElWKFwiICsgdGhpcy5leHByZXNzaW9uMS50b0pzR2V0KHN5bWJvbFRhYmxlLCBpbnNpZGVBc3NpZ25Mb29wKVxyXG4gICAgICAgICAgICArIFwiLCBcIiArIHRoaXMuZXhwcmVzc2lvbjIudG9Kc0dldChzeW1ib2xUYWJsZSwgaW5zaWRlQXNzaWduTG9vcCkgKyBcIilcIjsgXHJcbiAgICB9IGVsc2UgaWYgKHRoaXMub3BlcmF0b3IgPT09IFwiPT1cIikge1xyXG4gICAgICAgIGpzID0gXCIkLmZuLkVRKFwiICsgdGhpcy5leHByZXNzaW9uMS50b0pzR2V0KHN5bWJvbFRhYmxlLCBpbnNpZGVBc3NpZ25Mb29wKVxyXG4gICAgICAgICAgICArIFwiLCBcIiArIHRoaXMuZXhwcmVzc2lvbjIudG9Kc0dldChzeW1ib2xUYWJsZSwgaW5zaWRlQXNzaWduTG9vcCkgKyBcIilcIjsgXHJcbiAgICB9IGVsc2UgaWYgKHRoaXMub3BlcmF0b3IgPT09IFwiIT1cIikge1xyXG4gICAgICAgIGpzID0gXCIkLmZuLk5FUShcIiArIHRoaXMuZXhwcmVzc2lvbjEudG9Kc0dldChzeW1ib2xUYWJsZSwgaW5zaWRlQXNzaWduTG9vcClcclxuICAgICAgICAgICAgKyBcIiwgXCIgKyB0aGlzLmV4cHJlc3Npb24yLnRvSnNHZXQoc3ltYm9sVGFibGUsIGluc2lkZUFzc2lnbkxvb3ApICsgXCIpXCI7IFxyXG4gICAgfSBlbHNlIGlmICh0aGlzLm9wZXJhdG9yID09PSBcIj5cIikge1xyXG4gICAgICAgIGpzID0gXCIkLmZuLkdUKFwiICsgdGhpcy5leHByZXNzaW9uMS50b0pzR2V0KHN5bWJvbFRhYmxlLCBpbnNpZGVBc3NpZ25Mb29wKVxyXG4gICAgICAgICAgICArIFwiLCBcIiArIHRoaXMuZXhwcmVzc2lvbjIudG9Kc0dldChzeW1ib2xUYWJsZSwgaW5zaWRlQXNzaWduTG9vcCkgKyBcIilcIjsgXHJcbiAgICB9IGVsc2UgaWYgKHRoaXMub3BlcmF0b3IgPT09IFwiPj1cIikge1xyXG4gICAgICAgIGpzID0gXCIkLmZuLkdURShcIiArIHRoaXMuZXhwcmVzc2lvbjEudG9Kc0dldChzeW1ib2xUYWJsZSwgaW5zaWRlQXNzaWduTG9vcClcclxuICAgICAgICAgICAgKyBcIiwgXCIgKyB0aGlzLmV4cHJlc3Npb24yLnRvSnNHZXQoc3ltYm9sVGFibGUsIGluc2lkZUFzc2lnbkxvb3ApICsgXCIpXCI7IFxyXG4gICAgfSBlbHNlIGlmICh0aGlzLm9wZXJhdG9yID09PSBcIjxcIikge1xyXG4gICAgICAgIGpzID0gXCIkLmZuLlNUKFwiICsgdGhpcy5leHByZXNzaW9uMS50b0pzR2V0KHN5bWJvbFRhYmxlLCBpbnNpZGVBc3NpZ25Mb29wKVxyXG4gICAgICAgICAgICArIFwiLCBcIiArIHRoaXMuZXhwcmVzc2lvbjIudG9Kc0dldChzeW1ib2xUYWJsZSwgaW5zaWRlQXNzaWduTG9vcCkgKyBcIilcIjsgXHJcbiAgICB9IGVsc2UgaWYgKHRoaXMub3BlcmF0b3IgPT09IFwiPD1cIikge1xyXG4gICAgICAgIGpzID0gXCIkLmZuLlNURShcIiArIHRoaXMuZXhwcmVzc2lvbjEudG9Kc0dldChzeW1ib2xUYWJsZSwgaW5zaWRlQXNzaWduTG9vcClcclxuICAgICAgICAgICAgKyBcIiwgXCIgKyB0aGlzLmV4cHJlc3Npb24yLnRvSnNHZXQoc3ltYm9sVGFibGUsIGluc2lkZUFzc2lnbkxvb3ApICsgXCIpXCI7IFxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBqcyA9IHRoaXMuZXhwcmVzc2lvbjEudG9Kc0dldChzeW1ib2xUYWJsZSwgaW5zaWRlQXNzaWduTG9vcCkgKyB0aGlzLm9wZXJhdG9yIFxyXG4gICAgICAgICAgICArIHRoaXMuZXhwcmVzc2lvbjIudG9Kc0dldChzeW1ib2xUYWJsZSwgaW5zaWRlQXNzaWduTG9vcCk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gcmV0dXJuIGpzO1xyXG4gICAgdmFyIHN5bWJvbE5hbWUgPSBzeW1ib2xUYWJsZS5yZWdpc3RlckZ1bmN0aW9uKFwiT3BcIiwganMpO1xyXG4gICAgcmV0dXJuIHN5bWJvbE5hbWU7XHJcblxyXG59XHJcblxyXG5PcGVyYXRvckV4cHJlc3Npb24ucHJvdG90eXBlLnRvSnNTZXQgPSBmdW5jdGlvbiAoZXhwcmVzc2lvbiwgc3ltYm9sVGFibGUsIGluc2lkZUFzc2lnbkxvb3ApIHtcclxuICAgIHRocm93IHtNZXNzYWdlOiBcIkNhbiBub3Qgc2V0IHRvIGEgY29tcGxleCBleHByZXNzaW9uXCJ9O1xyXG59XHJcblxyXG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxyXG4gKiBOdW1iZXJFeHByZXNzaW9uIFxyXG4gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cclxuXHJcbmZ1bmN0aW9uIE51bWJlckV4cHJlc3Npb24odGV4dCkge1xyXG4gICAgdGhpcy5UZXh0ID0gdGV4dDtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMuTnVtYmVyRXhwcmVzc2lvbiA9IE51bWJlckV4cHJlc3Npb247XHJcblxyXG5OdW1iZXJFeHByZXNzaW9uLnByb3RvdHlwZS50b0pzR2V0ID0gZnVuY3Rpb24gKHN5bWJvbFRhYmxlLCBpbnNpZGVBc3NpZ25Mb29wKSB7XHJcbiAgICByZXR1cm4gTnVtYmVyKHRoaXMuVGV4dCkudG9TdHJpbmcoKTtcclxufTtcclxuXHJcbi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXHJcbiAqIFN0cmluZ0V4cHJlc3Npb24gXHJcbiAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xyXG5cclxuZnVuY3Rpb24gU3RyaW5nRXhwcmVzc2lvbih0ZXh0KSB7XHJcbiAgICB0aGlzLlRleHQgPSB0ZXh0O1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cy5TdHJpbmdFeHByZXNzaW9uID0gU3RyaW5nRXhwcmVzc2lvbjtcclxuXHJcblN0cmluZ0V4cHJlc3Npb24ucHJvdG90eXBlLnRvSnNHZXQgPSBmdW5jdGlvbiAoc3ltYm9sVGFibGUsIGluc2lkZUFzc2lnbkxvb3ApIHtcclxuICAgIHJldHVybiB0aGlzLlRleHQ7XHJcbn07XHJcblxyXG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxyXG4gKiBBcnJheUV4cHJlc3Npb24gXHJcbiAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xyXG5cclxuZnVuY3Rpb24gQXJyYXlFeHByZXNzaW9uKGFycikge1xyXG4gICAgdGhpcy5BcnJheSA9IGFycjtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMuQXJyYXlFeHByZXNzaW9uID0gQXJyYXlFeHByZXNzaW9uO1xyXG5cclxuQXJyYXlFeHByZXNzaW9uLnByb3RvdHlwZS50b0pzR2V0ID0gZnVuY3Rpb24gKHN5bWJvbFRhYmxlLCBpbnNpZGVBc3NpZ25Mb29wKSB7XHJcbiAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkodGhpcy5BcnJheSk7XHJcbn07XHJcblxyXG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxyXG4gKiBQYXJlbnRpc2lzRXhwcmVzc2lvbiBcclxuICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXHJcblxyXG5mdW5jdGlvbiBQYXJlbnRpc2lzRXhwcmVzc2lvbihleHByZXNzaW9uKSB7XHJcbiAgICB0aGlzLmV4cHJlc3Npb24gPSBleHByZXNzaW9uO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cy5QYXJlbnRpc2lzRXhwcmVzc2lvbiA9IFBhcmVudGlzaXNFeHByZXNzaW9uO1xyXG5cclxuUGFyZW50aXNpc0V4cHJlc3Npb24ucHJvdG90eXBlLmdldENoaWxkRXhwcmVzc2lvbnMgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICByZXR1cm4gW3RoaXMuZXhwcmVzc2lvbl07XHJcbn1cclxuXHJcblBhcmVudGlzaXNFeHByZXNzaW9uLnByb3RvdHlwZS50b0pzR2V0ID0gZnVuY3Rpb24gKHN5bWJvbFRhYmxlLCBpbnNpZGVBc3NpZ25Mb29wKSB7XHJcbiAgICByZXR1cm4gJygnICsgdGhpcy5leHByZXNzaW9uLnRvSnNHZXQoc3ltYm9sVGFibGUsIGluc2lkZUFzc2lnbkxvb3ApICsgJyknO1xyXG59O1xyXG5cclxuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcclxuICogTmVnYXRpdmVFeHByZXNzaW9uIFxyXG4gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cclxuXHJcbmZ1bmN0aW9uIE5lZ2F0aXZlRXhwcmVzc2lvbihleHByZXNzaW9uKSB7XHJcbiAgICB0aGlzLmV4cHJlc3Npb24gPSBleHByZXNzaW9uO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cy5OZWdhdGl2ZUV4cHJlc3Npb24gPSBOZWdhdGl2ZUV4cHJlc3Npb247XHJcblxyXG5OZWdhdGl2ZUV4cHJlc3Npb24ucHJvdG90eXBlLmdldENoaWxkRXhwcmVzc2lvbnMgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICByZXR1cm4gW3RoaXMuZXhwcmVzc2lvbl07XHJcbn1cclxuXHJcbk5lZ2F0aXZlRXhwcmVzc2lvbi5wcm90b3R5cGUudG9Kc0dldCA9IGZ1bmN0aW9uIChzeW1ib2xUYWJsZSwgaW5zaWRlQXNzaWduTG9vcCkge1xyXG4gICAgcmV0dXJuICckLmZuLk1VTFQoJyArIHRoaXMuZXhwcmVzc2lvbi50b0pzR2V0KHN5bWJvbFRhYmxlLCBpbnNpZGVBc3NpZ25Mb29wKSArICcsIC0xKSc7XHJcbn07XHJcblxyXG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxyXG4gKiBOb3RFeHByZXNzaW9uIFxyXG4gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cclxuXHJcbmZ1bmN0aW9uIE5vdEV4cHJlc3Npb24oZXhwcmVzc2lvbikge1xyXG4gICAgdGhpcy5leHByZXNzaW9uID0gZXhwcmVzc2lvbjtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMuTm90RXhwcmVzc2lvbiA9IE5vdEV4cHJlc3Npb247XHJcblxyXG5Ob3RFeHByZXNzaW9uLnByb3RvdHlwZS5nZXRDaGlsZEV4cHJlc3Npb25zID0gZnVuY3Rpb24gKCkge1xyXG4gICAgcmV0dXJuIFt0aGlzLmV4cHJlc3Npb25dO1xyXG59XHJcblxyXG5Ob3RFeHByZXNzaW9uLnByb3RvdHlwZS50b0pzR2V0ID0gZnVuY3Rpb24gKHN5bWJvbFRhYmxlLCBpbnNpZGVBc3NpZ25Mb29wKSB7XHJcbiAgICByZXR1cm4gJyQuZm4uTk9UKCcgKyB0aGlzLmV4cHJlc3Npb24udG9Kc0dldChzeW1ib2xUYWJsZSwgaW5zaWRlQXNzaWduTG9vcCkgKyAnKSc7XHJcbn07XHJcblxyXG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxyXG4gKiBQZXJjZW50RXhwcmVzc2lvbiBcclxuICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXHJcblxyXG5mdW5jdGlvbiBQZXJjZW50RXhwcmVzc2lvbihleHByZXNzaW9uKSB7XHJcbiAgICB0aGlzLmV4cHJlc3Npb24gPSBleHByZXNzaW9uO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cy5QZXJjZW50RXhwcmVzc2lvbiA9IFBlcmNlbnRFeHByZXNzaW9uO1xyXG5cclxuUGVyY2VudEV4cHJlc3Npb24ucHJvdG90eXBlLmdldENoaWxkRXhwcmVzc2lvbnMgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICByZXR1cm4gW3RoaXMuZXhwcmVzc2lvbl07XHJcbn1cclxuXHJcblBlcmNlbnRFeHByZXNzaW9uLnByb3RvdHlwZS50b0pzR2V0ID0gZnVuY3Rpb24gKHN5bWJvbFRhYmxlLCBpbnNpZGVBc3NpZ25Mb29wKSB7XHJcbiAgICByZXR1cm4gXCIkLmZuLlBlcmNlbnQoXCIgKyB0aGlzLmV4cHJlc3Npb24udG9Kc0dldChzeW1ib2xUYWJsZSwgaW5zaWRlQXNzaWduTG9vcCkgKyBcIilcIjtcclxufTtcclxuXHJcbi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXHJcbiAqIFBvd0V4cHJlc3Npb24gXHJcbiAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xyXG5cclxuZnVuY3Rpb24gUG93RXhwcmVzc2lvbihiYXNlRXhwcmVzc2lvbiwgZXhwRXhwcmVzc2lvbikge1xyXG4gICAgdGhpcy5CID0gYmFzZUV4cHJlc3Npb247XHJcbiAgICB0aGlzLkUgPSBleHBFeHByZXNzaW9uO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cy5Qb3dFeHByZXNzaW9uID0gUG93RXhwcmVzc2lvbjtcclxuXHJcblBvd0V4cHJlc3Npb24ucHJvdG90eXBlLmdldENoaWxkRXhwcmVzc2lvbnMgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICByZXR1cm4gW3RoaXMuRSwgdGhpcy5CXTtcclxufVxyXG5cclxuUG93RXhwcmVzc2lvbi5wcm90b3R5cGUudG9Kc0dldCA9IGZ1bmN0aW9uIChzeW1ib2xUYWJsZSwgaW5zaWRlQXNzaWduTG9vcCkge1xyXG4gICAgcmV0dXJuIFwiJC5mbi5QT1coXCIgKyB0aGlzLkIudG9Kc0dldChzeW1ib2xUYWJsZSwgaW5zaWRlQXNzaWduTG9vcCkgKyBcIixcIiArIHRoaXMuRS50b0pzR2V0KHN5bWJvbFRhYmxlLCBpbnNpZGVBc3NpZ25Mb29wKSArIFwiKVwiO1xyXG59O1xyXG5cclxuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxyXG4gKiBnZXRFeHByZXNzaW9uRGVwZW5kZWNpZXNcclxuICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxyXG4gKiBkZXZvbHZlIGEgbGlzdGEgZGUgdG9kYXMgYXMgZGVwZW5kZW5jaWFzIGRlIHVtYSBcclxuICogZGV0ZXJtaW5hZGEgZXhwcmVzc8Ojb1xyXG4gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xyXG5mdW5jdGlvbiBnZXRFeHByZXNzaW9uRGVwZW5kZWNpZXMoZXhwcmVzc2lvbikge1xyXG4gICAgdmFyIGRlcHMgPSBbXTtcclxuXHJcbiAgICBpZiAoZXhwcmVzc2lvbi5nZXRDaGlsZEV4cHJlc3Npb25zKSB7XHJcbiAgICAgICAgdmFyIGNoaWxkcmVuID0gZXhwcmVzc2lvbi5nZXRDaGlsZEV4cHJlc3Npb25zKCk7XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjaGlsZHJlbi5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBpZiAoY2hpbGRyZW5baV0uZ2V0U2lnbmF0dXJlKSB7XHJcbiAgICAgICAgICAgICAgICBkZXBzLnB1c2guYXBwbHkoZGVwcywgY2hpbGRyZW5baV0uZ2V0U2lnbmF0dXJlKCkpXHJcbiAgICAgICAgICAgIH0gZWxzZVxyXG4gICAgICAgICAgICAgICAgZGVwcy5wdXNoLmFwcGx5KGRlcHMsIGdldEV4cHJlc3Npb25EZXBlbmRlY2llcyhjaGlsZHJlbltpXSkpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gZGVwcztcclxufVxyXG5cclxuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxyXG4gKiBnZXRBc3NpZ25lZFZhcnNcclxuICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxyXG4gKiBkZXZvbHZlIGEgbGlzdGEgZGUgdG9kYXMgYXMgdmFyaWF2ZWlzIHF1ZSBzw6NvIGFzc2lnbmFkYXNcclxuICogcG9yIHVtYSBkZXRlcm1pbmFkYSBleHByZXNzw6NvLlxyXG4gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xyXG5mdW5jdGlvbiBnZXRBc3NpZ25lZFZhcnMoZXhwcmVzc2lvbikge1xyXG4gICAgdmFyIHJldCA9IFtdXHJcblxyXG4gICAgaWYgKGV4cHJlc3Npb24uY29uc3RydWN0b3IgPT09IEFzc2lnbkV4cHJlc3Npb24pIHtcclxuICAgICAgICB2YXIgc2lnbmF0dXJlID0gZXhwcmVzc2lvbi5pZGVudGlmaWVyLmdldFNpZ25hdHVyZSgpO1xyXG4gICAgICAgIGlmIChzaWduYXR1cmUubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIGZvciAodmFyIHMgPSAwOyBzIDwgc2lnbmF0dXJlLmxlbmd0aDsgcysrKVxyXG4gICAgICAgICAgICAgICAgaWYgKHJldC5pbmRleE9mKHNpZ25hdHVyZVtzXSkgPCAwKVxyXG4gICAgICAgICAgICAgICAgICAgIHJldC5wdXNoKHNpZ25hdHVyZVtzXSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSBlbHNlIGlmIChleHByZXNzaW9uLmNvbnN0cnVjdG9yID09PSBWYXJpYWJsZURlZkxpc3RFeHByZXNzaW9uKSB7XHJcbiAgICAgICAgdmFyIHNpZ25hdHVyZSA9IGV4cHJlc3Npb24uZ2V0U2lnbmF0dXJlKCk7XHJcbiAgICAgICAgaWYgKHNpZ25hdHVyZS5sZW5ndGgpIHtcclxuICAgICAgICAgICAgZm9yICh2YXIgcyA9IDA7IHMgPCBzaWduYXR1cmUubGVuZ3RoOyBzKyspXHJcbiAgICAgICAgICAgICAgICBpZiAocmV0LmluZGV4T2Yoc2lnbmF0dXJlW3NdKSA8IDApXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0LnB1c2goc2lnbmF0dXJlW3NdKTtcclxuICAgICAgICB9XHJcbiAgICB9IGVsc2UgaWYgKGV4cHJlc3Npb24uY29uc3RydWN0b3IgPT09IEFzc2lnbkV4cHJlc3Npb25Hcm91cCkge1xyXG4gICAgICAgIGZvciAodmFyIGUgPSAwOyBlIDwgZXhwcmVzc2lvbi5leHByZXNzaW9ucy5sZW5ndGg7IGUrKykge1xyXG4gICAgICAgICAgICB2YXIgc2lnbmF0dXJlID0gZ2V0QXNzaWduZWRWYXJzKGV4cHJlc3Npb24uZXhwcmVzc2lvbnNbZV0pO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBzID0gMDsgcyA8IHNpZ25hdHVyZS5sZW5ndGg7IHMrKylcclxuICAgICAgICAgICAgICAgIGlmIChyZXQuaW5kZXhPZihzaWduYXR1cmVbc10pIDwgMClcclxuICAgICAgICAgICAgICAgICAgICByZXQucHVzaChzaWduYXR1cmVbc10pO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gcmV0O1xyXG59XHJcblxyXG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcclxuICogZ2V0VW5yZXNvbHZlZFZhcnNcclxuICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXHJcbiAqIGRldm9sdmUgYSBsaXN0YSBkZSB0b2RhcyBhcyBwb250ZW5jaWFpcyB2YXJpYXZlaXNcclxuICogbsOjbyByZXNvbHZpZGFzOiBpLmUuIGEgbGlzdGEgZGUgdG9kYXMgYXMgdmFyaWF2ZWlzXHJcbiAqIGFzc2lnbmFkYXMgbsOjbyBwZXJ0ZW5jZW50ZXMgYW8gY29udGV4dG9cclxuICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xyXG5mdW5jdGlvbiBnZXRVbnJlc29sdmVkVmFycyhleHByZXNzaW9ucykge1xyXG4gICAgdmFyIGNvbnRleHRWYXJzID0gW107XHJcbiAgICB2YXIgcmV0ID0gW107XHJcbiAgICBpZiAoZXhwcmVzc2lvbnMgJiYgZXhwcmVzc2lvbnMubGVuZ3RoKSB7XHJcbiAgICAgICAgZm9yICh2YXIgZSA9IDA7IGUgPCBleHByZXNzaW9ucy5sZW5ndGg7IGUrKykge1xyXG4gICAgICAgICAgICB2YXIgZXhwID0gZXhwcmVzc2lvbnNbZV07XHJcbiAgICAgICAgICAgIGlmIChleHAuY29uc3RydWN0b3IgPT09IEFzc2lnbkV4cHJlc3Npb24pIHtcclxuICAgICAgICAgICAgICAgIHZhciBzaWduYXR1cmUgPSBleHAuaWRlbnRpZmllci5nZXRTaWduYXR1cmUoKTtcclxuICAgICAgICAgICAgICAgIGlmIChzaWduYXR1cmUubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgcyA9IDA7IHMgPCBzaWduYXR1cmUubGVuZ3RoOyBzKyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNvbnRleHRWYXJzLmluZGV4T2Yoc2lnbmF0dXJlWzBdKSA8IDApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXQuaW5kZXhPZihzaWduYXR1cmVbc10pIDwgMClcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXQucHVzaChzaWduYXR1cmVbc10pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9IGlmIChleHAuY29uc3RydWN0b3IgPT09IEFzc2lnbkV4cHJlc3Npb25Hcm91cCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHNpZ25hdHVyZSA9IGdldFVucmVzb2x2ZWRWYXJzKGV4cC5leHByZXNzaW9ucyk7XHJcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBzID0gMDsgcyA8IHNpZ25hdHVyZS5sZW5ndGg7IHMrKylcclxuICAgICAgICAgICAgICAgICAgICBpZiAocmV0LmluZGV4T2Yoc2lnbmF0dXJlW3NdKSA8IDApXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldC5wdXNoKHNpZ25hdHVyZVtzXSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZXhwLmNvbnN0cnVjdG9yID09PSBWYXJpYWJsZURlZkxpc3RFeHByZXNzaW9uKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgc2lnbmF0dXJlID0gZXhwLmdldFNpZ25hdHVyZSgpO1xyXG4gICAgICAgICAgICAgICAgaWYgKHNpZ25hdHVyZS5sZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBzID0gMDsgcyA8IHNpZ25hdHVyZS5sZW5ndGg7IHMrKylcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGV4dFZhcnMucHVzaChzaWduYXR1cmVbc10pO1xyXG4gICAgICAgICAgICAgICAgfSAgICAgICBcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiByZXQ7XHJcbn1cclxuXHJcbi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcclxuICogc29ydEV4cHJlc3Npb25zXHJcbiAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcclxuICogb3JkZW5hIGEgbGlzdGEgZGUgZXhwcmVzc8O1ZXMgZGUgYWNvcmRvIGNvbSBhcyBzdWFzXHJcbiAqIGRlcGVuZGVuY2lhcyBlIHZhcmlhdmVpcyByZXNvbHZpZGFzXHJcbiAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXHJcbmZ1bmN0aW9uIHNvcnRFeHByZXNzaW9ucyhvcmdfZXhwcmVzc2lvbnMpIHtcclxuICAgIHZhciBleHByZXNzaW9ucyA9IG9yZ19leHByZXNzaW9ucy5zbGljZSgwKTtcclxuICAgIHZhciBzb3J0ZWRFeHByZXNzaW9ucyA9IFtdO1xyXG4gICAgdmFyIHJlc29sdmVkU2lnbmF0dXJlcyA9IFtdO1xyXG4gICAgdmFyIHN1c3BlY3RlZFZhcmlhYmxlcyA9IFtdO1xyXG4gICAgdmFyIHVucmVzb2x2ZWRWYXJzID0gZ2V0VW5yZXNvbHZlZFZhcnMob3JnX2V4cHJlc3Npb25zKTtcclxuICAgIHZhciBkb25lID0gZmFsc2U7XHJcbiAgICB2YXIgbnRyeSA9IDA7XHJcbiAgICB3aGlsZSAoIWRvbmUpIHtcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGV4cHJlc3Npb25zLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIHZhciBlID0gZXhwcmVzc2lvbnNbaV07XHJcbiAgICAgICAgICAgIHZhciBkZXBzID0gZ2V0RXhwcmVzc2lvbkRlcGVuZGVjaWVzKGUpO1xyXG4gICAgICAgICAgICB2YXIgYXNzaWduVmFycyA9IGdldEFzc2lnbmVkVmFycyhlKTtcclxuXHJcbiAgICAgICAgICAgIHZhciByZXNvbHZlZCA9IHRydWU7XHJcbiAgICAgICAgICAgIHZhciBmb3VuZFRvUmVzb2x2ZSA9IGZhbHNlO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBkID0gMDsgZCA8IGRlcHMubGVuZ3RoOyBkKyspIHtcclxuICAgICAgICAgICAgICAgIGlmICh1bnJlc29sdmVkVmFycy5pbmRleE9mKGRlcHNbZF0pID49IDApIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgZm91bmRUb1Jlc29sdmUgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChyZXNvbHZlZFNpZ25hdHVyZXMuaW5kZXhPZihkZXBzW2RdKSA8IDAgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICYmIGFzc2lnblZhcnMuaW5kZXhPZihkZXBzW2RdKSA8IDBcclxuICAgICAgICAgICAgICAgICAgICAgICAgJiYgZGVwc1tkXSAhPSBcIiR0YWJsZVtyb3ddXCIpIFxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy9pZiAoZGVwc1tkXS5zdGFydHNXaXRoKFwiJFwiKSAmJiBzdXNwZWN0ZWRWYXJpYWJsZXMuaW5kZXhPZihkZXBzW2RdKSA8IDApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHN1c3BlY3RlZFZhcmlhYmxlcy5pbmRleE9mKGRlcHNbZF0pIDwgMCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3VzcGVjdGVkVmFyaWFibGVzLnB1c2goZGVwc1tkXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZWQgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAocmVzb2x2ZWQpIHtcclxuICAgICAgICAgICAgICAgIHZhciBzaWduYXR1cmVzID0gYXNzaWduVmFycztcclxuICAgICAgICAgICAgICAgIGZvciAodmFyIHMgPSAwOyBzIDwgc2lnbmF0dXJlcy5sZW5ndGg7IHMrKykge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChyZXNvbHZlZFNpZ25hdHVyZXMuaW5kZXhPZihzaWduYXR1cmVzW3NdKSA8IDApXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmVkU2lnbmF0dXJlcy5wdXNoKHNpZ25hdHVyZXNbc10pXHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChmb3VuZFRvUmVzb2x2ZSAmJiB1bnJlc29sdmVkVmFycy5pbmRleE9mKHNpZ25hdHVyZXNbc10pID49IDApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGlkeCA9IHVucmVzb2x2ZWRWYXJzLmluZGV4T2Yoc2lnbmF0dXJlc1tzXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHVucmVzb2x2ZWRWYXJzLnNwbGljZShpZHgsIDEpOyAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgc29ydGVkRXhwcmVzc2lvbnMucHVzaChlKTtcclxuICAgICAgICAgICAgICAgIG50cnkgPSAwO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNvcnRlZEV4cHJlc3Npb25zLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIHZhciBpZHggPSBleHByZXNzaW9ucy5pbmRleE9mKHNvcnRlZEV4cHJlc3Npb25zW2ldKTtcclxuICAgICAgICAgICAgaWYgKGlkeCA+PSAwKSB7XHJcbiAgICAgICAgICAgICAgICBleHByZXNzaW9ucy5zcGxpY2UoaWR4LCAxKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbnRyeSsrO1xyXG4gICAgICAgIGRvbmUgPSAoZXhwcmVzc2lvbnMubGVuZ3RoID09IDAgfHwgbnRyeSA+IDIpO1xyXG5cclxuXHJcbiAgICAgICAgLy9sZXRzIGZpcnN0IHRyZWF0IHN1c3BlY3RlZCB2YXJpYWJsZXMgdGhhdCBhcmUgY29sdW1uc1xyXG4gICAgICAgIGlmIChkb25lKSB7XHJcbiAgICAgICAgICAgIGlmIChzdXNwZWN0ZWRWYXJpYWJsZXMubGVuZ3RoID4gMCkge1xyXG5cclxuICAgICAgICAgICAgICAgIHZhciByZWdleCA9IC9eXFwkW2EtekEtWl9dW2EtekEtWl8wLTldKlxcW1thLXpBLVpfXVthLXpBLVpfMC05XSpcXF1cXCRbMC05XSskL2c7XHJcbiAgICAgICAgICAgICAgICB2YXIgZm91bmQgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgIGZvciAodmFyIHN2ID0gMDsgc3YgPCBzdXNwZWN0ZWRWYXJpYWJsZXMubGVuZ3RoOyBzdisrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHN1c3BlY3RlZFNnID0gc3VzcGVjdGVkVmFyaWFibGVzW3N2XTtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBydiA9IDA7IHJ2IDwgcmVzb2x2ZWRTaWduYXR1cmVzLmxlbmd0aDsgcnYrKykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgcmVzb2x2ZWRTZyA9IHJlc29sdmVkU2lnbmF0dXJlc1tydl07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXNvbHZlZFNnLnN0YXJ0c1dpdGgoc3VzcGVjdGVkU2cpICYmIHJlZ2V4LnRlc3QocmVzb2x2ZWRTZykpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmVkU2lnbmF0dXJlcy5wdXNoKHN1c3BlY3RlZFZhcmlhYmxlcy5zcGxpY2Uoc3YsMSlbMF0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm91bmQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9IFxyXG5cclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoZm91bmQpIHtcclxuICAgICAgICAgICAgICAgICAgICBudHJ5ID0gMDtcclxuICAgICAgICAgICAgICAgICAgICBkb25lID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG5cclxuICAgICAgICAvL2xldHMgYXNzdW1lIG90aGVycyBhcyByZXNvbHZlZCA6KClcclxuICAgICAgICBpZiAoZG9uZSkge1xyXG4gICAgICAgICAgICBpZiAoc3VzcGVjdGVkVmFyaWFibGVzLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgICAgIHJlc29sdmVkU2lnbmF0dXJlcy5wdXNoKHN1c3BlY3RlZFZhcmlhYmxlcy5zcGxpY2UoMCwxKVswXSk7XHJcbiAgICAgICAgICAgICAgICBudHJ5ID0gMDtcclxuICAgICAgICAgICAgICAgIGRvbmUgPSBmYWxzZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgIH1cclxuICAgIHJldHVybiBzb3J0ZWRFeHByZXNzaW9ucztcclxufVxyXG5cclxuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcclxuICogUmVtb3ZlIGNvZGUgdGhhdCBkbyBub3QgY29udHJpYnV0ZSB0byBhbnkgb3V0cHV0XHJcbiAqICh0YWJsZSBvciBnbG9iYWwgdmFyaWFibGUpXHJcbiAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xyXG5mdW5jdGlvbiBDbGVhbkV4cHJlc3Npb25zKG9yZ19leHByZXNzaW9ucykge1xyXG4gICAgdmFyIGV4cHJlc3Npb25zID0gb3JnX2V4cHJlc3Npb25zLnNsaWNlKDApO1xyXG4gICAgdmFyIHJlc29sdmVkU2lnbmF0dXJlcyA9IFtdO1xyXG4gICAgdmFyIHJlc29sdmVkRXhwcmVzc2lvbnMgPSBbXTtcclxuICAgIHZhciBkb25lID0gZmFsc2U7XHJcbiAgICB2YXIgbnRyeSA9IDA7IFxyXG4gICAgd2hpbGUgKCFkb25lKSB7XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBleHByZXNzaW9ucy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICB2YXIgZSA9IGV4cHJlc3Npb25zW2ldO1xyXG4gICAgICAgICAgICBpZiAoZS5pZGVudGlmaWVyICYmIGUuaWRlbnRpZmllci5nZXRTaWduYXR1cmUpIHtcclxuICAgICAgICAgICAgICAgIHZhciBzaWdWYWxpZCA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBzID0gMDsgcyA8IGUuaWRlbnRpZmllci5nZXRTaWduYXR1cmUoKS5sZW5ndGg7IHMrKykge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBzaWduYXR1cmUgPSBlLmlkZW50aWZpZXIuZ2V0U2lnbmF0dXJlKClbc107XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNpZ25hdHVyZS5zdGFydHNXaXRoKCdAJykgfHwgcmVzb2x2ZWRTaWduYXR1cmVzLmluZGV4T2Yoc2lnbmF0dXJlKSA+PSAwKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzaWdWYWxpZCAmPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2lnVmFsaWQgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGUuYnJhbmNoSXNWYWxpZCA9IHNpZ1ZhbGlkO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgaWYgKGkgPT0gb3JnX2V4cHJlc3Npb25zLmxlbmd0aCAtMSlcclxuICAgICAgICAgICAgICAgIGUuYnJhbmNoSXNWYWxpZCA9IHRydWU7XHJcblxyXG4gICAgICAgICAgICBpZiAoZS5icmFuY2hJc1ZhbGlkKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoZS5pZGVudGlmaWVyICYmIGUuaWRlbnRpZmllci5nZXRTaWduYXR1cmUpXHJcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZWRTaWduYXR1cmVzLnB1c2guYXBwbHkocmVzb2x2ZWRTaWduYXR1cmVzLCBlLmlkZW50aWZpZXIuZ2V0U2lnbmF0dXJlKCkpXHJcblxyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZWRTaWduYXR1cmVzLnB1c2guYXBwbHkocmVzb2x2ZWRTaWduYXR1cmVzLCBHZXRFeHByZXNzaW9uRGVwZW5kZWNpZXMoZSkpO1xyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZWRFeHByZXNzaW9ucy5wdXNoKGUpO1xyXG4gICAgICAgICAgICAgICAgbnRyeSA9IDA7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcmVzb2x2ZWRFeHByZXNzaW9ucy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICB2YXIgaWR4ID0gZXhwcmVzc2lvbnMuaW5kZXhPZihyZXNvbHZlZEV4cHJlc3Npb25zW2ldKTtcclxuICAgICAgICAgICAgaWYgKGlkeCA+PSAwKSB7XHJcbiAgICAgICAgICAgICAgICBleHByZXNzaW9ucy5zcGxpY2UoaWR4LCAxKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbnRyeSsrO1xyXG4gICAgICAgIGRvbmUgPSAoZXhwcmVzc2lvbnMubGVuZ3RoID09IDAgfHwgbnRyeSA+IDEpO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciByZXQgPSBbXTtcclxuXHJcbiAgICAvLyBEZWJ1ZyBkZWFkIGNvZGUgZWxpbWluYXRpb25cclxuICAgIC8vIHZhciBTeW1ib2xUYWJsZSA9IHJlcXVpcmUoXCIuL3N5bWJvbFRhYmxlXCIpLlN5bWJvbFRhYmxlO1xyXG4gICAgLy8gdmFyIHRhYmxlID0gbmV3IFN5bWJvbFRhYmxlKCk7XHJcblxyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBvcmdfZXhwcmVzc2lvbnMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICB2YXIgaWR4ID0gcmVzb2x2ZWRFeHByZXNzaW9ucy5pbmRleE9mKG9yZ19leHByZXNzaW9uc1tpXSk7XHJcbiAgICAgICAgaWYgKGlkeCA+PSAwKSB7XHJcbiAgICAgICAgICAgIHJldC5wdXNoKG9yZ19leHByZXNzaW9uc1tpXSk7XHJcbiAgICAgICAgfSBcclxuICAgICAgICAvLyBEZWJ1ZyBkZWFkIGNvZGUgZWxpbWluYXRpb25cclxuICAgICAgICAvLyBlbHNlXHJcbiAgICAgICAgLy8gICAgIGNvbnNvbGUubG9nKG9yZ19leHByZXNzaW9uc1tpXS50b0pzU2V0KG51bGwsdGFibGUsZmFsc2UpICsgXCJcXG5cIik7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHJldDtcclxuXHJcbn1cclxuXHJcbmZ1bmN0aW9uIGZpbGxTeW1ib2xUYWJsZSh0YWJsZSwgZXhwcmVzc2lvbnMpICB7XHJcbiAgICBmb3IgKHZhciBlID0gMDsgZSA8IGV4cHJlc3Npb25zLmxlbmd0aDsgZSsrKSB7XHJcbiAgICAgICAgdmFyIGV4cHJlc3Npb24gPSBleHByZXNzaW9uc1tlXTtcclxuICAgICAgICBpZiAoZXhwcmVzc2lvbi5jb25zdHJ1Y3RvciA9PT0gQXNzaWduRXhwcmVzc2lvbikge1xyXG4gICAgICAgICAgICBleHByZXNzaW9uLmlkZW50aWZpZXIuZmlsbFN5bWJvbFRhYmxlKHRhYmxlKTtcclxuICAgICAgICB9IGVsc2UgaWYgKGV4cHJlc3Npb24uY29uc3RydWN0b3IgPT09IFZhcmlhYmxlRGVmTGlzdEV4cHJlc3Npb24pIHtcclxuICAgICAgICAgICAgdmFyIHNpZ25hdHVyZSA9IGV4cHJlc3Npb24uZmlsbFN5bWJvbFRhYmxlKHRhYmxlKTtcclxuICAgICAgICB9IGVsc2UgaWYgKGV4cHJlc3Npb24uY29uc3RydWN0b3IgPT09IEFzc2lnbkV4cHJlc3Npb25Hcm91cCkge1xyXG4gICAgICAgICAgICBmaWxsU3ltYm9sVGFibGUodGFibGUsIGV4cHJlc3Npb24uZXhwcmVzc2lvbnMpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0QWxsSWRlbnRpZmllcnMoZXhwcmVzc2lvbnMpIHtcclxuICAgIHZhciBkZXBzID0gW107XHJcbiAgICBmb3IgKHZhciBlID0gMDsgZSA8IGV4cHJlc3Npb25zLmxlbmd0aDsgZSsrKSB7XHJcbiAgICAgICAgdmFyIGV4cHJlc3Npb24gPSBleHByZXNzaW9uc1tlXTtcclxuICAgICAgICBpZiAoZXhwcmVzc2lvbi5nZXRDaGlsZEV4cHJlc3Npb25zKSB7XHJcbiAgICAgICAgICAgIHZhciBjaGlsZHJlbiA9IGV4cHJlc3Npb24uZ2V0Q2hpbGRFeHByZXNzaW9ucygpO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoY2hpbGRyZW5baV0uY29uc3RydWN0b3IgPT09IElkZW50aWZpZXJFeHByZXNzaW9uKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZGVwcy5wdXNoKGNoaWxkcmVuW2ldKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZVxyXG4gICAgICAgICAgICAgICAgICAgIGRlcHMucHVzaC5hcHBseShkZXBzLCBnZXRBbGxJZGVudGlmaWVycyhbY2hpbGRyZW5baV1dKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGRlcHM7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHByb21vdGVJZGVudGlmaWVycyh0YWJsZSwgZXhwcmVzc2lvbnMpIHtcclxuICAgIHZhciBpZGVudHMgPSBnZXRBbGxJZGVudGlmaWVycyhleHByZXNzaW9ucyk7XHJcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGlkZW50cy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgIGlmIChpZGVudHNbaV0ucHJvbW90ZSlcclxuICAgICAgICAgICAgaWRlbnRzW2ldLnByb21vdGUodGFibGUpO1xyXG4gICAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBDcmVhdGVGdW5jdGlvbihwcm9ncmFtLCBvdXRwdXRMYW5nKSB7XHJcbiAgICByZXR1cm4gQ3JlYXRlRnVuY3Rpb25Kcyhwcm9ncmFtKTtcclxufVxyXG5cclxuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcclxuICogQ3JlYXRlRnVuY3Rpb24gSnNcclxuICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXHJcbmZ1bmN0aW9uIENyZWF0ZUZ1bmN0aW9uSnMocHJvZ3JhbSkge1xyXG5cclxuICAgIHZhciB0YWJsZSA9IG5ldyBTeW1ib2xUYWJsZSgpO1xyXG5cclxuICAgIHZhciBleHByZXNzaW9uID0gcHJvZ3JhbS5leHByZXNzaW9ucztcclxuXHJcbiAgICB2YXIgZnVuY3Rpb25Cb2R5ID0gXCJcIjtcclxuICAgIFxyXG4gICAgaWYgKGV4cHJlc3Npb24uY29uc3RydWN0b3IgPT09IEFycmF5KSB7XHJcblxyXG5cclxuICAgICAgICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcclxuICAgICAgICAgKiBmaWxsIGFzc2lnbmVkIHZhcmlhYmxlcyBpbnRvIHRoZSBzeW1ib2xUYWJsZSBcclxuICAgICAgICAgKiBhbmQgcHJvbW90ZSB0byBhbm90aGVyIHR5cGUgYXMgbmVlZGVkICBcclxuICAgICAgICAgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXHJcbiAgICAgICAgZmlsbFN5bWJvbFRhYmxlKHRhYmxlLCBleHByZXNzaW9uKTtcclxuICAgICAgICBwcm9tb3RlSWRlbnRpZmllcnModGFibGUsIGV4cHJlc3Npb24pO1xyXG5cclxuICAgICAgICAvL25lZWQgdG8gc29ydCBhbmQgcmVtb3ZlIGRlYWQgdHJlZSBicmFuY2hlcyBmcm9tIFtleHByZXNzaW9uXVxyXG4gICAgICAgIHZhciBzb3J0ZWQgPSBzb3J0RXhwcmVzc2lvbnMoZXhwcmVzc2lvbik7XHJcbiAgICAgICAgdmFyIGNsZWFuZWQgPSBzb3J0ZWQ7XHJcblxyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2xlYW5lZC5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICB2YXIgZXhwID0gY2xlYW5lZFtpXTtcclxuICAgICAgICAgICAgaWYgKGV4cC5jb25zdHJ1Y3RvciA9PT0gQXNzaWduRXhwcmVzc2lvbkdyb3VwKSB7XHJcbiAgICAgICAgICAgICAgICBleHAuZXhwcmVzc2lvbnMgPSBzb3J0RXhwcmVzc2lvbnMoZXhwLmV4cHJlc3Npb25zKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBmdW5jdGlvbkJvZHkgKz0gY2xlYW5lZFtpXS50b0pzU2V0KG51bGwsdGFibGUsZmFsc2UpICsgXCJcXG5cIjtcclxuICAgICAgICB9XHJcblxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBmdW5jdGlvbkJvZHkgKz0gZXhwcmVzc2lvbi50b0pzU2V0KG51bGwsdGFibGUsZmFsc2UpICsgXCJcXG5cIjtcclxuICAgIH1cclxuICAgIFxyXG4gICAgaWYgKHRhYmxlICYmIHRhYmxlLnN5bWJvbHMpIHtcclxuXHJcbiAgICAgICAgdmFyIHN5bWJvbHMgPSB0YWJsZS5nZXRSb290U3ltYm9scygpXHJcblxyXG4gICAgICAgIGZvciAodmFyIHYgPSAwOyB2IDwgc3ltYm9scy5sZW5ndGg7IHYrKykge1xyXG4gICAgICAgICAgICBmdW5jdGlvbkJvZHkgKz0gJyQuZ1tcIicrIHN5bWJvbHNbdl0gKydcIl0gPSAnICsgc3ltYm9sc1t2XSArICc7XFxuJ1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcblxyXG5cclxuICAgIC8vIGlmICgkICYmICQuZ2xvYmFscykge1xyXG4gICAgLy8gICAgIHZhciAkZ05hbWVzID0gT2JqZWN0LmtleXMoJC5nbG9iYWxzKTtcclxuICAgIC8vICAgICBmb3IgKHZhciBuID0gMDsgbiA8ICRnTmFtZXMubGVuZ3RoOyBuKyspIHtcclxuICAgIC8vICAgICAgICAgdmFyICRuYW1lID0gJGdOYW1lc1tuXTtcclxuICAgIC8vICAgICAgICAgdmFyICR2YWx1ZSA9ICRnbG9iYWxzW25hbWVdO1xyXG4gICAgLy8gICAgIH1cclxuICAgIC8vIH1cclxuXHJcbiAgICBmdW5jdGlvbkJvZHkgKz0gXCJyZXR1cm4gKCQkKSA/ICQkIDogMDtcIjtcclxuXHJcbiAgICB2YXIgc3ltYm9sRGVjbGFyYXRpb25zID0gXCJ2YXIgJCQgPSAwO1xcblwiO1xyXG4gICAgc3ltYm9sRGVjbGFyYXRpb25zICs9IFwidmFyICRyID0gMDtcXG5cIjtcclxuICAgIHN5bWJvbERlY2xhcmF0aW9ucyArPSBcInZhciAkclN0YWNrID0gW107XFxuXCI7XHJcblxyXG4gICAgc3ltYm9sRGVjbGFyYXRpb25zICs9IFwiaWYgKCEkLmcpICQuZyA9IHt9O1xcblwiO1xyXG4gICAgc3ltYm9sRGVjbGFyYXRpb25zICs9IFwiaWYgKCEkLmZuKSAkLmZuID0ge307XFxuXCI7XHJcblxyXG5cclxuICAgIGZvciAodmFyIHMgPSAwOyBzIDwgdGFibGUuc3ltYm9scy5sZW5ndGg7IHMrKykge1xyXG4gICAgICAgIHZhciBzeW1ib2wgPSB0YWJsZS5zeW1ib2xzW3NdXHJcbiAgICAgICAgc3ltYm9sRGVjbGFyYXRpb25zICs9IHN5bWJvbC5nZXREZWNsYXJhdGlvbigpO1xyXG4gICAgfVxyXG4gICAgICAgIFxyXG4gICAgZnVuY3Rpb25Cb2R5ID0gc3ltYm9sRGVjbGFyYXRpb25zICsgZnVuY3Rpb25Cb2R5O1xyXG5cclxuICAgIHRyeSB7XHJcbiAgICAgICAgcmV0dXJuIEZ1bmN0aW9uKFwiJFwiLCBmdW5jdGlvbkJvZHkpO1xyXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICBjb25zb2xlLmxvZyhmdW5jdGlvbkJvZHkpO1xyXG4gICAgICAgIHRocm93IGVycm9yO1xyXG4gICAgfVxyXG4gICAgXHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzLkNyZWF0ZUZ1bmN0aW9uID0gQ3JlYXRlRnVuY3Rpb247IiwicmVxdWlyZSgnanMtYXJyYXktZXh0ZW5zaW9ucycpO1xyXG52YXIgbW9tZW50ID0gcmVxdWlyZSgnbW9tZW50Jyk7XHJcbnZhciBwcmVkaWNhdGVzID0gcmVxdWlyZSgnLi9wcmVkaWNhdGVzJyk7XHJcblxyXG52YXIgaGVscGVycyA9IHt9O1xyXG5tb2R1bGUuZXhwb3J0cyA9IGhlbHBlcnM7XHJcblxyXG5mdW5jdGlvbiBnZXRWYWx1ZSAob2JqLCBpbmRleCkge1xyXG4gICAgaWYgKGluZGV4ID09IG51bGwpIHJldHVybiBvYmo7XHJcblxyXG4gICAgZWxzZSBpZiAob2JqICYmIG9iai5jb25zdHJ1Y3RvciA9PT0gQXJyYXkpIHtcclxuICAgICAgICBpZiAob2JqLmxlbmd0aCA+IGluZGV4ICYmIGluZGV4ID4gLTEpXHJcbiAgICAgICAgICAgIHJldHVybiBvYmpbaW5kZXhdO1xyXG4gICAgICAgIGVsc2VcclxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9IGVsc2UgXHJcbiAgICAgICAgcmV0dXJuIG9iajtcclxufVxyXG5cclxuaGVscGVycy5nZXRWYWx1ZSA9IGdldFZhbHVlOyBcclxuXHJcbmZ1bmN0aW9uIG1heExlbmd0aCgpIHtcclxuICAgIHZhciBwYXJhbXMgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpO1xyXG4gICAgdmFyIG1heExlbiA9IDA7XHJcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHBhcmFtcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgIHZhciBwID0gcGFyYW1zW2ldO1xyXG4gICAgICAgIGlmIChwICE9IG51bGwpIHtcclxuICAgICAgICAgICAgdmFyIGwgPSAocC5jb25zdHJ1Y3RvciA9PT0gQXJyYXkpID8gcC5sZW5ndGggOiAxO1xyXG4gICAgICAgICAgICBpZiAobWF4TGVuIDwgbCkgbWF4TGVuID0gbDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gbWF4TGVuO1xyXG59XHJcblxyXG5mdW5jdGlvbiBtaW5MZW5ndGgoKSB7XHJcbiAgICB2YXIgcGFyYW1zID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKTtcclxuICAgIHZhciBtaW5MZW4gPSBOdW1iZXIuTUFYX1ZBTFVFO1xyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwYXJhbXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICB2YXIgcCA9IHBhcmFtc1tpXTtcclxuICAgICAgICBpZiAocCAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgIHZhciBsID0gKHAuY29uc3RydWN0b3IgPT09IEFycmF5KSA/IHAubGVuZ3RoIDogMTtcclxuICAgICAgICAgICAgaWYgKG1pbkxlbiA+IGwpIG1pbkxlbiA9IGw7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIG1pbkxlbjtcclxufVxyXG5cclxuZnVuY3Rpb24gYW55QXJyYXkgKCkge1xyXG4gICAgdmFyIHBhcmFtcyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cyk7XHJcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHBhcmFtcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgIHZhciBwID0gcGFyYW1zW2ldO1xyXG4gICAgICAgIGlmIChwICE9IG51bGwpIHtcclxuICAgICAgICAgICAgdmFyIGlzQXJyID0gKHAuY29uc3RydWN0b3IgPT09IEFycmF5KTtcclxuICAgICAgICAgICAgaWYgKGlzQXJyKSByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIG5vcm1hbGl6ZSAocmFuZ2UsIGNvbmNhdCkge1xyXG5cclxuICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXHJcbiAgICAgKiBtb3N0IGZ1bmN0aW9ucyBsaWtlIFNVTSBuZWVkIGEgc2luZ2xlIGRpbWVudGlvbmFsIGFycmF5XHJcbiAgICAgKiBvdGhlcnMgbGlrZSB2bG9va3VwIG5lZWQgdGhlIHJhbmdlIHRvIGJlIG11bHRpZGltZW50aW9uYWxcclxuICAgICAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqLyBcclxuICAgIGlmIChjb25jYXQgPT0gbnVsbCkgY29uY2F0ID0gdHJ1ZTtcclxuXHJcbiAgICB2YXIgYXJyID0gW107XHJcbiAgICBpZiAocmFuZ2UpIHtcclxuICAgICAgICBpZiAocmFuZ2UuY29uc3RydWN0b3IgPT09IEFycmF5KVxyXG4gICAgICAgICAgICBhcnIgPSByYW5nZTtcclxuICAgICAgICBlbHNlIGlmIChyYW5nZS52YWx1ZXMgJiYgcmFuZ2UudmFsdWVzLmNvbnN0cnVjdG9yID09PSBBcnJheSlcclxuICAgICAgICAgICAgYXJyID0gcmFuZ2UudmFsdWVzO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqIFxyXG4gICAgICogdGhpcyBtZFJhbmdlIHByb3BlcnR5IHdpbGwgYmUgdHJ1ZSBmb3IgbXVsdGlkaW1lbnRpb25hbCByYW5nZXNcclxuICAgICAqIGxldHMgbm90IHRyYW5zZm9ybSB0aGUgYXJyYXkgaWYgd2UgZG9uJ3QgbmVlZCB0by5cclxuICAgICAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xyXG4gICAgaWYgKGNvbmNhdCAmJiBhcnIubWRSYW5nZSkgYXJyID0gW10uY29uY2F0LmFwcGx5KFtdLCBhcnIpO1xyXG5cclxuICAgIHJldHVybiBhcnI7XHJcbn1cclxuXHJcbkFycmF5Lm1pbkxlbmd0aCA9IG1pbkxlbmd0aDtcclxuQXJyYXkubWF4TGVuZ3RoID0gbWF4TGVuZ3RoO1xyXG5BcnJheS5hbnlBcnJheSA9IGFueUFycmF5O1xyXG5BcnJheS5ub3JtYWxpemUgPSBub3JtYWxpemU7XHJcbkFycmF5LmZsYXR0ZW4gPSBmbGF0dGVuO1xyXG5cclxuZnVuY3Rpb24gY3Jvc3NBcHBseSAoKSB7XHJcbiAgICB2YXIgcGFyYW1zID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKTtcclxuICAgIHZhciByZXQgPSBbXTtcclxuICAgIGlmIChwYXJhbXMubGVuZ3RoID4gMCkge1xyXG4gICAgICAgIHZhciBmbmMgPSB0aGlzO1xyXG4gICAgICAgIHZhciBmYXJncyA9IFtdO1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcGFyYW1zLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGZhcmdzLnB1c2gocGFyYW1zW2ldKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZm9yICh2YXIgciA9IDA7IHIgPCBtYXhMZW5ndGguYXBwbHkobnVsbCwgZmFyZ3MpOyByKyspIHtcclxuICAgICAgICAgICAgdmFyIGEgPSBbXTtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBmYXJncy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgYS5wdXNoKGdldFZhbHVlKGZhcmdzW2ldLCByKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0LnB1c2goZm5jLmFwcGx5KG51bGwsIGEpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gcmV0O1xyXG59XHJcblxyXG5GdW5jdGlvbi5wcm90b3R5cGUuY3Jvc3NBcHBseSA9IGNyb3NzQXBwbHk7XHJcblxyXG5mdW5jdGlvbiBmbGF0dGVuICgpIHtcclxuXHJcbiAgICB2YXIgYXJyID0gW107XHJcblxyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICBpZiAoYXJndW1lbnRzW2ldICE9IG51bGwgJiYgYXJndW1lbnRzW2ldLmNvbnN0cnVjdG9yID09PSBBcnJheSkge1xyXG4gICAgICAgICAgICBhcnIgPSBhcnIuY29uY2F0KEFycmF5LmZsYXR0ZW4uYXBwbHkobnVsbCwgYXJndW1lbnRzW2ldKSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgYXJyLnB1c2goYXJndW1lbnRzW2ldKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGFycjtcclxufVxyXG5cclxuIiwiLypqc2xub2RlOiB0cnVlICovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnJlcXVpcmUoJ2pzLWFycmF5LWV4dGVuc2lvbnMnKTtcclxudmFyIG1vbWVudCA9IHJlcXVpcmUoJ21vbWVudCcpO1xyXG52YXIgcHJlZGljYXRlcyA9IHJlcXVpcmUoJy4vcHJlZGljYXRlcycpO1xyXG52YXIgZm5IZWxwZXJzID0gcmVxdWlyZSgnLi9mbkhlbHBlcnMnKTtcclxuXHJcbnZhciBmbiA9IHt9O1xyXG5tb2R1bGUuZXhwb3J0cyA9IGZuO1xyXG5cclxudmFyIHYgPSBmbkhlbHBlcnMuZ2V0VmFsdWU7XHJcblxyXG5mdW5jdGlvbiBfcm9tYW4obnVtKSB7XHJcbiAgICBpZiAoaXNOYU4obnVtKSkgeyByZXR1cm4gXCJcIjsgfVxyXG5cclxuICAgIHZhciByb21hbk51bWVyYWxzID0gW1xyXG4gICAgICAgIFtcIlwiLCBcIklcIiwgXCJJSVwiLCBcIklJSVwiLCBcIklWXCIsIFwiVlwiLCBcIlZJXCIsIFwiVklJXCIsIFwiVklJSVwiLCBcIklYXCJdLCAvLyBvbmVzXHJcbiAgICAgICAgW1wiXCIsIFwiWFwiLCBcIlhYXCIsIFwiWFhYXCIsIFwiWExcIiwgXCJMXCIsIFwiTFhcIiwgXCJMWFhcIiwgXCJMWFhYXCIsIFwiWENcIl0sIC8vIHRlbnNcclxuICAgICAgICBbXCJcIiwgXCJDXCIsIFwiQ0NcIiwgXCJDQ0NcIiwgXCJDRFwiLCBcIkRcIiwgXCJEQ1wiLCBcIkRDQ1wiLCBcIkRDQ0NcIiwgXCJDTVwiXSwgLy8gaHVuZHJlZHNcclxuICAgICAgICBbXCJcIiwgXCJNXCIsIFwiTU1cIiwgXCJNTU1cIiwgXCIoSVYpXCIsIFwiKFYpXCIsIFwiKFZJKVwiLCBcIihWSUkpXCIsIFwiKFZJSUkpXCIgLCBcIihYSSlcIiBdLCAvLyB0aG91c2FuZHNcclxuICAgICAgICBbXCJcIiwgXCIoWClcIiwgXCIoWFgpXCIsIFwiKFhYWClcIiwgXCIoWEwpXCIsIFwiKEwpXCIsIFwiKExYKVwiLCBcIihMWFgpXCIsIFwiKExYWFgpXCIsIFwiKFhDKVwiXSxcclxuICAgICAgICBbXCJcIiwgXCIoQylcIiwgXCIoQ0MpXCIsIFwiKENDQylcIiwgXCIoQ0QpXCIsIFwiKEQpXCIsIFwiKERDKVwiLCBcIihEQ0MpXCIsIFwiKERDQ0MpXCIsIFwiKENNKVwiXSxcclxuICAgICAgICBbXCJcIiwgXCIoTSlcIiwgXCIoTU0pXCIsIFwiKE1NTSlcIiwgXCJbSVZdXCIsIFwiW1ZdXCIsIFwiW1ZJXVwiLCBcIltWSUldXCIsIFwiW1ZJSUldXCIgLCBcIltYSV1cIiBdLFxyXG4gICAgICAgIFtcIlwiLCBcIltYXVwiLCBcIltYWF1cIiwgXCJbWFhYXVwiLCBcIltYTF1cIiwgXCJbTF1cIiwgXCJbTFhdXCIsIFwiW0xYWF1cIiwgXCJbTFhYWF1cIiwgXCJbWENdXCJdLFxyXG4gICAgICAgIFtcIlwiLCBcIltDXVwiLCBcIltDQ11cIiwgXCJbQ0NDXVwiLCBcIltDRF1cIiwgXCJbRF1cIiwgXCJbRENdXCIsIFwiW0RDQ11cIiwgXCJbRENDQ11cIiwgXCJbQ01dXCJdXHJcbiAgICBdO1xyXG5cclxuICAgIGlmIChudW0gPiA5OTk5OTk5OTkpIHsgcmV0dXJuIFwiI0VSUlwiOyB9XHJcblxyXG4gICAgdmFyIGludEFyciA9IChudW0pLnRvU3RyaW5nKCkuc3BsaXQoJycpLnJldmVyc2UoKTtcclxuICAgIHZhciBsZW4gPSBpbnRBcnIubGVuZ3RoO1xyXG4gICAgdmFyIHJvbWFuTnVtZXJhbCA9IFwiXCI7XHJcbiAgICB2YXIgaSA9IGxlbjtcclxuXHJcbiAgICB3aGlsZSAoaS0tID4gMCkge1xyXG4gICAgICAgIHJvbWFuTnVtZXJhbCArPSByb21hbk51bWVyYWxzW2ldW051bWJlcihpbnRBcnJbaV0pXTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gcm9tYW5OdW1lcmFsLnJlcGxhY2UoXCIpKFwiLCBcIlwiKS5yZXBsYWNlKFwiXVtcIiwgXCJcIik7XHJcbn1cclxuXHJcbmZuLlJPTUFOID0gZnVuY3Rpb24obnVtKSB7XHJcbiAgICBpZiAoQXJyYXkuYW55QXJyYXkobnVtKSkgeyBcclxuICAgICAgICByZXR1cm4gX3JvbWFuLmNyb3NzQXBwbHkobnVtKTtcclxuICAgIH0gXHJcbiAgICByZXR1cm4gX3JvbWFuKG51bSk7XHJcbn1cclxuXHJcbmZuLk1JTiA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuIEFycmF5LmZsYXR0ZW4uYXBwbHkobnVsbCwgYXJndW1lbnRzKS5taW4oKTtcclxufVxyXG5cclxuZm4uTUFYID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4gQXJyYXkuZmxhdHRlbi5hcHBseShudWxsLCBhcmd1bWVudHMpLm1heCgpO1xyXG59XHJcblxyXG5mbi5DT1VOVCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgdmFyIHZhbHVlcyA9IEFycmF5LmZsYXR0ZW4uYXBwbHkobnVsbCwgYXJndW1lbnRzKTtcclxuICAgIHZhciByZXQgPSAwO1xyXG5cclxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdmFsdWVzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgaWYgKHZhbHVlc1tpXSlcclxuICAgICAgICAgICAgcmV0Kys7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gcmV0O1xyXG59XHJcblxyXG5mbi5DT1VOVElGID0gZnVuY3Rpb24ocmFuZ2UsIGNyaXRlcmlhKSB7XHJcbiAgICB2YXIgcmV0ID0gMDtcclxuICAgIHZhciB2YWx1ZXMgPSBBcnJheS5ub3JtYWxpemUocmFuZ2UpO1xyXG4gICAgdmFyIGZuQ3JpdGVyaWEgPSBuZXcgcHJlZGljYXRlcy5jaGVja0NyaXRlcmlhKGNyaXRlcmlhKTtcclxuXHJcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHZhbHVlcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIHZhciBvYmogPSB2YWx1ZXNbaV07XHJcbiAgICAgICAgICAgIGlmIChmbkNyaXRlcmlhKG9iaiwgaSkgJiYgb2JqICE9IG51bGwgJiYgb2JqICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgIHJldCsrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7IH1cclxuICAgIH1cclxuICAgIHJldHVybiByZXQ7XHJcbn1cclxuXHJcbmZuLlNVTSA9IGZ1bmN0aW9uKHJhbmdlKSB7XHJcbiAgICB2YXIgcmV0ID0gMDtcclxuICAgIHZhciB2YWx1ZXMgPSBBcnJheS5mbGF0dGVuLmFwcGx5KG51bGwsIGFyZ3VtZW50cyk7XHJcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHZhbHVlcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIHZhciBvYmogPSB2YWx1ZXNbaV07XHJcbiAgICAgICAgICAgIGlmICghaXNOYU4ob2JqKSlcclxuICAgICAgICAgICAgICAgIHJldCArPSBOdW1iZXIob2JqKTtcclxuICAgICAgICB9IGNhdGNoIChlcnIpIHsgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIHJldDtcclxufVxyXG5mbi5TVU1JRiA9IGZ1bmN0aW9uKHJhbmdlLCBjcml0ZXJpYSwgc3VtUmFuZ2UpIHtcclxuXHJcbiAgICBpZiAoc3VtUmFuZ2UgPT09IHVuZGVmaW5lZCkgc3VtUmFuZ2UgPSByYW5nZTtcclxuXHJcbiAgICB2YXIgcjEgPSBBcnJheS5ub3JtYWxpemUocmFuZ2UpO1xyXG4gICAgdmFyIHIyID0gQXJyYXkubm9ybWFsaXplKHN1bVJhbmdlKTtcclxuICAgIHZhciBmbkNyaXRlcmlhID0gbmV3IHByZWRpY2F0ZXMuY2hlY2tDcml0ZXJpYShjcml0ZXJpYSk7XHJcbiAgICB2YXIgcmVzdWx0ID0gMDtcclxuICAgIHZhciBjb3VudCA9IChyMS5sZW5ndGggPiByMi5sZW5ndGgpID8gcjEubGVuZ3RoIDogcjIubGVuZ3RoOyBcclxuICAgIFxyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCByMS5sZW5ndGggJiYgaSA8IHIyLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgdmFyIHZhbFIxID0gcjFbaV07XHJcbiAgICAgICAgdmFyIHZhbFIyID0gcjJbaV07XHJcbiAgICAgICAgaWYgKGZuQ3JpdGVyaWEodmFsUjEsIGkpICYmICFpc05hTih2YWxSMikpIHtcclxuICAgICAgICAgICAgcmVzdWx0ICs9IE51bWJlcih2YWxSMik7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiByZXN1bHQ7XHJcblxyXG59XHJcblxyXG5mbi5TVU1QUk9EVUNUID0gZnVuY3Rpb24ocmFuZ2UxLCByYW5nZTIpIHsgdGhyb3cgeyBNZXNzYWdlOiBcIk5vdCBJbXBsZW1lbnRlZFwiIH07IH1cclxuZm4uU1VNU1EgPSBmdW5jdGlvbihhLCBwKSB7IHRocm93IHsgTWVzc2FnZTogXCJOb3QgSW1wbGVtZW50ZWRcIiB9OyB9XHJcbmZuLlNVTVgyTVkyID0gZnVuY3Rpb24oKSB7IHRocm93IHsgTWVzc2FnZTogXCJOb3QgSW1wbGVtZW50ZWRcIiB9OyB9XHJcbmZuLlNVTVgyUFkyID0gZnVuY3Rpb24oKSB7IHRocm93IHsgTWVzc2FnZTogXCJOb3QgSW1wbGVtZW50ZWRcIiB9OyB9XHJcbmZuLlNVTVhNWTIgPSBmdW5jdGlvbigpIHsgdGhyb3cgeyBNZXNzYWdlOiBcIk5vdCBJbXBsZW1lbnRlZFwiIH07IH1cclxuZm4uVFJVTkMgPSBmdW5jdGlvbigpIHsgdGhyb3cgeyBNZXNzYWdlOiBcIk5vdCBJbXBsZW1lbnRlZFwiIH07IH1cclxuZm4uQVNDID0gZnVuY3Rpb24oKSB7IHRocm93IHsgTWVzc2FnZTogXCJOb3QgSW1wbGVtZW50ZWRcIiB9OyB9XHJcbmZuLkJBSFRURVhUID0gZnVuY3Rpb24oKSB7IHRocm93IHsgTWVzc2FnZTogXCJOb3QgSW1wbGVtZW50ZWRcIiB9OyB9XHJcbmZuLkNIQVIgPSBmdW5jdGlvbigpIHsgdGhyb3cgeyBNZXNzYWdlOiBcIk5vdCBJbXBsZW1lbnRlZFwiIH07IH1cclxuZm4uQ0xFQU4gPSBmdW5jdGlvbigpIHsgdGhyb3cgeyBNZXNzYWdlOiBcIk5vdCBJbXBsZW1lbnRlZFwiIH07IH1cclxuZm4uQ09ERSA9IGZ1bmN0aW9uKCkgeyB0aHJvdyB7IE1lc3NhZ2U6IFwiTm90IEltcGxlbWVudGVkXCIgfTsgfVxyXG5mbi5DT05DQVRFTkFURSA9IGZ1bmN0aW9uKCkgeyB0aHJvdyB7IE1lc3NhZ2U6IFwiTm90IEltcGxlbWVudGVkXCIgfTsgfVxyXG5mbi5ET0xMQVIgPSBmdW5jdGlvbigpIHsgdGhyb3cgeyBNZXNzYWdlOiBcIk5vdCBJbXBsZW1lbnRlZFwiIH07IH1cclxuZm4uRVhBQ1QgPSBmdW5jdGlvbigpIHsgdGhyb3cgeyBNZXNzYWdlOiBcIk5vdCBJbXBsZW1lbnRlZFwiIH07IH1cclxuZm4uRklORCA9IGZ1bmN0aW9uKCkgeyB0aHJvdyB7IE1lc3NhZ2U6IFwiTm90IEltcGxlbWVudGVkXCIgfTsgfVxyXG5mbi5GSVhFRCA9IGZ1bmN0aW9uKCkgeyB0aHJvdyB7IE1lc3NhZ2U6IFwiTm90IEltcGxlbWVudGVkXCIgfTsgfVxyXG5mbi5KSVMgPSBmdW5jdGlvbigpIHsgdGhyb3cgeyBNZXNzYWdlOiBcIk5vdCBJbXBsZW1lbnRlZFwiIH07IH1cclxuZm4uTEVGVCA9IGZ1bmN0aW9uKCkgeyB0aHJvdyB7IE1lc3NhZ2U6IFwiTm90IEltcGxlbWVudGVkXCIgfTsgfVxyXG5cclxuZnVuY3Rpb24gX2xlbih2YWx1ZSkge1xyXG4gICAgcmV0dXJuICh2YWx1ZSAhPSBudWxsKSA/IHZhbHVlLnRvU3RyaW5nKCkubGVuZ3RoIDogMDtcclxufVxyXG5cclxuZm4uTEVOID0gZnVuY3Rpb24odmFsdWUpIHtcclxuICAgIGlmIChBcnJheS5hbnlBcnJheSh2YWx1ZSkpIHsgXHJcbiAgICAgICAgcmV0dXJuIF9sZW4uY3Jvc3NBcHBseSh2YWx1ZSk7XHJcbiAgICB9IFxyXG4gICAgcmV0dXJuIF9sZW4odmFsdWUpOyAgXHJcbn1cclxuXHJcbmZ1bmN0aW9uIF9sb3dlcih2YWx1ZSkge1xyXG4gICAgcmV0dXJuICh2YWx1ZSAhPSBudWxsKSA/IHZhbHVlLnRvU3RyaW5nKCkudG9Mb3dlckNhc2UoKSA6IG51bGw7XHJcbn1cclxuXHJcbmZuLkxPV0VSID0gZnVuY3Rpb24odmFsdWUpIHsgXHJcbiAgICBpZiAoQXJyYXkuYW55QXJyYXkodmFsdWUpKSB7IFxyXG4gICAgICAgIHJldHVybiBfbG93ZXIuY3Jvc3NBcHBseSh2YWx1ZSk7XHJcbiAgICB9IFxyXG4gICAgcmV0dXJuIF9sb3dlcih2YWx1ZSk7XHJcbn1cclxuXHJcbmZuLk1JRCA9IGZ1bmN0aW9uKCkgeyB0aHJvdyB7IE1lc3NhZ2U6IFwiTm90IEltcGxlbWVudGVkXCIgfTsgfVxyXG5mbi5QSE9ORVRJQyA9IGZ1bmN0aW9uKCkgeyB0aHJvdyB7IE1lc3NhZ2U6IFwiTm90IEltcGxlbWVudGVkXCIgfTsgfVxyXG5mbi5QUk9QRVIgPSBmdW5jdGlvbigpIHsgdGhyb3cgeyBNZXNzYWdlOiBcIk5vdCBJbXBsZW1lbnRlZFwiIH07IH1cclxuZm4uUkVQTEFDRSA9IGZ1bmN0aW9uKCkgeyB0aHJvdyB7IE1lc3NhZ2U6IFwiTm90IEltcGxlbWVudGVkXCIgfTsgfVxyXG5mbi5SRVBUID0gZnVuY3Rpb24oKSB7IHRocm93IHsgTWVzc2FnZTogXCJOb3QgSW1wbGVtZW50ZWRcIiB9OyB9XHJcbmZuLlJJR0hUID0gZnVuY3Rpb24oKSB7IHRocm93IHsgTWVzc2FnZTogXCJOb3QgSW1wbGVtZW50ZWRcIiB9OyB9XHJcbmZuLlNFQVJDSCA9IGZ1bmN0aW9uKCkgeyB0aHJvdyB7IE1lc3NhZ2U6IFwiTm90IEltcGxlbWVudGVkXCIgfTsgfVxyXG5mbi5TVUJTVElUVVRFID0gZnVuY3Rpb24oKSB7IHRocm93IHsgTWVzc2FnZTogXCJOb3QgSW1wbGVtZW50ZWRcIiB9OyB9XHJcblxyXG5mdW5jdGlvbiBfdCh2YWx1ZSkge1xyXG4gICAgcmV0dXJuICh0eXBlb2YodmFsdWUpID09PSAnc3RyaW5nJykgPyB2YWx1ZS50b1N0cmluZygpIDogXCJcIjtcclxufVxyXG5cclxuZm4uVCA9IGZ1bmN0aW9uKHZhbHVlKSB7XHJcbiAgICBpZiAoQXJyYXkuYW55QXJyYXkodmFsdWUpKSB7IFxyXG4gICAgICAgIHJldHVybiBfdC5jcm9zc0FwcGx5KHZhbHVlKTtcclxuICAgIH0gXHJcbiAgICByZXR1cm4gX3QodmFsdWUpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBfdGV4dCh2YWx1ZSkge1xyXG4gICAgcmV0dXJuICh2YWx1ZSAhPSBudWxsKSA/IHZhbHVlLnRvU3RyaW5nKCkgOiBudWxsO1xyXG59XHJcblxyXG5mbi5URVhUID0gZnVuY3Rpb24odmFsdWUpIHtcclxuICAgIGlmIChBcnJheS5hbnlBcnJheSh2YWx1ZSkpIHsgXHJcbiAgICAgICAgcmV0dXJuIF90ZXh0LmNyb3NzQXBwbHkodmFsdWUpO1xyXG4gICAgfSBcclxuICAgIHJldHVybiBfdGV4dCh2YWx1ZSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIF90cmltKHZhbHVlKSB7XHJcbiAgICByZXR1cm4gKHZhbHVlICE9IG51bGwpID8gdmFsdWUudG9TdHJpbmcoKS50cmltKCkgOiBudWxsO1xyXG59XHJcblxyXG5mbi5UUklNID0gZnVuY3Rpb24odmFsdWUpIHtcclxuICAgIGlmIChBcnJheS5hbnlBcnJheSh2YWx1ZSkpIHsgXHJcbiAgICAgICAgcmV0dXJuIF90cmltLmNyb3NzQXBwbHkodmFsdWUpO1xyXG4gICAgfSBcclxuICAgIHJldHVybiBfdHJpbSh2YWx1ZSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIF91cHBlcih2YWx1ZSkge1xyXG4gICAgcmV0dXJuICh2YWx1ZSAhPSBudWxsKSA/IHZhbHVlLnRvU3RyaW5nKCkudG9VcHBlckNhc2UoKSA6IG51bGw7XHJcbn1cclxuXHJcbmZuLlVQUEVSID0gZnVuY3Rpb24odmFsdWUpIHtcclxuICAgIGlmIChBcnJheS5hbnlBcnJheSh2YWx1ZSkpIHsgXHJcbiAgICAgICAgcmV0dXJuIF91cHBlci5jcm9zc0FwcGx5KHZhbHVlKTtcclxuICAgIH0gXHJcbiAgICByZXR1cm4gX3VwcGVyKHZhbHVlKTtcclxufVxyXG5cclxuZm4uVkFMVUUgPSBmdW5jdGlvbigpIHsgdGhyb3cgeyBNZXNzYWdlOiBcIk5vdCBJbXBsZW1lbnRlZFwiIH07IH1cclxuZm4uQUNDUj0gZnVuY3Rpb24oKSB7IHRocm93IHsgTWVzc2FnZTogXCJOb3QgSW1wbGVtZW50ZWRcIiB9OyB9XHJcbmZuLkFDQ1Jkb3VibGVNID0gZnVuY3Rpb24oKSB7IHRocm93IHsgTWVzc2FnZTogXCJOb3QgSW1wbGVtZW50ZWRcIiB9OyB9XHJcbmZuLkFNT1JERUdSQyA9IGZ1bmN0aW9uKCkgeyB0aHJvdyB7IE1lc3NhZ2U6IFwiTm90IEltcGxlbWVudGVkXCIgfTsgfVxyXG5mbi5BTU9STElOQyA9IGZ1bmN0aW9uKCkgeyB0aHJvdyB7IE1lc3NhZ2U6IFwiTm90IEltcGxlbWVudGVkXCIgfTsgfVxyXG5mbi5DT1VQREFZQlMgPSBmdW5jdGlvbigpIHsgdGhyb3cgeyBNZXNzYWdlOiBcIk5vdCBJbXBsZW1lbnRlZFwiIH07IH1cclxuZm4uQ09VUERBWVMgPSBmdW5jdGlvbigpIHsgdGhyb3cgeyBNZXNzYWdlOiBcIk5vdCBJbXBsZW1lbnRlZFwiIH07IH1cclxuZm4uQ09VUERBWVNOQyA9IGZ1bmN0aW9uKCkgeyB0aHJvdyB7IE1lc3NhZ2U6IFwiTm90IEltcGxlbWVudGVkXCIgfTsgfVxyXG5mbi5DT1VQTkNEID0gZnVuY3Rpb24oKSB7IHRocm93IHsgTWVzc2FnZTogXCJOb3QgSW1wbGVtZW50ZWRcIiB9OyB9XHJcbmZuLkNPVVBOVU0gPSBmdW5jdGlvbigpIHsgdGhyb3cgeyBNZXNzYWdlOiBcIk5vdCBJbXBsZW1lbnRlZFwiIH07IH1cclxuZm4uQ09VUFBDRCA9IGZ1bmN0aW9uKCkgeyB0aHJvdyB7IE1lc3NhZ2U6IFwiTm90IEltcGxlbWVudGVkXCIgfTsgfVxyXG5mbi5DVU1JUE1UID0gZnVuY3Rpb24oKSB7IHRocm93IHsgTWVzc2FnZTogXCJOb3QgSW1wbGVtZW50ZWRcIiB9OyB9XHJcbmZuLkNVTVBSSU5DID0gZnVuY3Rpb24oKSB7IHRocm93IHsgTWVzc2FnZTogXCJOb3QgSW1wbGVtZW50ZWRcIiB9OyB9XHJcbmZuLkRCID0gZnVuY3Rpb24oKSB7IHRocm93IHsgTWVzc2FnZTogXCJOb3QgSW1wbGVtZW50ZWRcIiB9OyB9XHJcbmZuLkREQiA9IGZ1bmN0aW9uKCkgeyB0aHJvdyB7IE1lc3NhZ2U6IFwiTm90IEltcGxlbWVudGVkXCIgfTsgfVxyXG5mbi5ESVNDID0gZnVuY3Rpb24oKSB7IHRocm93IHsgTWVzc2FnZTogXCJOb3QgSW1wbGVtZW50ZWRcIiB9OyB9XHJcbmZuLkRPTExBUkRFID0gZnVuY3Rpb24oKSB7IHRocm93IHsgTWVzc2FnZTogXCJOb3QgSW1wbGVtZW50ZWRcIiB9OyB9XHJcbmZuLkRPTExBUkZSID0gZnVuY3Rpb24oKSB7IHRocm93IHsgTWVzc2FnZTogXCJOb3QgSW1wbGVtZW50ZWRcIiB9OyB9XHJcbmZuLkRVUkFUSU9OID0gZnVuY3Rpb24oKSB7IHRocm93IHsgTWVzc2FnZTogXCJOb3QgSW1wbGVtZW50ZWRcIiB9OyB9XHJcbmZuLkVGRkVDVCA9IGZ1bmN0aW9uKCkgeyB0aHJvdyB7IE1lc3NhZ2U6IFwiTm90IEltcGxlbWVudGVkXCIgfTsgfVxyXG5mbi5GViA9IGZ1bmN0aW9uKCkgeyB0aHJvdyB7IE1lc3NhZ2U6IFwiTm90IEltcGxlbWVudGVkXCIgfTsgfVxyXG5mbi5GVlNDSEVEVUxFID0gZnVuY3Rpb24oKSB7IHRocm93IHsgTWVzc2FnZTogXCJOb3QgSW1wbGVtZW50ZWRcIiB9OyB9XHJcbmZuLmRvdWJsZVJBVEUgPSBmdW5jdGlvbigpIHsgdGhyb3cgeyBNZXNzYWdlOiBcIk5vdCBJbXBsZW1lbnRlZFwiIH07IH1cclxuZm4uSVBNVCA9IGZ1bmN0aW9uKCkgeyB0aHJvdyB7IE1lc3NhZ2U6IFwiTm90IEltcGxlbWVudGVkXCIgfTsgfVxyXG5mbi5JUlIgPSBmdW5jdGlvbigpIHsgdGhyb3cgeyBNZXNzYWdlOiBcIk5vdCBJbXBsZW1lbnRlZFwiIH07IH1cclxuZm4uSVNQTVQgPSBmdW5jdGlvbigpIHsgdGhyb3cgeyBNZXNzYWdlOiBcIk5vdCBJbXBsZW1lbnRlZFwiIH07IH1cclxuZm4uTURVUkFUSU9OID0gZnVuY3Rpb24oKSB7IHRocm93IHsgTWVzc2FnZTogXCJOb3QgSW1wbGVtZW50ZWRcIiB9OyB9XHJcbmZuLk1JUlIgPSBmdW5jdGlvbigpIHsgdGhyb3cgeyBNZXNzYWdlOiBcIk5vdCBJbXBsZW1lbnRlZFwiIH07IH1cclxuZm4uTk9NSU5BTCA9IGZ1bmN0aW9uKCkgeyB0aHJvdyB7IE1lc3NhZ2U6IFwiTm90IEltcGxlbWVudGVkXCIgfTsgfVxyXG5mbi5OUEVSID0gZnVuY3Rpb24oKSB7IHRocm93IHsgTWVzc2FnZTogXCJOb3QgSW1wbGVtZW50ZWRcIiB9OyB9XHJcbmZuLk5QViA9IGZ1bmN0aW9uKCkgeyB0aHJvdyB7IE1lc3NhZ2U6IFwiTm90IEltcGxlbWVudGVkXCIgfTsgfVxyXG5mbi5PRERGUFJJQ0UgPSBmdW5jdGlvbigpIHsgdGhyb3cgeyBNZXNzYWdlOiBcIk5vdCBJbXBsZW1lbnRlZFwiIH07IH1cclxuZm4uT0RERllJRUxEID0gZnVuY3Rpb24oKSB7IHRocm93IHsgTWVzc2FnZTogXCJOb3QgSW1wbGVtZW50ZWRcIiB9OyB9XHJcbmZuLk9ERExQUklDRSA9IGZ1bmN0aW9uKCkgeyB0aHJvdyB7IE1lc3NhZ2U6IFwiTm90IEltcGxlbWVudGVkXCIgfTsgfVxyXG5mbi5PRERMWUlFTEQgPSBmdW5jdGlvbigpIHsgdGhyb3cgeyBNZXNzYWdlOiBcIk5vdCBJbXBsZW1lbnRlZFwiIH07IH1cclxuZm4uUE1UID0gZnVuY3Rpb24oKSB7IHRocm93IHsgTWVzc2FnZTogXCJOb3QgSW1wbGVtZW50ZWRcIiB9OyB9XHJcbmZuLlBQTVQgPSBmdW5jdGlvbigpIHsgdGhyb3cgeyBNZXNzYWdlOiBcIk5vdCBJbXBsZW1lbnRlZFwiIH07IH1cclxuZm4uUFJJQ0UgPSBmdW5jdGlvbigpIHsgdGhyb3cgeyBNZXNzYWdlOiBcIk5vdCBJbXBsZW1lbnRlZFwiIH07IH1cclxuZm4uUFJJQ0VESVNDID0gZnVuY3Rpb24oKSB7IHRocm93IHsgTWVzc2FnZTogXCJOb3QgSW1wbGVtZW50ZWRcIiB9OyB9XHJcbmZuLlBSSUNFTUFUID0gZnVuY3Rpb24oKSB7IHRocm93IHsgTWVzc2FnZTogXCJOb3QgSW1wbGVtZW50ZWRcIiB9OyB9XHJcbmZuLlBWID0gZnVuY3Rpb24oKSB7IHRocm93IHsgTWVzc2FnZTogXCJOb3QgSW1wbGVtZW50ZWRcIiB9OyB9XHJcbmZuLlJBVEUgPSBmdW5jdGlvbigpIHsgdGhyb3cgeyBNZXNzYWdlOiBcIk5vdCBJbXBsZW1lbnRlZFwiIH07IH1cclxuZm4uUkVDRUlWRUQgPSBmdW5jdGlvbigpIHsgdGhyb3cgeyBNZXNzYWdlOiBcIk5vdCBJbXBsZW1lbnRlZFwiIH07IH1cclxuZm4uU0xOID0gZnVuY3Rpb24oKSB7IHRocm93IHsgTWVzc2FnZTogXCJOb3QgSW1wbGVtZW50ZWRcIiB9OyB9XHJcbmZuLlNZRCA9IGZ1bmN0aW9uKCkgeyB0aHJvdyB7IE1lc3NhZ2U6IFwiTm90IEltcGxlbWVudGVkXCIgfTsgfVxyXG5mbi5UQklMTEVRID0gZnVuY3Rpb24oKSB7IHRocm93IHsgTWVzc2FnZTogXCJOb3QgSW1wbGVtZW50ZWRcIiB9OyB9XHJcbmZuLlRCSUxMUFJJQ0UgPSBmdW5jdGlvbigpIHsgdGhyb3cgeyBNZXNzYWdlOiBcIk5vdCBJbXBsZW1lbnRlZFwiIH07IH1cclxuZm4uVEJJTExZSUVMRCA9IGZ1bmN0aW9uKCkgeyB0aHJvdyB7IE1lc3NhZ2U6IFwiTm90IEltcGxlbWVudGVkXCIgfTsgfVxyXG5mbi5WREIgPSBmdW5jdGlvbigpIHsgdGhyb3cgeyBNZXNzYWdlOiBcIk5vdCBJbXBsZW1lbnRlZFwiIH07IH1cclxuZm4uWElSUiA9IGZ1bmN0aW9uKCkgeyB0aHJvdyB7IE1lc3NhZ2U6IFwiTm90IEltcGxlbWVudGVkXCIgfTsgfVxyXG5mbi5YTlBWID0gZnVuY3Rpb24oKSB7IHRocm93IHsgTWVzc2FnZTogXCJOb3QgSW1wbGVtZW50ZWRcIiB9OyB9XHJcbmZuLllJRUxEID0gZnVuY3Rpb24oKSB7IHRocm93IHsgTWVzc2FnZTogXCJOb3QgSW1wbGVtZW50ZWRcIiB9OyB9XHJcbmZuLllJRUxERElTQyA9IGZ1bmN0aW9uKCkgeyB0aHJvdyB7IE1lc3NhZ2U6IFwiTm90IEltcGxlbWVudGVkXCIgfTsgfVxyXG5mbi5ZSUVMRE1BVCA9IGZ1bmN0aW9uKCkgeyB0aHJvdyB7IE1lc3NhZ2U6IFwiTm90IEltcGxlbWVudGVkXCIgfTsgfVxyXG5mbi5DRUxMID0gZnVuY3Rpb24oKSB7IHRocm93IHsgTWVzc2FnZTogXCJOb3QgSW1wbGVtZW50ZWRcIiB9OyB9XHJcbmZuLklORk8gPSBmdW5jdGlvbigpIHsgdGhyb3cgeyBNZXNzYWdlOiBcIk5vdCBJbXBsZW1lbnRlZFwiIH07IH1cclxuXHJcbmZ1bmN0aW9uIF9pc0JsYW5rKHZhbHVlKSB7XHJcbiAgICByZXR1cm4gdmFsdWUgPT0gbnVsbCB8fCB2YWx1ZS5Ub1N0cmluZygpID09IHN0cmluZy5FbXB0eTtcclxufVxyXG5cclxuZm4uSVNCTEFOSyA9IGZ1bmN0aW9uKHZhbHVlKSB7IFxyXG4gICAgaWYgKEFycmF5LmFueUFycmF5KHZhbHVlKSkgeyBcclxuICAgICAgICByZXR1cm4gX2lzQmxhbmsuY3Jvc3NBcHBseSh2YWx1ZSk7XHJcbiAgICB9IFxyXG4gICAgcmV0dXJuIF9pc0JsYW5rKHZhbHVlKTtcclxufVxyXG5cclxuZm4uSVNFUlIgPSBmdW5jdGlvbigpIHsgdGhyb3cgeyBNZXNzYWdlOiBcIk5vdCBJbXBsZW1lbnRlZFwiIH07IH1cclxuZm4uSVNFUlJPUiA9IGZ1bmN0aW9uKCkgeyB0aHJvdyB7IE1lc3NhZ2U6IFwiTm90IEltcGxlbWVudGVkXCIgfTsgfVxyXG5cclxuZnVuY3Rpb24gX2lzRXZlbih2YWx1ZSkge1xyXG4gICAgcmV0dXJuIHZhbHVlICUgMiA9PSAwO1xyXG59XHJcblxyXG5mbi5JU0VWRU4gPSBmdW5jdGlvbih2YWx1ZSkgeyBcclxuICAgIGlmIChBcnJheS5hbnlBcnJheSh2YWx1ZSkpIHsgXHJcbiAgICAgICAgcmV0dXJuIF9pc0V2ZW4uY3Jvc3NBcHBseSh2YWx1ZSk7XHJcbiAgICB9IFxyXG4gICAgcmV0dXJuIF9pc0V2ZW4odmFsdWUpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBfaXNMb2dpY2FsKHZhbHVlKSB7XHJcbiAgICByZXR1cm4gdHlwZW9mKHZhbHVlKSA9PT0gJ2Jvb2xlYW4nO1xyXG59XHJcblxyXG5mbi5JU0xPR0lDQUwgPSBmdW5jdGlvbih2YWx1ZSkge1xyXG4gICAgaWYgKEFycmF5LmFueUFycmF5KHZhbHVlKSkgeyBcclxuICAgICAgICByZXR1cm4gX2lzTG9naWNhbC5jcm9zc0FwcGx5KHZhbHVlKTtcclxuICAgIH0gXHJcbiAgICByZXR1cm4gX2lzTG9naWNhbCh2YWx1ZSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIF9pc05BKHZhbHVlKSB7XHJcbiAgICByZXR1cm4gKHZhbHVlID09IGZuLk5BKCkpO1xyXG59XHJcblxyXG5mbi5JU05BID0gZnVuY3Rpb24odmFsdWUpIHtcclxuICAgIGlmIChBcnJheS5hbnlBcnJheSh2YWx1ZSkpIHsgXHJcbiAgICAgICAgcmV0dXJuIF9pc05BLmNyb3NzQXBwbHkodmFsdWUpO1xyXG4gICAgfSBcclxuICAgIHJldHVybiBfaXNOQSh2YWx1ZSk7XHJcbn1cclxuXHJcblxyXG5mdW5jdGlvbiBfaXNOb25UZXh0KHZhbHVlKSB7XHJcbiAgICByZXR1cm4gdHlwZW9mKHZhbHVlKSAhPT0gJ3N0cmluZyc7XHJcbn1cclxuXHJcbmZuLklTTk9OVEVYVCA9IGZ1bmN0aW9uKHZhbHVlKSB7XHJcbiAgICBpZiAoQXJyYXkuYW55QXJyYXkodmFsdWUpKSB7IFxyXG4gICAgICAgIHJldHVybiBfaXNOb25UZXh0LmNyb3NzQXBwbHkodmFsdWUpO1xyXG4gICAgfSBcclxuICAgIHJldHVybiBfaXNOb25UZXh0KHZhbHVlKTtcclxufVxyXG5cclxuZnVuY3Rpb24gX2lzTnVtYmVyKHZhbHVlKSB7XHJcbiAgICByZXR1cm4gdmFsdWUgIT0gbnVsbCAmJiAhaXNOYU4odmFsdWUpXHJcbn1cclxuXHJcbmZuLklTTlVNQkVSID0gZnVuY3Rpb24odmFsdWUpIHsgXHJcbiAgICBpZiAoQXJyYXkuYW55QXJyYXkodmFsdWUpKSB7IFxyXG4gICAgICAgIHJldHVybiBfaXNOdW1iZXIuY3Jvc3NBcHBseSh2YWx1ZSk7XHJcbiAgICB9IFxyXG4gICAgcmV0dXJuIF9pc051bWJlcih2YWx1ZSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIF9pc09kZCh2YWx1ZSkge1xyXG4gICAgcmV0dXJuIHZhbHVlICUgMiAhPSAwO1xyXG59XHJcblxyXG5mbi5JU09ERCA9IGZ1bmN0aW9uKHZhbHVlKSB7IFxyXG4gICAgaWYgKEFycmF5LmFueUFycmF5KHZhbHVlKSkgeyBcclxuICAgICAgICByZXR1cm4gX2lzT2RkLmNyb3NzQXBwbHkodmFsdWUpO1xyXG4gICAgfSBcclxuICAgIHJldHVybiBfaXNPZGQodmFsdWUpO1xyXG59XHJcblxyXG5mbi5JU1JFRiA9IGZ1bmN0aW9uKHZhbHVlKSB7IHJldHVybiBmYWxzZTsgfVxyXG5cclxuZnVuY3Rpb24gX2lzVGV4dCh2YWx1ZSkge1xyXG4gICAgcmV0dXJuIHR5cGVvZih2YWx1ZSkgPT09ICdzdHJpbmcnO1xyXG59XHJcblxyXG5mbi5JU1RFWFQgPSBmdW5jdGlvbih2YWx1ZSkgeyBcclxuICAgIGlmIChBcnJheS5hbnlBcnJheSh2YWx1ZSkpIHsgXHJcbiAgICAgICAgcmV0dXJuIF9pc1RleHQuY3Jvc3NBcHBseSh2YWx1ZSk7XHJcbiAgICB9IFxyXG4gICAgcmV0dXJuIF9pc1RleHQodmFsdWUpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBfbih2YWx1ZSkge1xyXG4gICAgcmV0dXJuIE51bWJlcih2YWx1ZSk7XHJcbn1cclxuXHJcbmZuLk4gPSBmdW5jdGlvbih2YWx1ZSkgeyBcclxuICAgIGlmIChBcnJheS5hbnlBcnJheSh2YWx1ZSkpIHsgXHJcbiAgICAgICAgcmV0dXJuIF9uLmNyb3NzQXBwbHkodmFsdWUpO1xyXG4gICAgfSBcclxuICAgIHJldHVybiBfbih2YWx1ZSk7XHJcbn1cclxuXHJcbmZuLk5BID0gZnVuY3Rpb24oKSB7IHJldHVybiBcIiNOQVwiOyB9XHJcblxyXG5mdW5jdGlvbiBfdHlwZSh2YWx1ZSkge1xyXG4gICAgaWYgKHZhbHVlID09IG51bGwgfHwgdmFsdWUgPT0gdW5kZWZpbmVkKSByZXR1cm4gMDtcclxuICAgIGVsc2UgaWYgKHR5cGVvZih2YWx1ZSkgPT09ICdzdHJpbmcnKSByZXR1cm4gMjtcclxuICAgIGVsc2UgaWYgKHR5cGVvZih2YWx1ZSkgPT09ICdib29sZWFuJykgcmV0dXJuIDQ7XHJcbiAgICBlbHNlIGlmICh0eXBlb2YodmFsdWUpID09PSAnUmFuZ2UnKSByZXR1cm4gNjQ7IC8vVE9ETyBDb3JyZWN0IG1lXHJcbiAgICBlbHNlIGlmICh0eXBlb2YodmFsdWUpID09PSAnbnVtYmVyJykgcmV0dXJuIDE7XHJcbiAgICBlbHNlIHJldHVybiAxNjtcclxufVxyXG5cclxuZm4uVFlQRSA9IGZ1bmN0aW9uKHZhbHVlKSB7XHJcbiAgICBpZiAoQXJyYXkuYW55QXJyYXkodmFsdWUpKSB7IFxyXG4gICAgICAgIHJldHVybiBfdHlwZS5jcm9zc0FwcGx5KHZhbHVlKTtcclxuICAgIH0gXHJcbiAgICByZXR1cm4gX3R5cGUodmFsdWUpO1xyXG59XHJcblxyXG4vLyByYW5nZXMgYW5kIGV4dGVuZGVkIGZ1bmN0aW9uc1xyXG5cclxuXHJcblxyXG5mbi5ESVNUSU5DVCA9IGZ1bmN0aW9uKHJhbmdlKSB7XHJcbiAgICByZXR1cm4gQXJyYXkuZGlzdGluY3QoQXJyYXkubm9ybWFsaXplKHJhbmdlKSk7XHJcbn1cclxuXHJcbmZuLkRJU1RJTkNUSUYgPSBmdW5jdGlvbihyYW5nZSwgY3JpdGVyaWEpIHtcclxuICAgIHJldHVybiBBcnJheS5kaXN0aW5jdChcclxuICAgICAgICBBcnJheS5ub3JtYWxpemUocmFuZ2UpLndoZXJlKFxyXG4gICAgICAgICAgICBwcmVkaWNhdGVzLmNoZWNrQ3JpdGVyaWEoY3JpdGVyaWEpXHJcbiAgICAgICAgKVxyXG4gICAgKTtcclxufVxyXG5cclxuZm4uUkFOR0VJRiA9IGZ1bmN0aW9uKHJhbmdlLCBjcml0ZXJpYSwgcmV0dXJuUmFuZ2UpIHtcclxuXHJcbiAgICBpZiAocmV0dXJuUmFuZ2UgPT09IHVuZGVmaW5lZCkgcmV0dXJuUmFuZ2UgPSByYW5nZTtcclxuXHJcbiAgICB2YXIgcjEgPSBBcnJheS5ub3JtYWxpemUocmFuZ2UpO1xyXG4gICAgdmFyIHIyID0gQXJyYXkubm9ybWFsaXplKHJldHVyblJhbmdlKTtcclxuICAgIHZhciB2YWx1ZXMgPSBbXTtcclxuICAgIHZhciBmbkNyaXRlcmlhID0gcHJlZGljYXRlcy5jaGVja0NyaXRlcmlhKGNyaXRlcmlhKTtcclxuXHJcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHIxLmxlbmd0aCAmJiBpIDwgcjIubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICB2YXIgdmFsUjEgPSByMVtpXTtcclxuICAgICAgICB2YXIgdmFsUjIgPSByMltpXTtcclxuXHJcbiAgICAgICAgaWYgKGZuQ3JpdGVyaWEodmFsUjEsIGkpICYmIHZhbFIyICE9IG51bGwgJiYgdmFsUjIgIT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIHZhbHVlcy5BZGQodmFsUjIpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdmFsdWVzO1xyXG5cclxufVxyXG5cclxuZm4uRklSU1QgPSBmdW5jdGlvbihyYW5nZSkge1xyXG4gICAgcmV0dXJuIEFycmF5Lm5vcm1hbGl6ZShyYW5nZSkuZmlyc3RPckRlZmF1bHQoKTtcclxufVxyXG5cclxuZm4uTEFTVCA9IGZ1bmN0aW9uKHJhbmdlKSB7XHJcbiAgICByZXR1cm4gQXJyYXkubm9ybWFsaXplKHJhbmdlKS5sYXN0T3JEZWZhdWx0KCk7XHJcbn1cclxuXHJcbmZuLlRBS0UgPSBmdW5jdGlvbihjb3VudCwgcmFuZ2UpIHtcclxuICAgIHJldHVybiBBcnJheS5ub3JtYWxpemUocmFuZ2UpLnRha2UoY291bnQpO1xyXG59XHJcblxyXG5mbi5UT1AgPSBmdW5jdGlvbihjb3VudCwgcmFuZ2UpIHtcclxuICAgIHJldHVybiBBcnJheS5ub3JtYWxpemUocmFuZ2UpLnRha2UoY291bnQpO1xyXG59XHJcblxyXG5mbi5CT1RUT00gPSBmdW5jdGlvbihjb3VudCwgcmFuZ2UpIHtcclxuICAgIHJldHVybiBBcnJheS5ub3JtYWxpemUocmFuZ2UpLnJldmVyc2UoKS50YWtlKGNvdW50KTtcclxufVxyXG5cclxuZm4uU0tJUCA9IGZ1bmN0aW9uKGNvdW50LCByYW5nZSkge1xyXG4gICAgcmV0dXJuIEFycmF5Lm5vcm1hbGl6ZShyYW5nZSkuc2tpcChjb3VudCk7XHJcbn1cclxuXHJcbmZuLlJFVkVSU0UgPSBmdW5jdGlvbihyYW5nZSkge1xyXG4gICAgcmV0dXJuIEFycmF5Lm5vcm1hbGl6ZShyYW5nZSkucmV2ZXJzZSgpO1xyXG59XHJcblxyXG5mbi5BU0MgPSBmdW5jdGlvbihyYW5nZSkge1xyXG4gICAgcmV0dXJuIEFycmF5Lm5vcm1hbGl6ZShyYW5nZSkub3JkZXJCeShjb21wYXJlci5hc2NlbmRpbmcpO1xyXG59XHJcblxyXG5mbi5ERVNDID0gZnVuY3Rpb24ocmFuZ2UpIHtcclxuICAgIHJldHVybiBBcnJheS5ub3JtYWxpemUocmFuZ2UpLm9yZGVyQnkoY29tcGFyZXIuZGVzY2VuZGluZyk7XHJcbn1cclxuXHJcbmZuLkFOWSA9IGZ1bmN0aW9uKHJhbmdlKSB7XHJcbiAgICByZXR1cm4gQXJyYXkubm9ybWFsaXplKHJhbmdlKS5hbnkoKTtcclxufVxyXG5cclxuZm4uQVZFUkFHRSA9IGZ1bmN0aW9uKHJhbmdlKSB7XHJcbiAgICB2YXIgc3VtID0gMDsgdmFyIGNvdW50ID0gMDtcclxuICAgIHJhbmdlID0gQXJyYXkubm9ybWFsaXplKHJhbmdlKTtcclxuXHJcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHJhbmdlLmxlbmd0aDsgaSsrKSB7ICAgIFxyXG4gICAgICAgIHZhciB2YWx1ZSA9IHJhbmdlW2ldO1xyXG4gICAgICAgIGlmICghaXNOYU4odmFsdWUpKSB7XHJcbiAgICAgICAgICAgIHN1bSArPSBOdW1iZXIodmFsdWUpO1xyXG4gICAgICAgICAgICBjb3VudCsrO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBzdW0gLyBjb3VudDtcclxufVxyXG5cclxuZm4uTE9PS1VQID0gZnVuY3Rpb24odmFsdWUsIGxvb2t1cFJhbmdlLCByZXN1bHRSYW5nZSkge1xyXG5cclxuICAgIHZhciByMSA9IEFycmF5Lm5vcm1hbGl6ZShsb29rdXBSYW5nZSk7XHJcbiAgICB2YXIgcjIgPSBBcnJheS5ub3JtYWxpemUocmVzdWx0UmFuZ2UpO1xyXG5cclxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcjEubGVuZ3RoICYmIGkgPCByMi5sZW5ndGg7IGkrKykge1xyXG5cclxuICAgICAgICB2YXIgdmFsUjEgPSByMVtpXTtcclxuICAgICAgICB2YXIgdmFsUjIgPSByMltpXTtcclxuXHJcbiAgICAgICAgaWYgKHZhbFIxID09PSB2YWx1ZSkge1xyXG4gICAgICAgICAgICByZXR1cm4gdmFsUjI7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBudWxsO1xyXG59XHJcblxyXG5mbi5WTE9PS1VQID0gZnVuY3Rpb24odmFsdWUsIHJhbmdlLCBjb2x1bW4pIHtcclxuICAgIHZhciByQXJyID0gQXJyYXkubm9ybWFsaXplKHJhbmdlLCBmYWxzZSk7XHJcbiAgICBpZiAoIWlzTmFOKGNvbHVtbikpIHtcclxuICAgICAgICBjb2x1bW4gPSBOdW1iZXIoY29sdW1uKTtcclxuICAgICAgICBpZiAoY29sdW1uID4gMCkge1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHJBcnIubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIHZhciBpbm5lckFyciA9IHJBcnJbaV07XHJcbiAgICAgICAgICAgICAgICBpZiAoaW5uZXJBcnIuY29uc3RydWN0b3IgPT09IEFycmF5ICYmIGlubmVyQXJyLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgb2JqID0gaW5uZXJBcnJbMF07XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9iaiA9PT0gdmFsdWUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlubmVyQXJyLmxlbmd0aCA8IGNvbHVtbilcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBpbm5lckFycltjb2x1bW5dO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9ICAgICAgICAgICBcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBudWxsO1xyXG59XHJcblxyXG5mbi5JTkRFWCA9IGZ1bmN0aW9uKHJhbmdlLCB2YWx1ZSkge1xyXG4gICAgdmFyIHJBcnIgPSBBcnJheS5ub3JtYWxpemUocmFuZ2UpO1xyXG4gICAgaWYgKCFpc05hTih2YWx1ZSkpIHtcclxuICAgICAgICB2YWx1ZSA9IE51bWJlcih2YWx1ZSk7XHJcbiAgICAgICAgaWYgKHZhbHVlID4gMCAmJiB2YWx1ZSA8PSByQXJyLmxlbmd0aClcclxuICAgICAgICAgICAgcmV0dXJuIHJBcnJbdmFsdWUgLSAxXTtcclxuICAgIH1cclxuICAgIHJldHVybiBudWxsO1xyXG59XHJcblxyXG5mbi5NQVRDSCA9IGZ1bmN0aW9uKGxvb2t1cF92YWx1ZSwgbG9va3VwX3JhbmdlLCBtYXRjaF90eXBlKSB7XHJcbiAgICB2YXIgckFyciA9IEFycmF5Lm5vcm1hbGl6ZShsb29rdXBfcmFuZ2UpO1xyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCByQXJyLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgaWYgKHJBcnJbaV0gPT09IGxvb2t1cF92YWx1ZSkgcmV0dXJuIGkgKyAxO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIDA7XHJcbn1cclxuXHJcbiIsIid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBTeW1ib2xUYWJsZSA9IHJlcXVpcmUoXCIuL3N5bWJvbFRhYmxlXCIpO1xyXG52YXIgRGF0YVRhYmxlID0gcmVxdWlyZShcIi4vZGF0YVRhYmxlXCIpO1xyXG52YXIgQ29udGV4dCA9IHJlcXVpcmUoXCIuL2NvbnRleHRcIik7XHJcbnZhciBwYXJzZXIgPSByZXF1aXJlKFwiLi9yTGFuZ1wiKS5wYXJzZXI7XHJcbnZhciBhcHBWZXJzaW9uID0gXCIxLjIuMDczMTE3LjFcIjtcclxuXHJcbmZ1bmN0aW9uIG1lYXN1cmVUaW1lKHN0YXJ0KSB7XHJcbiAgICBpZiAoIXByb2Nlc3MgfHwgIXByb2Nlc3MuaHJ0aW1lKSByZXR1cm4gWzAsLTFdXHJcbiAgICBpZiAoICFzdGFydCApIHJldHVybiBwcm9jZXNzLmhydGltZSgpO1xyXG4gICAgdmFyIGVuZCA9IHByb2Nlc3MuaHJ0aW1lKHN0YXJ0KTtcclxuICAgIHJldHVybiBlbmQ7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIENvbXBpbGUgKGZvcm11bGEsIGV4cHJlc3Npb25zKSB7XHJcblxyXG4gICAgdmFyIGV4cHJlc3Npb24gPSBcIlwiO1xyXG5cclxuICAgIGlmIChmb3JtdWxhKVxyXG4gICAgICAgIGV4cHJlc3Npb24gPSBmb3JtdWxhO1xyXG4gICAgZWxzZSBpZiAoZXhwcmVzc2lvbnMuY29uc3RydWN0b3IgPT09IEFycmF5KSB7XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBleHByZXNzaW9ucy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBpZiAoZXhwcmVzc2lvbnNbaV0uVmFyaWFibGUpIHtcclxuICAgICAgICAgICAgICAgIHZhciB2ID0gZXhwcmVzc2lvbnNbaV0uVmFyaWFibGU7XHJcbiAgICAgICAgICAgICAgICB2YXIgZSA9IGV4cHJlc3Npb25zW2ldLkV4cHJlc3Npb247XHJcbiAgICAgICAgICAgICAgICBpZiAodiAmJiBlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZXhwcmVzc2lvbiArPSB2ICsgXCIgPSB7XCIgKyBlICsgXCJ9XFxuXCI7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZXhwcmVzc2lvbnNbaV0uQ29udGV4dERlZmluaXRpb24gJiYgZXhwcmVzc2lvbnNbaV0uQ29udGV4dERlZmluaXRpb24gPT09IEFycmF5KSB7XHJcbiAgICAgICAgICAgICAgICBleHByZXNzaW9uICs9IFwiY29udGV4dCB7IFwiICsgZXhwcmVzc2lvbnNbaV0uQ29udGV4dERlZmluaXRpb24uam9pbignLCcpICsgIFwiIH1cXG5cIjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gXHJcbiAgICB9IGVsc2VcclxuICAgICAgICB0aHJvdyB7IE1lc3NhZ2U6IFwiZXhwcmVzc2lvbnMgbXVzdCBiZSBhbiBhcnJheSBvZiBleHByZXNzaW9uIGRlZmluaXRpb25zXCJ9XHJcblxyXG4gICAgdmFyIGZuID0gcGFyc2VyLnBhcnNlKGV4cHJlc3Npb24pO1xyXG4gICAgcmV0dXJuIGZuO1xyXG59XHJcblxyXG5mdW5jdGlvbiBFeGVjdXRlTGlzdChmbiwgZXZlbnQpIHtcclxuICAgIHZhciBjdHggPSBldmVudC5Db250ZXh0O1xyXG4gICAgdmFyIHJldFZhcnMgPSBldmVudC5FeHBvcnRzO1xyXG4gICAgdmFyIGdsb2JhbHMgPSBldmVudC5HbG9iYWxzO1xyXG4gICAgdmFyIHJldHVybkRhdGEgPSBbXTtcclxuICAgIGlmIChjdHggJiYgY3R4LmNvbnN0cnVjdG9yID09PSBBcnJheSkge1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY3R4Lmxlbmd0aDsgaSsrKSB7XHJcblxyXG4gICAgICAgICAgICB2YXIgdmFyaWFibGVzID0gKGdsb2JhbHMgJiYgZ2xvYmFscy5WYXJpYWJsZXMpIFxyXG4gICAgICAgICAgICAgICAgPyBPYmplY3QuYXNzaWduKHt9LCBnbG9iYWxzLlZhcmlhYmxlcywgY3R4W2ldLlZhcmlhYmxlcykgXHJcbiAgICAgICAgICAgICAgICA6IGN0eFtpXS5WYXJpYWJsZXM7XHJcblxyXG4gICAgICAgICAgICB2YXIgZGF0YSA9IChnbG9iYWxzICYmIGdsb2JhbHMuRGF0YSkgXHJcbiAgICAgICAgICAgICAgICA/IE9iamVjdC5hc3NpZ24oe30sIGdsb2JhbHMuRGF0YSwgY3R4W2ldLkRhdGEpIFxyXG4gICAgICAgICAgICAgICAgOiBjdHhbaV0uRGF0YTtcclxuXHJcbiAgICAgICAgICAgIHZhciBzdGFydFRpbWUgPSBtZWFzdXJlVGltZSgpO1xyXG4gICAgICAgICAgICB2YXIgY29udGV4dCA9IG5ldyBDb250ZXh0KHZhcmlhYmxlcywgZGF0YSwgbnVsbClcclxuICAgICAgICAgICAgdmFyIHIgPSBmbihjb250ZXh0LCByZXRWYXJzKTtcclxuICAgICAgICAgICAgdmFyIHJlc3VsdCA9IHsgSWQ6IGN0eFtpXS5JZCwgUmVzdWx0SXRlbXM6IFtdLCBSZXN1bHQ6IHIgfTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybkRhdGEucHVzaChyZXN1bHQpO1xyXG5cclxuICAgICAgICAgICAgcmVzdWx0LlJlc3VsdEl0ZW1zID0gY29udGV4dC5nO1xyXG4gICAgICAgICAgICBpZiAoY3R4W2ldLnJldHVyblRhYmxlcykgcmVzdWx0LnRhYmxlcyA9IGNvbnRleHQudDtcclxuXHJcbiAgICAgICAgICAgIHZhciBlbmRUaW1lID0gbWVhc3VyZVRpbWUoc3RhcnRUaW1lKTtcclxuICAgICAgICAgICAgcmVzdWx0LkR1cmF0aW9uID0gZW5kVGltZVswXSArIGVuZFRpbWVbMV0gLyAxZTk7XHJcblxyXG4gICAgICAgICAgICBcclxuXHJcbiAgICAgICAgfVxyXG4gICAgfSBlbHNlXHJcbiAgICAgICAgdGhyb3cgeyBNZXNzYWdlOiBcIkNvbnRleHQgbXVzdCBiZSBhbiBhcnJheSBvZiB0aW1lc2hlZXQgY29udGV4dHNcIn1cclxuXHJcbiAgICByZXR1cm4gcmV0dXJuRGF0YTtcclxufVxyXG5cclxuZXhwb3J0cy5jb250ZXh0ID0gQ29udGV4dDtcclxuZXhwb3J0cy5wYXJzZXIgPSBwYXJzZXI7XHJcbmV4cG9ydHMuc3ltYm9sVGFibGUgPSBTeW1ib2xUYWJsZTtcclxuZXhwb3J0cy5kYXRhVGFibGUgPSBEYXRhVGFibGU7XHJcblxyXG5leHBvcnRzLmhhbmRsZXIgPSAoZXZlbnQsIGNvbnRleHQsIGNhbGxiYWNrKSA9PiB7XHJcbiAgICAvL2NvbnNvbGUubG9nKCdSZWNlaXZlZCBldmVudDonLCBKU09OLnN0cmluZ2lmeShldmVudCwgbnVsbCwgMikpO1xyXG4gICAgICAgIFxyXG4gICAgdmFyIHJldCA9IHt9O1xyXG4gICAgdmFyIGVyciA9IG51bGw7XHJcblxyXG4gICAgdHJ5IHtcclxuICAgICAgICBpZiAoZXZlbnQgJiYgKGV2ZW50LkV4cHJlc3Npb25zIHx8IGV2ZW50LkZvcm11bGEpKSB7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB2YXIgc3RhcnRUaW1lID0gbWVhc3VyZVRpbWUoKTtcclxuXHJcbiAgICAgICAgICAgIHZhciBmbiA9IENvbXBpbGUoZXZlbnQuRm9ybXVsYSwgZXZlbnQuRXhwcmVzc2lvbnMpO1xyXG5cclxuICAgICAgICAgICAgdmFyIGNvbXBpbGVUaW1lID0gbWVhc3VyZVRpbWUoc3RhcnRUaW1lKTtcclxuXHJcbiAgICAgICAgICAgIHJldC5SZXN1bHQgPSBFeGVjdXRlTGlzdChmbiwgZXZlbnQpO1xyXG5cclxuICAgICAgICAgICAgdmFyIHRvdGFsVGltZSA9IG1lYXN1cmVUaW1lKHN0YXJ0VGltZSk7XHJcblxyXG4gICAgICAgICAgICByZXQuT2sgPSB0cnVlO1xyXG4gICAgICAgICAgICByZXQuTWVzc2FnZSA9IFwiT2suXCJcclxuICAgICAgICAgICAgcmV0LkR1cmF0aW9uID0gdG90YWxUaW1lWzBdICsgdG90YWxUaW1lWzFdIC8gMWU5O1xyXG4gICAgICAgICAgICByZXQuQ29tcGlsZUR1cmF0aW9uID0gY29tcGlsZVRpbWVbMF0gKyBjb21waWxlVGltZVsxXSAvIDFlOTtcclxuXHJcbiAgICAgICAgICAgIGlmIChldmVudC5kZWJ1ZyB8fCBldmVudC5EZWJ1Zykge1xyXG4gICAgICAgICAgICAgICAgcmV0LkNvZGUgPSBmbi50b1N0cmluZygpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICAgcmV0Lk9rID0gZmFsc2U7XHJcbiAgICAgICAgIHJldC5FcnJvciA9IGVycm9yO1xyXG4gICAgICAgICByZXQuTWVzc2FnZSA9IChlcnJvcikgPyAoKGVycm9yLm1lc3NhZ2UpID8gZXJyb3IubWVzc2FnZSA6IGVycm9yKSA6IFwiRXJyb3JcIiA7XHJcbiAgICAgICAgIGlmIChlcnJvciAmJiAhZXJyb3IubWVzc2FnZSkge1xyXG4gICAgICAgICAgICAgY29uc29sZS5sb2coJ2Vycm9yOicsIEpTT04uc3RyaW5naWZ5KGVycm9yLCBudWxsLCAyKSk7XHJcbiAgICAgICAgIH1cclxuICAgICAgICAgZXJyID0gZXJyb3I7XHJcbiAgICB9XHJcbiAgICAgICAgXHJcbiAgICByZXQudmVyc2lvbiA9IGFwcFZlcnNpb247XHJcblxyXG4gICAgaWYgKGNhbGxiYWNrKSB7XHJcbiAgICAgICAgLy9sYW1iZGEgd2lsbCBub3QgdGhyb3cgZXJyb3JzO1xyXG4gICAgICAgIGNhbGxiYWNrKG51bGwsIHJldCk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIC8vbm9ybWFsIGNhbGxzIHdpbGwgdGhyb3cgZXJyb3JzIGZvciB1bml0IHRlc3RzXHJcbiAgICAgICAgaWYgKGVycikgdGhyb3cgZXJyO1xyXG4gICAgICAgIHJldHVybiByZXQ7XHJcbiAgICB9XHJcbiAgICBcclxufTsiLCIvKmpzbG5vZGU6IHRydWUgKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxucmVxdWlyZSgnanMtYXJyYXktZXh0ZW5zaW9ucycpO1xyXG52YXIgbW9tZW50ID0gcmVxdWlyZSgnbW9tZW50Jyk7XHJcbnZhciBwcmVkaWNhdGVzID0gcmVxdWlyZSgnLi9wcmVkaWNhdGVzJyk7XHJcbnZhciBmbkhlbHBlcnMgPSByZXF1aXJlKCcuL2ZuSGVscGVycycpO1xyXG5cclxudmFyIGZuID0ge307XHJcbm1vZHVsZS5leHBvcnRzID0gZm47XHJcblxyXG52YXIgdiA9IGZuSGVscGVycy5nZXRWYWx1ZTtcclxuXHJcbmZ1bmN0aW9uIF9yb3VuZCh2YWx1ZSwgZGlnaXRzKSB7IFxyXG4gICAgcmV0dXJuIE1hdGgucm91bmQodmFsdWUgKiBNYXRoLnBvdygxMCwgZGlnaXRzKSkgLyBNYXRoLnBvdygxMCwgZGlnaXRzKVxyXG59O1xyXG5cclxuZm4uUk9VTkQgPSBmdW5jdGlvbih2YWx1ZSwgZGlnaXRzKSB7XHJcblxyXG4gICAgaWYgKEFycmF5LmFueUFycmF5KHZhbHVlLCBkaWdpdHMpKSB7IFxyXG4gICAgICAgIHZhciByZXQgPSBbXTtcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IEFycmF5Lm1heExlbmd0aCh2YWx1ZSwgZGlnaXRzKTsgaSsrKSB7XHJcbiAgICAgICAgICAgIHJldC5wdXNoKGZuLlJPVU5EKHYodmFsdWUsIGkpLCB2KGRpZ2l0cywgaSkpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHJldDsgICAgICAgICBcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gX3JvdW5kKHZhbHVlLCBkaWdpdHMpOyBcclxufVxyXG5cclxuZm4uQUJTID0gZnVuY3Rpb24odmFsdWUpIHsgXHJcbiAgICBpZiAoQXJyYXkuYW55QXJyYXkodmFsdWUpKSB7IFxyXG4gICAgICAgIHZhciByZXQgPSBbXTtcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IEFycmF5Lm1heExlbmd0aCh2YWx1ZSk7IGkrKykge1xyXG4gICAgICAgICAgICByZXQucHVzaChmbi5BQlModih2YWx1ZSwgaSkpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHJldDtcclxuICAgIH1cclxuICAgIHJldHVybiBNYXRoLmFicyh2YWx1ZSk7XHJcbn1cclxuXHJcbmZuLkFDT1MgPSBmdW5jdGlvbih2YWx1ZSkgeyBcclxuICAgIGlmIChBcnJheS5hbnlBcnJheSh2YWx1ZSkpIHsgXHJcbiAgICAgICAgcmV0dXJuIE1hdGguYWNvcy5jcm9zc0FwcGx5KHZhbHVlKTtcclxuICAgIH1cclxuICAgIHJldHVybiBNYXRoLmFjb3ModmFsdWUpOyBcclxufVxyXG5cclxuXHJcbmZuLkFTSU4gPSBmdW5jdGlvbih2YWx1ZSkge1xyXG4gICAgaWYgKEFycmF5LmFueUFycmF5KHZhbHVlKSkgeyBcclxuICAgICAgICByZXR1cm4gTWF0aC5hc2luLmNyb3NzQXBwbHkodmFsdWUpO1xyXG4gICAgfSBcclxuICAgIHJldHVybiBNYXRoLmFzaW4odmFsdWUpOyBcclxufVxyXG5cclxuZm4uQVRBTiA9IGZ1bmN0aW9uKHZhbHVlKSB7XHJcbiAgICBpZiAoQXJyYXkuYW55QXJyYXkodmFsdWUpKSB7IFxyXG4gICAgICAgIHJldHVybiBNYXRoLmF0YW4uY3Jvc3NBcHBseSh2YWx1ZSk7XHJcbiAgICB9IFxyXG4gICAgcmV0dXJuIE1hdGguYXRhbih2YWx1ZSk7IFxyXG59XHJcblxyXG5mbi5BVEFOMiA9IGZ1bmN0aW9uKHZhbHVlLCB2YWx1ZTIpIHtcclxuICAgIGlmIChBcnJheS5hbnlBcnJheSh2YWx1ZSwgdmFsdWUyKSkgeyBcclxuICAgICAgICByZXR1cm4gTWF0aC5hdGFuMi5jcm9zc0FwcGx5KHZhbHVlLCB2YWx1ZTIpO1xyXG4gICAgfSBcclxuICAgIHJldHVybiBNYXRoLmF0YW4yKHZhbHVlLCB2YWx1ZTIpOyBcclxufVxyXG5cclxuZm4uQ0VJTElORyA9IGZ1bmN0aW9uKHZhbHVlKSB7XHJcbiAgICBpZiAoQXJyYXkuYW55QXJyYXkodmFsdWUpKSB7IFxyXG4gICAgICAgIHJldHVybiBNYXRoLmNlaWwuY3Jvc3NBcHBseSh2YWx1ZSk7XHJcbiAgICB9IFxyXG4gICAgcmV0dXJuIE1hdGguY2VpbCh2YWx1ZSk7IFxyXG59XHJcblxyXG5mbi5DT1MgPSBmdW5jdGlvbih2YWx1ZSkge1xyXG4gICAgaWYgKEFycmF5LmFueUFycmF5KHZhbHVlKSkgeyBcclxuICAgICAgICByZXR1cm4gTWF0aC5jb3MuY3Jvc3NBcHBseSh2YWx1ZSk7XHJcbiAgICB9IFxyXG4gICAgcmV0dXJuIE1hdGguY29zKHZhbHVlKTsgXHJcbn1cclxuXHJcbmZ1bmN0aW9uIF9kZWdyZWVzKHZhbHVlKSB7XHJcbiAgICByZXR1cm4gTWF0aC5QSSAqIHZhbHVlIC8gMTgwLjA7XHJcbn1cclxuXHJcbmZuLkRFR1JFRVMgPSBmdW5jdGlvbih2YWx1ZSkge1xyXG4gICAgaWYgKEFycmF5LmFueUFycmF5KHZhbHVlKSkgeyBcclxuICAgICAgICByZXR1cm4gX2RlZ3JlZXMuY3Jvc3NBcHBseSh2YWx1ZSk7XHJcbiAgICB9IFxyXG4gICAgcmV0dXJuIF9kZWdyZWVzKHZhbHVlKTtcclxufVxyXG5cclxuZnVuY3Rpb24gX2V2ZW4odmFsdWUpIHtcclxuICAgIHZhbHVlID0gTWF0aC5mbG9vcih2YWx1ZSk7IFxyXG4gICAgcmV0dXJuICh2YWx1ZSAlIDIgPT0gMCkgPyB2YWx1ZSA6IHZhbHVlICsgMTtcclxufVxyXG5cclxuZm4uRVZFTiA9IGZ1bmN0aW9uKHZhbHVlKSB7IFxyXG4gICAgaWYgKEFycmF5LmFueUFycmF5KHZhbHVlKSkgeyBcclxuICAgICAgICByZXR1cm4gX2V2ZW4uY3Jvc3NBcHBseSh2YWx1ZSk7XHJcbiAgICB9IFxyXG4gICAgcmV0dXJuIF9ldmVuKHZhbHVlKTtcclxufVxyXG5cclxuZm4uRVhQID0gZnVuY3Rpb24odmFsdWUpIHsgXHJcbiAgICBpZiAoQXJyYXkuYW55QXJyYXkodmFsdWUpKSB7IFxyXG4gICAgICAgIHJldHVybiBNYXRoLmV4cC5jcm9zc0FwcGx5KHZhbHVlKTtcclxuICAgIH0gXHJcbiAgICByZXR1cm4gTWF0aC5leHAodmFsdWUpOyBcclxufVxyXG5cclxuZm4uRkxPT1IgPSBmdW5jdGlvbih2YWx1ZSkge1xyXG4gICAgaWYgKEFycmF5LmFueUFycmF5KHZhbHVlKSkgeyBcclxuICAgICAgICByZXR1cm4gTWF0aC5mbG9vci5jcm9zc0FwcGx5KHZhbHVlKTtcclxuICAgIH0gIFxyXG4gICAgcmV0dXJuIE1hdGguZmxvb3IodmFsdWUpOyBcclxufVxyXG5cclxuZm4uTE9HID0gZnVuY3Rpb24odmFsdWUpIHtcclxuICAgIGlmIChBcnJheS5hbnlBcnJheSh2YWx1ZSkpIHsgXHJcbiAgICAgICAgcmV0dXJuIE1hdGgubG9nLmNyb3NzQXBwbHkodmFsdWUpO1xyXG4gICAgfSAgXHJcbiAgICByZXR1cm4gTWF0aC5sb2codmFsdWUpOyBcclxufVxyXG5cclxuZm4uTE9HMTAgPSBmdW5jdGlvbih2YWx1ZSkge1xyXG4gICAgaWYgKEFycmF5LmFueUFycmF5KHZhbHVlKSkgeyBcclxuICAgICAgICByZXR1cm4gTWF0aC5MT0cxMEUuY3Jvc3NBcHBseSh2YWx1ZSk7XHJcbiAgICB9ICBcclxuICAgIHJldHVybiBNYXRoLkxPRzEwRSh2YWx1ZSk7IFxyXG59XHJcblxyXG5mbi5NT0QgPSBmdW5jdGlvbih2YWx1ZTEsIHZhbHVlMikgeyBcclxuICAgIHJldHVybiB2YWx1ZTEgJSB2YWx1ZTI7IFxyXG59XHJcblxyXG5mdW5jdGlvbiBfb2RkKHZhbHVlKSB7XHJcbiAgICB2YWx1ZSA9IE1hdGguY2VpbCh2YWx1ZSk7IFxyXG4gICAgcmV0dXJuICh2YWx1ZSAlIDIgIT0gMCkgPyB2YWx1ZSA6IHZhbHVlIC0gMTtcclxufVxyXG5cclxuZm4uT0REID0gZnVuY3Rpb24odmFsdWUpIHsgXHJcbiAgICBpZiAoQXJyYXkuYW55QXJyYXkodmFsdWUpKSB7IFxyXG4gICAgICAgIHJldHVybiBfb2RkLmNyb3NzQXBwbHkodmFsdWUpO1xyXG4gICAgfSAgXHJcbiAgICByZXR1cm4gX29kZCh2YWx1ZSk7XHJcbn1cclxuXHJcbmZuLlBJID0gZnVuY3Rpb24oKSB7ICBcclxuICAgIHJldHVybiBNYXRoLlBJOyBcclxufVxyXG5cclxuZm4uUE9XRVIgPSBmdW5jdGlvbih2YWx1ZSwgcG93ZXIpIHtcclxuICAgIGlmIChBcnJheS5hbnlBcnJheSh2YWx1ZSwgcG93ZXIpKSB7IFxyXG4gICAgICAgIHJldHVybiBNYXRoLnBvdy5jcm9zc0FwcGx5KHZhbHVlLCBwb3dlcik7XHJcbiAgICB9ICBcclxuICAgIHJldHVybiBNYXRoLnBvdyh2YWx1ZSwgcG93ZXIpOyBcclxufVxyXG5cclxuZnVuY3Rpb24gX3JhZGlhbnModmFsdWUpIHtcclxuICAgIHJldHVybiAoTWF0aC5QSSAvIDE4MCkgKiB2YWx1ZTtcclxufVxyXG5cclxuZm4uUkFESUFOUyA9IGZ1bmN0aW9uKHZhbHVlKSB7IFxyXG4gICAgaWYgKEFycmF5LmFueUFycmF5KHZhbHVlKSkgeyBcclxuICAgICAgICByZXR1cm4gX3JhZGlhbnMuY3Jvc3NBcHBseSh2YWx1ZSk7XHJcbiAgICB9ICBcclxuICAgIHJldHVybiBfcmFkaWFucyh2YWx1ZSk7XHJcbn1cclxuXHJcbmZuLlJBTkQgPSBmdW5jdGlvbigpIHsgXHJcbiAgICByZXR1cm4gKG5ldyBSYW5kb20oKSkuTmV4dERvdWJsZSgpOyBcclxufVxyXG5cclxuZm4uUkFOREJFVFdFRU4gPSBmdW5jdGlvbihhLCBiKSB7XHJcbiAgICB2YXIgbXlSYW5kID0gbmV3IFJhbmRvbSgpO1xyXG4gICAgaWYgKEFycmF5LmFueUFycmF5KHZhbHVlKSkge1xyXG4gICAgICAgIHZhciBmID0gZnVuY3Rpb24gKHZhbHVlLCBteVJhbmQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIG15UmFuZC5OZXh0KGEsIGIpOyAgICAgICAgXHJcbiAgICAgICAgfSBcclxuICAgICAgICByZXR1cm4gZi5jcm9zc0FwcGx5KHZhbHVlLCBteVJhbmQpO1xyXG4gICAgfSAgXHJcblxyXG4gICAgcmV0dXJuIG15UmFuZC5OZXh0KGEsIGIpOyBcclxufVxyXG5cclxuZnVuY3Rpb24gX3JvdW5kRG93bih2YWx1ZSwgcHJlY2lzaW9uKSB7XHJcbiAgICByZXR1cm4gTWF0aC5mbG9vcih2YWx1ZSAqIE1hdGgucG93KDEwLCBwcmVjaXNpb24pKSAvIE1hdGgucG93KDEwLCBwcmVjaXNpb24pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBfcm91bmRVcCh2YWx1ZSwgcHJlY2lzaW9uKSB7XHJcbiAgICByZXR1cm4gTWF0aC5jZWlsKHZhbHVlICogTWF0aC5wb3coMTAsIHByZWNpc2lvbikpIC8gTWF0aC5wb3coMTAsIHByZWNpc2lvbik7XHJcbn1cclxuXHJcbmZuLlJPVU5ERE9XTiA9IGZ1bmN0aW9uKHZhbHVlLCBwcmVjaXNpb24pIHsgXHJcbiAgICBpZiAoQXJyYXkuYW55QXJyYXkodmFsdWUpKSB7IFxyXG4gICAgICAgIHJldHVybiBfcm91bmREb3duLmNyb3NzQXBwbHkodmFsdWUsIHByZWNpc2lvbik7XHJcbiAgICB9ICBcclxuICAgIHJldHVybiBfcm91bmREb3duKHZhbHVlLCBwcmVjaXNpb24pO1xyXG59XHJcblxyXG5mbi5ST1VORFVQID0gZnVuY3Rpb24odmFsdWUsIHByZWNpc2lvbikge1xyXG4gICAgaWYgKEFycmF5LmFueUFycmF5KHZhbHVlKSkgeyBcclxuICAgICAgICByZXR1cm4gX3JvdW5kVXAuY3Jvc3NBcHBseSh2YWx1ZSwgcHJlY2lzaW9uKTtcclxuICAgIH0gIFxyXG4gICAgcmV0dXJuIF9yb3VuZFVwKHZhbHVlLCBwcmVjaXNpb24pO1xyXG59XHJcblxyXG5mbi5TSUdOID0gZnVuY3Rpb24odmFsdWUpIHtcclxuICAgIGlmIChBcnJheS5hbnlBcnJheSh2YWx1ZSkpIHsgXHJcbiAgICAgICAgcmV0dXJuIE1hdGguc2lnbi5jcm9zc0FwcGx5KHZhbHVlKTtcclxuICAgIH1cclxuICAgIHJldHVybiBNYXRoLnNpZ24odmFsdWUpOyBcclxufVxyXG5cclxuZm4uU0lOID0gZnVuY3Rpb24odmFsdWUpIHtcclxuICAgIGlmIChBcnJheS5hbnlBcnJheSh2YWx1ZSkpIHsgXHJcbiAgICAgICAgcmV0dXJuIE1hdGguc2luLmNyb3NzQXBwbHkodmFsdWUpO1xyXG4gICAgfSBcclxuICAgIHJldHVybiBNYXRoLnNpbih2YWx1ZSk7IFxyXG59XHJcblxyXG5mbi5TUVJUID0gZnVuY3Rpb24odmFsdWUpIHtcclxuICAgIGlmIChBcnJheS5hbnlBcnJheSh2YWx1ZSkpIHsgXHJcbiAgICAgICAgcmV0dXJuIE1hdGguc3FydC5jcm9zc0FwcGx5KHZhbHVlKTtcclxuICAgIH0gXHJcbiAgICByZXR1cm4gTWF0aC5zcXJ0KHZhbHVlKTsgXHJcbn1cclxuXHJcbmZuLlRBTiA9IGZ1bmN0aW9uKHZhbHVlKSB7XHJcbiAgICBpZiAoQXJyYXkuYW55QXJyYXkodmFsdWUpKSB7IFxyXG4gICAgICAgIHJldHVybiBNYXRoLnRhbi5jcm9zc0FwcGx5KHZhbHVlKTtcclxuICAgIH0gXHJcbiAgICByZXR1cm4gTWF0aC50YW4odmFsdWUpOyBcclxufVxyXG5cclxuZm4uQUNPU0ggPSBmdW5jdGlvbigpIHsgdGhyb3cgeyBNZXNzYWdlOiBcIk5vdCBJbXBsZW1lbnRlZFwiIH07IH1cclxuZm4uQVNJTkggPSBmdW5jdGlvbigpIHsgdGhyb3cgeyBNZXNzYWdlOiBcIk5vdCBJbXBsZW1lbnRlZFwiIH07IH1cclxuZm4uQVRBTkggPSBmdW5jdGlvbigpIHsgdGhyb3cgeyBNZXNzYWdlOiBcIk5vdCBJbXBsZW1lbnRlZFwiIH07IH1cclxuZm4uQ09NQklOID0gZnVuY3Rpb24oKSB7IHRocm93IHsgTWVzc2FnZTogXCJOb3QgSW1wbGVtZW50ZWRcIiB9OyB9XHJcbmZuLkNPU0ggPSBmdW5jdGlvbigpIHsgdGhyb3cgeyBNZXNzYWdlOiBcIk5vdCBJbXBsZW1lbnRlZFwiIH07IH1cclxuZm4uR0NEID0gZnVuY3Rpb24oKSB7IHRocm93IHsgTWVzc2FnZTogXCJOb3QgSW1wbGVtZW50ZWRcIiB9OyB9XHJcbmZuLkxDTSA9IGZ1bmN0aW9uKCkgeyB0aHJvdyB7IE1lc3NhZ2U6IFwiTm90IEltcGxlbWVudGVkXCIgfTsgfVxyXG5mbi5MTiA9IGZ1bmN0aW9uKCkgeyB0aHJvdyB7IE1lc3NhZ2U6IFwiTm90IEltcGxlbWVudGVkXCIgfTsgfVxyXG5mbi5GQUNUID0gZnVuY3Rpb24odmFsdWUpIHsgdGhyb3cgeyBNZXNzYWdlOiBcIk5vdCBJbXBsZW1lbnRlZFwiIH07IH1cclxuZm4uRkFDVD0gZnVuY3Rpb24oKSB7IHRocm93IHsgTWVzc2FnZTogXCJOb3QgSW1wbGVtZW50ZWRcIiB9OyB9XHJcbmZuLk1ERVRFUk0gPSBmdW5jdGlvbigpIHsgdGhyb3cgeyBNZXNzYWdlOiBcIk5vdCBJbXBsZW1lbnRlZFwiIH07IH1cclxuZm4uTUlOVkVSU0UgPSBmdW5jdGlvbigpIHsgdGhyb3cgeyBNZXNzYWdlOiBcIk5vdCBJbXBsZW1lbnRlZFwiIH07IH1cclxuZm4uTU1VTFQgPSBmdW5jdGlvbigpIHsgdGhyb3cgeyBNZXNzYWdlOiBcIk5vdCBJbXBsZW1lbnRlZFwiIH07IH1cclxuZm4uTVJPVU5EID0gZnVuY3Rpb24oKSB7IHRocm93IHsgTWVzc2FnZTogXCJOb3QgSW1wbGVtZW50ZWRcIiB9OyB9XHJcbmZuLk1VTFRJTk9NSUFMID0gZnVuY3Rpb24oKSB7IHRocm93IHsgTWVzc2FnZTogXCJOb3QgSW1wbGVtZW50ZWRcIiB9OyB9XHJcbmZuLlBST0RVQ1QgPSBmdW5jdGlvbigpIHsgdGhyb3cgeyBNZXNzYWdlOiBcIk5vdCBJbXBsZW1lbnRlZFwiIH07IH1cclxuZm4uUVVPVElFTlQgPSBmdW5jdGlvbigpIHsgdGhyb3cgeyBNZXNzYWdlOiBcIk5vdCBJbXBsZW1lbnRlZFwiIH07IH1cclxuZm4uU1FSVFBJID0gZnVuY3Rpb24oKSB7IHRocm93IHsgTWVzc2FnZTogXCJOb3QgSW1wbGVtZW50ZWRcIiB9OyB9XHJcbmZuLlNVQlRPVEFMID0gZnVuY3Rpb24oKSB7IHRocm93IHsgTWVzc2FnZTogXCJOb3QgSW1wbGVtZW50ZWRcIiB9OyB9XHJcbmZuLlNJTkggPSBmdW5jdGlvbigpIHsgdGhyb3cgeyBNZXNzYWdlOiBcIk5vdCBJbXBsZW1lbnRlZFwiIH07IH1cclxuZm4uU0VSSUVTU1VNID0gZnVuY3Rpb24oKSB7IHRocm93IHsgTWVzc2FnZTogXCJOb3QgSW1wbGVtZW50ZWRcIiB9OyB9XHJcbmZuLlRBTkggPSBmdW5jdGlvbigpIHsgdGhyb3cgeyBNZXNzYWdlOiBcIk5vdCBJbXBsZW1lbnRlZFwiIH07IH0iLCJcblxuXCJ1c2Ugc3RyaWN0XCJcbjtcblxudmFyIF9NRVNTQUdFX09GX05VTExfUkVGRVJFTkNFUyAgICAgICAgID0gZnVuY3Rpb24oYXJnTmFtZSkgeyByZXR1cm4gYXJnTmFtZSArIFwiIGlzIG51bGwgKGEpIHJlZmVyZW5jZXMuXCI7IH07XG52YXIgX01FU1NBR0VfT0ZfTlVMTF9BUkdVTUVOVFMgICAgICAgICAgPSBmdW5jdGlvbihhcmdOYW1lKSB7IHJldHVybiBhcmdOYW1lICsgXCIgaXMgbnVsbCAoYW4pIGFyZ3VtZW50c1wiOyB9O1xudmFyIF9NRVNTQUdFX09GX0lOVkFMSURfQVJHVU1FTlRTICAgICAgID0gZnVuY3Rpb24oYXJnTmFtZSwgbmVlZHNUeXBlKSB7IHJldHVybiBhcmdOYW1lICsgXCIgaXMgKGFuKSBpbnZhbGlkIGFyZ3VtZW50cy5cIiArICggIW5lZWRzVHlwZSA/IFwiSXQncyBoYXZlIHRvIFwiICsgbmVlZHNUeXBlIDogXCJcIik7IH07XG52YXIgX01FU1NBR0VfT0ZfTk9UX1NVUFBPUlRfQVJHVU1FTlRTXHQ9IGZ1bmN0aW9uKGFyZ05hbWUsIGFyZ09iamVjdCkgeyByZXR1cm4gIHR5cGVvZiBhcmdPYmplY3QgKyBcIiB0eXBlIG9mIFwiICsgYXJnTmFtZSArIFwiIGFyZ3VtZW50IGlzIG5vdCBzdXBwb3J0XCI7IH07XG5cblxudmFyIGZvcmVhY2ggPSBmb3JlYWNoIHx8IHtcblxuICAgIFwiY29udGludWVcIjogdHJ1ZSxcbiAgICBcImJyZWFrXCIgICA6IGZhbHNlXG5cbn07XG5cbnZhciBjb21wYXJlciA9IGNvbXBhcmVyIHx8IHtcbiAgICBfYXNjZW5kaW5nICA6IGZ1bmN0aW9uKGEsIGIpIHsgcmV0dXJuIGEgLSBiIH0sXG4gICAgYXNjZW5kaW5nICAgOiB0aGlzLl9hc2NlbmRpbmcsXG4gICAgYXNjICAgICAgICAgOiB0aGlzLmFzY2VuZGluZyxcbiAgICBfZGVzY2VuZGluZyA6IGZ1bmN0aW9uKGEsIGIpIHsgcmV0dXJuIGIgLSBhIH0sXG4gICAgZGVzY2VuZGluZyAgOiB0aGlzLl9kZXNjZW5kaW5nLFxuICAgIGRlc2MgICAgICAgIDogdGhpcy5kZXNjZW5kaW5nXG59O1xuXG5cbmZ1bmN0aW9uIGlzRnVuY3Rpb24oIGZuICkge1xuICAgIHJldHVybiB0eXBlb2YgZm4gPT09ICdmdW5jdGlvbic7XG59XG5cbmZ1bmN0aW9uIGlzQXJyYXkoIG9iaiApIHtcbiAgICByZXR1cm4gdHlwZW9mIG9iaiA9PT0gXCJvYmplY3RcIiAmJiBvYmogaW5zdGFuY2VvZiBBcnJheTtcbn1cblxuXG5mdW5jdGlvbiBpc09iamVjdCggb2JqICkge1xuICAgIHJldHVybiB0eXBlb2Ygb2JqID09PSBcIm9iamVjdFwiICYmIChpc0FycmF5KG9iaikgPT09IGZhbHNlICk7XG59XG5cbmZ1bmN0aW9uIGlzTnVtYmVyKCBvYmogKSB7XG4gICAgcmV0dXJuIHR5cGVvZiBvYmogPT09IFwibnVtYmVyXCIgfHwgb2JqIGluc3RhbmNlb2YgTnVtYmVyO1xufVxuXG5mdW5jdGlvbiBpc1N0cmluZyggb2JqICkge1xuICAgIHJldHVybiB0eXBlb2Ygb2JqID09PSBcInN0cmluZ1wiIHx8IG9iaiBpbnN0YW5jZW9mIFN0cmluZztcbn1cblxuZnVuY3Rpb24gaXNCb29sZWFuKCBvYmogKSB7XG4gICAgcmV0dXJuIHR5cGVvZiBvYmogPT09IFwiYm9vbGVhblwiO1xufVxuXG5mdW5jdGlvbiBpc0NvbnRhaW5zKCBzb3VyY2UsIG9iamVjdCApIHtcblxuXHRpZiggYXJndW1lbnRzLmxlbmd0aCA9PT0gMCApXHRcdHRocm93IFwic2Vjb25kIGFyZ3VtZW50IG5lZWRzIGFuIGFycmF5XCI7XG5cdGlmKCAhc291cmNlIClcdFx0XHRcdFx0XHR0aHJvdyBfTUVTU0FHRV9PRl9OVUxMX0FSR1VNRU5UUyhcInNvdXJjZVwiKTtcblx0aWYoICFvYmplY3QgKVx0XHRcdFx0XHRcdHRocm93IF9NRVNTQUdFX09GX05VTExfQVJHVU1FTlRTKFwib2JqZWN0XCIpO1xuXG5cdGlmKCBzb3VyY2UuaXNTdHJpbmcoKSApIHtcblx0XHRyZXR1cm4gc291cmNlLmluZGV4T2Yob2JqZWN0KSA+PSAwO1xuXHR9IGVsc2UgaWYgKCBzb3VyY2UuaXNBcnJheSgpICkge1xuXHRcdGZvcih2YXIgaT0wOyBpPHNvdXJjZS5sZW5ndGg7IGkrKykge1xuXHRcdFx0aWYoIHNvdXJjZVtpXSA9PSBvYmplY3QgKSByZXR1cm4gdHJ1ZTtcblx0XHR9XG5cblx0XHRyZXR1cm4gZmFsc2U7XG5cdH1cblxuXHR0aHJvdyBfTUVTU0FHRV9PRl9OT1RfU1VQUE9SVF9BUkdVTUVOVFMoXCJzb3VyY2VcIiwgc291cmNlKTtcblxufVxuXG5mdW5jdGlvbiBfY2xvbmVPYmplY3QoIG9iaiApIHtcblxuICAgIGNvbnNvbGUuaW5mbyhvYmoudG9TdHJpbmcoKSArIFwiIGNsb25lZCB0eXBlID0gXCIgKyB0eXBlb2Ygb2JqKTtcblxuICAgIGlmKCBpc1N0cmluZyhvYmopIHx8IGlzTnVtYmVyKG9iaikgfHwgaXNCb29sZWFuKG9iaikpIHtcbiAgICAgICAgcmV0dXJuIG9iai5jb25zdHJ1Y3RvcihvYmopO1xuICAgIH1cblxuICAgIGlmKCBpc0FycmF5KG9iaikpIHtcbiAgICAgICAgcmV0dXJuIEFycmF5LmNsb25lKG9iaik7XG4gICAgfVxuXG4gICAgdmFyIHByb3AgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyhvYmopO1xuICAgIGlmKCBwcm9wICYmIHByb3AubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHJldHVybiBuZXcgT2JqZWN0KG9iaik7XG4gICAgfVxuICAgIHZhciBuZXdPYmogPSB7fTtcbiAgICBmb3IodmFyIGk9MDsgaTxwcm9wLmxlbmd0aDsgaSsrKSB7XG5cbiAgICAgICAgdmFyIGl0ZW0gPSBvYmpbcHJvcFsgaSBdXTtcblxuICAgICAgICBpZiggaXNPYmplY3QoaXRlbSkgKSB7XG4gICAgICAgICAgICBfY2xvbmVPYmplY3QoaXRlbSk7XG4gICAgICAgIH1cblxuICAgICAgICBuZXdPYmpbIHByb3BbaV0gXSA9IGl0ZW07XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ld09iajtcblxufTtcblxuZnVuY3Rpb24gcHJpbnQoIG9iaiApIHtcblxuICAgIGlmKCBpc1N0cmluZyhvYmopIHx8IGlzTnVtYmVyKG9iaikgfHwgaXNCb29sZWFuKG9iaikpIHtcbiAgICAgICAgY29uc29sZS5pbmZvKFwicHJpbnQgOiAgICAgIFwiICsgb2JqKTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgICAgICB2YXIgcHJvcCA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKG9iaik7XG4gICAgICAgIGlmKCBwcm9wICYmIHByb3AubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgZm9yKHZhciBpPTA7IGk8cHJvcC5sZW5ndGg7IGkrKykge1xuXG4gICAgICAgICAgICBjb25zb2xlLmluZm8oXCJwcmludCA6IFwiICsgcHJvcFtpXSk7XG5cbiAgICAgICAgICAgIHZhciBpdGVtID0gb2JqW3Byb3BbIGkgXV07XG5cbiAgICAgICAgICAgICAgICBwcmludChpdGVtKTtcbiAgICAgICAgfVxufVxuXG5cbi8vIE9iamVjdC5jbG9uZSA9IGZ1bmN0aW9uKG9iaikge1xuLy8gICAgIHJldHVybiBfY2xvbmVPYmplY3Qob2JqKTtcbi8vIH07XG5cblxuLy8gT2JqZWN0LnByb3RvdHlwZS5pc0Z1bmN0aW9uID0gZnVuY3Rpb24oKSB7XG4vLyAgICAgcmV0dXJuIGlzRnVuY3Rpb24odGhpcyk7XG4vLyB9O1xuXG4vLyBPYmplY3QucHJvdG90eXBlLmlzQXJyYXkgPSBmdW5jdGlvbigpIHtcbi8vICAgICByZXR1cm4gaXNBcnJheSh0aGlzKTtcbi8vIH07XG5cbi8vIE9iamVjdC5wcm90b3R5cGUuaXNPYmplY3QgPSBmdW5jdGlvbigpIHtcbi8vICAgICByZXR1cm4gaXNPYmplY3QodGhpcyk7XG4vLyB9O1xuXG4vLyBPYmplY3QucHJvdG90eXBlLmlzTnVtYmVyID0gZnVuY3Rpb24oKSB7XG4vLyAgICAgcmV0dXJuIGlzTnVtYmVyKHRoaXMpO1xuLy8gfTtcblxuLy8gT2JqZWN0LnByb3RvdHlwZS5pc1N0cmluZyA9IGZ1bmN0aW9uKCkge1xuLy8gICAgIHJldHVybiBpc1N0cmluZyh0aGlzKTtcbi8vIH07XG5cbi8vIE9iamVjdC5wcm90b3R5cGUuZXF1YWxzID0gZnVuY3Rpb24oIGRlc3RpbmF0aW9uICkge1xuXG4vLyBcdGlmKCBpc0FycmF5KHRoaXMpICYmIGRlc3RpbmF0aW9uLmlzQXJyYXkoKSApIHJldHVybiAhKHRoaXMgPiBkZXN0aW5hdGlvbiB8fCB0aGlzIDwgZGVzdGluYXRpb24pO1xuLy8gXHRlbHNlIGlmKCBpc09iamVjdCh0aGlzKSkge1xuLy8gXHRcdHJldHVybiB0aGlzID09IGRlc3RpbmF0aW9uO1xuLy8gXHR9XG5cbi8vIFx0cmV0dXJuIHRoaXMgPT0gZGVzdGluYXRpb247XG5cbi8vIH07XG5cblxuQXJyYXkuY2xvbmUgPSBmdW5jdGlvbiggYXJyYXkgKSB7XG5cbiAgICBhcnJheSAgID0gKGFycmF5ICYmIGFycmF5LmlzQXJyYXkoKSkgPyBhcnJheSA6IFsgYXJyYXkgXTtcblxuICAgIHZhciBhcnIgPSBbXTtcbiAgICBmb3IodmFyIGk9MDsgaTxhcnJheS5sZW5ndGg7IGkrKykge1xuICAgICAgICBhcnIucHVzaCggT2JqZWN0LmNsb25lKGFycmF5WyBpIF0pICk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGFycjtcbn07XG5cbkFycmF5LnByb3RvdHlwZS5mb3JlYWNoID0gZnVuY3Rpb24oZm4sIGFyZ3MpIHtcblxuICAgIGlmKCB0aGlzLmlzQXJyYXkoKSlcbiAgICB7XG4gICAgICAgIGlmKGZuLmlzRnVuY3Rpb24oKSkge1xuXG4gICAgICAgICAgICB2YXIgbnVtLCBvYmosIHBhcmFtO1xuICAgICAgICAgICAgZm9yKHZhciBpPTA7aTx0aGlzLmxlbmd0aDtpKyspIHtcblxuICAgICAgICAgICAgICAgIG51bSAgICAgPSBpO1xuICAgICAgICAgICAgICAgIG9iaiAgICAgPSB0aGlzW2ldO1xuICAgICAgICAgICAgICAgIHBhcmFtICAgPSBhcmdzO1xuXG4gICAgICAgICAgICAgICAgaWYoIGZuLmxlbmd0aCA9PT0gMSApIG51bSA9IG9iajtcblxuICAgICAgICAgICAgICAgIHZhciBpc0NvbnRpbnVlID0gZm4uYXBwbHkodGhpcywgWyBudW0sIHRoaXNbaV0sIGFyZ3MgXSk7XG5cbiAgICAgICAgICAgICAgICBpZiAoIGlzQ29udGludWUgPT09IGZhbHNlICkgYnJlYWs7XG5cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn07XG5cblxuQXJyYXkucHJvdG90eXBlLmFueSA9IGZ1bmN0aW9uKCBwcmVkaWNhdGUgKSB7XG5cblxuICAgIGlmKCBwcmVkaWNhdGUgJiYgcHJlZGljYXRlLmlzRnVuY3Rpb24oKSkge1xuICAgICAgICBmb3IgKHZhciBpID0gMCwgaXRlbTsgaXRlbSA9IHRoaXNbaV07IGkrKylcbiAgICAgICAge1xuICAgICAgICAgICAgaWYgKHByZWRpY2F0ZShpdGVtKSkgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBpZiggdGhpcy5sZW5ndGggPiAwICkgcmV0dXJuIHRydWU7XG4gICAgfVxuXG59O1xuXG5cbkFycmF5LnByb3RvdHlwZS5maXJzdCA9IGZ1bmN0aW9uKCBwcmVkaWNhdGUgKVxue1xuICAgIGlmICggcHJlZGljYXRlICYmIHByZWRpY2F0ZS5pc0Z1bmN0aW9uKCkpIHtcblxuICAgICAgICBmb3IodmFyIGk9MDtpPHRoaXMubGVuZ3RoO2krKykge1xuICAgICAgICAgICAgaWYocHJlZGljYXRlKHRoaXNbaV0pKSByZXR1cm4gdGhpc1tpXTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRocm93IF9NRVNTQUdFX09GX05VTExfUkVGRVJFTkNFUyhcIm5vIHByZWRpY2F0ZVwiKVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgdmFyIHJldCA9IHRoaXMubGVuZ3RoID4gMCA/IHRoaXNbMF0gOiBudWxsO1xuICAgICAgICBpZiggcmV0ID09PSBudWxsICkgdGhyb3cgX01FU1NBR0VfT0ZfTlVMTF9SRUZFUkVOQ0VTKFwicmV0XCIpO1xuXG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgfVxufTtcblxuXG5BcnJheS5wcm90b3R5cGUuZmlyc3RPckRlZmF1bHQgPSBmdW5jdGlvbiggcHJlZGljYXRlICkge1xuICAgIGlmICggcHJlZGljYXRlICYmIHByZWRpY2F0ZS5pc0Z1bmN0aW9uKCkpIHtcblxuICAgICAgICBmb3IodmFyIGk9MDtpPHRoaXMubGVuZ3RoO2krKykge1xuICAgICAgICAgICAgaWYocHJlZGljYXRlKHRoaXNbaV0pKSByZXR1cm4gdGhpc1tpXTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubGVuZ3RoID4gMCA/IHRoaXNbMF0gOiBudWxsO1xuICAgIH1cbn07XG5cbkFycmF5LnByb3RvdHlwZS5maXJzdE9yTmV3ID0gZnVuY3Rpb24gKCBwcmVkaWNhdGUgKSB7XG4gICAgdmFyIGZpcnN0ID0gdGhpcy5maXJzdE9yRGVmYXVsdChwcmVkaWNhdGUpO1xuXG4gICAgcmV0dXJuIGZpcnN0IHx8IFtdO1xufTtcblxuXG5BcnJheS5wcm90b3R5cGUubGFzdE9yRGVmYXVsdCA9IGZ1bmN0aW9uKCBwcmVkaWNhdGUgKSB7XG4gICAgaWYgKCBwcmVkaWNhdGUgJiYgcHJlZGljYXRlLmlzRnVuY3Rpb24oKSkge1xuXG4gICAgICAgIGZvcih2YXIgaT10aGlzLmxlbmd0aC0xO2k+PTA7aS0tKSB7XG4gICAgICAgICAgICBpZihwcmVkaWNhdGUodGhpc1tpXSkpIHJldHVybiB0aGlzW2ldO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICB2YXIgcmV0ID0gdGhpcy5sZW5ndGggPiAwID8gdGhpc1t0aGlzLmxlbmd0aC0xXSA6IG51bGw7XG4gICAgICAgIGlmKCByZXQgPT09IG51bGwgKSByZXR1cm4gbnVsbDtcblxuICAgICAgICByZXR1cm4gcmV0O1xuICAgfVxufTtcblxuQXJyYXkucHJvdG90eXBlLmxhc3RPck5ldyA9IGZ1bmN0aW9uKCBwcmVkaWNhdGUgKSB7XG4gICAgdmFyIGxhc3QgPSB0aGlzLmxhc3RPckRlZmF1bHQocHJlZGljYXRlKTtcblxuICAgIHJldHVybiBsYXN0IHx8IFtdO1xufTtcblxuQXJyYXkucHJvdG90eXBlLmxhc3QgPSBmdW5jdGlvbiggcHJlZGljYXRlICkge1xuICAgIHZhciBsYXN0ID0gdGhpcy5sYXN0T3JEZWZhdWx0KHByZWRpY2F0ZSk7XG4gICAgcmV0dXJuIGxhc3Q7XG59O1xuXG5cblxuQXJyYXkucHJvdG90eXBlLnNlbGVjdCA9IGZ1bmN0aW9uKCBzZWxlY3RvciApIHtcbiAgICBpZiggc2VsZWN0b3IgJiYgc2VsZWN0b3IuaXNGdW5jdGlvbigpKSB7XG4gICAgICAgIHZhciBhcnIgPSBbXTtcbiAgICAgICAgZm9yKHZhciBpPTA7IGk8dGhpcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgYXJyLnB1c2goIHNlbGVjdG9yKHRoaXNbaV0pICk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gYXJyO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICB9XG59O1xuXG5BcnJheS5wcm90b3R5cGUud2hlcmUgPSBmdW5jdGlvbiggc2VsZWN0b3IgKSB7XG4gICAgdmFyIGFyciA9IFtdLCBpO1xuICAgIGlmKCBzZWxlY3RvciAmJiBzZWxlY3Rvci5pc0Z1bmN0aW9uKCkpIHtcbiAgICAgICAgZm9yKGk9MDsgaTx0aGlzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZiggc2VsZWN0b3IodGhpc1tpXSkpIHtcbiAgICAgICAgICAgICAgICBhcnIucHVzaCh0aGlzW2ldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBhcnI7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgZm9yKGk9MDsgaTx0aGlzLmxlbmd0aDsgaSsrICkge1xuICAgICAgICAgICAgaWYoIHRoaXNbaV0gPT0gc2VsZWN0b3IgKSB7XG4gICAgICAgICAgICAgICAgYXJyLnB1c2godGhpc1tpXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gYXJyO1xuICAgIH1cbn07XG5cblxuXG5BcnJheS5wcm90b3R5cGUub3JkZXJCeSA9IGZ1bmN0aW9uKCBfY29tcGFyZXIgKSB7XG5cbiAgICBfY29tcGFyZXIgPSBfY29tcGFyZXIgfHwgY29tcGFyZXIuYXNjZW5kaW5nO1xuXG4gICAgcmV0dXJuIHRoaXMuc29ydChfY29tcGFyZXIpO1xufTtcblxuXG5BcnJheS5wcm90b3R5cGUudGFrZSA9IGZ1bmN0aW9uKCBudW1iZXIgKSB7XG5cbiAgICBpZiggYXJndW1lbnRzLmxlbmd0aCA9PT0gMCApIG51bWJlciA9IDA7XG5cbiAgICBpZiggbnVtYmVyICYmIG51bWJlci5pc051bWJlcigpKSB7XG4gICAgICAgIG51bWJlciA9IG51bWJlciA+IHRoaXMubGVuZ3RoID8gdGhpcy5sZW5ndGggOiBudW1iZXI7XG5cbiAgICAgICAgdmFyIGFyciA9IFtdO1xuICAgICAgICBmb3IodmFyIGk9MDsgaTxudW1iZXI7IGkrKykge1xuICAgICAgICAgICAgYXJyLnB1c2goIHRoaXNbaV0gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBhcnI7XG4gICAgfVxufTtcblxuQXJyYXkucHJvdG90eXBlLnNraXAgPSBmdW5jdGlvbiggbnVtYmVyICkge1xuXG4gICAgaWYoIGFyZ3VtZW50cy5sZW5ndGggPT09IDAgKSBudW1iZXIgPSAwO1xuXG4gICAgaWYoIG51bWJlciAmJiBudW1iZXIuaXNOdW1iZXIoKSkge1xuICAgICAgICBudW1iZXIgPSBudW1iZXIgPiB0aGlzLmxlbmd0aCA/IHRoaXMubGVuZ3RoIDogbnVtYmVyO1xuXG4gICAgICAgIHZhciBhcnIgPSBbXTtcbiAgICAgICAgZm9yKHZhciBpPW51bWJlcjsgaTx0aGlzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBhcnIucHVzaCggdGhpc1tpXSApO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGFycjtcbiAgICB9XG5cbn1cblxuQXJyYXkucHJvdG90eXBlLnN1bSA9IGZ1bmN0aW9uKCBzZWxlY3RvciApIHtcblxuICAgIHZhciBzdW0gPSAwLCBpO1xuICAgIGlmKCBzZWxlY3RvciAmJiBzZWxlY3Rvci5pc0Z1bmN0aW9uKCkpIHtcblxuICAgICAgICBmb3IoaT0wOyBpPHRoaXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHN1bSArPSBzZWxlY3RvciggdGhpc1tpXSApO1xuICAgICAgICB9XG5cbiAgICB9IGVsc2Uge1xuXG4gICAgICAgIGZvcihpPTA7IGk8dGhpcy5sZW5ndGg7IGkrKykge1xuXG4gICAgICAgICAgICB2YXIgY3VycmVudCA9IHRoaXNbaV07XG5cbiAgICAgICAgICAgIGlmKCBjdXJyZW50LmlzTnVtYmVyKCkpIHtcbiAgICAgICAgICAgICAgICBzdW0gKz0gY3VycmVudDtcbiAgICAgICAgICAgIH0gZWxzZSBpZiggY3VycmVudC5pc1N0cmluZygpKSB7XG5cbiAgICAgICAgICAgICAgICBpZiggY3VycmVudC5pbmRleE9mKFwiLlwiKSA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgc3VtICs9IHBhcnNlRmxvYXQoY3VycmVudCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBzdW0gKz0gcGFyc2VJbnQoY3VycmVudCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHN1bTtcbn07XG5cbkFycmF5LnByb3RvdHlwZS5hdmVyYWdlID0gZnVuY3Rpb24oIHNlbGVjdG9yICkge1xuXG4gICAgaWYoIHRoaXMubGVuZ3RoID09PSAwICkgcmV0dXJuIDA7XG5cbiAgICB2YXIgc3VtID0gdGhpcy5zdW0oc2VsZWN0b3IpO1xuICAgIHJldHVybiBzdW0gLyB0aGlzLmxlbmd0aDtcbn07XG5cbkFycmF5LnByb3RvdHlwZS5tYXggPSBmdW5jdGlvbiggcHJlZGljYXRlICkge1xuXG4gICAgdmFyIG1heCwgaTtcblxuICAgIGlmKCB0aGlzLmxlbmd0aCA9PT0gMCApIG1heCA9IG51bGw7XG4gICAgaWYoIHRoaXMubGVuZ3RoID4gMCApIG1heCA9IHRoaXNbMF07XG5cbiAgICBpZiggcHJlZGljYXRlICYmIHByZWRpY2F0ZS5pc0Z1bmN0aW9uKCkgKSB7XG5cbiAgICAgICAgZm9yKGk9MDsgaTx0aGlzLmxlbmd0aDsgaSsrICkge1xuICAgICAgICAgICAgdmFyIHByZWQgPSBwcmVkaWNhdGUodGhpc1tpXSk7XG4gICAgICAgICAgICBpZiggcHJlZCAmJiBtYXggPCB0aGlzW2ldICkge1xuICAgICAgICAgICAgICAgIG1heCA9IHRoaXNbaV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgIH0gZWxzZSB7XG5cbiAgICAgICAgZm9yKGk9MDsgaTx0aGlzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgZGVzdCA9IHRoaXNbaV07XG4gICAgICAgICAgICBpZiggbWF4IDwgZGVzdCApIHtcbiAgICAgICAgICAgICAgICBtYXggPSBkZXN0O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIG1heDtcbn1cblxuQXJyYXkucHJvdG90eXBlLm1pbiA9IGZ1bmN0aW9uKCBwcmVkaWNhdGUgKSB7XG4gICAgdmFyIG1pbiwgaTtcblxuICAgIGlmKCB0aGlzLmxlbmd0aCA9PT0gMCApIG1pbiA9IG51bGw7XG5cbiAgICBpZiggdGhpcy5sZW5ndGggPiAwICkgbWluID0gdGhpc1swXTtcblxuICAgIGlmKCBwcmVkaWNhdGUgJiYgcHJlZGljYXRlLmlzRnVuY3Rpb24oKSApIHtcblxuICAgICAgICBmb3IoaT0wOyBpPHRoaXMubGVuZ3RoOyBpKysgKSB7XG4gICAgICAgICAgICB2YXIgcHJlZCA9IHByZWRpY2F0ZSh0aGlzW2ldKTtcbiAgICAgICAgICAgIGlmKCBwcmVkICYmIG1pbiA+IHRoaXNbaV0gKSB7XG4gICAgICAgICAgICAgICAgbWluID0gdGhpc1tpXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgfSBlbHNlIHtcblxuICAgICAgICBmb3IoaT0wOyBpPHRoaXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBkZXN0ID0gdGhpc1tpXTtcbiAgICAgICAgICAgIGlmKCBtaW4gPiBkZXN0ICkge1xuICAgICAgICAgICAgICAgIG1pbiA9IGRlc3Q7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gbWluO1xufVxuXG5cbkFycmF5LnJhbmdlID0gZnVuY3Rpb24oIHN0YXJ0LCBtYXgsIHN0ZXAgKSB7XG5cbiAgICBpZiggYXJndW1lbnRzLmxlbmd0aCA9PT0gMCApICAgICAgICB0aHJvdyBcInJhbmdlIG1ldGhvZCBuZWVkcyBvbmUgb3IgbW9yZSBhcmd1bWVudHNcIlxuICAgIGlmKCBzdGFydCAmJiAhc3RhcnQuaXNOdW1iZXIoKSkgICAgIHRocm93IF9NRVNTQUdFX09GX0lOVkFMSURfQVJHVU1FTlRTKFwic3RhcnRcIiwgXCJOdW1iZXJcIik7XG4gICAgaWYoIG1heCAgICYmICFtYXguaXNOdW1iZXIoKSkgICAgICAgdGhyb3cgX01FU1NBR0VfT0ZfSU5WQUxJRF9BUkdVTUVOVFMoXCJtYXhcIiwgXCJOdW1iZXJcIik7XG4gICAgaWYoIHN0ZXAgICYmICFzdGVwLmlzTnVtYmVyKCkpICAgICAgdGhyb3cgX01FU1NBR0VfT0ZfSU5WQUxJRF9BUkdVTUVOVFMoXCJzdGVwXCIsIFwiTnVtYmVyXCIpO1xuXG5cbiAgICB2YXIgYXJyID0gW107XG4gICAgX3JhbmdlKGFyciwgc3RhcnQsIG1heCwgc3RlcCk7XG5cbiAgICByZXR1cm4gYXJyO1xufTtcblxuXG5mdW5jdGlvbiBfcmFuZ2UoIGFyciwgc3RhcnQsIG1heCwgc3RlcCApIHtcbiAgICBzdGVwID0gc3RlcCB8fCAxO1xuXG4gICAgaWYoICFhcnIgfHwgIWFyci5pc0FycmF5KCkgKSB0aHJvdyBfTUVTU0FHRV9PRl9OVUxMX0FSR1VNRU5UUyhcImFyclwiKTtcbiAgICBpZiggIW1heCApIHtcbiAgICAgICAgbWF4ICAgICA9IHN0YXJ0O1xuICAgICAgICBzdGFydCAgID0gMDtcbiAgICB9XG5cbiAgICBpZiggc3RhcnQgPj0gbWF4ICkgcmV0dXJuO1xuXG4gICAgZm9yKHZhciBpPXN0YXJ0OyBpPG1heDsgaSs9IHN0ZXApIHtcbiAgICAgICAgYXJyLnB1c2goIGkgKTtcbiAgICB9XG59XG5cblxuQXJyYXkucHJvdG90eXBlLnJhbmdlID0gZnVuY3Rpb24oIHN0YXJ0LCBtYXgsIHN0ZXAgKSB7XG5cbiAgICBpZiggYXJndW1lbnRzLmxlbmd0aCA9PT0gMCApICAgICAgICB0aHJvdyBcInJhbmdlIG1ldGhvZCBuZWVkcyBvbmUgb3IgbW9yZSBhcmd1bWVudHNcIjtcbiAgICBpZiggc3RhcnQgJiYgIXN0YXJ0LmlzTnVtYmVyKCkpICAgICB0aHJvdyBfTUVTU0FHRV9PRl9JTlZBTElEX0FSR1VNRU5UUyhcInN0YXJ0XCIsIFwiTnVtYmVyXCIpO1xuICAgIGlmKCBtYXggICAmJiAhbWF4LmlzTnVtYmVyKCkpICAgICAgIHRocm93IF9NRVNTQUdFX09GX0lOVkFMSURfQVJHVU1FTlRTKFwibWF4XCIsIFwiTnVtYmVyXCIpO1xuICAgIGlmKCBzdGVwICAmJiAhc3RlcC5pc051bWJlcigpKSAgICAgIHRocm93IF9NRVNTQUdFX09GX0lOVkFMSURfQVJHVU1FTlRTKFwic3RlcFwiLCBcIk51bWJlclwiKTtcblxuICAgIF9yYW5nZSh0aGlzLCBzdGFydCwgbWF4LCBzdGVwKTtcblxuICAgIHJldHVybiB0aGlzO1xufTtcblxuXG5mdW5jdGlvbiBfdW5pb24oIGZpcnN0LCBzZWNvbmQgKSB7XG5cbiAgICB2YXIgaTtcblxuXHRpZiAoYXJndW1lbnRzLmxlbmd0aCA8IDEpICAgICAgIHRocm93IFwic2Vjb25kIGFyZ3VtZW50IG5lZWRzIGFuIGFycmF5XCI7XG5cbiAgICBmaXJzdCAgPSAoZmlyc3QgICYmIGZpcnN0LmlzQXJyYXkoKSkgICAgPyBmaXJzdCA6IFsgZmlyc3QgXTtcblx0dmFyIGFyciA9IEFycmF5LmNsb25lKGZpcnN0KTtcblxuXHRmb3IoaT0xOyBpPGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuXHRcdHNlY29uZCA9IGFyZ3VtZW50c1tpXTtcblx0XHRpZiggIXNlY29uZCApIGNvbnRpbnVlO1xuXG5cdFx0c2Vjb25kID0gKHNlY29uZCAmJiBzZWNvbmQuaXNBcnJheSgpKSAgID8gc2Vjb25kIDogWyBzZWNvbmQgXTtcblxuXHRcdGZvcihpPTA7IGk8c2Vjb25kLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRhcnIucHVzaCggT2JqZWN0LmNsb25lKHNlY29uZFsgaSBdKSApO1xuXHQgICAgfVxuXHR9XG5cblx0cmV0dXJuIGFycjtcbn1cblxuXG5PYmplY3QudW5pb24gPSBfdW5pb247XG5cbkFycmF5LnVuaW9uID0gX3VuaW9uO1xuXG5BcnJheS5wcm90b3R5cGUudW5pb24gPSBBcnJheS5wcm90b3R5cGUudW5pb24gfHwgZnVuY3Rpb24oIHNlY29uZCApIHtcblxuICAgIGlmKCBhcmd1bWVudHMubGVuZ3RoID09PSAwICkgICAgICAgIHRocm93IFwic2Vjb25kIGFyZ3VtZW50IG5lZWRzIGFuIGFycmF5XCI7XG4gICAgaWYoIHNlY29uZCAmJiAhc2Vjb25kLmlzQXJyYXkoKSkgICAgdGhyb3cgX01FU1NBR0VfT0ZfSU5WQUxJRF9BUkdVTUVOVFMoXCJzZWNvbmRcIiwgXCJBcnJheVwiKTtcblxuXHRyZXR1cm4gX3VuaW9uLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG59O1xuXG5cblxuQXJyYXkuZGlzdGluY3QgPSBmdW5jdGlvbiggZmlyc3QsIHNlY29uZCApIHtcblxuXHR2YXIgYXJyID0gW107XG5cdGZvcih2YXIgaT0wOyBpPGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuXG5cdFx0aWYgKCFhcmd1bWVudHNbaV0gKSBcdFx0XHR0aHJvdyBfTUVTU0FHRV9PRl9OVUxMX0FSR1VNRU5UUyhpICsgXCIgaW5kZXggYXJndW1lbnRcIik7XG5cdFx0aWYgKCFhcmd1bWVudHNbaV0uaXNBcnJheSgpKVx0dGhyb3cgX01FU1NBR0VfT0ZfSU5WQUxJRF9BUkdVTUVOVFMoaSArIFwiIGluZGV4IGFyZ3VtZW50XCIsIFwiQXJyYXlcIik7XG5cdFx0aWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApXHRcdGNvbnRpbnVlO1xuXG5cdFx0Zm9yKHZhciB4PTA7IHg8YXJndW1lbnRzW2ldLmxlbmd0aDsgeCsrKSB7XG5cdFx0XHR2YXIgcGlja3VwID0gYXJndW1lbnRzW2ldW3hdO1xuXHRcdFx0aWYoICFpc0NvbnRhaW5zKGFyciwgcGlja3VwKSkgYXJyLnB1c2gocGlja3VwKTtcblx0XHR9XG5cdH1cblxuXHRyZXR1cm4gYXJyO1xufTtcblxuQXJyYXkucHJvdG90eXBlLmRpc3RpbmN0ID0gQXJyYXkuZGlzdGluY3Q7XG5cblxuXG5mdW5jdGlvbiBfam9pbiggZmlyc3QsIHNlY29uZCwgcHJpbWFyeUtleSwgZm9yZWlnbktleSwgc2VsZWN0b3IgKSB7XG5cblx0aWYoICFmaXJzdCApXHRcdHRocm93IF9NRVNTQUdFX09GX05VTExfQVJHVU1FTlRTKFwiZmlyc3RcIik7XG5cdGlmKCAhc2Vjb25kICkgICAgICAgdGhyb3cgX01FU1NBR0VfT0ZfTlVMTF9BUkdVTUVOVFMoXCJzZWNvbmRcIik7XG5cblx0aWYoICFmaXJzdC5pc0FycmF5KCkgKVx0XHRcdHRocm93IF9NRVNTQUdFX09GX05PVF9TVVBQT1JUX0FSR1VNRU5UUyhcImZpcnN0XCIsIGZpcnN0KTtcblx0aWYoICFzZWNvbmQuaXNBcnJheSgpIClcdFx0XHR0aHJvdyBfTUVTU0FHRV9PRl9OT1RfU1VQUE9SVF9BUkdVTUVOVFMoXCJzZWNvbmRcIiwgc2Vjb25kKTtcblxuXHR2YXIgYXJyID0gW107XG5cdHByaW1hcnlLZXkgPSBwcmltYXJ5S2V5IHx8IGZ1bmN0aW9uKGEpIHsgcmV0dXJuIGE7IH07XG5cdGZvcmVpZ25LZXkgPSBmb3JlaWduS2V5IHx8IGZ1bmN0aW9uKGIpIHsgcmV0dXJuIGI7IH07XG5cdHNlbGVjdG9yICAgPSBzZWxlY3RvciAgIHx8IGZ1bmN0aW9uKGEsYikgeyByZXR1cm4gYTsgfTtcblxuXHRmb3IodmFyIGw9MDsgbDxmaXJzdC5sZW5ndGg7IGwrKykge1xuXHRcdGZvcih2YXIgcj0wOyByPHNlY29uZC5sZW5ndGg7IHIrKykge1xuXG5cdFx0XHR2YXIgYXJncyA9IFsgZmlyc3RbbF0sIHNlY29uZFtyXSBdO1xuXHRcdFx0dmFyIGEgXHQgPSBwcmltYXJ5S2V5KGZpcnN0W2xdKTtcblx0XHRcdHZhciBiIFx0ID0gZm9yZWlnbktleShzZWNvbmRbcl0pO1xuXG5cdFx0XHR2YXIgaXNNYXRjaCA9IGEgPT09IGI7XG5cdFx0XHRpZiggaXNNYXRjaCAhPT0gdW5kZWZpbmVkICYmIGlzTWF0Y2ggKSB7XG5cdFx0XHRcdHZhciByZXN1bHQgPSBzZWxlY3Rvci5hcHBseSh0aGlzLCBhcmdzKTtcblx0XHRcdFx0YXJyLnB1c2gocmVzdWx0KTtcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRyZXR1cm4gYXJyO1xufVxuXG5BcnJheS5pbm5lckpvaW4gPSBBcnJheS5pbm5lckpvaW4gfHwgX2pvaW47XG5cbkFycmF5LnByb3RvdHlwZS5pbm5lckpvaW4gPSBBcnJheS5wcm90b3R5cGUuaW5uZXJKb2luIHx8IGZ1bmN0aW9uKCBkZXN0LCBwcmltYXJ5S2V5LCBmb3JlaWduS2V5LCBzZWxlY3RvciApIHtcblx0cmV0dXJuIF9qb2luKCB0aGlzLCBkZXN0LCBwcmltYXJ5S2V5LCBmb3JlaWduS2V5LCBzZWxlY3RvciApO1xufTtcblxuXG4iLCIvLyEgbW9tZW50LmpzXG4vLyEgdmVyc2lvbiA6IDIuMTQuMVxuLy8hIGF1dGhvcnMgOiBUaW0gV29vZCwgSXNrcmVuIENoZXJuZXYsIE1vbWVudC5qcyBjb250cmlidXRvcnNcbi8vISBsaWNlbnNlIDogTUlUXG4vLyEgbW9tZW50anMuY29tXG5cbjsoZnVuY3Rpb24gKGdsb2JhbCwgZmFjdG9yeSkge1xuICAgIHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyA/IG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeSgpIDpcbiAgICB0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQgPyBkZWZpbmUoZmFjdG9yeSkgOlxuICAgIGdsb2JhbC5tb21lbnQgPSBmYWN0b3J5KClcbn0odGhpcywgZnVuY3Rpb24gKCkgeyAndXNlIHN0cmljdCc7XG5cbiAgICB2YXIgaG9va0NhbGxiYWNrO1xuXG4gICAgZnVuY3Rpb24gdXRpbHNfaG9va3NfX2hvb2tzICgpIHtcbiAgICAgICAgcmV0dXJuIGhvb2tDYWxsYmFjay5hcHBseShudWxsLCBhcmd1bWVudHMpO1xuICAgIH1cblxuICAgIC8vIFRoaXMgaXMgZG9uZSB0byByZWdpc3RlciB0aGUgbWV0aG9kIGNhbGxlZCB3aXRoIG1vbWVudCgpXG4gICAgLy8gd2l0aG91dCBjcmVhdGluZyBjaXJjdWxhciBkZXBlbmRlbmNpZXMuXG4gICAgZnVuY3Rpb24gc2V0SG9va0NhbGxiYWNrIChjYWxsYmFjaykge1xuICAgICAgICBob29rQ2FsbGJhY2sgPSBjYWxsYmFjaztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBpc0FycmF5KGlucHV0KSB7XG4gICAgICAgIHJldHVybiBpbnB1dCBpbnN0YW5jZW9mIEFycmF5IHx8IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChpbnB1dCkgPT09ICdbb2JqZWN0IEFycmF5XSc7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaXNPYmplY3QoaW5wdXQpIHtcbiAgICAgICAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChpbnB1dCkgPT09ICdbb2JqZWN0IE9iamVjdF0nO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGlzT2JqZWN0RW1wdHkob2JqKSB7XG4gICAgICAgIHZhciBrO1xuICAgICAgICBmb3IgKGsgaW4gb2JqKSB7XG4gICAgICAgICAgICAvLyBldmVuIGlmIGl0cyBub3Qgb3duIHByb3BlcnR5IEknZCBzdGlsbCBjYWxsIGl0IG5vbi1lbXB0eVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGlzRGF0ZShpbnB1dCkge1xuICAgICAgICByZXR1cm4gaW5wdXQgaW5zdGFuY2VvZiBEYXRlIHx8IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChpbnB1dCkgPT09ICdbb2JqZWN0IERhdGVdJztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBtYXAoYXJyLCBmbikge1xuICAgICAgICB2YXIgcmVzID0gW10sIGk7XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBhcnIubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgIHJlcy5wdXNoKGZuKGFycltpXSwgaSkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXM7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaGFzT3duUHJvcChhLCBiKSB7XG4gICAgICAgIHJldHVybiBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoYSwgYik7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZXh0ZW5kKGEsIGIpIHtcbiAgICAgICAgZm9yICh2YXIgaSBpbiBiKSB7XG4gICAgICAgICAgICBpZiAoaGFzT3duUHJvcChiLCBpKSkge1xuICAgICAgICAgICAgICAgIGFbaV0gPSBiW2ldO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGhhc093blByb3AoYiwgJ3RvU3RyaW5nJykpIHtcbiAgICAgICAgICAgIGEudG9TdHJpbmcgPSBiLnRvU3RyaW5nO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGhhc093blByb3AoYiwgJ3ZhbHVlT2YnKSkge1xuICAgICAgICAgICAgYS52YWx1ZU9mID0gYi52YWx1ZU9mO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGE7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY3JlYXRlX3V0Y19fY3JlYXRlVVRDIChpbnB1dCwgZm9ybWF0LCBsb2NhbGUsIHN0cmljdCkge1xuICAgICAgICByZXR1cm4gY3JlYXRlTG9jYWxPclVUQyhpbnB1dCwgZm9ybWF0LCBsb2NhbGUsIHN0cmljdCwgdHJ1ZSkudXRjKCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZGVmYXVsdFBhcnNpbmdGbGFncygpIHtcbiAgICAgICAgLy8gV2UgbmVlZCB0byBkZWVwIGNsb25lIHRoaXMgb2JqZWN0LlxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgZW1wdHkgICAgICAgICAgIDogZmFsc2UsXG4gICAgICAgICAgICB1bnVzZWRUb2tlbnMgICAgOiBbXSxcbiAgICAgICAgICAgIHVudXNlZElucHV0ICAgICA6IFtdLFxuICAgICAgICAgICAgb3ZlcmZsb3cgICAgICAgIDogLTIsXG4gICAgICAgICAgICBjaGFyc0xlZnRPdmVyICAgOiAwLFxuICAgICAgICAgICAgbnVsbElucHV0ICAgICAgIDogZmFsc2UsXG4gICAgICAgICAgICBpbnZhbGlkTW9udGggICAgOiBudWxsLFxuICAgICAgICAgICAgaW52YWxpZEZvcm1hdCAgIDogZmFsc2UsXG4gICAgICAgICAgICB1c2VySW52YWxpZGF0ZWQgOiBmYWxzZSxcbiAgICAgICAgICAgIGlzbyAgICAgICAgICAgICA6IGZhbHNlLFxuICAgICAgICAgICAgcGFyc2VkRGF0ZVBhcnRzIDogW10sXG4gICAgICAgICAgICBtZXJpZGllbSAgICAgICAgOiBudWxsXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2V0UGFyc2luZ0ZsYWdzKG0pIHtcbiAgICAgICAgaWYgKG0uX3BmID09IG51bGwpIHtcbiAgICAgICAgICAgIG0uX3BmID0gZGVmYXVsdFBhcnNpbmdGbGFncygpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBtLl9wZjtcbiAgICB9XG5cbiAgICB2YXIgc29tZTtcbiAgICBpZiAoQXJyYXkucHJvdG90eXBlLnNvbWUpIHtcbiAgICAgICAgc29tZSA9IEFycmF5LnByb3RvdHlwZS5zb21lO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHNvbWUgPSBmdW5jdGlvbiAoZnVuKSB7XG4gICAgICAgICAgICB2YXIgdCA9IE9iamVjdCh0aGlzKTtcbiAgICAgICAgICAgIHZhciBsZW4gPSB0Lmxlbmd0aCA+Pj4gMDtcblxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgICAgICAgIGlmIChpIGluIHQgJiYgZnVuLmNhbGwodGhpcywgdFtpXSwgaSwgdCkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gdmFsaWRfX2lzVmFsaWQobSkge1xuICAgICAgICBpZiAobS5faXNWYWxpZCA9PSBudWxsKSB7XG4gICAgICAgICAgICB2YXIgZmxhZ3MgPSBnZXRQYXJzaW5nRmxhZ3MobSk7XG4gICAgICAgICAgICB2YXIgcGFyc2VkUGFydHMgPSBzb21lLmNhbGwoZmxhZ3MucGFyc2VkRGF0ZVBhcnRzLCBmdW5jdGlvbiAoaSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBpICE9IG51bGw7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIG0uX2lzVmFsaWQgPSAhaXNOYU4obS5fZC5nZXRUaW1lKCkpICYmXG4gICAgICAgICAgICAgICAgZmxhZ3Mub3ZlcmZsb3cgPCAwICYmXG4gICAgICAgICAgICAgICAgIWZsYWdzLmVtcHR5ICYmXG4gICAgICAgICAgICAgICAgIWZsYWdzLmludmFsaWRNb250aCAmJlxuICAgICAgICAgICAgICAgICFmbGFncy5pbnZhbGlkV2Vla2RheSAmJlxuICAgICAgICAgICAgICAgICFmbGFncy5udWxsSW5wdXQgJiZcbiAgICAgICAgICAgICAgICAhZmxhZ3MuaW52YWxpZEZvcm1hdCAmJlxuICAgICAgICAgICAgICAgICFmbGFncy51c2VySW52YWxpZGF0ZWQgJiZcbiAgICAgICAgICAgICAgICAoIWZsYWdzLm1lcmlkaWVtIHx8IChmbGFncy5tZXJpZGllbSAmJiBwYXJzZWRQYXJ0cykpO1xuXG4gICAgICAgICAgICBpZiAobS5fc3RyaWN0KSB7XG4gICAgICAgICAgICAgICAgbS5faXNWYWxpZCA9IG0uX2lzVmFsaWQgJiZcbiAgICAgICAgICAgICAgICAgICAgZmxhZ3MuY2hhcnNMZWZ0T3ZlciA9PT0gMCAmJlxuICAgICAgICAgICAgICAgICAgICBmbGFncy51bnVzZWRUb2tlbnMubGVuZ3RoID09PSAwICYmXG4gICAgICAgICAgICAgICAgICAgIGZsYWdzLmJpZ0hvdXIgPT09IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbS5faXNWYWxpZDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiB2YWxpZF9fY3JlYXRlSW52YWxpZCAoZmxhZ3MpIHtcbiAgICAgICAgdmFyIG0gPSBjcmVhdGVfdXRjX19jcmVhdGVVVEMoTmFOKTtcbiAgICAgICAgaWYgKGZsYWdzICE9IG51bGwpIHtcbiAgICAgICAgICAgIGV4dGVuZChnZXRQYXJzaW5nRmxhZ3MobSksIGZsYWdzKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGdldFBhcnNpbmdGbGFncyhtKS51c2VySW52YWxpZGF0ZWQgPSB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaXNVbmRlZmluZWQoaW5wdXQpIHtcbiAgICAgICAgcmV0dXJuIGlucHV0ID09PSB2b2lkIDA7XG4gICAgfVxuXG4gICAgLy8gUGx1Z2lucyB0aGF0IGFkZCBwcm9wZXJ0aWVzIHNob3VsZCBhbHNvIGFkZCB0aGUga2V5IGhlcmUgKG51bGwgdmFsdWUpLFxuICAgIC8vIHNvIHdlIGNhbiBwcm9wZXJseSBjbG9uZSBvdXJzZWx2ZXMuXG4gICAgdmFyIG1vbWVudFByb3BlcnRpZXMgPSB1dGlsc19ob29rc19faG9va3MubW9tZW50UHJvcGVydGllcyA9IFtdO1xuXG4gICAgZnVuY3Rpb24gY29weUNvbmZpZyh0bywgZnJvbSkge1xuICAgICAgICB2YXIgaSwgcHJvcCwgdmFsO1xuXG4gICAgICAgIGlmICghaXNVbmRlZmluZWQoZnJvbS5faXNBTW9tZW50T2JqZWN0KSkge1xuICAgICAgICAgICAgdG8uX2lzQU1vbWVudE9iamVjdCA9IGZyb20uX2lzQU1vbWVudE9iamVjdDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIWlzVW5kZWZpbmVkKGZyb20uX2kpKSB7XG4gICAgICAgICAgICB0by5faSA9IGZyb20uX2k7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFpc1VuZGVmaW5lZChmcm9tLl9mKSkge1xuICAgICAgICAgICAgdG8uX2YgPSBmcm9tLl9mO1xuICAgICAgICB9XG4gICAgICAgIGlmICghaXNVbmRlZmluZWQoZnJvbS5fbCkpIHtcbiAgICAgICAgICAgIHRvLl9sID0gZnJvbS5fbDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIWlzVW5kZWZpbmVkKGZyb20uX3N0cmljdCkpIHtcbiAgICAgICAgICAgIHRvLl9zdHJpY3QgPSBmcm9tLl9zdHJpY3Q7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFpc1VuZGVmaW5lZChmcm9tLl90em0pKSB7XG4gICAgICAgICAgICB0by5fdHptID0gZnJvbS5fdHptO1xuICAgICAgICB9XG4gICAgICAgIGlmICghaXNVbmRlZmluZWQoZnJvbS5faXNVVEMpKSB7XG4gICAgICAgICAgICB0by5faXNVVEMgPSBmcm9tLl9pc1VUQztcbiAgICAgICAgfVxuICAgICAgICBpZiAoIWlzVW5kZWZpbmVkKGZyb20uX29mZnNldCkpIHtcbiAgICAgICAgICAgIHRvLl9vZmZzZXQgPSBmcm9tLl9vZmZzZXQ7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFpc1VuZGVmaW5lZChmcm9tLl9wZikpIHtcbiAgICAgICAgICAgIHRvLl9wZiA9IGdldFBhcnNpbmdGbGFncyhmcm9tKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIWlzVW5kZWZpbmVkKGZyb20uX2xvY2FsZSkpIHtcbiAgICAgICAgICAgIHRvLl9sb2NhbGUgPSBmcm9tLl9sb2NhbGU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAobW9tZW50UHJvcGVydGllcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBmb3IgKGkgaW4gbW9tZW50UHJvcGVydGllcykge1xuICAgICAgICAgICAgICAgIHByb3AgPSBtb21lbnRQcm9wZXJ0aWVzW2ldO1xuICAgICAgICAgICAgICAgIHZhbCA9IGZyb21bcHJvcF07XG4gICAgICAgICAgICAgICAgaWYgKCFpc1VuZGVmaW5lZCh2YWwpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRvW3Byb3BdID0gdmFsO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0bztcbiAgICB9XG5cbiAgICB2YXIgdXBkYXRlSW5Qcm9ncmVzcyA9IGZhbHNlO1xuXG4gICAgLy8gTW9tZW50IHByb3RvdHlwZSBvYmplY3RcbiAgICBmdW5jdGlvbiBNb21lbnQoY29uZmlnKSB7XG4gICAgICAgIGNvcHlDb25maWcodGhpcywgY29uZmlnKTtcbiAgICAgICAgdGhpcy5fZCA9IG5ldyBEYXRlKGNvbmZpZy5fZCAhPSBudWxsID8gY29uZmlnLl9kLmdldFRpbWUoKSA6IE5hTik7XG4gICAgICAgIC8vIFByZXZlbnQgaW5maW5pdGUgbG9vcCBpbiBjYXNlIHVwZGF0ZU9mZnNldCBjcmVhdGVzIG5ldyBtb21lbnRcbiAgICAgICAgLy8gb2JqZWN0cy5cbiAgICAgICAgaWYgKHVwZGF0ZUluUHJvZ3Jlc3MgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICB1cGRhdGVJblByb2dyZXNzID0gdHJ1ZTtcbiAgICAgICAgICAgIHV0aWxzX2hvb2tzX19ob29rcy51cGRhdGVPZmZzZXQodGhpcyk7XG4gICAgICAgICAgICB1cGRhdGVJblByb2dyZXNzID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBpc01vbWVudCAob2JqKSB7XG4gICAgICAgIHJldHVybiBvYmogaW5zdGFuY2VvZiBNb21lbnQgfHwgKG9iaiAhPSBudWxsICYmIG9iai5faXNBTW9tZW50T2JqZWN0ICE9IG51bGwpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGFic0Zsb29yIChudW1iZXIpIHtcbiAgICAgICAgaWYgKG51bWJlciA8IDApIHtcbiAgICAgICAgICAgIC8vIC0wIC0+IDBcbiAgICAgICAgICAgIHJldHVybiBNYXRoLmNlaWwobnVtYmVyKSB8fCAwO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIE1hdGguZmxvb3IobnVtYmVyKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIHRvSW50KGFyZ3VtZW50Rm9yQ29lcmNpb24pIHtcbiAgICAgICAgdmFyIGNvZXJjZWROdW1iZXIgPSArYXJndW1lbnRGb3JDb2VyY2lvbixcbiAgICAgICAgICAgIHZhbHVlID0gMDtcblxuICAgICAgICBpZiAoY29lcmNlZE51bWJlciAhPT0gMCAmJiBpc0Zpbml0ZShjb2VyY2VkTnVtYmVyKSkge1xuICAgICAgICAgICAgdmFsdWUgPSBhYnNGbG9vcihjb2VyY2VkTnVtYmVyKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9XG5cbiAgICAvLyBjb21wYXJlIHR3byBhcnJheXMsIHJldHVybiB0aGUgbnVtYmVyIG9mIGRpZmZlcmVuY2VzXG4gICAgZnVuY3Rpb24gY29tcGFyZUFycmF5cyhhcnJheTEsIGFycmF5MiwgZG9udENvbnZlcnQpIHtcbiAgICAgICAgdmFyIGxlbiA9IE1hdGgubWluKGFycmF5MS5sZW5ndGgsIGFycmF5Mi5sZW5ndGgpLFxuICAgICAgICAgICAgbGVuZ3RoRGlmZiA9IE1hdGguYWJzKGFycmF5MS5sZW5ndGggLSBhcnJheTIubGVuZ3RoKSxcbiAgICAgICAgICAgIGRpZmZzID0gMCxcbiAgICAgICAgICAgIGk7XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgICAgaWYgKChkb250Q29udmVydCAmJiBhcnJheTFbaV0gIT09IGFycmF5MltpXSkgfHxcbiAgICAgICAgICAgICAgICAoIWRvbnRDb252ZXJ0ICYmIHRvSW50KGFycmF5MVtpXSkgIT09IHRvSW50KGFycmF5MltpXSkpKSB7XG4gICAgICAgICAgICAgICAgZGlmZnMrKztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZGlmZnMgKyBsZW5ndGhEaWZmO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHdhcm4obXNnKSB7XG4gICAgICAgIGlmICh1dGlsc19ob29rc19faG9va3Muc3VwcHJlc3NEZXByZWNhdGlvbldhcm5pbmdzID09PSBmYWxzZSAmJlxuICAgICAgICAgICAgICAgICh0eXBlb2YgY29uc29sZSAhPT0gICd1bmRlZmluZWQnKSAmJiBjb25zb2xlLndhcm4pIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybignRGVwcmVjYXRpb24gd2FybmluZzogJyArIG1zZyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBkZXByZWNhdGUobXNnLCBmbikge1xuICAgICAgICB2YXIgZmlyc3RUaW1lID0gdHJ1ZTtcblxuICAgICAgICByZXR1cm4gZXh0ZW5kKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmICh1dGlsc19ob29rc19faG9va3MuZGVwcmVjYXRpb25IYW5kbGVyICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICB1dGlsc19ob29rc19faG9va3MuZGVwcmVjYXRpb25IYW5kbGVyKG51bGwsIG1zZyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZmlyc3RUaW1lKSB7XG4gICAgICAgICAgICAgICAgd2Fybihtc2cgKyAnXFxuQXJndW1lbnRzOiAnICsgQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKS5qb2luKCcsICcpICsgJ1xcbicgKyAobmV3IEVycm9yKCkpLnN0YWNrKTtcbiAgICAgICAgICAgICAgICBmaXJzdFRpbWUgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICB9LCBmbik7XG4gICAgfVxuXG4gICAgdmFyIGRlcHJlY2F0aW9ucyA9IHt9O1xuXG4gICAgZnVuY3Rpb24gZGVwcmVjYXRlU2ltcGxlKG5hbWUsIG1zZykge1xuICAgICAgICBpZiAodXRpbHNfaG9va3NfX2hvb2tzLmRlcHJlY2F0aW9uSGFuZGxlciAhPSBudWxsKSB7XG4gICAgICAgICAgICB1dGlsc19ob29rc19faG9va3MuZGVwcmVjYXRpb25IYW5kbGVyKG5hbWUsIG1zZyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFkZXByZWNhdGlvbnNbbmFtZV0pIHtcbiAgICAgICAgICAgIHdhcm4obXNnKTtcbiAgICAgICAgICAgIGRlcHJlY2F0aW9uc1tuYW1lXSA9IHRydWU7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB1dGlsc19ob29rc19faG9va3Muc3VwcHJlc3NEZXByZWNhdGlvbldhcm5pbmdzID0gZmFsc2U7XG4gICAgdXRpbHNfaG9va3NfX2hvb2tzLmRlcHJlY2F0aW9uSGFuZGxlciA9IG51bGw7XG5cbiAgICBmdW5jdGlvbiBpc0Z1bmN0aW9uKGlucHV0KSB7XG4gICAgICAgIHJldHVybiBpbnB1dCBpbnN0YW5jZW9mIEZ1bmN0aW9uIHx8IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChpbnB1dCkgPT09ICdbb2JqZWN0IEZ1bmN0aW9uXSc7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbG9jYWxlX3NldF9fc2V0IChjb25maWcpIHtcbiAgICAgICAgdmFyIHByb3AsIGk7XG4gICAgICAgIGZvciAoaSBpbiBjb25maWcpIHtcbiAgICAgICAgICAgIHByb3AgPSBjb25maWdbaV07XG4gICAgICAgICAgICBpZiAoaXNGdW5jdGlvbihwcm9wKSkge1xuICAgICAgICAgICAgICAgIHRoaXNbaV0gPSBwcm9wO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzWydfJyArIGldID0gcHJvcDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9jb25maWcgPSBjb25maWc7XG4gICAgICAgIC8vIExlbmllbnQgb3JkaW5hbCBwYXJzaW5nIGFjY2VwdHMganVzdCBhIG51bWJlciBpbiBhZGRpdGlvbiB0b1xuICAgICAgICAvLyBudW1iZXIgKyAocG9zc2libHkpIHN0dWZmIGNvbWluZyBmcm9tIF9vcmRpbmFsUGFyc2VMZW5pZW50LlxuICAgICAgICB0aGlzLl9vcmRpbmFsUGFyc2VMZW5pZW50ID0gbmV3IFJlZ0V4cCh0aGlzLl9vcmRpbmFsUGFyc2Uuc291cmNlICsgJ3wnICsgKC9cXGR7MSwyfS8pLnNvdXJjZSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbWVyZ2VDb25maWdzKHBhcmVudENvbmZpZywgY2hpbGRDb25maWcpIHtcbiAgICAgICAgdmFyIHJlcyA9IGV4dGVuZCh7fSwgcGFyZW50Q29uZmlnKSwgcHJvcDtcbiAgICAgICAgZm9yIChwcm9wIGluIGNoaWxkQ29uZmlnKSB7XG4gICAgICAgICAgICBpZiAoaGFzT3duUHJvcChjaGlsZENvbmZpZywgcHJvcCkpIHtcbiAgICAgICAgICAgICAgICBpZiAoaXNPYmplY3QocGFyZW50Q29uZmlnW3Byb3BdKSAmJiBpc09iamVjdChjaGlsZENvbmZpZ1twcm9wXSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzW3Byb3BdID0ge307XG4gICAgICAgICAgICAgICAgICAgIGV4dGVuZChyZXNbcHJvcF0sIHBhcmVudENvbmZpZ1twcm9wXSk7XG4gICAgICAgICAgICAgICAgICAgIGV4dGVuZChyZXNbcHJvcF0sIGNoaWxkQ29uZmlnW3Byb3BdKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGNoaWxkQ29uZmlnW3Byb3BdICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzW3Byb3BdID0gY2hpbGRDb25maWdbcHJvcF07XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgZGVsZXRlIHJlc1twcm9wXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZm9yIChwcm9wIGluIHBhcmVudENvbmZpZykge1xuICAgICAgICAgICAgaWYgKGhhc093blByb3AocGFyZW50Q29uZmlnLCBwcm9wKSAmJlxuICAgICAgICAgICAgICAgICAgICAhaGFzT3duUHJvcChjaGlsZENvbmZpZywgcHJvcCkgJiZcbiAgICAgICAgICAgICAgICAgICAgaXNPYmplY3QocGFyZW50Q29uZmlnW3Byb3BdKSkge1xuICAgICAgICAgICAgICAgIC8vIG1ha2Ugc3VyZSBjaGFuZ2VzIHRvIHByb3BlcnRpZXMgZG9uJ3QgbW9kaWZ5IHBhcmVudCBjb25maWdcbiAgICAgICAgICAgICAgICByZXNbcHJvcF0gPSBleHRlbmQoe30sIHJlc1twcm9wXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlcztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBMb2NhbGUoY29uZmlnKSB7XG4gICAgICAgIGlmIChjb25maWcgIT0gbnVsbCkge1xuICAgICAgICAgICAgdGhpcy5zZXQoY29uZmlnKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHZhciBrZXlzO1xuXG4gICAgaWYgKE9iamVjdC5rZXlzKSB7XG4gICAgICAgIGtleXMgPSBPYmplY3Qua2V5cztcbiAgICB9IGVsc2Uge1xuICAgICAgICBrZXlzID0gZnVuY3Rpb24gKG9iaikge1xuICAgICAgICAgICAgdmFyIGksIHJlcyA9IFtdO1xuICAgICAgICAgICAgZm9yIChpIGluIG9iaikge1xuICAgICAgICAgICAgICAgIGlmIChoYXNPd25Qcm9wKG9iaiwgaSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzLnB1c2goaSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHJlcztcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICB2YXIgZGVmYXVsdENhbGVuZGFyID0ge1xuICAgICAgICBzYW1lRGF5IDogJ1tUb2RheSBhdF0gTFQnLFxuICAgICAgICBuZXh0RGF5IDogJ1tUb21vcnJvdyBhdF0gTFQnLFxuICAgICAgICBuZXh0V2VlayA6ICdkZGRkIFthdF0gTFQnLFxuICAgICAgICBsYXN0RGF5IDogJ1tZZXN0ZXJkYXkgYXRdIExUJyxcbiAgICAgICAgbGFzdFdlZWsgOiAnW0xhc3RdIGRkZGQgW2F0XSBMVCcsXG4gICAgICAgIHNhbWVFbHNlIDogJ0wnXG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIGxvY2FsZV9jYWxlbmRhcl9fY2FsZW5kYXIgKGtleSwgbW9tLCBub3cpIHtcbiAgICAgICAgdmFyIG91dHB1dCA9IHRoaXMuX2NhbGVuZGFyW2tleV0gfHwgdGhpcy5fY2FsZW5kYXJbJ3NhbWVFbHNlJ107XG4gICAgICAgIHJldHVybiBpc0Z1bmN0aW9uKG91dHB1dCkgPyBvdXRwdXQuY2FsbChtb20sIG5vdykgOiBvdXRwdXQ7XG4gICAgfVxuXG4gICAgdmFyIGRlZmF1bHRMb25nRGF0ZUZvcm1hdCA9IHtcbiAgICAgICAgTFRTICA6ICdoOm1tOnNzIEEnLFxuICAgICAgICBMVCAgIDogJ2g6bW0gQScsXG4gICAgICAgIEwgICAgOiAnTU0vREQvWVlZWScsXG4gICAgICAgIExMICAgOiAnTU1NTSBELCBZWVlZJyxcbiAgICAgICAgTExMICA6ICdNTU1NIEQsIFlZWVkgaDptbSBBJyxcbiAgICAgICAgTExMTCA6ICdkZGRkLCBNTU1NIEQsIFlZWVkgaDptbSBBJ1xuICAgIH07XG5cbiAgICBmdW5jdGlvbiBsb25nRGF0ZUZvcm1hdCAoa2V5KSB7XG4gICAgICAgIHZhciBmb3JtYXQgPSB0aGlzLl9sb25nRGF0ZUZvcm1hdFtrZXldLFxuICAgICAgICAgICAgZm9ybWF0VXBwZXIgPSB0aGlzLl9sb25nRGF0ZUZvcm1hdFtrZXkudG9VcHBlckNhc2UoKV07XG5cbiAgICAgICAgaWYgKGZvcm1hdCB8fCAhZm9ybWF0VXBwZXIpIHtcbiAgICAgICAgICAgIHJldHVybiBmb3JtYXQ7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9sb25nRGF0ZUZvcm1hdFtrZXldID0gZm9ybWF0VXBwZXIucmVwbGFjZSgvTU1NTXxNTXxERHxkZGRkL2csIGZ1bmN0aW9uICh2YWwpIHtcbiAgICAgICAgICAgIHJldHVybiB2YWwuc2xpY2UoMSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiB0aGlzLl9sb25nRGF0ZUZvcm1hdFtrZXldO1xuICAgIH1cblxuICAgIHZhciBkZWZhdWx0SW52YWxpZERhdGUgPSAnSW52YWxpZCBkYXRlJztcblxuICAgIGZ1bmN0aW9uIGludmFsaWREYXRlICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2ludmFsaWREYXRlO1xuICAgIH1cblxuICAgIHZhciBkZWZhdWx0T3JkaW5hbCA9ICclZCc7XG4gICAgdmFyIGRlZmF1bHRPcmRpbmFsUGFyc2UgPSAvXFxkezEsMn0vO1xuXG4gICAgZnVuY3Rpb24gb3JkaW5hbCAobnVtYmVyKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9vcmRpbmFsLnJlcGxhY2UoJyVkJywgbnVtYmVyKTtcbiAgICB9XG5cbiAgICB2YXIgZGVmYXVsdFJlbGF0aXZlVGltZSA9IHtcbiAgICAgICAgZnV0dXJlIDogJ2luICVzJyxcbiAgICAgICAgcGFzdCAgIDogJyVzIGFnbycsXG4gICAgICAgIHMgIDogJ2EgZmV3IHNlY29uZHMnLFxuICAgICAgICBtICA6ICdhIG1pbnV0ZScsXG4gICAgICAgIG1tIDogJyVkIG1pbnV0ZXMnLFxuICAgICAgICBoICA6ICdhbiBob3VyJyxcbiAgICAgICAgaGggOiAnJWQgaG91cnMnLFxuICAgICAgICBkICA6ICdhIGRheScsXG4gICAgICAgIGRkIDogJyVkIGRheXMnLFxuICAgICAgICBNICA6ICdhIG1vbnRoJyxcbiAgICAgICAgTU0gOiAnJWQgbW9udGhzJyxcbiAgICAgICAgeSAgOiAnYSB5ZWFyJyxcbiAgICAgICAgeXkgOiAnJWQgeWVhcnMnXG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIHJlbGF0aXZlX19yZWxhdGl2ZVRpbWUgKG51bWJlciwgd2l0aG91dFN1ZmZpeCwgc3RyaW5nLCBpc0Z1dHVyZSkge1xuICAgICAgICB2YXIgb3V0cHV0ID0gdGhpcy5fcmVsYXRpdmVUaW1lW3N0cmluZ107XG4gICAgICAgIHJldHVybiAoaXNGdW5jdGlvbihvdXRwdXQpKSA/XG4gICAgICAgICAgICBvdXRwdXQobnVtYmVyLCB3aXRob3V0U3VmZml4LCBzdHJpbmcsIGlzRnV0dXJlKSA6XG4gICAgICAgICAgICBvdXRwdXQucmVwbGFjZSgvJWQvaSwgbnVtYmVyKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwYXN0RnV0dXJlIChkaWZmLCBvdXRwdXQpIHtcbiAgICAgICAgdmFyIGZvcm1hdCA9IHRoaXMuX3JlbGF0aXZlVGltZVtkaWZmID4gMCA/ICdmdXR1cmUnIDogJ3Bhc3QnXTtcbiAgICAgICAgcmV0dXJuIGlzRnVuY3Rpb24oZm9ybWF0KSA/IGZvcm1hdChvdXRwdXQpIDogZm9ybWF0LnJlcGxhY2UoLyVzL2ksIG91dHB1dCk7XG4gICAgfVxuXG4gICAgdmFyIGFsaWFzZXMgPSB7fTtcblxuICAgIGZ1bmN0aW9uIGFkZFVuaXRBbGlhcyAodW5pdCwgc2hvcnRoYW5kKSB7XG4gICAgICAgIHZhciBsb3dlckNhc2UgPSB1bml0LnRvTG93ZXJDYXNlKCk7XG4gICAgICAgIGFsaWFzZXNbbG93ZXJDYXNlXSA9IGFsaWFzZXNbbG93ZXJDYXNlICsgJ3MnXSA9IGFsaWFzZXNbc2hvcnRoYW5kXSA9IHVuaXQ7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbm9ybWFsaXplVW5pdHModW5pdHMpIHtcbiAgICAgICAgcmV0dXJuIHR5cGVvZiB1bml0cyA9PT0gJ3N0cmluZycgPyBhbGlhc2VzW3VuaXRzXSB8fCBhbGlhc2VzW3VuaXRzLnRvTG93ZXJDYXNlKCldIDogdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIG5vcm1hbGl6ZU9iamVjdFVuaXRzKGlucHV0T2JqZWN0KSB7XG4gICAgICAgIHZhciBub3JtYWxpemVkSW5wdXQgPSB7fSxcbiAgICAgICAgICAgIG5vcm1hbGl6ZWRQcm9wLFxuICAgICAgICAgICAgcHJvcDtcblxuICAgICAgICBmb3IgKHByb3AgaW4gaW5wdXRPYmplY3QpIHtcbiAgICAgICAgICAgIGlmIChoYXNPd25Qcm9wKGlucHV0T2JqZWN0LCBwcm9wKSkge1xuICAgICAgICAgICAgICAgIG5vcm1hbGl6ZWRQcm9wID0gbm9ybWFsaXplVW5pdHMocHJvcCk7XG4gICAgICAgICAgICAgICAgaWYgKG5vcm1hbGl6ZWRQcm9wKSB7XG4gICAgICAgICAgICAgICAgICAgIG5vcm1hbGl6ZWRJbnB1dFtub3JtYWxpemVkUHJvcF0gPSBpbnB1dE9iamVjdFtwcm9wXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbm9ybWFsaXplZElucHV0O1xuICAgIH1cblxuICAgIHZhciBwcmlvcml0aWVzID0ge307XG5cbiAgICBmdW5jdGlvbiBhZGRVbml0UHJpb3JpdHkodW5pdCwgcHJpb3JpdHkpIHtcbiAgICAgICAgcHJpb3JpdGllc1t1bml0XSA9IHByaW9yaXR5O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldFByaW9yaXRpemVkVW5pdHModW5pdHNPYmopIHtcbiAgICAgICAgdmFyIHVuaXRzID0gW107XG4gICAgICAgIGZvciAodmFyIHUgaW4gdW5pdHNPYmopIHtcbiAgICAgICAgICAgIHVuaXRzLnB1c2goe3VuaXQ6IHUsIHByaW9yaXR5OiBwcmlvcml0aWVzW3VdfSk7XG4gICAgICAgIH1cbiAgICAgICAgdW5pdHMuc29ydChmdW5jdGlvbiAoYSwgYikge1xuICAgICAgICAgICAgcmV0dXJuIGEucHJpb3JpdHkgLSBiLnByaW9yaXR5O1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHVuaXRzO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIG1ha2VHZXRTZXQgKHVuaXQsIGtlZXBUaW1lKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgIGlmICh2YWx1ZSAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgZ2V0X3NldF9fc2V0KHRoaXMsIHVuaXQsIHZhbHVlKTtcbiAgICAgICAgICAgICAgICB1dGlsc19ob29rc19faG9va3MudXBkYXRlT2Zmc2V0KHRoaXMsIGtlZXBUaW1lKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGdldF9zZXRfX2dldCh0aGlzLCB1bml0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZXRfc2V0X19nZXQgKG1vbSwgdW5pdCkge1xuICAgICAgICByZXR1cm4gbW9tLmlzVmFsaWQoKSA/XG4gICAgICAgICAgICBtb20uX2RbJ2dldCcgKyAobW9tLl9pc1VUQyA/ICdVVEMnIDogJycpICsgdW5pdF0oKSA6IE5hTjtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZXRfc2V0X19zZXQgKG1vbSwgdW5pdCwgdmFsdWUpIHtcbiAgICAgICAgaWYgKG1vbS5pc1ZhbGlkKCkpIHtcbiAgICAgICAgICAgIG1vbS5fZFsnc2V0JyArIChtb20uX2lzVVRDID8gJ1VUQycgOiAnJykgKyB1bml0XSh2YWx1ZSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBNT01FTlRTXG5cbiAgICBmdW5jdGlvbiBzdHJpbmdHZXQgKHVuaXRzKSB7XG4gICAgICAgIHVuaXRzID0gbm9ybWFsaXplVW5pdHModW5pdHMpO1xuICAgICAgICBpZiAoaXNGdW5jdGlvbih0aGlzW3VuaXRzXSkpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzW3VuaXRzXSgpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuXG4gICAgZnVuY3Rpb24gc3RyaW5nU2V0ICh1bml0cywgdmFsdWUpIHtcbiAgICAgICAgaWYgKHR5cGVvZiB1bml0cyA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgIHVuaXRzID0gbm9ybWFsaXplT2JqZWN0VW5pdHModW5pdHMpO1xuICAgICAgICAgICAgdmFyIHByaW9yaXRpemVkID0gZ2V0UHJpb3JpdGl6ZWRVbml0cyh1bml0cyk7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHByaW9yaXRpemVkLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdGhpc1twcmlvcml0aXplZFtpXS51bml0XSh1bml0c1twcmlvcml0aXplZFtpXS51bml0XSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB1bml0cyA9IG5vcm1hbGl6ZVVuaXRzKHVuaXRzKTtcbiAgICAgICAgICAgIGlmIChpc0Z1bmN0aW9uKHRoaXNbdW5pdHNdKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzW3VuaXRzXSh2YWx1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gemVyb0ZpbGwobnVtYmVyLCB0YXJnZXRMZW5ndGgsIGZvcmNlU2lnbikge1xuICAgICAgICB2YXIgYWJzTnVtYmVyID0gJycgKyBNYXRoLmFicyhudW1iZXIpLFxuICAgICAgICAgICAgemVyb3NUb0ZpbGwgPSB0YXJnZXRMZW5ndGggLSBhYnNOdW1iZXIubGVuZ3RoLFxuICAgICAgICAgICAgc2lnbiA9IG51bWJlciA+PSAwO1xuICAgICAgICByZXR1cm4gKHNpZ24gPyAoZm9yY2VTaWduID8gJysnIDogJycpIDogJy0nKSArXG4gICAgICAgICAgICBNYXRoLnBvdygxMCwgTWF0aC5tYXgoMCwgemVyb3NUb0ZpbGwpKS50b1N0cmluZygpLnN1YnN0cigxKSArIGFic051bWJlcjtcbiAgICB9XG5cbiAgICB2YXIgZm9ybWF0dGluZ1Rva2VucyA9IC8oXFxbW15cXFtdKlxcXSl8KFxcXFwpPyhbSGhdbW0oc3MpP3xNb3xNTT9NP00/fERvfERERG98REQ/RD9EP3xkZGQ/ZD98ZG8/fHdbb3x3XT98V1tvfFddP3xRbz98WVlZWVlZfFlZWVlZfFlZWVl8WVl8Z2coZ2dnPyk/fEdHKEdHRz8pP3xlfEV8YXxBfGhoP3xISD98a2s/fG1tP3xzcz98U3sxLDl9fHh8WHx6ej98Wlo/fC4pL2c7XG5cbiAgICB2YXIgbG9jYWxGb3JtYXR0aW5nVG9rZW5zID0gLyhcXFtbXlxcW10qXFxdKXwoXFxcXCk/KExUU3xMVHxMTD9MP0w/fGx7MSw0fSkvZztcblxuICAgIHZhciBmb3JtYXRGdW5jdGlvbnMgPSB7fTtcblxuICAgIHZhciBmb3JtYXRUb2tlbkZ1bmN0aW9ucyA9IHt9O1xuXG4gICAgLy8gdG9rZW46ICAgICdNJ1xuICAgIC8vIHBhZGRlZDogICBbJ01NJywgMl1cbiAgICAvLyBvcmRpbmFsOiAgJ01vJ1xuICAgIC8vIGNhbGxiYWNrOiBmdW5jdGlvbiAoKSB7IHRoaXMubW9udGgoKSArIDEgfVxuICAgIGZ1bmN0aW9uIGFkZEZvcm1hdFRva2VuICh0b2tlbiwgcGFkZGVkLCBvcmRpbmFsLCBjYWxsYmFjaykge1xuICAgICAgICB2YXIgZnVuYyA9IGNhbGxiYWNrO1xuICAgICAgICBpZiAodHlwZW9mIGNhbGxiYWNrID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgZnVuYyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpc1tjYWxsYmFja10oKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRva2VuKSB7XG4gICAgICAgICAgICBmb3JtYXRUb2tlbkZ1bmN0aW9uc1t0b2tlbl0gPSBmdW5jO1xuICAgICAgICB9XG4gICAgICAgIGlmIChwYWRkZWQpIHtcbiAgICAgICAgICAgIGZvcm1hdFRva2VuRnVuY3Rpb25zW3BhZGRlZFswXV0gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHplcm9GaWxsKGZ1bmMuYXBwbHkodGhpcywgYXJndW1lbnRzKSwgcGFkZGVkWzFdLCBwYWRkZWRbMl0pO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICBpZiAob3JkaW5hbCkge1xuICAgICAgICAgICAgZm9ybWF0VG9rZW5GdW5jdGlvbnNbb3JkaW5hbF0gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMubG9jYWxlRGF0YSgpLm9yZGluYWwoZnVuYy5hcHBseSh0aGlzLCBhcmd1bWVudHMpLCB0b2tlbik7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcmVtb3ZlRm9ybWF0dGluZ1Rva2VucyhpbnB1dCkge1xuICAgICAgICBpZiAoaW5wdXQubWF0Y2goL1xcW1tcXHNcXFNdLykpIHtcbiAgICAgICAgICAgIHJldHVybiBpbnB1dC5yZXBsYWNlKC9eXFxbfFxcXSQvZywgJycpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBpbnB1dC5yZXBsYWNlKC9cXFxcL2csICcnKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBtYWtlRm9ybWF0RnVuY3Rpb24oZm9ybWF0KSB7XG4gICAgICAgIHZhciBhcnJheSA9IGZvcm1hdC5tYXRjaChmb3JtYXR0aW5nVG9rZW5zKSwgaSwgbGVuZ3RoO1xuXG4gICAgICAgIGZvciAoaSA9IDAsIGxlbmd0aCA9IGFycmF5Lmxlbmd0aDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAoZm9ybWF0VG9rZW5GdW5jdGlvbnNbYXJyYXlbaV1dKSB7XG4gICAgICAgICAgICAgICAgYXJyYXlbaV0gPSBmb3JtYXRUb2tlbkZ1bmN0aW9uc1thcnJheVtpXV07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGFycmF5W2ldID0gcmVtb3ZlRm9ybWF0dGluZ1Rva2VucyhhcnJheVtpXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKG1vbSkge1xuICAgICAgICAgICAgdmFyIG91dHB1dCA9ICcnLCBpO1xuICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgb3V0cHV0ICs9IGFycmF5W2ldIGluc3RhbmNlb2YgRnVuY3Rpb24gPyBhcnJheVtpXS5jYWxsKG1vbSwgZm9ybWF0KSA6IGFycmF5W2ldO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIG91dHB1dDtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICAvLyBmb3JtYXQgZGF0ZSB1c2luZyBuYXRpdmUgZGF0ZSBvYmplY3RcbiAgICBmdW5jdGlvbiBmb3JtYXRNb21lbnQobSwgZm9ybWF0KSB7XG4gICAgICAgIGlmICghbS5pc1ZhbGlkKCkpIHtcbiAgICAgICAgICAgIHJldHVybiBtLmxvY2FsZURhdGEoKS5pbnZhbGlkRGF0ZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9ybWF0ID0gZXhwYW5kRm9ybWF0KGZvcm1hdCwgbS5sb2NhbGVEYXRhKCkpO1xuICAgICAgICBmb3JtYXRGdW5jdGlvbnNbZm9ybWF0XSA9IGZvcm1hdEZ1bmN0aW9uc1tmb3JtYXRdIHx8IG1ha2VGb3JtYXRGdW5jdGlvbihmb3JtYXQpO1xuXG4gICAgICAgIHJldHVybiBmb3JtYXRGdW5jdGlvbnNbZm9ybWF0XShtKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBleHBhbmRGb3JtYXQoZm9ybWF0LCBsb2NhbGUpIHtcbiAgICAgICAgdmFyIGkgPSA1O1xuXG4gICAgICAgIGZ1bmN0aW9uIHJlcGxhY2VMb25nRGF0ZUZvcm1hdFRva2VucyhpbnB1dCkge1xuICAgICAgICAgICAgcmV0dXJuIGxvY2FsZS5sb25nRGF0ZUZvcm1hdChpbnB1dCkgfHwgaW5wdXQ7XG4gICAgICAgIH1cblxuICAgICAgICBsb2NhbEZvcm1hdHRpbmdUb2tlbnMubGFzdEluZGV4ID0gMDtcbiAgICAgICAgd2hpbGUgKGkgPj0gMCAmJiBsb2NhbEZvcm1hdHRpbmdUb2tlbnMudGVzdChmb3JtYXQpKSB7XG4gICAgICAgICAgICBmb3JtYXQgPSBmb3JtYXQucmVwbGFjZShsb2NhbEZvcm1hdHRpbmdUb2tlbnMsIHJlcGxhY2VMb25nRGF0ZUZvcm1hdFRva2Vucyk7XG4gICAgICAgICAgICBsb2NhbEZvcm1hdHRpbmdUb2tlbnMubGFzdEluZGV4ID0gMDtcbiAgICAgICAgICAgIGkgLT0gMTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBmb3JtYXQ7XG4gICAgfVxuXG4gICAgdmFyIG1hdGNoMSAgICAgICAgID0gL1xcZC87ICAgICAgICAgICAgLy8gICAgICAgMCAtIDlcbiAgICB2YXIgbWF0Y2gyICAgICAgICAgPSAvXFxkXFxkLzsgICAgICAgICAgLy8gICAgICAwMCAtIDk5XG4gICAgdmFyIG1hdGNoMyAgICAgICAgID0gL1xcZHszfS87ICAgICAgICAgLy8gICAgIDAwMCAtIDk5OVxuICAgIHZhciBtYXRjaDQgICAgICAgICA9IC9cXGR7NH0vOyAgICAgICAgIC8vICAgIDAwMDAgLSA5OTk5XG4gICAgdmFyIG1hdGNoNiAgICAgICAgID0gL1srLV0/XFxkezZ9LzsgICAgLy8gLTk5OTk5OSAtIDk5OTk5OVxuICAgIHZhciBtYXRjaDF0bzIgICAgICA9IC9cXGRcXGQ/LzsgICAgICAgICAvLyAgICAgICAwIC0gOTlcbiAgICB2YXIgbWF0Y2gzdG80ICAgICAgPSAvXFxkXFxkXFxkXFxkPy87ICAgICAvLyAgICAgOTk5IC0gOTk5OVxuICAgIHZhciBtYXRjaDV0bzYgICAgICA9IC9cXGRcXGRcXGRcXGRcXGRcXGQ/LzsgLy8gICA5OTk5OSAtIDk5OTk5OVxuICAgIHZhciBtYXRjaDF0bzMgICAgICA9IC9cXGR7MSwzfS87ICAgICAgIC8vICAgICAgIDAgLSA5OTlcbiAgICB2YXIgbWF0Y2gxdG80ICAgICAgPSAvXFxkezEsNH0vOyAgICAgICAvLyAgICAgICAwIC0gOTk5OVxuICAgIHZhciBtYXRjaDF0bzYgICAgICA9IC9bKy1dP1xcZHsxLDZ9LzsgIC8vIC05OTk5OTkgLSA5OTk5OTlcblxuICAgIHZhciBtYXRjaFVuc2lnbmVkICA9IC9cXGQrLzsgICAgICAgICAgIC8vICAgICAgIDAgLSBpbmZcbiAgICB2YXIgbWF0Y2hTaWduZWQgICAgPSAvWystXT9cXGQrLzsgICAgICAvLyAgICAtaW5mIC0gaW5mXG5cbiAgICB2YXIgbWF0Y2hPZmZzZXQgICAgPSAvWnxbKy1dXFxkXFxkOj9cXGRcXGQvZ2k7IC8vICswMDowMCAtMDA6MDAgKzAwMDAgLTAwMDAgb3IgWlxuICAgIHZhciBtYXRjaFNob3J0T2Zmc2V0ID0gL1p8WystXVxcZFxcZCg/Ojo/XFxkXFxkKT8vZ2k7IC8vICswMCAtMDAgKzAwOjAwIC0wMDowMCArMDAwMCAtMDAwMCBvciBaXG5cbiAgICB2YXIgbWF0Y2hUaW1lc3RhbXAgPSAvWystXT9cXGQrKFxcLlxcZHsxLDN9KT8vOyAvLyAxMjM0NTY3ODkgMTIzNDU2Nzg5LjEyM1xuXG4gICAgLy8gYW55IHdvcmQgKG9yIHR3bykgY2hhcmFjdGVycyBvciBudW1iZXJzIGluY2x1ZGluZyB0d28vdGhyZWUgd29yZCBtb250aCBpbiBhcmFiaWMuXG4gICAgLy8gaW5jbHVkZXMgc2NvdHRpc2ggZ2FlbGljIHR3byB3b3JkIGFuZCBoeXBoZW5hdGVkIG1vbnRoc1xuICAgIHZhciBtYXRjaFdvcmQgPSAvWzAtOV0qWydhLXpcXHUwMEEwLVxcdTA1RkZcXHUwNzAwLVxcdUQ3RkZcXHVGOTAwLVxcdUZEQ0ZcXHVGREYwLVxcdUZGRUZdK3xbXFx1MDYwMC1cXHUwNkZGXFwvXSsoXFxzKj9bXFx1MDYwMC1cXHUwNkZGXSspezEsMn0vaTtcblxuXG4gICAgdmFyIHJlZ2V4ZXMgPSB7fTtcblxuICAgIGZ1bmN0aW9uIGFkZFJlZ2V4VG9rZW4gKHRva2VuLCByZWdleCwgc3RyaWN0UmVnZXgpIHtcbiAgICAgICAgcmVnZXhlc1t0b2tlbl0gPSBpc0Z1bmN0aW9uKHJlZ2V4KSA/IHJlZ2V4IDogZnVuY3Rpb24gKGlzU3RyaWN0LCBsb2NhbGVEYXRhKSB7XG4gICAgICAgICAgICByZXR1cm4gKGlzU3RyaWN0ICYmIHN0cmljdFJlZ2V4KSA/IHN0cmljdFJlZ2V4IDogcmVnZXg7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2V0UGFyc2VSZWdleEZvclRva2VuICh0b2tlbiwgY29uZmlnKSB7XG4gICAgICAgIGlmICghaGFzT3duUHJvcChyZWdleGVzLCB0b2tlbikpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgUmVnRXhwKHVuZXNjYXBlRm9ybWF0KHRva2VuKSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmVnZXhlc1t0b2tlbl0oY29uZmlnLl9zdHJpY3QsIGNvbmZpZy5fbG9jYWxlKTtcbiAgICB9XG5cbiAgICAvLyBDb2RlIGZyb20gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8zNTYxNDkzL2lzLXRoZXJlLWEtcmVnZXhwLWVzY2FwZS1mdW5jdGlvbi1pbi1qYXZhc2NyaXB0XG4gICAgZnVuY3Rpb24gdW5lc2NhcGVGb3JtYXQocykge1xuICAgICAgICByZXR1cm4gcmVnZXhFc2NhcGUocy5yZXBsYWNlKCdcXFxcJywgJycpLnJlcGxhY2UoL1xcXFwoXFxbKXxcXFxcKFxcXSl8XFxbKFteXFxdXFxbXSopXFxdfFxcXFwoLikvZywgZnVuY3Rpb24gKG1hdGNoZWQsIHAxLCBwMiwgcDMsIHA0KSB7XG4gICAgICAgICAgICByZXR1cm4gcDEgfHwgcDIgfHwgcDMgfHwgcDQ7XG4gICAgICAgIH0pKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiByZWdleEVzY2FwZShzKSB7XG4gICAgICAgIHJldHVybiBzLnJlcGxhY2UoL1stXFwvXFxcXF4kKis/LigpfFtcXF17fV0vZywgJ1xcXFwkJicpO1xuICAgIH1cblxuICAgIHZhciB0b2tlbnMgPSB7fTtcblxuICAgIGZ1bmN0aW9uIGFkZFBhcnNlVG9rZW4gKHRva2VuLCBjYWxsYmFjaykge1xuICAgICAgICB2YXIgaSwgZnVuYyA9IGNhbGxiYWNrO1xuICAgICAgICBpZiAodHlwZW9mIHRva2VuID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgdG9rZW4gPSBbdG9rZW5dO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgPT09ICdudW1iZXInKSB7XG4gICAgICAgICAgICBmdW5jID0gZnVuY3Rpb24gKGlucHV0LCBhcnJheSkge1xuICAgICAgICAgICAgICAgIGFycmF5W2NhbGxiYWNrXSA9IHRvSW50KGlucHV0KTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgZm9yIChpID0gMDsgaSA8IHRva2VuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB0b2tlbnNbdG9rZW5baV1dID0gZnVuYztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGFkZFdlZWtQYXJzZVRva2VuICh0b2tlbiwgY2FsbGJhY2spIHtcbiAgICAgICAgYWRkUGFyc2VUb2tlbih0b2tlbiwgZnVuY3Rpb24gKGlucHV0LCBhcnJheSwgY29uZmlnLCB0b2tlbikge1xuICAgICAgICAgICAgY29uZmlnLl93ID0gY29uZmlnLl93IHx8IHt9O1xuICAgICAgICAgICAgY2FsbGJhY2soaW5wdXQsIGNvbmZpZy5fdywgY29uZmlnLCB0b2tlbik7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGFkZFRpbWVUb0FycmF5RnJvbVRva2VuKHRva2VuLCBpbnB1dCwgY29uZmlnKSB7XG4gICAgICAgIGlmIChpbnB1dCAhPSBudWxsICYmIGhhc093blByb3AodG9rZW5zLCB0b2tlbikpIHtcbiAgICAgICAgICAgIHRva2Vuc1t0b2tlbl0oaW5wdXQsIGNvbmZpZy5fYSwgY29uZmlnLCB0b2tlbik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB2YXIgWUVBUiA9IDA7XG4gICAgdmFyIE1PTlRIID0gMTtcbiAgICB2YXIgREFURSA9IDI7XG4gICAgdmFyIEhPVVIgPSAzO1xuICAgIHZhciBNSU5VVEUgPSA0O1xuICAgIHZhciBTRUNPTkQgPSA1O1xuICAgIHZhciBNSUxMSVNFQ09ORCA9IDY7XG4gICAgdmFyIFdFRUsgPSA3O1xuICAgIHZhciBXRUVLREFZID0gODtcblxuICAgIHZhciBpbmRleE9mO1xuXG4gICAgaWYgKEFycmF5LnByb3RvdHlwZS5pbmRleE9mKSB7XG4gICAgICAgIGluZGV4T2YgPSBBcnJheS5wcm90b3R5cGUuaW5kZXhPZjtcbiAgICB9IGVsc2Uge1xuICAgICAgICBpbmRleE9mID0gZnVuY3Rpb24gKG8pIHtcbiAgICAgICAgICAgIC8vIEkga25vd1xuICAgICAgICAgICAgdmFyIGk7XG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgdGhpcy5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzW2ldID09PSBvKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiAtMTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBkYXlzSW5Nb250aCh5ZWFyLCBtb250aCkge1xuICAgICAgICByZXR1cm4gbmV3IERhdGUoRGF0ZS5VVEMoeWVhciwgbW9udGggKyAxLCAwKSkuZ2V0VVRDRGF0ZSgpO1xuICAgIH1cblxuICAgIC8vIEZPUk1BVFRJTkdcblxuICAgIGFkZEZvcm1hdFRva2VuKCdNJywgWydNTScsIDJdLCAnTW8nLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm1vbnRoKCkgKyAxO1xuICAgIH0pO1xuXG4gICAgYWRkRm9ybWF0VG9rZW4oJ01NTScsIDAsIDAsIGZ1bmN0aW9uIChmb3JtYXQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubG9jYWxlRGF0YSgpLm1vbnRoc1Nob3J0KHRoaXMsIGZvcm1hdCk7XG4gICAgfSk7XG5cbiAgICBhZGRGb3JtYXRUb2tlbignTU1NTScsIDAsIDAsIGZ1bmN0aW9uIChmb3JtYXQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubG9jYWxlRGF0YSgpLm1vbnRocyh0aGlzLCBmb3JtYXQpO1xuICAgIH0pO1xuXG4gICAgLy8gQUxJQVNFU1xuXG4gICAgYWRkVW5pdEFsaWFzKCdtb250aCcsICdNJyk7XG5cbiAgICAvLyBQUklPUklUWVxuXG4gICAgYWRkVW5pdFByaW9yaXR5KCdtb250aCcsIDgpO1xuXG4gICAgLy8gUEFSU0lOR1xuXG4gICAgYWRkUmVnZXhUb2tlbignTScsICAgIG1hdGNoMXRvMik7XG4gICAgYWRkUmVnZXhUb2tlbignTU0nLCAgIG1hdGNoMXRvMiwgbWF0Y2gyKTtcbiAgICBhZGRSZWdleFRva2VuKCdNTU0nLCAgZnVuY3Rpb24gKGlzU3RyaWN0LCBsb2NhbGUpIHtcbiAgICAgICAgcmV0dXJuIGxvY2FsZS5tb250aHNTaG9ydFJlZ2V4KGlzU3RyaWN0KTtcbiAgICB9KTtcbiAgICBhZGRSZWdleFRva2VuKCdNTU1NJywgZnVuY3Rpb24gKGlzU3RyaWN0LCBsb2NhbGUpIHtcbiAgICAgICAgcmV0dXJuIGxvY2FsZS5tb250aHNSZWdleChpc1N0cmljdCk7XG4gICAgfSk7XG5cbiAgICBhZGRQYXJzZVRva2VuKFsnTScsICdNTSddLCBmdW5jdGlvbiAoaW5wdXQsIGFycmF5KSB7XG4gICAgICAgIGFycmF5W01PTlRIXSA9IHRvSW50KGlucHV0KSAtIDE7XG4gICAgfSk7XG5cbiAgICBhZGRQYXJzZVRva2VuKFsnTU1NJywgJ01NTU0nXSwgZnVuY3Rpb24gKGlucHV0LCBhcnJheSwgY29uZmlnLCB0b2tlbikge1xuICAgICAgICB2YXIgbW9udGggPSBjb25maWcuX2xvY2FsZS5tb250aHNQYXJzZShpbnB1dCwgdG9rZW4sIGNvbmZpZy5fc3RyaWN0KTtcbiAgICAgICAgLy8gaWYgd2UgZGlkbid0IGZpbmQgYSBtb250aCBuYW1lLCBtYXJrIHRoZSBkYXRlIGFzIGludmFsaWQuXG4gICAgICAgIGlmIChtb250aCAhPSBudWxsKSB7XG4gICAgICAgICAgICBhcnJheVtNT05USF0gPSBtb250aDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGdldFBhcnNpbmdGbGFncyhjb25maWcpLmludmFsaWRNb250aCA9IGlucHV0O1xuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICAvLyBMT0NBTEVTXG5cbiAgICB2YXIgTU9OVEhTX0lOX0ZPUk1BVCA9IC9EW29EXT8oXFxbW15cXFtcXF1dKlxcXXxcXHMrKStNTU1NPy87XG4gICAgdmFyIGRlZmF1bHRMb2NhbGVNb250aHMgPSAnSmFudWFyeV9GZWJydWFyeV9NYXJjaF9BcHJpbF9NYXlfSnVuZV9KdWx5X0F1Z3VzdF9TZXB0ZW1iZXJfT2N0b2Jlcl9Ob3ZlbWJlcl9EZWNlbWJlcicuc3BsaXQoJ18nKTtcbiAgICBmdW5jdGlvbiBsb2NhbGVNb250aHMgKG0sIGZvcm1hdCkge1xuICAgICAgICByZXR1cm4gaXNBcnJheSh0aGlzLl9tb250aHMpID8gdGhpcy5fbW9udGhzW20ubW9udGgoKV0gOlxuICAgICAgICAgICAgdGhpcy5fbW9udGhzWyh0aGlzLl9tb250aHMuaXNGb3JtYXQgfHwgTU9OVEhTX0lOX0ZPUk1BVCkudGVzdChmb3JtYXQpID8gJ2Zvcm1hdCcgOiAnc3RhbmRhbG9uZSddW20ubW9udGgoKV07XG4gICAgfVxuXG4gICAgdmFyIGRlZmF1bHRMb2NhbGVNb250aHNTaG9ydCA9ICdKYW5fRmViX01hcl9BcHJfTWF5X0p1bl9KdWxfQXVnX1NlcF9PY3RfTm92X0RlYycuc3BsaXQoJ18nKTtcbiAgICBmdW5jdGlvbiBsb2NhbGVNb250aHNTaG9ydCAobSwgZm9ybWF0KSB7XG4gICAgICAgIHJldHVybiBpc0FycmF5KHRoaXMuX21vbnRoc1Nob3J0KSA/IHRoaXMuX21vbnRoc1Nob3J0W20ubW9udGgoKV0gOlxuICAgICAgICAgICAgdGhpcy5fbW9udGhzU2hvcnRbTU9OVEhTX0lOX0ZPUk1BVC50ZXN0KGZvcm1hdCkgPyAnZm9ybWF0JyA6ICdzdGFuZGFsb25lJ11bbS5tb250aCgpXTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiB1bml0c19tb250aF9faGFuZGxlU3RyaWN0UGFyc2UobW9udGhOYW1lLCBmb3JtYXQsIHN0cmljdCkge1xuICAgICAgICB2YXIgaSwgaWksIG1vbSwgbGxjID0gbW9udGhOYW1lLnRvTG9jYWxlTG93ZXJDYXNlKCk7XG4gICAgICAgIGlmICghdGhpcy5fbW9udGhzUGFyc2UpIHtcbiAgICAgICAgICAgIC8vIHRoaXMgaXMgbm90IHVzZWRcbiAgICAgICAgICAgIHRoaXMuX21vbnRoc1BhcnNlID0gW107XG4gICAgICAgICAgICB0aGlzLl9sb25nTW9udGhzUGFyc2UgPSBbXTtcbiAgICAgICAgICAgIHRoaXMuX3Nob3J0TW9udGhzUGFyc2UgPSBbXTtcbiAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCAxMjsgKytpKSB7XG4gICAgICAgICAgICAgICAgbW9tID0gY3JlYXRlX3V0Y19fY3JlYXRlVVRDKFsyMDAwLCBpXSk7XG4gICAgICAgICAgICAgICAgdGhpcy5fc2hvcnRNb250aHNQYXJzZVtpXSA9IHRoaXMubW9udGhzU2hvcnQobW9tLCAnJykudG9Mb2NhbGVMb3dlckNhc2UoKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9sb25nTW9udGhzUGFyc2VbaV0gPSB0aGlzLm1vbnRocyhtb20sICcnKS50b0xvY2FsZUxvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHN0cmljdCkge1xuICAgICAgICAgICAgaWYgKGZvcm1hdCA9PT0gJ01NTScpIHtcbiAgICAgICAgICAgICAgICBpaSA9IGluZGV4T2YuY2FsbCh0aGlzLl9zaG9ydE1vbnRoc1BhcnNlLCBsbGMpO1xuICAgICAgICAgICAgICAgIHJldHVybiBpaSAhPT0gLTEgPyBpaSA6IG51bGw7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGlpID0gaW5kZXhPZi5jYWxsKHRoaXMuX2xvbmdNb250aHNQYXJzZSwgbGxjKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gaWkgIT09IC0xID8gaWkgOiBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKGZvcm1hdCA9PT0gJ01NTScpIHtcbiAgICAgICAgICAgICAgICBpaSA9IGluZGV4T2YuY2FsbCh0aGlzLl9zaG9ydE1vbnRoc1BhcnNlLCBsbGMpO1xuICAgICAgICAgICAgICAgIGlmIChpaSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGlpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpaSA9IGluZGV4T2YuY2FsbCh0aGlzLl9sb25nTW9udGhzUGFyc2UsIGxsYyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGlpICE9PSAtMSA/IGlpIDogbnVsbDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWkgPSBpbmRleE9mLmNhbGwodGhpcy5fbG9uZ01vbnRoc1BhcnNlLCBsbGMpO1xuICAgICAgICAgICAgICAgIGlmIChpaSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGlpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpaSA9IGluZGV4T2YuY2FsbCh0aGlzLl9zaG9ydE1vbnRoc1BhcnNlLCBsbGMpO1xuICAgICAgICAgICAgICAgIHJldHVybiBpaSAhPT0gLTEgPyBpaSA6IG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsb2NhbGVNb250aHNQYXJzZSAobW9udGhOYW1lLCBmb3JtYXQsIHN0cmljdCkge1xuICAgICAgICB2YXIgaSwgbW9tLCByZWdleDtcblxuICAgICAgICBpZiAodGhpcy5fbW9udGhzUGFyc2VFeGFjdCkge1xuICAgICAgICAgICAgcmV0dXJuIHVuaXRzX21vbnRoX19oYW5kbGVTdHJpY3RQYXJzZS5jYWxsKHRoaXMsIG1vbnRoTmFtZSwgZm9ybWF0LCBzdHJpY3QpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCF0aGlzLl9tb250aHNQYXJzZSkge1xuICAgICAgICAgICAgdGhpcy5fbW9udGhzUGFyc2UgPSBbXTtcbiAgICAgICAgICAgIHRoaXMuX2xvbmdNb250aHNQYXJzZSA9IFtdO1xuICAgICAgICAgICAgdGhpcy5fc2hvcnRNb250aHNQYXJzZSA9IFtdO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVE9ETzogYWRkIHNvcnRpbmdcbiAgICAgICAgLy8gU29ydGluZyBtYWtlcyBzdXJlIGlmIG9uZSBtb250aCAob3IgYWJicikgaXMgYSBwcmVmaXggb2YgYW5vdGhlclxuICAgICAgICAvLyBzZWUgc29ydGluZyBpbiBjb21wdXRlTW9udGhzUGFyc2VcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IDEyOyBpKyspIHtcbiAgICAgICAgICAgIC8vIG1ha2UgdGhlIHJlZ2V4IGlmIHdlIGRvbid0IGhhdmUgaXQgYWxyZWFkeVxuICAgICAgICAgICAgbW9tID0gY3JlYXRlX3V0Y19fY3JlYXRlVVRDKFsyMDAwLCBpXSk7XG4gICAgICAgICAgICBpZiAoc3RyaWN0ICYmICF0aGlzLl9sb25nTW9udGhzUGFyc2VbaV0pIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9sb25nTW9udGhzUGFyc2VbaV0gPSBuZXcgUmVnRXhwKCdeJyArIHRoaXMubW9udGhzKG1vbSwgJycpLnJlcGxhY2UoJy4nLCAnJykgKyAnJCcsICdpJyk7XG4gICAgICAgICAgICAgICAgdGhpcy5fc2hvcnRNb250aHNQYXJzZVtpXSA9IG5ldyBSZWdFeHAoJ14nICsgdGhpcy5tb250aHNTaG9ydChtb20sICcnKS5yZXBsYWNlKCcuJywgJycpICsgJyQnLCAnaScpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCFzdHJpY3QgJiYgIXRoaXMuX21vbnRoc1BhcnNlW2ldKSB7XG4gICAgICAgICAgICAgICAgcmVnZXggPSAnXicgKyB0aGlzLm1vbnRocyhtb20sICcnKSArICd8XicgKyB0aGlzLm1vbnRoc1Nob3J0KG1vbSwgJycpO1xuICAgICAgICAgICAgICAgIHRoaXMuX21vbnRoc1BhcnNlW2ldID0gbmV3IFJlZ0V4cChyZWdleC5yZXBsYWNlKCcuJywgJycpLCAnaScpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gdGVzdCB0aGUgcmVnZXhcbiAgICAgICAgICAgIGlmIChzdHJpY3QgJiYgZm9ybWF0ID09PSAnTU1NTScgJiYgdGhpcy5fbG9uZ01vbnRoc1BhcnNlW2ldLnRlc3QobW9udGhOYW1lKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChzdHJpY3QgJiYgZm9ybWF0ID09PSAnTU1NJyAmJiB0aGlzLl9zaG9ydE1vbnRoc1BhcnNlW2ldLnRlc3QobW9udGhOYW1lKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBpO1xuICAgICAgICAgICAgfSBlbHNlIGlmICghc3RyaWN0ICYmIHRoaXMuX21vbnRoc1BhcnNlW2ldLnRlc3QobW9udGhOYW1lKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gTU9NRU5UU1xuXG4gICAgZnVuY3Rpb24gc2V0TW9udGggKG1vbSwgdmFsdWUpIHtcbiAgICAgICAgdmFyIGRheU9mTW9udGg7XG5cbiAgICAgICAgaWYgKCFtb20uaXNWYWxpZCgpKSB7XG4gICAgICAgICAgICAvLyBObyBvcFxuICAgICAgICAgICAgcmV0dXJuIG1vbTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICBpZiAoL15cXGQrJC8udGVzdCh2YWx1ZSkpIHtcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IHRvSW50KHZhbHVlKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdmFsdWUgPSBtb20ubG9jYWxlRGF0YSgpLm1vbnRoc1BhcnNlKHZhbHVlKTtcbiAgICAgICAgICAgICAgICAvLyBUT0RPOiBBbm90aGVyIHNpbGVudCBmYWlsdXJlP1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgdmFsdWUgIT09ICdudW1iZXInKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBtb207XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZGF5T2ZNb250aCA9IE1hdGgubWluKG1vbS5kYXRlKCksIGRheXNJbk1vbnRoKG1vbS55ZWFyKCksIHZhbHVlKSk7XG4gICAgICAgIG1vbS5fZFsnc2V0JyArIChtb20uX2lzVVRDID8gJ1VUQycgOiAnJykgKyAnTW9udGgnXSh2YWx1ZSwgZGF5T2ZNb250aCk7XG4gICAgICAgIHJldHVybiBtb207XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2V0U2V0TW9udGggKHZhbHVlKSB7XG4gICAgICAgIGlmICh2YWx1ZSAhPSBudWxsKSB7XG4gICAgICAgICAgICBzZXRNb250aCh0aGlzLCB2YWx1ZSk7XG4gICAgICAgICAgICB1dGlsc19ob29rc19faG9va3MudXBkYXRlT2Zmc2V0KHRoaXMsIHRydWUpO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gZ2V0X3NldF9fZ2V0KHRoaXMsICdNb250aCcpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2V0RGF5c0luTW9udGggKCkge1xuICAgICAgICByZXR1cm4gZGF5c0luTW9udGgodGhpcy55ZWFyKCksIHRoaXMubW9udGgoKSk7XG4gICAgfVxuXG4gICAgdmFyIGRlZmF1bHRNb250aHNTaG9ydFJlZ2V4ID0gbWF0Y2hXb3JkO1xuICAgIGZ1bmN0aW9uIG1vbnRoc1Nob3J0UmVnZXggKGlzU3RyaWN0KSB7XG4gICAgICAgIGlmICh0aGlzLl9tb250aHNQYXJzZUV4YWN0KSB7XG4gICAgICAgICAgICBpZiAoIWhhc093blByb3AodGhpcywgJ19tb250aHNSZWdleCcpKSB7XG4gICAgICAgICAgICAgICAgY29tcHV0ZU1vbnRoc1BhcnNlLmNhbGwodGhpcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoaXNTdHJpY3QpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fbW9udGhzU2hvcnRTdHJpY3RSZWdleDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX21vbnRoc1Nob3J0UmVnZXg7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAoIWhhc093blByb3AodGhpcywgJ19tb250aHNTaG9ydFJlZ2V4JykpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9tb250aHNTaG9ydFJlZ2V4ID0gZGVmYXVsdE1vbnRoc1Nob3J0UmVnZXg7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fbW9udGhzU2hvcnRTdHJpY3RSZWdleCAmJiBpc1N0cmljdCA/XG4gICAgICAgICAgICAgICAgdGhpcy5fbW9udGhzU2hvcnRTdHJpY3RSZWdleCA6IHRoaXMuX21vbnRoc1Nob3J0UmVnZXg7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB2YXIgZGVmYXVsdE1vbnRoc1JlZ2V4ID0gbWF0Y2hXb3JkO1xuICAgIGZ1bmN0aW9uIG1vbnRoc1JlZ2V4IChpc1N0cmljdCkge1xuICAgICAgICBpZiAodGhpcy5fbW9udGhzUGFyc2VFeGFjdCkge1xuICAgICAgICAgICAgaWYgKCFoYXNPd25Qcm9wKHRoaXMsICdfbW9udGhzUmVnZXgnKSkge1xuICAgICAgICAgICAgICAgIGNvbXB1dGVNb250aHNQYXJzZS5jYWxsKHRoaXMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGlzU3RyaWN0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX21vbnRoc1N0cmljdFJlZ2V4O1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fbW9udGhzUmVnZXg7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAoIWhhc093blByb3AodGhpcywgJ19tb250aHNSZWdleCcpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fbW9udGhzUmVnZXggPSBkZWZhdWx0TW9udGhzUmVnZXg7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fbW9udGhzU3RyaWN0UmVnZXggJiYgaXNTdHJpY3QgP1xuICAgICAgICAgICAgICAgIHRoaXMuX21vbnRoc1N0cmljdFJlZ2V4IDogdGhpcy5fbW9udGhzUmVnZXg7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjb21wdXRlTW9udGhzUGFyc2UgKCkge1xuICAgICAgICBmdW5jdGlvbiBjbXBMZW5SZXYoYSwgYikge1xuICAgICAgICAgICAgcmV0dXJuIGIubGVuZ3RoIC0gYS5sZW5ndGg7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgc2hvcnRQaWVjZXMgPSBbXSwgbG9uZ1BpZWNlcyA9IFtdLCBtaXhlZFBpZWNlcyA9IFtdLFxuICAgICAgICAgICAgaSwgbW9tO1xuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgMTI7IGkrKykge1xuICAgICAgICAgICAgLy8gbWFrZSB0aGUgcmVnZXggaWYgd2UgZG9uJ3QgaGF2ZSBpdCBhbHJlYWR5XG4gICAgICAgICAgICBtb20gPSBjcmVhdGVfdXRjX19jcmVhdGVVVEMoWzIwMDAsIGldKTtcbiAgICAgICAgICAgIHNob3J0UGllY2VzLnB1c2godGhpcy5tb250aHNTaG9ydChtb20sICcnKSk7XG4gICAgICAgICAgICBsb25nUGllY2VzLnB1c2godGhpcy5tb250aHMobW9tLCAnJykpO1xuICAgICAgICAgICAgbWl4ZWRQaWVjZXMucHVzaCh0aGlzLm1vbnRocyhtb20sICcnKSk7XG4gICAgICAgICAgICBtaXhlZFBpZWNlcy5wdXNoKHRoaXMubW9udGhzU2hvcnQobW9tLCAnJykpO1xuICAgICAgICB9XG4gICAgICAgIC8vIFNvcnRpbmcgbWFrZXMgc3VyZSBpZiBvbmUgbW9udGggKG9yIGFiYnIpIGlzIGEgcHJlZml4IG9mIGFub3RoZXIgaXRcbiAgICAgICAgLy8gd2lsbCBtYXRjaCB0aGUgbG9uZ2VyIHBpZWNlLlxuICAgICAgICBzaG9ydFBpZWNlcy5zb3J0KGNtcExlblJldik7XG4gICAgICAgIGxvbmdQaWVjZXMuc29ydChjbXBMZW5SZXYpO1xuICAgICAgICBtaXhlZFBpZWNlcy5zb3J0KGNtcExlblJldik7XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCAxMjsgaSsrKSB7XG4gICAgICAgICAgICBzaG9ydFBpZWNlc1tpXSA9IHJlZ2V4RXNjYXBlKHNob3J0UGllY2VzW2ldKTtcbiAgICAgICAgICAgIGxvbmdQaWVjZXNbaV0gPSByZWdleEVzY2FwZShsb25nUGllY2VzW2ldKTtcbiAgICAgICAgfVxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgMjQ7IGkrKykge1xuICAgICAgICAgICAgbWl4ZWRQaWVjZXNbaV0gPSByZWdleEVzY2FwZShtaXhlZFBpZWNlc1tpXSk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9tb250aHNSZWdleCA9IG5ldyBSZWdFeHAoJ14oJyArIG1peGVkUGllY2VzLmpvaW4oJ3wnKSArICcpJywgJ2knKTtcbiAgICAgICAgdGhpcy5fbW9udGhzU2hvcnRSZWdleCA9IHRoaXMuX21vbnRoc1JlZ2V4O1xuICAgICAgICB0aGlzLl9tb250aHNTdHJpY3RSZWdleCA9IG5ldyBSZWdFeHAoJ14oJyArIGxvbmdQaWVjZXMuam9pbignfCcpICsgJyknLCAnaScpO1xuICAgICAgICB0aGlzLl9tb250aHNTaG9ydFN0cmljdFJlZ2V4ID0gbmV3IFJlZ0V4cCgnXignICsgc2hvcnRQaWVjZXMuam9pbignfCcpICsgJyknLCAnaScpO1xuICAgIH1cblxuICAgIC8vIEZPUk1BVFRJTkdcblxuICAgIGFkZEZvcm1hdFRva2VuKCdZJywgMCwgMCwgZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgeSA9IHRoaXMueWVhcigpO1xuICAgICAgICByZXR1cm4geSA8PSA5OTk5ID8gJycgKyB5IDogJysnICsgeTtcbiAgICB9KTtcblxuICAgIGFkZEZvcm1hdFRva2VuKDAsIFsnWVknLCAyXSwgMCwgZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy55ZWFyKCkgJSAxMDA7XG4gICAgfSk7XG5cbiAgICBhZGRGb3JtYXRUb2tlbigwLCBbJ1lZWVknLCAgIDRdLCAgICAgICAwLCAneWVhcicpO1xuICAgIGFkZEZvcm1hdFRva2VuKDAsIFsnWVlZWVknLCAgNV0sICAgICAgIDAsICd5ZWFyJyk7XG4gICAgYWRkRm9ybWF0VG9rZW4oMCwgWydZWVlZWVknLCA2LCB0cnVlXSwgMCwgJ3llYXInKTtcblxuICAgIC8vIEFMSUFTRVNcblxuICAgIGFkZFVuaXRBbGlhcygneWVhcicsICd5Jyk7XG5cbiAgICAvLyBQUklPUklUSUVTXG5cbiAgICBhZGRVbml0UHJpb3JpdHkoJ3llYXInLCAxKTtcblxuICAgIC8vIFBBUlNJTkdcblxuICAgIGFkZFJlZ2V4VG9rZW4oJ1knLCAgICAgIG1hdGNoU2lnbmVkKTtcbiAgICBhZGRSZWdleFRva2VuKCdZWScsICAgICBtYXRjaDF0bzIsIG1hdGNoMik7XG4gICAgYWRkUmVnZXhUb2tlbignWVlZWScsICAgbWF0Y2gxdG80LCBtYXRjaDQpO1xuICAgIGFkZFJlZ2V4VG9rZW4oJ1lZWVlZJywgIG1hdGNoMXRvNiwgbWF0Y2g2KTtcbiAgICBhZGRSZWdleFRva2VuKCdZWVlZWVknLCBtYXRjaDF0bzYsIG1hdGNoNik7XG5cbiAgICBhZGRQYXJzZVRva2VuKFsnWVlZWVknLCAnWVlZWVlZJ10sIFlFQVIpO1xuICAgIGFkZFBhcnNlVG9rZW4oJ1lZWVknLCBmdW5jdGlvbiAoaW5wdXQsIGFycmF5KSB7XG4gICAgICAgIGFycmF5W1lFQVJdID0gaW5wdXQubGVuZ3RoID09PSAyID8gdXRpbHNfaG9va3NfX2hvb2tzLnBhcnNlVHdvRGlnaXRZZWFyKGlucHV0KSA6IHRvSW50KGlucHV0KTtcbiAgICB9KTtcbiAgICBhZGRQYXJzZVRva2VuKCdZWScsIGZ1bmN0aW9uIChpbnB1dCwgYXJyYXkpIHtcbiAgICAgICAgYXJyYXlbWUVBUl0gPSB1dGlsc19ob29rc19faG9va3MucGFyc2VUd29EaWdpdFllYXIoaW5wdXQpO1xuICAgIH0pO1xuICAgIGFkZFBhcnNlVG9rZW4oJ1knLCBmdW5jdGlvbiAoaW5wdXQsIGFycmF5KSB7XG4gICAgICAgIGFycmF5W1lFQVJdID0gcGFyc2VJbnQoaW5wdXQsIDEwKTtcbiAgICB9KTtcblxuICAgIC8vIEhFTFBFUlNcblxuICAgIGZ1bmN0aW9uIGRheXNJblllYXIoeWVhcikge1xuICAgICAgICByZXR1cm4gaXNMZWFwWWVhcih5ZWFyKSA/IDM2NiA6IDM2NTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBpc0xlYXBZZWFyKHllYXIpIHtcbiAgICAgICAgcmV0dXJuICh5ZWFyICUgNCA9PT0gMCAmJiB5ZWFyICUgMTAwICE9PSAwKSB8fCB5ZWFyICUgNDAwID09PSAwO1xuICAgIH1cblxuICAgIC8vIEhPT0tTXG5cbiAgICB1dGlsc19ob29rc19faG9va3MucGFyc2VUd29EaWdpdFllYXIgPSBmdW5jdGlvbiAoaW5wdXQpIHtcbiAgICAgICAgcmV0dXJuIHRvSW50KGlucHV0KSArICh0b0ludChpbnB1dCkgPiA2OCA/IDE5MDAgOiAyMDAwKTtcbiAgICB9O1xuXG4gICAgLy8gTU9NRU5UU1xuXG4gICAgdmFyIGdldFNldFllYXIgPSBtYWtlR2V0U2V0KCdGdWxsWWVhcicsIHRydWUpO1xuXG4gICAgZnVuY3Rpb24gZ2V0SXNMZWFwWWVhciAoKSB7XG4gICAgICAgIHJldHVybiBpc0xlYXBZZWFyKHRoaXMueWVhcigpKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjcmVhdGVEYXRlICh5LCBtLCBkLCBoLCBNLCBzLCBtcykge1xuICAgICAgICAvL2Nhbid0IGp1c3QgYXBwbHkoKSB0byBjcmVhdGUgYSBkYXRlOlxuICAgICAgICAvL2h0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMTgxMzQ4L2luc3RhbnRpYXRpbmctYS1qYXZhc2NyaXB0LW9iamVjdC1ieS1jYWxsaW5nLXByb3RvdHlwZS1jb25zdHJ1Y3Rvci1hcHBseVxuICAgICAgICB2YXIgZGF0ZSA9IG5ldyBEYXRlKHksIG0sIGQsIGgsIE0sIHMsIG1zKTtcblxuICAgICAgICAvL3RoZSBkYXRlIGNvbnN0cnVjdG9yIHJlbWFwcyB5ZWFycyAwLTk5IHRvIDE5MDAtMTk5OVxuICAgICAgICBpZiAoeSA8IDEwMCAmJiB5ID49IDAgJiYgaXNGaW5pdGUoZGF0ZS5nZXRGdWxsWWVhcigpKSkge1xuICAgICAgICAgICAgZGF0ZS5zZXRGdWxsWWVhcih5KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZGF0ZTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjcmVhdGVVVENEYXRlICh5KSB7XG4gICAgICAgIHZhciBkYXRlID0gbmV3IERhdGUoRGF0ZS5VVEMuYXBwbHkobnVsbCwgYXJndW1lbnRzKSk7XG5cbiAgICAgICAgLy90aGUgRGF0ZS5VVEMgZnVuY3Rpb24gcmVtYXBzIHllYXJzIDAtOTkgdG8gMTkwMC0xOTk5XG4gICAgICAgIGlmICh5IDwgMTAwICYmIHkgPj0gMCAmJiBpc0Zpbml0ZShkYXRlLmdldFVUQ0Z1bGxZZWFyKCkpKSB7XG4gICAgICAgICAgICBkYXRlLnNldFVUQ0Z1bGxZZWFyKHkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBkYXRlO1xuICAgIH1cblxuICAgIC8vIHN0YXJ0LW9mLWZpcnN0LXdlZWsgLSBzdGFydC1vZi15ZWFyXG4gICAgZnVuY3Rpb24gZmlyc3RXZWVrT2Zmc2V0KHllYXIsIGRvdywgZG95KSB7XG4gICAgICAgIHZhciAvLyBmaXJzdC13ZWVrIGRheSAtLSB3aGljaCBqYW51YXJ5IGlzIGFsd2F5cyBpbiB0aGUgZmlyc3Qgd2VlayAoNCBmb3IgaXNvLCAxIGZvciBvdGhlcilcbiAgICAgICAgICAgIGZ3ZCA9IDcgKyBkb3cgLSBkb3ksXG4gICAgICAgICAgICAvLyBmaXJzdC13ZWVrIGRheSBsb2NhbCB3ZWVrZGF5IC0tIHdoaWNoIGxvY2FsIHdlZWtkYXkgaXMgZndkXG4gICAgICAgICAgICBmd2RsdyA9ICg3ICsgY3JlYXRlVVRDRGF0ZSh5ZWFyLCAwLCBmd2QpLmdldFVUQ0RheSgpIC0gZG93KSAlIDc7XG5cbiAgICAgICAgcmV0dXJuIC1md2RsdyArIGZ3ZCAtIDE7XG4gICAgfVxuXG4gICAgLy9odHRwOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0lTT193ZWVrX2RhdGUjQ2FsY3VsYXRpbmdfYV9kYXRlX2dpdmVuX3RoZV95ZWFyLjJDX3dlZWtfbnVtYmVyX2FuZF93ZWVrZGF5XG4gICAgZnVuY3Rpb24gZGF5T2ZZZWFyRnJvbVdlZWtzKHllYXIsIHdlZWssIHdlZWtkYXksIGRvdywgZG95KSB7XG4gICAgICAgIHZhciBsb2NhbFdlZWtkYXkgPSAoNyArIHdlZWtkYXkgLSBkb3cpICUgNyxcbiAgICAgICAgICAgIHdlZWtPZmZzZXQgPSBmaXJzdFdlZWtPZmZzZXQoeWVhciwgZG93LCBkb3kpLFxuICAgICAgICAgICAgZGF5T2ZZZWFyID0gMSArIDcgKiAod2VlayAtIDEpICsgbG9jYWxXZWVrZGF5ICsgd2Vla09mZnNldCxcbiAgICAgICAgICAgIHJlc1llYXIsIHJlc0RheU9mWWVhcjtcblxuICAgICAgICBpZiAoZGF5T2ZZZWFyIDw9IDApIHtcbiAgICAgICAgICAgIHJlc1llYXIgPSB5ZWFyIC0gMTtcbiAgICAgICAgICAgIHJlc0RheU9mWWVhciA9IGRheXNJblllYXIocmVzWWVhcikgKyBkYXlPZlllYXI7XG4gICAgICAgIH0gZWxzZSBpZiAoZGF5T2ZZZWFyID4gZGF5c0luWWVhcih5ZWFyKSkge1xuICAgICAgICAgICAgcmVzWWVhciA9IHllYXIgKyAxO1xuICAgICAgICAgICAgcmVzRGF5T2ZZZWFyID0gZGF5T2ZZZWFyIC0gZGF5c0luWWVhcih5ZWFyKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJlc1llYXIgPSB5ZWFyO1xuICAgICAgICAgICAgcmVzRGF5T2ZZZWFyID0gZGF5T2ZZZWFyO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHllYXI6IHJlc1llYXIsXG4gICAgICAgICAgICBkYXlPZlllYXI6IHJlc0RheU9mWWVhclxuICAgICAgICB9O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHdlZWtPZlllYXIobW9tLCBkb3csIGRveSkge1xuICAgICAgICB2YXIgd2Vla09mZnNldCA9IGZpcnN0V2Vla09mZnNldChtb20ueWVhcigpLCBkb3csIGRveSksXG4gICAgICAgICAgICB3ZWVrID0gTWF0aC5mbG9vcigobW9tLmRheU9mWWVhcigpIC0gd2Vla09mZnNldCAtIDEpIC8gNykgKyAxLFxuICAgICAgICAgICAgcmVzV2VlaywgcmVzWWVhcjtcblxuICAgICAgICBpZiAod2VlayA8IDEpIHtcbiAgICAgICAgICAgIHJlc1llYXIgPSBtb20ueWVhcigpIC0gMTtcbiAgICAgICAgICAgIHJlc1dlZWsgPSB3ZWVrICsgd2Vla3NJblllYXIocmVzWWVhciwgZG93LCBkb3kpO1xuICAgICAgICB9IGVsc2UgaWYgKHdlZWsgPiB3ZWVrc0luWWVhcihtb20ueWVhcigpLCBkb3csIGRveSkpIHtcbiAgICAgICAgICAgIHJlc1dlZWsgPSB3ZWVrIC0gd2Vla3NJblllYXIobW9tLnllYXIoKSwgZG93LCBkb3kpO1xuICAgICAgICAgICAgcmVzWWVhciA9IG1vbS55ZWFyKCkgKyAxO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVzWWVhciA9IG1vbS55ZWFyKCk7XG4gICAgICAgICAgICByZXNXZWVrID0gd2VlaztcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB3ZWVrOiByZXNXZWVrLFxuICAgICAgICAgICAgeWVhcjogcmVzWWVhclxuICAgICAgICB9O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHdlZWtzSW5ZZWFyKHllYXIsIGRvdywgZG95KSB7XG4gICAgICAgIHZhciB3ZWVrT2Zmc2V0ID0gZmlyc3RXZWVrT2Zmc2V0KHllYXIsIGRvdywgZG95KSxcbiAgICAgICAgICAgIHdlZWtPZmZzZXROZXh0ID0gZmlyc3RXZWVrT2Zmc2V0KHllYXIgKyAxLCBkb3csIGRveSk7XG4gICAgICAgIHJldHVybiAoZGF5c0luWWVhcih5ZWFyKSAtIHdlZWtPZmZzZXQgKyB3ZWVrT2Zmc2V0TmV4dCkgLyA3O1xuICAgIH1cblxuICAgIC8vIEZPUk1BVFRJTkdcblxuICAgIGFkZEZvcm1hdFRva2VuKCd3JywgWyd3dycsIDJdLCAnd28nLCAnd2VlaycpO1xuICAgIGFkZEZvcm1hdFRva2VuKCdXJywgWydXVycsIDJdLCAnV28nLCAnaXNvV2VlaycpO1xuXG4gICAgLy8gQUxJQVNFU1xuXG4gICAgYWRkVW5pdEFsaWFzKCd3ZWVrJywgJ3cnKTtcbiAgICBhZGRVbml0QWxpYXMoJ2lzb1dlZWsnLCAnVycpO1xuXG4gICAgLy8gUFJJT1JJVElFU1xuXG4gICAgYWRkVW5pdFByaW9yaXR5KCd3ZWVrJywgNSk7XG4gICAgYWRkVW5pdFByaW9yaXR5KCdpc29XZWVrJywgNSk7XG5cbiAgICAvLyBQQVJTSU5HXG5cbiAgICBhZGRSZWdleFRva2VuKCd3JywgIG1hdGNoMXRvMik7XG4gICAgYWRkUmVnZXhUb2tlbignd3cnLCBtYXRjaDF0bzIsIG1hdGNoMik7XG4gICAgYWRkUmVnZXhUb2tlbignVycsICBtYXRjaDF0bzIpO1xuICAgIGFkZFJlZ2V4VG9rZW4oJ1dXJywgbWF0Y2gxdG8yLCBtYXRjaDIpO1xuXG4gICAgYWRkV2Vla1BhcnNlVG9rZW4oWyd3JywgJ3d3JywgJ1cnLCAnV1cnXSwgZnVuY3Rpb24gKGlucHV0LCB3ZWVrLCBjb25maWcsIHRva2VuKSB7XG4gICAgICAgIHdlZWtbdG9rZW4uc3Vic3RyKDAsIDEpXSA9IHRvSW50KGlucHV0KTtcbiAgICB9KTtcblxuICAgIC8vIEhFTFBFUlNcblxuICAgIC8vIExPQ0FMRVNcblxuICAgIGZ1bmN0aW9uIGxvY2FsZVdlZWsgKG1vbSkge1xuICAgICAgICByZXR1cm4gd2Vla09mWWVhcihtb20sIHRoaXMuX3dlZWsuZG93LCB0aGlzLl93ZWVrLmRveSkud2VlaztcbiAgICB9XG5cbiAgICB2YXIgZGVmYXVsdExvY2FsZVdlZWsgPSB7XG4gICAgICAgIGRvdyA6IDAsIC8vIFN1bmRheSBpcyB0aGUgZmlyc3QgZGF5IG9mIHRoZSB3ZWVrLlxuICAgICAgICBkb3kgOiA2ICAvLyBUaGUgd2VlayB0aGF0IGNvbnRhaW5zIEphbiAxc3QgaXMgdGhlIGZpcnN0IHdlZWsgb2YgdGhlIHllYXIuXG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIGxvY2FsZUZpcnN0RGF5T2ZXZWVrICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3dlZWsuZG93O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxvY2FsZUZpcnN0RGF5T2ZZZWFyICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3dlZWsuZG95O1xuICAgIH1cblxuICAgIC8vIE1PTUVOVFNcblxuICAgIGZ1bmN0aW9uIGdldFNldFdlZWsgKGlucHV0KSB7XG4gICAgICAgIHZhciB3ZWVrID0gdGhpcy5sb2NhbGVEYXRhKCkud2Vlayh0aGlzKTtcbiAgICAgICAgcmV0dXJuIGlucHV0ID09IG51bGwgPyB3ZWVrIDogdGhpcy5hZGQoKGlucHV0IC0gd2VlaykgKiA3LCAnZCcpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldFNldElTT1dlZWsgKGlucHV0KSB7XG4gICAgICAgIHZhciB3ZWVrID0gd2Vla09mWWVhcih0aGlzLCAxLCA0KS53ZWVrO1xuICAgICAgICByZXR1cm4gaW5wdXQgPT0gbnVsbCA/IHdlZWsgOiB0aGlzLmFkZCgoaW5wdXQgLSB3ZWVrKSAqIDcsICdkJyk7XG4gICAgfVxuXG4gICAgLy8gRk9STUFUVElOR1xuXG4gICAgYWRkRm9ybWF0VG9rZW4oJ2QnLCAwLCAnZG8nLCAnZGF5Jyk7XG5cbiAgICBhZGRGb3JtYXRUb2tlbignZGQnLCAwLCAwLCBmdW5jdGlvbiAoZm9ybWF0KSB7XG4gICAgICAgIHJldHVybiB0aGlzLmxvY2FsZURhdGEoKS53ZWVrZGF5c01pbih0aGlzLCBmb3JtYXQpO1xuICAgIH0pO1xuXG4gICAgYWRkRm9ybWF0VG9rZW4oJ2RkZCcsIDAsIDAsIGZ1bmN0aW9uIChmb3JtYXQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubG9jYWxlRGF0YSgpLndlZWtkYXlzU2hvcnQodGhpcywgZm9ybWF0KTtcbiAgICB9KTtcblxuICAgIGFkZEZvcm1hdFRva2VuKCdkZGRkJywgMCwgMCwgZnVuY3Rpb24gKGZvcm1hdCkge1xuICAgICAgICByZXR1cm4gdGhpcy5sb2NhbGVEYXRhKCkud2Vla2RheXModGhpcywgZm9ybWF0KTtcbiAgICB9KTtcblxuICAgIGFkZEZvcm1hdFRva2VuKCdlJywgMCwgMCwgJ3dlZWtkYXknKTtcbiAgICBhZGRGb3JtYXRUb2tlbignRScsIDAsIDAsICdpc29XZWVrZGF5Jyk7XG5cbiAgICAvLyBBTElBU0VTXG5cbiAgICBhZGRVbml0QWxpYXMoJ2RheScsICdkJyk7XG4gICAgYWRkVW5pdEFsaWFzKCd3ZWVrZGF5JywgJ2UnKTtcbiAgICBhZGRVbml0QWxpYXMoJ2lzb1dlZWtkYXknLCAnRScpO1xuXG4gICAgLy8gUFJJT1JJVFlcbiAgICBhZGRVbml0UHJpb3JpdHkoJ2RheScsIDExKTtcbiAgICBhZGRVbml0UHJpb3JpdHkoJ3dlZWtkYXknLCAxMSk7XG4gICAgYWRkVW5pdFByaW9yaXR5KCdpc29XZWVrZGF5JywgMTEpO1xuXG4gICAgLy8gUEFSU0lOR1xuXG4gICAgYWRkUmVnZXhUb2tlbignZCcsICAgIG1hdGNoMXRvMik7XG4gICAgYWRkUmVnZXhUb2tlbignZScsICAgIG1hdGNoMXRvMik7XG4gICAgYWRkUmVnZXhUb2tlbignRScsICAgIG1hdGNoMXRvMik7XG4gICAgYWRkUmVnZXhUb2tlbignZGQnLCAgIGZ1bmN0aW9uIChpc1N0cmljdCwgbG9jYWxlKSB7XG4gICAgICAgIHJldHVybiBsb2NhbGUud2Vla2RheXNNaW5SZWdleChpc1N0cmljdCk7XG4gICAgfSk7XG4gICAgYWRkUmVnZXhUb2tlbignZGRkJywgICBmdW5jdGlvbiAoaXNTdHJpY3QsIGxvY2FsZSkge1xuICAgICAgICByZXR1cm4gbG9jYWxlLndlZWtkYXlzU2hvcnRSZWdleChpc1N0cmljdCk7XG4gICAgfSk7XG4gICAgYWRkUmVnZXhUb2tlbignZGRkZCcsICAgZnVuY3Rpb24gKGlzU3RyaWN0LCBsb2NhbGUpIHtcbiAgICAgICAgcmV0dXJuIGxvY2FsZS53ZWVrZGF5c1JlZ2V4KGlzU3RyaWN0KTtcbiAgICB9KTtcblxuICAgIGFkZFdlZWtQYXJzZVRva2VuKFsnZGQnLCAnZGRkJywgJ2RkZGQnXSwgZnVuY3Rpb24gKGlucHV0LCB3ZWVrLCBjb25maWcsIHRva2VuKSB7XG4gICAgICAgIHZhciB3ZWVrZGF5ID0gY29uZmlnLl9sb2NhbGUud2Vla2RheXNQYXJzZShpbnB1dCwgdG9rZW4sIGNvbmZpZy5fc3RyaWN0KTtcbiAgICAgICAgLy8gaWYgd2UgZGlkbid0IGdldCBhIHdlZWtkYXkgbmFtZSwgbWFyayB0aGUgZGF0ZSBhcyBpbnZhbGlkXG4gICAgICAgIGlmICh3ZWVrZGF5ICE9IG51bGwpIHtcbiAgICAgICAgICAgIHdlZWsuZCA9IHdlZWtkYXk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBnZXRQYXJzaW5nRmxhZ3MoY29uZmlnKS5pbnZhbGlkV2Vla2RheSA9IGlucHV0O1xuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICBhZGRXZWVrUGFyc2VUb2tlbihbJ2QnLCAnZScsICdFJ10sIGZ1bmN0aW9uIChpbnB1dCwgd2VlaywgY29uZmlnLCB0b2tlbikge1xuICAgICAgICB3ZWVrW3Rva2VuXSA9IHRvSW50KGlucHV0KTtcbiAgICB9KTtcblxuICAgIC8vIEhFTFBFUlNcblxuICAgIGZ1bmN0aW9uIHBhcnNlV2Vla2RheShpbnB1dCwgbG9jYWxlKSB7XG4gICAgICAgIGlmICh0eXBlb2YgaW5wdXQgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICByZXR1cm4gaW5wdXQ7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIWlzTmFOKGlucHV0KSkge1xuICAgICAgICAgICAgcmV0dXJuIHBhcnNlSW50KGlucHV0LCAxMCk7XG4gICAgICAgIH1cblxuICAgICAgICBpbnB1dCA9IGxvY2FsZS53ZWVrZGF5c1BhcnNlKGlucHV0KTtcbiAgICAgICAgaWYgKHR5cGVvZiBpbnB1dCA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgICAgIHJldHVybiBpbnB1dDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBhcnNlSXNvV2Vla2RheShpbnB1dCwgbG9jYWxlKSB7XG4gICAgICAgIGlmICh0eXBlb2YgaW5wdXQgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICByZXR1cm4gbG9jYWxlLndlZWtkYXlzUGFyc2UoaW5wdXQpICUgNyB8fCA3O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBpc05hTihpbnB1dCkgPyBudWxsIDogaW5wdXQ7XG4gICAgfVxuXG4gICAgLy8gTE9DQUxFU1xuXG4gICAgdmFyIGRlZmF1bHRMb2NhbGVXZWVrZGF5cyA9ICdTdW5kYXlfTW9uZGF5X1R1ZXNkYXlfV2VkbmVzZGF5X1RodXJzZGF5X0ZyaWRheV9TYXR1cmRheScuc3BsaXQoJ18nKTtcbiAgICBmdW5jdGlvbiBsb2NhbGVXZWVrZGF5cyAobSwgZm9ybWF0KSB7XG4gICAgICAgIHJldHVybiBpc0FycmF5KHRoaXMuX3dlZWtkYXlzKSA/IHRoaXMuX3dlZWtkYXlzW20uZGF5KCldIDpcbiAgICAgICAgICAgIHRoaXMuX3dlZWtkYXlzW3RoaXMuX3dlZWtkYXlzLmlzRm9ybWF0LnRlc3QoZm9ybWF0KSA/ICdmb3JtYXQnIDogJ3N0YW5kYWxvbmUnXVttLmRheSgpXTtcbiAgICB9XG5cbiAgICB2YXIgZGVmYXVsdExvY2FsZVdlZWtkYXlzU2hvcnQgPSAnU3VuX01vbl9UdWVfV2VkX1RodV9GcmlfU2F0Jy5zcGxpdCgnXycpO1xuICAgIGZ1bmN0aW9uIGxvY2FsZVdlZWtkYXlzU2hvcnQgKG0pIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3dlZWtkYXlzU2hvcnRbbS5kYXkoKV07XG4gICAgfVxuXG4gICAgdmFyIGRlZmF1bHRMb2NhbGVXZWVrZGF5c01pbiA9ICdTdV9Nb19UdV9XZV9UaF9Gcl9TYScuc3BsaXQoJ18nKTtcbiAgICBmdW5jdGlvbiBsb2NhbGVXZWVrZGF5c01pbiAobSkge1xuICAgICAgICByZXR1cm4gdGhpcy5fd2Vla2RheXNNaW5bbS5kYXkoKV07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZGF5X29mX3dlZWtfX2hhbmRsZVN0cmljdFBhcnNlKHdlZWtkYXlOYW1lLCBmb3JtYXQsIHN0cmljdCkge1xuICAgICAgICB2YXIgaSwgaWksIG1vbSwgbGxjID0gd2Vla2RheU5hbWUudG9Mb2NhbGVMb3dlckNhc2UoKTtcbiAgICAgICAgaWYgKCF0aGlzLl93ZWVrZGF5c1BhcnNlKSB7XG4gICAgICAgICAgICB0aGlzLl93ZWVrZGF5c1BhcnNlID0gW107XG4gICAgICAgICAgICB0aGlzLl9zaG9ydFdlZWtkYXlzUGFyc2UgPSBbXTtcbiAgICAgICAgICAgIHRoaXMuX21pbldlZWtkYXlzUGFyc2UgPSBbXTtcblxuICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IDc7ICsraSkge1xuICAgICAgICAgICAgICAgIG1vbSA9IGNyZWF0ZV91dGNfX2NyZWF0ZVVUQyhbMjAwMCwgMV0pLmRheShpKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9taW5XZWVrZGF5c1BhcnNlW2ldID0gdGhpcy53ZWVrZGF5c01pbihtb20sICcnKS50b0xvY2FsZUxvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgICAgIHRoaXMuX3Nob3J0V2Vla2RheXNQYXJzZVtpXSA9IHRoaXMud2Vla2RheXNTaG9ydChtb20sICcnKS50b0xvY2FsZUxvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgICAgIHRoaXMuX3dlZWtkYXlzUGFyc2VbaV0gPSB0aGlzLndlZWtkYXlzKG1vbSwgJycpLnRvTG9jYWxlTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoc3RyaWN0KSB7XG4gICAgICAgICAgICBpZiAoZm9ybWF0ID09PSAnZGRkZCcpIHtcbiAgICAgICAgICAgICAgICBpaSA9IGluZGV4T2YuY2FsbCh0aGlzLl93ZWVrZGF5c1BhcnNlLCBsbGMpO1xuICAgICAgICAgICAgICAgIHJldHVybiBpaSAhPT0gLTEgPyBpaSA6IG51bGw7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGZvcm1hdCA9PT0gJ2RkZCcpIHtcbiAgICAgICAgICAgICAgICBpaSA9IGluZGV4T2YuY2FsbCh0aGlzLl9zaG9ydFdlZWtkYXlzUGFyc2UsIGxsYyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGlpICE9PSAtMSA/IGlpIDogbnVsbDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWkgPSBpbmRleE9mLmNhbGwodGhpcy5fbWluV2Vla2RheXNQYXJzZSwgbGxjKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gaWkgIT09IC0xID8gaWkgOiBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKGZvcm1hdCA9PT0gJ2RkZGQnKSB7XG4gICAgICAgICAgICAgICAgaWkgPSBpbmRleE9mLmNhbGwodGhpcy5fd2Vla2RheXNQYXJzZSwgbGxjKTtcbiAgICAgICAgICAgICAgICBpZiAoaWkgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBpaTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWkgPSBpbmRleE9mLmNhbGwodGhpcy5fc2hvcnRXZWVrZGF5c1BhcnNlLCBsbGMpO1xuICAgICAgICAgICAgICAgIGlmIChpaSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGlpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpaSA9IGluZGV4T2YuY2FsbCh0aGlzLl9taW5XZWVrZGF5c1BhcnNlLCBsbGMpO1xuICAgICAgICAgICAgICAgIHJldHVybiBpaSAhPT0gLTEgPyBpaSA6IG51bGw7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGZvcm1hdCA9PT0gJ2RkZCcpIHtcbiAgICAgICAgICAgICAgICBpaSA9IGluZGV4T2YuY2FsbCh0aGlzLl9zaG9ydFdlZWtkYXlzUGFyc2UsIGxsYyk7XG4gICAgICAgICAgICAgICAgaWYgKGlpICE9PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gaWk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlpID0gaW5kZXhPZi5jYWxsKHRoaXMuX3dlZWtkYXlzUGFyc2UsIGxsYyk7XG4gICAgICAgICAgICAgICAgaWYgKGlpICE9PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gaWk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlpID0gaW5kZXhPZi5jYWxsKHRoaXMuX21pbldlZWtkYXlzUGFyc2UsIGxsYyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGlpICE9PSAtMSA/IGlpIDogbnVsbDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWkgPSBpbmRleE9mLmNhbGwodGhpcy5fbWluV2Vla2RheXNQYXJzZSwgbGxjKTtcbiAgICAgICAgICAgICAgICBpZiAoaWkgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBpaTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWkgPSBpbmRleE9mLmNhbGwodGhpcy5fd2Vla2RheXNQYXJzZSwgbGxjKTtcbiAgICAgICAgICAgICAgICBpZiAoaWkgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBpaTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWkgPSBpbmRleE9mLmNhbGwodGhpcy5fc2hvcnRXZWVrZGF5c1BhcnNlLCBsbGMpO1xuICAgICAgICAgICAgICAgIHJldHVybiBpaSAhPT0gLTEgPyBpaSA6IG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsb2NhbGVXZWVrZGF5c1BhcnNlICh3ZWVrZGF5TmFtZSwgZm9ybWF0LCBzdHJpY3QpIHtcbiAgICAgICAgdmFyIGksIG1vbSwgcmVnZXg7XG5cbiAgICAgICAgaWYgKHRoaXMuX3dlZWtkYXlzUGFyc2VFeGFjdCkge1xuICAgICAgICAgICAgcmV0dXJuIGRheV9vZl93ZWVrX19oYW5kbGVTdHJpY3RQYXJzZS5jYWxsKHRoaXMsIHdlZWtkYXlOYW1lLCBmb3JtYXQsIHN0cmljdCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXRoaXMuX3dlZWtkYXlzUGFyc2UpIHtcbiAgICAgICAgICAgIHRoaXMuX3dlZWtkYXlzUGFyc2UgPSBbXTtcbiAgICAgICAgICAgIHRoaXMuX21pbldlZWtkYXlzUGFyc2UgPSBbXTtcbiAgICAgICAgICAgIHRoaXMuX3Nob3J0V2Vla2RheXNQYXJzZSA9IFtdO1xuICAgICAgICAgICAgdGhpcy5fZnVsbFdlZWtkYXlzUGFyc2UgPSBbXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCA3OyBpKyspIHtcbiAgICAgICAgICAgIC8vIG1ha2UgdGhlIHJlZ2V4IGlmIHdlIGRvbid0IGhhdmUgaXQgYWxyZWFkeVxuXG4gICAgICAgICAgICBtb20gPSBjcmVhdGVfdXRjX19jcmVhdGVVVEMoWzIwMDAsIDFdKS5kYXkoaSk7XG4gICAgICAgICAgICBpZiAoc3RyaWN0ICYmICF0aGlzLl9mdWxsV2Vla2RheXNQYXJzZVtpXSkge1xuICAgICAgICAgICAgICAgIHRoaXMuX2Z1bGxXZWVrZGF5c1BhcnNlW2ldID0gbmV3IFJlZ0V4cCgnXicgKyB0aGlzLndlZWtkYXlzKG1vbSwgJycpLnJlcGxhY2UoJy4nLCAnXFwuPycpICsgJyQnLCAnaScpO1xuICAgICAgICAgICAgICAgIHRoaXMuX3Nob3J0V2Vla2RheXNQYXJzZVtpXSA9IG5ldyBSZWdFeHAoJ14nICsgdGhpcy53ZWVrZGF5c1Nob3J0KG1vbSwgJycpLnJlcGxhY2UoJy4nLCAnXFwuPycpICsgJyQnLCAnaScpO1xuICAgICAgICAgICAgICAgIHRoaXMuX21pbldlZWtkYXlzUGFyc2VbaV0gPSBuZXcgUmVnRXhwKCdeJyArIHRoaXMud2Vla2RheXNNaW4obW9tLCAnJykucmVwbGFjZSgnLicsICdcXC4/JykgKyAnJCcsICdpJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIXRoaXMuX3dlZWtkYXlzUGFyc2VbaV0pIHtcbiAgICAgICAgICAgICAgICByZWdleCA9ICdeJyArIHRoaXMud2Vla2RheXMobW9tLCAnJykgKyAnfF4nICsgdGhpcy53ZWVrZGF5c1Nob3J0KG1vbSwgJycpICsgJ3xeJyArIHRoaXMud2Vla2RheXNNaW4obW9tLCAnJyk7XG4gICAgICAgICAgICAgICAgdGhpcy5fd2Vla2RheXNQYXJzZVtpXSA9IG5ldyBSZWdFeHAocmVnZXgucmVwbGFjZSgnLicsICcnKSwgJ2knKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIHRlc3QgdGhlIHJlZ2V4XG4gICAgICAgICAgICBpZiAoc3RyaWN0ICYmIGZvcm1hdCA9PT0gJ2RkZGQnICYmIHRoaXMuX2Z1bGxXZWVrZGF5c1BhcnNlW2ldLnRlc3Qod2Vla2RheU5hbWUpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHN0cmljdCAmJiBmb3JtYXQgPT09ICdkZGQnICYmIHRoaXMuX3Nob3J0V2Vla2RheXNQYXJzZVtpXS50ZXN0KHdlZWtkYXlOYW1lKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChzdHJpY3QgJiYgZm9ybWF0ID09PSAnZGQnICYmIHRoaXMuX21pbldlZWtkYXlzUGFyc2VbaV0udGVzdCh3ZWVrZGF5TmFtZSkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gaTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoIXN0cmljdCAmJiB0aGlzLl93ZWVrZGF5c1BhcnNlW2ldLnRlc3Qod2Vla2RheU5hbWUpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBNT01FTlRTXG5cbiAgICBmdW5jdGlvbiBnZXRTZXREYXlPZldlZWsgKGlucHV0KSB7XG4gICAgICAgIGlmICghdGhpcy5pc1ZhbGlkKCkpIHtcbiAgICAgICAgICAgIHJldHVybiBpbnB1dCAhPSBudWxsID8gdGhpcyA6IE5hTjtcbiAgICAgICAgfVxuICAgICAgICB2YXIgZGF5ID0gdGhpcy5faXNVVEMgPyB0aGlzLl9kLmdldFVUQ0RheSgpIDogdGhpcy5fZC5nZXREYXkoKTtcbiAgICAgICAgaWYgKGlucHV0ICE9IG51bGwpIHtcbiAgICAgICAgICAgIGlucHV0ID0gcGFyc2VXZWVrZGF5KGlucHV0LCB0aGlzLmxvY2FsZURhdGEoKSk7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5hZGQoaW5wdXQgLSBkYXksICdkJyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gZGF5O1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2V0U2V0TG9jYWxlRGF5T2ZXZWVrIChpbnB1dCkge1xuICAgICAgICBpZiAoIXRoaXMuaXNWYWxpZCgpKSB7XG4gICAgICAgICAgICByZXR1cm4gaW5wdXQgIT0gbnVsbCA/IHRoaXMgOiBOYU47XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHdlZWtkYXkgPSAodGhpcy5kYXkoKSArIDcgLSB0aGlzLmxvY2FsZURhdGEoKS5fd2Vlay5kb3cpICUgNztcbiAgICAgICAgcmV0dXJuIGlucHV0ID09IG51bGwgPyB3ZWVrZGF5IDogdGhpcy5hZGQoaW5wdXQgLSB3ZWVrZGF5LCAnZCcpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldFNldElTT0RheU9mV2VlayAoaW5wdXQpIHtcbiAgICAgICAgaWYgKCF0aGlzLmlzVmFsaWQoKSkge1xuICAgICAgICAgICAgcmV0dXJuIGlucHV0ICE9IG51bGwgPyB0aGlzIDogTmFOO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gYmVoYXZlcyB0aGUgc2FtZSBhcyBtb21lbnQjZGF5IGV4Y2VwdFxuICAgICAgICAvLyBhcyBhIGdldHRlciwgcmV0dXJucyA3IGluc3RlYWQgb2YgMCAoMS03IHJhbmdlIGluc3RlYWQgb2YgMC02KVxuICAgICAgICAvLyBhcyBhIHNldHRlciwgc3VuZGF5IHNob3VsZCBiZWxvbmcgdG8gdGhlIHByZXZpb3VzIHdlZWsuXG5cbiAgICAgICAgaWYgKGlucHV0ICE9IG51bGwpIHtcbiAgICAgICAgICAgIHZhciB3ZWVrZGF5ID0gcGFyc2VJc29XZWVrZGF5KGlucHV0LCB0aGlzLmxvY2FsZURhdGEoKSk7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5kYXkodGhpcy5kYXkoKSAlIDcgPyB3ZWVrZGF5IDogd2Vla2RheSAtIDcpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZGF5KCkgfHwgNztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHZhciBkZWZhdWx0V2Vla2RheXNSZWdleCA9IG1hdGNoV29yZDtcbiAgICBmdW5jdGlvbiB3ZWVrZGF5c1JlZ2V4IChpc1N0cmljdCkge1xuICAgICAgICBpZiAodGhpcy5fd2Vla2RheXNQYXJzZUV4YWN0KSB7XG4gICAgICAgICAgICBpZiAoIWhhc093blByb3AodGhpcywgJ193ZWVrZGF5c1JlZ2V4JykpIHtcbiAgICAgICAgICAgICAgICBjb21wdXRlV2Vla2RheXNQYXJzZS5jYWxsKHRoaXMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGlzU3RyaWN0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3dlZWtkYXlzU3RyaWN0UmVnZXg7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl93ZWVrZGF5c1JlZ2V4O1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKCFoYXNPd25Qcm9wKHRoaXMsICdfd2Vla2RheXNSZWdleCcpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fd2Vla2RheXNSZWdleCA9IGRlZmF1bHRXZWVrZGF5c1JlZ2V4O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3dlZWtkYXlzU3RyaWN0UmVnZXggJiYgaXNTdHJpY3QgP1xuICAgICAgICAgICAgICAgIHRoaXMuX3dlZWtkYXlzU3RyaWN0UmVnZXggOiB0aGlzLl93ZWVrZGF5c1JlZ2V4O1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgdmFyIGRlZmF1bHRXZWVrZGF5c1Nob3J0UmVnZXggPSBtYXRjaFdvcmQ7XG4gICAgZnVuY3Rpb24gd2Vla2RheXNTaG9ydFJlZ2V4IChpc1N0cmljdCkge1xuICAgICAgICBpZiAodGhpcy5fd2Vla2RheXNQYXJzZUV4YWN0KSB7XG4gICAgICAgICAgICBpZiAoIWhhc093blByb3AodGhpcywgJ193ZWVrZGF5c1JlZ2V4JykpIHtcbiAgICAgICAgICAgICAgICBjb21wdXRlV2Vla2RheXNQYXJzZS5jYWxsKHRoaXMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGlzU3RyaWN0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3dlZWtkYXlzU2hvcnRTdHJpY3RSZWdleDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3dlZWtkYXlzU2hvcnRSZWdleDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmICghaGFzT3duUHJvcCh0aGlzLCAnX3dlZWtkYXlzU2hvcnRSZWdleCcpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fd2Vla2RheXNTaG9ydFJlZ2V4ID0gZGVmYXVsdFdlZWtkYXlzU2hvcnRSZWdleDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0aGlzLl93ZWVrZGF5c1Nob3J0U3RyaWN0UmVnZXggJiYgaXNTdHJpY3QgP1xuICAgICAgICAgICAgICAgIHRoaXMuX3dlZWtkYXlzU2hvcnRTdHJpY3RSZWdleCA6IHRoaXMuX3dlZWtkYXlzU2hvcnRSZWdleDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHZhciBkZWZhdWx0V2Vla2RheXNNaW5SZWdleCA9IG1hdGNoV29yZDtcbiAgICBmdW5jdGlvbiB3ZWVrZGF5c01pblJlZ2V4IChpc1N0cmljdCkge1xuICAgICAgICBpZiAodGhpcy5fd2Vla2RheXNQYXJzZUV4YWN0KSB7XG4gICAgICAgICAgICBpZiAoIWhhc093blByb3AodGhpcywgJ193ZWVrZGF5c1JlZ2V4JykpIHtcbiAgICAgICAgICAgICAgICBjb21wdXRlV2Vla2RheXNQYXJzZS5jYWxsKHRoaXMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGlzU3RyaWN0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3dlZWtkYXlzTWluU3RyaWN0UmVnZXg7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl93ZWVrZGF5c01pblJlZ2V4O1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKCFoYXNPd25Qcm9wKHRoaXMsICdfd2Vla2RheXNNaW5SZWdleCcpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fd2Vla2RheXNNaW5SZWdleCA9IGRlZmF1bHRXZWVrZGF5c01pblJlZ2V4O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3dlZWtkYXlzTWluU3RyaWN0UmVnZXggJiYgaXNTdHJpY3QgP1xuICAgICAgICAgICAgICAgIHRoaXMuX3dlZWtkYXlzTWluU3RyaWN0UmVnZXggOiB0aGlzLl93ZWVrZGF5c01pblJlZ2V4O1xuICAgICAgICB9XG4gICAgfVxuXG5cbiAgICBmdW5jdGlvbiBjb21wdXRlV2Vla2RheXNQYXJzZSAoKSB7XG4gICAgICAgIGZ1bmN0aW9uIGNtcExlblJldihhLCBiKSB7XG4gICAgICAgICAgICByZXR1cm4gYi5sZW5ndGggLSBhLmxlbmd0aDtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBtaW5QaWVjZXMgPSBbXSwgc2hvcnRQaWVjZXMgPSBbXSwgbG9uZ1BpZWNlcyA9IFtdLCBtaXhlZFBpZWNlcyA9IFtdLFxuICAgICAgICAgICAgaSwgbW9tLCBtaW5wLCBzaG9ydHAsIGxvbmdwO1xuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgNzsgaSsrKSB7XG4gICAgICAgICAgICAvLyBtYWtlIHRoZSByZWdleCBpZiB3ZSBkb24ndCBoYXZlIGl0IGFscmVhZHlcbiAgICAgICAgICAgIG1vbSA9IGNyZWF0ZV91dGNfX2NyZWF0ZVVUQyhbMjAwMCwgMV0pLmRheShpKTtcbiAgICAgICAgICAgIG1pbnAgPSB0aGlzLndlZWtkYXlzTWluKG1vbSwgJycpO1xuICAgICAgICAgICAgc2hvcnRwID0gdGhpcy53ZWVrZGF5c1Nob3J0KG1vbSwgJycpO1xuICAgICAgICAgICAgbG9uZ3AgPSB0aGlzLndlZWtkYXlzKG1vbSwgJycpO1xuICAgICAgICAgICAgbWluUGllY2VzLnB1c2gobWlucCk7XG4gICAgICAgICAgICBzaG9ydFBpZWNlcy5wdXNoKHNob3J0cCk7XG4gICAgICAgICAgICBsb25nUGllY2VzLnB1c2gobG9uZ3ApO1xuICAgICAgICAgICAgbWl4ZWRQaWVjZXMucHVzaChtaW5wKTtcbiAgICAgICAgICAgIG1peGVkUGllY2VzLnB1c2goc2hvcnRwKTtcbiAgICAgICAgICAgIG1peGVkUGllY2VzLnB1c2gobG9uZ3ApO1xuICAgICAgICB9XG4gICAgICAgIC8vIFNvcnRpbmcgbWFrZXMgc3VyZSBpZiBvbmUgd2Vla2RheSAob3IgYWJicikgaXMgYSBwcmVmaXggb2YgYW5vdGhlciBpdFxuICAgICAgICAvLyB3aWxsIG1hdGNoIHRoZSBsb25nZXIgcGllY2UuXG4gICAgICAgIG1pblBpZWNlcy5zb3J0KGNtcExlblJldik7XG4gICAgICAgIHNob3J0UGllY2VzLnNvcnQoY21wTGVuUmV2KTtcbiAgICAgICAgbG9uZ1BpZWNlcy5zb3J0KGNtcExlblJldik7XG4gICAgICAgIG1peGVkUGllY2VzLnNvcnQoY21wTGVuUmV2KTtcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IDc7IGkrKykge1xuICAgICAgICAgICAgc2hvcnRQaWVjZXNbaV0gPSByZWdleEVzY2FwZShzaG9ydFBpZWNlc1tpXSk7XG4gICAgICAgICAgICBsb25nUGllY2VzW2ldID0gcmVnZXhFc2NhcGUobG9uZ1BpZWNlc1tpXSk7XG4gICAgICAgICAgICBtaXhlZFBpZWNlc1tpXSA9IHJlZ2V4RXNjYXBlKG1peGVkUGllY2VzW2ldKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX3dlZWtkYXlzUmVnZXggPSBuZXcgUmVnRXhwKCdeKCcgKyBtaXhlZFBpZWNlcy5qb2luKCd8JykgKyAnKScsICdpJyk7XG4gICAgICAgIHRoaXMuX3dlZWtkYXlzU2hvcnRSZWdleCA9IHRoaXMuX3dlZWtkYXlzUmVnZXg7XG4gICAgICAgIHRoaXMuX3dlZWtkYXlzTWluUmVnZXggPSB0aGlzLl93ZWVrZGF5c1JlZ2V4O1xuXG4gICAgICAgIHRoaXMuX3dlZWtkYXlzU3RyaWN0UmVnZXggPSBuZXcgUmVnRXhwKCdeKCcgKyBsb25nUGllY2VzLmpvaW4oJ3wnKSArICcpJywgJ2knKTtcbiAgICAgICAgdGhpcy5fd2Vla2RheXNTaG9ydFN0cmljdFJlZ2V4ID0gbmV3IFJlZ0V4cCgnXignICsgc2hvcnRQaWVjZXMuam9pbignfCcpICsgJyknLCAnaScpO1xuICAgICAgICB0aGlzLl93ZWVrZGF5c01pblN0cmljdFJlZ2V4ID0gbmV3IFJlZ0V4cCgnXignICsgbWluUGllY2VzLmpvaW4oJ3wnKSArICcpJywgJ2knKTtcbiAgICB9XG5cbiAgICAvLyBGT1JNQVRUSU5HXG5cbiAgICBmdW5jdGlvbiBoRm9ybWF0KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5ob3VycygpICUgMTIgfHwgMTI7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24ga0Zvcm1hdCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuaG91cnMoKSB8fCAyNDtcbiAgICB9XG5cbiAgICBhZGRGb3JtYXRUb2tlbignSCcsIFsnSEgnLCAyXSwgMCwgJ2hvdXInKTtcbiAgICBhZGRGb3JtYXRUb2tlbignaCcsIFsnaGgnLCAyXSwgMCwgaEZvcm1hdCk7XG4gICAgYWRkRm9ybWF0VG9rZW4oJ2snLCBbJ2trJywgMl0sIDAsIGtGb3JtYXQpO1xuXG4gICAgYWRkRm9ybWF0VG9rZW4oJ2htbScsIDAsIDAsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuICcnICsgaEZvcm1hdC5hcHBseSh0aGlzKSArIHplcm9GaWxsKHRoaXMubWludXRlcygpLCAyKTtcbiAgICB9KTtcblxuICAgIGFkZEZvcm1hdFRva2VuKCdobW1zcycsIDAsIDAsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuICcnICsgaEZvcm1hdC5hcHBseSh0aGlzKSArIHplcm9GaWxsKHRoaXMubWludXRlcygpLCAyKSArXG4gICAgICAgICAgICB6ZXJvRmlsbCh0aGlzLnNlY29uZHMoKSwgMik7XG4gICAgfSk7XG5cbiAgICBhZGRGb3JtYXRUb2tlbignSG1tJywgMCwgMCwgZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gJycgKyB0aGlzLmhvdXJzKCkgKyB6ZXJvRmlsbCh0aGlzLm1pbnV0ZXMoKSwgMik7XG4gICAgfSk7XG5cbiAgICBhZGRGb3JtYXRUb2tlbignSG1tc3MnLCAwLCAwLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiAnJyArIHRoaXMuaG91cnMoKSArIHplcm9GaWxsKHRoaXMubWludXRlcygpLCAyKSArXG4gICAgICAgICAgICB6ZXJvRmlsbCh0aGlzLnNlY29uZHMoKSwgMik7XG4gICAgfSk7XG5cbiAgICBmdW5jdGlvbiBtZXJpZGllbSAodG9rZW4sIGxvd2VyY2FzZSkge1xuICAgICAgICBhZGRGb3JtYXRUb2tlbih0b2tlbiwgMCwgMCwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMubG9jYWxlRGF0YSgpLm1lcmlkaWVtKHRoaXMuaG91cnMoKSwgdGhpcy5taW51dGVzKCksIGxvd2VyY2FzZSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIG1lcmlkaWVtKCdhJywgdHJ1ZSk7XG4gICAgbWVyaWRpZW0oJ0EnLCBmYWxzZSk7XG5cbiAgICAvLyBBTElBU0VTXG5cbiAgICBhZGRVbml0QWxpYXMoJ2hvdXInLCAnaCcpO1xuXG4gICAgLy8gUFJJT1JJVFlcbiAgICBhZGRVbml0UHJpb3JpdHkoJ2hvdXInLCAxMyk7XG5cbiAgICAvLyBQQVJTSU5HXG5cbiAgICBmdW5jdGlvbiBtYXRjaE1lcmlkaWVtIChpc1N0cmljdCwgbG9jYWxlKSB7XG4gICAgICAgIHJldHVybiBsb2NhbGUuX21lcmlkaWVtUGFyc2U7XG4gICAgfVxuXG4gICAgYWRkUmVnZXhUb2tlbignYScsICBtYXRjaE1lcmlkaWVtKTtcbiAgICBhZGRSZWdleFRva2VuKCdBJywgIG1hdGNoTWVyaWRpZW0pO1xuICAgIGFkZFJlZ2V4VG9rZW4oJ0gnLCAgbWF0Y2gxdG8yKTtcbiAgICBhZGRSZWdleFRva2VuKCdoJywgIG1hdGNoMXRvMik7XG4gICAgYWRkUmVnZXhUb2tlbignSEgnLCBtYXRjaDF0bzIsIG1hdGNoMik7XG4gICAgYWRkUmVnZXhUb2tlbignaGgnLCBtYXRjaDF0bzIsIG1hdGNoMik7XG5cbiAgICBhZGRSZWdleFRva2VuKCdobW0nLCBtYXRjaDN0bzQpO1xuICAgIGFkZFJlZ2V4VG9rZW4oJ2htbXNzJywgbWF0Y2g1dG82KTtcbiAgICBhZGRSZWdleFRva2VuKCdIbW0nLCBtYXRjaDN0bzQpO1xuICAgIGFkZFJlZ2V4VG9rZW4oJ0htbXNzJywgbWF0Y2g1dG82KTtcblxuICAgIGFkZFBhcnNlVG9rZW4oWydIJywgJ0hIJ10sIEhPVVIpO1xuICAgIGFkZFBhcnNlVG9rZW4oWydhJywgJ0EnXSwgZnVuY3Rpb24gKGlucHV0LCBhcnJheSwgY29uZmlnKSB7XG4gICAgICAgIGNvbmZpZy5faXNQbSA9IGNvbmZpZy5fbG9jYWxlLmlzUE0oaW5wdXQpO1xuICAgICAgICBjb25maWcuX21lcmlkaWVtID0gaW5wdXQ7XG4gICAgfSk7XG4gICAgYWRkUGFyc2VUb2tlbihbJ2gnLCAnaGgnXSwgZnVuY3Rpb24gKGlucHV0LCBhcnJheSwgY29uZmlnKSB7XG4gICAgICAgIGFycmF5W0hPVVJdID0gdG9JbnQoaW5wdXQpO1xuICAgICAgICBnZXRQYXJzaW5nRmxhZ3MoY29uZmlnKS5iaWdIb3VyID0gdHJ1ZTtcbiAgICB9KTtcbiAgICBhZGRQYXJzZVRva2VuKCdobW0nLCBmdW5jdGlvbiAoaW5wdXQsIGFycmF5LCBjb25maWcpIHtcbiAgICAgICAgdmFyIHBvcyA9IGlucHV0Lmxlbmd0aCAtIDI7XG4gICAgICAgIGFycmF5W0hPVVJdID0gdG9JbnQoaW5wdXQuc3Vic3RyKDAsIHBvcykpO1xuICAgICAgICBhcnJheVtNSU5VVEVdID0gdG9JbnQoaW5wdXQuc3Vic3RyKHBvcykpO1xuICAgICAgICBnZXRQYXJzaW5nRmxhZ3MoY29uZmlnKS5iaWdIb3VyID0gdHJ1ZTtcbiAgICB9KTtcbiAgICBhZGRQYXJzZVRva2VuKCdobW1zcycsIGZ1bmN0aW9uIChpbnB1dCwgYXJyYXksIGNvbmZpZykge1xuICAgICAgICB2YXIgcG9zMSA9IGlucHV0Lmxlbmd0aCAtIDQ7XG4gICAgICAgIHZhciBwb3MyID0gaW5wdXQubGVuZ3RoIC0gMjtcbiAgICAgICAgYXJyYXlbSE9VUl0gPSB0b0ludChpbnB1dC5zdWJzdHIoMCwgcG9zMSkpO1xuICAgICAgICBhcnJheVtNSU5VVEVdID0gdG9JbnQoaW5wdXQuc3Vic3RyKHBvczEsIDIpKTtcbiAgICAgICAgYXJyYXlbU0VDT05EXSA9IHRvSW50KGlucHV0LnN1YnN0cihwb3MyKSk7XG4gICAgICAgIGdldFBhcnNpbmdGbGFncyhjb25maWcpLmJpZ0hvdXIgPSB0cnVlO1xuICAgIH0pO1xuICAgIGFkZFBhcnNlVG9rZW4oJ0htbScsIGZ1bmN0aW9uIChpbnB1dCwgYXJyYXksIGNvbmZpZykge1xuICAgICAgICB2YXIgcG9zID0gaW5wdXQubGVuZ3RoIC0gMjtcbiAgICAgICAgYXJyYXlbSE9VUl0gPSB0b0ludChpbnB1dC5zdWJzdHIoMCwgcG9zKSk7XG4gICAgICAgIGFycmF5W01JTlVURV0gPSB0b0ludChpbnB1dC5zdWJzdHIocG9zKSk7XG4gICAgfSk7XG4gICAgYWRkUGFyc2VUb2tlbignSG1tc3MnLCBmdW5jdGlvbiAoaW5wdXQsIGFycmF5LCBjb25maWcpIHtcbiAgICAgICAgdmFyIHBvczEgPSBpbnB1dC5sZW5ndGggLSA0O1xuICAgICAgICB2YXIgcG9zMiA9IGlucHV0Lmxlbmd0aCAtIDI7XG4gICAgICAgIGFycmF5W0hPVVJdID0gdG9JbnQoaW5wdXQuc3Vic3RyKDAsIHBvczEpKTtcbiAgICAgICAgYXJyYXlbTUlOVVRFXSA9IHRvSW50KGlucHV0LnN1YnN0cihwb3MxLCAyKSk7XG4gICAgICAgIGFycmF5W1NFQ09ORF0gPSB0b0ludChpbnB1dC5zdWJzdHIocG9zMikpO1xuICAgIH0pO1xuXG4gICAgLy8gTE9DQUxFU1xuXG4gICAgZnVuY3Rpb24gbG9jYWxlSXNQTSAoaW5wdXQpIHtcbiAgICAgICAgLy8gSUU4IFF1aXJrcyBNb2RlICYgSUU3IFN0YW5kYXJkcyBNb2RlIGRvIG5vdCBhbGxvdyBhY2Nlc3Npbmcgc3RyaW5ncyBsaWtlIGFycmF5c1xuICAgICAgICAvLyBVc2luZyBjaGFyQXQgc2hvdWxkIGJlIG1vcmUgY29tcGF0aWJsZS5cbiAgICAgICAgcmV0dXJuICgoaW5wdXQgKyAnJykudG9Mb3dlckNhc2UoKS5jaGFyQXQoMCkgPT09ICdwJyk7XG4gICAgfVxuXG4gICAgdmFyIGRlZmF1bHRMb2NhbGVNZXJpZGllbVBhcnNlID0gL1thcF1cXC4/bT9cXC4/L2k7XG4gICAgZnVuY3Rpb24gbG9jYWxlTWVyaWRpZW0gKGhvdXJzLCBtaW51dGVzLCBpc0xvd2VyKSB7XG4gICAgICAgIGlmIChob3VycyA+IDExKSB7XG4gICAgICAgICAgICByZXR1cm4gaXNMb3dlciA/ICdwbScgOiAnUE0nO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIGlzTG93ZXIgPyAnYW0nIDogJ0FNJztcbiAgICAgICAgfVxuICAgIH1cblxuXG4gICAgLy8gTU9NRU5UU1xuXG4gICAgLy8gU2V0dGluZyB0aGUgaG91ciBzaG91bGQga2VlcCB0aGUgdGltZSwgYmVjYXVzZSB0aGUgdXNlciBleHBsaWNpdGx5XG4gICAgLy8gc3BlY2lmaWVkIHdoaWNoIGhvdXIgaGUgd2FudHMuIFNvIHRyeWluZyB0byBtYWludGFpbiB0aGUgc2FtZSBob3VyIChpblxuICAgIC8vIGEgbmV3IHRpbWV6b25lKSBtYWtlcyBzZW5zZS4gQWRkaW5nL3N1YnRyYWN0aW5nIGhvdXJzIGRvZXMgbm90IGZvbGxvd1xuICAgIC8vIHRoaXMgcnVsZS5cbiAgICB2YXIgZ2V0U2V0SG91ciA9IG1ha2VHZXRTZXQoJ0hvdXJzJywgdHJ1ZSk7XG5cbiAgICB2YXIgYmFzZUNvbmZpZyA9IHtcbiAgICAgICAgY2FsZW5kYXI6IGRlZmF1bHRDYWxlbmRhcixcbiAgICAgICAgbG9uZ0RhdGVGb3JtYXQ6IGRlZmF1bHRMb25nRGF0ZUZvcm1hdCxcbiAgICAgICAgaW52YWxpZERhdGU6IGRlZmF1bHRJbnZhbGlkRGF0ZSxcbiAgICAgICAgb3JkaW5hbDogZGVmYXVsdE9yZGluYWwsXG4gICAgICAgIG9yZGluYWxQYXJzZTogZGVmYXVsdE9yZGluYWxQYXJzZSxcbiAgICAgICAgcmVsYXRpdmVUaW1lOiBkZWZhdWx0UmVsYXRpdmVUaW1lLFxuXG4gICAgICAgIG1vbnRoczogZGVmYXVsdExvY2FsZU1vbnRocyxcbiAgICAgICAgbW9udGhzU2hvcnQ6IGRlZmF1bHRMb2NhbGVNb250aHNTaG9ydCxcblxuICAgICAgICB3ZWVrOiBkZWZhdWx0TG9jYWxlV2VlayxcblxuICAgICAgICB3ZWVrZGF5czogZGVmYXVsdExvY2FsZVdlZWtkYXlzLFxuICAgICAgICB3ZWVrZGF5c01pbjogZGVmYXVsdExvY2FsZVdlZWtkYXlzTWluLFxuICAgICAgICB3ZWVrZGF5c1Nob3J0OiBkZWZhdWx0TG9jYWxlV2Vla2RheXNTaG9ydCxcblxuICAgICAgICBtZXJpZGllbVBhcnNlOiBkZWZhdWx0TG9jYWxlTWVyaWRpZW1QYXJzZVxuICAgIH07XG5cbiAgICAvLyBpbnRlcm5hbCBzdG9yYWdlIGZvciBsb2NhbGUgY29uZmlnIGZpbGVzXG4gICAgdmFyIGxvY2FsZXMgPSB7fTtcbiAgICB2YXIgZ2xvYmFsTG9jYWxlO1xuXG4gICAgZnVuY3Rpb24gbm9ybWFsaXplTG9jYWxlKGtleSkge1xuICAgICAgICByZXR1cm4ga2V5ID8ga2V5LnRvTG93ZXJDYXNlKCkucmVwbGFjZSgnXycsICctJykgOiBrZXk7XG4gICAgfVxuXG4gICAgLy8gcGljayB0aGUgbG9jYWxlIGZyb20gdGhlIGFycmF5XG4gICAgLy8gdHJ5IFsnZW4tYXUnLCAnZW4tZ2InXSBhcyAnZW4tYXUnLCAnZW4tZ2InLCAnZW4nLCBhcyBpbiBtb3ZlIHRocm91Z2ggdGhlIGxpc3QgdHJ5aW5nIGVhY2hcbiAgICAvLyBzdWJzdHJpbmcgZnJvbSBtb3N0IHNwZWNpZmljIHRvIGxlYXN0LCBidXQgbW92ZSB0byB0aGUgbmV4dCBhcnJheSBpdGVtIGlmIGl0J3MgYSBtb3JlIHNwZWNpZmljIHZhcmlhbnQgdGhhbiB0aGUgY3VycmVudCByb290XG4gICAgZnVuY3Rpb24gY2hvb3NlTG9jYWxlKG5hbWVzKSB7XG4gICAgICAgIHZhciBpID0gMCwgaiwgbmV4dCwgbG9jYWxlLCBzcGxpdDtcblxuICAgICAgICB3aGlsZSAoaSA8IG5hbWVzLmxlbmd0aCkge1xuICAgICAgICAgICAgc3BsaXQgPSBub3JtYWxpemVMb2NhbGUobmFtZXNbaV0pLnNwbGl0KCctJyk7XG4gICAgICAgICAgICBqID0gc3BsaXQubGVuZ3RoO1xuICAgICAgICAgICAgbmV4dCA9IG5vcm1hbGl6ZUxvY2FsZShuYW1lc1tpICsgMV0pO1xuICAgICAgICAgICAgbmV4dCA9IG5leHQgPyBuZXh0LnNwbGl0KCctJykgOiBudWxsO1xuICAgICAgICAgICAgd2hpbGUgKGogPiAwKSB7XG4gICAgICAgICAgICAgICAgbG9jYWxlID0gbG9hZExvY2FsZShzcGxpdC5zbGljZSgwLCBqKS5qb2luKCctJykpO1xuICAgICAgICAgICAgICAgIGlmIChsb2NhbGUpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGxvY2FsZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKG5leHQgJiYgbmV4dC5sZW5ndGggPj0gaiAmJiBjb21wYXJlQXJyYXlzKHNwbGl0LCBuZXh0LCB0cnVlKSA+PSBqIC0gMSkge1xuICAgICAgICAgICAgICAgICAgICAvL3RoZSBuZXh0IGFycmF5IGl0ZW0gaXMgYmV0dGVyIHRoYW4gYSBzaGFsbG93ZXIgc3Vic3RyaW5nIG9mIHRoaXMgb25lXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBqLS07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpKys7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbG9hZExvY2FsZShuYW1lKSB7XG4gICAgICAgIHZhciBvbGRMb2NhbGUgPSBudWxsO1xuICAgICAgICAvLyBUT0RPOiBGaW5kIGEgYmV0dGVyIHdheSB0byByZWdpc3RlciBhbmQgbG9hZCBhbGwgdGhlIGxvY2FsZXMgaW4gTm9kZVxuICAgICAgICBpZiAoIWxvY2FsZXNbbmFtZV0gJiYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnKSAmJlxuICAgICAgICAgICAgICAgIG1vZHVsZSAmJiBtb2R1bGUuZXhwb3J0cykge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBvbGRMb2NhbGUgPSBnbG9iYWxMb2NhbGUuX2FiYnI7XG4gICAgICAgICAgICAgICAgcmVxdWlyZSgnLi9sb2NhbGUvJyArIG5hbWUpO1xuICAgICAgICAgICAgICAgIC8vIGJlY2F1c2UgZGVmaW5lTG9jYWxlIGN1cnJlbnRseSBhbHNvIHNldHMgdGhlIGdsb2JhbCBsb2NhbGUsIHdlXG4gICAgICAgICAgICAgICAgLy8gd2FudCB0byB1bmRvIHRoYXQgZm9yIGxhenkgbG9hZGVkIGxvY2FsZXNcbiAgICAgICAgICAgICAgICBsb2NhbGVfbG9jYWxlc19fZ2V0U2V0R2xvYmFsTG9jYWxlKG9sZExvY2FsZSk7XG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7IH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbG9jYWxlc1tuYW1lXTtcbiAgICB9XG5cbiAgICAvLyBUaGlzIGZ1bmN0aW9uIHdpbGwgbG9hZCBsb2NhbGUgYW5kIHRoZW4gc2V0IHRoZSBnbG9iYWwgbG9jYWxlLiAgSWZcbiAgICAvLyBubyBhcmd1bWVudHMgYXJlIHBhc3NlZCBpbiwgaXQgd2lsbCBzaW1wbHkgcmV0dXJuIHRoZSBjdXJyZW50IGdsb2JhbFxuICAgIC8vIGxvY2FsZSBrZXkuXG4gICAgZnVuY3Rpb24gbG9jYWxlX2xvY2FsZXNfX2dldFNldEdsb2JhbExvY2FsZSAoa2V5LCB2YWx1ZXMpIHtcbiAgICAgICAgdmFyIGRhdGE7XG4gICAgICAgIGlmIChrZXkpIHtcbiAgICAgICAgICAgIGlmIChpc1VuZGVmaW5lZCh2YWx1ZXMpKSB7XG4gICAgICAgICAgICAgICAgZGF0YSA9IGxvY2FsZV9sb2NhbGVzX19nZXRMb2NhbGUoa2V5KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGRhdGEgPSBkZWZpbmVMb2NhbGUoa2V5LCB2YWx1ZXMpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoZGF0YSkge1xuICAgICAgICAgICAgICAgIC8vIG1vbWVudC5kdXJhdGlvbi5fbG9jYWxlID0gbW9tZW50Ll9sb2NhbGUgPSBkYXRhO1xuICAgICAgICAgICAgICAgIGdsb2JhbExvY2FsZSA9IGRhdGE7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZ2xvYmFsTG9jYWxlLl9hYmJyO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGRlZmluZUxvY2FsZSAobmFtZSwgY29uZmlnKSB7XG4gICAgICAgIGlmIChjb25maWcgIT09IG51bGwpIHtcbiAgICAgICAgICAgIHZhciBwYXJlbnRDb25maWcgPSBiYXNlQ29uZmlnO1xuICAgICAgICAgICAgY29uZmlnLmFiYnIgPSBuYW1lO1xuICAgICAgICAgICAgaWYgKGxvY2FsZXNbbmFtZV0gIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGRlcHJlY2F0ZVNpbXBsZSgnZGVmaW5lTG9jYWxlT3ZlcnJpZGUnLFxuICAgICAgICAgICAgICAgICAgICAgICAgJ3VzZSBtb21lbnQudXBkYXRlTG9jYWxlKGxvY2FsZU5hbWUsIGNvbmZpZykgdG8gY2hhbmdlICcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJ2FuIGV4aXN0aW5nIGxvY2FsZS4gbW9tZW50LmRlZmluZUxvY2FsZShsb2NhbGVOYW1lLCAnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICdjb25maWcpIHNob3VsZCBvbmx5IGJlIHVzZWQgZm9yIGNyZWF0aW5nIGEgbmV3IGxvY2FsZSAnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICdTZWUgaHR0cDovL21vbWVudGpzLmNvbS9ndWlkZXMvIy93YXJuaW5ncy9kZWZpbmUtbG9jYWxlLyBmb3IgbW9yZSBpbmZvLicpO1xuICAgICAgICAgICAgICAgIHBhcmVudENvbmZpZyA9IGxvY2FsZXNbbmFtZV0uX2NvbmZpZztcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoY29uZmlnLnBhcmVudExvY2FsZSAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgaWYgKGxvY2FsZXNbY29uZmlnLnBhcmVudExvY2FsZV0gIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICBwYXJlbnRDb25maWcgPSBsb2NhbGVzW2NvbmZpZy5wYXJlbnRMb2NhbGVdLl9jb25maWc7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gdHJlYXQgYXMgaWYgdGhlcmUgaXMgbm8gYmFzZSBjb25maWdcbiAgICAgICAgICAgICAgICAgICAgZGVwcmVjYXRlU2ltcGxlKCdwYXJlbnRMb2NhbGVVbmRlZmluZWQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICdzcGVjaWZpZWQgcGFyZW50TG9jYWxlIGlzIG5vdCBkZWZpbmVkIHlldC4gU2VlIGh0dHA6Ly9tb21lbnRqcy5jb20vZ3VpZGVzLyMvd2FybmluZ3MvcGFyZW50LWxvY2FsZS8nKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsb2NhbGVzW25hbWVdID0gbmV3IExvY2FsZShtZXJnZUNvbmZpZ3MocGFyZW50Q29uZmlnLCBjb25maWcpKTtcblxuICAgICAgICAgICAgLy8gYmFja3dhcmRzIGNvbXBhdCBmb3Igbm93OiBhbHNvIHNldCB0aGUgbG9jYWxlXG4gICAgICAgICAgICBsb2NhbGVfbG9jYWxlc19fZ2V0U2V0R2xvYmFsTG9jYWxlKG5hbWUpO1xuXG4gICAgICAgICAgICByZXR1cm4gbG9jYWxlc1tuYW1lXTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIHVzZWZ1bCBmb3IgdGVzdGluZ1xuICAgICAgICAgICAgZGVsZXRlIGxvY2FsZXNbbmFtZV07XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIHVwZGF0ZUxvY2FsZShuYW1lLCBjb25maWcpIHtcbiAgICAgICAgaWYgKGNvbmZpZyAhPSBudWxsKSB7XG4gICAgICAgICAgICB2YXIgbG9jYWxlLCBwYXJlbnRDb25maWcgPSBiYXNlQ29uZmlnO1xuICAgICAgICAgICAgLy8gTUVSR0VcbiAgICAgICAgICAgIGlmIChsb2NhbGVzW25hbWVdICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICBwYXJlbnRDb25maWcgPSBsb2NhbGVzW25hbWVdLl9jb25maWc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25maWcgPSBtZXJnZUNvbmZpZ3MocGFyZW50Q29uZmlnLCBjb25maWcpO1xuICAgICAgICAgICAgbG9jYWxlID0gbmV3IExvY2FsZShjb25maWcpO1xuICAgICAgICAgICAgbG9jYWxlLnBhcmVudExvY2FsZSA9IGxvY2FsZXNbbmFtZV07XG4gICAgICAgICAgICBsb2NhbGVzW25hbWVdID0gbG9jYWxlO1xuXG4gICAgICAgICAgICAvLyBiYWNrd2FyZHMgY29tcGF0IGZvciBub3c6IGFsc28gc2V0IHRoZSBsb2NhbGVcbiAgICAgICAgICAgIGxvY2FsZV9sb2NhbGVzX19nZXRTZXRHbG9iYWxMb2NhbGUobmFtZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBwYXNzIG51bGwgZm9yIGNvbmZpZyB0byB1bnVwZGF0ZSwgdXNlZnVsIGZvciB0ZXN0c1xuICAgICAgICAgICAgaWYgKGxvY2FsZXNbbmFtZV0gIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGlmIChsb2NhbGVzW25hbWVdLnBhcmVudExvY2FsZSAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIGxvY2FsZXNbbmFtZV0gPSBsb2NhbGVzW25hbWVdLnBhcmVudExvY2FsZTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGxvY2FsZXNbbmFtZV0gIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICBkZWxldGUgbG9jYWxlc1tuYW1lXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGxvY2FsZXNbbmFtZV07XG4gICAgfVxuXG4gICAgLy8gcmV0dXJucyBsb2NhbGUgZGF0YVxuICAgIGZ1bmN0aW9uIGxvY2FsZV9sb2NhbGVzX19nZXRMb2NhbGUgKGtleSkge1xuICAgICAgICB2YXIgbG9jYWxlO1xuXG4gICAgICAgIGlmIChrZXkgJiYga2V5Ll9sb2NhbGUgJiYga2V5Ll9sb2NhbGUuX2FiYnIpIHtcbiAgICAgICAgICAgIGtleSA9IGtleS5fbG9jYWxlLl9hYmJyO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFrZXkpIHtcbiAgICAgICAgICAgIHJldHVybiBnbG9iYWxMb2NhbGU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIWlzQXJyYXkoa2V5KSkge1xuICAgICAgICAgICAgLy9zaG9ydC1jaXJjdWl0IGV2ZXJ5dGhpbmcgZWxzZVxuICAgICAgICAgICAgbG9jYWxlID0gbG9hZExvY2FsZShrZXkpO1xuICAgICAgICAgICAgaWYgKGxvY2FsZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBsb2NhbGU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBrZXkgPSBba2V5XTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBjaG9vc2VMb2NhbGUoa2V5KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsb2NhbGVfbG9jYWxlc19fbGlzdExvY2FsZXMoKSB7XG4gICAgICAgIHJldHVybiBrZXlzKGxvY2FsZXMpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGNoZWNrT3ZlcmZsb3cgKG0pIHtcbiAgICAgICAgdmFyIG92ZXJmbG93O1xuICAgICAgICB2YXIgYSA9IG0uX2E7XG5cbiAgICAgICAgaWYgKGEgJiYgZ2V0UGFyc2luZ0ZsYWdzKG0pLm92ZXJmbG93ID09PSAtMikge1xuICAgICAgICAgICAgb3ZlcmZsb3cgPVxuICAgICAgICAgICAgICAgIGFbTU9OVEhdICAgICAgIDwgMCB8fCBhW01PTlRIXSAgICAgICA+IDExICA/IE1PTlRIIDpcbiAgICAgICAgICAgICAgICBhW0RBVEVdICAgICAgICA8IDEgfHwgYVtEQVRFXSAgICAgICAgPiBkYXlzSW5Nb250aChhW1lFQVJdLCBhW01PTlRIXSkgPyBEQVRFIDpcbiAgICAgICAgICAgICAgICBhW0hPVVJdICAgICAgICA8IDAgfHwgYVtIT1VSXSAgICAgICAgPiAyNCB8fCAoYVtIT1VSXSA9PT0gMjQgJiYgKGFbTUlOVVRFXSAhPT0gMCB8fCBhW1NFQ09ORF0gIT09IDAgfHwgYVtNSUxMSVNFQ09ORF0gIT09IDApKSA/IEhPVVIgOlxuICAgICAgICAgICAgICAgIGFbTUlOVVRFXSAgICAgIDwgMCB8fCBhW01JTlVURV0gICAgICA+IDU5ICA/IE1JTlVURSA6XG4gICAgICAgICAgICAgICAgYVtTRUNPTkRdICAgICAgPCAwIHx8IGFbU0VDT05EXSAgICAgID4gNTkgID8gU0VDT05EIDpcbiAgICAgICAgICAgICAgICBhW01JTExJU0VDT05EXSA8IDAgfHwgYVtNSUxMSVNFQ09ORF0gPiA5OTkgPyBNSUxMSVNFQ09ORCA6XG4gICAgICAgICAgICAgICAgLTE7XG5cbiAgICAgICAgICAgIGlmIChnZXRQYXJzaW5nRmxhZ3MobSkuX292ZXJmbG93RGF5T2ZZZWFyICYmIChvdmVyZmxvdyA8IFlFQVIgfHwgb3ZlcmZsb3cgPiBEQVRFKSkge1xuICAgICAgICAgICAgICAgIG92ZXJmbG93ID0gREFURTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChnZXRQYXJzaW5nRmxhZ3MobSkuX292ZXJmbG93V2Vla3MgJiYgb3ZlcmZsb3cgPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgb3ZlcmZsb3cgPSBXRUVLO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGdldFBhcnNpbmdGbGFncyhtKS5fb3ZlcmZsb3dXZWVrZGF5ICYmIG92ZXJmbG93ID09PSAtMSkge1xuICAgICAgICAgICAgICAgIG92ZXJmbG93ID0gV0VFS0RBWTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZ2V0UGFyc2luZ0ZsYWdzKG0pLm92ZXJmbG93ID0gb3ZlcmZsb3c7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbTtcbiAgICB9XG5cbiAgICAvLyBpc28gODYwMSByZWdleFxuICAgIC8vIDAwMDAtMDAtMDAgMDAwMC1XMDAgb3IgMDAwMC1XMDAtMCArIFQgKyAwMCBvciAwMDowMCBvciAwMDowMDowMCBvciAwMDowMDowMC4wMDAgKyArMDA6MDAgb3IgKzAwMDAgb3IgKzAwKVxuICAgIHZhciBleHRlbmRlZElzb1JlZ2V4ID0gL15cXHMqKCg/OlsrLV1cXGR7Nn18XFxkezR9KS0oPzpcXGRcXGQtXFxkXFxkfFdcXGRcXGQtXFxkfFdcXGRcXGR8XFxkXFxkXFxkfFxcZFxcZCkpKD86KFR8ICkoXFxkXFxkKD86OlxcZFxcZCg/OjpcXGRcXGQoPzpbLixdXFxkKyk/KT8pPykoW1xcK1xcLV1cXGRcXGQoPzo6P1xcZFxcZCk/fFxccypaKT8pPy87XG4gICAgdmFyIGJhc2ljSXNvUmVnZXggPSAvXlxccyooKD86WystXVxcZHs2fXxcXGR7NH0pKD86XFxkXFxkXFxkXFxkfFdcXGRcXGRcXGR8V1xcZFxcZHxcXGRcXGRcXGR8XFxkXFxkKSkoPzooVHwgKShcXGRcXGQoPzpcXGRcXGQoPzpcXGRcXGQoPzpbLixdXFxkKyk/KT8pPykoW1xcK1xcLV1cXGRcXGQoPzo6P1xcZFxcZCk/fFxccypaKT8pPy87XG5cbiAgICB2YXIgdHpSZWdleCA9IC9afFsrLV1cXGRcXGQoPzo6P1xcZFxcZCk/LztcblxuICAgIHZhciBpc29EYXRlcyA9IFtcbiAgICAgICAgWydZWVlZWVktTU0tREQnLCAvWystXVxcZHs2fS1cXGRcXGQtXFxkXFxkL10sXG4gICAgICAgIFsnWVlZWS1NTS1ERCcsIC9cXGR7NH0tXFxkXFxkLVxcZFxcZC9dLFxuICAgICAgICBbJ0dHR0ctW1ddV1ctRScsIC9cXGR7NH0tV1xcZFxcZC1cXGQvXSxcbiAgICAgICAgWydHR0dHLVtXXVdXJywgL1xcZHs0fS1XXFxkXFxkLywgZmFsc2VdLFxuICAgICAgICBbJ1lZWVktREREJywgL1xcZHs0fS1cXGR7M30vXSxcbiAgICAgICAgWydZWVlZLU1NJywgL1xcZHs0fS1cXGRcXGQvLCBmYWxzZV0sXG4gICAgICAgIFsnWVlZWVlZTU1ERCcsIC9bKy1dXFxkezEwfS9dLFxuICAgICAgICBbJ1lZWVlNTUREJywgL1xcZHs4fS9dLFxuICAgICAgICAvLyBZWVlZTU0gaXMgTk9UIGFsbG93ZWQgYnkgdGhlIHN0YW5kYXJkXG4gICAgICAgIFsnR0dHR1tXXVdXRScsIC9cXGR7NH1XXFxkezN9L10sXG4gICAgICAgIFsnR0dHR1tXXVdXJywgL1xcZHs0fVdcXGR7Mn0vLCBmYWxzZV0sXG4gICAgICAgIFsnWVlZWURERCcsIC9cXGR7N30vXVxuICAgIF07XG5cbiAgICAvLyBpc28gdGltZSBmb3JtYXRzIGFuZCByZWdleGVzXG4gICAgdmFyIGlzb1RpbWVzID0gW1xuICAgICAgICBbJ0hIOm1tOnNzLlNTU1MnLCAvXFxkXFxkOlxcZFxcZDpcXGRcXGRcXC5cXGQrL10sXG4gICAgICAgIFsnSEg6bW06c3MsU1NTUycsIC9cXGRcXGQ6XFxkXFxkOlxcZFxcZCxcXGQrL10sXG4gICAgICAgIFsnSEg6bW06c3MnLCAvXFxkXFxkOlxcZFxcZDpcXGRcXGQvXSxcbiAgICAgICAgWydISDptbScsIC9cXGRcXGQ6XFxkXFxkL10sXG4gICAgICAgIFsnSEhtbXNzLlNTU1MnLCAvXFxkXFxkXFxkXFxkXFxkXFxkXFwuXFxkKy9dLFxuICAgICAgICBbJ0hIbW1zcyxTU1NTJywgL1xcZFxcZFxcZFxcZFxcZFxcZCxcXGQrL10sXG4gICAgICAgIFsnSEhtbXNzJywgL1xcZFxcZFxcZFxcZFxcZFxcZC9dLFxuICAgICAgICBbJ0hIbW0nLCAvXFxkXFxkXFxkXFxkL10sXG4gICAgICAgIFsnSEgnLCAvXFxkXFxkL11cbiAgICBdO1xuXG4gICAgdmFyIGFzcE5ldEpzb25SZWdleCA9IC9eXFwvP0RhdGVcXCgoXFwtP1xcZCspL2k7XG5cbiAgICAvLyBkYXRlIGZyb20gaXNvIGZvcm1hdFxuICAgIGZ1bmN0aW9uIGNvbmZpZ0Zyb21JU08oY29uZmlnKSB7XG4gICAgICAgIHZhciBpLCBsLFxuICAgICAgICAgICAgc3RyaW5nID0gY29uZmlnLl9pLFxuICAgICAgICAgICAgbWF0Y2ggPSBleHRlbmRlZElzb1JlZ2V4LmV4ZWMoc3RyaW5nKSB8fCBiYXNpY0lzb1JlZ2V4LmV4ZWMoc3RyaW5nKSxcbiAgICAgICAgICAgIGFsbG93VGltZSwgZGF0ZUZvcm1hdCwgdGltZUZvcm1hdCwgdHpGb3JtYXQ7XG5cbiAgICAgICAgaWYgKG1hdGNoKSB7XG4gICAgICAgICAgICBnZXRQYXJzaW5nRmxhZ3MoY29uZmlnKS5pc28gPSB0cnVlO1xuXG4gICAgICAgICAgICBmb3IgKGkgPSAwLCBsID0gaXNvRGF0ZXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgaWYgKGlzb0RhdGVzW2ldWzFdLmV4ZWMobWF0Y2hbMV0pKSB7XG4gICAgICAgICAgICAgICAgICAgIGRhdGVGb3JtYXQgPSBpc29EYXRlc1tpXVswXTtcbiAgICAgICAgICAgICAgICAgICAgYWxsb3dUaW1lID0gaXNvRGF0ZXNbaV1bMl0gIT09IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZGF0ZUZvcm1hdCA9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgY29uZmlnLl9pc1ZhbGlkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKG1hdGNoWzNdKSB7XG4gICAgICAgICAgICAgICAgZm9yIChpID0gMCwgbCA9IGlzb1RpbWVzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBpZiAoaXNvVGltZXNbaV1bMV0uZXhlYyhtYXRjaFszXSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIG1hdGNoWzJdIHNob3VsZCBiZSAnVCcgb3Igc3BhY2VcbiAgICAgICAgICAgICAgICAgICAgICAgIHRpbWVGb3JtYXQgPSAobWF0Y2hbMl0gfHwgJyAnKSArIGlzb1RpbWVzW2ldWzBdO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHRpbWVGb3JtYXQgPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICBjb25maWcuX2lzVmFsaWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICghYWxsb3dUaW1lICYmIHRpbWVGb3JtYXQgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGNvbmZpZy5faXNWYWxpZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChtYXRjaFs0XSkge1xuICAgICAgICAgICAgICAgIGlmICh0elJlZ2V4LmV4ZWMobWF0Y2hbNF0pKSB7XG4gICAgICAgICAgICAgICAgICAgIHR6Rm9ybWF0ID0gJ1onO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbmZpZy5faXNWYWxpZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uZmlnLl9mID0gZGF0ZUZvcm1hdCArICh0aW1lRm9ybWF0IHx8ICcnKSArICh0ekZvcm1hdCB8fCAnJyk7XG4gICAgICAgICAgICBjb25maWdGcm9tU3RyaW5nQW5kRm9ybWF0KGNvbmZpZyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25maWcuX2lzVmFsaWQgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIGRhdGUgZnJvbSBpc28gZm9ybWF0IG9yIGZhbGxiYWNrXG4gICAgZnVuY3Rpb24gY29uZmlnRnJvbVN0cmluZyhjb25maWcpIHtcbiAgICAgICAgdmFyIG1hdGNoZWQgPSBhc3BOZXRKc29uUmVnZXguZXhlYyhjb25maWcuX2kpO1xuXG4gICAgICAgIGlmIChtYXRjaGVkICE9PSBudWxsKSB7XG4gICAgICAgICAgICBjb25maWcuX2QgPSBuZXcgRGF0ZSgrbWF0Y2hlZFsxXSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25maWdGcm9tSVNPKGNvbmZpZyk7XG4gICAgICAgIGlmIChjb25maWcuX2lzVmFsaWQgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICBkZWxldGUgY29uZmlnLl9pc1ZhbGlkO1xuICAgICAgICAgICAgdXRpbHNfaG9va3NfX2hvb2tzLmNyZWF0ZUZyb21JbnB1dEZhbGxiYWNrKGNvbmZpZyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB1dGlsc19ob29rc19faG9va3MuY3JlYXRlRnJvbUlucHV0RmFsbGJhY2sgPSBkZXByZWNhdGUoXG4gICAgICAgICdtb21lbnQgY29uc3RydWN0aW9uIGZhbGxzIGJhY2sgdG8ganMgRGF0ZS4gVGhpcyBpcyAnICtcbiAgICAgICAgJ2Rpc2NvdXJhZ2VkIGFuZCB3aWxsIGJlIHJlbW92ZWQgaW4gdXBjb21pbmcgbWFqb3IgJyArXG4gICAgICAgICdyZWxlYXNlLiBQbGVhc2UgcmVmZXIgdG8gJyArXG4gICAgICAgICdodHRwOi8vbW9tZW50anMuY29tL2d1aWRlcy8jL3dhcm5pbmdzL2pzLWRhdGUvIGZvciBtb3JlIGluZm8uJyxcbiAgICAgICAgZnVuY3Rpb24gKGNvbmZpZykge1xuICAgICAgICAgICAgY29uZmlnLl9kID0gbmV3IERhdGUoY29uZmlnLl9pICsgKGNvbmZpZy5fdXNlVVRDID8gJyBVVEMnIDogJycpKTtcbiAgICAgICAgfVxuICAgICk7XG5cbiAgICAvLyBQaWNrIHRoZSBmaXJzdCBkZWZpbmVkIG9mIHR3byBvciB0aHJlZSBhcmd1bWVudHMuXG4gICAgZnVuY3Rpb24gZGVmYXVsdHMoYSwgYiwgYykge1xuICAgICAgICBpZiAoYSAhPSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gYTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoYiAhPSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gYjtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjdXJyZW50RGF0ZUFycmF5KGNvbmZpZykge1xuICAgICAgICAvLyBob29rcyBpcyBhY3R1YWxseSB0aGUgZXhwb3J0ZWQgbW9tZW50IG9iamVjdFxuICAgICAgICB2YXIgbm93VmFsdWUgPSBuZXcgRGF0ZSh1dGlsc19ob29rc19faG9va3Mubm93KCkpO1xuICAgICAgICBpZiAoY29uZmlnLl91c2VVVEMpIHtcbiAgICAgICAgICAgIHJldHVybiBbbm93VmFsdWUuZ2V0VVRDRnVsbFllYXIoKSwgbm93VmFsdWUuZ2V0VVRDTW9udGgoKSwgbm93VmFsdWUuZ2V0VVRDRGF0ZSgpXTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gW25vd1ZhbHVlLmdldEZ1bGxZZWFyKCksIG5vd1ZhbHVlLmdldE1vbnRoKCksIG5vd1ZhbHVlLmdldERhdGUoKV07XG4gICAgfVxuXG4gICAgLy8gY29udmVydCBhbiBhcnJheSB0byBhIGRhdGUuXG4gICAgLy8gdGhlIGFycmF5IHNob3VsZCBtaXJyb3IgdGhlIHBhcmFtZXRlcnMgYmVsb3dcbiAgICAvLyBub3RlOiBhbGwgdmFsdWVzIHBhc3QgdGhlIHllYXIgYXJlIG9wdGlvbmFsIGFuZCB3aWxsIGRlZmF1bHQgdG8gdGhlIGxvd2VzdCBwb3NzaWJsZSB2YWx1ZS5cbiAgICAvLyBbeWVhciwgbW9udGgsIGRheSAsIGhvdXIsIG1pbnV0ZSwgc2Vjb25kLCBtaWxsaXNlY29uZF1cbiAgICBmdW5jdGlvbiBjb25maWdGcm9tQXJyYXkgKGNvbmZpZykge1xuICAgICAgICB2YXIgaSwgZGF0ZSwgaW5wdXQgPSBbXSwgY3VycmVudERhdGUsIHllYXJUb1VzZTtcblxuICAgICAgICBpZiAoY29uZmlnLl9kKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjdXJyZW50RGF0ZSA9IGN1cnJlbnREYXRlQXJyYXkoY29uZmlnKTtcblxuICAgICAgICAvL2NvbXB1dGUgZGF5IG9mIHRoZSB5ZWFyIGZyb20gd2Vla3MgYW5kIHdlZWtkYXlzXG4gICAgICAgIGlmIChjb25maWcuX3cgJiYgY29uZmlnLl9hW0RBVEVdID09IG51bGwgJiYgY29uZmlnLl9hW01PTlRIXSA9PSBudWxsKSB7XG4gICAgICAgICAgICBkYXlPZlllYXJGcm9tV2Vla0luZm8oY29uZmlnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vaWYgdGhlIGRheSBvZiB0aGUgeWVhciBpcyBzZXQsIGZpZ3VyZSBvdXQgd2hhdCBpdCBpc1xuICAgICAgICBpZiAoY29uZmlnLl9kYXlPZlllYXIpIHtcbiAgICAgICAgICAgIHllYXJUb1VzZSA9IGRlZmF1bHRzKGNvbmZpZy5fYVtZRUFSXSwgY3VycmVudERhdGVbWUVBUl0pO1xuXG4gICAgICAgICAgICBpZiAoY29uZmlnLl9kYXlPZlllYXIgPiBkYXlzSW5ZZWFyKHllYXJUb1VzZSkpIHtcbiAgICAgICAgICAgICAgICBnZXRQYXJzaW5nRmxhZ3MoY29uZmlnKS5fb3ZlcmZsb3dEYXlPZlllYXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBkYXRlID0gY3JlYXRlVVRDRGF0ZSh5ZWFyVG9Vc2UsIDAsIGNvbmZpZy5fZGF5T2ZZZWFyKTtcbiAgICAgICAgICAgIGNvbmZpZy5fYVtNT05USF0gPSBkYXRlLmdldFVUQ01vbnRoKCk7XG4gICAgICAgICAgICBjb25maWcuX2FbREFURV0gPSBkYXRlLmdldFVUQ0RhdGUoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIERlZmF1bHQgdG8gY3VycmVudCBkYXRlLlxuICAgICAgICAvLyAqIGlmIG5vIHllYXIsIG1vbnRoLCBkYXkgb2YgbW9udGggYXJlIGdpdmVuLCBkZWZhdWx0IHRvIHRvZGF5XG4gICAgICAgIC8vICogaWYgZGF5IG9mIG1vbnRoIGlzIGdpdmVuLCBkZWZhdWx0IG1vbnRoIGFuZCB5ZWFyXG4gICAgICAgIC8vICogaWYgbW9udGggaXMgZ2l2ZW4sIGRlZmF1bHQgb25seSB5ZWFyXG4gICAgICAgIC8vICogaWYgeWVhciBpcyBnaXZlbiwgZG9uJ3QgZGVmYXVsdCBhbnl0aGluZ1xuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgMyAmJiBjb25maWcuX2FbaV0gPT0gbnVsbDsgKytpKSB7XG4gICAgICAgICAgICBjb25maWcuX2FbaV0gPSBpbnB1dFtpXSA9IGN1cnJlbnREYXRlW2ldO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gWmVybyBvdXQgd2hhdGV2ZXIgd2FzIG5vdCBkZWZhdWx0ZWQsIGluY2x1ZGluZyB0aW1lXG4gICAgICAgIGZvciAoOyBpIDwgNzsgaSsrKSB7XG4gICAgICAgICAgICBjb25maWcuX2FbaV0gPSBpbnB1dFtpXSA9IChjb25maWcuX2FbaV0gPT0gbnVsbCkgPyAoaSA9PT0gMiA/IDEgOiAwKSA6IGNvbmZpZy5fYVtpXTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENoZWNrIGZvciAyNDowMDowMC4wMDBcbiAgICAgICAgaWYgKGNvbmZpZy5fYVtIT1VSXSA9PT0gMjQgJiZcbiAgICAgICAgICAgICAgICBjb25maWcuX2FbTUlOVVRFXSA9PT0gMCAmJlxuICAgICAgICAgICAgICAgIGNvbmZpZy5fYVtTRUNPTkRdID09PSAwICYmXG4gICAgICAgICAgICAgICAgY29uZmlnLl9hW01JTExJU0VDT05EXSA9PT0gMCkge1xuICAgICAgICAgICAgY29uZmlnLl9uZXh0RGF5ID0gdHJ1ZTtcbiAgICAgICAgICAgIGNvbmZpZy5fYVtIT1VSXSA9IDA7XG4gICAgICAgIH1cblxuICAgICAgICBjb25maWcuX2QgPSAoY29uZmlnLl91c2VVVEMgPyBjcmVhdGVVVENEYXRlIDogY3JlYXRlRGF0ZSkuYXBwbHkobnVsbCwgaW5wdXQpO1xuICAgICAgICAvLyBBcHBseSB0aW1lem9uZSBvZmZzZXQgZnJvbSBpbnB1dC4gVGhlIGFjdHVhbCB1dGNPZmZzZXQgY2FuIGJlIGNoYW5nZWRcbiAgICAgICAgLy8gd2l0aCBwYXJzZVpvbmUuXG4gICAgICAgIGlmIChjb25maWcuX3R6bSAhPSBudWxsKSB7XG4gICAgICAgICAgICBjb25maWcuX2Quc2V0VVRDTWludXRlcyhjb25maWcuX2QuZ2V0VVRDTWludXRlcygpIC0gY29uZmlnLl90em0pO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGNvbmZpZy5fbmV4dERheSkge1xuICAgICAgICAgICAgY29uZmlnLl9hW0hPVVJdID0gMjQ7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBkYXlPZlllYXJGcm9tV2Vla0luZm8oY29uZmlnKSB7XG4gICAgICAgIHZhciB3LCB3ZWVrWWVhciwgd2Vlaywgd2Vla2RheSwgZG93LCBkb3ksIHRlbXAsIHdlZWtkYXlPdmVyZmxvdztcblxuICAgICAgICB3ID0gY29uZmlnLl93O1xuICAgICAgICBpZiAody5HRyAhPSBudWxsIHx8IHcuVyAhPSBudWxsIHx8IHcuRSAhPSBudWxsKSB7XG4gICAgICAgICAgICBkb3cgPSAxO1xuICAgICAgICAgICAgZG95ID0gNDtcblxuICAgICAgICAgICAgLy8gVE9ETzogV2UgbmVlZCB0byB0YWtlIHRoZSBjdXJyZW50IGlzb1dlZWtZZWFyLCBidXQgdGhhdCBkZXBlbmRzIG9uXG4gICAgICAgICAgICAvLyBob3cgd2UgaW50ZXJwcmV0IG5vdyAobG9jYWwsIHV0YywgZml4ZWQgb2Zmc2V0KS4gU28gY3JlYXRlXG4gICAgICAgICAgICAvLyBhIG5vdyB2ZXJzaW9uIG9mIGN1cnJlbnQgY29uZmlnICh0YWtlIGxvY2FsL3V0Yy9vZmZzZXQgZmxhZ3MsIGFuZFxuICAgICAgICAgICAgLy8gY3JlYXRlIG5vdykuXG4gICAgICAgICAgICB3ZWVrWWVhciA9IGRlZmF1bHRzKHcuR0csIGNvbmZpZy5fYVtZRUFSXSwgd2Vla09mWWVhcihsb2NhbF9fY3JlYXRlTG9jYWwoKSwgMSwgNCkueWVhcik7XG4gICAgICAgICAgICB3ZWVrID0gZGVmYXVsdHMody5XLCAxKTtcbiAgICAgICAgICAgIHdlZWtkYXkgPSBkZWZhdWx0cyh3LkUsIDEpO1xuICAgICAgICAgICAgaWYgKHdlZWtkYXkgPCAxIHx8IHdlZWtkYXkgPiA3KSB7XG4gICAgICAgICAgICAgICAgd2Vla2RheU92ZXJmbG93ID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGRvdyA9IGNvbmZpZy5fbG9jYWxlLl93ZWVrLmRvdztcbiAgICAgICAgICAgIGRveSA9IGNvbmZpZy5fbG9jYWxlLl93ZWVrLmRveTtcblxuICAgICAgICAgICAgd2Vla1llYXIgPSBkZWZhdWx0cyh3LmdnLCBjb25maWcuX2FbWUVBUl0sIHdlZWtPZlllYXIobG9jYWxfX2NyZWF0ZUxvY2FsKCksIGRvdywgZG95KS55ZWFyKTtcbiAgICAgICAgICAgIHdlZWsgPSBkZWZhdWx0cyh3LncsIDEpO1xuXG4gICAgICAgICAgICBpZiAody5kICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICAvLyB3ZWVrZGF5IC0tIGxvdyBkYXkgbnVtYmVycyBhcmUgY29uc2lkZXJlZCBuZXh0IHdlZWtcbiAgICAgICAgICAgICAgICB3ZWVrZGF5ID0gdy5kO1xuICAgICAgICAgICAgICAgIGlmICh3ZWVrZGF5IDwgMCB8fCB3ZWVrZGF5ID4gNikge1xuICAgICAgICAgICAgICAgICAgICB3ZWVrZGF5T3ZlcmZsb3cgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSBpZiAody5lICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICAvLyBsb2NhbCB3ZWVrZGF5IC0tIGNvdW50aW5nIHN0YXJ0cyBmcm9tIGJlZ2luaW5nIG9mIHdlZWtcbiAgICAgICAgICAgICAgICB3ZWVrZGF5ID0gdy5lICsgZG93O1xuICAgICAgICAgICAgICAgIGlmICh3LmUgPCAwIHx8IHcuZSA+IDYpIHtcbiAgICAgICAgICAgICAgICAgICAgd2Vla2RheU92ZXJmbG93ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIGRlZmF1bHQgdG8gYmVnaW5pbmcgb2Ygd2Vla1xuICAgICAgICAgICAgICAgIHdlZWtkYXkgPSBkb3c7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHdlZWsgPCAxIHx8IHdlZWsgPiB3ZWVrc0luWWVhcih3ZWVrWWVhciwgZG93LCBkb3kpKSB7XG4gICAgICAgICAgICBnZXRQYXJzaW5nRmxhZ3MoY29uZmlnKS5fb3ZlcmZsb3dXZWVrcyA9IHRydWU7XG4gICAgICAgIH0gZWxzZSBpZiAod2Vla2RheU92ZXJmbG93ICE9IG51bGwpIHtcbiAgICAgICAgICAgIGdldFBhcnNpbmdGbGFncyhjb25maWcpLl9vdmVyZmxvd1dlZWtkYXkgPSB0cnVlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGVtcCA9IGRheU9mWWVhckZyb21XZWVrcyh3ZWVrWWVhciwgd2Vlaywgd2Vla2RheSwgZG93LCBkb3kpO1xuICAgICAgICAgICAgY29uZmlnLl9hW1lFQVJdID0gdGVtcC55ZWFyO1xuICAgICAgICAgICAgY29uZmlnLl9kYXlPZlllYXIgPSB0ZW1wLmRheU9mWWVhcjtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIGNvbnN0YW50IHRoYXQgcmVmZXJzIHRvIHRoZSBJU08gc3RhbmRhcmRcbiAgICB1dGlsc19ob29rc19faG9va3MuSVNPXzg2MDEgPSBmdW5jdGlvbiAoKSB7fTtcblxuICAgIC8vIGRhdGUgZnJvbSBzdHJpbmcgYW5kIGZvcm1hdCBzdHJpbmdcbiAgICBmdW5jdGlvbiBjb25maWdGcm9tU3RyaW5nQW5kRm9ybWF0KGNvbmZpZykge1xuICAgICAgICAvLyBUT0RPOiBNb3ZlIHRoaXMgdG8gYW5vdGhlciBwYXJ0IG9mIHRoZSBjcmVhdGlvbiBmbG93IHRvIHByZXZlbnQgY2lyY3VsYXIgZGVwc1xuICAgICAgICBpZiAoY29uZmlnLl9mID09PSB1dGlsc19ob29rc19faG9va3MuSVNPXzg2MDEpIHtcbiAgICAgICAgICAgIGNvbmZpZ0Zyb21JU08oY29uZmlnKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbmZpZy5fYSA9IFtdO1xuICAgICAgICBnZXRQYXJzaW5nRmxhZ3MoY29uZmlnKS5lbXB0eSA9IHRydWU7XG5cbiAgICAgICAgLy8gVGhpcyBhcnJheSBpcyB1c2VkIHRvIG1ha2UgYSBEYXRlLCBlaXRoZXIgd2l0aCBgbmV3IERhdGVgIG9yIGBEYXRlLlVUQ2BcbiAgICAgICAgdmFyIHN0cmluZyA9ICcnICsgY29uZmlnLl9pLFxuICAgICAgICAgICAgaSwgcGFyc2VkSW5wdXQsIHRva2VucywgdG9rZW4sIHNraXBwZWQsXG4gICAgICAgICAgICBzdHJpbmdMZW5ndGggPSBzdHJpbmcubGVuZ3RoLFxuICAgICAgICAgICAgdG90YWxQYXJzZWRJbnB1dExlbmd0aCA9IDA7XG5cbiAgICAgICAgdG9rZW5zID0gZXhwYW5kRm9ybWF0KGNvbmZpZy5fZiwgY29uZmlnLl9sb2NhbGUpLm1hdGNoKGZvcm1hdHRpbmdUb2tlbnMpIHx8IFtdO1xuXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCB0b2tlbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHRva2VuID0gdG9rZW5zW2ldO1xuICAgICAgICAgICAgcGFyc2VkSW5wdXQgPSAoc3RyaW5nLm1hdGNoKGdldFBhcnNlUmVnZXhGb3JUb2tlbih0b2tlbiwgY29uZmlnKSkgfHwgW10pWzBdO1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coJ3Rva2VuJywgdG9rZW4sICdwYXJzZWRJbnB1dCcsIHBhcnNlZElucHV0LFxuICAgICAgICAgICAgLy8gICAgICAgICAncmVnZXgnLCBnZXRQYXJzZVJlZ2V4Rm9yVG9rZW4odG9rZW4sIGNvbmZpZykpO1xuICAgICAgICAgICAgaWYgKHBhcnNlZElucHV0KSB7XG4gICAgICAgICAgICAgICAgc2tpcHBlZCA9IHN0cmluZy5zdWJzdHIoMCwgc3RyaW5nLmluZGV4T2YocGFyc2VkSW5wdXQpKTtcbiAgICAgICAgICAgICAgICBpZiAoc2tpcHBlZC5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGdldFBhcnNpbmdGbGFncyhjb25maWcpLnVudXNlZElucHV0LnB1c2goc2tpcHBlZCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHN0cmluZyA9IHN0cmluZy5zbGljZShzdHJpbmcuaW5kZXhPZihwYXJzZWRJbnB1dCkgKyBwYXJzZWRJbnB1dC5sZW5ndGgpO1xuICAgICAgICAgICAgICAgIHRvdGFsUGFyc2VkSW5wdXRMZW5ndGggKz0gcGFyc2VkSW5wdXQubGVuZ3RoO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gZG9uJ3QgcGFyc2UgaWYgaXQncyBub3QgYSBrbm93biB0b2tlblxuICAgICAgICAgICAgaWYgKGZvcm1hdFRva2VuRnVuY3Rpb25zW3Rva2VuXSkge1xuICAgICAgICAgICAgICAgIGlmIChwYXJzZWRJbnB1dCkge1xuICAgICAgICAgICAgICAgICAgICBnZXRQYXJzaW5nRmxhZ3MoY29uZmlnKS5lbXB0eSA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgZ2V0UGFyc2luZ0ZsYWdzKGNvbmZpZykudW51c2VkVG9rZW5zLnB1c2godG9rZW4pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBhZGRUaW1lVG9BcnJheUZyb21Ub2tlbih0b2tlbiwgcGFyc2VkSW5wdXQsIGNvbmZpZyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChjb25maWcuX3N0cmljdCAmJiAhcGFyc2VkSW5wdXQpIHtcbiAgICAgICAgICAgICAgICBnZXRQYXJzaW5nRmxhZ3MoY29uZmlnKS51bnVzZWRUb2tlbnMucHVzaCh0b2tlbik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBhZGQgcmVtYWluaW5nIHVucGFyc2VkIGlucHV0IGxlbmd0aCB0byB0aGUgc3RyaW5nXG4gICAgICAgIGdldFBhcnNpbmdGbGFncyhjb25maWcpLmNoYXJzTGVmdE92ZXIgPSBzdHJpbmdMZW5ndGggLSB0b3RhbFBhcnNlZElucHV0TGVuZ3RoO1xuICAgICAgICBpZiAoc3RyaW5nLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIGdldFBhcnNpbmdGbGFncyhjb25maWcpLnVudXNlZElucHV0LnB1c2goc3RyaW5nKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGNsZWFyIF8xMmggZmxhZyBpZiBob3VyIGlzIDw9IDEyXG4gICAgICAgIGlmIChjb25maWcuX2FbSE9VUl0gPD0gMTIgJiZcbiAgICAgICAgICAgIGdldFBhcnNpbmdGbGFncyhjb25maWcpLmJpZ0hvdXIgPT09IHRydWUgJiZcbiAgICAgICAgICAgIGNvbmZpZy5fYVtIT1VSXSA+IDApIHtcbiAgICAgICAgICAgIGdldFBhcnNpbmdGbGFncyhjb25maWcpLmJpZ0hvdXIgPSB1bmRlZmluZWQ7XG4gICAgICAgIH1cblxuICAgICAgICBnZXRQYXJzaW5nRmxhZ3MoY29uZmlnKS5wYXJzZWREYXRlUGFydHMgPSBjb25maWcuX2Euc2xpY2UoMCk7XG4gICAgICAgIGdldFBhcnNpbmdGbGFncyhjb25maWcpLm1lcmlkaWVtID0gY29uZmlnLl9tZXJpZGllbTtcbiAgICAgICAgLy8gaGFuZGxlIG1lcmlkaWVtXG4gICAgICAgIGNvbmZpZy5fYVtIT1VSXSA9IG1lcmlkaWVtRml4V3JhcChjb25maWcuX2xvY2FsZSwgY29uZmlnLl9hW0hPVVJdLCBjb25maWcuX21lcmlkaWVtKTtcblxuICAgICAgICBjb25maWdGcm9tQXJyYXkoY29uZmlnKTtcbiAgICAgICAgY2hlY2tPdmVyZmxvdyhjb25maWcpO1xuICAgIH1cblxuXG4gICAgZnVuY3Rpb24gbWVyaWRpZW1GaXhXcmFwIChsb2NhbGUsIGhvdXIsIG1lcmlkaWVtKSB7XG4gICAgICAgIHZhciBpc1BtO1xuXG4gICAgICAgIGlmIChtZXJpZGllbSA9PSBudWxsKSB7XG4gICAgICAgICAgICAvLyBub3RoaW5nIHRvIGRvXG4gICAgICAgICAgICByZXR1cm4gaG91cjtcbiAgICAgICAgfVxuICAgICAgICBpZiAobG9jYWxlLm1lcmlkaWVtSG91ciAhPSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gbG9jYWxlLm1lcmlkaWVtSG91cihob3VyLCBtZXJpZGllbSk7XG4gICAgICAgIH0gZWxzZSBpZiAobG9jYWxlLmlzUE0gIT0gbnVsbCkge1xuICAgICAgICAgICAgLy8gRmFsbGJhY2tcbiAgICAgICAgICAgIGlzUG0gPSBsb2NhbGUuaXNQTShtZXJpZGllbSk7XG4gICAgICAgICAgICBpZiAoaXNQbSAmJiBob3VyIDwgMTIpIHtcbiAgICAgICAgICAgICAgICBob3VyICs9IDEyO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCFpc1BtICYmIGhvdXIgPT09IDEyKSB7XG4gICAgICAgICAgICAgICAgaG91ciA9IDA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gaG91cjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIHRoaXMgaXMgbm90IHN1cHBvc2VkIHRvIGhhcHBlblxuICAgICAgICAgICAgcmV0dXJuIGhvdXI7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBkYXRlIGZyb20gc3RyaW5nIGFuZCBhcnJheSBvZiBmb3JtYXQgc3RyaW5nc1xuICAgIGZ1bmN0aW9uIGNvbmZpZ0Zyb21TdHJpbmdBbmRBcnJheShjb25maWcpIHtcbiAgICAgICAgdmFyIHRlbXBDb25maWcsXG4gICAgICAgICAgICBiZXN0TW9tZW50LFxuXG4gICAgICAgICAgICBzY29yZVRvQmVhdCxcbiAgICAgICAgICAgIGksXG4gICAgICAgICAgICBjdXJyZW50U2NvcmU7XG5cbiAgICAgICAgaWYgKGNvbmZpZy5fZi5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIGdldFBhcnNpbmdGbGFncyhjb25maWcpLmludmFsaWRGb3JtYXQgPSB0cnVlO1xuICAgICAgICAgICAgY29uZmlnLl9kID0gbmV3IERhdGUoTmFOKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBjb25maWcuX2YubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGN1cnJlbnRTY29yZSA9IDA7XG4gICAgICAgICAgICB0ZW1wQ29uZmlnID0gY29weUNvbmZpZyh7fSwgY29uZmlnKTtcbiAgICAgICAgICAgIGlmIChjb25maWcuX3VzZVVUQyAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgdGVtcENvbmZpZy5fdXNlVVRDID0gY29uZmlnLl91c2VVVEM7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0ZW1wQ29uZmlnLl9mID0gY29uZmlnLl9mW2ldO1xuICAgICAgICAgICAgY29uZmlnRnJvbVN0cmluZ0FuZEZvcm1hdCh0ZW1wQ29uZmlnKTtcblxuICAgICAgICAgICAgaWYgKCF2YWxpZF9faXNWYWxpZCh0ZW1wQ29uZmlnKSkge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBpZiB0aGVyZSBpcyBhbnkgaW5wdXQgdGhhdCB3YXMgbm90IHBhcnNlZCBhZGQgYSBwZW5hbHR5IGZvciB0aGF0IGZvcm1hdFxuICAgICAgICAgICAgY3VycmVudFNjb3JlICs9IGdldFBhcnNpbmdGbGFncyh0ZW1wQ29uZmlnKS5jaGFyc0xlZnRPdmVyO1xuXG4gICAgICAgICAgICAvL29yIHRva2Vuc1xuICAgICAgICAgICAgY3VycmVudFNjb3JlICs9IGdldFBhcnNpbmdGbGFncyh0ZW1wQ29uZmlnKS51bnVzZWRUb2tlbnMubGVuZ3RoICogMTA7XG5cbiAgICAgICAgICAgIGdldFBhcnNpbmdGbGFncyh0ZW1wQ29uZmlnKS5zY29yZSA9IGN1cnJlbnRTY29yZTtcblxuICAgICAgICAgICAgaWYgKHNjb3JlVG9CZWF0ID09IG51bGwgfHwgY3VycmVudFNjb3JlIDwgc2NvcmVUb0JlYXQpIHtcbiAgICAgICAgICAgICAgICBzY29yZVRvQmVhdCA9IGN1cnJlbnRTY29yZTtcbiAgICAgICAgICAgICAgICBiZXN0TW9tZW50ID0gdGVtcENvbmZpZztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGV4dGVuZChjb25maWcsIGJlc3RNb21lbnQgfHwgdGVtcENvbmZpZyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY29uZmlnRnJvbU9iamVjdChjb25maWcpIHtcbiAgICAgICAgaWYgKGNvbmZpZy5fZCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGkgPSBub3JtYWxpemVPYmplY3RVbml0cyhjb25maWcuX2kpO1xuICAgICAgICBjb25maWcuX2EgPSBtYXAoW2kueWVhciwgaS5tb250aCwgaS5kYXkgfHwgaS5kYXRlLCBpLmhvdXIsIGkubWludXRlLCBpLnNlY29uZCwgaS5taWxsaXNlY29uZF0sIGZ1bmN0aW9uIChvYmopIHtcbiAgICAgICAgICAgIHJldHVybiBvYmogJiYgcGFyc2VJbnQob2JqLCAxMCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGNvbmZpZ0Zyb21BcnJheShjb25maWcpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGNyZWF0ZUZyb21Db25maWcgKGNvbmZpZykge1xuICAgICAgICB2YXIgcmVzID0gbmV3IE1vbWVudChjaGVja092ZXJmbG93KHByZXBhcmVDb25maWcoY29uZmlnKSkpO1xuICAgICAgICBpZiAocmVzLl9uZXh0RGF5KSB7XG4gICAgICAgICAgICAvLyBBZGRpbmcgaXMgc21hcnQgZW5vdWdoIGFyb3VuZCBEU1RcbiAgICAgICAgICAgIHJlcy5hZGQoMSwgJ2QnKTtcbiAgICAgICAgICAgIHJlcy5fbmV4dERheSA9IHVuZGVmaW5lZDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXM7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcHJlcGFyZUNvbmZpZyAoY29uZmlnKSB7XG4gICAgICAgIHZhciBpbnB1dCA9IGNvbmZpZy5faSxcbiAgICAgICAgICAgIGZvcm1hdCA9IGNvbmZpZy5fZjtcblxuICAgICAgICBjb25maWcuX2xvY2FsZSA9IGNvbmZpZy5fbG9jYWxlIHx8IGxvY2FsZV9sb2NhbGVzX19nZXRMb2NhbGUoY29uZmlnLl9sKTtcblxuICAgICAgICBpZiAoaW5wdXQgPT09IG51bGwgfHwgKGZvcm1hdCA9PT0gdW5kZWZpbmVkICYmIGlucHV0ID09PSAnJykpIHtcbiAgICAgICAgICAgIHJldHVybiB2YWxpZF9fY3JlYXRlSW52YWxpZCh7bnVsbElucHV0OiB0cnVlfSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodHlwZW9mIGlucHV0ID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgY29uZmlnLl9pID0gaW5wdXQgPSBjb25maWcuX2xvY2FsZS5wcmVwYXJzZShpbnB1dCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoaXNNb21lbnQoaW5wdXQpKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IE1vbWVudChjaGVja092ZXJmbG93KGlucHV0KSk7XG4gICAgICAgIH0gZWxzZSBpZiAoaXNBcnJheShmb3JtYXQpKSB7XG4gICAgICAgICAgICBjb25maWdGcm9tU3RyaW5nQW5kQXJyYXkoY29uZmlnKTtcbiAgICAgICAgfSBlbHNlIGlmIChpc0RhdGUoaW5wdXQpKSB7XG4gICAgICAgICAgICBjb25maWcuX2QgPSBpbnB1dDtcbiAgICAgICAgfSBlbHNlIGlmIChmb3JtYXQpIHtcbiAgICAgICAgICAgIGNvbmZpZ0Zyb21TdHJpbmdBbmRGb3JtYXQoY29uZmlnKTtcbiAgICAgICAgfSAgZWxzZSB7XG4gICAgICAgICAgICBjb25maWdGcm9tSW5wdXQoY29uZmlnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghdmFsaWRfX2lzVmFsaWQoY29uZmlnKSkge1xuICAgICAgICAgICAgY29uZmlnLl9kID0gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBjb25maWc7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY29uZmlnRnJvbUlucHV0KGNvbmZpZykge1xuICAgICAgICB2YXIgaW5wdXQgPSBjb25maWcuX2k7XG4gICAgICAgIGlmIChpbnB1dCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBjb25maWcuX2QgPSBuZXcgRGF0ZSh1dGlsc19ob29rc19faG9va3Mubm93KCkpO1xuICAgICAgICB9IGVsc2UgaWYgKGlzRGF0ZShpbnB1dCkpIHtcbiAgICAgICAgICAgIGNvbmZpZy5fZCA9IG5ldyBEYXRlKGlucHV0LnZhbHVlT2YoKSk7XG4gICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIGlucHV0ID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgY29uZmlnRnJvbVN0cmluZyhjb25maWcpO1xuICAgICAgICB9IGVsc2UgaWYgKGlzQXJyYXkoaW5wdXQpKSB7XG4gICAgICAgICAgICBjb25maWcuX2EgPSBtYXAoaW5wdXQuc2xpY2UoMCksIGZ1bmN0aW9uIChvYmopIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyc2VJbnQob2JqLCAxMCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGNvbmZpZ0Zyb21BcnJheShjb25maWcpO1xuICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZihpbnB1dCkgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICBjb25maWdGcm9tT2JqZWN0KGNvbmZpZyk7XG4gICAgICAgIH0gZWxzZSBpZiAodHlwZW9mKGlucHV0KSA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgICAgIC8vIGZyb20gbWlsbGlzZWNvbmRzXG4gICAgICAgICAgICBjb25maWcuX2QgPSBuZXcgRGF0ZShpbnB1dCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB1dGlsc19ob29rc19faG9va3MuY3JlYXRlRnJvbUlucHV0RmFsbGJhY2soY29uZmlnKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGNyZWF0ZUxvY2FsT3JVVEMgKGlucHV0LCBmb3JtYXQsIGxvY2FsZSwgc3RyaWN0LCBpc1VUQykge1xuICAgICAgICB2YXIgYyA9IHt9O1xuXG4gICAgICAgIGlmICh0eXBlb2YobG9jYWxlKSA9PT0gJ2Jvb2xlYW4nKSB7XG4gICAgICAgICAgICBzdHJpY3QgPSBsb2NhbGU7XG4gICAgICAgICAgICBsb2NhbGUgPSB1bmRlZmluZWQ7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoKGlzT2JqZWN0KGlucHV0KSAmJiBpc09iamVjdEVtcHR5KGlucHV0KSkgfHxcbiAgICAgICAgICAgICAgICAoaXNBcnJheShpbnB1dCkgJiYgaW5wdXQubGVuZ3RoID09PSAwKSkge1xuICAgICAgICAgICAgaW5wdXQgPSB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICAgICAgLy8gb2JqZWN0IGNvbnN0cnVjdGlvbiBtdXN0IGJlIGRvbmUgdGhpcyB3YXkuXG4gICAgICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9tb21lbnQvbW9tZW50L2lzc3Vlcy8xNDIzXG4gICAgICAgIGMuX2lzQU1vbWVudE9iamVjdCA9IHRydWU7XG4gICAgICAgIGMuX3VzZVVUQyA9IGMuX2lzVVRDID0gaXNVVEM7XG4gICAgICAgIGMuX2wgPSBsb2NhbGU7XG4gICAgICAgIGMuX2kgPSBpbnB1dDtcbiAgICAgICAgYy5fZiA9IGZvcm1hdDtcbiAgICAgICAgYy5fc3RyaWN0ID0gc3RyaWN0O1xuXG4gICAgICAgIHJldHVybiBjcmVhdGVGcm9tQ29uZmlnKGMpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxvY2FsX19jcmVhdGVMb2NhbCAoaW5wdXQsIGZvcm1hdCwgbG9jYWxlLCBzdHJpY3QpIHtcbiAgICAgICAgcmV0dXJuIGNyZWF0ZUxvY2FsT3JVVEMoaW5wdXQsIGZvcm1hdCwgbG9jYWxlLCBzdHJpY3QsIGZhbHNlKTtcbiAgICB9XG5cbiAgICB2YXIgcHJvdG90eXBlTWluID0gZGVwcmVjYXRlKFxuICAgICAgICAnbW9tZW50KCkubWluIGlzIGRlcHJlY2F0ZWQsIHVzZSBtb21lbnQubWF4IGluc3RlYWQuIGh0dHA6Ly9tb21lbnRqcy5jb20vZ3VpZGVzLyMvd2FybmluZ3MvbWluLW1heC8nLFxuICAgICAgICBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgb3RoZXIgPSBsb2NhbF9fY3JlYXRlTG9jYWwuYXBwbHkobnVsbCwgYXJndW1lbnRzKTtcbiAgICAgICAgICAgIGlmICh0aGlzLmlzVmFsaWQoKSAmJiBvdGhlci5pc1ZhbGlkKCkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gb3RoZXIgPCB0aGlzID8gdGhpcyA6IG90aGVyO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdmFsaWRfX2NyZWF0ZUludmFsaWQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICk7XG5cbiAgICB2YXIgcHJvdG90eXBlTWF4ID0gZGVwcmVjYXRlKFxuICAgICAgICAnbW9tZW50KCkubWF4IGlzIGRlcHJlY2F0ZWQsIHVzZSBtb21lbnQubWluIGluc3RlYWQuIGh0dHA6Ly9tb21lbnRqcy5jb20vZ3VpZGVzLyMvd2FybmluZ3MvbWluLW1heC8nLFxuICAgICAgICBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgb3RoZXIgPSBsb2NhbF9fY3JlYXRlTG9jYWwuYXBwbHkobnVsbCwgYXJndW1lbnRzKTtcbiAgICAgICAgICAgIGlmICh0aGlzLmlzVmFsaWQoKSAmJiBvdGhlci5pc1ZhbGlkKCkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gb3RoZXIgPiB0aGlzID8gdGhpcyA6IG90aGVyO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdmFsaWRfX2NyZWF0ZUludmFsaWQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICk7XG5cbiAgICAvLyBQaWNrIGEgbW9tZW50IG0gZnJvbSBtb21lbnRzIHNvIHRoYXQgbVtmbl0ob3RoZXIpIGlzIHRydWUgZm9yIGFsbFxuICAgIC8vIG90aGVyLiBUaGlzIHJlbGllcyBvbiB0aGUgZnVuY3Rpb24gZm4gdG8gYmUgdHJhbnNpdGl2ZS5cbiAgICAvL1xuICAgIC8vIG1vbWVudHMgc2hvdWxkIGVpdGhlciBiZSBhbiBhcnJheSBvZiBtb21lbnQgb2JqZWN0cyBvciBhbiBhcnJheSwgd2hvc2VcbiAgICAvLyBmaXJzdCBlbGVtZW50IGlzIGFuIGFycmF5IG9mIG1vbWVudCBvYmplY3RzLlxuICAgIGZ1bmN0aW9uIHBpY2tCeShmbiwgbW9tZW50cykge1xuICAgICAgICB2YXIgcmVzLCBpO1xuICAgICAgICBpZiAobW9tZW50cy5sZW5ndGggPT09IDEgJiYgaXNBcnJheShtb21lbnRzWzBdKSkge1xuICAgICAgICAgICAgbW9tZW50cyA9IG1vbWVudHNbMF07XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFtb21lbnRzLmxlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuIGxvY2FsX19jcmVhdGVMb2NhbCgpO1xuICAgICAgICB9XG4gICAgICAgIHJlcyA9IG1vbWVudHNbMF07XG4gICAgICAgIGZvciAoaSA9IDE7IGkgPCBtb21lbnRzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICBpZiAoIW1vbWVudHNbaV0uaXNWYWxpZCgpIHx8IG1vbWVudHNbaV1bZm5dKHJlcykpIHtcbiAgICAgICAgICAgICAgICByZXMgPSBtb21lbnRzW2ldO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXM7XG4gICAgfVxuXG4gICAgLy8gVE9ETzogVXNlIFtdLnNvcnQgaW5zdGVhZD9cbiAgICBmdW5jdGlvbiBtaW4gKCkge1xuICAgICAgICB2YXIgYXJncyA9IFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAwKTtcblxuICAgICAgICByZXR1cm4gcGlja0J5KCdpc0JlZm9yZScsIGFyZ3MpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIG1heCAoKSB7XG4gICAgICAgIHZhciBhcmdzID0gW10uc2xpY2UuY2FsbChhcmd1bWVudHMsIDApO1xuXG4gICAgICAgIHJldHVybiBwaWNrQnkoJ2lzQWZ0ZXInLCBhcmdzKTtcbiAgICB9XG5cbiAgICB2YXIgbm93ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gRGF0ZS5ub3cgPyBEYXRlLm5vdygpIDogKyhuZXcgRGF0ZSgpKTtcbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gRHVyYXRpb24gKGR1cmF0aW9uKSB7XG4gICAgICAgIHZhciBub3JtYWxpemVkSW5wdXQgPSBub3JtYWxpemVPYmplY3RVbml0cyhkdXJhdGlvbiksXG4gICAgICAgICAgICB5ZWFycyA9IG5vcm1hbGl6ZWRJbnB1dC55ZWFyIHx8IDAsXG4gICAgICAgICAgICBxdWFydGVycyA9IG5vcm1hbGl6ZWRJbnB1dC5xdWFydGVyIHx8IDAsXG4gICAgICAgICAgICBtb250aHMgPSBub3JtYWxpemVkSW5wdXQubW9udGggfHwgMCxcbiAgICAgICAgICAgIHdlZWtzID0gbm9ybWFsaXplZElucHV0LndlZWsgfHwgMCxcbiAgICAgICAgICAgIGRheXMgPSBub3JtYWxpemVkSW5wdXQuZGF5IHx8IDAsXG4gICAgICAgICAgICBob3VycyA9IG5vcm1hbGl6ZWRJbnB1dC5ob3VyIHx8IDAsXG4gICAgICAgICAgICBtaW51dGVzID0gbm9ybWFsaXplZElucHV0Lm1pbnV0ZSB8fCAwLFxuICAgICAgICAgICAgc2Vjb25kcyA9IG5vcm1hbGl6ZWRJbnB1dC5zZWNvbmQgfHwgMCxcbiAgICAgICAgICAgIG1pbGxpc2Vjb25kcyA9IG5vcm1hbGl6ZWRJbnB1dC5taWxsaXNlY29uZCB8fCAwO1xuXG4gICAgICAgIC8vIHJlcHJlc2VudGF0aW9uIGZvciBkYXRlQWRkUmVtb3ZlXG4gICAgICAgIHRoaXMuX21pbGxpc2Vjb25kcyA9ICttaWxsaXNlY29uZHMgK1xuICAgICAgICAgICAgc2Vjb25kcyAqIDFlMyArIC8vIDEwMDBcbiAgICAgICAgICAgIG1pbnV0ZXMgKiA2ZTQgKyAvLyAxMDAwICogNjBcbiAgICAgICAgICAgIGhvdXJzICogMTAwMCAqIDYwICogNjA7IC8vdXNpbmcgMTAwMCAqIDYwICogNjAgaW5zdGVhZCBvZiAzNmU1IHRvIGF2b2lkIGZsb2F0aW5nIHBvaW50IHJvdW5kaW5nIGVycm9ycyBodHRwczovL2dpdGh1Yi5jb20vbW9tZW50L21vbWVudC9pc3N1ZXMvMjk3OFxuICAgICAgICAvLyBCZWNhdXNlIG9mIGRhdGVBZGRSZW1vdmUgdHJlYXRzIDI0IGhvdXJzIGFzIGRpZmZlcmVudCBmcm9tIGFcbiAgICAgICAgLy8gZGF5IHdoZW4gd29ya2luZyBhcm91bmQgRFNULCB3ZSBuZWVkIHRvIHN0b3JlIHRoZW0gc2VwYXJhdGVseVxuICAgICAgICB0aGlzLl9kYXlzID0gK2RheXMgK1xuICAgICAgICAgICAgd2Vla3MgKiA3O1xuICAgICAgICAvLyBJdCBpcyBpbXBvc3NpYmxlIHRyYW5zbGF0ZSBtb250aHMgaW50byBkYXlzIHdpdGhvdXQga25vd2luZ1xuICAgICAgICAvLyB3aGljaCBtb250aHMgeW91IGFyZSBhcmUgdGFsa2luZyBhYm91dCwgc28gd2UgaGF2ZSB0byBzdG9yZVxuICAgICAgICAvLyBpdCBzZXBhcmF0ZWx5LlxuICAgICAgICB0aGlzLl9tb250aHMgPSArbW9udGhzICtcbiAgICAgICAgICAgIHF1YXJ0ZXJzICogMyArXG4gICAgICAgICAgICB5ZWFycyAqIDEyO1xuXG4gICAgICAgIHRoaXMuX2RhdGEgPSB7fTtcblxuICAgICAgICB0aGlzLl9sb2NhbGUgPSBsb2NhbGVfbG9jYWxlc19fZ2V0TG9jYWxlKCk7XG5cbiAgICAgICAgdGhpcy5fYnViYmxlKCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaXNEdXJhdGlvbiAob2JqKSB7XG4gICAgICAgIHJldHVybiBvYmogaW5zdGFuY2VvZiBEdXJhdGlvbjtcbiAgICB9XG5cbiAgICAvLyBGT1JNQVRUSU5HXG5cbiAgICBmdW5jdGlvbiBvZmZzZXQgKHRva2VuLCBzZXBhcmF0b3IpIHtcbiAgICAgICAgYWRkRm9ybWF0VG9rZW4odG9rZW4sIDAsIDAsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBvZmZzZXQgPSB0aGlzLnV0Y09mZnNldCgpO1xuICAgICAgICAgICAgdmFyIHNpZ24gPSAnKyc7XG4gICAgICAgICAgICBpZiAob2Zmc2V0IDwgMCkge1xuICAgICAgICAgICAgICAgIG9mZnNldCA9IC1vZmZzZXQ7XG4gICAgICAgICAgICAgICAgc2lnbiA9ICctJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBzaWduICsgemVyb0ZpbGwofn4ob2Zmc2V0IC8gNjApLCAyKSArIHNlcGFyYXRvciArIHplcm9GaWxsKH5+KG9mZnNldCkgJSA2MCwgMik7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIG9mZnNldCgnWicsICc6Jyk7XG4gICAgb2Zmc2V0KCdaWicsICcnKTtcblxuICAgIC8vIFBBUlNJTkdcblxuICAgIGFkZFJlZ2V4VG9rZW4oJ1onLCAgbWF0Y2hTaG9ydE9mZnNldCk7XG4gICAgYWRkUmVnZXhUb2tlbignWlonLCBtYXRjaFNob3J0T2Zmc2V0KTtcbiAgICBhZGRQYXJzZVRva2VuKFsnWicsICdaWiddLCBmdW5jdGlvbiAoaW5wdXQsIGFycmF5LCBjb25maWcpIHtcbiAgICAgICAgY29uZmlnLl91c2VVVEMgPSB0cnVlO1xuICAgICAgICBjb25maWcuX3R6bSA9IG9mZnNldEZyb21TdHJpbmcobWF0Y2hTaG9ydE9mZnNldCwgaW5wdXQpO1xuICAgIH0pO1xuXG4gICAgLy8gSEVMUEVSU1xuXG4gICAgLy8gdGltZXpvbmUgY2h1bmtlclxuICAgIC8vICcrMTA6MDAnID4gWycxMCcsICAnMDAnXVxuICAgIC8vICctMTUzMCcgID4gWyctMTUnLCAnMzAnXVxuICAgIHZhciBjaHVua09mZnNldCA9IC8oW1xcK1xcLV18XFxkXFxkKS9naTtcblxuICAgIGZ1bmN0aW9uIG9mZnNldEZyb21TdHJpbmcobWF0Y2hlciwgc3RyaW5nKSB7XG4gICAgICAgIHZhciBtYXRjaGVzID0gKChzdHJpbmcgfHwgJycpLm1hdGNoKG1hdGNoZXIpIHx8IFtdKTtcbiAgICAgICAgdmFyIGNodW5rICAgPSBtYXRjaGVzW21hdGNoZXMubGVuZ3RoIC0gMV0gfHwgW107XG4gICAgICAgIHZhciBwYXJ0cyAgID0gKGNodW5rICsgJycpLm1hdGNoKGNodW5rT2Zmc2V0KSB8fCBbJy0nLCAwLCAwXTtcbiAgICAgICAgdmFyIG1pbnV0ZXMgPSArKHBhcnRzWzFdICogNjApICsgdG9JbnQocGFydHNbMl0pO1xuXG4gICAgICAgIHJldHVybiBwYXJ0c1swXSA9PT0gJysnID8gbWludXRlcyA6IC1taW51dGVzO1xuICAgIH1cblxuICAgIC8vIFJldHVybiBhIG1vbWVudCBmcm9tIGlucHV0LCB0aGF0IGlzIGxvY2FsL3V0Yy96b25lIGVxdWl2YWxlbnQgdG8gbW9kZWwuXG4gICAgZnVuY3Rpb24gY2xvbmVXaXRoT2Zmc2V0KGlucHV0LCBtb2RlbCkge1xuICAgICAgICB2YXIgcmVzLCBkaWZmO1xuICAgICAgICBpZiAobW9kZWwuX2lzVVRDKSB7XG4gICAgICAgICAgICByZXMgPSBtb2RlbC5jbG9uZSgpO1xuICAgICAgICAgICAgZGlmZiA9IChpc01vbWVudChpbnB1dCkgfHwgaXNEYXRlKGlucHV0KSA/IGlucHV0LnZhbHVlT2YoKSA6IGxvY2FsX19jcmVhdGVMb2NhbChpbnB1dCkudmFsdWVPZigpKSAtIHJlcy52YWx1ZU9mKCk7XG4gICAgICAgICAgICAvLyBVc2UgbG93LWxldmVsIGFwaSwgYmVjYXVzZSB0aGlzIGZuIGlzIGxvdy1sZXZlbCBhcGkuXG4gICAgICAgICAgICByZXMuX2Quc2V0VGltZShyZXMuX2QudmFsdWVPZigpICsgZGlmZik7XG4gICAgICAgICAgICB1dGlsc19ob29rc19faG9va3MudXBkYXRlT2Zmc2V0KHJlcywgZmFsc2UpO1xuICAgICAgICAgICAgcmV0dXJuIHJlcztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBsb2NhbF9fY3JlYXRlTG9jYWwoaW5wdXQpLmxvY2FsKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZXREYXRlT2Zmc2V0IChtKSB7XG4gICAgICAgIC8vIE9uIEZpcmVmb3guMjQgRGF0ZSNnZXRUaW1lem9uZU9mZnNldCByZXR1cm5zIGEgZmxvYXRpbmcgcG9pbnQuXG4gICAgICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9tb21lbnQvbW9tZW50L3B1bGwvMTg3MVxuICAgICAgICByZXR1cm4gLU1hdGgucm91bmQobS5fZC5nZXRUaW1lem9uZU9mZnNldCgpIC8gMTUpICogMTU7XG4gICAgfVxuXG4gICAgLy8gSE9PS1NcblxuICAgIC8vIFRoaXMgZnVuY3Rpb24gd2lsbCBiZSBjYWxsZWQgd2hlbmV2ZXIgYSBtb21lbnQgaXMgbXV0YXRlZC5cbiAgICAvLyBJdCBpcyBpbnRlbmRlZCB0byBrZWVwIHRoZSBvZmZzZXQgaW4gc3luYyB3aXRoIHRoZSB0aW1lem9uZS5cbiAgICB1dGlsc19ob29rc19faG9va3MudXBkYXRlT2Zmc2V0ID0gZnVuY3Rpb24gKCkge307XG5cbiAgICAvLyBNT01FTlRTXG5cbiAgICAvLyBrZWVwTG9jYWxUaW1lID0gdHJ1ZSBtZWFucyBvbmx5IGNoYW5nZSB0aGUgdGltZXpvbmUsIHdpdGhvdXRcbiAgICAvLyBhZmZlY3RpbmcgdGhlIGxvY2FsIGhvdXIuIFNvIDU6MzE6MjYgKzAzMDAgLS1bdXRjT2Zmc2V0KDIsIHRydWUpXS0tPlxuICAgIC8vIDU6MzE6MjYgKzAyMDAgSXQgaXMgcG9zc2libGUgdGhhdCA1OjMxOjI2IGRvZXNuJ3QgZXhpc3Qgd2l0aCBvZmZzZXRcbiAgICAvLyArMDIwMCwgc28gd2UgYWRqdXN0IHRoZSB0aW1lIGFzIG5lZWRlZCwgdG8gYmUgdmFsaWQuXG4gICAgLy9cbiAgICAvLyBLZWVwaW5nIHRoZSB0aW1lIGFjdHVhbGx5IGFkZHMvc3VidHJhY3RzIChvbmUgaG91cilcbiAgICAvLyBmcm9tIHRoZSBhY3R1YWwgcmVwcmVzZW50ZWQgdGltZS4gVGhhdCBpcyB3aHkgd2UgY2FsbCB1cGRhdGVPZmZzZXRcbiAgICAvLyBhIHNlY29uZCB0aW1lLiBJbiBjYXNlIGl0IHdhbnRzIHVzIHRvIGNoYW5nZSB0aGUgb2Zmc2V0IGFnYWluXG4gICAgLy8gX2NoYW5nZUluUHJvZ3Jlc3MgPT0gdHJ1ZSBjYXNlLCB0aGVuIHdlIGhhdmUgdG8gYWRqdXN0LCBiZWNhdXNlXG4gICAgLy8gdGhlcmUgaXMgbm8gc3VjaCB0aW1lIGluIHRoZSBnaXZlbiB0aW1lem9uZS5cbiAgICBmdW5jdGlvbiBnZXRTZXRPZmZzZXQgKGlucHV0LCBrZWVwTG9jYWxUaW1lKSB7XG4gICAgICAgIHZhciBvZmZzZXQgPSB0aGlzLl9vZmZzZXQgfHwgMCxcbiAgICAgICAgICAgIGxvY2FsQWRqdXN0O1xuICAgICAgICBpZiAoIXRoaXMuaXNWYWxpZCgpKSB7XG4gICAgICAgICAgICByZXR1cm4gaW5wdXQgIT0gbnVsbCA/IHRoaXMgOiBOYU47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGlucHV0ICE9IG51bGwpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgaW5wdXQgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgaW5wdXQgPSBvZmZzZXRGcm9tU3RyaW5nKG1hdGNoU2hvcnRPZmZzZXQsIGlucHV0KTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoTWF0aC5hYnMoaW5wdXQpIDwgMTYpIHtcbiAgICAgICAgICAgICAgICBpbnB1dCA9IGlucHV0ICogNjA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIXRoaXMuX2lzVVRDICYmIGtlZXBMb2NhbFRpbWUpIHtcbiAgICAgICAgICAgICAgICBsb2NhbEFkanVzdCA9IGdldERhdGVPZmZzZXQodGhpcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLl9vZmZzZXQgPSBpbnB1dDtcbiAgICAgICAgICAgIHRoaXMuX2lzVVRDID0gdHJ1ZTtcbiAgICAgICAgICAgIGlmIChsb2NhbEFkanVzdCAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5hZGQobG9jYWxBZGp1c3QsICdtJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAob2Zmc2V0ICE9PSBpbnB1dCkge1xuICAgICAgICAgICAgICAgIGlmICgha2VlcExvY2FsVGltZSB8fCB0aGlzLl9jaGFuZ2VJblByb2dyZXNzKSB7XG4gICAgICAgICAgICAgICAgICAgIGFkZF9zdWJ0cmFjdF9fYWRkU3VidHJhY3QodGhpcywgY3JlYXRlX19jcmVhdGVEdXJhdGlvbihpbnB1dCAtIG9mZnNldCwgJ20nKSwgMSwgZmFsc2UpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoIXRoaXMuX2NoYW5nZUluUHJvZ3Jlc3MpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fY2hhbmdlSW5Qcm9ncmVzcyA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIHV0aWxzX2hvb2tzX19ob29rcy51cGRhdGVPZmZzZXQodGhpcywgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2NoYW5nZUluUHJvZ3Jlc3MgPSBudWxsO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2lzVVRDID8gb2Zmc2V0IDogZ2V0RGF0ZU9mZnNldCh0aGlzKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldFNldFpvbmUgKGlucHV0LCBrZWVwTG9jYWxUaW1lKSB7XG4gICAgICAgIGlmIChpbnB1dCAhPSBudWxsKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGlucHV0ICE9PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgIGlucHV0ID0gLWlucHV0O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLnV0Y09mZnNldChpbnB1dCwga2VlcExvY2FsVGltZSk7XG5cbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIC10aGlzLnV0Y09mZnNldCgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2V0T2Zmc2V0VG9VVEMgKGtlZXBMb2NhbFRpbWUpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudXRjT2Zmc2V0KDAsIGtlZXBMb2NhbFRpbWUpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHNldE9mZnNldFRvTG9jYWwgKGtlZXBMb2NhbFRpbWUpIHtcbiAgICAgICAgaWYgKHRoaXMuX2lzVVRDKSB7XG4gICAgICAgICAgICB0aGlzLnV0Y09mZnNldCgwLCBrZWVwTG9jYWxUaW1lKTtcbiAgICAgICAgICAgIHRoaXMuX2lzVVRDID0gZmFsc2U7XG5cbiAgICAgICAgICAgIGlmIChrZWVwTG9jYWxUaW1lKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zdWJ0cmFjdChnZXREYXRlT2Zmc2V0KHRoaXMpLCAnbScpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHNldE9mZnNldFRvUGFyc2VkT2Zmc2V0ICgpIHtcbiAgICAgICAgaWYgKHRoaXMuX3R6bSkge1xuICAgICAgICAgICAgdGhpcy51dGNPZmZzZXQodGhpcy5fdHptKTtcbiAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgdGhpcy5faSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHRoaXMudXRjT2Zmc2V0KG9mZnNldEZyb21TdHJpbmcobWF0Y2hPZmZzZXQsIHRoaXMuX2kpKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBoYXNBbGlnbmVkSG91ck9mZnNldCAoaW5wdXQpIHtcbiAgICAgICAgaWYgKCF0aGlzLmlzVmFsaWQoKSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGlucHV0ID0gaW5wdXQgPyBsb2NhbF9fY3JlYXRlTG9jYWwoaW5wdXQpLnV0Y09mZnNldCgpIDogMDtcblxuICAgICAgICByZXR1cm4gKHRoaXMudXRjT2Zmc2V0KCkgLSBpbnB1dCkgJSA2MCA9PT0gMDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBpc0RheWxpZ2h0U2F2aW5nVGltZSAoKSB7XG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICB0aGlzLnV0Y09mZnNldCgpID4gdGhpcy5jbG9uZSgpLm1vbnRoKDApLnV0Y09mZnNldCgpIHx8XG4gICAgICAgICAgICB0aGlzLnV0Y09mZnNldCgpID4gdGhpcy5jbG9uZSgpLm1vbnRoKDUpLnV0Y09mZnNldCgpXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaXNEYXlsaWdodFNhdmluZ1RpbWVTaGlmdGVkICgpIHtcbiAgICAgICAgaWYgKCFpc1VuZGVmaW5lZCh0aGlzLl9pc0RTVFNoaWZ0ZWQpKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5faXNEU1RTaGlmdGVkO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGMgPSB7fTtcblxuICAgICAgICBjb3B5Q29uZmlnKGMsIHRoaXMpO1xuICAgICAgICBjID0gcHJlcGFyZUNvbmZpZyhjKTtcblxuICAgICAgICBpZiAoYy5fYSkge1xuICAgICAgICAgICAgdmFyIG90aGVyID0gYy5faXNVVEMgPyBjcmVhdGVfdXRjX19jcmVhdGVVVEMoYy5fYSkgOiBsb2NhbF9fY3JlYXRlTG9jYWwoYy5fYSk7XG4gICAgICAgICAgICB0aGlzLl9pc0RTVFNoaWZ0ZWQgPSB0aGlzLmlzVmFsaWQoKSAmJlxuICAgICAgICAgICAgICAgIGNvbXBhcmVBcnJheXMoYy5fYSwgb3RoZXIudG9BcnJheSgpKSA+IDA7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl9pc0RTVFNoaWZ0ZWQgPSBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzLl9pc0RTVFNoaWZ0ZWQ7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaXNMb2NhbCAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmlzVmFsaWQoKSA/ICF0aGlzLl9pc1VUQyA6IGZhbHNlO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGlzVXRjT2Zmc2V0ICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuaXNWYWxpZCgpID8gdGhpcy5faXNVVEMgOiBmYWxzZTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBpc1V0YyAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmlzVmFsaWQoKSA/IHRoaXMuX2lzVVRDICYmIHRoaXMuX29mZnNldCA9PT0gMCA6IGZhbHNlO1xuICAgIH1cblxuICAgIC8vIEFTUC5ORVQganNvbiBkYXRlIGZvcm1hdCByZWdleFxuICAgIHZhciBhc3BOZXRSZWdleCA9IC9eKFxcLSk/KD86KFxcZCopWy4gXSk/KFxcZCspXFw6KFxcZCspKD86XFw6KFxcZCspXFwuPyhcXGR7M30pP1xcZCopPyQvO1xuXG4gICAgLy8gZnJvbSBodHRwOi8vZG9jcy5jbG9zdXJlLWxpYnJhcnkuZ29vZ2xlY29kZS5jb20vZ2l0L2Nsb3N1cmVfZ29vZ19kYXRlX2RhdGUuanMuc291cmNlLmh0bWxcbiAgICAvLyBzb21ld2hhdCBtb3JlIGluIGxpbmUgd2l0aCA0LjQuMy4yIDIwMDQgc3BlYywgYnV0IGFsbG93cyBkZWNpbWFsIGFueXdoZXJlXG4gICAgLy8gYW5kIGZ1cnRoZXIgbW9kaWZpZWQgdG8gYWxsb3cgZm9yIHN0cmluZ3MgY29udGFpbmluZyBib3RoIHdlZWsgYW5kIGRheVxuICAgIHZhciBpc29SZWdleCA9IC9eKC0pP1AoPzooLT9bMC05LC5dKilZKT8oPzooLT9bMC05LC5dKilNKT8oPzooLT9bMC05LC5dKilXKT8oPzooLT9bMC05LC5dKilEKT8oPzpUKD86KC0/WzAtOSwuXSopSCk/KD86KC0/WzAtOSwuXSopTSk/KD86KC0/WzAtOSwuXSopUyk/KT8kLztcblxuICAgIGZ1bmN0aW9uIGNyZWF0ZV9fY3JlYXRlRHVyYXRpb24gKGlucHV0LCBrZXkpIHtcbiAgICAgICAgdmFyIGR1cmF0aW9uID0gaW5wdXQsXG4gICAgICAgICAgICAvLyBtYXRjaGluZyBhZ2FpbnN0IHJlZ2V4cCBpcyBleHBlbnNpdmUsIGRvIGl0IG9uIGRlbWFuZFxuICAgICAgICAgICAgbWF0Y2ggPSBudWxsLFxuICAgICAgICAgICAgc2lnbixcbiAgICAgICAgICAgIHJldCxcbiAgICAgICAgICAgIGRpZmZSZXM7XG5cbiAgICAgICAgaWYgKGlzRHVyYXRpb24oaW5wdXQpKSB7XG4gICAgICAgICAgICBkdXJhdGlvbiA9IHtcbiAgICAgICAgICAgICAgICBtcyA6IGlucHV0Ll9taWxsaXNlY29uZHMsXG4gICAgICAgICAgICAgICAgZCAgOiBpbnB1dC5fZGF5cyxcbiAgICAgICAgICAgICAgICBNICA6IGlucHV0Ll9tb250aHNcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIGlucHV0ID09PSAnbnVtYmVyJykge1xuICAgICAgICAgICAgZHVyYXRpb24gPSB7fTtcbiAgICAgICAgICAgIGlmIChrZXkpIHtcbiAgICAgICAgICAgICAgICBkdXJhdGlvbltrZXldID0gaW5wdXQ7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGR1cmF0aW9uLm1pbGxpc2Vjb25kcyA9IGlucHV0O1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKCEhKG1hdGNoID0gYXNwTmV0UmVnZXguZXhlYyhpbnB1dCkpKSB7XG4gICAgICAgICAgICBzaWduID0gKG1hdGNoWzFdID09PSAnLScpID8gLTEgOiAxO1xuICAgICAgICAgICAgZHVyYXRpb24gPSB7XG4gICAgICAgICAgICAgICAgeSAgOiAwLFxuICAgICAgICAgICAgICAgIGQgIDogdG9JbnQobWF0Y2hbREFURV0pICAgICAgICAqIHNpZ24sXG4gICAgICAgICAgICAgICAgaCAgOiB0b0ludChtYXRjaFtIT1VSXSkgICAgICAgICogc2lnbixcbiAgICAgICAgICAgICAgICBtICA6IHRvSW50KG1hdGNoW01JTlVURV0pICAgICAgKiBzaWduLFxuICAgICAgICAgICAgICAgIHMgIDogdG9JbnQobWF0Y2hbU0VDT05EXSkgICAgICAqIHNpZ24sXG4gICAgICAgICAgICAgICAgbXMgOiB0b0ludChtYXRjaFtNSUxMSVNFQ09ORF0pICogc2lnblxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSBlbHNlIGlmICghIShtYXRjaCA9IGlzb1JlZ2V4LmV4ZWMoaW5wdXQpKSkge1xuICAgICAgICAgICAgc2lnbiA9IChtYXRjaFsxXSA9PT0gJy0nKSA/IC0xIDogMTtcbiAgICAgICAgICAgIGR1cmF0aW9uID0ge1xuICAgICAgICAgICAgICAgIHkgOiBwYXJzZUlzbyhtYXRjaFsyXSwgc2lnbiksXG4gICAgICAgICAgICAgICAgTSA6IHBhcnNlSXNvKG1hdGNoWzNdLCBzaWduKSxcbiAgICAgICAgICAgICAgICB3IDogcGFyc2VJc28obWF0Y2hbNF0sIHNpZ24pLFxuICAgICAgICAgICAgICAgIGQgOiBwYXJzZUlzbyhtYXRjaFs1XSwgc2lnbiksXG4gICAgICAgICAgICAgICAgaCA6IHBhcnNlSXNvKG1hdGNoWzZdLCBzaWduKSxcbiAgICAgICAgICAgICAgICBtIDogcGFyc2VJc28obWF0Y2hbN10sIHNpZ24pLFxuICAgICAgICAgICAgICAgIHMgOiBwYXJzZUlzbyhtYXRjaFs4XSwgc2lnbilcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0gZWxzZSBpZiAoZHVyYXRpb24gPT0gbnVsbCkgey8vIGNoZWNrcyBmb3IgbnVsbCBvciB1bmRlZmluZWRcbiAgICAgICAgICAgIGR1cmF0aW9uID0ge307XG4gICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIGR1cmF0aW9uID09PSAnb2JqZWN0JyAmJiAoJ2Zyb20nIGluIGR1cmF0aW9uIHx8ICd0bycgaW4gZHVyYXRpb24pKSB7XG4gICAgICAgICAgICBkaWZmUmVzID0gbW9tZW50c0RpZmZlcmVuY2UobG9jYWxfX2NyZWF0ZUxvY2FsKGR1cmF0aW9uLmZyb20pLCBsb2NhbF9fY3JlYXRlTG9jYWwoZHVyYXRpb24udG8pKTtcblxuICAgICAgICAgICAgZHVyYXRpb24gPSB7fTtcbiAgICAgICAgICAgIGR1cmF0aW9uLm1zID0gZGlmZlJlcy5taWxsaXNlY29uZHM7XG4gICAgICAgICAgICBkdXJhdGlvbi5NID0gZGlmZlJlcy5tb250aHM7XG4gICAgICAgIH1cblxuICAgICAgICByZXQgPSBuZXcgRHVyYXRpb24oZHVyYXRpb24pO1xuXG4gICAgICAgIGlmIChpc0R1cmF0aW9uKGlucHV0KSAmJiBoYXNPd25Qcm9wKGlucHV0LCAnX2xvY2FsZScpKSB7XG4gICAgICAgICAgICByZXQuX2xvY2FsZSA9IGlucHV0Ll9sb2NhbGU7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmV0O1xuICAgIH1cblxuICAgIGNyZWF0ZV9fY3JlYXRlRHVyYXRpb24uZm4gPSBEdXJhdGlvbi5wcm90b3R5cGU7XG5cbiAgICBmdW5jdGlvbiBwYXJzZUlzbyAoaW5wLCBzaWduKSB7XG4gICAgICAgIC8vIFdlJ2Qgbm9ybWFsbHkgdXNlIH5+aW5wIGZvciB0aGlzLCBidXQgdW5mb3J0dW5hdGVseSBpdCBhbHNvXG4gICAgICAgIC8vIGNvbnZlcnRzIGZsb2F0cyB0byBpbnRzLlxuICAgICAgICAvLyBpbnAgbWF5IGJlIHVuZGVmaW5lZCwgc28gY2FyZWZ1bCBjYWxsaW5nIHJlcGxhY2Ugb24gaXQuXG4gICAgICAgIHZhciByZXMgPSBpbnAgJiYgcGFyc2VGbG9hdChpbnAucmVwbGFjZSgnLCcsICcuJykpO1xuICAgICAgICAvLyBhcHBseSBzaWduIHdoaWxlIHdlJ3JlIGF0IGl0XG4gICAgICAgIHJldHVybiAoaXNOYU4ocmVzKSA/IDAgOiByZXMpICogc2lnbjtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwb3NpdGl2ZU1vbWVudHNEaWZmZXJlbmNlKGJhc2UsIG90aGVyKSB7XG4gICAgICAgIHZhciByZXMgPSB7bWlsbGlzZWNvbmRzOiAwLCBtb250aHM6IDB9O1xuXG4gICAgICAgIHJlcy5tb250aHMgPSBvdGhlci5tb250aCgpIC0gYmFzZS5tb250aCgpICtcbiAgICAgICAgICAgIChvdGhlci55ZWFyKCkgLSBiYXNlLnllYXIoKSkgKiAxMjtcbiAgICAgICAgaWYgKGJhc2UuY2xvbmUoKS5hZGQocmVzLm1vbnRocywgJ00nKS5pc0FmdGVyKG90aGVyKSkge1xuICAgICAgICAgICAgLS1yZXMubW9udGhzO1xuICAgICAgICB9XG5cbiAgICAgICAgcmVzLm1pbGxpc2Vjb25kcyA9ICtvdGhlciAtICsoYmFzZS5jbG9uZSgpLmFkZChyZXMubW9udGhzLCAnTScpKTtcblxuICAgICAgICByZXR1cm4gcmVzO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIG1vbWVudHNEaWZmZXJlbmNlKGJhc2UsIG90aGVyKSB7XG4gICAgICAgIHZhciByZXM7XG4gICAgICAgIGlmICghKGJhc2UuaXNWYWxpZCgpICYmIG90aGVyLmlzVmFsaWQoKSkpIHtcbiAgICAgICAgICAgIHJldHVybiB7bWlsbGlzZWNvbmRzOiAwLCBtb250aHM6IDB9O1xuICAgICAgICB9XG5cbiAgICAgICAgb3RoZXIgPSBjbG9uZVdpdGhPZmZzZXQob3RoZXIsIGJhc2UpO1xuICAgICAgICBpZiAoYmFzZS5pc0JlZm9yZShvdGhlcikpIHtcbiAgICAgICAgICAgIHJlcyA9IHBvc2l0aXZlTW9tZW50c0RpZmZlcmVuY2UoYmFzZSwgb3RoZXIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVzID0gcG9zaXRpdmVNb21lbnRzRGlmZmVyZW5jZShvdGhlciwgYmFzZSk7XG4gICAgICAgICAgICByZXMubWlsbGlzZWNvbmRzID0gLXJlcy5taWxsaXNlY29uZHM7XG4gICAgICAgICAgICByZXMubW9udGhzID0gLXJlcy5tb250aHM7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmVzO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGFic1JvdW5kIChudW1iZXIpIHtcbiAgICAgICAgaWYgKG51bWJlciA8IDApIHtcbiAgICAgICAgICAgIHJldHVybiBNYXRoLnJvdW5kKC0xICogbnVtYmVyKSAqIC0xO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIE1hdGgucm91bmQobnVtYmVyKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIFRPRE86IHJlbW92ZSAnbmFtZScgYXJnIGFmdGVyIGRlcHJlY2F0aW9uIGlzIHJlbW92ZWRcbiAgICBmdW5jdGlvbiBjcmVhdGVBZGRlcihkaXJlY3Rpb24sIG5hbWUpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICh2YWwsIHBlcmlvZCkge1xuICAgICAgICAgICAgdmFyIGR1ciwgdG1wO1xuICAgICAgICAgICAgLy9pbnZlcnQgdGhlIGFyZ3VtZW50cywgYnV0IGNvbXBsYWluIGFib3V0IGl0XG4gICAgICAgICAgICBpZiAocGVyaW9kICE9PSBudWxsICYmICFpc05hTigrcGVyaW9kKSkge1xuICAgICAgICAgICAgICAgIGRlcHJlY2F0ZVNpbXBsZShuYW1lLCAnbW9tZW50KCkuJyArIG5hbWUgICsgJyhwZXJpb2QsIG51bWJlcikgaXMgZGVwcmVjYXRlZC4gUGxlYXNlIHVzZSBtb21lbnQoKS4nICsgbmFtZSArICcobnVtYmVyLCBwZXJpb2QpLiAnICtcbiAgICAgICAgICAgICAgICAnU2VlIGh0dHA6Ly9tb21lbnRqcy5jb20vZ3VpZGVzLyMvd2FybmluZ3MvYWRkLWludmVydGVkLXBhcmFtLyBmb3IgbW9yZSBpbmZvLicpO1xuICAgICAgICAgICAgICAgIHRtcCA9IHZhbDsgdmFsID0gcGVyaW9kOyBwZXJpb2QgPSB0bXA7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhbCA9IHR5cGVvZiB2YWwgPT09ICdzdHJpbmcnID8gK3ZhbCA6IHZhbDtcbiAgICAgICAgICAgIGR1ciA9IGNyZWF0ZV9fY3JlYXRlRHVyYXRpb24odmFsLCBwZXJpb2QpO1xuICAgICAgICAgICAgYWRkX3N1YnRyYWN0X19hZGRTdWJ0cmFjdCh0aGlzLCBkdXIsIGRpcmVjdGlvbik7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBhZGRfc3VidHJhY3RfX2FkZFN1YnRyYWN0IChtb20sIGR1cmF0aW9uLCBpc0FkZGluZywgdXBkYXRlT2Zmc2V0KSB7XG4gICAgICAgIHZhciBtaWxsaXNlY29uZHMgPSBkdXJhdGlvbi5fbWlsbGlzZWNvbmRzLFxuICAgICAgICAgICAgZGF5cyA9IGFic1JvdW5kKGR1cmF0aW9uLl9kYXlzKSxcbiAgICAgICAgICAgIG1vbnRocyA9IGFic1JvdW5kKGR1cmF0aW9uLl9tb250aHMpO1xuXG4gICAgICAgIGlmICghbW9tLmlzVmFsaWQoKSkge1xuICAgICAgICAgICAgLy8gTm8gb3BcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHVwZGF0ZU9mZnNldCA9IHVwZGF0ZU9mZnNldCA9PSBudWxsID8gdHJ1ZSA6IHVwZGF0ZU9mZnNldDtcblxuICAgICAgICBpZiAobWlsbGlzZWNvbmRzKSB7XG4gICAgICAgICAgICBtb20uX2Quc2V0VGltZShtb20uX2QudmFsdWVPZigpICsgbWlsbGlzZWNvbmRzICogaXNBZGRpbmcpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChkYXlzKSB7XG4gICAgICAgICAgICBnZXRfc2V0X19zZXQobW9tLCAnRGF0ZScsIGdldF9zZXRfX2dldChtb20sICdEYXRlJykgKyBkYXlzICogaXNBZGRpbmcpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChtb250aHMpIHtcbiAgICAgICAgICAgIHNldE1vbnRoKG1vbSwgZ2V0X3NldF9fZ2V0KG1vbSwgJ01vbnRoJykgKyBtb250aHMgKiBpc0FkZGluZyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHVwZGF0ZU9mZnNldCkge1xuICAgICAgICAgICAgdXRpbHNfaG9va3NfX2hvb2tzLnVwZGF0ZU9mZnNldChtb20sIGRheXMgfHwgbW9udGhzKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHZhciBhZGRfc3VidHJhY3RfX2FkZCAgICAgID0gY3JlYXRlQWRkZXIoMSwgJ2FkZCcpO1xuICAgIHZhciBhZGRfc3VidHJhY3RfX3N1YnRyYWN0ID0gY3JlYXRlQWRkZXIoLTEsICdzdWJ0cmFjdCcpO1xuXG4gICAgZnVuY3Rpb24gZ2V0Q2FsZW5kYXJGb3JtYXQobXlNb21lbnQsIG5vdykge1xuICAgICAgICB2YXIgZGlmZiA9IG15TW9tZW50LmRpZmYobm93LCAnZGF5cycsIHRydWUpO1xuICAgICAgICByZXR1cm4gZGlmZiA8IC02ID8gJ3NhbWVFbHNlJyA6XG4gICAgICAgICAgICAgICAgZGlmZiA8IC0xID8gJ2xhc3RXZWVrJyA6XG4gICAgICAgICAgICAgICAgZGlmZiA8IDAgPyAnbGFzdERheScgOlxuICAgICAgICAgICAgICAgIGRpZmYgPCAxID8gJ3NhbWVEYXknIDpcbiAgICAgICAgICAgICAgICBkaWZmIDwgMiA/ICduZXh0RGF5JyA6XG4gICAgICAgICAgICAgICAgZGlmZiA8IDcgPyAnbmV4dFdlZWsnIDogJ3NhbWVFbHNlJztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBtb21lbnRfY2FsZW5kYXJfX2NhbGVuZGFyICh0aW1lLCBmb3JtYXRzKSB7XG4gICAgICAgIC8vIFdlIHdhbnQgdG8gY29tcGFyZSB0aGUgc3RhcnQgb2YgdG9kYXksIHZzIHRoaXMuXG4gICAgICAgIC8vIEdldHRpbmcgc3RhcnQtb2YtdG9kYXkgZGVwZW5kcyBvbiB3aGV0aGVyIHdlJ3JlIGxvY2FsL3V0Yy9vZmZzZXQgb3Igbm90LlxuICAgICAgICB2YXIgbm93ID0gdGltZSB8fCBsb2NhbF9fY3JlYXRlTG9jYWwoKSxcbiAgICAgICAgICAgIHNvZCA9IGNsb25lV2l0aE9mZnNldChub3csIHRoaXMpLnN0YXJ0T2YoJ2RheScpLFxuICAgICAgICAgICAgZm9ybWF0ID0gdXRpbHNfaG9va3NfX2hvb2tzLmNhbGVuZGFyRm9ybWF0KHRoaXMsIHNvZCkgfHwgJ3NhbWVFbHNlJztcblxuICAgICAgICB2YXIgb3V0cHV0ID0gZm9ybWF0cyAmJiAoaXNGdW5jdGlvbihmb3JtYXRzW2Zvcm1hdF0pID8gZm9ybWF0c1tmb3JtYXRdLmNhbGwodGhpcywgbm93KSA6IGZvcm1hdHNbZm9ybWF0XSk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuZm9ybWF0KG91dHB1dCB8fCB0aGlzLmxvY2FsZURhdGEoKS5jYWxlbmRhcihmb3JtYXQsIHRoaXMsIGxvY2FsX19jcmVhdGVMb2NhbChub3cpKSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY2xvbmUgKCkge1xuICAgICAgICByZXR1cm4gbmV3IE1vbWVudCh0aGlzKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBpc0FmdGVyIChpbnB1dCwgdW5pdHMpIHtcbiAgICAgICAgdmFyIGxvY2FsSW5wdXQgPSBpc01vbWVudChpbnB1dCkgPyBpbnB1dCA6IGxvY2FsX19jcmVhdGVMb2NhbChpbnB1dCk7XG4gICAgICAgIGlmICghKHRoaXMuaXNWYWxpZCgpICYmIGxvY2FsSW5wdXQuaXNWYWxpZCgpKSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIHVuaXRzID0gbm9ybWFsaXplVW5pdHMoIWlzVW5kZWZpbmVkKHVuaXRzKSA/IHVuaXRzIDogJ21pbGxpc2Vjb25kJyk7XG4gICAgICAgIGlmICh1bml0cyA9PT0gJ21pbGxpc2Vjb25kJykge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMudmFsdWVPZigpID4gbG9jYWxJbnB1dC52YWx1ZU9mKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gbG9jYWxJbnB1dC52YWx1ZU9mKCkgPCB0aGlzLmNsb25lKCkuc3RhcnRPZih1bml0cykudmFsdWVPZigpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaXNCZWZvcmUgKGlucHV0LCB1bml0cykge1xuICAgICAgICB2YXIgbG9jYWxJbnB1dCA9IGlzTW9tZW50KGlucHV0KSA/IGlucHV0IDogbG9jYWxfX2NyZWF0ZUxvY2FsKGlucHV0KTtcbiAgICAgICAgaWYgKCEodGhpcy5pc1ZhbGlkKCkgJiYgbG9jYWxJbnB1dC5pc1ZhbGlkKCkpKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgdW5pdHMgPSBub3JtYWxpemVVbml0cyghaXNVbmRlZmluZWQodW5pdHMpID8gdW5pdHMgOiAnbWlsbGlzZWNvbmQnKTtcbiAgICAgICAgaWYgKHVuaXRzID09PSAnbWlsbGlzZWNvbmQnKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy52YWx1ZU9mKCkgPCBsb2NhbElucHV0LnZhbHVlT2YoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmNsb25lKCkuZW5kT2YodW5pdHMpLnZhbHVlT2YoKSA8IGxvY2FsSW5wdXQudmFsdWVPZigpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaXNCZXR3ZWVuIChmcm9tLCB0bywgdW5pdHMsIGluY2x1c2l2aXR5KSB7XG4gICAgICAgIGluY2x1c2l2aXR5ID0gaW5jbHVzaXZpdHkgfHwgJygpJztcbiAgICAgICAgcmV0dXJuIChpbmNsdXNpdml0eVswXSA9PT0gJygnID8gdGhpcy5pc0FmdGVyKGZyb20sIHVuaXRzKSA6ICF0aGlzLmlzQmVmb3JlKGZyb20sIHVuaXRzKSkgJiZcbiAgICAgICAgICAgIChpbmNsdXNpdml0eVsxXSA9PT0gJyknID8gdGhpcy5pc0JlZm9yZSh0bywgdW5pdHMpIDogIXRoaXMuaXNBZnRlcih0bywgdW5pdHMpKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBpc1NhbWUgKGlucHV0LCB1bml0cykge1xuICAgICAgICB2YXIgbG9jYWxJbnB1dCA9IGlzTW9tZW50KGlucHV0KSA/IGlucHV0IDogbG9jYWxfX2NyZWF0ZUxvY2FsKGlucHV0KSxcbiAgICAgICAgICAgIGlucHV0TXM7XG4gICAgICAgIGlmICghKHRoaXMuaXNWYWxpZCgpICYmIGxvY2FsSW5wdXQuaXNWYWxpZCgpKSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIHVuaXRzID0gbm9ybWFsaXplVW5pdHModW5pdHMgfHwgJ21pbGxpc2Vjb25kJyk7XG4gICAgICAgIGlmICh1bml0cyA9PT0gJ21pbGxpc2Vjb25kJykge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMudmFsdWVPZigpID09PSBsb2NhbElucHV0LnZhbHVlT2YoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlucHV0TXMgPSBsb2NhbElucHV0LnZhbHVlT2YoKTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmNsb25lKCkuc3RhcnRPZih1bml0cykudmFsdWVPZigpIDw9IGlucHV0TXMgJiYgaW5wdXRNcyA8PSB0aGlzLmNsb25lKCkuZW5kT2YodW5pdHMpLnZhbHVlT2YoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGlzU2FtZU9yQWZ0ZXIgKGlucHV0LCB1bml0cykge1xuICAgICAgICByZXR1cm4gdGhpcy5pc1NhbWUoaW5wdXQsIHVuaXRzKSB8fCB0aGlzLmlzQWZ0ZXIoaW5wdXQsdW5pdHMpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGlzU2FtZU9yQmVmb3JlIChpbnB1dCwgdW5pdHMpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuaXNTYW1lKGlucHV0LCB1bml0cykgfHwgdGhpcy5pc0JlZm9yZShpbnB1dCx1bml0cyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZGlmZiAoaW5wdXQsIHVuaXRzLCBhc0Zsb2F0KSB7XG4gICAgICAgIHZhciB0aGF0LFxuICAgICAgICAgICAgem9uZURlbHRhLFxuICAgICAgICAgICAgZGVsdGEsIG91dHB1dDtcblxuICAgICAgICBpZiAoIXRoaXMuaXNWYWxpZCgpKSB7XG4gICAgICAgICAgICByZXR1cm4gTmFOO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhhdCA9IGNsb25lV2l0aE9mZnNldChpbnB1dCwgdGhpcyk7XG5cbiAgICAgICAgaWYgKCF0aGF0LmlzVmFsaWQoKSkge1xuICAgICAgICAgICAgcmV0dXJuIE5hTjtcbiAgICAgICAgfVxuXG4gICAgICAgIHpvbmVEZWx0YSA9ICh0aGF0LnV0Y09mZnNldCgpIC0gdGhpcy51dGNPZmZzZXQoKSkgKiA2ZTQ7XG5cbiAgICAgICAgdW5pdHMgPSBub3JtYWxpemVVbml0cyh1bml0cyk7XG5cbiAgICAgICAgaWYgKHVuaXRzID09PSAneWVhcicgfHwgdW5pdHMgPT09ICdtb250aCcgfHwgdW5pdHMgPT09ICdxdWFydGVyJykge1xuICAgICAgICAgICAgb3V0cHV0ID0gbW9udGhEaWZmKHRoaXMsIHRoYXQpO1xuICAgICAgICAgICAgaWYgKHVuaXRzID09PSAncXVhcnRlcicpIHtcbiAgICAgICAgICAgICAgICBvdXRwdXQgPSBvdXRwdXQgLyAzO1xuICAgICAgICAgICAgfSBlbHNlIGlmICh1bml0cyA9PT0gJ3llYXInKSB7XG4gICAgICAgICAgICAgICAgb3V0cHV0ID0gb3V0cHV0IC8gMTI7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBkZWx0YSA9IHRoaXMgLSB0aGF0O1xuICAgICAgICAgICAgb3V0cHV0ID0gdW5pdHMgPT09ICdzZWNvbmQnID8gZGVsdGEgLyAxZTMgOiAvLyAxMDAwXG4gICAgICAgICAgICAgICAgdW5pdHMgPT09ICdtaW51dGUnID8gZGVsdGEgLyA2ZTQgOiAvLyAxMDAwICogNjBcbiAgICAgICAgICAgICAgICB1bml0cyA9PT0gJ2hvdXInID8gZGVsdGEgLyAzNmU1IDogLy8gMTAwMCAqIDYwICogNjBcbiAgICAgICAgICAgICAgICB1bml0cyA9PT0gJ2RheScgPyAoZGVsdGEgLSB6b25lRGVsdGEpIC8gODY0ZTUgOiAvLyAxMDAwICogNjAgKiA2MCAqIDI0LCBuZWdhdGUgZHN0XG4gICAgICAgICAgICAgICAgdW5pdHMgPT09ICd3ZWVrJyA/IChkZWx0YSAtIHpvbmVEZWx0YSkgLyA2MDQ4ZTUgOiAvLyAxMDAwICogNjAgKiA2MCAqIDI0ICogNywgbmVnYXRlIGRzdFxuICAgICAgICAgICAgICAgIGRlbHRhO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBhc0Zsb2F0ID8gb3V0cHV0IDogYWJzRmxvb3Iob3V0cHV0KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBtb250aERpZmYgKGEsIGIpIHtcbiAgICAgICAgLy8gZGlmZmVyZW5jZSBpbiBtb250aHNcbiAgICAgICAgdmFyIHdob2xlTW9udGhEaWZmID0gKChiLnllYXIoKSAtIGEueWVhcigpKSAqIDEyKSArIChiLm1vbnRoKCkgLSBhLm1vbnRoKCkpLFxuICAgICAgICAgICAgLy8gYiBpcyBpbiAoYW5jaG9yIC0gMSBtb250aCwgYW5jaG9yICsgMSBtb250aClcbiAgICAgICAgICAgIGFuY2hvciA9IGEuY2xvbmUoKS5hZGQod2hvbGVNb250aERpZmYsICdtb250aHMnKSxcbiAgICAgICAgICAgIGFuY2hvcjIsIGFkanVzdDtcblxuICAgICAgICBpZiAoYiAtIGFuY2hvciA8IDApIHtcbiAgICAgICAgICAgIGFuY2hvcjIgPSBhLmNsb25lKCkuYWRkKHdob2xlTW9udGhEaWZmIC0gMSwgJ21vbnRocycpO1xuICAgICAgICAgICAgLy8gbGluZWFyIGFjcm9zcyB0aGUgbW9udGhcbiAgICAgICAgICAgIGFkanVzdCA9IChiIC0gYW5jaG9yKSAvIChhbmNob3IgLSBhbmNob3IyKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGFuY2hvcjIgPSBhLmNsb25lKCkuYWRkKHdob2xlTW9udGhEaWZmICsgMSwgJ21vbnRocycpO1xuICAgICAgICAgICAgLy8gbGluZWFyIGFjcm9zcyB0aGUgbW9udGhcbiAgICAgICAgICAgIGFkanVzdCA9IChiIC0gYW5jaG9yKSAvIChhbmNob3IyIC0gYW5jaG9yKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vY2hlY2sgZm9yIG5lZ2F0aXZlIHplcm8sIHJldHVybiB6ZXJvIGlmIG5lZ2F0aXZlIHplcm9cbiAgICAgICAgcmV0dXJuIC0od2hvbGVNb250aERpZmYgKyBhZGp1c3QpIHx8IDA7XG4gICAgfVxuXG4gICAgdXRpbHNfaG9va3NfX2hvb2tzLmRlZmF1bHRGb3JtYXQgPSAnWVlZWS1NTS1ERFRISDptbTpzc1onO1xuICAgIHV0aWxzX2hvb2tzX19ob29rcy5kZWZhdWx0Rm9ybWF0VXRjID0gJ1lZWVktTU0tRERUSEg6bW06c3NbWl0nO1xuXG4gICAgZnVuY3Rpb24gdG9TdHJpbmcgKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jbG9uZSgpLmxvY2FsZSgnZW4nKS5mb3JtYXQoJ2RkZCBNTU0gREQgWVlZWSBISDptbTpzcyBbR01UXVpaJyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbW9tZW50X2Zvcm1hdF9fdG9JU09TdHJpbmcgKCkge1xuICAgICAgICB2YXIgbSA9IHRoaXMuY2xvbmUoKS51dGMoKTtcbiAgICAgICAgaWYgKDAgPCBtLnllYXIoKSAmJiBtLnllYXIoKSA8PSA5OTk5KSB7XG4gICAgICAgICAgICBpZiAoaXNGdW5jdGlvbihEYXRlLnByb3RvdHlwZS50b0lTT1N0cmluZykpIHtcbiAgICAgICAgICAgICAgICAvLyBuYXRpdmUgaW1wbGVtZW50YXRpb24gaXMgfjUweCBmYXN0ZXIsIHVzZSBpdCB3aGVuIHdlIGNhblxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnRvRGF0ZSgpLnRvSVNPU3RyaW5nKCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiBmb3JtYXRNb21lbnQobSwgJ1lZWVktTU0tRERbVF1ISDptbTpzcy5TU1NbWl0nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBmb3JtYXRNb21lbnQobSwgJ1lZWVlZWS1NTS1ERFtUXUhIOm1tOnNzLlNTU1taXScpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZm9ybWF0IChpbnB1dFN0cmluZykge1xuICAgICAgICBpZiAoIWlucHV0U3RyaW5nKSB7XG4gICAgICAgICAgICBpbnB1dFN0cmluZyA9IHRoaXMuaXNVdGMoKSA/IHV0aWxzX2hvb2tzX19ob29rcy5kZWZhdWx0Rm9ybWF0VXRjIDogdXRpbHNfaG9va3NfX2hvb2tzLmRlZmF1bHRGb3JtYXQ7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIG91dHB1dCA9IGZvcm1hdE1vbWVudCh0aGlzLCBpbnB1dFN0cmluZyk7XG4gICAgICAgIHJldHVybiB0aGlzLmxvY2FsZURhdGEoKS5wb3N0Zm9ybWF0KG91dHB1dCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZnJvbSAodGltZSwgd2l0aG91dFN1ZmZpeCkge1xuICAgICAgICBpZiAodGhpcy5pc1ZhbGlkKCkgJiZcbiAgICAgICAgICAgICAgICAoKGlzTW9tZW50KHRpbWUpICYmIHRpbWUuaXNWYWxpZCgpKSB8fFxuICAgICAgICAgICAgICAgICBsb2NhbF9fY3JlYXRlTG9jYWwodGltZSkuaXNWYWxpZCgpKSkge1xuICAgICAgICAgICAgcmV0dXJuIGNyZWF0ZV9fY3JlYXRlRHVyYXRpb24oe3RvOiB0aGlzLCBmcm9tOiB0aW1lfSkubG9jYWxlKHRoaXMubG9jYWxlKCkpLmh1bWFuaXplKCF3aXRob3V0U3VmZml4KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmxvY2FsZURhdGEoKS5pbnZhbGlkRGF0ZSgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZnJvbU5vdyAod2l0aG91dFN1ZmZpeCkge1xuICAgICAgICByZXR1cm4gdGhpcy5mcm9tKGxvY2FsX19jcmVhdGVMb2NhbCgpLCB3aXRob3V0U3VmZml4KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiB0byAodGltZSwgd2l0aG91dFN1ZmZpeCkge1xuICAgICAgICBpZiAodGhpcy5pc1ZhbGlkKCkgJiZcbiAgICAgICAgICAgICAgICAoKGlzTW9tZW50KHRpbWUpICYmIHRpbWUuaXNWYWxpZCgpKSB8fFxuICAgICAgICAgICAgICAgICBsb2NhbF9fY3JlYXRlTG9jYWwodGltZSkuaXNWYWxpZCgpKSkge1xuICAgICAgICAgICAgcmV0dXJuIGNyZWF0ZV9fY3JlYXRlRHVyYXRpb24oe2Zyb206IHRoaXMsIHRvOiB0aW1lfSkubG9jYWxlKHRoaXMubG9jYWxlKCkpLmh1bWFuaXplKCF3aXRob3V0U3VmZml4KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmxvY2FsZURhdGEoKS5pbnZhbGlkRGF0ZSgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gdG9Ob3cgKHdpdGhvdXRTdWZmaXgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudG8obG9jYWxfX2NyZWF0ZUxvY2FsKCksIHdpdGhvdXRTdWZmaXgpO1xuICAgIH1cblxuICAgIC8vIElmIHBhc3NlZCBhIGxvY2FsZSBrZXksIGl0IHdpbGwgc2V0IHRoZSBsb2NhbGUgZm9yIHRoaXNcbiAgICAvLyBpbnN0YW5jZS4gIE90aGVyd2lzZSwgaXQgd2lsbCByZXR1cm4gdGhlIGxvY2FsZSBjb25maWd1cmF0aW9uXG4gICAgLy8gdmFyaWFibGVzIGZvciB0aGlzIGluc3RhbmNlLlxuICAgIGZ1bmN0aW9uIGxvY2FsZSAoa2V5KSB7XG4gICAgICAgIHZhciBuZXdMb2NhbGVEYXRhO1xuXG4gICAgICAgIGlmIChrZXkgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2xvY2FsZS5fYWJicjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG5ld0xvY2FsZURhdGEgPSBsb2NhbGVfbG9jYWxlc19fZ2V0TG9jYWxlKGtleSk7XG4gICAgICAgICAgICBpZiAobmV3TG9jYWxlRGF0YSAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fbG9jYWxlID0gbmV3TG9jYWxlRGF0YTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgdmFyIGxhbmcgPSBkZXByZWNhdGUoXG4gICAgICAgICdtb21lbnQoKS5sYW5nKCkgaXMgZGVwcmVjYXRlZC4gSW5zdGVhZCwgdXNlIG1vbWVudCgpLmxvY2FsZURhdGEoKSB0byBnZXQgdGhlIGxhbmd1YWdlIGNvbmZpZ3VyYXRpb24uIFVzZSBtb21lbnQoKS5sb2NhbGUoKSB0byBjaGFuZ2UgbGFuZ3VhZ2VzLicsXG4gICAgICAgIGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgICAgIGlmIChrZXkgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmxvY2FsZURhdGEoKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMubG9jYWxlKGtleSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICApO1xuXG4gICAgZnVuY3Rpb24gbG9jYWxlRGF0YSAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9sb2NhbGU7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc3RhcnRPZiAodW5pdHMpIHtcbiAgICAgICAgdW5pdHMgPSBub3JtYWxpemVVbml0cyh1bml0cyk7XG4gICAgICAgIC8vIHRoZSBmb2xsb3dpbmcgc3dpdGNoIGludGVudGlvbmFsbHkgb21pdHMgYnJlYWsga2V5d29yZHNcbiAgICAgICAgLy8gdG8gdXRpbGl6ZSBmYWxsaW5nIHRocm91Z2ggdGhlIGNhc2VzLlxuICAgICAgICBzd2l0Y2ggKHVuaXRzKSB7XG4gICAgICAgICAgICBjYXNlICd5ZWFyJzpcbiAgICAgICAgICAgICAgICB0aGlzLm1vbnRoKDApO1xuICAgICAgICAgICAgICAgIC8qIGZhbGxzIHRocm91Z2ggKi9cbiAgICAgICAgICAgIGNhc2UgJ3F1YXJ0ZXInOlxuICAgICAgICAgICAgY2FzZSAnbW9udGgnOlxuICAgICAgICAgICAgICAgIHRoaXMuZGF0ZSgxKTtcbiAgICAgICAgICAgICAgICAvKiBmYWxscyB0aHJvdWdoICovXG4gICAgICAgICAgICBjYXNlICd3ZWVrJzpcbiAgICAgICAgICAgIGNhc2UgJ2lzb1dlZWsnOlxuICAgICAgICAgICAgY2FzZSAnZGF5JzpcbiAgICAgICAgICAgIGNhc2UgJ2RhdGUnOlxuICAgICAgICAgICAgICAgIHRoaXMuaG91cnMoMCk7XG4gICAgICAgICAgICAgICAgLyogZmFsbHMgdGhyb3VnaCAqL1xuICAgICAgICAgICAgY2FzZSAnaG91cic6XG4gICAgICAgICAgICAgICAgdGhpcy5taW51dGVzKDApO1xuICAgICAgICAgICAgICAgIC8qIGZhbGxzIHRocm91Z2ggKi9cbiAgICAgICAgICAgIGNhc2UgJ21pbnV0ZSc6XG4gICAgICAgICAgICAgICAgdGhpcy5zZWNvbmRzKDApO1xuICAgICAgICAgICAgICAgIC8qIGZhbGxzIHRocm91Z2ggKi9cbiAgICAgICAgICAgIGNhc2UgJ3NlY29uZCc6XG4gICAgICAgICAgICAgICAgdGhpcy5taWxsaXNlY29uZHMoMCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyB3ZWVrcyBhcmUgYSBzcGVjaWFsIGNhc2VcbiAgICAgICAgaWYgKHVuaXRzID09PSAnd2VlaycpIHtcbiAgICAgICAgICAgIHRoaXMud2Vla2RheSgwKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodW5pdHMgPT09ICdpc29XZWVrJykge1xuICAgICAgICAgICAgdGhpcy5pc29XZWVrZGF5KDEpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gcXVhcnRlcnMgYXJlIGFsc28gc3BlY2lhbFxuICAgICAgICBpZiAodW5pdHMgPT09ICdxdWFydGVyJykge1xuICAgICAgICAgICAgdGhpcy5tb250aChNYXRoLmZsb29yKHRoaXMubW9udGgoKSAvIDMpICogMyk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBlbmRPZiAodW5pdHMpIHtcbiAgICAgICAgdW5pdHMgPSBub3JtYWxpemVVbml0cyh1bml0cyk7XG4gICAgICAgIGlmICh1bml0cyA9PT0gdW5kZWZpbmVkIHx8IHVuaXRzID09PSAnbWlsbGlzZWNvbmQnKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuXG4gICAgICAgIC8vICdkYXRlJyBpcyBhbiBhbGlhcyBmb3IgJ2RheScsIHNvIGl0IHNob3VsZCBiZSBjb25zaWRlcmVkIGFzIHN1Y2guXG4gICAgICAgIGlmICh1bml0cyA9PT0gJ2RhdGUnKSB7XG4gICAgICAgICAgICB1bml0cyA9ICdkYXknO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuc3RhcnRPZih1bml0cykuYWRkKDEsICh1bml0cyA9PT0gJ2lzb1dlZWsnID8gJ3dlZWsnIDogdW5pdHMpKS5zdWJ0cmFjdCgxLCAnbXMnKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiB0b190eXBlX192YWx1ZU9mICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2QudmFsdWVPZigpIC0gKCh0aGlzLl9vZmZzZXQgfHwgMCkgKiA2MDAwMCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gdW5peCAoKSB7XG4gICAgICAgIHJldHVybiBNYXRoLmZsb29yKHRoaXMudmFsdWVPZigpIC8gMTAwMCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gdG9EYXRlICgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBEYXRlKHRoaXMudmFsdWVPZigpKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiB0b0FycmF5ICgpIHtcbiAgICAgICAgdmFyIG0gPSB0aGlzO1xuICAgICAgICByZXR1cm4gW20ueWVhcigpLCBtLm1vbnRoKCksIG0uZGF0ZSgpLCBtLmhvdXIoKSwgbS5taW51dGUoKSwgbS5zZWNvbmQoKSwgbS5taWxsaXNlY29uZCgpXTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiB0b09iamVjdCAoKSB7XG4gICAgICAgIHZhciBtID0gdGhpcztcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHllYXJzOiBtLnllYXIoKSxcbiAgICAgICAgICAgIG1vbnRoczogbS5tb250aCgpLFxuICAgICAgICAgICAgZGF0ZTogbS5kYXRlKCksXG4gICAgICAgICAgICBob3VyczogbS5ob3VycygpLFxuICAgICAgICAgICAgbWludXRlczogbS5taW51dGVzKCksXG4gICAgICAgICAgICBzZWNvbmRzOiBtLnNlY29uZHMoKSxcbiAgICAgICAgICAgIG1pbGxpc2Vjb25kczogbS5taWxsaXNlY29uZHMoKVxuICAgICAgICB9O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHRvSlNPTiAoKSB7XG4gICAgICAgIC8vIG5ldyBEYXRlKE5hTikudG9KU09OKCkgPT09IG51bGxcbiAgICAgICAgcmV0dXJuIHRoaXMuaXNWYWxpZCgpID8gdGhpcy50b0lTT1N0cmluZygpIDogbnVsbDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBtb21lbnRfdmFsaWRfX2lzVmFsaWQgKCkge1xuICAgICAgICByZXR1cm4gdmFsaWRfX2lzVmFsaWQodGhpcyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcGFyc2luZ0ZsYWdzICgpIHtcbiAgICAgICAgcmV0dXJuIGV4dGVuZCh7fSwgZ2V0UGFyc2luZ0ZsYWdzKHRoaXMpKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBpbnZhbGlkQXQgKCkge1xuICAgICAgICByZXR1cm4gZ2V0UGFyc2luZ0ZsYWdzKHRoaXMpLm92ZXJmbG93O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGNyZWF0aW9uRGF0YSgpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGlucHV0OiB0aGlzLl9pLFxuICAgICAgICAgICAgZm9ybWF0OiB0aGlzLl9mLFxuICAgICAgICAgICAgbG9jYWxlOiB0aGlzLl9sb2NhbGUsXG4gICAgICAgICAgICBpc1VUQzogdGhpcy5faXNVVEMsXG4gICAgICAgICAgICBzdHJpY3Q6IHRoaXMuX3N0cmljdFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIC8vIEZPUk1BVFRJTkdcblxuICAgIGFkZEZvcm1hdFRva2VuKDAsIFsnZ2cnLCAyXSwgMCwgZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy53ZWVrWWVhcigpICUgMTAwO1xuICAgIH0pO1xuXG4gICAgYWRkRm9ybWF0VG9rZW4oMCwgWydHRycsIDJdLCAwLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmlzb1dlZWtZZWFyKCkgJSAxMDA7XG4gICAgfSk7XG5cbiAgICBmdW5jdGlvbiBhZGRXZWVrWWVhckZvcm1hdFRva2VuICh0b2tlbiwgZ2V0dGVyKSB7XG4gICAgICAgIGFkZEZvcm1hdFRva2VuKDAsIFt0b2tlbiwgdG9rZW4ubGVuZ3RoXSwgMCwgZ2V0dGVyKTtcbiAgICB9XG5cbiAgICBhZGRXZWVrWWVhckZvcm1hdFRva2VuKCdnZ2dnJywgICAgICd3ZWVrWWVhcicpO1xuICAgIGFkZFdlZWtZZWFyRm9ybWF0VG9rZW4oJ2dnZ2dnJywgICAgJ3dlZWtZZWFyJyk7XG4gICAgYWRkV2Vla1llYXJGb3JtYXRUb2tlbignR0dHRycsICAnaXNvV2Vla1llYXInKTtcbiAgICBhZGRXZWVrWWVhckZvcm1hdFRva2VuKCdHR0dHRycsICdpc29XZWVrWWVhcicpO1xuXG4gICAgLy8gQUxJQVNFU1xuXG4gICAgYWRkVW5pdEFsaWFzKCd3ZWVrWWVhcicsICdnZycpO1xuICAgIGFkZFVuaXRBbGlhcygnaXNvV2Vla1llYXInLCAnR0cnKTtcblxuICAgIC8vIFBSSU9SSVRZXG5cbiAgICBhZGRVbml0UHJpb3JpdHkoJ3dlZWtZZWFyJywgMSk7XG4gICAgYWRkVW5pdFByaW9yaXR5KCdpc29XZWVrWWVhcicsIDEpO1xuXG5cbiAgICAvLyBQQVJTSU5HXG5cbiAgICBhZGRSZWdleFRva2VuKCdHJywgICAgICBtYXRjaFNpZ25lZCk7XG4gICAgYWRkUmVnZXhUb2tlbignZycsICAgICAgbWF0Y2hTaWduZWQpO1xuICAgIGFkZFJlZ2V4VG9rZW4oJ0dHJywgICAgIG1hdGNoMXRvMiwgbWF0Y2gyKTtcbiAgICBhZGRSZWdleFRva2VuKCdnZycsICAgICBtYXRjaDF0bzIsIG1hdGNoMik7XG4gICAgYWRkUmVnZXhUb2tlbignR0dHRycsICAgbWF0Y2gxdG80LCBtYXRjaDQpO1xuICAgIGFkZFJlZ2V4VG9rZW4oJ2dnZ2cnLCAgIG1hdGNoMXRvNCwgbWF0Y2g0KTtcbiAgICBhZGRSZWdleFRva2VuKCdHR0dHRycsICBtYXRjaDF0bzYsIG1hdGNoNik7XG4gICAgYWRkUmVnZXhUb2tlbignZ2dnZ2cnLCAgbWF0Y2gxdG82LCBtYXRjaDYpO1xuXG4gICAgYWRkV2Vla1BhcnNlVG9rZW4oWydnZ2dnJywgJ2dnZ2dnJywgJ0dHR0cnLCAnR0dHR0cnXSwgZnVuY3Rpb24gKGlucHV0LCB3ZWVrLCBjb25maWcsIHRva2VuKSB7XG4gICAgICAgIHdlZWtbdG9rZW4uc3Vic3RyKDAsIDIpXSA9IHRvSW50KGlucHV0KTtcbiAgICB9KTtcblxuICAgIGFkZFdlZWtQYXJzZVRva2VuKFsnZ2cnLCAnR0cnXSwgZnVuY3Rpb24gKGlucHV0LCB3ZWVrLCBjb25maWcsIHRva2VuKSB7XG4gICAgICAgIHdlZWtbdG9rZW5dID0gdXRpbHNfaG9va3NfX2hvb2tzLnBhcnNlVHdvRGlnaXRZZWFyKGlucHV0KTtcbiAgICB9KTtcblxuICAgIC8vIE1PTUVOVFNcblxuICAgIGZ1bmN0aW9uIGdldFNldFdlZWtZZWFyIChpbnB1dCkge1xuICAgICAgICByZXR1cm4gZ2V0U2V0V2Vla1llYXJIZWxwZXIuY2FsbCh0aGlzLFxuICAgICAgICAgICAgICAgIGlucHV0LFxuICAgICAgICAgICAgICAgIHRoaXMud2VlaygpLFxuICAgICAgICAgICAgICAgIHRoaXMud2Vla2RheSgpLFxuICAgICAgICAgICAgICAgIHRoaXMubG9jYWxlRGF0YSgpLl93ZWVrLmRvdyxcbiAgICAgICAgICAgICAgICB0aGlzLmxvY2FsZURhdGEoKS5fd2Vlay5kb3kpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldFNldElTT1dlZWtZZWFyIChpbnB1dCkge1xuICAgICAgICByZXR1cm4gZ2V0U2V0V2Vla1llYXJIZWxwZXIuY2FsbCh0aGlzLFxuICAgICAgICAgICAgICAgIGlucHV0LCB0aGlzLmlzb1dlZWsoKSwgdGhpcy5pc29XZWVrZGF5KCksIDEsIDQpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldElTT1dlZWtzSW5ZZWFyICgpIHtcbiAgICAgICAgcmV0dXJuIHdlZWtzSW5ZZWFyKHRoaXMueWVhcigpLCAxLCA0KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZXRXZWVrc0luWWVhciAoKSB7XG4gICAgICAgIHZhciB3ZWVrSW5mbyA9IHRoaXMubG9jYWxlRGF0YSgpLl93ZWVrO1xuICAgICAgICByZXR1cm4gd2Vla3NJblllYXIodGhpcy55ZWFyKCksIHdlZWtJbmZvLmRvdywgd2Vla0luZm8uZG95KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZXRTZXRXZWVrWWVhckhlbHBlcihpbnB1dCwgd2Vlaywgd2Vla2RheSwgZG93LCBkb3kpIHtcbiAgICAgICAgdmFyIHdlZWtzVGFyZ2V0O1xuICAgICAgICBpZiAoaW5wdXQgPT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIHdlZWtPZlllYXIodGhpcywgZG93LCBkb3kpLnllYXI7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB3ZWVrc1RhcmdldCA9IHdlZWtzSW5ZZWFyKGlucHV0LCBkb3csIGRveSk7XG4gICAgICAgICAgICBpZiAod2VlayA+IHdlZWtzVGFyZ2V0KSB7XG4gICAgICAgICAgICAgICAgd2VlayA9IHdlZWtzVGFyZ2V0O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHNldFdlZWtBbGwuY2FsbCh0aGlzLCBpbnB1dCwgd2Vlaywgd2Vla2RheSwgZG93LCBkb3kpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2V0V2Vla0FsbCh3ZWVrWWVhciwgd2Vlaywgd2Vla2RheSwgZG93LCBkb3kpIHtcbiAgICAgICAgdmFyIGRheU9mWWVhckRhdGEgPSBkYXlPZlllYXJGcm9tV2Vla3Mod2Vla1llYXIsIHdlZWssIHdlZWtkYXksIGRvdywgZG95KSxcbiAgICAgICAgICAgIGRhdGUgPSBjcmVhdGVVVENEYXRlKGRheU9mWWVhckRhdGEueWVhciwgMCwgZGF5T2ZZZWFyRGF0YS5kYXlPZlllYXIpO1xuXG4gICAgICAgIHRoaXMueWVhcihkYXRlLmdldFVUQ0Z1bGxZZWFyKCkpO1xuICAgICAgICB0aGlzLm1vbnRoKGRhdGUuZ2V0VVRDTW9udGgoKSk7XG4gICAgICAgIHRoaXMuZGF0ZShkYXRlLmdldFVUQ0RhdGUoKSk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIC8vIEZPUk1BVFRJTkdcblxuICAgIGFkZEZvcm1hdFRva2VuKCdRJywgMCwgJ1FvJywgJ3F1YXJ0ZXInKTtcblxuICAgIC8vIEFMSUFTRVNcblxuICAgIGFkZFVuaXRBbGlhcygncXVhcnRlcicsICdRJyk7XG5cbiAgICAvLyBQUklPUklUWVxuXG4gICAgYWRkVW5pdFByaW9yaXR5KCdxdWFydGVyJywgNyk7XG5cbiAgICAvLyBQQVJTSU5HXG5cbiAgICBhZGRSZWdleFRva2VuKCdRJywgbWF0Y2gxKTtcbiAgICBhZGRQYXJzZVRva2VuKCdRJywgZnVuY3Rpb24gKGlucHV0LCBhcnJheSkge1xuICAgICAgICBhcnJheVtNT05USF0gPSAodG9JbnQoaW5wdXQpIC0gMSkgKiAzO1xuICAgIH0pO1xuXG4gICAgLy8gTU9NRU5UU1xuXG4gICAgZnVuY3Rpb24gZ2V0U2V0UXVhcnRlciAoaW5wdXQpIHtcbiAgICAgICAgcmV0dXJuIGlucHV0ID09IG51bGwgPyBNYXRoLmNlaWwoKHRoaXMubW9udGgoKSArIDEpIC8gMykgOiB0aGlzLm1vbnRoKChpbnB1dCAtIDEpICogMyArIHRoaXMubW9udGgoKSAlIDMpO1xuICAgIH1cblxuICAgIC8vIEZPUk1BVFRJTkdcblxuICAgIGFkZEZvcm1hdFRva2VuKCdEJywgWydERCcsIDJdLCAnRG8nLCAnZGF0ZScpO1xuXG4gICAgLy8gQUxJQVNFU1xuXG4gICAgYWRkVW5pdEFsaWFzKCdkYXRlJywgJ0QnKTtcblxuICAgIC8vIFBSSU9ST0lUWVxuICAgIGFkZFVuaXRQcmlvcml0eSgnZGF0ZScsIDkpO1xuXG4gICAgLy8gUEFSU0lOR1xuXG4gICAgYWRkUmVnZXhUb2tlbignRCcsICBtYXRjaDF0bzIpO1xuICAgIGFkZFJlZ2V4VG9rZW4oJ0REJywgbWF0Y2gxdG8yLCBtYXRjaDIpO1xuICAgIGFkZFJlZ2V4VG9rZW4oJ0RvJywgZnVuY3Rpb24gKGlzU3RyaWN0LCBsb2NhbGUpIHtcbiAgICAgICAgcmV0dXJuIGlzU3RyaWN0ID8gbG9jYWxlLl9vcmRpbmFsUGFyc2UgOiBsb2NhbGUuX29yZGluYWxQYXJzZUxlbmllbnQ7XG4gICAgfSk7XG5cbiAgICBhZGRQYXJzZVRva2VuKFsnRCcsICdERCddLCBEQVRFKTtcbiAgICBhZGRQYXJzZVRva2VuKCdEbycsIGZ1bmN0aW9uIChpbnB1dCwgYXJyYXkpIHtcbiAgICAgICAgYXJyYXlbREFURV0gPSB0b0ludChpbnB1dC5tYXRjaChtYXRjaDF0bzIpWzBdLCAxMCk7XG4gICAgfSk7XG5cbiAgICAvLyBNT01FTlRTXG5cbiAgICB2YXIgZ2V0U2V0RGF5T2ZNb250aCA9IG1ha2VHZXRTZXQoJ0RhdGUnLCB0cnVlKTtcblxuICAgIC8vIEZPUk1BVFRJTkdcblxuICAgIGFkZEZvcm1hdFRva2VuKCdEREQnLCBbJ0REREQnLCAzXSwgJ0RERG8nLCAnZGF5T2ZZZWFyJyk7XG5cbiAgICAvLyBBTElBU0VTXG5cbiAgICBhZGRVbml0QWxpYXMoJ2RheU9mWWVhcicsICdEREQnKTtcblxuICAgIC8vIFBSSU9SSVRZXG4gICAgYWRkVW5pdFByaW9yaXR5KCdkYXlPZlllYXInLCA0KTtcblxuICAgIC8vIFBBUlNJTkdcblxuICAgIGFkZFJlZ2V4VG9rZW4oJ0RERCcsICBtYXRjaDF0bzMpO1xuICAgIGFkZFJlZ2V4VG9rZW4oJ0REREQnLCBtYXRjaDMpO1xuICAgIGFkZFBhcnNlVG9rZW4oWydEREQnLCAnRERERCddLCBmdW5jdGlvbiAoaW5wdXQsIGFycmF5LCBjb25maWcpIHtcbiAgICAgICAgY29uZmlnLl9kYXlPZlllYXIgPSB0b0ludChpbnB1dCk7XG4gICAgfSk7XG5cbiAgICAvLyBIRUxQRVJTXG5cbiAgICAvLyBNT01FTlRTXG5cbiAgICBmdW5jdGlvbiBnZXRTZXREYXlPZlllYXIgKGlucHV0KSB7XG4gICAgICAgIHZhciBkYXlPZlllYXIgPSBNYXRoLnJvdW5kKCh0aGlzLmNsb25lKCkuc3RhcnRPZignZGF5JykgLSB0aGlzLmNsb25lKCkuc3RhcnRPZigneWVhcicpKSAvIDg2NGU1KSArIDE7XG4gICAgICAgIHJldHVybiBpbnB1dCA9PSBudWxsID8gZGF5T2ZZZWFyIDogdGhpcy5hZGQoKGlucHV0IC0gZGF5T2ZZZWFyKSwgJ2QnKTtcbiAgICB9XG5cbiAgICAvLyBGT1JNQVRUSU5HXG5cbiAgICBhZGRGb3JtYXRUb2tlbignbScsIFsnbW0nLCAyXSwgMCwgJ21pbnV0ZScpO1xuXG4gICAgLy8gQUxJQVNFU1xuXG4gICAgYWRkVW5pdEFsaWFzKCdtaW51dGUnLCAnbScpO1xuXG4gICAgLy8gUFJJT1JJVFlcblxuICAgIGFkZFVuaXRQcmlvcml0eSgnbWludXRlJywgMTQpO1xuXG4gICAgLy8gUEFSU0lOR1xuXG4gICAgYWRkUmVnZXhUb2tlbignbScsICBtYXRjaDF0bzIpO1xuICAgIGFkZFJlZ2V4VG9rZW4oJ21tJywgbWF0Y2gxdG8yLCBtYXRjaDIpO1xuICAgIGFkZFBhcnNlVG9rZW4oWydtJywgJ21tJ10sIE1JTlVURSk7XG5cbiAgICAvLyBNT01FTlRTXG5cbiAgICB2YXIgZ2V0U2V0TWludXRlID0gbWFrZUdldFNldCgnTWludXRlcycsIGZhbHNlKTtcblxuICAgIC8vIEZPUk1BVFRJTkdcblxuICAgIGFkZEZvcm1hdFRva2VuKCdzJywgWydzcycsIDJdLCAwLCAnc2Vjb25kJyk7XG5cbiAgICAvLyBBTElBU0VTXG5cbiAgICBhZGRVbml0QWxpYXMoJ3NlY29uZCcsICdzJyk7XG5cbiAgICAvLyBQUklPUklUWVxuXG4gICAgYWRkVW5pdFByaW9yaXR5KCdzZWNvbmQnLCAxNSk7XG5cbiAgICAvLyBQQVJTSU5HXG5cbiAgICBhZGRSZWdleFRva2VuKCdzJywgIG1hdGNoMXRvMik7XG4gICAgYWRkUmVnZXhUb2tlbignc3MnLCBtYXRjaDF0bzIsIG1hdGNoMik7XG4gICAgYWRkUGFyc2VUb2tlbihbJ3MnLCAnc3MnXSwgU0VDT05EKTtcblxuICAgIC8vIE1PTUVOVFNcblxuICAgIHZhciBnZXRTZXRTZWNvbmQgPSBtYWtlR2V0U2V0KCdTZWNvbmRzJywgZmFsc2UpO1xuXG4gICAgLy8gRk9STUFUVElOR1xuXG4gICAgYWRkRm9ybWF0VG9rZW4oJ1MnLCAwLCAwLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB+fih0aGlzLm1pbGxpc2Vjb25kKCkgLyAxMDApO1xuICAgIH0pO1xuXG4gICAgYWRkRm9ybWF0VG9rZW4oMCwgWydTUycsIDJdLCAwLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB+fih0aGlzLm1pbGxpc2Vjb25kKCkgLyAxMCk7XG4gICAgfSk7XG5cbiAgICBhZGRGb3JtYXRUb2tlbigwLCBbJ1NTUycsIDNdLCAwLCAnbWlsbGlzZWNvbmQnKTtcbiAgICBhZGRGb3JtYXRUb2tlbigwLCBbJ1NTU1MnLCA0XSwgMCwgZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5taWxsaXNlY29uZCgpICogMTA7XG4gICAgfSk7XG4gICAgYWRkRm9ybWF0VG9rZW4oMCwgWydTU1NTUycsIDVdLCAwLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm1pbGxpc2Vjb25kKCkgKiAxMDA7XG4gICAgfSk7XG4gICAgYWRkRm9ybWF0VG9rZW4oMCwgWydTU1NTU1MnLCA2XSwgMCwgZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5taWxsaXNlY29uZCgpICogMTAwMDtcbiAgICB9KTtcbiAgICBhZGRGb3JtYXRUb2tlbigwLCBbJ1NTU1NTU1MnLCA3XSwgMCwgZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5taWxsaXNlY29uZCgpICogMTAwMDA7XG4gICAgfSk7XG4gICAgYWRkRm9ybWF0VG9rZW4oMCwgWydTU1NTU1NTUycsIDhdLCAwLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm1pbGxpc2Vjb25kKCkgKiAxMDAwMDA7XG4gICAgfSk7XG4gICAgYWRkRm9ybWF0VG9rZW4oMCwgWydTU1NTU1NTU1MnLCA5XSwgMCwgZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5taWxsaXNlY29uZCgpICogMTAwMDAwMDtcbiAgICB9KTtcblxuXG4gICAgLy8gQUxJQVNFU1xuXG4gICAgYWRkVW5pdEFsaWFzKCdtaWxsaXNlY29uZCcsICdtcycpO1xuXG4gICAgLy8gUFJJT1JJVFlcblxuICAgIGFkZFVuaXRQcmlvcml0eSgnbWlsbGlzZWNvbmQnLCAxNik7XG5cbiAgICAvLyBQQVJTSU5HXG5cbiAgICBhZGRSZWdleFRva2VuKCdTJywgICAgbWF0Y2gxdG8zLCBtYXRjaDEpO1xuICAgIGFkZFJlZ2V4VG9rZW4oJ1NTJywgICBtYXRjaDF0bzMsIG1hdGNoMik7XG4gICAgYWRkUmVnZXhUb2tlbignU1NTJywgIG1hdGNoMXRvMywgbWF0Y2gzKTtcblxuICAgIHZhciB0b2tlbjtcbiAgICBmb3IgKHRva2VuID0gJ1NTU1MnOyB0b2tlbi5sZW5ndGggPD0gOTsgdG9rZW4gKz0gJ1MnKSB7XG4gICAgICAgIGFkZFJlZ2V4VG9rZW4odG9rZW4sIG1hdGNoVW5zaWduZWQpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBhcnNlTXMoaW5wdXQsIGFycmF5KSB7XG4gICAgICAgIGFycmF5W01JTExJU0VDT05EXSA9IHRvSW50KCgnMC4nICsgaW5wdXQpICogMTAwMCk7XG4gICAgfVxuXG4gICAgZm9yICh0b2tlbiA9ICdTJzsgdG9rZW4ubGVuZ3RoIDw9IDk7IHRva2VuICs9ICdTJykge1xuICAgICAgICBhZGRQYXJzZVRva2VuKHRva2VuLCBwYXJzZU1zKTtcbiAgICB9XG4gICAgLy8gTU9NRU5UU1xuXG4gICAgdmFyIGdldFNldE1pbGxpc2Vjb25kID0gbWFrZUdldFNldCgnTWlsbGlzZWNvbmRzJywgZmFsc2UpO1xuXG4gICAgLy8gRk9STUFUVElOR1xuXG4gICAgYWRkRm9ybWF0VG9rZW4oJ3onLCAgMCwgMCwgJ3pvbmVBYmJyJyk7XG4gICAgYWRkRm9ybWF0VG9rZW4oJ3p6JywgMCwgMCwgJ3pvbmVOYW1lJyk7XG5cbiAgICAvLyBNT01FTlRTXG5cbiAgICBmdW5jdGlvbiBnZXRab25lQWJiciAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9pc1VUQyA/ICdVVEMnIDogJyc7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2V0Wm9uZU5hbWUgKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5faXNVVEMgPyAnQ29vcmRpbmF0ZWQgVW5pdmVyc2FsIFRpbWUnIDogJyc7XG4gICAgfVxuXG4gICAgdmFyIG1vbWVudFByb3RvdHlwZV9fcHJvdG8gPSBNb21lbnQucHJvdG90eXBlO1xuXG4gICAgbW9tZW50UHJvdG90eXBlX19wcm90by5hZGQgICAgICAgICAgICAgICA9IGFkZF9zdWJ0cmFjdF9fYWRkO1xuICAgIG1vbWVudFByb3RvdHlwZV9fcHJvdG8uY2FsZW5kYXIgICAgICAgICAgPSBtb21lbnRfY2FsZW5kYXJfX2NhbGVuZGFyO1xuICAgIG1vbWVudFByb3RvdHlwZV9fcHJvdG8uY2xvbmUgICAgICAgICAgICAgPSBjbG9uZTtcbiAgICBtb21lbnRQcm90b3R5cGVfX3Byb3RvLmRpZmYgICAgICAgICAgICAgID0gZGlmZjtcbiAgICBtb21lbnRQcm90b3R5cGVfX3Byb3RvLmVuZE9mICAgICAgICAgICAgID0gZW5kT2Y7XG4gICAgbW9tZW50UHJvdG90eXBlX19wcm90by5mb3JtYXQgICAgICAgICAgICA9IGZvcm1hdDtcbiAgICBtb21lbnRQcm90b3R5cGVfX3Byb3RvLmZyb20gICAgICAgICAgICAgID0gZnJvbTtcbiAgICBtb21lbnRQcm90b3R5cGVfX3Byb3RvLmZyb21Ob3cgICAgICAgICAgID0gZnJvbU5vdztcbiAgICBtb21lbnRQcm90b3R5cGVfX3Byb3RvLnRvICAgICAgICAgICAgICAgID0gdG87XG4gICAgbW9tZW50UHJvdG90eXBlX19wcm90by50b05vdyAgICAgICAgICAgICA9IHRvTm93O1xuICAgIG1vbWVudFByb3RvdHlwZV9fcHJvdG8uZ2V0ICAgICAgICAgICAgICAgPSBzdHJpbmdHZXQ7XG4gICAgbW9tZW50UHJvdG90eXBlX19wcm90by5pbnZhbGlkQXQgICAgICAgICA9IGludmFsaWRBdDtcbiAgICBtb21lbnRQcm90b3R5cGVfX3Byb3RvLmlzQWZ0ZXIgICAgICAgICAgID0gaXNBZnRlcjtcbiAgICBtb21lbnRQcm90b3R5cGVfX3Byb3RvLmlzQmVmb3JlICAgICAgICAgID0gaXNCZWZvcmU7XG4gICAgbW9tZW50UHJvdG90eXBlX19wcm90by5pc0JldHdlZW4gICAgICAgICA9IGlzQmV0d2VlbjtcbiAgICBtb21lbnRQcm90b3R5cGVfX3Byb3RvLmlzU2FtZSAgICAgICAgICAgID0gaXNTYW1lO1xuICAgIG1vbWVudFByb3RvdHlwZV9fcHJvdG8uaXNTYW1lT3JBZnRlciAgICAgPSBpc1NhbWVPckFmdGVyO1xuICAgIG1vbWVudFByb3RvdHlwZV9fcHJvdG8uaXNTYW1lT3JCZWZvcmUgICAgPSBpc1NhbWVPckJlZm9yZTtcbiAgICBtb21lbnRQcm90b3R5cGVfX3Byb3RvLmlzVmFsaWQgICAgICAgICAgID0gbW9tZW50X3ZhbGlkX19pc1ZhbGlkO1xuICAgIG1vbWVudFByb3RvdHlwZV9fcHJvdG8ubGFuZyAgICAgICAgICAgICAgPSBsYW5nO1xuICAgIG1vbWVudFByb3RvdHlwZV9fcHJvdG8ubG9jYWxlICAgICAgICAgICAgPSBsb2NhbGU7XG4gICAgbW9tZW50UHJvdG90eXBlX19wcm90by5sb2NhbGVEYXRhICAgICAgICA9IGxvY2FsZURhdGE7XG4gICAgbW9tZW50UHJvdG90eXBlX19wcm90by5tYXggICAgICAgICAgICAgICA9IHByb3RvdHlwZU1heDtcbiAgICBtb21lbnRQcm90b3R5cGVfX3Byb3RvLm1pbiAgICAgICAgICAgICAgID0gcHJvdG90eXBlTWluO1xuICAgIG1vbWVudFByb3RvdHlwZV9fcHJvdG8ucGFyc2luZ0ZsYWdzICAgICAgPSBwYXJzaW5nRmxhZ3M7XG4gICAgbW9tZW50UHJvdG90eXBlX19wcm90by5zZXQgICAgICAgICAgICAgICA9IHN0cmluZ1NldDtcbiAgICBtb21lbnRQcm90b3R5cGVfX3Byb3RvLnN0YXJ0T2YgICAgICAgICAgID0gc3RhcnRPZjtcbiAgICBtb21lbnRQcm90b3R5cGVfX3Byb3RvLnN1YnRyYWN0ICAgICAgICAgID0gYWRkX3N1YnRyYWN0X19zdWJ0cmFjdDtcbiAgICBtb21lbnRQcm90b3R5cGVfX3Byb3RvLnRvQXJyYXkgICAgICAgICAgID0gdG9BcnJheTtcbiAgICBtb21lbnRQcm90b3R5cGVfX3Byb3RvLnRvT2JqZWN0ICAgICAgICAgID0gdG9PYmplY3Q7XG4gICAgbW9tZW50UHJvdG90eXBlX19wcm90by50b0RhdGUgICAgICAgICAgICA9IHRvRGF0ZTtcbiAgICBtb21lbnRQcm90b3R5cGVfX3Byb3RvLnRvSVNPU3RyaW5nICAgICAgID0gbW9tZW50X2Zvcm1hdF9fdG9JU09TdHJpbmc7XG4gICAgbW9tZW50UHJvdG90eXBlX19wcm90by50b0pTT04gICAgICAgICAgICA9IHRvSlNPTjtcbiAgICBtb21lbnRQcm90b3R5cGVfX3Byb3RvLnRvU3RyaW5nICAgICAgICAgID0gdG9TdHJpbmc7XG4gICAgbW9tZW50UHJvdG90eXBlX19wcm90by51bml4ICAgICAgICAgICAgICA9IHVuaXg7XG4gICAgbW9tZW50UHJvdG90eXBlX19wcm90by52YWx1ZU9mICAgICAgICAgICA9IHRvX3R5cGVfX3ZhbHVlT2Y7XG4gICAgbW9tZW50UHJvdG90eXBlX19wcm90by5jcmVhdGlvbkRhdGEgICAgICA9IGNyZWF0aW9uRGF0YTtcblxuICAgIC8vIFllYXJcbiAgICBtb21lbnRQcm90b3R5cGVfX3Byb3RvLnllYXIgICAgICAgPSBnZXRTZXRZZWFyO1xuICAgIG1vbWVudFByb3RvdHlwZV9fcHJvdG8uaXNMZWFwWWVhciA9IGdldElzTGVhcFllYXI7XG5cbiAgICAvLyBXZWVrIFllYXJcbiAgICBtb21lbnRQcm90b3R5cGVfX3Byb3RvLndlZWtZZWFyICAgID0gZ2V0U2V0V2Vla1llYXI7XG4gICAgbW9tZW50UHJvdG90eXBlX19wcm90by5pc29XZWVrWWVhciA9IGdldFNldElTT1dlZWtZZWFyO1xuXG4gICAgLy8gUXVhcnRlclxuICAgIG1vbWVudFByb3RvdHlwZV9fcHJvdG8ucXVhcnRlciA9IG1vbWVudFByb3RvdHlwZV9fcHJvdG8ucXVhcnRlcnMgPSBnZXRTZXRRdWFydGVyO1xuXG4gICAgLy8gTW9udGhcbiAgICBtb21lbnRQcm90b3R5cGVfX3Byb3RvLm1vbnRoICAgICAgID0gZ2V0U2V0TW9udGg7XG4gICAgbW9tZW50UHJvdG90eXBlX19wcm90by5kYXlzSW5Nb250aCA9IGdldERheXNJbk1vbnRoO1xuXG4gICAgLy8gV2Vla1xuICAgIG1vbWVudFByb3RvdHlwZV9fcHJvdG8ud2VlayAgICAgICAgICAgPSBtb21lbnRQcm90b3R5cGVfX3Byb3RvLndlZWtzICAgICAgICA9IGdldFNldFdlZWs7XG4gICAgbW9tZW50UHJvdG90eXBlX19wcm90by5pc29XZWVrICAgICAgICA9IG1vbWVudFByb3RvdHlwZV9fcHJvdG8uaXNvV2Vla3MgICAgID0gZ2V0U2V0SVNPV2VlaztcbiAgICBtb21lbnRQcm90b3R5cGVfX3Byb3RvLndlZWtzSW5ZZWFyICAgID0gZ2V0V2Vla3NJblllYXI7XG4gICAgbW9tZW50UHJvdG90eXBlX19wcm90by5pc29XZWVrc0luWWVhciA9IGdldElTT1dlZWtzSW5ZZWFyO1xuXG4gICAgLy8gRGF5XG4gICAgbW9tZW50UHJvdG90eXBlX19wcm90by5kYXRlICAgICAgID0gZ2V0U2V0RGF5T2ZNb250aDtcbiAgICBtb21lbnRQcm90b3R5cGVfX3Byb3RvLmRheSAgICAgICAgPSBtb21lbnRQcm90b3R5cGVfX3Byb3RvLmRheXMgICAgICAgICAgICAgPSBnZXRTZXREYXlPZldlZWs7XG4gICAgbW9tZW50UHJvdG90eXBlX19wcm90by53ZWVrZGF5ICAgID0gZ2V0U2V0TG9jYWxlRGF5T2ZXZWVrO1xuICAgIG1vbWVudFByb3RvdHlwZV9fcHJvdG8uaXNvV2Vla2RheSA9IGdldFNldElTT0RheU9mV2VlaztcbiAgICBtb21lbnRQcm90b3R5cGVfX3Byb3RvLmRheU9mWWVhciAgPSBnZXRTZXREYXlPZlllYXI7XG5cbiAgICAvLyBIb3VyXG4gICAgbW9tZW50UHJvdG90eXBlX19wcm90by5ob3VyID0gbW9tZW50UHJvdG90eXBlX19wcm90by5ob3VycyA9IGdldFNldEhvdXI7XG5cbiAgICAvLyBNaW51dGVcbiAgICBtb21lbnRQcm90b3R5cGVfX3Byb3RvLm1pbnV0ZSA9IG1vbWVudFByb3RvdHlwZV9fcHJvdG8ubWludXRlcyA9IGdldFNldE1pbnV0ZTtcblxuICAgIC8vIFNlY29uZFxuICAgIG1vbWVudFByb3RvdHlwZV9fcHJvdG8uc2Vjb25kID0gbW9tZW50UHJvdG90eXBlX19wcm90by5zZWNvbmRzID0gZ2V0U2V0U2Vjb25kO1xuXG4gICAgLy8gTWlsbGlzZWNvbmRcbiAgICBtb21lbnRQcm90b3R5cGVfX3Byb3RvLm1pbGxpc2Vjb25kID0gbW9tZW50UHJvdG90eXBlX19wcm90by5taWxsaXNlY29uZHMgPSBnZXRTZXRNaWxsaXNlY29uZDtcblxuICAgIC8vIE9mZnNldFxuICAgIG1vbWVudFByb3RvdHlwZV9fcHJvdG8udXRjT2Zmc2V0ICAgICAgICAgICAgPSBnZXRTZXRPZmZzZXQ7XG4gICAgbW9tZW50UHJvdG90eXBlX19wcm90by51dGMgICAgICAgICAgICAgICAgICA9IHNldE9mZnNldFRvVVRDO1xuICAgIG1vbWVudFByb3RvdHlwZV9fcHJvdG8ubG9jYWwgICAgICAgICAgICAgICAgPSBzZXRPZmZzZXRUb0xvY2FsO1xuICAgIG1vbWVudFByb3RvdHlwZV9fcHJvdG8ucGFyc2Vab25lICAgICAgICAgICAgPSBzZXRPZmZzZXRUb1BhcnNlZE9mZnNldDtcbiAgICBtb21lbnRQcm90b3R5cGVfX3Byb3RvLmhhc0FsaWduZWRIb3VyT2Zmc2V0ID0gaGFzQWxpZ25lZEhvdXJPZmZzZXQ7XG4gICAgbW9tZW50UHJvdG90eXBlX19wcm90by5pc0RTVCAgICAgICAgICAgICAgICA9IGlzRGF5bGlnaHRTYXZpbmdUaW1lO1xuICAgIG1vbWVudFByb3RvdHlwZV9fcHJvdG8uaXNMb2NhbCAgICAgICAgICAgICAgPSBpc0xvY2FsO1xuICAgIG1vbWVudFByb3RvdHlwZV9fcHJvdG8uaXNVdGNPZmZzZXQgICAgICAgICAgPSBpc1V0Y09mZnNldDtcbiAgICBtb21lbnRQcm90b3R5cGVfX3Byb3RvLmlzVXRjICAgICAgICAgICAgICAgID0gaXNVdGM7XG4gICAgbW9tZW50UHJvdG90eXBlX19wcm90by5pc1VUQyAgICAgICAgICAgICAgICA9IGlzVXRjO1xuXG4gICAgLy8gVGltZXpvbmVcbiAgICBtb21lbnRQcm90b3R5cGVfX3Byb3RvLnpvbmVBYmJyID0gZ2V0Wm9uZUFiYnI7XG4gICAgbW9tZW50UHJvdG90eXBlX19wcm90by56b25lTmFtZSA9IGdldFpvbmVOYW1lO1xuXG4gICAgLy8gRGVwcmVjYXRpb25zXG4gICAgbW9tZW50UHJvdG90eXBlX19wcm90by5kYXRlcyAgPSBkZXByZWNhdGUoJ2RhdGVzIGFjY2Vzc29yIGlzIGRlcHJlY2F0ZWQuIFVzZSBkYXRlIGluc3RlYWQuJywgZ2V0U2V0RGF5T2ZNb250aCk7XG4gICAgbW9tZW50UHJvdG90eXBlX19wcm90by5tb250aHMgPSBkZXByZWNhdGUoJ21vbnRocyBhY2Nlc3NvciBpcyBkZXByZWNhdGVkLiBVc2UgbW9udGggaW5zdGVhZCcsIGdldFNldE1vbnRoKTtcbiAgICBtb21lbnRQcm90b3R5cGVfX3Byb3RvLnllYXJzICA9IGRlcHJlY2F0ZSgneWVhcnMgYWNjZXNzb3IgaXMgZGVwcmVjYXRlZC4gVXNlIHllYXIgaW5zdGVhZCcsIGdldFNldFllYXIpO1xuICAgIG1vbWVudFByb3RvdHlwZV9fcHJvdG8uem9uZSAgID0gZGVwcmVjYXRlKCdtb21lbnQoKS56b25lIGlzIGRlcHJlY2F0ZWQsIHVzZSBtb21lbnQoKS51dGNPZmZzZXQgaW5zdGVhZC4gaHR0cDovL21vbWVudGpzLmNvbS9ndWlkZXMvIy93YXJuaW5ncy96b25lLycsIGdldFNldFpvbmUpO1xuICAgIG1vbWVudFByb3RvdHlwZV9fcHJvdG8uaXNEU1RTaGlmdGVkID0gZGVwcmVjYXRlKCdpc0RTVFNoaWZ0ZWQgaXMgZGVwcmVjYXRlZC4gU2VlIGh0dHA6Ly9tb21lbnRqcy5jb20vZ3VpZGVzLyMvd2FybmluZ3MvZHN0LXNoaWZ0ZWQvIGZvciBtb3JlIGluZm9ybWF0aW9uJywgaXNEYXlsaWdodFNhdmluZ1RpbWVTaGlmdGVkKTtcblxuICAgIHZhciBtb21lbnRQcm90b3R5cGUgPSBtb21lbnRQcm90b3R5cGVfX3Byb3RvO1xuXG4gICAgZnVuY3Rpb24gbW9tZW50X19jcmVhdGVVbml4IChpbnB1dCkge1xuICAgICAgICByZXR1cm4gbG9jYWxfX2NyZWF0ZUxvY2FsKGlucHV0ICogMTAwMCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbW9tZW50X19jcmVhdGVJblpvbmUgKCkge1xuICAgICAgICByZXR1cm4gbG9jYWxfX2NyZWF0ZUxvY2FsLmFwcGx5KG51bGwsIGFyZ3VtZW50cykucGFyc2Vab25lKCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcHJlUGFyc2VQb3N0Rm9ybWF0IChzdHJpbmcpIHtcbiAgICAgICAgcmV0dXJuIHN0cmluZztcbiAgICB9XG5cbiAgICB2YXIgcHJvdG90eXBlX19wcm90byA9IExvY2FsZS5wcm90b3R5cGU7XG5cbiAgICBwcm90b3R5cGVfX3Byb3RvLmNhbGVuZGFyICAgICAgICA9IGxvY2FsZV9jYWxlbmRhcl9fY2FsZW5kYXI7XG4gICAgcHJvdG90eXBlX19wcm90by5sb25nRGF0ZUZvcm1hdCAgPSBsb25nRGF0ZUZvcm1hdDtcbiAgICBwcm90b3R5cGVfX3Byb3RvLmludmFsaWREYXRlICAgICA9IGludmFsaWREYXRlO1xuICAgIHByb3RvdHlwZV9fcHJvdG8ub3JkaW5hbCAgICAgICAgID0gb3JkaW5hbDtcbiAgICBwcm90b3R5cGVfX3Byb3RvLnByZXBhcnNlICAgICAgICA9IHByZVBhcnNlUG9zdEZvcm1hdDtcbiAgICBwcm90b3R5cGVfX3Byb3RvLnBvc3Rmb3JtYXQgICAgICA9IHByZVBhcnNlUG9zdEZvcm1hdDtcbiAgICBwcm90b3R5cGVfX3Byb3RvLnJlbGF0aXZlVGltZSAgICA9IHJlbGF0aXZlX19yZWxhdGl2ZVRpbWU7XG4gICAgcHJvdG90eXBlX19wcm90by5wYXN0RnV0dXJlICAgICAgPSBwYXN0RnV0dXJlO1xuICAgIHByb3RvdHlwZV9fcHJvdG8uc2V0ICAgICAgICAgICAgID0gbG9jYWxlX3NldF9fc2V0O1xuXG4gICAgLy8gTW9udGhcbiAgICBwcm90b3R5cGVfX3Byb3RvLm1vbnRocyAgICAgICAgICAgID0gICAgICAgIGxvY2FsZU1vbnRocztcbiAgICBwcm90b3R5cGVfX3Byb3RvLm1vbnRoc1Nob3J0ICAgICAgID0gICAgICAgIGxvY2FsZU1vbnRoc1Nob3J0O1xuICAgIHByb3RvdHlwZV9fcHJvdG8ubW9udGhzUGFyc2UgICAgICAgPSAgICAgICAgbG9jYWxlTW9udGhzUGFyc2U7XG4gICAgcHJvdG90eXBlX19wcm90by5tb250aHNSZWdleCAgICAgICA9IG1vbnRoc1JlZ2V4O1xuICAgIHByb3RvdHlwZV9fcHJvdG8ubW9udGhzU2hvcnRSZWdleCAgPSBtb250aHNTaG9ydFJlZ2V4O1xuXG4gICAgLy8gV2Vla1xuICAgIHByb3RvdHlwZV9fcHJvdG8ud2VlayA9IGxvY2FsZVdlZWs7XG4gICAgcHJvdG90eXBlX19wcm90by5maXJzdERheU9mWWVhciA9IGxvY2FsZUZpcnN0RGF5T2ZZZWFyO1xuICAgIHByb3RvdHlwZV9fcHJvdG8uZmlyc3REYXlPZldlZWsgPSBsb2NhbGVGaXJzdERheU9mV2VlaztcblxuICAgIC8vIERheSBvZiBXZWVrXG4gICAgcHJvdG90eXBlX19wcm90by53ZWVrZGF5cyAgICAgICA9ICAgICAgICBsb2NhbGVXZWVrZGF5cztcbiAgICBwcm90b3R5cGVfX3Byb3RvLndlZWtkYXlzTWluICAgID0gICAgICAgIGxvY2FsZVdlZWtkYXlzTWluO1xuICAgIHByb3RvdHlwZV9fcHJvdG8ud2Vla2RheXNTaG9ydCAgPSAgICAgICAgbG9jYWxlV2Vla2RheXNTaG9ydDtcbiAgICBwcm90b3R5cGVfX3Byb3RvLndlZWtkYXlzUGFyc2UgID0gICAgICAgIGxvY2FsZVdlZWtkYXlzUGFyc2U7XG5cbiAgICBwcm90b3R5cGVfX3Byb3RvLndlZWtkYXlzUmVnZXggICAgICAgPSAgICAgICAgd2Vla2RheXNSZWdleDtcbiAgICBwcm90b3R5cGVfX3Byb3RvLndlZWtkYXlzU2hvcnRSZWdleCAgPSAgICAgICAgd2Vla2RheXNTaG9ydFJlZ2V4O1xuICAgIHByb3RvdHlwZV9fcHJvdG8ud2Vla2RheXNNaW5SZWdleCAgICA9ICAgICAgICB3ZWVrZGF5c01pblJlZ2V4O1xuXG4gICAgLy8gSG91cnNcbiAgICBwcm90b3R5cGVfX3Byb3RvLmlzUE0gPSBsb2NhbGVJc1BNO1xuICAgIHByb3RvdHlwZV9fcHJvdG8ubWVyaWRpZW0gPSBsb2NhbGVNZXJpZGllbTtcblxuICAgIGZ1bmN0aW9uIGxpc3RzX19nZXQgKGZvcm1hdCwgaW5kZXgsIGZpZWxkLCBzZXR0ZXIpIHtcbiAgICAgICAgdmFyIGxvY2FsZSA9IGxvY2FsZV9sb2NhbGVzX19nZXRMb2NhbGUoKTtcbiAgICAgICAgdmFyIHV0YyA9IGNyZWF0ZV91dGNfX2NyZWF0ZVVUQygpLnNldChzZXR0ZXIsIGluZGV4KTtcbiAgICAgICAgcmV0dXJuIGxvY2FsZVtmaWVsZF0odXRjLCBmb3JtYXQpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxpc3RNb250aHNJbXBsIChmb3JtYXQsIGluZGV4LCBmaWVsZCkge1xuICAgICAgICBpZiAodHlwZW9mIGZvcm1hdCA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgICAgIGluZGV4ID0gZm9ybWF0O1xuICAgICAgICAgICAgZm9ybWF0ID0gdW5kZWZpbmVkO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9ybWF0ID0gZm9ybWF0IHx8ICcnO1xuXG4gICAgICAgIGlmIChpbmRleCAhPSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gbGlzdHNfX2dldChmb3JtYXQsIGluZGV4LCBmaWVsZCwgJ21vbnRoJyk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgaTtcbiAgICAgICAgdmFyIG91dCA9IFtdO1xuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgMTI7IGkrKykge1xuICAgICAgICAgICAgb3V0W2ldID0gbGlzdHNfX2dldChmb3JtYXQsIGksIGZpZWxkLCAnbW9udGgnKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gb3V0O1xuICAgIH1cblxuICAgIC8vICgpXG4gICAgLy8gKDUpXG4gICAgLy8gKGZtdCwgNSlcbiAgICAvLyAoZm10KVxuICAgIC8vICh0cnVlKVxuICAgIC8vICh0cnVlLCA1KVxuICAgIC8vICh0cnVlLCBmbXQsIDUpXG4gICAgLy8gKHRydWUsIGZtdClcbiAgICBmdW5jdGlvbiBsaXN0V2Vla2RheXNJbXBsIChsb2NhbGVTb3J0ZWQsIGZvcm1hdCwgaW5kZXgsIGZpZWxkKSB7XG4gICAgICAgIGlmICh0eXBlb2YgbG9jYWxlU29ydGVkID09PSAnYm9vbGVhbicpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgZm9ybWF0ID09PSAnbnVtYmVyJykge1xuICAgICAgICAgICAgICAgIGluZGV4ID0gZm9ybWF0O1xuICAgICAgICAgICAgICAgIGZvcm1hdCA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZm9ybWF0ID0gZm9ybWF0IHx8ICcnO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZm9ybWF0ID0gbG9jYWxlU29ydGVkO1xuICAgICAgICAgICAgaW5kZXggPSBmb3JtYXQ7XG4gICAgICAgICAgICBsb2NhbGVTb3J0ZWQgPSBmYWxzZTtcblxuICAgICAgICAgICAgaWYgKHR5cGVvZiBmb3JtYXQgPT09ICdudW1iZXInKSB7XG4gICAgICAgICAgICAgICAgaW5kZXggPSBmb3JtYXQ7XG4gICAgICAgICAgICAgICAgZm9ybWF0ID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmb3JtYXQgPSBmb3JtYXQgfHwgJyc7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgbG9jYWxlID0gbG9jYWxlX2xvY2FsZXNfX2dldExvY2FsZSgpLFxuICAgICAgICAgICAgc2hpZnQgPSBsb2NhbGVTb3J0ZWQgPyBsb2NhbGUuX3dlZWsuZG93IDogMDtcblxuICAgICAgICBpZiAoaW5kZXggIT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIGxpc3RzX19nZXQoZm9ybWF0LCAoaW5kZXggKyBzaGlmdCkgJSA3LCBmaWVsZCwgJ2RheScpO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGk7XG4gICAgICAgIHZhciBvdXQgPSBbXTtcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IDc7IGkrKykge1xuICAgICAgICAgICAgb3V0W2ldID0gbGlzdHNfX2dldChmb3JtYXQsIChpICsgc2hpZnQpICUgNywgZmllbGQsICdkYXknKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gb3V0O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxpc3RzX19saXN0TW9udGhzIChmb3JtYXQsIGluZGV4KSB7XG4gICAgICAgIHJldHVybiBsaXN0TW9udGhzSW1wbChmb3JtYXQsIGluZGV4LCAnbW9udGhzJyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbGlzdHNfX2xpc3RNb250aHNTaG9ydCAoZm9ybWF0LCBpbmRleCkge1xuICAgICAgICByZXR1cm4gbGlzdE1vbnRoc0ltcGwoZm9ybWF0LCBpbmRleCwgJ21vbnRoc1Nob3J0Jyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbGlzdHNfX2xpc3RXZWVrZGF5cyAobG9jYWxlU29ydGVkLCBmb3JtYXQsIGluZGV4KSB7XG4gICAgICAgIHJldHVybiBsaXN0V2Vla2RheXNJbXBsKGxvY2FsZVNvcnRlZCwgZm9ybWF0LCBpbmRleCwgJ3dlZWtkYXlzJyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbGlzdHNfX2xpc3RXZWVrZGF5c1Nob3J0IChsb2NhbGVTb3J0ZWQsIGZvcm1hdCwgaW5kZXgpIHtcbiAgICAgICAgcmV0dXJuIGxpc3RXZWVrZGF5c0ltcGwobG9jYWxlU29ydGVkLCBmb3JtYXQsIGluZGV4LCAnd2Vla2RheXNTaG9ydCcpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxpc3RzX19saXN0V2Vla2RheXNNaW4gKGxvY2FsZVNvcnRlZCwgZm9ybWF0LCBpbmRleCkge1xuICAgICAgICByZXR1cm4gbGlzdFdlZWtkYXlzSW1wbChsb2NhbGVTb3J0ZWQsIGZvcm1hdCwgaW5kZXgsICd3ZWVrZGF5c01pbicpO1xuICAgIH1cblxuICAgIGxvY2FsZV9sb2NhbGVzX19nZXRTZXRHbG9iYWxMb2NhbGUoJ2VuJywge1xuICAgICAgICBvcmRpbmFsUGFyc2U6IC9cXGR7MSwyfSh0aHxzdHxuZHxyZCkvLFxuICAgICAgICBvcmRpbmFsIDogZnVuY3Rpb24gKG51bWJlcikge1xuICAgICAgICAgICAgdmFyIGIgPSBudW1iZXIgJSAxMCxcbiAgICAgICAgICAgICAgICBvdXRwdXQgPSAodG9JbnQobnVtYmVyICUgMTAwIC8gMTApID09PSAxKSA/ICd0aCcgOlxuICAgICAgICAgICAgICAgIChiID09PSAxKSA/ICdzdCcgOlxuICAgICAgICAgICAgICAgIChiID09PSAyKSA/ICduZCcgOlxuICAgICAgICAgICAgICAgIChiID09PSAzKSA/ICdyZCcgOiAndGgnO1xuICAgICAgICAgICAgcmV0dXJuIG51bWJlciArIG91dHB1dDtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8gU2lkZSBlZmZlY3QgaW1wb3J0c1xuICAgIHV0aWxzX2hvb2tzX19ob29rcy5sYW5nID0gZGVwcmVjYXRlKCdtb21lbnQubGFuZyBpcyBkZXByZWNhdGVkLiBVc2UgbW9tZW50LmxvY2FsZSBpbnN0ZWFkLicsIGxvY2FsZV9sb2NhbGVzX19nZXRTZXRHbG9iYWxMb2NhbGUpO1xuICAgIHV0aWxzX2hvb2tzX19ob29rcy5sYW5nRGF0YSA9IGRlcHJlY2F0ZSgnbW9tZW50LmxhbmdEYXRhIGlzIGRlcHJlY2F0ZWQuIFVzZSBtb21lbnQubG9jYWxlRGF0YSBpbnN0ZWFkLicsIGxvY2FsZV9sb2NhbGVzX19nZXRMb2NhbGUpO1xuXG4gICAgdmFyIG1hdGhBYnMgPSBNYXRoLmFicztcblxuICAgIGZ1bmN0aW9uIGR1cmF0aW9uX2Fic19fYWJzICgpIHtcbiAgICAgICAgdmFyIGRhdGEgICAgICAgICAgID0gdGhpcy5fZGF0YTtcblxuICAgICAgICB0aGlzLl9taWxsaXNlY29uZHMgPSBtYXRoQWJzKHRoaXMuX21pbGxpc2Vjb25kcyk7XG4gICAgICAgIHRoaXMuX2RheXMgICAgICAgICA9IG1hdGhBYnModGhpcy5fZGF5cyk7XG4gICAgICAgIHRoaXMuX21vbnRocyAgICAgICA9IG1hdGhBYnModGhpcy5fbW9udGhzKTtcblxuICAgICAgICBkYXRhLm1pbGxpc2Vjb25kcyAgPSBtYXRoQWJzKGRhdGEubWlsbGlzZWNvbmRzKTtcbiAgICAgICAgZGF0YS5zZWNvbmRzICAgICAgID0gbWF0aEFicyhkYXRhLnNlY29uZHMpO1xuICAgICAgICBkYXRhLm1pbnV0ZXMgICAgICAgPSBtYXRoQWJzKGRhdGEubWludXRlcyk7XG4gICAgICAgIGRhdGEuaG91cnMgICAgICAgICA9IG1hdGhBYnMoZGF0YS5ob3Vycyk7XG4gICAgICAgIGRhdGEubW9udGhzICAgICAgICA9IG1hdGhBYnMoZGF0YS5tb250aHMpO1xuICAgICAgICBkYXRhLnllYXJzICAgICAgICAgPSBtYXRoQWJzKGRhdGEueWVhcnMpO1xuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGR1cmF0aW9uX2FkZF9zdWJ0cmFjdF9fYWRkU3VidHJhY3QgKGR1cmF0aW9uLCBpbnB1dCwgdmFsdWUsIGRpcmVjdGlvbikge1xuICAgICAgICB2YXIgb3RoZXIgPSBjcmVhdGVfX2NyZWF0ZUR1cmF0aW9uKGlucHV0LCB2YWx1ZSk7XG5cbiAgICAgICAgZHVyYXRpb24uX21pbGxpc2Vjb25kcyArPSBkaXJlY3Rpb24gKiBvdGhlci5fbWlsbGlzZWNvbmRzO1xuICAgICAgICBkdXJhdGlvbi5fZGF5cyAgICAgICAgICs9IGRpcmVjdGlvbiAqIG90aGVyLl9kYXlzO1xuICAgICAgICBkdXJhdGlvbi5fbW9udGhzICAgICAgICs9IGRpcmVjdGlvbiAqIG90aGVyLl9tb250aHM7XG5cbiAgICAgICAgcmV0dXJuIGR1cmF0aW9uLl9idWJibGUoKTtcbiAgICB9XG5cbiAgICAvLyBzdXBwb3J0cyBvbmx5IDIuMC1zdHlsZSBhZGQoMSwgJ3MnKSBvciBhZGQoZHVyYXRpb24pXG4gICAgZnVuY3Rpb24gZHVyYXRpb25fYWRkX3N1YnRyYWN0X19hZGQgKGlucHV0LCB2YWx1ZSkge1xuICAgICAgICByZXR1cm4gZHVyYXRpb25fYWRkX3N1YnRyYWN0X19hZGRTdWJ0cmFjdCh0aGlzLCBpbnB1dCwgdmFsdWUsIDEpO1xuICAgIH1cblxuICAgIC8vIHN1cHBvcnRzIG9ubHkgMi4wLXN0eWxlIHN1YnRyYWN0KDEsICdzJykgb3Igc3VidHJhY3QoZHVyYXRpb24pXG4gICAgZnVuY3Rpb24gZHVyYXRpb25fYWRkX3N1YnRyYWN0X19zdWJ0cmFjdCAoaW5wdXQsIHZhbHVlKSB7XG4gICAgICAgIHJldHVybiBkdXJhdGlvbl9hZGRfc3VidHJhY3RfX2FkZFN1YnRyYWN0KHRoaXMsIGlucHV0LCB2YWx1ZSwgLTEpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGFic0NlaWwgKG51bWJlcikge1xuICAgICAgICBpZiAobnVtYmVyIDwgMCkge1xuICAgICAgICAgICAgcmV0dXJuIE1hdGguZmxvb3IobnVtYmVyKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBNYXRoLmNlaWwobnVtYmVyKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGJ1YmJsZSAoKSB7XG4gICAgICAgIHZhciBtaWxsaXNlY29uZHMgPSB0aGlzLl9taWxsaXNlY29uZHM7XG4gICAgICAgIHZhciBkYXlzICAgICAgICAgPSB0aGlzLl9kYXlzO1xuICAgICAgICB2YXIgbW9udGhzICAgICAgID0gdGhpcy5fbW9udGhzO1xuICAgICAgICB2YXIgZGF0YSAgICAgICAgID0gdGhpcy5fZGF0YTtcbiAgICAgICAgdmFyIHNlY29uZHMsIG1pbnV0ZXMsIGhvdXJzLCB5ZWFycywgbW9udGhzRnJvbURheXM7XG5cbiAgICAgICAgLy8gaWYgd2UgaGF2ZSBhIG1peCBvZiBwb3NpdGl2ZSBhbmQgbmVnYXRpdmUgdmFsdWVzLCBidWJibGUgZG93biBmaXJzdFxuICAgICAgICAvLyBjaGVjazogaHR0cHM6Ly9naXRodWIuY29tL21vbWVudC9tb21lbnQvaXNzdWVzLzIxNjZcbiAgICAgICAgaWYgKCEoKG1pbGxpc2Vjb25kcyA+PSAwICYmIGRheXMgPj0gMCAmJiBtb250aHMgPj0gMCkgfHxcbiAgICAgICAgICAgICAgICAobWlsbGlzZWNvbmRzIDw9IDAgJiYgZGF5cyA8PSAwICYmIG1vbnRocyA8PSAwKSkpIHtcbiAgICAgICAgICAgIG1pbGxpc2Vjb25kcyArPSBhYnNDZWlsKG1vbnRoc1RvRGF5cyhtb250aHMpICsgZGF5cykgKiA4NjRlNTtcbiAgICAgICAgICAgIGRheXMgPSAwO1xuICAgICAgICAgICAgbW9udGhzID0gMDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFRoZSBmb2xsb3dpbmcgY29kZSBidWJibGVzIHVwIHZhbHVlcywgc2VlIHRoZSB0ZXN0cyBmb3JcbiAgICAgICAgLy8gZXhhbXBsZXMgb2Ygd2hhdCB0aGF0IG1lYW5zLlxuICAgICAgICBkYXRhLm1pbGxpc2Vjb25kcyA9IG1pbGxpc2Vjb25kcyAlIDEwMDA7XG5cbiAgICAgICAgc2Vjb25kcyAgICAgICAgICAgPSBhYnNGbG9vcihtaWxsaXNlY29uZHMgLyAxMDAwKTtcbiAgICAgICAgZGF0YS5zZWNvbmRzICAgICAgPSBzZWNvbmRzICUgNjA7XG5cbiAgICAgICAgbWludXRlcyAgICAgICAgICAgPSBhYnNGbG9vcihzZWNvbmRzIC8gNjApO1xuICAgICAgICBkYXRhLm1pbnV0ZXMgICAgICA9IG1pbnV0ZXMgJSA2MDtcblxuICAgICAgICBob3VycyAgICAgICAgICAgICA9IGFic0Zsb29yKG1pbnV0ZXMgLyA2MCk7XG4gICAgICAgIGRhdGEuaG91cnMgICAgICAgID0gaG91cnMgJSAyNDtcblxuICAgICAgICBkYXlzICs9IGFic0Zsb29yKGhvdXJzIC8gMjQpO1xuXG4gICAgICAgIC8vIGNvbnZlcnQgZGF5cyB0byBtb250aHNcbiAgICAgICAgbW9udGhzRnJvbURheXMgPSBhYnNGbG9vcihkYXlzVG9Nb250aHMoZGF5cykpO1xuICAgICAgICBtb250aHMgKz0gbW9udGhzRnJvbURheXM7XG4gICAgICAgIGRheXMgLT0gYWJzQ2VpbChtb250aHNUb0RheXMobW9udGhzRnJvbURheXMpKTtcblxuICAgICAgICAvLyAxMiBtb250aHMgLT4gMSB5ZWFyXG4gICAgICAgIHllYXJzID0gYWJzRmxvb3IobW9udGhzIC8gMTIpO1xuICAgICAgICBtb250aHMgJT0gMTI7XG5cbiAgICAgICAgZGF0YS5kYXlzICAgPSBkYXlzO1xuICAgICAgICBkYXRhLm1vbnRocyA9IG1vbnRocztcbiAgICAgICAgZGF0YS55ZWFycyAgPSB5ZWFycztcblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBkYXlzVG9Nb250aHMgKGRheXMpIHtcbiAgICAgICAgLy8gNDAwIHllYXJzIGhhdmUgMTQ2MDk3IGRheXMgKHRha2luZyBpbnRvIGFjY291bnQgbGVhcCB5ZWFyIHJ1bGVzKVxuICAgICAgICAvLyA0MDAgeWVhcnMgaGF2ZSAxMiBtb250aHMgPT09IDQ4MDBcbiAgICAgICAgcmV0dXJuIGRheXMgKiA0ODAwIC8gMTQ2MDk3O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIG1vbnRoc1RvRGF5cyAobW9udGhzKSB7XG4gICAgICAgIC8vIHRoZSByZXZlcnNlIG9mIGRheXNUb01vbnRoc1xuICAgICAgICByZXR1cm4gbW9udGhzICogMTQ2MDk3IC8gNDgwMDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBhcyAodW5pdHMpIHtcbiAgICAgICAgdmFyIGRheXM7XG4gICAgICAgIHZhciBtb250aHM7XG4gICAgICAgIHZhciBtaWxsaXNlY29uZHMgPSB0aGlzLl9taWxsaXNlY29uZHM7XG5cbiAgICAgICAgdW5pdHMgPSBub3JtYWxpemVVbml0cyh1bml0cyk7XG5cbiAgICAgICAgaWYgKHVuaXRzID09PSAnbW9udGgnIHx8IHVuaXRzID09PSAneWVhcicpIHtcbiAgICAgICAgICAgIGRheXMgICA9IHRoaXMuX2RheXMgICArIG1pbGxpc2Vjb25kcyAvIDg2NGU1O1xuICAgICAgICAgICAgbW9udGhzID0gdGhpcy5fbW9udGhzICsgZGF5c1RvTW9udGhzKGRheXMpO1xuICAgICAgICAgICAgcmV0dXJuIHVuaXRzID09PSAnbW9udGgnID8gbW9udGhzIDogbW9udGhzIC8gMTI7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBoYW5kbGUgbWlsbGlzZWNvbmRzIHNlcGFyYXRlbHkgYmVjYXVzZSBvZiBmbG9hdGluZyBwb2ludCBtYXRoIGVycm9ycyAoaXNzdWUgIzE4NjcpXG4gICAgICAgICAgICBkYXlzID0gdGhpcy5fZGF5cyArIE1hdGgucm91bmQobW9udGhzVG9EYXlzKHRoaXMuX21vbnRocykpO1xuICAgICAgICAgICAgc3dpdGNoICh1bml0cykge1xuICAgICAgICAgICAgICAgIGNhc2UgJ3dlZWsnICAgOiByZXR1cm4gZGF5cyAvIDcgICAgICsgbWlsbGlzZWNvbmRzIC8gNjA0OGU1O1xuICAgICAgICAgICAgICAgIGNhc2UgJ2RheScgICAgOiByZXR1cm4gZGF5cyAgICAgICAgICsgbWlsbGlzZWNvbmRzIC8gODY0ZTU7XG4gICAgICAgICAgICAgICAgY2FzZSAnaG91cicgICA6IHJldHVybiBkYXlzICogMjQgICAgKyBtaWxsaXNlY29uZHMgLyAzNmU1O1xuICAgICAgICAgICAgICAgIGNhc2UgJ21pbnV0ZScgOiByZXR1cm4gZGF5cyAqIDE0NDAgICsgbWlsbGlzZWNvbmRzIC8gNmU0O1xuICAgICAgICAgICAgICAgIGNhc2UgJ3NlY29uZCcgOiByZXR1cm4gZGF5cyAqIDg2NDAwICsgbWlsbGlzZWNvbmRzIC8gMTAwMDtcbiAgICAgICAgICAgICAgICAvLyBNYXRoLmZsb29yIHByZXZlbnRzIGZsb2F0aW5nIHBvaW50IG1hdGggZXJyb3JzIGhlcmVcbiAgICAgICAgICAgICAgICBjYXNlICdtaWxsaXNlY29uZCc6IHJldHVybiBNYXRoLmZsb29yKGRheXMgKiA4NjRlNSkgKyBtaWxsaXNlY29uZHM7XG4gICAgICAgICAgICAgICAgZGVmYXVsdDogdGhyb3cgbmV3IEVycm9yKCdVbmtub3duIHVuaXQgJyArIHVuaXRzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIFRPRE86IFVzZSB0aGlzLmFzKCdtcycpP1xuICAgIGZ1bmN0aW9uIGR1cmF0aW9uX2FzX192YWx1ZU9mICgpIHtcbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIHRoaXMuX21pbGxpc2Vjb25kcyArXG4gICAgICAgICAgICB0aGlzLl9kYXlzICogODY0ZTUgK1xuICAgICAgICAgICAgKHRoaXMuX21vbnRocyAlIDEyKSAqIDI1OTJlNiArXG4gICAgICAgICAgICB0b0ludCh0aGlzLl9tb250aHMgLyAxMikgKiAzMTUzNmU2XG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbWFrZUFzIChhbGlhcykge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuYXMoYWxpYXMpO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIHZhciBhc01pbGxpc2Vjb25kcyA9IG1ha2VBcygnbXMnKTtcbiAgICB2YXIgYXNTZWNvbmRzICAgICAgPSBtYWtlQXMoJ3MnKTtcbiAgICB2YXIgYXNNaW51dGVzICAgICAgPSBtYWtlQXMoJ20nKTtcbiAgICB2YXIgYXNIb3VycyAgICAgICAgPSBtYWtlQXMoJ2gnKTtcbiAgICB2YXIgYXNEYXlzICAgICAgICAgPSBtYWtlQXMoJ2QnKTtcbiAgICB2YXIgYXNXZWVrcyAgICAgICAgPSBtYWtlQXMoJ3cnKTtcbiAgICB2YXIgYXNNb250aHMgICAgICAgPSBtYWtlQXMoJ00nKTtcbiAgICB2YXIgYXNZZWFycyAgICAgICAgPSBtYWtlQXMoJ3knKTtcblxuICAgIGZ1bmN0aW9uIGR1cmF0aW9uX2dldF9fZ2V0ICh1bml0cykge1xuICAgICAgICB1bml0cyA9IG5vcm1hbGl6ZVVuaXRzKHVuaXRzKTtcbiAgICAgICAgcmV0dXJuIHRoaXNbdW5pdHMgKyAncyddKCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbWFrZUdldHRlcihuYW1lKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fZGF0YVtuYW1lXTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICB2YXIgbWlsbGlzZWNvbmRzID0gbWFrZUdldHRlcignbWlsbGlzZWNvbmRzJyk7XG4gICAgdmFyIHNlY29uZHMgICAgICA9IG1ha2VHZXR0ZXIoJ3NlY29uZHMnKTtcbiAgICB2YXIgbWludXRlcyAgICAgID0gbWFrZUdldHRlcignbWludXRlcycpO1xuICAgIHZhciBob3VycyAgICAgICAgPSBtYWtlR2V0dGVyKCdob3VycycpO1xuICAgIHZhciBkYXlzICAgICAgICAgPSBtYWtlR2V0dGVyKCdkYXlzJyk7XG4gICAgdmFyIG1vbnRocyAgICAgICA9IG1ha2VHZXR0ZXIoJ21vbnRocycpO1xuICAgIHZhciB5ZWFycyAgICAgICAgPSBtYWtlR2V0dGVyKCd5ZWFycycpO1xuXG4gICAgZnVuY3Rpb24gd2Vla3MgKCkge1xuICAgICAgICByZXR1cm4gYWJzRmxvb3IodGhpcy5kYXlzKCkgLyA3KTtcbiAgICB9XG5cbiAgICB2YXIgcm91bmQgPSBNYXRoLnJvdW5kO1xuICAgIHZhciB0aHJlc2hvbGRzID0ge1xuICAgICAgICBzOiA0NSwgIC8vIHNlY29uZHMgdG8gbWludXRlXG4gICAgICAgIG06IDQ1LCAgLy8gbWludXRlcyB0byBob3VyXG4gICAgICAgIGg6IDIyLCAgLy8gaG91cnMgdG8gZGF5XG4gICAgICAgIGQ6IDI2LCAgLy8gZGF5cyB0byBtb250aFxuICAgICAgICBNOiAxMSAgIC8vIG1vbnRocyB0byB5ZWFyXG4gICAgfTtcblxuICAgIC8vIGhlbHBlciBmdW5jdGlvbiBmb3IgbW9tZW50LmZuLmZyb20sIG1vbWVudC5mbi5mcm9tTm93LCBhbmQgbW9tZW50LmR1cmF0aW9uLmZuLmh1bWFuaXplXG4gICAgZnVuY3Rpb24gc3Vic3RpdHV0ZVRpbWVBZ28oc3RyaW5nLCBudW1iZXIsIHdpdGhvdXRTdWZmaXgsIGlzRnV0dXJlLCBsb2NhbGUpIHtcbiAgICAgICAgcmV0dXJuIGxvY2FsZS5yZWxhdGl2ZVRpbWUobnVtYmVyIHx8IDEsICEhd2l0aG91dFN1ZmZpeCwgc3RyaW5nLCBpc0Z1dHVyZSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZHVyYXRpb25faHVtYW5pemVfX3JlbGF0aXZlVGltZSAocG9zTmVnRHVyYXRpb24sIHdpdGhvdXRTdWZmaXgsIGxvY2FsZSkge1xuICAgICAgICB2YXIgZHVyYXRpb24gPSBjcmVhdGVfX2NyZWF0ZUR1cmF0aW9uKHBvc05lZ0R1cmF0aW9uKS5hYnMoKTtcbiAgICAgICAgdmFyIHNlY29uZHMgID0gcm91bmQoZHVyYXRpb24uYXMoJ3MnKSk7XG4gICAgICAgIHZhciBtaW51dGVzICA9IHJvdW5kKGR1cmF0aW9uLmFzKCdtJykpO1xuICAgICAgICB2YXIgaG91cnMgICAgPSByb3VuZChkdXJhdGlvbi5hcygnaCcpKTtcbiAgICAgICAgdmFyIGRheXMgICAgID0gcm91bmQoZHVyYXRpb24uYXMoJ2QnKSk7XG4gICAgICAgIHZhciBtb250aHMgICA9IHJvdW5kKGR1cmF0aW9uLmFzKCdNJykpO1xuICAgICAgICB2YXIgeWVhcnMgICAgPSByb3VuZChkdXJhdGlvbi5hcygneScpKTtcblxuICAgICAgICB2YXIgYSA9IHNlY29uZHMgPCB0aHJlc2hvbGRzLnMgJiYgWydzJywgc2Vjb25kc10gIHx8XG4gICAgICAgICAgICAgICAgbWludXRlcyA8PSAxICAgICAgICAgICAmJiBbJ20nXSAgICAgICAgICAgfHxcbiAgICAgICAgICAgICAgICBtaW51dGVzIDwgdGhyZXNob2xkcy5tICYmIFsnbW0nLCBtaW51dGVzXSB8fFxuICAgICAgICAgICAgICAgIGhvdXJzICAgPD0gMSAgICAgICAgICAgJiYgWydoJ10gICAgICAgICAgIHx8XG4gICAgICAgICAgICAgICAgaG91cnMgICA8IHRocmVzaG9sZHMuaCAmJiBbJ2hoJywgaG91cnNdICAgfHxcbiAgICAgICAgICAgICAgICBkYXlzICAgIDw9IDEgICAgICAgICAgICYmIFsnZCddICAgICAgICAgICB8fFxuICAgICAgICAgICAgICAgIGRheXMgICAgPCB0aHJlc2hvbGRzLmQgJiYgWydkZCcsIGRheXNdICAgIHx8XG4gICAgICAgICAgICAgICAgbW9udGhzICA8PSAxICAgICAgICAgICAmJiBbJ00nXSAgICAgICAgICAgfHxcbiAgICAgICAgICAgICAgICBtb250aHMgIDwgdGhyZXNob2xkcy5NICYmIFsnTU0nLCBtb250aHNdICB8fFxuICAgICAgICAgICAgICAgIHllYXJzICAgPD0gMSAgICAgICAgICAgJiYgWyd5J10gICAgICAgICAgIHx8IFsneXknLCB5ZWFyc107XG5cbiAgICAgICAgYVsyXSA9IHdpdGhvdXRTdWZmaXg7XG4gICAgICAgIGFbM10gPSArcG9zTmVnRHVyYXRpb24gPiAwO1xuICAgICAgICBhWzRdID0gbG9jYWxlO1xuICAgICAgICByZXR1cm4gc3Vic3RpdHV0ZVRpbWVBZ28uYXBwbHkobnVsbCwgYSk7XG4gICAgfVxuXG4gICAgLy8gVGhpcyBmdW5jdGlvbiBhbGxvd3MgeW91IHRvIHNldCB0aGUgcm91bmRpbmcgZnVuY3Rpb24gZm9yIHJlbGF0aXZlIHRpbWUgc3RyaW5nc1xuICAgIGZ1bmN0aW9uIGR1cmF0aW9uX2h1bWFuaXplX19nZXRTZXRSZWxhdGl2ZVRpbWVSb3VuZGluZyAocm91bmRpbmdGdW5jdGlvbikge1xuICAgICAgICBpZiAocm91bmRpbmdGdW5jdGlvbiA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICByZXR1cm4gcm91bmQ7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZihyb3VuZGluZ0Z1bmN0aW9uKSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgcm91bmQgPSByb3VuZGluZ0Z1bmN0aW9uO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIC8vIFRoaXMgZnVuY3Rpb24gYWxsb3dzIHlvdSB0byBzZXQgYSB0aHJlc2hvbGQgZm9yIHJlbGF0aXZlIHRpbWUgc3RyaW5nc1xuICAgIGZ1bmN0aW9uIGR1cmF0aW9uX2h1bWFuaXplX19nZXRTZXRSZWxhdGl2ZVRpbWVUaHJlc2hvbGQgKHRocmVzaG9sZCwgbGltaXQpIHtcbiAgICAgICAgaWYgKHRocmVzaG9sZHNbdGhyZXNob2xkXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGxpbWl0ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHJldHVybiB0aHJlc2hvbGRzW3RocmVzaG9sZF07XG4gICAgICAgIH1cbiAgICAgICAgdGhyZXNob2xkc1t0aHJlc2hvbGRdID0gbGltaXQ7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGh1bWFuaXplICh3aXRoU3VmZml4KSB7XG4gICAgICAgIHZhciBsb2NhbGUgPSB0aGlzLmxvY2FsZURhdGEoKTtcbiAgICAgICAgdmFyIG91dHB1dCA9IGR1cmF0aW9uX2h1bWFuaXplX19yZWxhdGl2ZVRpbWUodGhpcywgIXdpdGhTdWZmaXgsIGxvY2FsZSk7XG5cbiAgICAgICAgaWYgKHdpdGhTdWZmaXgpIHtcbiAgICAgICAgICAgIG91dHB1dCA9IGxvY2FsZS5wYXN0RnV0dXJlKCt0aGlzLCBvdXRwdXQpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGxvY2FsZS5wb3N0Zm9ybWF0KG91dHB1dCk7XG4gICAgfVxuXG4gICAgdmFyIGlzb19zdHJpbmdfX2FicyA9IE1hdGguYWJzO1xuXG4gICAgZnVuY3Rpb24gaXNvX3N0cmluZ19fdG9JU09TdHJpbmcoKSB7XG4gICAgICAgIC8vIGZvciBJU08gc3RyaW5ncyB3ZSBkbyBub3QgdXNlIHRoZSBub3JtYWwgYnViYmxpbmcgcnVsZXM6XG4gICAgICAgIC8vICAqIG1pbGxpc2Vjb25kcyBidWJibGUgdXAgdW50aWwgdGhleSBiZWNvbWUgaG91cnNcbiAgICAgICAgLy8gICogZGF5cyBkbyBub3QgYnViYmxlIGF0IGFsbFxuICAgICAgICAvLyAgKiBtb250aHMgYnViYmxlIHVwIHVudGlsIHRoZXkgYmVjb21lIHllYXJzXG4gICAgICAgIC8vIFRoaXMgaXMgYmVjYXVzZSB0aGVyZSBpcyBubyBjb250ZXh0LWZyZWUgY29udmVyc2lvbiBiZXR3ZWVuIGhvdXJzIGFuZCBkYXlzXG4gICAgICAgIC8vICh0aGluayBvZiBjbG9jayBjaGFuZ2VzKVxuICAgICAgICAvLyBhbmQgYWxzbyBub3QgYmV0d2VlbiBkYXlzIGFuZCBtb250aHMgKDI4LTMxIGRheXMgcGVyIG1vbnRoKVxuICAgICAgICB2YXIgc2Vjb25kcyA9IGlzb19zdHJpbmdfX2Ficyh0aGlzLl9taWxsaXNlY29uZHMpIC8gMTAwMDtcbiAgICAgICAgdmFyIGRheXMgICAgICAgICA9IGlzb19zdHJpbmdfX2Ficyh0aGlzLl9kYXlzKTtcbiAgICAgICAgdmFyIG1vbnRocyAgICAgICA9IGlzb19zdHJpbmdfX2Ficyh0aGlzLl9tb250aHMpO1xuICAgICAgICB2YXIgbWludXRlcywgaG91cnMsIHllYXJzO1xuXG4gICAgICAgIC8vIDM2MDAgc2Vjb25kcyAtPiA2MCBtaW51dGVzIC0+IDEgaG91clxuICAgICAgICBtaW51dGVzICAgICAgICAgICA9IGFic0Zsb29yKHNlY29uZHMgLyA2MCk7XG4gICAgICAgIGhvdXJzICAgICAgICAgICAgID0gYWJzRmxvb3IobWludXRlcyAvIDYwKTtcbiAgICAgICAgc2Vjb25kcyAlPSA2MDtcbiAgICAgICAgbWludXRlcyAlPSA2MDtcblxuICAgICAgICAvLyAxMiBtb250aHMgLT4gMSB5ZWFyXG4gICAgICAgIHllYXJzICA9IGFic0Zsb29yKG1vbnRocyAvIDEyKTtcbiAgICAgICAgbW9udGhzICU9IDEyO1xuXG5cbiAgICAgICAgLy8gaW5zcGlyZWQgYnkgaHR0cHM6Ly9naXRodWIuY29tL2RvcmRpbGxlL21vbWVudC1pc29kdXJhdGlvbi9ibG9iL21hc3Rlci9tb21lbnQuaXNvZHVyYXRpb24uanNcbiAgICAgICAgdmFyIFkgPSB5ZWFycztcbiAgICAgICAgdmFyIE0gPSBtb250aHM7XG4gICAgICAgIHZhciBEID0gZGF5cztcbiAgICAgICAgdmFyIGggPSBob3VycztcbiAgICAgICAgdmFyIG0gPSBtaW51dGVzO1xuICAgICAgICB2YXIgcyA9IHNlY29uZHM7XG4gICAgICAgIHZhciB0b3RhbCA9IHRoaXMuYXNTZWNvbmRzKCk7XG5cbiAgICAgICAgaWYgKCF0b3RhbCkge1xuICAgICAgICAgICAgLy8gdGhpcyBpcyB0aGUgc2FtZSBhcyBDIydzIChOb2RhKSBhbmQgcHl0aG9uIChpc29kYXRlKS4uLlxuICAgICAgICAgICAgLy8gYnV0IG5vdCBvdGhlciBKUyAoZ29vZy5kYXRlKVxuICAgICAgICAgICAgcmV0dXJuICdQMEQnO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuICh0b3RhbCA8IDAgPyAnLScgOiAnJykgK1xuICAgICAgICAgICAgJ1AnICtcbiAgICAgICAgICAgIChZID8gWSArICdZJyA6ICcnKSArXG4gICAgICAgICAgICAoTSA/IE0gKyAnTScgOiAnJykgK1xuICAgICAgICAgICAgKEQgPyBEICsgJ0QnIDogJycpICtcbiAgICAgICAgICAgICgoaCB8fCBtIHx8IHMpID8gJ1QnIDogJycpICtcbiAgICAgICAgICAgIChoID8gaCArICdIJyA6ICcnKSArXG4gICAgICAgICAgICAobSA/IG0gKyAnTScgOiAnJykgK1xuICAgICAgICAgICAgKHMgPyBzICsgJ1MnIDogJycpO1xuICAgIH1cblxuICAgIHZhciBkdXJhdGlvbl9wcm90b3R5cGVfX3Byb3RvID0gRHVyYXRpb24ucHJvdG90eXBlO1xuXG4gICAgZHVyYXRpb25fcHJvdG90eXBlX19wcm90by5hYnMgICAgICAgICAgICA9IGR1cmF0aW9uX2Fic19fYWJzO1xuICAgIGR1cmF0aW9uX3Byb3RvdHlwZV9fcHJvdG8uYWRkICAgICAgICAgICAgPSBkdXJhdGlvbl9hZGRfc3VidHJhY3RfX2FkZDtcbiAgICBkdXJhdGlvbl9wcm90b3R5cGVfX3Byb3RvLnN1YnRyYWN0ICAgICAgID0gZHVyYXRpb25fYWRkX3N1YnRyYWN0X19zdWJ0cmFjdDtcbiAgICBkdXJhdGlvbl9wcm90b3R5cGVfX3Byb3RvLmFzICAgICAgICAgICAgID0gYXM7XG4gICAgZHVyYXRpb25fcHJvdG90eXBlX19wcm90by5hc01pbGxpc2Vjb25kcyA9IGFzTWlsbGlzZWNvbmRzO1xuICAgIGR1cmF0aW9uX3Byb3RvdHlwZV9fcHJvdG8uYXNTZWNvbmRzICAgICAgPSBhc1NlY29uZHM7XG4gICAgZHVyYXRpb25fcHJvdG90eXBlX19wcm90by5hc01pbnV0ZXMgICAgICA9IGFzTWludXRlcztcbiAgICBkdXJhdGlvbl9wcm90b3R5cGVfX3Byb3RvLmFzSG91cnMgICAgICAgID0gYXNIb3VycztcbiAgICBkdXJhdGlvbl9wcm90b3R5cGVfX3Byb3RvLmFzRGF5cyAgICAgICAgID0gYXNEYXlzO1xuICAgIGR1cmF0aW9uX3Byb3RvdHlwZV9fcHJvdG8uYXNXZWVrcyAgICAgICAgPSBhc1dlZWtzO1xuICAgIGR1cmF0aW9uX3Byb3RvdHlwZV9fcHJvdG8uYXNNb250aHMgICAgICAgPSBhc01vbnRocztcbiAgICBkdXJhdGlvbl9wcm90b3R5cGVfX3Byb3RvLmFzWWVhcnMgICAgICAgID0gYXNZZWFycztcbiAgICBkdXJhdGlvbl9wcm90b3R5cGVfX3Byb3RvLnZhbHVlT2YgICAgICAgID0gZHVyYXRpb25fYXNfX3ZhbHVlT2Y7XG4gICAgZHVyYXRpb25fcHJvdG90eXBlX19wcm90by5fYnViYmxlICAgICAgICA9IGJ1YmJsZTtcbiAgICBkdXJhdGlvbl9wcm90b3R5cGVfX3Byb3RvLmdldCAgICAgICAgICAgID0gZHVyYXRpb25fZ2V0X19nZXQ7XG4gICAgZHVyYXRpb25fcHJvdG90eXBlX19wcm90by5taWxsaXNlY29uZHMgICA9IG1pbGxpc2Vjb25kcztcbiAgICBkdXJhdGlvbl9wcm90b3R5cGVfX3Byb3RvLnNlY29uZHMgICAgICAgID0gc2Vjb25kcztcbiAgICBkdXJhdGlvbl9wcm90b3R5cGVfX3Byb3RvLm1pbnV0ZXMgICAgICAgID0gbWludXRlcztcbiAgICBkdXJhdGlvbl9wcm90b3R5cGVfX3Byb3RvLmhvdXJzICAgICAgICAgID0gaG91cnM7XG4gICAgZHVyYXRpb25fcHJvdG90eXBlX19wcm90by5kYXlzICAgICAgICAgICA9IGRheXM7XG4gICAgZHVyYXRpb25fcHJvdG90eXBlX19wcm90by53ZWVrcyAgICAgICAgICA9IHdlZWtzO1xuICAgIGR1cmF0aW9uX3Byb3RvdHlwZV9fcHJvdG8ubW9udGhzICAgICAgICAgPSBtb250aHM7XG4gICAgZHVyYXRpb25fcHJvdG90eXBlX19wcm90by55ZWFycyAgICAgICAgICA9IHllYXJzO1xuICAgIGR1cmF0aW9uX3Byb3RvdHlwZV9fcHJvdG8uaHVtYW5pemUgICAgICAgPSBodW1hbml6ZTtcbiAgICBkdXJhdGlvbl9wcm90b3R5cGVfX3Byb3RvLnRvSVNPU3RyaW5nICAgID0gaXNvX3N0cmluZ19fdG9JU09TdHJpbmc7XG4gICAgZHVyYXRpb25fcHJvdG90eXBlX19wcm90by50b1N0cmluZyAgICAgICA9IGlzb19zdHJpbmdfX3RvSVNPU3RyaW5nO1xuICAgIGR1cmF0aW9uX3Byb3RvdHlwZV9fcHJvdG8udG9KU09OICAgICAgICAgPSBpc29fc3RyaW5nX190b0lTT1N0cmluZztcbiAgICBkdXJhdGlvbl9wcm90b3R5cGVfX3Byb3RvLmxvY2FsZSAgICAgICAgID0gbG9jYWxlO1xuICAgIGR1cmF0aW9uX3Byb3RvdHlwZV9fcHJvdG8ubG9jYWxlRGF0YSAgICAgPSBsb2NhbGVEYXRhO1xuXG4gICAgLy8gRGVwcmVjYXRpb25zXG4gICAgZHVyYXRpb25fcHJvdG90eXBlX19wcm90by50b0lzb1N0cmluZyA9IGRlcHJlY2F0ZSgndG9Jc29TdHJpbmcoKSBpcyBkZXByZWNhdGVkLiBQbGVhc2UgdXNlIHRvSVNPU3RyaW5nKCkgaW5zdGVhZCAobm90aWNlIHRoZSBjYXBpdGFscyknLCBpc29fc3RyaW5nX190b0lTT1N0cmluZyk7XG4gICAgZHVyYXRpb25fcHJvdG90eXBlX19wcm90by5sYW5nID0gbGFuZztcblxuICAgIC8vIFNpZGUgZWZmZWN0IGltcG9ydHNcblxuICAgIC8vIEZPUk1BVFRJTkdcblxuICAgIGFkZEZvcm1hdFRva2VuKCdYJywgMCwgMCwgJ3VuaXgnKTtcbiAgICBhZGRGb3JtYXRUb2tlbigneCcsIDAsIDAsICd2YWx1ZU9mJyk7XG5cbiAgICAvLyBQQVJTSU5HXG5cbiAgICBhZGRSZWdleFRva2VuKCd4JywgbWF0Y2hTaWduZWQpO1xuICAgIGFkZFJlZ2V4VG9rZW4oJ1gnLCBtYXRjaFRpbWVzdGFtcCk7XG4gICAgYWRkUGFyc2VUb2tlbignWCcsIGZ1bmN0aW9uIChpbnB1dCwgYXJyYXksIGNvbmZpZykge1xuICAgICAgICBjb25maWcuX2QgPSBuZXcgRGF0ZShwYXJzZUZsb2F0KGlucHV0LCAxMCkgKiAxMDAwKTtcbiAgICB9KTtcbiAgICBhZGRQYXJzZVRva2VuKCd4JywgZnVuY3Rpb24gKGlucHV0LCBhcnJheSwgY29uZmlnKSB7XG4gICAgICAgIGNvbmZpZy5fZCA9IG5ldyBEYXRlKHRvSW50KGlucHV0KSk7XG4gICAgfSk7XG5cbiAgICAvLyBTaWRlIGVmZmVjdCBpbXBvcnRzXG5cblxuICAgIHV0aWxzX2hvb2tzX19ob29rcy52ZXJzaW9uID0gJzIuMTQuMSc7XG5cbiAgICBzZXRIb29rQ2FsbGJhY2sobG9jYWxfX2NyZWF0ZUxvY2FsKTtcblxuICAgIHV0aWxzX2hvb2tzX19ob29rcy5mbiAgICAgICAgICAgICAgICAgICAgPSBtb21lbnRQcm90b3R5cGU7XG4gICAgdXRpbHNfaG9va3NfX2hvb2tzLm1pbiAgICAgICAgICAgICAgICAgICA9IG1pbjtcbiAgICB1dGlsc19ob29rc19faG9va3MubWF4ICAgICAgICAgICAgICAgICAgID0gbWF4O1xuICAgIHV0aWxzX2hvb2tzX19ob29rcy5ub3cgICAgICAgICAgICAgICAgICAgPSBub3c7XG4gICAgdXRpbHNfaG9va3NfX2hvb2tzLnV0YyAgICAgICAgICAgICAgICAgICA9IGNyZWF0ZV91dGNfX2NyZWF0ZVVUQztcbiAgICB1dGlsc19ob29rc19faG9va3MudW5peCAgICAgICAgICAgICAgICAgID0gbW9tZW50X19jcmVhdGVVbml4O1xuICAgIHV0aWxzX2hvb2tzX19ob29rcy5tb250aHMgICAgICAgICAgICAgICAgPSBsaXN0c19fbGlzdE1vbnRocztcbiAgICB1dGlsc19ob29rc19faG9va3MuaXNEYXRlICAgICAgICAgICAgICAgID0gaXNEYXRlO1xuICAgIHV0aWxzX2hvb2tzX19ob29rcy5sb2NhbGUgICAgICAgICAgICAgICAgPSBsb2NhbGVfbG9jYWxlc19fZ2V0U2V0R2xvYmFsTG9jYWxlO1xuICAgIHV0aWxzX2hvb2tzX19ob29rcy5pbnZhbGlkICAgICAgICAgICAgICAgPSB2YWxpZF9fY3JlYXRlSW52YWxpZDtcbiAgICB1dGlsc19ob29rc19faG9va3MuZHVyYXRpb24gICAgICAgICAgICAgID0gY3JlYXRlX19jcmVhdGVEdXJhdGlvbjtcbiAgICB1dGlsc19ob29rc19faG9va3MuaXNNb21lbnQgICAgICAgICAgICAgID0gaXNNb21lbnQ7XG4gICAgdXRpbHNfaG9va3NfX2hvb2tzLndlZWtkYXlzICAgICAgICAgICAgICA9IGxpc3RzX19saXN0V2Vla2RheXM7XG4gICAgdXRpbHNfaG9va3NfX2hvb2tzLnBhcnNlWm9uZSAgICAgICAgICAgICA9IG1vbWVudF9fY3JlYXRlSW5ab25lO1xuICAgIHV0aWxzX2hvb2tzX19ob29rcy5sb2NhbGVEYXRhICAgICAgICAgICAgPSBsb2NhbGVfbG9jYWxlc19fZ2V0TG9jYWxlO1xuICAgIHV0aWxzX2hvb2tzX19ob29rcy5pc0R1cmF0aW9uICAgICAgICAgICAgPSBpc0R1cmF0aW9uO1xuICAgIHV0aWxzX2hvb2tzX19ob29rcy5tb250aHNTaG9ydCAgICAgICAgICAgPSBsaXN0c19fbGlzdE1vbnRoc1Nob3J0O1xuICAgIHV0aWxzX2hvb2tzX19ob29rcy53ZWVrZGF5c01pbiAgICAgICAgICAgPSBsaXN0c19fbGlzdFdlZWtkYXlzTWluO1xuICAgIHV0aWxzX2hvb2tzX19ob29rcy5kZWZpbmVMb2NhbGUgICAgICAgICAgPSBkZWZpbmVMb2NhbGU7XG4gICAgdXRpbHNfaG9va3NfX2hvb2tzLnVwZGF0ZUxvY2FsZSAgICAgICAgICA9IHVwZGF0ZUxvY2FsZTtcbiAgICB1dGlsc19ob29rc19faG9va3MubG9jYWxlcyAgICAgICAgICAgICAgID0gbG9jYWxlX2xvY2FsZXNfX2xpc3RMb2NhbGVzO1xuICAgIHV0aWxzX2hvb2tzX19ob29rcy53ZWVrZGF5c1Nob3J0ICAgICAgICAgPSBsaXN0c19fbGlzdFdlZWtkYXlzU2hvcnQ7XG4gICAgdXRpbHNfaG9va3NfX2hvb2tzLm5vcm1hbGl6ZVVuaXRzICAgICAgICA9IG5vcm1hbGl6ZVVuaXRzO1xuICAgIHV0aWxzX2hvb2tzX19ob29rcy5yZWxhdGl2ZVRpbWVSb3VuZGluZyA9IGR1cmF0aW9uX2h1bWFuaXplX19nZXRTZXRSZWxhdGl2ZVRpbWVSb3VuZGluZztcbiAgICB1dGlsc19ob29rc19faG9va3MucmVsYXRpdmVUaW1lVGhyZXNob2xkID0gZHVyYXRpb25faHVtYW5pemVfX2dldFNldFJlbGF0aXZlVGltZVRocmVzaG9sZDtcbiAgICB1dGlsc19ob29rc19faG9va3MuY2FsZW5kYXJGb3JtYXQgICAgICAgID0gZ2V0Q2FsZW5kYXJGb3JtYXQ7XG4gICAgdXRpbHNfaG9va3NfX2hvb2tzLnByb3RvdHlwZSAgICAgICAgICAgICA9IG1vbWVudFByb3RvdHlwZTtcblxuICAgIHZhciBfbW9tZW50ID0gdXRpbHNfaG9va3NfX2hvb2tzO1xuXG4gICAgcmV0dXJuIF9tb21lbnQ7XG5cbn0pKTsiLCJcclxudmFyIHByZWRpY2F0ZXMgPSB7fTtcclxubW9kdWxlLmV4cG9ydHMgPSBwcmVkaWNhdGVzO1xyXG5cclxuZnVuY3Rpb24gZ2V0VmFsdWUgKG9iaiwgaW5kZXgpIHtcclxuICAgIGlmIChpbmRleCA9PSBudWxsIHx8IGluZGV4ID09IHVuZGVmaW5lZCkgcmV0dXJuIG9iajtcclxuXHJcbiAgICBlbHNlIGlmIChvYmogJiYgb2JqLmNvbnN0cnVjdG9yID09PSBBcnJheSkge1xyXG4gICAgICAgIGlmIChvYmoubGVuZ3RoID4gaW5kZXggJiYgaW5kZXggPiAtMSlcclxuICAgICAgICAgICAgcmV0dXJuIG9ialtpbmRleF07XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgIH0gZWxzZSBcclxuICAgICAgICByZXR1cm4gb2JqO1xyXG59XHJcblxyXG5mdW5jdGlvbiBnZXRDcml0ZXJpYURhdGEoY3JpdGVyaWEpIHtcclxuICAgIHZhciBvID0gJz0nO1xyXG4gICAgdmFyIHYgPSBjcml0ZXJpYTtcclxuXHJcbiAgICBpZiAodHlwZW9mKGMpID09PSAnc3RyaW5nJykge1xyXG4gICAgICAgIGlmIChjcml0ZXJpYS5zdGFydHNXaXRoKCc+PScpKSB7XHJcbiAgICAgICAgICAgIG8gPSAnPj0nO1xyXG4gICAgICAgICAgICB2ID0gY3JpdGVyaWEuc3Vic3RyaW5nKDIpO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoY3JpdGVyaWEuc3RhcnRzV2l0aCgnPD0nKSkge1xyXG4gICAgICAgICAgICBvID0gJzw9JztcclxuICAgICAgICAgICAgdiA9IGNyaXRlcmlhLnN1YnN0cmluZygyKTtcclxuICAgICAgICB9IGVsc2UgaWYgKGNyaXRlcmlhLnN0YXJ0c1dpdGgoJzw+JykpIHtcclxuICAgICAgICAgICAgbyA9ICc8Pic7XHJcbiAgICAgICAgICAgIHYgPSBjcml0ZXJpYS5zdWJzdHJpbmcoMik7XHJcbiAgICAgICAgfSBlbHNlIGlmIChjcml0ZXJpYS5zdGFydHNXaXRoKCc+JykpIHtcclxuICAgICAgICAgICAgbyA9ICc+JztcclxuICAgICAgICAgICAgdiA9IGNyaXRlcmlhLnN1YnN0cmluZygxKTtcclxuICAgICAgICB9IGVsc2UgaWYgKGNyaXRlcmlhLnN0YXJ0c1dpdGgoJzwnKSkge1xyXG4gICAgICAgICAgICBvID0gJzwnO1xyXG4gICAgICAgICAgICB2ID0gY3JpdGVyaWEuc3Vic3RyaW5nKDEpO1xyXG4gICAgICAgIH0gIGVsc2UgaWYgKGNyaXRlcmlhLnN0YXJ0c1dpdGgoJz0nKSkge1xyXG4gICAgICAgICAgICB2ID0gY3JpdGVyaWEuc3Vic3RyaW5nKDEpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gW28sdl07XHJcbn1cclxuXHJcbmZ1bmN0aW9uIENyaXRlcmlhIChjcml0ZXJpYSkge1xyXG5cclxuICAgIGlmIChjcml0ZXJpYSAmJiBjcml0ZXJpYS5jb25zdHJ1Y3RvciA9PT0gQXJyYXkpIHtcclxuICAgICAgICB0aGlzLm9wZXJhdGlvbiA9IFtdO1xyXG4gICAgICAgIHRoaXMudmFsdWUgPSBbXTtcclxuICAgICAgICBcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNyaXRlcmlhLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIHZhciBkID0gZ2V0Q3JpdGVyaWFEYXRhKGNyaXRlcmlhW2ldKTtcclxuICAgICAgICAgICAgdGhpcy5vcGVyYXRpb24ucHVzaChkWzBdKTtcclxuICAgICAgICAgICAgdGhpcy52YWx1ZS5wdXNoKGRbMV0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHZhciBkID0gZ2V0Q3JpdGVyaWFEYXRhKGNyaXRlcmlhKTtcclxuICAgICAgICB0aGlzLm9wZXJhdGlvbiA9IGRbMF07XHJcbiAgICAgICAgdGhpcy52YWx1ZSA9IGRbMV07XHJcbiAgICB9XHJcbiAgICBcclxufVxyXG5cclxuQ3JpdGVyaWEucHJvdG90eXBlLmNoZWNrID0gZnVuY3Rpb24gKHZhbHVlLCByb3cpIHtcclxuXHJcbiAgICB2YXIgdmFsID0gZ2V0VmFsdWUodGhpcy52YWx1ZSwgcm93KTtcclxuICAgIHZhciBvcCA9IGdldFZhbHVlKHRoaXMub3BlcmF0aW9uLCByb3cpO1xyXG5cclxuICAgIGlmIChvcCA9PSAnPScpIFxyXG4gICAgICAgIHJldHVybiB2YWwgPT0gdmFsdWUgfHwgKHR5cGVvZih2YWwpID09PSAnYm9vbGVhbicgJiYgdHlwZW9mKHZhbHVlKSAhPT0gJ2Jvb2xlYW4nKTtcclxuICAgIGVsc2UgaWYgKG9wID09ICc8PicpXHJcbiAgICAgICAgcmV0dXJuIHZhbCAhPT0gdmFsdWU7XHJcbiAgICBlbHNlIGlmIChvcCA9PSAnPCcpXHJcbiAgICAgICAgcmV0dXJuIHZhbCA8IHZhbHVlO1xyXG4gICAgZWxzZSBpZiAob3AgPT0gJz4nKVxyXG4gICAgICAgIHJldHVybiB2YWwgPiB2YWx1ZTtcclxuICAgIGVsc2UgaWYgKG9wID09ICc+PScpXHJcbiAgICAgICAgcmV0dXJuIHZhbCA+PSB2YWx1ZTtcclxuICAgIGVsc2UgaWYgKG9wID09ICc8PScpXHJcbiAgICAgICAgcmV0dXJuIHZhbCA8PSB2YWx1ZTtcclxuICAgIFxyXG59XHJcblxyXG5wcmVkaWNhdGVzLkNyaXRlcmlhID0gQ3JpdGVyaWE7XHJcblxyXG5wcmVkaWNhdGVzLmNoZWNrQ3JpdGVyaWEgPSBmdW5jdGlvbiAoY3JpdGVyaWEpIHtcclxuICAgIHZhciBjcml0ZXJpYSA9IG5ldyBDcml0ZXJpYShjcml0ZXJpYSk7XHJcbiAgICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlLCByb3cpIHtcclxuICAgICAgICByZXR1cm4gY3JpdGVyaWEuY2hlY2sodmFsdWUsIHJvdylcclxuICAgIH1cclxufSIsIi8qIHBhcnNlciBnZW5lcmF0ZWQgYnkgamlzb24gMC40LjE3ICovXG4vKlxuICBSZXR1cm5zIGEgUGFyc2VyIG9iamVjdCBvZiB0aGUgZm9sbG93aW5nIHN0cnVjdHVyZTpcblxuICBQYXJzZXI6IHtcbiAgICB5eToge31cbiAgfVxuXG4gIFBhcnNlci5wcm90b3R5cGU6IHtcbiAgICB5eToge30sXG4gICAgdHJhY2U6IGZ1bmN0aW9uKCksXG4gICAgc3ltYm9sc186IHthc3NvY2lhdGl2ZSBsaXN0OiBuYW1lID09PiBudW1iZXJ9LFxuICAgIHRlcm1pbmFsc186IHthc3NvY2lhdGl2ZSBsaXN0OiBudW1iZXIgPT0+IG5hbWV9LFxuICAgIHByb2R1Y3Rpb25zXzogWy4uLl0sXG4gICAgcGVyZm9ybUFjdGlvbjogZnVuY3Rpb24gYW5vbnltb3VzKHl5dGV4dCwgeXlsZW5nLCB5eWxpbmVubywgeXksIHl5c3RhdGUsICQkLCBfJCksXG4gICAgdGFibGU6IFsuLi5dLFxuICAgIGRlZmF1bHRBY3Rpb25zOiB7Li4ufSxcbiAgICBwYXJzZUVycm9yOiBmdW5jdGlvbihzdHIsIGhhc2gpLFxuICAgIHBhcnNlOiBmdW5jdGlvbihpbnB1dCksXG5cbiAgICBsZXhlcjoge1xuICAgICAgICBFT0Y6IDEsXG4gICAgICAgIHBhcnNlRXJyb3I6IGZ1bmN0aW9uKHN0ciwgaGFzaCksXG4gICAgICAgIHNldElucHV0OiBmdW5jdGlvbihpbnB1dCksXG4gICAgICAgIGlucHV0OiBmdW5jdGlvbigpLFxuICAgICAgICB1bnB1dDogZnVuY3Rpb24oc3RyKSxcbiAgICAgICAgbW9yZTogZnVuY3Rpb24oKSxcbiAgICAgICAgbGVzczogZnVuY3Rpb24obiksXG4gICAgICAgIHBhc3RJbnB1dDogZnVuY3Rpb24oKSxcbiAgICAgICAgdXBjb21pbmdJbnB1dDogZnVuY3Rpb24oKSxcbiAgICAgICAgc2hvd1Bvc2l0aW9uOiBmdW5jdGlvbigpLFxuICAgICAgICB0ZXN0X21hdGNoOiBmdW5jdGlvbihyZWdleF9tYXRjaF9hcnJheSwgcnVsZV9pbmRleCksXG4gICAgICAgIG5leHQ6IGZ1bmN0aW9uKCksXG4gICAgICAgIGxleDogZnVuY3Rpb24oKSxcbiAgICAgICAgYmVnaW46IGZ1bmN0aW9uKGNvbmRpdGlvbiksXG4gICAgICAgIHBvcFN0YXRlOiBmdW5jdGlvbigpLFxuICAgICAgICBfY3VycmVudFJ1bGVzOiBmdW5jdGlvbigpLFxuICAgICAgICB0b3BTdGF0ZTogZnVuY3Rpb24oKSxcbiAgICAgICAgcHVzaFN0YXRlOiBmdW5jdGlvbihjb25kaXRpb24pLFxuXG4gICAgICAgIG9wdGlvbnM6IHtcbiAgICAgICAgICAgIHJhbmdlczogYm9vbGVhbiAgICAgICAgICAgKG9wdGlvbmFsOiB0cnVlID09PiB0b2tlbiBsb2NhdGlvbiBpbmZvIHdpbGwgaW5jbHVkZSBhIC5yYW5nZVtdIG1lbWJlcilcbiAgICAgICAgICAgIGZsZXg6IGJvb2xlYW4gICAgICAgICAgICAgKG9wdGlvbmFsOiB0cnVlID09PiBmbGV4LWxpa2UgbGV4aW5nIGJlaGF2aW91ciB3aGVyZSB0aGUgcnVsZXMgYXJlIHRlc3RlZCBleGhhdXN0aXZlbHkgdG8gZmluZCB0aGUgbG9uZ2VzdCBtYXRjaClcbiAgICAgICAgICAgIGJhY2t0cmFja19sZXhlcjogYm9vbGVhbiAgKG9wdGlvbmFsOiB0cnVlID09PiBsZXhlciByZWdleGVzIGFyZSB0ZXN0ZWQgaW4gb3JkZXIgYW5kIGZvciBlYWNoIG1hdGNoaW5nIHJlZ2V4IHRoZSBhY3Rpb24gY29kZSBpcyBpbnZva2VkOyB0aGUgbGV4ZXIgdGVybWluYXRlcyB0aGUgc2NhbiB3aGVuIGEgdG9rZW4gaXMgcmV0dXJuZWQgYnkgdGhlIGFjdGlvbiBjb2RlKVxuICAgICAgICB9LFxuXG4gICAgICAgIHBlcmZvcm1BY3Rpb246IGZ1bmN0aW9uKHl5LCB5eV8sICRhdm9pZGluZ19uYW1lX2NvbGxpc2lvbnMsIFlZX1NUQVJUKSxcbiAgICAgICAgcnVsZXM6IFsuLi5dLFxuICAgICAgICBjb25kaXRpb25zOiB7YXNzb2NpYXRpdmUgbGlzdDogbmFtZSA9PT4gc2V0fSxcbiAgICB9XG4gIH1cblxuXG4gIHRva2VuIGxvY2F0aW9uIGluZm8gKEAkLCBfJCwgZXRjLik6IHtcbiAgICBmaXJzdF9saW5lOiBuLFxuICAgIGxhc3RfbGluZTogbixcbiAgICBmaXJzdF9jb2x1bW46IG4sXG4gICAgbGFzdF9jb2x1bW46IG4sXG4gICAgcmFuZ2U6IFtzdGFydF9udW1iZXIsIGVuZF9udW1iZXJdICAgICAgICh3aGVyZSB0aGUgbnVtYmVycyBhcmUgaW5kZXhlcyBpbnRvIHRoZSBpbnB1dCBzdHJpbmcsIHJlZ3VsYXIgemVyby1iYXNlZClcbiAgfVxuXG5cbiAgdGhlIHBhcnNlRXJyb3IgZnVuY3Rpb24gcmVjZWl2ZXMgYSAnaGFzaCcgb2JqZWN0IHdpdGggdGhlc2UgbWVtYmVycyBmb3IgbGV4ZXIgYW5kIHBhcnNlciBlcnJvcnM6IHtcbiAgICB0ZXh0OiAgICAgICAgKG1hdGNoZWQgdGV4dClcbiAgICB0b2tlbjogICAgICAgKHRoZSBwcm9kdWNlZCB0ZXJtaW5hbCB0b2tlbiwgaWYgYW55KVxuICAgIGxpbmU6ICAgICAgICAoeXlsaW5lbm8pXG4gIH1cbiAgd2hpbGUgcGFyc2VyIChncmFtbWFyKSBlcnJvcnMgd2lsbCBhbHNvIHByb3ZpZGUgdGhlc2UgbWVtYmVycywgaS5lLiBwYXJzZXIgZXJyb3JzIGRlbGl2ZXIgYSBzdXBlcnNldCBvZiBhdHRyaWJ1dGVzOiB7XG4gICAgbG9jOiAgICAgICAgICh5eWxsb2MpXG4gICAgZXhwZWN0ZWQ6ICAgIChzdHJpbmcgZGVzY3JpYmluZyB0aGUgc2V0IG9mIGV4cGVjdGVkIHRva2VucylcbiAgICByZWNvdmVyYWJsZTogKGJvb2xlYW46IFRSVUUgd2hlbiB0aGUgcGFyc2VyIGhhcyBhIGVycm9yIHJlY292ZXJ5IHJ1bGUgYXZhaWxhYmxlIGZvciB0aGlzIHBhcnRpY3VsYXIgZXJyb3IpXG4gIH1cbiovXG52YXIgckxhbmcgPSAoZnVuY3Rpb24oKXtcbnZhciBvPWZ1bmN0aW9uKGssdixvLGwpe2ZvcihvPW98fHt9LGw9ay5sZW5ndGg7bC0tO29ba1tsXV09dik7cmV0dXJuIG99LCRWMD1bMSw5XSwkVjE9WzEsN10sJFYyPVsxLDhdLCRWMz1bMSwyNF0sJFY0PVsxLDIwXSwkVjU9WzEsMTNdLCRWNj1bMSwxNF0sJFY3PVsxLDE3XSwkVjg9WzEsMThdLCRWOT1bNSwxMywxNiw0OF0sJFZhPVsyLDEzXSwkVmI9WzEsMjldLCRWYz1bMSw0NF0sJFZkPVsxLDMzXSwkVmU9WzEsMzRdLCRWZj1bMSwzNV0sJFZnPVsxLDM2XSwkVmg9WzEsMzddLCRWaT1bMSwzOF0sJFZqPVsxLDM5XSwkVms9WzEsNDBdLCRWbD1bMSw0MV0sJFZtPVsxLDQyXSwkVm49WzEsNDNdLCRWbz1bMSw0NV0sJFZwPVs1LDYsMTEsMTgsMjEsMjIsMjMsMjQsMjUsMjYsMjcsMjgsMjksMzAsMzEsMzIsMzRdLCRWcT1bMSw1MV0sJFZyPVsxLDU2XSwkVnM9WzEsNTVdLCRWdD1bMSw1N10sJFZ1PVsxLDYyXSwkVnY9WzEsNjldLCRWdz1bMSw3MF0sJFZ4PVsxLDY4XSwkVnk9WzEsNzFdLCRWej1bNSw2LDExLDE4LDIzLDI0LDI1LDI3LDI4LDI5LDMwLDMxLDM0XSwkVkE9WzE4LDM0XSwkVkI9WzIsNDldLCRWQz1bMTEsNDJdLCRWRD1bMSw5NV0sJFZFPVsxMSwxOCw0Ml0sJFZGPVsxMSwxOF0sJFZHPVs0Nyw0OV0sJFZIPVsxLDExMl0sJFZJPVsyLDE0XSwkVko9WzUsNiwxMSwxOCwyMSwyMiwyMywyNCwyNSwyNywyOCwyOSwzMCwzMSwzNF0sJFZLPVs1LDYsMTEsMTgsMjcsMjgsMjksMzAsMzEsMzRdLCRWTD1bMSwxMTRdO1xudmFyIHBhcnNlciA9IHt0cmFjZTogZnVuY3Rpb24gdHJhY2UoKSB7IH0sXG55eToge30sXG5zeW1ib2xzXzoge1wiZXJyb3JcIjoyLFwicHJvZ3JhbVwiOjMsXCJhc3NpZ25MaXN0XCI6NCxcIkVPRlwiOjUsXCI9XCI6NixcImV4cHJlc3Npb25cIjo3LFwiYXNzaWduRXhwcmVzc2lvblwiOjgsXCJ0YWJsZVJhbmdlXCI6OSxcIntcIjoxMCxcIn1cIjoxMSxcIndpdGhcIjoxMixcIklERU5USUZJRVJcIjoxMyxcImFzXCI6MTQsXCJ2YXJpYWJsZVwiOjE1LFwiY29udGV4dFwiOjE2LFwidmFyaWFibGVEZWZMaXN0XCI6MTcsXCIsXCI6MTgsXCJ2YXJpYWJsZURlZlwiOjE5LFwiLlwiOjIwLFwiKlwiOjIxLFwiL1wiOjIyLFwiK1wiOjIzLFwiJlwiOjI0LFwiLVwiOjI1LFwiXlwiOjI2LFwiPlwiOjI3LFwiPFwiOjI4LFwiPj1cIjoyOSxcIjw9XCI6MzAsXCI8PlwiOjMxLFwiJVwiOjMyLFwiKFwiOjMzLFwiKVwiOjM0LFwiYXRvbUV4cHJlc3Npb25cIjozNSxcIk5VTUJFUlwiOjM2LFwiU1RSSU5HXCI6MzcsXCJyYW5nZVwiOjM4LFwiZm5QYXJhbXNcIjozOSxcImFycmF5RXhwcmVzc2lvblwiOjQwLFwiYXJyYXlMaXN0XCI6NDEsXCI7XCI6NDIsXCJhcnJheVJvd1wiOjQzLFwiYXJyYXlWYWx1ZVwiOjQ0LFwicmFuZ2VQYXJ0XCI6NDUsXCIhXCI6NDYsXCI6XCI6NDcsXCJbXCI6NDgsXCJdXCI6NDksXCJyb3dOdW1iZXJcIjo1MCxcIiNcIjo1MSxcIiRhY2NlcHRcIjowLFwiJGVuZFwiOjF9LFxudGVybWluYWxzXzogezI6XCJlcnJvclwiLDU6XCJFT0ZcIiw2OlwiPVwiLDEwOlwie1wiLDExOlwifVwiLDEyOlwid2l0aFwiLDEzOlwiSURFTlRJRklFUlwiLDE0OlwiYXNcIiwxNjpcImNvbnRleHRcIiwxODpcIixcIiwyMDpcIi5cIiwyMTpcIipcIiwyMjpcIi9cIiwyMzpcIitcIiwyNDpcIiZcIiwyNTpcIi1cIiwyNjpcIl5cIiwyNzpcIj5cIiwyODpcIjxcIiwyOTpcIj49XCIsMzA6XCI8PVwiLDMxOlwiPD5cIiwzMjpcIiVcIiwzMzpcIihcIiwzNDpcIilcIiwzNjpcIk5VTUJFUlwiLDM3OlwiU1RSSU5HXCIsNDI6XCI7XCIsNDY6XCIhXCIsNDc6XCI6XCIsNDg6XCJbXCIsNDk6XCJdXCIsNTE6XCIjXCJ9LFxucHJvZHVjdGlvbnNfOiBbMCxbMywyXSxbMywzXSxbNCwyXSxbNCwxXSxbOCw1XSxbOCw5XSxbOCw1XSxbOCw0XSxbMTcsM10sWzE3LDFdLFsxOSwxXSxbMTksM10sWzE1LDFdLFsxNSwzXSxbNywzXSxbNywzXSxbNywzXSxbNywzXSxbNywzXSxbNywzXSxbNywzXSxbNywzXSxbNywzXSxbNywzXSxbNywzXSxbNywzXSxbNywyXSxbNywyXSxbNywzXSxbNywxXSxbMzUsMV0sWzM1LDFdLFszNSwxXSxbMzUsMV0sWzM1LDRdLFszNSw2XSxbMzUsMV0sWzM1LDFdLFs0MCwzXSxbNDEsM10sWzQxLDFdLFs0MywzXSxbNDMsMV0sWzQ0LDFdLFs0NCwyXSxbNDQsMV0sWzM5LDNdLFszOSwxXSxbMzksMF0sWzM4LDFdLFszOCwzXSxbNDUsM10sWzksM10sWzksNF0sWzksNV0sWzksNl0sWzksNl0sWzksOF0sWzksNF0sWzksNl0sWzksN10sWzksOV0sWzksN10sWzksOV0sWzUwLDFdLFs1MCwyXSxbNTAsMl0sWzUwLDJdXSxcbnBlcmZvcm1BY3Rpb246IGZ1bmN0aW9uIGFub255bW91cyh5eXRleHQsIHl5bGVuZywgeXlsaW5lbm8sIHl5LCB5eXN0YXRlIC8qIGFjdGlvblsxXSAqLywgJCQgLyogdnN0YWNrICovLCBfJCAvKiBsc3RhY2sgKi8pIHtcbi8qIHRoaXMgPT0geXl2YWwgKi9cblxudmFyICQwID0gJCQubGVuZ3RoIC0gMTtcbnN3aXRjaCAoeXlzdGF0ZSkge1xuY2FzZSAxOlxuIHJldHVybiBleHAuQ3JlYXRlRnVuY3Rpb24oJCRbJDAtMV0pOyBcbmJyZWFrO1xuY2FzZSAyOlxuIHJldHVybiBleHAuQ3JlYXRlRnVuY3Rpb24oIG5ldyBleHAuUHJvZ3JhbShbbmV3IGV4cC5Bc3NpZ25FeHByZXNzaW9uKG5ldyBleHAuSWRlbnRpZmllckV4cHJlc3Npb24oXCJfUlwiKSwgJCRbJDAtMV0pXSkpOyBcbmJyZWFrO1xuY2FzZSAzOlxuIGlmICgkJFskMF0pICQkWyQwLTFdLkFkZEV4cHJlc3Npb24oJCRbJDBdKTsgdGhpcy4kID0gJCRbJDAtMV07IFxuYnJlYWs7XG5jYXNlIDQ6XG4gdGhpcy4kID0gbmV3IGV4cC5Qcm9ncmFtKFsgJCRbJDBdIF0pOyBcbmJyZWFrO1xuY2FzZSA1OiBjYXNlIDc6XG4gdGhpcy4kID0gbmV3IGV4cC5Bc3NpZ25FeHByZXNzaW9uKCQkWyQwLTRdLCAkJFskMC0xXSk7IFxuYnJlYWs7XG5jYXNlIDY6XG4gdGhpcy4kID0gbmV3IGV4cC5Bc3NpZ25FeHByZXNzaW9uKCQkWyQwLThdLCAkJFskMC01XSwgJCRbJDAtMl0sICQkWyQwXSk7IFxuYnJlYWs7XG5jYXNlIDg6XG4gdGhpcy4kID0gbmV3IGV4cC5WYXJpYWJsZURlZkxpc3RFeHByZXNzaW9uKCQkWyQwLTFdKTsgXG5icmVhaztcbmNhc2UgOTogY2FzZSA0NzpcbiAkJFskMC0yXS5wdXNoKCQkWyQwXSk7IHRoaXMuJCA9ICQkWyQwLTJdOyBcbmJyZWFrO1xuY2FzZSAxMDogY2FzZSA0MzpcbiB0aGlzLiQgPSBbICQkWyQwXSBdOyBcbmJyZWFrO1xuY2FzZSAxMTogY2FzZSAzMDogY2FzZSAzMTogY2FzZSAzNDogY2FzZSAzNzogY2FzZSA0MTpcbiB0aGlzLiQgPSAkJFskMF07IFxuYnJlYWs7XG5jYXNlIDEyOlxuIHRoaXMuJCA9ICQkWyQwLTJdICsgJy4nICsgJCRbJDBdIFxuYnJlYWs7XG5jYXNlIDEzOlxuIHRoaXMuJCA9IG5ldyBleHAuSWRlbnRpZmllckV4cHJlc3Npb24oJCRbJDBdKTsgXG5icmVhaztcbmNhc2UgMTQ6XG4gdGhpcy4kID0gbmV3IGV4cC5JZGVudGlmaWVyRXhwcmVzc2lvbigkJFskMC0yXSwgJCRbJDBdKTsgXG5icmVhaztcbmNhc2UgMTU6XG50aGlzLiQgPSBuZXcgZXhwLk9wZXJhdG9yRXhwcmVzc2lvbigkJFskMC0yXSwgJCRbJDBdLCAnKicpO1xuYnJlYWs7XG5jYXNlIDE2OlxudGhpcy4kID0gbmV3IGV4cC5PcGVyYXRvckV4cHJlc3Npb24oJCRbJDAtMl0sICQkWyQwXSwgJy8nKTtcbmJyZWFrO1xuY2FzZSAxNzogY2FzZSAxODpcbnRoaXMuJCA9IG5ldyBleHAuT3BlcmF0b3JFeHByZXNzaW9uKCQkWyQwLTJdLCAkJFskMF0sICcrJyk7XG5icmVhaztcbmNhc2UgMTk6XG50aGlzLiQgPSBuZXcgZXhwLk9wZXJhdG9yRXhwcmVzc2lvbigkJFskMC0yXSwgJCRbJDBdLCAnLScpO1xuYnJlYWs7XG5jYXNlIDIwOlxudGhpcy4kID0gbmV3IGV4cC5Qb3dFeHByZXNzaW9uKCQkWyQwLTJdLCAkJFskMF0pOyBcbmJyZWFrO1xuY2FzZSAyMTpcbnRoaXMuJCA9IG5ldyBleHAuT3BlcmF0b3JFeHByZXNzaW9uKCQkWyQwLTJdLCAkJFskMF0sICc+Jyk7XG5icmVhaztcbmNhc2UgMjI6XG50aGlzLiQgPSBuZXcgZXhwLk9wZXJhdG9yRXhwcmVzc2lvbigkJFskMC0yXSwgJCRbJDBdLCAnPCcpO1xuYnJlYWs7XG5jYXNlIDIzOlxudGhpcy4kID0gbmV3IGV4cC5PcGVyYXRvckV4cHJlc3Npb24oJCRbJDAtMl0sICQkWyQwXSwgJz49Jyk7XG5icmVhaztcbmNhc2UgMjQ6XG50aGlzLiQgPSBuZXcgZXhwLk9wZXJhdG9yRXhwcmVzc2lvbigkJFskMC0yXSwgJCRbJDBdLCAnPD0nKTtcbmJyZWFrO1xuY2FzZSAyNTpcbnRoaXMuJCA9IG5ldyBleHAuT3BlcmF0b3JFeHByZXNzaW9uKCQkWyQwLTJdLCAkJFskMF0sICchPScpO1xuYnJlYWs7XG5jYXNlIDI2OlxudGhpcy4kID0gbmV3IGV4cC5PcGVyYXRvckV4cHJlc3Npb24oJCRbJDAtMl0sICQkWyQwXSwgJz09Jyk7XG5icmVhaztcbmNhc2UgMjc6XG50aGlzLiQgPSBuZXcgZXhwLk5lZ2F0aXZlRXhwcmVzc2lvbigkJFskMF0pO1xuYnJlYWs7XG5jYXNlIDI4OlxudGhpcy4kID0gbmV3IGV4cC5QZXJjZW50RXhwcmVzc2lvbigkJFskMC0xXSk7XG5icmVhaztcbmNhc2UgMjk6XG50aGlzLiQgPSBuZXcgZXhwLlBhcmVudGlzaXNFeHByZXNzaW9uKCQkWyQwLTFdKTtcbmJyZWFrO1xuY2FzZSAzMjpcbiB0aGlzLiQgPSBuZXcgZXhwLk51bWJlckV4cHJlc3Npb24oeXl0ZXh0KTsgXG5icmVhaztcbmNhc2UgMzM6XG4gdGhpcy4kID0gbmV3IGV4cC5TdHJpbmdFeHByZXNzaW9uKHl5dGV4dCk7IFxuYnJlYWs7XG5jYXNlIDM1OlxudGhpcy4kID0gbmV3IGV4cC5GdW5jdGlvbkNhbGxFeHByZXNzaW9uKCQkWyQwLTNdLCAkJFskMC0xXSk7XG5icmVhaztcbmNhc2UgMzY6XG50aGlzLiQgPSBuZXcgZXhwLkZ1bmN0aW9uQ2FsbEV4cHJlc3Npb24oJCRbJDAtNV0gKyAnXycgKyAkJFskMC0zXSwgJCRbJDAtMV0pO1xuYnJlYWs7XG5jYXNlIDM4OlxuIFxyXG4gICAgICB0aGlzLiQgPSAkJFskMF07XHJcbiAgICAgIC8qdmFyIHNpZ25hdHVyZSA9ICQkWyQwXS5nZXRTaWduYXR1cmUoKVswXTtcclxuICAgICAgaWYgKHNpZ25hdHVyZS5pbmRleE9mKCcuJykgPiAwKSB7XHJcbiAgICAgICAgc2lnbmF0dXJlID0gc2lnbmF0dXJlLnNwbGl0KCcuJylbMF07XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmICh2YXJpYWJsZXMuaW5kZXhPZihzaWduYXR1cmUpID49IDApIHsgXHJcbiAgICAgICAgdGhpcy4kID0gJCRbJDBdOyBcclxuICAgICAgfSBlbHNlIHsgXHJcbiAgICAgICAgdGhpcy4kID0gJCRbJDBdLnRvVGFibGVFeHByZXNzaW9uKCk7XHJcbiAgICAgICAgLy9jb25zb2xlLmxvZygkJFskMF0uZ2V0U2lnbmF0dXJlKCkpO1xyXG4gICAgICB9Ki8gXHJcbiAgXG5icmVhaztcbmNhc2UgMzk6XG4gdGhpcy4kID0gbmV3IGV4cC5BcnJheUV4cHJlc3Npb24oJCRbJDAtMV0pOyBcbmJyZWFrO1xuY2FzZSA0MDpcbiB0aGlzLiQgPSAoJCRbJDAtMl0ucm93KSA/IFskJFskMC0yXV0gOiAkJFskMC0yXTsgdGhpcy4kLnB1c2goJCRbJDBdKTsgdGhpcy4kLm1kUmFuZ2UgPSB0cnVlOyBcbmJyZWFrO1xuY2FzZSA0MjpcbiAkJFskMC0yXS5wdXNoKCQkWyQwXSk7ICQkWyQwLTJdLnJvdyA9IHRydWU7IHRoaXMuJCA9ICQkWyQwLTJdOyBcbmJyZWFrO1xuY2FzZSA0NDpcbiB0aGlzLiQgPSBOdW1iZXIoeXl0ZXh0KTsgXG5icmVhaztcbmNhc2UgNDU6XG4gdGhpcy4kID0gTnVtYmVyKHl5dGV4dCkgKiAtMTsgXG5icmVhaztcbmNhc2UgNDY6XG4gdGhpcy4kID0geXl0ZXh0OyBcbmJyZWFrO1xuY2FzZSA0ODpcbiB0aGlzLiQgPSBbICQkWyQwXSBdO1xuYnJlYWs7XG5jYXNlIDQ5OlxuIHRoaXMuJCA9IFtdOyBcbmJyZWFrO1xuY2FzZSA1MDpcbiB0aGlzLiQgPSAkJFskMF0gXG5icmVhaztcbmNhc2UgNTE6XG4gJCRbJDBdLnRhYmxlID0gJCRbJDAtMl07IHRoaXMuJCA9ICQkWyQwXTsgXG5icmVhaztcbmNhc2UgNTI6XG4gdGhpcy4kID0gbmV3IGV4cC5SYW5nZUV4cHJlc3Npb24obnVsbCwgJCRbJDAtMl0sICQkWyQwXSwgMCwgTnVtYmVyLk1BWF9WQUxVRSk7IFxuYnJlYWs7XG5jYXNlIDUzOlxuIHRoaXMuJCA9IG5ldyBleHAuQ29sdW1uRXhwcmVzc2lvbihcInRhYmxlXCIsICQkWyQwLTFdKTsgXG5icmVhaztcbmNhc2UgNTQ6XG4gdGhpcy4kID0gbmV3IGV4cC5Db2x1bW5FeHByZXNzaW9uKCQkWyQwLTNdLCAkJFskMC0xXSk7IFxuYnJlYWs7XG5jYXNlIDU1OlxuIHRoaXMuJCA9IG5ldyBleHAuQ29sdW1uRXhwcmVzc2lvbihcInRhYmxlXCIsICQkWyQwLTFdLCAkJFskMC0zXSkgXG5icmVhaztcbmNhc2UgNTY6XG4gdGhpcy4kID0gbmV3IGV4cC5Db2x1bW5FeHByZXNzaW9uKCQkWyQwLTVdLCAkJFskMC0xXSwgJCRbJDAtM10pOyBcbmJyZWFrO1xuY2FzZSA1NzpcbiB0aGlzLiQgPSBuZXcgZXhwLkNlbGxFeHByZXNzaW9uKG51bGwsICQkWyQwLTRdLCAkJFskMC0yXSk7IFxuYnJlYWs7XG5jYXNlIDU4OlxuIHRoaXMuJCA9IG5ldyBleHAuUmFuZ2VFeHByZXNzaW9uKG51bGwsICQkWyQwLTZdLCAkJFskMC02XSwgJCRbJDAtNF0sICQkWyQwLTJdKTsgXG5icmVhaztcbmNhc2UgNTk6XG4gdGhpcy4kID0gbmV3IGV4cC5DZWxsRXhwcmVzc2lvbihudWxsLCAkJFskMC0zXSwgJCRbJDAtMV0pOyBcbmJyZWFrO1xuY2FzZSA2MDpcbiB0aGlzLiQgPSBuZXcgZXhwLlJhbmdlRXhwcmVzc2lvbihudWxsLCAkJFskMC01XSwgJCRbJDAtNV0sICQkWyQwLTNdLCAkJFskMC0xXSk7IFxuYnJlYWs7XG5jYXNlIDYxOiBjYXNlIDYzOlxuIHRoaXMuJCA9IG5ldyBleHAuQ2VsbEV4cHJlc3Npb24oJCRbJDAtNl0sICQkWyQwLTRdLCAkJFskMC0yXSk7IFxuYnJlYWs7XG5jYXNlIDYyOiBjYXNlIDY0OlxuIHRoaXMuJCA9IG5ldyBleHAuUmFuZ2VFeHByZXNzaW9uKCQkWyQwLThdLCAkJFskMC02XSwgJCRbJDAtNl0sICQkWyQwLTRdLCAkJFskMC0yXSk7IFxuYnJlYWs7XG5jYXNlIDY1OlxuIHRoaXMuJCA9IG5ldyBleHAuUm93TnVtYmVyKCQkWyQwXSwgJysnKTsgXG5icmVhaztcbmNhc2UgNjY6IGNhc2UgNjc6XG4gdGhpcy4kID0gbmV3IGV4cC5Sb3dOdW1iZXIoJCRbJDBdLCAkJFskMC0xXSk7IFxuYnJlYWs7XG5jYXNlIDY4OlxuIHRoaXMuJCA9IG5ldyBleHAuUm93TnVtYmVyKCQkWyQwXSwgJyQnKTsgXG5icmVhaztcbn1cbn0sXG50YWJsZTogW3szOjEsNDoyLDY6WzEsM10sODo0LDk6NSwxMzokVjAsMTU6NiwxNjokVjEsNDg6JFYyfSx7MTpbM119LHs1OlsxLDEwXSw4OjExLDk6NSwxMzokVjAsMTU6NiwxNjokVjEsNDg6JFYyfSx7NzoxMiw5OjE2LDEwOiRWMywxMzokVjQsMTU6MjIsMjU6JFY1LDMzOiRWNiwzNToxNSwzNjokVjcsMzc6JFY4LDM4OjE5LDQwOjIxLDQ1OjIzLDQ4OiRWMn0sbygkVjksWzIsNF0pLHs2OlsxLDI1XX0sezY6WzEsMjZdfSx7MTA6WzEsMjddfSx7MTM6WzEsMjhdfSx7NjokVmEsMjA6WzEsMzFdLDQ2OlsxLDMwXSw0ODokVmJ9LHsxOlsyLDFdfSxvKCRWOSxbMiwzXSksezU6WzEsMzJdLDY6JFZjLDIxOiRWZCwyMjokVmUsMjM6JFZmLDI0OiRWZywyNTokVmgsMjY6JFZpLDI3OiRWaiwyODokVmssMjk6JFZsLDMwOiRWbSwzMTokVm4sMzI6JFZvfSx7Nzo0Niw5OjE2LDEwOiRWMywxMzokVjQsMTU6MjIsMjU6JFY1LDMzOiRWNiwzNToxNSwzNjokVjcsMzc6JFY4LDM4OjE5LDQwOjIxLDQ1OjIzLDQ4OiRWMn0sezc6NDcsOToxNiwxMDokVjMsMTM6JFY0LDE1OjIyLDI1OiRWNSwzMzokVjYsMzU6MTUsMzY6JFY3LDM3OiRWOCwzODoxOSw0MDoyMSw0NToyMyw0ODokVjJ9LG8oJFZwLFsyLDMwXSksbygkVnAsWzIsMzFdKSxvKCRWcCxbMiwzMl0pLG8oJFZwLFsyLDMzXSksbygkVnAsWzIsMzRdKSxvKCRWcCwkVmEsezIwOlsxLDQ5XSwzMzpbMSw0OF0sNDY6WzEsNTBdLDQ3OiRWcSw0ODokVmJ9KSxvKCRWcCxbMiwzN10pLG8oJFZwLFsyLDM4XSksbygkVnAsWzIsNTBdKSx7MjU6JFZyLDM2OiRWcywzNzokVnQsNDE6NTIsNDM6NTMsNDQ6NTR9LHsxMDpbMSw1OF19LHsxMDpbMSw1OV19LHsxMzokVnUsMTc6NjAsMTk6NjF9LHsyMDpbMSw2NF0sNDg6WzEsNjVdLDQ5OlsxLDYzXX0sezEzOlsxLDY2XSwyMzokVnYsMjU6JFZ3LDM2OiRWeCw1MDo2Nyw1MTokVnl9LHsxMzpbMSw3Ml19LHsxMzpbMSw3M119LHsxOlsyLDJdfSx7Nzo3NCw5OjE2LDEwOiRWMywxMzokVjQsMTU6MjIsMjU6JFY1LDMzOiRWNiwzNToxNSwzNjokVjcsMzc6JFY4LDM4OjE5LDQwOjIxLDQ1OjIzLDQ4OiRWMn0sezc6NzUsOToxNiwxMDokVjMsMTM6JFY0LDE1OjIyLDI1OiRWNSwzMzokVjYsMzU6MTUsMzY6JFY3LDM3OiRWOCwzODoxOSw0MDoyMSw0NToyMyw0ODokVjJ9LHs3Ojc2LDk6MTYsMTA6JFYzLDEzOiRWNCwxNToyMiwyNTokVjUsMzM6JFY2LDM1OjE1LDM2OiRWNywzNzokVjgsMzg6MTksNDA6MjEsNDU6MjMsNDg6JFYyfSx7Nzo3Nyw5OjE2LDEwOiRWMywxMzokVjQsMTU6MjIsMjU6JFY1LDMzOiRWNiwzNToxNSwzNjokVjcsMzc6JFY4LDM4OjE5LDQwOjIxLDQ1OjIzLDQ4OiRWMn0sezc6NzgsOToxNiwxMDokVjMsMTM6JFY0LDE1OjIyLDI1OiRWNSwzMzokVjYsMzU6MTUsMzY6JFY3LDM3OiRWOCwzODoxOSw0MDoyMSw0NToyMyw0ODokVjJ9LHs3Ojc5LDk6MTYsMTA6JFYzLDEzOiRWNCwxNToyMiwyNTokVjUsMzM6JFY2LDM1OjE1LDM2OiRWNywzNzokVjgsMzg6MTksNDA6MjEsNDU6MjMsNDg6JFYyfSx7Nzo4MCw5OjE2LDEwOiRWMywxMzokVjQsMTU6MjIsMjU6JFY1LDMzOiRWNiwzNToxNSwzNjokVjcsMzc6JFY4LDM4OjE5LDQwOjIxLDQ1OjIzLDQ4OiRWMn0sezc6ODEsOToxNiwxMDokVjMsMTM6JFY0LDE1OjIyLDI1OiRWNSwzMzokVjYsMzU6MTUsMzY6JFY3LDM3OiRWOCwzODoxOSw0MDoyMSw0NToyMyw0ODokVjJ9LHs3OjgyLDk6MTYsMTA6JFYzLDEzOiRWNCwxNToyMiwyNTokVjUsMzM6JFY2LDM1OjE1LDM2OiRWNywzNzokVjgsMzg6MTksNDA6MjEsNDU6MjMsNDg6JFYyfSx7Nzo4Myw5OjE2LDEwOiRWMywxMzokVjQsMTU6MjIsMjU6JFY1LDMzOiRWNiwzNToxNSwzNjokVjcsMzc6JFY4LDM4OjE5LDQwOjIxLDQ1OjIzLDQ4OiRWMn0sezc6ODQsOToxNiwxMDokVjMsMTM6JFY0LDE1OjIyLDI1OiRWNSwzMzokVjYsMzU6MTUsMzY6JFY3LDM3OiRWOCwzODoxOSw0MDoyMSw0NToyMyw0ODokVjJ9LHs3Ojg1LDk6MTYsMTA6JFYzLDEzOiRWNCwxNToyMiwyNTokVjUsMzM6JFY2LDM1OjE1LDM2OiRWNywzNzokVjgsMzg6MTksNDA6MjEsNDU6MjMsNDg6JFYyfSxvKCRWcCxbMiwyOF0pLG8oJFZ6LFsyLDI3XSx7MjE6JFZkLDIyOiRWZSwyNjokVmksMzI6JFZvfSksezY6JFZjLDIxOiRWZCwyMjokVmUsMjM6JFZmLDI0OiRWZywyNTokVmgsMjY6JFZpLDI3OiRWaiwyODokVmssMjk6JFZsLDMwOiRWbSwzMTokVm4sMzI6JFZvLDM0OlsxLDg2XX0sbygkVkEsJFZCLHszNToxNSw5OjE2LDM4OjE5LDQwOjIxLDE1OjIyLDQ1OjIzLDM5Ojg3LDc6ODgsMTA6JFYzLDEzOiRWNCwyNTokVjUsMzM6JFY2LDM2OiRWNywzNzokVjgsNDg6JFYyfSksezEzOlsxLDg5XX0sezEzOlsxLDkwXSw0NTo5MX0sezEzOlsxLDkyXX0sezExOlsxLDkzXSw0MjpbMSw5NF19LG8oJFZDLFsyLDQxXSx7MTg6JFZEfSksbygkVkUsWzIsNDNdKSxvKCRWRSxbMiw0NF0pLHszNjpbMSw5Nl19LG8oJFZFLFsyLDQ2XSksezc6OTcsOToxNiwxMDokVjMsMTM6JFY0LDE1OjIyLDI1OiRWNSwzMzokVjYsMzU6MTUsMzY6JFY3LDM3OiRWOCwzODoxOSw0MDoyMSw0NToyMyw0ODokVjJ9LHs3Ojk4LDk6MTYsMTA6JFYzLDEzOiRWNCwxNToyMiwyNTokVjUsMzM6JFY2LDM1OjE1LDM2OiRWNywzNzokVjgsMzg6MTksNDA6MjEsNDU6MjMsNDg6JFYyfSx7MTE6WzEsOTldLDE4OlsxLDEwMF19LG8oJFZGLFsyLDEwXSksbygkVkYsWzIsMTFdLHsyMDpbMSwxMDFdfSksbygkVnAsWzIsNTNdKSx7MTM6WzEsMTAyXX0sezIzOiRWdiwyNTokVncsMzY6JFZ4LDUwOjEwMyw1MTokVnl9LHsyMDpbMSwxMDVdLDQ4OlsxLDEwNl0sNDk6WzEsMTA0XX0sezQ3OlsxLDEwOF0sNDk6WzEsMTA3XX0sbygkVkcsWzIsNjVdKSx7MzY6WzEsMTA5XX0sezM2OlsxLDExMF19LHszNjpbMSwxMTFdfSx7NDg6JFZIfSx7NjokVkl9LG8oJFZKLFsyLDE1XSx7MjY6JFZpLDMyOiRWb30pLG8oJFZKLFsyLDE2XSx7MjY6JFZpLDMyOiRWb30pLG8oJFZ6LFsyLDE3XSx7MjE6JFZkLDIyOiRWZSwyNjokVmksMzI6JFZvfSksbygkVnosWzIsMThdLHsyMTokVmQsMjI6JFZlLDI2OiRWaSwzMjokVm99KSxvKCRWeixbMiwxOV0sezIxOiRWZCwyMjokVmUsMjY6JFZpLDMyOiRWb30pLG8oWzUsNiwxMSwxOCwyMSwyMiwyMywyNCwyNSwyNiwyNywyOCwyOSwzMCwzMSwzNF0sWzIsMjBdLHszMjokVm99KSxvKCRWSyxbMiwyMV0sezIxOiRWZCwyMjokVmUsMjM6JFZmLDI0OiRWZywyNTokVmgsMjY6JFZpLDMyOiRWb30pLG8oJFZLLFsyLDIyXSx7MjE6JFZkLDIyOiRWZSwyMzokVmYsMjQ6JFZnLDI1OiRWaCwyNjokVmksMzI6JFZvfSksbygkVkssWzIsMjNdLHsyMTokVmQsMjI6JFZlLDIzOiRWZiwyNDokVmcsMjU6JFZoLDI2OiRWaSwzMjokVm99KSxvKCRWSyxbMiwyNF0sezIxOiRWZCwyMjokVmUsMjM6JFZmLDI0OiRWZywyNTokVmgsMjY6JFZpLDMyOiRWb30pLG8oJFZLLFsyLDI1XSx7MjE6JFZkLDIyOiRWZSwyMzokVmYsMjQ6JFZnLDI1OiRWaCwyNjokVmksMzI6JFZvfSksbygkVkssWzIsMjZdLHsyMTokVmQsMjI6JFZlLDIzOiRWZiwyNDokVmcsMjU6JFZoLDI2OiRWaSwzMjokVm99KSxvKCRWcCxbMiwyOV0pLHsxODokVkwsMzQ6WzEsMTEzXX0sbygkVkEsWzIsNDhdLHs2OiRWYywyMTokVmQsMjI6JFZlLDIzOiRWZiwyNDokVmcsMjU6JFZoLDI2OiRWaSwyNzokVmosMjg6JFZrLDI5OiRWbCwzMDokVm0sMzE6JFZuLDMyOiRWb30pLG8oJFZwLCRWSSx7MzM6WzEsMTE1XX0pLHs0NzokVnEsNDg6JFZIfSxvKCRWcCxbMiw1MV0pLG8oJFZwLFsyLDUyXSksbygkVnAsWzIsMzldKSx7MjU6JFZyLDM2OiRWcywzNzokVnQsNDM6MTE2LDQ0OjU0fSx7MjU6JFZyLDM2OiRWcywzNzokVnQsNDQ6MTE3fSxvKCRWRSxbMiw0NV0pLHs2OiRWYywxMTpbMSwxMThdLDIxOiRWZCwyMjokVmUsMjM6JFZmLDI0OiRWZywyNTokVmgsMjY6JFZpLDI3OiRWaiwyODokVmssMjk6JFZsLDMwOiRWbSwzMTokVm4sMzI6JFZvfSx7NjokVmMsMTE6WzEsMTE5XSwyMTokVmQsMjI6JFZlLDIzOiRWZiwyNDokVmcsMjU6JFZoLDI2OiRWaSwyNzokVmosMjg6JFZrLDI5OiRWbCwzMDokVm0sMzE6JFZuLDMyOiRWb30sbygkVjksWzIsOF0pLHsxMzokVnUsMTk6MTIwfSx7MTM6WzEsMTIxXX0sezQ5OlsxLDEyMl19LHs0NzpbMSwxMjRdLDQ5OlsxLDEyM119LG8oJFZwLFsyLDU0XSksezEzOlsxLDEyNV19LHsyMzokVnYsMjU6JFZ3LDM2OiRWeCw1MDoxMjYsNTE6JFZ5fSxvKCRWcCxbMiw1OV0pLHsyMzokVnYsMjU6JFZ3LDM2OiRWeCw1MDoxMjcsNTE6JFZ5fSxvKCRWRyxbMiw2Nl0pLG8oJFZHLFsyLDY3XSksbygkVkcsWzIsNjhdKSx7MjM6JFZ2LDI1OiRWdywzNjokVngsNTA6MTI4LDUxOiRWeX0sbygkVnAsWzIsMzVdKSx7NzoxMjksOToxNiwxMDokVjMsMTM6JFY0LDE1OjIyLDI1OiRWNSwzMzokVjYsMzU6MTUsMzY6JFY3LDM3OiRWOCwzODoxOSw0MDoyMSw0NToyMyw0ODokVjJ9LG8oJFZBLCRWQix7MzU6MTUsOToxNiwzODoxOSw0MDoyMSwxNToyMiw0NToyMyw3Ojg4LDM5OjEzMCwxMDokVjMsMTM6JFY0LDI1OiRWNSwzMzokVjYsMzY6JFY3LDM3OiRWOCw0ODokVjJ9KSxvKCRWQyxbMiw0MF0sezE4OiRWRH0pLG8oJFZFLFsyLDQyXSksbygkVjksWzIsNV0sezEyOlsxLDEzMV19KSxvKCRWOSxbMiw3XSksbygkVkYsWzIsOV0pLG8oJFZGLFsyLDEyXSksbygkVnAsWzIsNTVdKSx7NDk6WzEsMTMyXX0sezIzOiRWdiwyNTokVncsMzY6JFZ4LDUwOjEzMyw1MTokVnl9LHs0OTpbMSwxMzRdfSx7NDc6WzEsMTM2XSw0OTpbMSwxMzVdfSx7NDk6WzEsMTM3XX0sezQ3OlsxLDEzOV0sNDk6WzEsMTM4XX0sbygkVkEsWzIsNDddLHs2OiRWYywyMTokVmQsMjI6JFZlLDIzOiRWZiwyNDokVmcsMjU6JFZoLDI2OiRWaSwyNzokVmosMjg6JFZrLDI5OiRWbCwzMDokVm0sMzE6JFZuLDMyOiRWb30pLHsxODokVkwsMzQ6WzEsMTQwXX0sezEzOlsxLDE0MV19LG8oJFZwLFsyLDU3XSksezQ5OlsxLDE0Ml19LG8oJFZwLFsyLDU2XSksezQ5OlsxLDE0M119LHsyMzokVnYsMjU6JFZ3LDM2OiRWeCw1MDoxNDQsNTE6JFZ5fSxvKCRWcCxbMiw2MF0pLHs0OTpbMSwxNDVdfSx7MjM6JFZ2LDI1OiRWdywzNjokVngsNTA6MTQ2LDUxOiRWeX0sbygkVnAsWzIsMzZdKSx7MTQ6WzEsMTQ3XX0sezQ5OlsxLDE0OF19LG8oJFZwLFsyLDYxXSksezQ5OlsxLDE0OV19LG8oJFZwLFsyLDYzXSksezQ5OlsxLDE1MF19LHsxMzpbMSwxNTFdfSxvKCRWcCxbMiw1OF0pLHs0OTpbMSwxNTJdfSx7NDk6WzEsMTUzXX0sbygkVjksWzIsNl0pLG8oJFZwLFsyLDYyXSksbygkVnAsWzIsNjRdKV0sXG5kZWZhdWx0QWN0aW9uczogezEwOlsyLDFdLDMyOlsyLDJdLDczOlsyLDE0XX0sXG5wYXJzZUVycm9yOiBmdW5jdGlvbiBwYXJzZUVycm9yKHN0ciwgaGFzaCkge1xuICAgIGlmIChoYXNoLnJlY292ZXJhYmxlKSB7XG4gICAgICAgIHRoaXMudHJhY2Uoc3RyKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBmdW5jdGlvbiBfcGFyc2VFcnJvciAobXNnLCBoYXNoKSB7XG4gICAgICAgICAgICB0aGlzLm1lc3NhZ2UgPSBtc2c7XG4gICAgICAgICAgICB0aGlzLmhhc2ggPSBoYXNoO1xuICAgICAgICB9XG4gICAgICAgIF9wYXJzZUVycm9yLnByb3RvdHlwZSA9IEVycm9yO1xuXG4gICAgICAgIHRocm93IG5ldyBfcGFyc2VFcnJvcihzdHIsIGhhc2gpO1xuICAgIH1cbn0sXG5wYXJzZTogZnVuY3Rpb24gcGFyc2UoaW5wdXQpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXMsIHN0YWNrID0gWzBdLCB0c3RhY2sgPSBbXSwgdnN0YWNrID0gW251bGxdLCBsc3RhY2sgPSBbXSwgdGFibGUgPSB0aGlzLnRhYmxlLCB5eXRleHQgPSAnJywgeXlsaW5lbm8gPSAwLCB5eWxlbmcgPSAwLCByZWNvdmVyaW5nID0gMCwgVEVSUk9SID0gMiwgRU9GID0gMTtcbiAgICB2YXIgYXJncyA9IGxzdGFjay5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG4gICAgdmFyIGxleGVyID0gT2JqZWN0LmNyZWF0ZSh0aGlzLmxleGVyKTtcbiAgICB2YXIgc2hhcmVkU3RhdGUgPSB7IHl5OiB7fSB9O1xuICAgIGZvciAodmFyIGsgaW4gdGhpcy55eSkge1xuICAgICAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHRoaXMueXksIGspKSB7XG4gICAgICAgICAgICBzaGFyZWRTdGF0ZS55eVtrXSA9IHRoaXMueXlba107XG4gICAgICAgIH1cbiAgICB9XG4gICAgbGV4ZXIuc2V0SW5wdXQoaW5wdXQsIHNoYXJlZFN0YXRlLnl5KTtcbiAgICBzaGFyZWRTdGF0ZS55eS5sZXhlciA9IGxleGVyO1xuICAgIHNoYXJlZFN0YXRlLnl5LnBhcnNlciA9IHRoaXM7XG4gICAgaWYgKHR5cGVvZiBsZXhlci55eWxsb2MgPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgbGV4ZXIueXlsbG9jID0ge307XG4gICAgfVxuICAgIHZhciB5eWxvYyA9IGxleGVyLnl5bGxvYztcbiAgICBsc3RhY2sucHVzaCh5eWxvYyk7XG4gICAgdmFyIHJhbmdlcyA9IGxleGVyLm9wdGlvbnMgJiYgbGV4ZXIub3B0aW9ucy5yYW5nZXM7XG4gICAgaWYgKHR5cGVvZiBzaGFyZWRTdGF0ZS55eS5wYXJzZUVycm9yID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHRoaXMucGFyc2VFcnJvciA9IHNoYXJlZFN0YXRlLnl5LnBhcnNlRXJyb3I7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5wYXJzZUVycm9yID0gT2JqZWN0LmdldFByb3RvdHlwZU9mKHRoaXMpLnBhcnNlRXJyb3I7XG4gICAgfVxuICAgIGZ1bmN0aW9uIHBvcFN0YWNrKG4pIHtcbiAgICAgICAgc3RhY2subGVuZ3RoID0gc3RhY2subGVuZ3RoIC0gMiAqIG47XG4gICAgICAgIHZzdGFjay5sZW5ndGggPSB2c3RhY2subGVuZ3RoIC0gbjtcbiAgICAgICAgbHN0YWNrLmxlbmd0aCA9IGxzdGFjay5sZW5ndGggLSBuO1xuICAgIH1cbiAgICBfdG9rZW5fc3RhY2s6XG4gICAgICAgIHZhciBsZXggPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgdG9rZW47XG4gICAgICAgICAgICB0b2tlbiA9IGxleGVyLmxleCgpIHx8IEVPRjtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgdG9rZW4gIT09ICdudW1iZXInKSB7XG4gICAgICAgICAgICAgICAgdG9rZW4gPSBzZWxmLnN5bWJvbHNfW3Rva2VuXSB8fCB0b2tlbjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0b2tlbjtcbiAgICAgICAgfTtcbiAgICB2YXIgc3ltYm9sLCBwcmVFcnJvclN5bWJvbCwgc3RhdGUsIGFjdGlvbiwgYSwgciwgeXl2YWwgPSB7fSwgcCwgbGVuLCBuZXdTdGF0ZSwgZXhwZWN0ZWQ7XG4gICAgd2hpbGUgKHRydWUpIHtcbiAgICAgICAgc3RhdGUgPSBzdGFja1tzdGFjay5sZW5ndGggLSAxXTtcbiAgICAgICAgaWYgKHRoaXMuZGVmYXVsdEFjdGlvbnNbc3RhdGVdKSB7XG4gICAgICAgICAgICBhY3Rpb24gPSB0aGlzLmRlZmF1bHRBY3Rpb25zW3N0YXRlXTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmIChzeW1ib2wgPT09IG51bGwgfHwgdHlwZW9mIHN5bWJvbCA9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIHN5bWJvbCA9IGxleCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYWN0aW9uID0gdGFibGVbc3RhdGVdICYmIHRhYmxlW3N0YXRlXVtzeW1ib2xdO1xuICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgYWN0aW9uID09PSAndW5kZWZpbmVkJyB8fCAhYWN0aW9uLmxlbmd0aCB8fCAhYWN0aW9uWzBdKSB7XG4gICAgICAgICAgICAgICAgdmFyIGVyclN0ciA9ICcnO1xuICAgICAgICAgICAgICAgIGV4cGVjdGVkID0gW107XG4gICAgICAgICAgICAgICAgZm9yIChwIGluIHRhYmxlW3N0YXRlXSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy50ZXJtaW5hbHNfW3BdICYmIHAgPiBURVJST1IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGV4cGVjdGVkLnB1c2goJ1xcJycgKyB0aGlzLnRlcm1pbmFsc19bcF0gKyAnXFwnJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGxleGVyLnNob3dQb3NpdGlvbikge1xuICAgICAgICAgICAgICAgICAgICBlcnJTdHIgPSAnUGFyc2UgZXJyb3Igb24gbGluZSAnICsgKHl5bGluZW5vICsgMSkgKyAnOlxcbicgKyBsZXhlci5zaG93UG9zaXRpb24oKSArICdcXG5FeHBlY3RpbmcgJyArIGV4cGVjdGVkLmpvaW4oJywgJykgKyAnLCBnb3QgXFwnJyArICh0aGlzLnRlcm1pbmFsc19bc3ltYm9sXSB8fCBzeW1ib2wpICsgJ1xcJyc7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgZXJyU3RyID0gJ1BhcnNlIGVycm9yIG9uIGxpbmUgJyArICh5eWxpbmVubyArIDEpICsgJzogVW5leHBlY3RlZCAnICsgKHN5bWJvbCA9PSBFT0YgPyAnZW5kIG9mIGlucHV0JyA6ICdcXCcnICsgKHRoaXMudGVybWluYWxzX1tzeW1ib2xdIHx8IHN5bWJvbCkgKyAnXFwnJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMucGFyc2VFcnJvcihlcnJTdHIsIHtcbiAgICAgICAgICAgICAgICAgICAgdGV4dDogbGV4ZXIubWF0Y2gsXG4gICAgICAgICAgICAgICAgICAgIHRva2VuOiB0aGlzLnRlcm1pbmFsc19bc3ltYm9sXSB8fCBzeW1ib2wsXG4gICAgICAgICAgICAgICAgICAgIGxpbmU6IGxleGVyLnl5bGluZW5vLFxuICAgICAgICAgICAgICAgICAgICBsb2M6IHl5bG9jLFxuICAgICAgICAgICAgICAgICAgICBleHBlY3RlZDogZXhwZWN0ZWRcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgaWYgKGFjdGlvblswXSBpbnN0YW5jZW9mIEFycmF5ICYmIGFjdGlvbi5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1BhcnNlIEVycm9yOiBtdWx0aXBsZSBhY3Rpb25zIHBvc3NpYmxlIGF0IHN0YXRlOiAnICsgc3RhdGUgKyAnLCB0b2tlbjogJyArIHN5bWJvbCk7XG4gICAgICAgIH1cbiAgICAgICAgc3dpdGNoIChhY3Rpb25bMF0pIHtcbiAgICAgICAgY2FzZSAxOlxuICAgICAgICAgICAgc3RhY2sucHVzaChzeW1ib2wpO1xuICAgICAgICAgICAgdnN0YWNrLnB1c2gobGV4ZXIueXl0ZXh0KTtcbiAgICAgICAgICAgIGxzdGFjay5wdXNoKGxleGVyLnl5bGxvYyk7XG4gICAgICAgICAgICBzdGFjay5wdXNoKGFjdGlvblsxXSk7XG4gICAgICAgICAgICBzeW1ib2wgPSBudWxsO1xuICAgICAgICAgICAgaWYgKCFwcmVFcnJvclN5bWJvbCkge1xuICAgICAgICAgICAgICAgIHl5bGVuZyA9IGxleGVyLnl5bGVuZztcbiAgICAgICAgICAgICAgICB5eXRleHQgPSBsZXhlci55eXRleHQ7XG4gICAgICAgICAgICAgICAgeXlsaW5lbm8gPSBsZXhlci55eWxpbmVubztcbiAgICAgICAgICAgICAgICB5eWxvYyA9IGxleGVyLnl5bGxvYztcbiAgICAgICAgICAgICAgICBpZiAocmVjb3ZlcmluZyA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgcmVjb3ZlcmluZy0tO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgc3ltYm9sID0gcHJlRXJyb3JTeW1ib2w7XG4gICAgICAgICAgICAgICAgcHJlRXJyb3JTeW1ib2wgPSBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgMjpcbiAgICAgICAgICAgIGxlbiA9IHRoaXMucHJvZHVjdGlvbnNfW2FjdGlvblsxXV1bMV07XG4gICAgICAgICAgICB5eXZhbC4kID0gdnN0YWNrW3ZzdGFjay5sZW5ndGggLSBsZW5dO1xuICAgICAgICAgICAgeXl2YWwuXyQgPSB7XG4gICAgICAgICAgICAgICAgZmlyc3RfbGluZTogbHN0YWNrW2xzdGFjay5sZW5ndGggLSAobGVuIHx8IDEpXS5maXJzdF9saW5lLFxuICAgICAgICAgICAgICAgIGxhc3RfbGluZTogbHN0YWNrW2xzdGFjay5sZW5ndGggLSAxXS5sYXN0X2xpbmUsXG4gICAgICAgICAgICAgICAgZmlyc3RfY29sdW1uOiBsc3RhY2tbbHN0YWNrLmxlbmd0aCAtIChsZW4gfHwgMSldLmZpcnN0X2NvbHVtbixcbiAgICAgICAgICAgICAgICBsYXN0X2NvbHVtbjogbHN0YWNrW2xzdGFjay5sZW5ndGggLSAxXS5sYXN0X2NvbHVtblxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGlmIChyYW5nZXMpIHtcbiAgICAgICAgICAgICAgICB5eXZhbC5fJC5yYW5nZSA9IFtcbiAgICAgICAgICAgICAgICAgICAgbHN0YWNrW2xzdGFjay5sZW5ndGggLSAobGVuIHx8IDEpXS5yYW5nZVswXSxcbiAgICAgICAgICAgICAgICAgICAgbHN0YWNrW2xzdGFjay5sZW5ndGggLSAxXS5yYW5nZVsxXVxuICAgICAgICAgICAgICAgIF07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByID0gdGhpcy5wZXJmb3JtQWN0aW9uLmFwcGx5KHl5dmFsLCBbXG4gICAgICAgICAgICAgICAgeXl0ZXh0LFxuICAgICAgICAgICAgICAgIHl5bGVuZyxcbiAgICAgICAgICAgICAgICB5eWxpbmVubyxcbiAgICAgICAgICAgICAgICBzaGFyZWRTdGF0ZS55eSxcbiAgICAgICAgICAgICAgICBhY3Rpb25bMV0sXG4gICAgICAgICAgICAgICAgdnN0YWNrLFxuICAgICAgICAgICAgICAgIGxzdGFja1xuICAgICAgICAgICAgXS5jb25jYXQoYXJncykpO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiByICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIHJldHVybiByO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGxlbikge1xuICAgICAgICAgICAgICAgIHN0YWNrID0gc3RhY2suc2xpY2UoMCwgLTEgKiBsZW4gKiAyKTtcbiAgICAgICAgICAgICAgICB2c3RhY2sgPSB2c3RhY2suc2xpY2UoMCwgLTEgKiBsZW4pO1xuICAgICAgICAgICAgICAgIGxzdGFjayA9IGxzdGFjay5zbGljZSgwLCAtMSAqIGxlbik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzdGFjay5wdXNoKHRoaXMucHJvZHVjdGlvbnNfW2FjdGlvblsxXV1bMF0pO1xuICAgICAgICAgICAgdnN0YWNrLnB1c2goeXl2YWwuJCk7XG4gICAgICAgICAgICBsc3RhY2sucHVzaCh5eXZhbC5fJCk7XG4gICAgICAgICAgICBuZXdTdGF0ZSA9IHRhYmxlW3N0YWNrW3N0YWNrLmxlbmd0aCAtIDJdXVtzdGFja1tzdGFjay5sZW5ndGggLSAxXV07XG4gICAgICAgICAgICBzdGFjay5wdXNoKG5ld1N0YXRlKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIDM6XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbn19O1xuXHJcbiAgICB2YXIgZXhwID0gcmVxdWlyZShcIi4vZXhwcmVzc2lvbnNcIik7XHJcbi8qIGdlbmVyYXRlZCBieSBqaXNvbi1sZXggMC4zLjQgKi9cbnZhciBsZXhlciA9IChmdW5jdGlvbigpe1xudmFyIGxleGVyID0gKHtcblxuRU9GOjEsXG5cbnBhcnNlRXJyb3I6ZnVuY3Rpb24gcGFyc2VFcnJvcihzdHIsIGhhc2gpIHtcbiAgICAgICAgaWYgKHRoaXMueXkucGFyc2VyKSB7XG4gICAgICAgICAgICB0aGlzLnl5LnBhcnNlci5wYXJzZUVycm9yKHN0ciwgaGFzaCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3Ioc3RyKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbi8vIHJlc2V0cyB0aGUgbGV4ZXIsIHNldHMgbmV3IGlucHV0XG5zZXRJbnB1dDpmdW5jdGlvbiAoaW5wdXQsIHl5KSB7XG4gICAgICAgIHRoaXMueXkgPSB5eSB8fCB0aGlzLnl5IHx8IHt9O1xuICAgICAgICB0aGlzLl9pbnB1dCA9IGlucHV0O1xuICAgICAgICB0aGlzLl9tb3JlID0gdGhpcy5fYmFja3RyYWNrID0gdGhpcy5kb25lID0gZmFsc2U7XG4gICAgICAgIHRoaXMueXlsaW5lbm8gPSB0aGlzLnl5bGVuZyA9IDA7XG4gICAgICAgIHRoaXMueXl0ZXh0ID0gdGhpcy5tYXRjaGVkID0gdGhpcy5tYXRjaCA9ICcnO1xuICAgICAgICB0aGlzLmNvbmRpdGlvblN0YWNrID0gWydJTklUSUFMJ107XG4gICAgICAgIHRoaXMueXlsbG9jID0ge1xuICAgICAgICAgICAgZmlyc3RfbGluZTogMSxcbiAgICAgICAgICAgIGZpcnN0X2NvbHVtbjogMCxcbiAgICAgICAgICAgIGxhc3RfbGluZTogMSxcbiAgICAgICAgICAgIGxhc3RfY29sdW1uOiAwXG4gICAgICAgIH07XG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMucmFuZ2VzKSB7XG4gICAgICAgICAgICB0aGlzLnl5bGxvYy5yYW5nZSA9IFswLDBdO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMub2Zmc2V0ID0gMDtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuLy8gY29uc3VtZXMgYW5kIHJldHVybnMgb25lIGNoYXIgZnJvbSB0aGUgaW5wdXRcbmlucHV0OmZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGNoID0gdGhpcy5faW5wdXRbMF07XG4gICAgICAgIHRoaXMueXl0ZXh0ICs9IGNoO1xuICAgICAgICB0aGlzLnl5bGVuZysrO1xuICAgICAgICB0aGlzLm9mZnNldCsrO1xuICAgICAgICB0aGlzLm1hdGNoICs9IGNoO1xuICAgICAgICB0aGlzLm1hdGNoZWQgKz0gY2g7XG4gICAgICAgIHZhciBsaW5lcyA9IGNoLm1hdGNoKC8oPzpcXHJcXG4/fFxcbikuKi9nKTtcbiAgICAgICAgaWYgKGxpbmVzKSB7XG4gICAgICAgICAgICB0aGlzLnl5bGluZW5vKys7XG4gICAgICAgICAgICB0aGlzLnl5bGxvYy5sYXN0X2xpbmUrKztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMueXlsbG9jLmxhc3RfY29sdW1uKys7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5yYW5nZXMpIHtcbiAgICAgICAgICAgIHRoaXMueXlsbG9jLnJhbmdlWzFdKys7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9pbnB1dCA9IHRoaXMuX2lucHV0LnNsaWNlKDEpO1xuICAgICAgICByZXR1cm4gY2g7XG4gICAgfSxcblxuLy8gdW5zaGlmdHMgb25lIGNoYXIgKG9yIGEgc3RyaW5nKSBpbnRvIHRoZSBpbnB1dFxudW5wdXQ6ZnVuY3Rpb24gKGNoKSB7XG4gICAgICAgIHZhciBsZW4gPSBjaC5sZW5ndGg7XG4gICAgICAgIHZhciBsaW5lcyA9IGNoLnNwbGl0KC8oPzpcXHJcXG4/fFxcbikvZyk7XG5cbiAgICAgICAgdGhpcy5faW5wdXQgPSBjaCArIHRoaXMuX2lucHV0O1xuICAgICAgICB0aGlzLnl5dGV4dCA9IHRoaXMueXl0ZXh0LnN1YnN0cigwLCB0aGlzLnl5dGV4dC5sZW5ndGggLSBsZW4pO1xuICAgICAgICAvL3RoaXMueXlsZW5nIC09IGxlbjtcbiAgICAgICAgdGhpcy5vZmZzZXQgLT0gbGVuO1xuICAgICAgICB2YXIgb2xkTGluZXMgPSB0aGlzLm1hdGNoLnNwbGl0KC8oPzpcXHJcXG4/fFxcbikvZyk7XG4gICAgICAgIHRoaXMubWF0Y2ggPSB0aGlzLm1hdGNoLnN1YnN0cigwLCB0aGlzLm1hdGNoLmxlbmd0aCAtIDEpO1xuICAgICAgICB0aGlzLm1hdGNoZWQgPSB0aGlzLm1hdGNoZWQuc3Vic3RyKDAsIHRoaXMubWF0Y2hlZC5sZW5ndGggLSAxKTtcblxuICAgICAgICBpZiAobGluZXMubGVuZ3RoIC0gMSkge1xuICAgICAgICAgICAgdGhpcy55eWxpbmVubyAtPSBsaW5lcy5sZW5ndGggLSAxO1xuICAgICAgICB9XG4gICAgICAgIHZhciByID0gdGhpcy55eWxsb2MucmFuZ2U7XG5cbiAgICAgICAgdGhpcy55eWxsb2MgPSB7XG4gICAgICAgICAgICBmaXJzdF9saW5lOiB0aGlzLnl5bGxvYy5maXJzdF9saW5lLFxuICAgICAgICAgICAgbGFzdF9saW5lOiB0aGlzLnl5bGluZW5vICsgMSxcbiAgICAgICAgICAgIGZpcnN0X2NvbHVtbjogdGhpcy55eWxsb2MuZmlyc3RfY29sdW1uLFxuICAgICAgICAgICAgbGFzdF9jb2x1bW46IGxpbmVzID9cbiAgICAgICAgICAgICAgICAobGluZXMubGVuZ3RoID09PSBvbGRMaW5lcy5sZW5ndGggPyB0aGlzLnl5bGxvYy5maXJzdF9jb2x1bW4gOiAwKVxuICAgICAgICAgICAgICAgICArIG9sZExpbmVzW29sZExpbmVzLmxlbmd0aCAtIGxpbmVzLmxlbmd0aF0ubGVuZ3RoIC0gbGluZXNbMF0ubGVuZ3RoIDpcbiAgICAgICAgICAgICAgdGhpcy55eWxsb2MuZmlyc3RfY29sdW1uIC0gbGVuXG4gICAgICAgIH07XG5cbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5yYW5nZXMpIHtcbiAgICAgICAgICAgIHRoaXMueXlsbG9jLnJhbmdlID0gW3JbMF0sIHJbMF0gKyB0aGlzLnl5bGVuZyAtIGxlbl07XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy55eWxlbmcgPSB0aGlzLnl5dGV4dC5sZW5ndGg7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbi8vIFdoZW4gY2FsbGVkIGZyb20gYWN0aW9uLCBjYWNoZXMgbWF0Y2hlZCB0ZXh0IGFuZCBhcHBlbmRzIGl0IG9uIG5leHQgYWN0aW9uXG5tb3JlOmZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5fbW9yZSA9IHRydWU7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbi8vIFdoZW4gY2FsbGVkIGZyb20gYWN0aW9uLCBzaWduYWxzIHRoZSBsZXhlciB0aGF0IHRoaXMgcnVsZSBmYWlscyB0byBtYXRjaCB0aGUgaW5wdXQsIHNvIHRoZSBuZXh0IG1hdGNoaW5nIHJ1bGUgKHJlZ2V4KSBzaG91bGQgYmUgdGVzdGVkIGluc3RlYWQuXG5yZWplY3Q6ZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAodGhpcy5vcHRpb25zLmJhY2t0cmFja19sZXhlcikge1xuICAgICAgICAgICAgdGhpcy5fYmFja3RyYWNrID0gdHJ1ZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnBhcnNlRXJyb3IoJ0xleGljYWwgZXJyb3Igb24gbGluZSAnICsgKHRoaXMueXlsaW5lbm8gKyAxKSArICcuIFlvdSBjYW4gb25seSBpbnZva2UgcmVqZWN0KCkgaW4gdGhlIGxleGVyIHdoZW4gdGhlIGxleGVyIGlzIG9mIHRoZSBiYWNrdHJhY2tpbmcgcGVyc3Vhc2lvbiAob3B0aW9ucy5iYWNrdHJhY2tfbGV4ZXIgPSB0cnVlKS5cXG4nICsgdGhpcy5zaG93UG9zaXRpb24oKSwge1xuICAgICAgICAgICAgICAgIHRleHQ6IFwiXCIsXG4gICAgICAgICAgICAgICAgdG9rZW46IG51bGwsXG4gICAgICAgICAgICAgICAgbGluZTogdGhpcy55eWxpbmVub1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4vLyByZXRhaW4gZmlyc3QgbiBjaGFyYWN0ZXJzIG9mIHRoZSBtYXRjaFxubGVzczpmdW5jdGlvbiAobikge1xuICAgICAgICB0aGlzLnVucHV0KHRoaXMubWF0Y2guc2xpY2UobikpO1xuICAgIH0sXG5cbi8vIGRpc3BsYXlzIGFscmVhZHkgbWF0Y2hlZCBpbnB1dCwgaS5lLiBmb3IgZXJyb3IgbWVzc2FnZXNcbnBhc3RJbnB1dDpmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBwYXN0ID0gdGhpcy5tYXRjaGVkLnN1YnN0cigwLCB0aGlzLm1hdGNoZWQubGVuZ3RoIC0gdGhpcy5tYXRjaC5sZW5ndGgpO1xuICAgICAgICByZXR1cm4gKHBhc3QubGVuZ3RoID4gMjAgPyAnLi4uJzonJykgKyBwYXN0LnN1YnN0cigtMjApLnJlcGxhY2UoL1xcbi9nLCBcIlwiKTtcbiAgICB9LFxuXG4vLyBkaXNwbGF5cyB1cGNvbWluZyBpbnB1dCwgaS5lLiBmb3IgZXJyb3IgbWVzc2FnZXNcbnVwY29taW5nSW5wdXQ6ZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgbmV4dCA9IHRoaXMubWF0Y2g7XG4gICAgICAgIGlmIChuZXh0Lmxlbmd0aCA8IDIwKSB7XG4gICAgICAgICAgICBuZXh0ICs9IHRoaXMuX2lucHV0LnN1YnN0cigwLCAyMC1uZXh0Lmxlbmd0aCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIChuZXh0LnN1YnN0cigwLDIwKSArIChuZXh0Lmxlbmd0aCA+IDIwID8gJy4uLicgOiAnJykpLnJlcGxhY2UoL1xcbi9nLCBcIlwiKTtcbiAgICB9LFxuXG4vLyBkaXNwbGF5cyB0aGUgY2hhcmFjdGVyIHBvc2l0aW9uIHdoZXJlIHRoZSBsZXhpbmcgZXJyb3Igb2NjdXJyZWQsIGkuZS4gZm9yIGVycm9yIG1lc3NhZ2VzXG5zaG93UG9zaXRpb246ZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgcHJlID0gdGhpcy5wYXN0SW5wdXQoKTtcbiAgICAgICAgdmFyIGMgPSBuZXcgQXJyYXkocHJlLmxlbmd0aCArIDEpLmpvaW4oXCItXCIpO1xuICAgICAgICByZXR1cm4gcHJlICsgdGhpcy51cGNvbWluZ0lucHV0KCkgKyBcIlxcblwiICsgYyArIFwiXlwiO1xuICAgIH0sXG5cbi8vIHRlc3QgdGhlIGxleGVkIHRva2VuOiByZXR1cm4gRkFMU0Ugd2hlbiBub3QgYSBtYXRjaCwgb3RoZXJ3aXNlIHJldHVybiB0b2tlblxudGVzdF9tYXRjaDpmdW5jdGlvbiAobWF0Y2gsIGluZGV4ZWRfcnVsZSkge1xuICAgICAgICB2YXIgdG9rZW4sXG4gICAgICAgICAgICBsaW5lcyxcbiAgICAgICAgICAgIGJhY2t1cDtcblxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLmJhY2t0cmFja19sZXhlcikge1xuICAgICAgICAgICAgLy8gc2F2ZSBjb250ZXh0XG4gICAgICAgICAgICBiYWNrdXAgPSB7XG4gICAgICAgICAgICAgICAgeXlsaW5lbm86IHRoaXMueXlsaW5lbm8sXG4gICAgICAgICAgICAgICAgeXlsbG9jOiB7XG4gICAgICAgICAgICAgICAgICAgIGZpcnN0X2xpbmU6IHRoaXMueXlsbG9jLmZpcnN0X2xpbmUsXG4gICAgICAgICAgICAgICAgICAgIGxhc3RfbGluZTogdGhpcy5sYXN0X2xpbmUsXG4gICAgICAgICAgICAgICAgICAgIGZpcnN0X2NvbHVtbjogdGhpcy55eWxsb2MuZmlyc3RfY29sdW1uLFxuICAgICAgICAgICAgICAgICAgICBsYXN0X2NvbHVtbjogdGhpcy55eWxsb2MubGFzdF9jb2x1bW5cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHl5dGV4dDogdGhpcy55eXRleHQsXG4gICAgICAgICAgICAgICAgbWF0Y2g6IHRoaXMubWF0Y2gsXG4gICAgICAgICAgICAgICAgbWF0Y2hlczogdGhpcy5tYXRjaGVzLFxuICAgICAgICAgICAgICAgIG1hdGNoZWQ6IHRoaXMubWF0Y2hlZCxcbiAgICAgICAgICAgICAgICB5eWxlbmc6IHRoaXMueXlsZW5nLFxuICAgICAgICAgICAgICAgIG9mZnNldDogdGhpcy5vZmZzZXQsXG4gICAgICAgICAgICAgICAgX21vcmU6IHRoaXMuX21vcmUsXG4gICAgICAgICAgICAgICAgX2lucHV0OiB0aGlzLl9pbnB1dCxcbiAgICAgICAgICAgICAgICB5eTogdGhpcy55eSxcbiAgICAgICAgICAgICAgICBjb25kaXRpb25TdGFjazogdGhpcy5jb25kaXRpb25TdGFjay5zbGljZSgwKSxcbiAgICAgICAgICAgICAgICBkb25lOiB0aGlzLmRvbmVcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLnJhbmdlcykge1xuICAgICAgICAgICAgICAgIGJhY2t1cC55eWxsb2MucmFuZ2UgPSB0aGlzLnl5bGxvYy5yYW5nZS5zbGljZSgwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGxpbmVzID0gbWF0Y2hbMF0ubWF0Y2goLyg/Olxcclxcbj98XFxuKS4qL2cpO1xuICAgICAgICBpZiAobGluZXMpIHtcbiAgICAgICAgICAgIHRoaXMueXlsaW5lbm8gKz0gbGluZXMubGVuZ3RoO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMueXlsbG9jID0ge1xuICAgICAgICAgICAgZmlyc3RfbGluZTogdGhpcy55eWxsb2MubGFzdF9saW5lLFxuICAgICAgICAgICAgbGFzdF9saW5lOiB0aGlzLnl5bGluZW5vICsgMSxcbiAgICAgICAgICAgIGZpcnN0X2NvbHVtbjogdGhpcy55eWxsb2MubGFzdF9jb2x1bW4sXG4gICAgICAgICAgICBsYXN0X2NvbHVtbjogbGluZXMgP1xuICAgICAgICAgICAgICAgICAgICAgICAgIGxpbmVzW2xpbmVzLmxlbmd0aCAtIDFdLmxlbmd0aCAtIGxpbmVzW2xpbmVzLmxlbmd0aCAtIDFdLm1hdGNoKC9cXHI/XFxuPy8pWzBdLmxlbmd0aCA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy55eWxsb2MubGFzdF9jb2x1bW4gKyBtYXRjaFswXS5sZW5ndGhcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy55eXRleHQgKz0gbWF0Y2hbMF07XG4gICAgICAgIHRoaXMubWF0Y2ggKz0gbWF0Y2hbMF07XG4gICAgICAgIHRoaXMubWF0Y2hlcyA9IG1hdGNoO1xuICAgICAgICB0aGlzLnl5bGVuZyA9IHRoaXMueXl0ZXh0Lmxlbmd0aDtcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5yYW5nZXMpIHtcbiAgICAgICAgICAgIHRoaXMueXlsbG9jLnJhbmdlID0gW3RoaXMub2Zmc2V0LCB0aGlzLm9mZnNldCArPSB0aGlzLnl5bGVuZ107XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fbW9yZSA9IGZhbHNlO1xuICAgICAgICB0aGlzLl9iYWNrdHJhY2sgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5faW5wdXQgPSB0aGlzLl9pbnB1dC5zbGljZShtYXRjaFswXS5sZW5ndGgpO1xuICAgICAgICB0aGlzLm1hdGNoZWQgKz0gbWF0Y2hbMF07XG4gICAgICAgIHRva2VuID0gdGhpcy5wZXJmb3JtQWN0aW9uLmNhbGwodGhpcywgdGhpcy55eSwgdGhpcywgaW5kZXhlZF9ydWxlLCB0aGlzLmNvbmRpdGlvblN0YWNrW3RoaXMuY29uZGl0aW9uU3RhY2subGVuZ3RoIC0gMV0pO1xuICAgICAgICBpZiAodGhpcy5kb25lICYmIHRoaXMuX2lucHV0KSB7XG4gICAgICAgICAgICB0aGlzLmRvbmUgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodG9rZW4pIHtcbiAgICAgICAgICAgIHJldHVybiB0b2tlbjtcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLl9iYWNrdHJhY2spIHtcbiAgICAgICAgICAgIC8vIHJlY292ZXIgY29udGV4dFxuICAgICAgICAgICAgZm9yICh2YXIgayBpbiBiYWNrdXApIHtcbiAgICAgICAgICAgICAgICB0aGlzW2tdID0gYmFja3VwW2tdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlOyAvLyBydWxlIGFjdGlvbiBjYWxsZWQgcmVqZWN0KCkgaW1wbHlpbmcgdGhlIG5leHQgcnVsZSBzaG91bGQgYmUgdGVzdGVkIGluc3RlYWQuXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0sXG5cbi8vIHJldHVybiBuZXh0IG1hdGNoIGluIGlucHV0XG5uZXh0OmZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKHRoaXMuZG9uZSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuRU9GO1xuICAgICAgICB9XG4gICAgICAgIGlmICghdGhpcy5faW5wdXQpIHtcbiAgICAgICAgICAgIHRoaXMuZG9uZSA9IHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgdG9rZW4sXG4gICAgICAgICAgICBtYXRjaCxcbiAgICAgICAgICAgIHRlbXBNYXRjaCxcbiAgICAgICAgICAgIGluZGV4O1xuICAgICAgICBpZiAoIXRoaXMuX21vcmUpIHtcbiAgICAgICAgICAgIHRoaXMueXl0ZXh0ID0gJyc7XG4gICAgICAgICAgICB0aGlzLm1hdGNoID0gJyc7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHJ1bGVzID0gdGhpcy5fY3VycmVudFJ1bGVzKCk7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcnVsZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHRlbXBNYXRjaCA9IHRoaXMuX2lucHV0Lm1hdGNoKHRoaXMucnVsZXNbcnVsZXNbaV1dKTtcbiAgICAgICAgICAgIGlmICh0ZW1wTWF0Y2ggJiYgKCFtYXRjaCB8fCB0ZW1wTWF0Y2hbMF0ubGVuZ3RoID4gbWF0Y2hbMF0ubGVuZ3RoKSkge1xuICAgICAgICAgICAgICAgIG1hdGNoID0gdGVtcE1hdGNoO1xuICAgICAgICAgICAgICAgIGluZGV4ID0gaTtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLmJhY2t0cmFja19sZXhlcikge1xuICAgICAgICAgICAgICAgICAgICB0b2tlbiA9IHRoaXMudGVzdF9tYXRjaCh0ZW1wTWF0Y2gsIHJ1bGVzW2ldKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRva2VuICE9PSBmYWxzZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRva2VuO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHRoaXMuX2JhY2t0cmFjaykge1xuICAgICAgICAgICAgICAgICAgICAgICAgbWF0Y2ggPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlOyAvLyBydWxlIGFjdGlvbiBjYWxsZWQgcmVqZWN0KCkgaW1wbHlpbmcgYSBydWxlIE1JU21hdGNoLlxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gZWxzZTogdGhpcyBpcyBhIGxleGVyIHJ1bGUgd2hpY2ggY29uc3VtZXMgaW5wdXQgd2l0aG91dCBwcm9kdWNpbmcgYSB0b2tlbiAoZS5nLiB3aGl0ZXNwYWNlKVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICghdGhpcy5vcHRpb25zLmZsZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChtYXRjaCkge1xuICAgICAgICAgICAgdG9rZW4gPSB0aGlzLnRlc3RfbWF0Y2gobWF0Y2gsIHJ1bGVzW2luZGV4XSk7XG4gICAgICAgICAgICBpZiAodG9rZW4gIT09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRva2VuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gZWxzZTogdGhpcyBpcyBhIGxleGVyIHJ1bGUgd2hpY2ggY29uc3VtZXMgaW5wdXQgd2l0aG91dCBwcm9kdWNpbmcgYSB0b2tlbiAoZS5nLiB3aGl0ZXNwYWNlKVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLl9pbnB1dCA9PT0gXCJcIikge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuRU9GO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMucGFyc2VFcnJvcignTGV4aWNhbCBlcnJvciBvbiBsaW5lICcgKyAodGhpcy55eWxpbmVubyArIDEpICsgJy4gVW5yZWNvZ25pemVkIHRleHQuXFxuJyArIHRoaXMuc2hvd1Bvc2l0aW9uKCksIHtcbiAgICAgICAgICAgICAgICB0ZXh0OiBcIlwiLFxuICAgICAgICAgICAgICAgIHRva2VuOiBudWxsLFxuICAgICAgICAgICAgICAgIGxpbmU6IHRoaXMueXlsaW5lbm9cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfSxcblxuLy8gcmV0dXJuIG5leHQgbWF0Y2ggdGhhdCBoYXMgYSB0b2tlblxubGV4OmZ1bmN0aW9uIGxleCgpIHtcbiAgICAgICAgdmFyIHIgPSB0aGlzLm5leHQoKTtcbiAgICAgICAgaWYgKHIpIHtcbiAgICAgICAgICAgIHJldHVybiByO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMubGV4KCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4vLyBhY3RpdmF0ZXMgYSBuZXcgbGV4ZXIgY29uZGl0aW9uIHN0YXRlIChwdXNoZXMgdGhlIG5ldyBsZXhlciBjb25kaXRpb24gc3RhdGUgb250byB0aGUgY29uZGl0aW9uIHN0YWNrKVxuYmVnaW46ZnVuY3Rpb24gYmVnaW4oY29uZGl0aW9uKSB7XG4gICAgICAgIHRoaXMuY29uZGl0aW9uU3RhY2sucHVzaChjb25kaXRpb24pO1xuICAgIH0sXG5cbi8vIHBvcCB0aGUgcHJldmlvdXNseSBhY3RpdmUgbGV4ZXIgY29uZGl0aW9uIHN0YXRlIG9mZiB0aGUgY29uZGl0aW9uIHN0YWNrXG5wb3BTdGF0ZTpmdW5jdGlvbiBwb3BTdGF0ZSgpIHtcbiAgICAgICAgdmFyIG4gPSB0aGlzLmNvbmRpdGlvblN0YWNrLmxlbmd0aCAtIDE7XG4gICAgICAgIGlmIChuID4gMCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuY29uZGl0aW9uU3RhY2sucG9wKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5jb25kaXRpb25TdGFja1swXTtcbiAgICAgICAgfVxuICAgIH0sXG5cbi8vIHByb2R1Y2UgdGhlIGxleGVyIHJ1bGUgc2V0IHdoaWNoIGlzIGFjdGl2ZSBmb3IgdGhlIGN1cnJlbnRseSBhY3RpdmUgbGV4ZXIgY29uZGl0aW9uIHN0YXRlXG5fY3VycmVudFJ1bGVzOmZ1bmN0aW9uIF9jdXJyZW50UnVsZXMoKSB7XG4gICAgICAgIGlmICh0aGlzLmNvbmRpdGlvblN0YWNrLmxlbmd0aCAmJiB0aGlzLmNvbmRpdGlvblN0YWNrW3RoaXMuY29uZGl0aW9uU3RhY2subGVuZ3RoIC0gMV0pIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmNvbmRpdGlvbnNbdGhpcy5jb25kaXRpb25TdGFja1t0aGlzLmNvbmRpdGlvblN0YWNrLmxlbmd0aCAtIDFdXS5ydWxlcztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmNvbmRpdGlvbnNbXCJJTklUSUFMXCJdLnJ1bGVzO1xuICAgICAgICB9XG4gICAgfSxcblxuLy8gcmV0dXJuIHRoZSBjdXJyZW50bHkgYWN0aXZlIGxleGVyIGNvbmRpdGlvbiBzdGF0ZTsgd2hlbiBhbiBpbmRleCBhcmd1bWVudCBpcyBwcm92aWRlZCBpdCBwcm9kdWNlcyB0aGUgTi10aCBwcmV2aW91cyBjb25kaXRpb24gc3RhdGUsIGlmIGF2YWlsYWJsZVxudG9wU3RhdGU6ZnVuY3Rpb24gdG9wU3RhdGUobikge1xuICAgICAgICBuID0gdGhpcy5jb25kaXRpb25TdGFjay5sZW5ndGggLSAxIC0gTWF0aC5hYnMobiB8fCAwKTtcbiAgICAgICAgaWYgKG4gPj0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuY29uZGl0aW9uU3RhY2tbbl07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gXCJJTklUSUFMXCI7XG4gICAgICAgIH1cbiAgICB9LFxuXG4vLyBhbGlhcyBmb3IgYmVnaW4oY29uZGl0aW9uKVxucHVzaFN0YXRlOmZ1bmN0aW9uIHB1c2hTdGF0ZShjb25kaXRpb24pIHtcbiAgICAgICAgdGhpcy5iZWdpbihjb25kaXRpb24pO1xuICAgIH0sXG5cbi8vIHJldHVybiB0aGUgbnVtYmVyIG9mIHN0YXRlcyBjdXJyZW50bHkgb24gdGhlIHN0YWNrXG5zdGF0ZVN0YWNrU2l6ZTpmdW5jdGlvbiBzdGF0ZVN0YWNrU2l6ZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29uZGl0aW9uU3RhY2subGVuZ3RoO1xuICAgIH0sXG5vcHRpb25zOiB7fSxcbnBlcmZvcm1BY3Rpb246IGZ1bmN0aW9uIGFub255bW91cyh5eSx5eV8sJGF2b2lkaW5nX25hbWVfY29sbGlzaW9ucyxZWV9TVEFSVCkge1xudmFyIFlZU1RBVEU9WVlfU1RBUlQ7XG5zd2l0Y2goJGF2b2lkaW5nX25hbWVfY29sbGlzaW9ucykge1xuY2FzZSAwOi8qIHNraXAgd2hpdGVzcGFjZSAqL1xuYnJlYWs7XG5jYXNlIDE6cmV0dXJuIDM2O1xuYnJlYWs7XG5jYXNlIDI6cmV0dXJuIDIxO1xuYnJlYWs7XG5jYXNlIDM6cmV0dXJuIDIyO1xuYnJlYWs7XG5jYXNlIDQ6cmV0dXJuICctPic7XG5icmVhaztcbmNhc2UgNTpyZXR1cm4gMjU7XG5icmVhaztcbmNhc2UgNjpyZXR1cm4gMjM7XG5icmVhaztcbmNhc2UgNzpyZXR1cm4gMjQ7XG5icmVhaztcbmNhc2UgODpyZXR1cm4gMjY7XG5icmVhaztcbmNhc2UgOTpyZXR1cm4gMzM7XG5icmVhaztcbmNhc2UgMTA6cmV0dXJuIDM0O1xuYnJlYWs7XG5jYXNlIDExOnJldHVybiAzMjtcbmJyZWFrO1xuY2FzZSAxMjpyZXR1cm4gMTA7XG5icmVhaztcbmNhc2UgMTM6cmV0dXJuIDExO1xuYnJlYWs7XG5jYXNlIDE0OnJldHVybiA0ODtcbmJyZWFrO1xuY2FzZSAxNTpyZXR1cm4gNDk7XG5icmVhaztcbmNhc2UgMTY6cmV0dXJuIDIwO1xuYnJlYWs7XG5jYXNlIDE3OnJldHVybiA0NztcbmJyZWFrO1xuY2FzZSAxODpyZXR1cm4gNDI7XG5icmVhaztcbmNhc2UgMTk6cmV0dXJuIDE4O1xuYnJlYWs7XG5jYXNlIDIwOnJldHVybiAnPydcbmJyZWFrO1xuY2FzZSAyMTpyZXR1cm4gNTE7XG5icmVhaztcbmNhc2UgMjI6cmV0dXJuIDQ2O1xuYnJlYWs7XG5jYXNlIDIzOnJldHVybiAyOTtcbmJyZWFrO1xuY2FzZSAyNDpyZXR1cm4gMjc7XG5icmVhaztcbmNhc2UgMjU6cmV0dXJuIDMxO1xuYnJlYWs7XG5jYXNlIDI2OnJldHVybiAzMDtcbmJyZWFrO1xuY2FzZSAyNzpyZXR1cm4gMjg7XG5icmVhaztcbmNhc2UgMjg6cmV0dXJuIDY7XG5icmVhaztcbmNhc2UgMjk6cmV0dXJuIDE0XG5icmVhaztcbmNhc2UgMzA6cmV0dXJuIDE2XG5icmVhaztcbmNhc2UgMzE6cmV0dXJuIDEyXG5icmVhaztcbmNhc2UgMzI6cmV0dXJuIFwicGFyYW1cIlxuYnJlYWs7XG5jYXNlIDMzOnJldHVybiAxMztcbmJyZWFrO1xuY2FzZSAzNDpyZXR1cm4gMzc7XG5icmVhaztcbmNhc2UgMzU6cmV0dXJuIDU7XG5icmVhaztcbn1cbn0sXG5ydWxlczogWy9eKD86XFxzKykvLC9eKD86WzAtOV0rKFxcLlswLTldKyk/XFxiKS8sL14oPzpcXCopLywvXig/OlxcLykvLC9eKD86LT4pLywvXig/Oi0pLywvXig/OlxcKykvLC9eKD86JikvLC9eKD86XFxeKS8sL14oPzpcXCgpLywvXig/OlxcKSkvLC9eKD86JSkvLC9eKD86XFx7KS8sL14oPzpcXH0pLywvXig/OlxcWykvLC9eKD86XFxdKS8sL14oPzpcXC4pLywvXig/OjopLywvXig/OjspLywvXig/OiwpLywvXig/OlxcPykvLC9eKD86IykvLC9eKD86ISkvLC9eKD86Pj0pLywvXig/Oj4pLywvXig/Ojw+KS8sL14oPzo8PSkvLC9eKD86PCkvLC9eKD86PSkvLC9eKD86YXNcXGIpLywvXig/OmNvbnRleHRcXGIpLywvXig/OndpdGhcXGIpLywvXig/OnBhcmFtXFxiKS8sL14oPzpbJF9hLXpBLVrDoC3DusOALcOaXVtfYS16QS1aw6Atw7rDgC3DmjAtOV0qKS8sL14oPzpcIihcXFxcLnxbXlwiXSkqXCIpLywvXig/OiQpL10sXG5jb25kaXRpb25zOiB7XCJJTklUSUFMXCI6e1wicnVsZXNcIjpbMCwxLDIsMyw0LDUsNiw3LDgsOSwxMCwxMSwxMiwxMywxNCwxNSwxNiwxNywxOCwxOSwyMCwyMSwyMiwyMywyNCwyNSwyNiwyNywyOCwyOSwzMCwzMSwzMiwzMywzNCwzNV0sXCJpbmNsdXNpdmVcIjp0cnVlfX1cbn0pO1xucmV0dXJuIGxleGVyO1xufSkoKTtcbnBhcnNlci5sZXhlciA9IGxleGVyO1xuZnVuY3Rpb24gUGFyc2VyICgpIHtcbiAgdGhpcy55eSA9IHt9O1xufVxuUGFyc2VyLnByb3RvdHlwZSA9IHBhcnNlcjtwYXJzZXIuUGFyc2VyID0gUGFyc2VyO1xucmV0dXJuIG5ldyBQYXJzZXI7XG59KSgpO1xuXG5cbmlmICh0eXBlb2YgcmVxdWlyZSAhPT0gJ3VuZGVmaW5lZCcgJiYgdHlwZW9mIGV4cG9ydHMgIT09ICd1bmRlZmluZWQnKSB7XG5leHBvcnRzLnBhcnNlciA9IHJMYW5nO1xuZXhwb3J0cy5QYXJzZXIgPSByTGFuZy5QYXJzZXI7XG5leHBvcnRzLnBhcnNlID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gckxhbmcucGFyc2UuYXBwbHkockxhbmcsIGFyZ3VtZW50cyk7IH07XG5leHBvcnRzLm1haW4gPSBmdW5jdGlvbiBjb21tb25qc01haW4oYXJncykge1xuICAgIGlmICghYXJnc1sxXSkge1xuICAgICAgICBjb25zb2xlLmxvZygnVXNhZ2U6ICcrYXJnc1swXSsnIEZJTEUnKTtcbiAgICAgICAgcHJvY2Vzcy5leGl0KDEpO1xuICAgIH1cbiAgICB2YXIgc291cmNlID0gcmVxdWlyZSgnZnMnKS5yZWFkRmlsZVN5bmMocmVxdWlyZSgncGF0aCcpLm5vcm1hbGl6ZShhcmdzWzFdKSwgXCJ1dGY4XCIpO1xuICAgIHJldHVybiBleHBvcnRzLnBhcnNlci5wYXJzZShzb3VyY2UpO1xufTtcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiByZXF1aXJlLm1haW4gPT09IG1vZHVsZSkge1xuICBleHBvcnRzLm1haW4ocHJvY2Vzcy5hcmd2LnNsaWNlKDEpKTtcbn1cbn0iLCIvKmpzbGludCBub2RlOiB0cnVlICovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbmZ1bmN0aW9uIFN5bWJvbFRhYmxlKCkge1xyXG4gICAgdGhpcy5zeW1ib2xzID0gW107XHJcbiAgICB0aGlzLmZ1bmN0aW9ucyA9IFtdO1xyXG4gICAgdGhpcy5mdW5jdGlvblN5bWJvbFNlZWQgPSAwO1xyXG59XHJcblxyXG5mdW5jdGlvbiBTeW1ib2wobmFtZSwgdHlwZSwgdGFibGUpIHtcclxuICAgIHRoaXMuZGVmaW5pdGlvbiA9IG5hbWU7XHJcbiAgICB0aGlzLnR5cGUgPSB0eXBlO1xyXG4gICAgdGhpcy5wcml2YXRlRGVmaW5pdGlvbiA9IG5hbWUgKyBcIl9cIiArIHR5cGU7XHJcbiAgICB0aGlzLnRhYmxlID0gdGFibGU7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIEZ1bmN0aW9uU3ltYm9sKG5hbWUsIHN5bWJvbE5hbWUsIGNhbGxTaWduYXR1cmUpIHtcclxuICAgIHRoaXMubmFtZSA9IG5hbWU7XHJcbiAgICB0aGlzLmNhbGxTaWduYXR1cmUgPSBjYWxsU2lnbmF0dXJlO1xyXG4gICAgdGhpcy5zeW1ib2xOYW1lID0gc3ltYm9sTmFtZTtcclxufVxyXG5cclxuRnVuY3Rpb25TeW1ib2wucHJvdG90eXBlLmdldEpzRGVmaW5pdGlvbiA9IGZ1bmN0aW9uICgpIHtcclxuICAgIHJldHVybiBcInZhciBcIiArIHRoaXMuc3ltYm9sTmFtZSArIFwiID0gXCIgKyB0aGlzLmNhbGxTaWduYXR1cmUgKyBcIjtcIjtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMuU3ltYm9sVGFibGUgPSBTeW1ib2xUYWJsZTtcclxubW9kdWxlLmV4cG9ydHMuU3ltYm9sID0gU3ltYm9sO1xyXG5cclxuU3ltYm9sLnByb3RvdHlwZS50cnlHZXRHbG9iYWwgPSBmdW5jdGlvbihuYW1lKSB7XHJcbiAgICAgcmV0dXJuICcoKHR5cGVvZiAkLmdbXCInKyBuYW1lICsnXCJdICE9IFwidW5kZWZpbmVkXCIpID8gJC5nW1wiJyArIG5hbWUgKydcIl0gOiB7fSknIFxyXG59XHJcblxyXG5TeW1ib2wucHJvdG90eXBlLmdldERlY2xhcmF0aW9uID0gZnVuY3Rpb24gKCkge1xyXG4gICAgaWYgKHRoaXMudHlwZSA9PSBcIlZcIikge1xyXG4gICAgICAgIHZhciB0b2tlbnMgPSB0aGlzLmRlZmluaXRpb24uc3BsaXQoXCIuXCIpO1xyXG5cclxuXHJcbiAgICAgICAgdmFyIGRlY2xhcmF0aW9uID0gXCJ2YXIgXCIgKyB0b2tlbnNbMF0gKyBcIiA9IFwiICsgdGhpcy50cnlHZXRHbG9iYWwodG9rZW5zWzBdKSArIFwiO1xcblwiO1xyXG4gICAgICAgIHZhciBjb21wbGV0ZU5hbWUgPSB0b2tlbnNbMF07XHJcblxyXG4gICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgdG9rZW5zLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGNvbXBsZXRlTmFtZSArPSBcIi5cIiArIHRva2Vuc1tpXTtcclxuICAgICAgICAgICAgZGVjbGFyYXRpb24gKz0gJ2lmICggdHlwZW9mICcgKyBjb21wbGV0ZU5hbWUgKyAnID09IFwidW5kZWZpbmVkXCIpICcgKyBjb21wbGV0ZU5hbWUgKyAnID0ge307XFxuJztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBkZWNsYXJhdGlvbjtcclxuICAgIH1cclxuXHJcbiAgICBpZiAodGhpcy50eXBlID09IFwiR1wiKSByZXR1cm4gXCJpZiAoISQuZy5cIiArIHRoaXMuZGVmaW5pdGlvbiArIFwiKSAkLmcuXCIgKyB0aGlzLmRlZmluaXRpb24gKyBcIiA9IHt9O1xcblwiXHJcbiAgICBpZiAodGhpcy50eXBlID09IFwiVFwiKSByZXR1cm4gXCJ2YXIgXCIgKyB0aGlzLmRlZmluaXRpb24gKyBcIiA9ICQudGFibGUoJ1wiKyB0aGlzLmRlZmluaXRpb24gK1wiJyk7XFxuXCI7XHJcbiAgICByZXR1cm4gXCJcIjtcclxufVxyXG5cclxuU3ltYm9sVGFibGUucHJvdG90eXBlLmdldFJvb3RTeW1ib2xzID0gZnVuY3Rpb24gKCkge1xyXG4gICAgdmFyIHJldCA9IFtdO1xyXG4gICAgZm9yICh2YXIgcyA9IDA7IHMgPCB0aGlzLnN5bWJvbHMubGVuZ3RoOyBzKyspIHtcclxuICAgICAgICB2YXIgc3ltYm9sID0gdGhpcy5zeW1ib2xzW3NdO1xyXG4gICAgICAgIGlmICgoc3ltYm9sLnR5cGUgPT0gXCJWXCIpICYmIHJldC5pbmRleE9mKHN5bWJvbC5kZWZpbml0aW9uKSA8IDApIHtcclxuICAgICAgICAgICAgaWYgKHN5bWJvbC5kZWZpbml0aW9uLmluZGV4T2YoXCIuXCIpID4gMClcclxuICAgICAgICAgICAgICAgIHJldC5wdXNoKHN5bWJvbC5kZWZpbml0aW9uLnNwbGl0KCcuJylbMF0pO1xyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICByZXQucHVzaChzeW1ib2wuZGVmaW5pdGlvbik7XHJcbiAgICAgICAgfSBcclxuICAgIH1cclxuICAgIHJldHVybiByZXQ7XHJcbn1cclxuXHJcblN5bWJvbFRhYmxlLnByb3RvdHlwZS5yZWdpc3RlclN5bWJvbCA9IGZ1bmN0aW9uIChuYW1lLCB0eXBlLCB0YWJsZSkge1xyXG4gICAgdGhpcy5hZGRTeW1ib2wobmV3IFN5bWJvbChuYW1lLCB0eXBlLCB0YWJsZSkpO1xyXG59XHJcblxyXG5TeW1ib2xUYWJsZS5wcm90b3R5cGUuYWRkU3ltYm9sID0gZnVuY3Rpb24gKHN5bWJvbCkge1xyXG4gICAgaWYgKCF0aGlzLmNvbnRhaW5zU3ltYm9sKHN5bWJvbCkpIHtcclxuICAgICAgICB0aGlzLnN5bWJvbHMucHVzaChzeW1ib2wpO1xyXG4gICAgICAgIC8vY29uc29sZS5sb2coJ3JlZ2lzdGVyaW5nIHN5bWJvbCAnICsgc3ltYm9sLmRlZmluaXRpb24gKyAnICcgKyBzeW1ib2wudHlwZSArICcgdGFibGU6ICcgKyBzeW1ib2wudGFibGUpO1xyXG4gICAgfVxyXG59XHJcblxyXG5TeW1ib2xUYWJsZS5wcm90b3R5cGUuc2VhcmNoU3ltYm9sID0gZnVuY3Rpb24gKG5hbWUsIHR5cGUpIHtcclxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5zeW1ib2xzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuc3ltYm9sc1tpXS5kZWZpbml0aW9uID09PSBuYW1lKSB7XHJcbiAgICAgICAgICAgIGlmICghdHlwZSkgcmV0dXJuIHRoaXMuc3ltYm9sc1tpXTtcclxuICAgICAgICAgICAgZWxzZSBpZiAodHlwZSAmJiB0aGlzLnN5bWJvbHNbaV0udHlwZSA9PT0gdHlwZSkgcmV0dXJuIHRoaXMuc3ltYm9sc1tpXTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gbnVsbDtcclxufVxyXG5cclxuU3ltYm9sVGFibGUucHJvdG90eXBlLmNvbnRhaW5zU3ltYm9sID0gZnVuY3Rpb24gKHN5bWJvbCkge1xyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnN5bWJvbHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICBpZiAodGhpcy5zeW1ib2xzW2ldLnByaXZhdGVEZWZpbml0aW9uID09PSBzeW1ib2wucHJpdmF0ZURlZmluaXRpb24pXHJcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG59XHJcblxyXG5TeW1ib2xUYWJsZS5wcm90b3R5cGUucmVnaXN0ZXJGdW5jdGlvbiA9IGZ1bmN0aW9uIChuYW1lLCBjYWxsU2lnbmF0dXJlKSB7XHJcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuZnVuY3Rpb25zLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuZnVuY3Rpb25zW2ldLmNhbGxTaWduYXR1cmUgPT09IGNhbGxTaWduYXR1cmUpXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmZ1bmN0aW9uc1tpXS5zeW1ib2xOYW1lO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICB2YXIgc3ltYm9sTmFtZSA9IFwidmFyXCIgKyBuYW1lICsgXCJcIiArICsrdGhpcy5mdW5jdGlvblN5bWJvbFNlZWQ7XHJcbiAgICB2YXIgZiA9IG5ldyBGdW5jdGlvblN5bWJvbChuYW1lLCBzeW1ib2xOYW1lLCBjYWxsU2lnbmF0dXJlKTtcclxuICAgIHRoaXMuZnVuY3Rpb25zLnB1c2goZik7XHJcbiAgICByZXR1cm4gc3ltYm9sTmFtZTtcclxuXHJcbn1cclxuXHJcblN5bWJvbFRhYmxlLnByb3RvdHlwZS5nZXRGdW5jdGlvbnNKc1NldCA9IGZ1bmN0aW9uICgpIHtcclxuICAgIHZhciBqcyA9IFwiXCI7XHJcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuZnVuY3Rpb25zLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAganMgKz0gdGhpcy5mdW5jdGlvbnNbaV0uZ2V0SnNEZWZpbml0aW9uKCkgKyBcIlxcblwiO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGpzO1xyXG59IFxyXG5cclxuU3ltYm9sVGFibGUucHJvdG90eXBlLmNsZWFyRnVuY3Rpb25zID0gZnVuY3Rpb24gKCkge1xyXG4gICAgdGhpcy5mdW5jdGlvbnMuc3BsaWNlKDAsIHRoaXMuZnVuY3Rpb25zLmxlbmd0aCk7XHJcbn0iXX0=
