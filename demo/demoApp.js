// simplistic example application for nodulejs

var nodulejs = require('nodulejs');

module.exports = function(app) {  
  // nodulejs finds and loads nodules based on config below
  // then registers routes with express based on nodule route, routeIndex and routeVerb
  nodulejs(app, config); 
};

// override nodulejs defaults
var config =  {

  dirs: [
    { path: '/demo', exclude: ['demoApp.js', '.unit.js'] }, // exclude can be full or partal match
    // multiple dirs ok
  ],

  // also can use customDebugger property with functin of format: function(identifier) { return function(msg){...} }
  debugToConsole: true, 
  
  // config used to override nodule defaults at the app-level
  // NOTE: this will be overridden by any properties specified at the nodule-level (nodule->app->nodulejs framework)
  noduleDefaults: {
    // example of using a static array of middlewares
    // middlewares: [doBusinessLogic, sendJsonResponse],
    
    // example of using a function to return middlewares based on nodule properties
    middlewares: function(nodule) {
      if (nodule.route.indexOf('/json/') > -1) 
        return [doBusinessLogic, sendJsonResponse];
      else  
        return [doBusinessLogic, sendHtmlResponse];
    },
  
    // example of adding custom property
    templateName: null,

  },
};

function doBusinessLogic(req, res, next) {
  console.log('middleware doBusinessLogic executed for: ' + req.nodule.name);
  next();
}

function sendJsonResponse(req, res, next) {
  console.log('middleware sendJsonResponse executed for:'  + req.nodule.name);
  res.send({msg:'middleware finished for nodule: ' + req.nodule.name});
}

function sendHtmlResponse(req, res, next) {
  console.log('middleware sendHtmlResponse executed for:' + req.nodule.name);
  res.render(req.nodule.templateName, {msg:'middleware finished for nodule: ' + req.nodule.name});
}
