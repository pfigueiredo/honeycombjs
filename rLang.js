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