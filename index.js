 glob = require('glob');
var path = require('path');
var _ = require('lodash');

module.exports = function(app, appConfig, customDebug) {

  var debug = customDebug || function(){};

  var seedModules = [], routes = {};

  var config = {
    // NOTE: the three route config params below must be specified in the module init method, they cannot be mutated at request-time
    // REQUIRED, must be unique within express app, can be an array of multiple routes
    route: null,

    // get/post/put/delete
    routeVerb: 'get',

    // use to load routes before or after main group (use negative #s for to load route first - like z-index)
    routeIndex: 0,
    
    debugToConsole: false
  };

  var defaultConfig = _.extend(_.cloneDeep(config), appConfig);

  // TODO - look for a cleaner way to do this inside the modules
  app.initModule = initModule;
  
  return {
    seedModules: seedModules,
    loadModules: loadModules,
    registerRoutes: registerRoutes
  };
  
  function loadModules(dir, exclude) {
    var root = dir || process.cwd(); // TOOD - should this be process.cwd() + '/app' ?
    glob.sync('./**/*.js', { cwd: root })
      .filter(doesntMatch.apply(this, exclude))
      .forEach(function(module) { require(path.join(root, module))(app); });
  }

  function initModule(file, config) {
    var seedModule = _.extend(_.cloneDeep(defaultConfig), config); // merge config properties onto default config
    seedModule.path = path.dirname(file);
    seedModule.name = path.basename(file, '.js');

    // modules can have multiple routes
    var routeArray = (typeof seedModule.route === 'string') || (seedModule.route instanceof RegExp) ? [seedModule.route] : seedModule.route;
    _.each(routeArray, function(routePath) {
      seedModules[routePath] = seedModule; // routes must me unique
      
      if (!routes[seedModule.routeIndex])
        routes[seedModule.routeIndex] = [];
      routes[seedModule.routeIndex].push({path:routePath, verb:seedModule.routeVerb});
    });
  }

  // register routes in order based on module.routeIndex (default 0, can be negative)
  function registerRoutes(middlewares) {
    var middlewareString = middlewares.reduce(function(prev, curr, index, array) {
      return prev + ', middlewares[' + index + ']';
    }, '');

    var sortedRouteKeys = _.sortBy(_.keys(routes), function(num){ return 1*num; });
    _.each(sortedRouteKeys, function(key) {
      _.each(routes[key], function(route) {

        debug('registering route: ' + route.verb + ' ' + route.path);
        if (defaultConfig.debugToConsole) console.log('registering route: ' + route.verb + ' ' + route.path);

        // TODO - there has to be a more elegant way to do this than eval, app.get.apply does not work for some reason
        eval('app[route.verb](route.path' + middlewareString + ')');
      });
    });
  }
};

function doesntMatch() {
  var matchers = Array.prototype.slice.call(arguments, 0);
  return function(str) {
    var matches = !matchers.some(function(matcher) {
      return str.indexOf(matcher) !== -1;
    });
    return matches;
  };
}

