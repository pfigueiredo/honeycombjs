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