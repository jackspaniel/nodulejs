// basic post form submit example
module.exports = function(app) {
  return {
    // routes can be a string, RegExp or array of either (to match multiple routes)
    route : '/json/submitForm',  

    routeVerb: 'post', // default = get       
  };
};