const express = require('express')
const app = express()
var bodyParser = require('body-parser');
var SymbolTable = require("./symbolTable");
var DataTable = require("./dataTable");
var Context = require("./context");
var index = require("./index.js");
var requestNum = 0;

var allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
}

// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({limit:'5mb'}));
app.use(allowCrossDomain);

var router = express.Router();

function measureTime(start) {
    if (!process || !process.hrtime) return [0,-1]
    if ( !start ) return process.hrtime();
    var end = process.hrtime(start);
    return end;
}

function getContentLenght(req) {
    var size 
    var units = ['B', 'KB', 'MB', 'GB', 'TB']; 

    var bytes = Math.max(req.get("content-length"), 0);
    pow = Math.floor((bytes ? Math.log(bytes) : 0) / Math.log(1024)); 
    pow = Math.min(pow, units.length - 1); 
    bytes /= (1 << (10 * pow)); 

    return (Math.round(bytes * 100) / 100) + ' ' + units[pow]; 
}


router.post('/calculate', function (req, res) {
    var startTime = measureTime();
    console.log('accepting calculation request from: ' + req.connection.remoteAddress + " batch size: " + getContentLenght(req) + " Id:" + ++requestNum);
    var data = req.body;
    var ret = index.handler(data, null, function(state, ret) {
        var totalTime = measureTime(startTime);
        console.log('request Id:' + requestNum + ' completed in ' + (totalTime[0] + totalTime[1] / 1e9));
        res.json(ret);
    });
});

app.get('/', function (req, res) {
  res.json({ 
      message: 'Honeycomb DSL (tm) microservice ready.',
      motd: 'If I were again beginning my studies, I would follow the advice of Plato and start with mathematics.'
    });
});

app.use('/api', router);

app.listen(6555, function () {


    console.log('\n"If I were again beginning my studies, I would follow the advice of Plato and start with mathematics."\n');

    var logo = "";
    logo += " █╗  █╗ ████╗ █╗   █╗█████╗█╗    █╗ █████╗ ████╗ █╗    █╗████╗ \n";
    logo += " █║  █║█╔═══█╗██╗  █║█╔═══╝╚█╗  █╔╝█╔════╝█╔═══█╗██╗  ██║█╔══█╗\n";
    logo += " █████║█║   █║█╔█╗ █║████╗  ╚█╗█╔╝ █║     █║   █║█╔█ █╔█║████╔╝\n";
    logo += " █╔══█║█║   █║█║╚█╗█║█╔══╝   ╚█╔╝  █║     █║   █║█║╚█╔╝█║█╔══█╗\n";
    logo += " █║  █║╚████╔╝█║ ╚██║█████╗   █║   ╚█████╗╚████╔╝█║ ╚╝ █║████╔╝\n";
    logo += " ╚╝  ╚╝ ╚═══╝ ╚╝  ╚═╝╚════╝   ╚╝    ╚════╝ ╚═══╝ ╚╝    ╚╝╚═══╝ DSL\n";

    console.log(logo);
    console.log('Honeycomb DSL (tm) microservice (version ' + index.appVersion + ') ready and listening on port 6555');
    console.log('Calculation requests should be posted to ~/api/calculate please check the documentation for more details\n');

})

