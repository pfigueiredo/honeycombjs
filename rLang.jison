%{
    var exp = require("./expressions");
%}

%options flex case-insensitive

/* lexical grammar */
%lex
%%
\s+                   {/* skip whitespace */}
[0-9]+("."[0-9]+)?\b  {return 'NUMBER';}
"*"                   {return '*';}
"/"                   {return '/';}
"->"                  {return '->';}
"-"                   {return '-';}
"+"                   {return '+';}
"&"                   {return '&';}
"^"                   {return '^';}
"("                   {return '(';}
")"                   {return ')';}
"%"                   {return '%';}
"{"                   {return '{';}
"}"                   {return '}';}
"["                   {return '[';}
"]"                   {return ']';}
"."                   {return '.';}
":"                   {return ':';}
";"                   {return ';';}
","                   {return ',';}
"?"                   {return '?'}
"#"                   {return '#';}
"!"                   {return '!';}
">="                  {return '>=';}
">"                   {return '>';}
"<>"                  {return '<>';}
"<="                  {return '<=';}
"<"                   {return '<';}
"="                   {return '=';}
"as"                  {return 'as'}
"context"             {return 'context'}
"with"                {return 'with'}
"param"               {return "param"}
/*"AND"               {return 'AND';}
[A-Z]                 {return 'LETTER; }
"OR"                  {return 'OR';}
"NOT"                 {return 'NOT';}*/
[$_a-zA-Zà-úÀ-Ú][_a-zA-Zà-úÀ-Ú0-9]*  {return 'IDENTIFIER';}
\"(\\.|[^"])*\"       {return 'STRING';}
<<EOF>>               {return 'EOF';}

/lex

/* operator associations and precedence */

%left 'AND' 'OR' 'XOR'
%left 'NOT'
%left '>' '<' '>=' '<=' '<>' '='
%left '+' '-' '&'
%left '*' '/'
%left '^'
%left '%'
%left UMINUS

%start program

%% /* language grammar */


program 
  : assignList EOF          { return exp.CreateFunction($1); } 
  | '=' expression EOF 	    { return exp.CreateFunction( new exp.Program([new exp.AssignExpression(new exp.IdentifierExpression("_R"), $2)])); }
  ;

assignList
  : assignList assignExpression { if ($2) $1.AddExpression($2); $$ = $1; }
  | assignExpression            { $$ = new exp.Program([ $1 ]); }
  ;

assignExpression
  : tableRange '=' '{' expression '}'   { $$ = new exp.AssignExpression($1, $4); }
  | tableRange '=' '{' expression '}' 'with' IDENTIFIER as IDENTIFIER  { $$ = new exp.AssignExpression($1, $4, $7, $9); }
  | variable '=' '{' expression '}'     { $$ = new exp.AssignExpression($1, $4); }
  | 'context' '{' variableDefList '}' { $$ = new exp.VariableDefListExpression($3); }
  ;

variableDefList 
  : variableDefList ',' variableDef { $1.push($3); $$ = $1; }
  | variableDef { $$ = [ $1 ]; }
  ;

variableDef
  : IDENTIFIER { $$ = $1; }
  | IDENTIFIER '.' IDENTIFIER { $$ = $1 + '.' + $3 }
  ;

variable 
  : IDENTIFIER { $$ = new exp.IdentifierExpression($1); }
  | IDENTIFIER '.' IDENTIFIER { $$ = new exp.IdentifierExpression($1, $3); }
  ;

expression
  : expression '*' expression {$$ = new exp.OperatorExpression($1, $3, '*');}
  | expression '/' expression {$$ = new exp.OperatorExpression($1, $3, '/');}
  | expression '+' expression {$$ = new exp.OperatorExpression($1, $3, '+');}
  | expression '&' expression {$$ = new exp.OperatorExpression($1, $3, '+');}
  | expression '-' expression {$$ = new exp.OperatorExpression($1, $3, '-');}
  | expression '^' expression {$$ = new exp.PowExpression($1, $3); }

  /*| expression 'AND' expression {$$ = new exp.OperatorExpression($1, $3, '&&');}
  | expression 'OR' expression  {$$ = new exp.OperatorExpression($1, $3, '||');}
  | 'NOT' expression            {$$ = new exp.NotExpression($2);}*/

  | expression '>' expression  {$$ = new exp.OperatorExpression($1, $3, '>');}
  | expression '<' expression  {$$ = new exp.OperatorExpression($1, $3, '<');}
  | expression '>=' expression {$$ = new exp.OperatorExpression($1, $3, '>=');}
  | expression '<=' expression {$$ = new exp.OperatorExpression($1, $3, '<=');}
  | expression '<>' expression {$$ = new exp.OperatorExpression($1, $3, '!=');}
  | expression '=' expression  {$$ = new exp.OperatorExpression($1, $3, '==');}
  
  | '-' expression          {$$ = new exp.NegativeExpression($2);}
  | expression '%'          {$$ = new exp.PercentExpression($1);}
  | '(' expression ')'      {$$ = new exp.ParentisisExpression($2);}
  | atomExpression { $$ = $1; }
  ;

