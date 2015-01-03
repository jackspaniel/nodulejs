// basic post form-submit example

module.exports = function(app) {
  return {
    // routes can be a string, RegExp or array of either (to match multiple routes)
    route : '/json/submitForm',  

    routeVerb: 'post', // default = get       
    
    doPreFormBusinessLogic: function(req, res) {
      this.debug('doPreFormBusinessLogic called');
      // process form parameters etc
      this.dbParams = {param1: req.body ? req.body.param1 : null}; // in real life don't forget to sanitize query params!
    },

    doPostFormBusinessLogic: function(req, res) {
      this.debug('doPostFormBusinessLogic called');
      
      // process data before sending to client
      if (req.nodule.responseData.dbMsg.indexOf('valid data') === -1)
        this.customMsg = 'Form submit failed, please supply valid param1';
    }
  };
};