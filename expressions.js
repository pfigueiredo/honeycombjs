
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