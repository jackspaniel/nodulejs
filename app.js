// "node app" runs the demo app

var express = require('express');
var bodyParser = require('body-parser');
var demoApp = require('./demo/demoApp');

var app = express();
app.use(bodyParser.json());
demoApp(app, {debugToConsole: false});
app.listen(3000);
