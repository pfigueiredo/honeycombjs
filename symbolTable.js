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