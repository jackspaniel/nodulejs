// simplistic example application for nodulejs
// see yukon for fully fleshed-out implementation (https://github.com/jackspaniel/yukon)

var path = require('path');
var _ = require('lodash');
var nodulejs = require('../nodule');
var debug;

module.exports = function(app, appConfig) {  
  // 1) finds and loads nodules based on config below
  // 2) registers routes with express based on nodule properties: route, routeIndex, routeVerb and middlewares
  var mergedConfig = _.merge(config, appConfig || {});
  nodulejs(app, mergedConfig); 

  debug = (appConfig.customDebug) 
          ? appConfig.customDebug('demoApp')
          : function(msg) { if (mergedConfig.debugToConsole) console.log('nodule demoApp: ' + msg); };
};

// since we're not sure where this demo app is being invoked
var myDir = __filename.substr(0,__filename.length-11);

// override nodulejs defaults
var config =  {

  dirs: [
    // path(s) to look for your nodules 
    { path: myDir, exclude: ['demoApp.js', '.test.js'] }, // exclude can be full or partal match
    
    // multiple dirs ok
  ],

  // set to true or or use customDebug: function(identifier) { return function(msg){... your debug function here ...} }
  debugToConsole: true, 
  
  // config used to override nodule defaults at the app-level
  // NOTE: these properties will be overridden by any properties specified at the nodule-level (nodule properties->app properties->nodulejs framework default properties)
  noduleDefaults: {
    // example of using a static array of middlewares
    // middlewares: [doBusinessLogic, sendJsonResponse],
    
    // example of using a function to return middlewares based on nodule properties
    middlewares: function(nodule) {
      var strRoute = nodule.route.toString();

      if (nodule.routeVerb === 'post') 
        return [doPreForm, doPostForm, sendJsonResponse];
      else if (strRoute.indexOf('/json') === 0) 
        return [doBusinessLogic, sendJsonResponse];
      else  
        return [doBusinessLogic, sendHtmlResponse];
    },
  
    // below are examples of adding custom properties outside of nodulejs
    templateName: 'default.jade',

    templateDir: null,

    // example of adding nodule-level business logic function
    doNoduleBusinessLogic: function(req, res) { },
  },
};


////////////////////////////////////////////////////////////////////
/// middlwares examples for simple HTML and JSON request/response //
////////////////////////////////////////////////////////////////////
function doBusinessLogic(req, res, next) {
  debug('doBusinessLogic middleware executed for: ' + req.nodule.name);

  // app-level business logic can go here

  // call nodule-level business logic
  req.nodule.doNoduleBusinessLogic(req, res);

  // app-level business logic can also go here

  next();
}

function sendJsonResponse(req, res, next) {
  debug('sendJsonResponse middleware executed for: '  + req.nodule.name);
  
  // app-level presentation logic, or stuff like reporting can go here

  res.send({
    msg: req.nodule.customMsg || 'all middleware finished for nodule: ' + req.nodule.name,
    id: req.nodule.customId || req.params.id, 
    data: req.nodule.responseData
  });
}

function sendHtmlResponse(req, res, next) {
  debug('sendHtmlResponse middleware executed for: ' + req.nodule.name + ', template:' + req.nodule.templateName);

  // app-level presentation logic, or stuff like reporting can go here

  req.nodule.templatePath = path.join((req.nodule.templateDir || req.nodule.path), req.nodule.templateName);

  res.render(req.nodule.templatePath, {msg:'all middleware finished for nodule: ' + req.nodule.name});
}

///////////////////////////////////////////////////////////////////////////////////////
/// middleware examples for typical form request/response with simualted going to DB //
/// 
/// see ./json/submitForm.js for implementation                                       //
///////////////////////////////////////////////////////////////////////////////////////
function doPreForm(req, res, next) {
  debug('doPreForm middleware executed for: ' + req.nodule.name);

  // call nodule-level pre-form business logic
  req.nodule.doPreFormBusinessLogic(req, res);

  // simulating async call to DB/cache/API/etc
  makeDbCall({
    params: req.nodule.dbParams, 
    callback: function(err, response) { 
      req.nodule.responseData = response;
      next(); 
    }
  });
}

// DB simulator, see /json/formSubmit.js
function makeDbCall(call) {
  var response = (call.params.param1) ? 'valid data, param1='+call.params.param1 : 'missing param1, please resubmit';
  call.callback(null, {dbMsg:response});
}

function doPostForm(req, res, next) {
  debug('doPostForm middleware executed for: ' + req.nodule.name);

  // call nodule-level post-form business logic
  req.nodule.doPostFormBusinessLogic(req, res);

  next();
}

