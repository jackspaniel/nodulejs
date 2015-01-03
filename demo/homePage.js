// basic page example (serving multiple routes)
module.exports = function(app) {
  return {
    // routes can be a string, RegExp or array of either (to match multiple routes)
    route: ['/', '/home', '/special'],
  
    doNoduleBusinessLogic: function(req, res) {
      this.debug('doNoduleBusinessLogic called');
      
      // example of specifying a nodule property at request time
      this.templateName = (req.path.indexOf('special') > -1) ? 'altHomePage.jade' : 'homePage.jade';
    }
  };
};