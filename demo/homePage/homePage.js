// basic page example (serving multiple routes)
module.exports = function(app) {
  return {
    // routes can be a string, RegExp or array of either (to match multiple routes)
    route: ['/','/home'],
  
    templateName: '/demo/homePage',

  };
};