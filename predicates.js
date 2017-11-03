
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