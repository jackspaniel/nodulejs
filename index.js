glob = require('glob');
var path = require('path');
var _ = require('lodash');

module.exports = function(app, appConfig, customDebug) {

  var debug = customDebug || function(){};

  var seedNodules = [], routes = {};

  var config = {
    // NOTE: the three route config params below must be specified in the nodule init method, they cannot be mutated at request-time
    // REQUIRED, must be unique within express app, can be an array of multiple routes
    route: null,

    // get/post/put/delete
    routeVerb: 'get',

    // use to load routes before or after main group (use negative #s for to load route first - like z-index)
    routeIndex: 0,
    
    debugToConsole: false
  };

  var defaultConfig = _.extend(_.cloneDeep(config), appConfig);

  // TODO - look for a cleaner way to do this inside the nodules
  app.initNodule = initNodule;
  
  return {
    seedNodules: seedNodules,
    loadNodules: loadNodules,
    registerRoutes: registerRoutes
  };
  
  function loadNodules(dir, exclude) {
    var root = dir || process.cwd(); // TOOD - should this be process.cwd() + '/app' ?
    glob.sync('./**/*.js', { cwd: root })
      .filter(doesntMatch.apply(this, exclude))
      .forEach(function(nodule) { require(path.join(root, nodule))(app); });
  }

  function initNodule(file, config) {
    var seedNodule = _.extend(_.cloneDeep(defaultConfig), config); // merge config properties onto default config
    seedNodule.path = path.dirname(file);
    seedNodule.name = path.basename(file, '.js');

    // nodules can have multiple routes
    var routeArray = (typeof seedNodule.route === 'string') || (seedNodule.route instanceof RegExp) ? [seedNodule.route] : seedNodule.route;
    _.each(routeArray, function(routePath) {
      seedNodules[routePath] = seedNodule; // routes must me unique
      
      if (!routes[seedNodule.routeIndex])
        routes[seedNodule.routeIndex] = [];
      routes[seedNodule.routeIndex].push({path:routePath, verb:seedNodule.routeVerb});
    });
  }

  // register routes in order based on nodule.routeIndex (default 0, can be negative)
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

