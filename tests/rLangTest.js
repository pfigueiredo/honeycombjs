'use strict'

var parser = require("../rLang").parser;
var assert = require('assert');

describe('Parse', function () {

    it ('should parse strings', function () {
	    let expression = '';
        expression += ' A = {"Foo"}';
        expression += ' A = {"Bar"}';
        expression += ' A = {"Foo Bar"}';
        expression += ' A = {"Foo \\" Bar"}';   
        var fn = parser.parse(expression);
        assert(true); 
    });

    it ('should parse numbers', function () {
	    let expression = '';
        expression += ' A = {"1"}';
        expression += ' A = {"10"}';
        expression += ' A = {"10.11"}';   
        var fn = parser.parse(expression);
        assert(true); 
    });

    it ('should parse identifiers', function () {
	    let expression = '';
        expression += ' A = {Var}';
        expression += ' A = {Foo}';
        expression += ' A = {Foo123}';
        expression += ' A = {_Foo321}';   
        var fn = parser.parse(expression);
        assert(true); 
    });

    it ('should parse table columns', function () {
	    let expression = '';
        expression += ' A = { [column]   }';
        expression += ' A = {Table[Dia]}';   
        var fn = parser.parse(expression);
        assert(true); 
    });

    it ('should parse table cells', function () {
	    let expression = '';
        expression += ' A = {[Row[1]]}';
        expression += ' A = {[Row[+1]]}';
        expression += ' A = {[Row[-1]]}';
        expression += ' A = {[Row[#1]]}';
        expression += ' A = {Table[Row[1]]}';
        expression += ' A = {Table[Row[+1]]}';
        expression += ' A = {Table[Row[-1]]}';
        expression += ' A = {Table[Row[#1]]}';  
        var fn = parser.parse(expression);
        assert(true); 
    });

    it ('should parse table ranges', function () {
	    let expression = '';
        expression += ' A = {[Row[1:2]]}';
        expression += ' A = {Table[Row[1:2]]}';
           
        var fn = parser.parse(expression);

        //console.log(fn.toString());

        assert(true); 
    });

    it ('should parse ranges', function () {
	    let expression = '';
        expression += ' A = {Row:Row}';
        expression += ' A = {$Row:$Row}';
        expression += ' A = {C12:C13}';
        expression += ' A = {Table!C12:C13}';
        expression += ' A = {$Table!C12:C13}';
        expression += ' A = {$Table!$C12:$C13}';
        var fn = parser.parse(expression);
        assert(true); 
    });

    it ('should parse arithmetic expressions', function () {
	    let expression = '';
        expression += ' A = {1 + 1}';
        expression += ' A = {1 - 1}';
        expression += ' A = {1 * 1}';
        expression += ' A = {1 / 1}';
        expression += ' A = {1 * 1%}';
        expression += ' A = {1 * -1}';
        expression += ' A = {-1}';
        expression += ' A = {1 + 1 * 2 / 2 - 3}';
        expression += ' A = {1 + 1 * (2 / 2) - 3}';
        var fn = parser.parse(expression);
        assert(true); 
    });

    it ('should parse logic expressions', function () {
	    let expression = '';
        expression += ' A = {1 > 1}';
        expression += ' A = {1 >= 1}';
        expression += ' A = {1 < 1}';
        expression += ' A = {1 <= 1}';
        expression += ' A = {1 <> 1}';
        expression += ' A = {1 = 1}';
        // expression += ' A = {NOT(1 = 1)}';
        // expression += ' A = {1 > 1 AND 2 = 2 OR 3 > 2}';
        // expression += ' A = {1 > 1 AND (2 = 2 OR 3 > 2)}';
        // expression += ' A = {1 > 1 AND NOT (2 = 2 OR 3 > 2)}';
        
        var fn = parser.parse(expression);
        assert(true); 
    });

    it ('should parse array constant expressions', function () {
	    let expression = '';
        expression += ' A = { {1} }';
        expression += ' A = { {1, 2, 3, 4} }';
        expression += ' A = { {1, 2, 3, 4; 1, 2, 3, 4; 1, 2, 3, 4 } }';
        
        var fn = parser.parse(expression);
        assert(true); 
    });

});


