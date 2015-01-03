// basic JSON request example

module.exports = function(app) {
  return {
    // routes can be a string, RegExp or array of either (to match multiple routes)
    route : '/json/getData/:id',       
  };
};