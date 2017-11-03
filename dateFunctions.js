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