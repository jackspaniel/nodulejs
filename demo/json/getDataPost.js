// basic JSON request example

module.exports = function(app) {
  return {
    // routes can be a string, RegExp or array of either (to match multiple routes)
    route : '/json/getData/:id',
    routeVerb: 'post',

    doPreFormBusinessLogic: function(req, res) {
      this.debug('doPreFormBusinessLogic called');
    },

    doPostFormBusinessLogic: function(req, res) {
      this.debug('doPostFormBusinessLogic called');
      req.nodule.responseData = {testId: req.params.id};
    }
  };
};