atomExpression 
  : tableRange                        { $$ = $1; } 
  | NUMBER { $$ = new exp.NumberExpression(yytext); }
  | STRING { $$ = new exp.StringExpression(yytext); } /* quotes and everything */
  | range                             { $$ = $1; }
  | IDENTIFIER '(' fnParams ')' {$$ = new exp.FunctionCallExpression($1, $3);}
  | IDENTIFIER '.' IDENTIFIER '(' fnParams ')' {$$ = new exp.FunctionCallExpression($1 + '_' + $3, $5);}
  | arrayExpression                   { $$ = $1; }
  | variable { 
      $$ = $1;
      /*var signature = $1.getSignature()[0];
      if (signature.indexOf('.') > 0) {
        signature = signature.split('.')[0];
      }

      if (variables.indexOf(signature) >= 0) { 
        $$ = $1; 
      } else { 
        $$ = $1.toTableExpression();
        //console.log($1.getSignature());
      }*/ 
  };

arrayExpression
  : '{' arrayList '}' { $$ = new exp.ArrayExpression($2); }
  ;

arrayList
  : arrayList ';' arrayRow { $$ = ($1.row) ? [$1] : $1; $$.push($3); $$.mdRange = true; }
  | arrayRow { $$ = $1; }
  ;

arrayRow
  : arrayRow ',' arrayValue { $1.push($3); $1.row = true; $$ = $1; }
  | arrayValue { $$ = [ $1 ]; }
  ;

arrayValue
  : NUMBER { $$ = Number(yytext); }
  | '-' NUMBER { $$ = Number(yytext) * -1; }
  | STRING { $$ = yytext; } /* quotes and everything */
  ;

fnParams 
  : fnParams ',' expression { $1.push($3); $$ = $1; }
  | expression { $$ = [ $1 ];}
  | { $$ = []; }
  ;

range
  : rangePart { $$ = $1 }
  | IDENTIFIER '!' rangePart { $3.table = $1; $$ = $3; }
  ;

rangePart
  : IDENTIFIER ':' IDENTIFIER 
    { $$ = new exp.RangeExpression(null, $1, $3, 0, Number.MAX_VALUE); } 
  ;

tableRange
  : '[' IDENTIFIER ']' { $$ = new exp.ColumnExpression("table", $2); }
  | IDENTIFIER '[' IDENTIFIER ']' { $$ = new exp.ColumnExpression($1, $3); }

  | '[' IDENTIFIER '.' IDENTIFIER ']' { $$ = new exp.ColumnExpression("table", $4, $2) }
  | IDENTIFIER '[' IDENTIFIER '.' IDENTIFIER ']' { $$ = new exp.ColumnExpression($1, $5, $3); }

  | '[' IDENTIFIER '[' rowNumber ']' ']' { $$ = new exp.CellExpression(null, $2, $4); }
  | '[' IDENTIFIER '[' rowNumber ':' rowNumber ']' ']' { $$ = new exp.RangeExpression(null, $2, $2, $4, $6); }

  | IDENTIFIER '[' rowNumber ']' { $$ = new exp.CellExpression(null, $1, $3); }
  | IDENTIFIER '[' rowNumber ':' rowNumber ']' { $$ = new exp.RangeExpression(null, $1, $1, $3, $5); }

  | IDENTIFIER '[' IDENTIFIER '[' rowNumber ']' ']' { $$ = new exp.CellExpression($1, $3, $5); }
  | IDENTIFIER '[' IDENTIFIER '[' rowNumber ':' rowNumber ']' ']' { $$ = new exp.RangeExpression($1, $3, $3, $5, $7); }

  | IDENTIFIER '!' IDENTIFIER '[' rowNumber ']' ']' { $$ = new exp.CellExpression($1, $3, $5); }
  | IDENTIFIER '!' IDENTIFIER '[' rowNumber ':' rowNumber ']' ']' { $$ = new exp.RangeExpression($1, $3, $3, $5, $7); }
  ;


rowNumber
  : NUMBER { $$ = new exp.RowNumber($1, '+'); }
  | '+' NUMBER { $$ = new exp.RowNumber($2, $1); }
  | '-' NUMBER { $$ = new exp.RowNumber($2, $1); }
  | '#' NUMBER { $$ = new exp.RowNumber($2, '$'); }
  ;




