// example of using a pre-route filter
// example of using custom non-standard middleware array 

module.exports = function(app) {
  return {
    // routes can be a string, RegExp or array of either (to match multiple routes)
    route: '*',

    // set to low number to register route with express first
    // set to high number to register last (can be negative - like z-index)
    // (routes registered first take precedence)
    routeIndex: -1000,
  
    // example of using custom non-standard middleware array 
    // can also be a function(nodule) which returns an array of middleware functions (see demoApp.js for example)
    // NOTE: if using a function, it is executed at app init time, not request time
    middlewares: [
      function(req, res, next) {
        // do some business logic here
        next('route'); // in express 4 - sends route back into the middleware
      }
    ]
  };
};