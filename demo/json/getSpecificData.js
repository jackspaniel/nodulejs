// JSON request example using negative routeIndex to register more specific routes first

module.exports = function(app) {
  return {
    // routes can be a string, RegExp or array of either (to match multiple routes)
    // example of specific route that we want to match before /json/getData/:id
    route : /json\/getData\/(specialId1|specialId2)/,       

    // set to low number to register route with express first
    // high number to register last (can be negative - like z-index)
    // routes registered first take precedence
    routeIndex: -1,

    doNoduleBusinessLogic: function(req, res) {
      this.debug('doNoduleBusinessLogic called');

      this.customId = req.params[0];
      this.customMsg = 'getData called with special ID = ' + this.customId + ', doing special things';
    }
  };
};
