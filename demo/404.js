// example of using routeIndex to catch all routes not specifically handled 
// example of using custom non-standard middleware array 
module.exports = function(app) {
  return {
    // routes can be a string, RegExp or array of either (to match multiple routes)
    route: '*',

    // set to low number to register route with express first
    // high number to register last (can be negative - like z-index)
    // routes registered first take precedence
    routeIndex: 1000,
  
    // example of using custom non-standard middleware array 
    // can also be a function which returns an array of middleware functions (where *this* = this nodule)
    // NOTE: this function is called at app boot time, not request time
    middlewares: [
      function(req, res, next) {
        res.send('404 error!');
      }
    ]
  };
};