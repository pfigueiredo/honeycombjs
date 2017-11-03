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
exports.appVersion = appVersion;
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