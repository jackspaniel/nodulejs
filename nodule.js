var glob = require('glob');
var path = require('path');
var _ = require('lodash');

module.exports = function(app, config) {
  var seedNodules = [], routes = {};

  var rootConfig = {
    // directories to look for nodules in, minus exclude pattern - looks in nodules directory by default
    dirs: [
      { path: path.join(process.cwd(), 'nodules'), exclude: null }
    ], 

    // default debug function if none is supplied
    customDebug: function(identifier) { 
      if (defaultConfig.debugToConsole)
        return function(msg) { console.log(identifier+': '+msg); };
      else 
        return function(msg) { };
    },

    // set this to true if you have not defined a customDebugger but want to temporality see debugging output
    debugToConsole: false,

    noduleDefaults: {
      // array of (or function which returns array of) middleware functions which will be called in order for each nodule on each express request
      middlewares: [],
      
      // Note: you can use a function which returns an array of middlewares
      //       to assign different groups of middleware based on certain nodule properties when app inits
      //       but be careful because most nodule properties can be mutated at request time - whereas middleware chains are set up at app init time
      
      // function example:
      // middlewares: function(nodule) { 
      //  if (nodule.routeVerb === 'post') return formMiddleWareArray;  // predefined middleware array just for post requests
      //  else return middleWareArray;                                  // standard middleware array used for everything else
      // },

      // NOTE: the three route config params below must be specified in the nodule init method, they cannot be mutated at request-time
      
      // REQUIRED, must be unique within express app, can be String or RegExp or an array of either to handle multiple routes
      route: null,

      // get/post/put/delete
      routeVerb: 'get',

      // use to load routes before or after main group (use negative #s for to load route first - like z-index)
      routeIndex: 0,
    },
  };

  var defaultConfig = _.merge({}, rootConfig, config);
  var debug = defaultConfig.customDebug('nodulejs');
  debug('debug initialized');

  // find all nodules and init all routes first so they can be sorted based on routeIndex
  defaultConfig.dirs.forEach(function(dir) { loadNodules(dir.path, dir.exclude); });
  
  registerRoutes();

  return {
    defaultConfig: defaultConfig
  };

  // finds nodules in supplied dir, minus exclude patterns, and invokes initNodule method on them
  function loadNodules(dir, exclude) {
    debug('loadNodules called - dir: ' + dir + ', exclude: ' + exclude);
    var root = dir || process.cwd(); // TOOD - should this be process.cwd() + '/app' ?
    glob.sync('./**/*.js', { cwd: root })
      .filter(doesntMatch.apply(this, exclude))
      .forEach(function(file) { initNodule(path.join(root, file)); });
  } 

  // creates seedNodules for each found nodule (seedNodules are cloned at the beginning of each request and added to the req object)
  function initNodule(filepath) {
    var nodule = require(filepath)(app);
    var seedNodule = _.assign(_.cloneDeep(defaultConfig.noduleDefaults), nodule); // merge nodule properties onto default nodule
    seedNodule.path = path.dirname(filepath);
    seedNodule.name = path.basename(filepath, '.js');
    seedNodule.debug = defaultConfig.customDebug(seedNodule.name);

    // nodules can have multiple routes
    var routeArray = (typeof seedNodule.route === 'string') || (seedNodule.route instanceof RegExp) ? [seedNodule.route] : seedNodule.route;
    _.each(routeArray, function(routePath) {
      seedNodules[routePath] = seedNodule; // routes must me unique
        
      // middlewares can be an array of functions, or function that returns an array of functions
      var middlewares = typeof seedNodule.middlewares === 'function' ? seedNodule.middlewares(seedNodule) : seedNodule.middlewares;
      
      if (!routes[seedNodule.routeIndex]) routes[seedNodule.routeIndex] = [];
      routes[seedNodule.routeIndex].push({path:routePath, verb:seedNodule.routeVerb, middlewares:middlewares});
    });
  }

  // register express routes (call app.get()/app.post() etc.) in order based on nodule.routeIndex (default = 0, can be negative)
  function registerRoutes() {
    var sortedRouteKeys = _.sortBy(_.keys(routes), function(num){ return 1*num; });
    _.each(sortedRouteKeys, function(key) {
      _.each(routes[key], function(route) {
        debug('registering route: ' + route.verb + ' ' + route.path);
        app[route.verb].apply(app, [route.path, initRequest].concat(route.middlewares));
      });
    });
  }

  // first step in middleware chain - clone applicable seedNodule and attach cloned instance to each incoming request
  function initRequest(req, res, next) {
    req.nodule = _.cloneDeep(seedNodules[req.route.path]);
    next();
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