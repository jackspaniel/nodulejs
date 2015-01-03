# nodulejs

[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][downloads-url]

nodulejs is a lightweight utility based on node/express whose sole purpose is to discover and initialize node/express "nodules", then attach them to each express request as __req.nodule__.

## Installation
```
$ npm install nodulejs
```

## Usage
```
require('nodulejs')(app, config); 
```

__app__ = express instance
<br>__config__ = any custom properties you want to add or defaults you want to override, see the [demoApp](https://github.com/jackspaniel/nodulejs/blob/master/demo/demoApp.js)

There are 3 global config properties:

1. __dirs__: <span style="color:grey">(OPTIONAL, default='/nodules')</span> *path(s) to look for your nodules, exclude property can be full or partal match* <br>__example:__ [{ path: '/app', exclude: ['demoApp.js', '.test.js'] }, { path: '/lib', exclude: ['.test.js'] }]
2. __debugToConsole__: <span style="color:grey">(OPTIONAL, default=false)</span> *set to true to see nodulejs debug output in the console* 
3. __customDebug__: <span style="color:grey">(OPTIONAL)</span> *custom debug function* <br>__example:__ function(identifier) { return function(msg){... your debug function here ...} }

## What is a nodule? 
A nodule is a self-discovering, self-initializing component that would be analagous to a JSP or PHP page in those worlds. Except it has an advanatage in that its route is declared, not tied by default to the file name or file structure. So you are free to re-organize nodules without upsetting urls. But more importantly, because nodules are self-discovering, there are no onerous config files to maintain (IE - spring). This system allows a much more scalable architecture on large sites--as there are no files that grow to enormouse sizes, and files can be re-organized, placed into subfolfders, etc. with zero impact.


### What does a nodule do? 
Not a whole lot out of the box. I split nodulejs off from it's current sole implementation, [yukon API framework](https://github.com/jackspaniel/yukon), 
and trimmed it down to the bare essentials. The idea/hope is that it can potentially be a building block for other frameworks.

A nodule can have any properties you want to add, which will be propagated throughout the middleware chaing as as req.nodule. But nodulejs only cares about 4 core properties:

1. __route__: <span style="color:grey">(REQUIRED)</span> *one or more express routes - can be a string, RegExp, or array of either*
2. __routeVerb__: <span style="color:grey">(OPTIONAL, default=get)</span> *get, post, put, del*
3. __routeIndex__: <span style="color:grey">(OPTIONAL, default=0)</span> *use to load routes before or after others, can be negative, like z-index*
4. __middlewares__:  <span style="color:grey">(OPTIONAL but your app isn't going to do much w/o them)</span> *an array of middleware functions to call for each nodule, or function(nodule) which returns said array. This array can be globally static for all modules, semi-global based on rules (by using the function option), or specified one-off within each nodule.*

### Ok, what problem does this solve?
__Note:__ to see the concepts described in this section actually fleshed out, see the [yukon API framework](https://github.com/jackspaniel/yukon).

From a __feature-development point of view__, we wanted to give developers the flexibility of [component-based architecture](http://en.wikipedia.org/wiki/Component-based_software_engineering) as much as possible, but still keep system-wide control over the middleware chain. On a small site with a small development team the latter might not be an issue. But on a large site with devs scattered all over the globe, some kind of middleware sandbox was a necessity. 

Our feature devs spend 80-90% of their effort in jade templates or on the client side. For them, node componentes are often just a pass-through to the API(s), with some business logic applied to the request on the way in, and api data on the way out. Ideally they should have to learn the as little as possible of the vagaries/plumbing/whatever-your-favorite-metaphor-for-framework-stuff of node. Creating a new node component should be as easy for them as creating a new JSP - but again, without the framework losing control of the middleware chain.

From a __framework-development point of view__, we knew that as requirements evolved, we would constantly need to add default properties to each component, while hopefully causing as little disruption as possible to existing components. This is easily accomplished by adding a default property to the base config then specifying the property only in the new nodules which need it. 

We also knew we'd need to add slices of business logic globally or semi-globally at any point in the request chain. By keeping control of the middleware chain we are able to do this with ease. 

This diagram, from the fully-fleshed out [yukon API framework](https://github.com/jackspaniel/yukon) might make the concept a little more clear:

![](http://i.imgur.com/eXExJi8.gif)

### To Run Node Tests
```
$ npm install
$ make test 
```

## Examples

#### Basic page
([homePage.js](https://github.com/jackspaniel/nodulejs/blob/master/demo/submitForm.js) from the demoApp)
```
// basic page example (serving multiple routes)
module.exports = function(app) {
  return {
    // routes can be a string, RegExp or array of either (to match multiple routes)
    route: ['/', '/home', '/special'],
  
    doNoduleBusinessLogic: function(req, res) {
      this.debug('doNoduleBusinessLogic called');
      
      // example of specifying a nodule property at request time
      this.templateName = (req.path.indexOf('special') > -1) 
                          ? 'altHomePage.jade' 
                          : 'homePage.jade';
    }
  };
};
```

#### Form submit 
([submitForm.js](https://github.com/jackspaniel/nodulejs/blob/master/demo/json/submitForm.js) from the demoApp)
```
module.exports = function(app) {
  return {
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
```

#### Catch-all page
([404 error nodule](https://github.com/jackspaniel/nodulejs/blob/master/demo/404.js) - shows routeIndex and one-off middleware)
```
module.exports = function(app) {
  return {
    route: '*',

    // set to low number to register route with express first
    // set to high number to register last (can be negative - like z-index)
    // (routes registered first take precedence)
    routeIndex: 1000,
  
    // example of using custom non-standard middleware array 
    middlewares: [
      function(req, res, next) {
        req.nodule.debug('404 error middleware called!');
        res.send('<html><body><h1>404 error!</h1></body></html>');
      }
    ]
  };
};
```

#### Custom config with several nodule-dependent middleware chains, and extra nodule properties
(from [demoApp.js](https://github.com/jackspaniel/nodulejs/blob/master/demo/demoApp.js))
```
var config =  {

  dirs: [
    // path(s) to look for your nodules 
    { path: myDir, exclude: ['demoApp.js', '.test.js'] }, // exclude can be full or partal match
    
    // multiple dirs ok
  ],

  // set to true or or use customDebug: function(identifier) { return function(msg){... your debug function here ...} }
  debugToConsole: true, 
  
  // config used to override nodule defaults at the app-level
  // NOTE: these properties will be overridden by any properties specified at the nodule-level (nodule properties->app properties->nodulejs framework default properties)
  noduleDefaults: {
    // example of using a static array of middlewares
    // middlewares: [doBusinessLogic, sendJsonResponse],
    
    // example of using a function to return middlewares based on nodule properties
    middlewares: function(nodule) {
      var strRoute = nodule.route.toString();

      if (nodule.routeVerb === 'post') 
        return [doPreForm, doPostForm, sendJsonResponse];
      else if (strRoute.indexOf('/json') === 0) 
        return [doBusinessLogic, sendJsonResponse];
      else  
        return [doBusinessLogic, sendHtmlResponse];
    },
  
    // below are examples of adding custom properties outside of nodulejs
    templateName: 'default.jade',

    templateDir: null,

    // example of adding nodule-level business logic function
    doNoduleBusinessLogic: function(req, res) { },
  },
};
```

#### Middleware which calls nodule-level business-logic function
(from [demoApp.js](https://github.com/jackspaniel/nodulejs/blob/master/demo/demoApp.js))
```
function doBusinessLogic(req, res, next) {
  debug('doBusinessLogic middleware executed for: ' + req.nodule.name);

  // app-level business logic can go here

  // call nodule-level business logic
  req.nodule.doNoduleBusinessLogic(req, res);

  // app-level business logic can also go here

  next();
}
```

#### Multiple middleware functions which make an asynchronous call to the DB (goes with Form submit example above)
(from [demoApp.js](https://github.com/jackspaniel/nodulejs/blob/master/demo/demoApp.js))
```
...
    middlewares: function(nodule) {
      if (nodule.routeVerb === 'post') 
        return [doPreForm, doPostForm, sendJsonResponse];
...


function doPreForm(req, res, next) {
  debug('doPreForm middleware executed for: ' + req.nodule.name);

  // call nodule-level pre-DB business logic
  req.nodule.doPreFormBusinessLogic(req, res);

  // simulating async call to DB/cache/API/etc
  makeDbCall({
    params: req.nodule.dbParams, 
    callback: function(err, response) { 
      req.nodule.responseData = response;
      next(); 
    }
  });
}

// DB simulator, see /json/formSubmit.js
function makeDbCall(call) {
  var response = (call.params.param1) ? 'valid data, param1='+call.params.param1 : 'missing param1, please resubmit';
  call.callback(null, {dbMsg:response});
}

function doPostForm(req, res, next) {
  debug('doPostForm middleware executed for: ' + req.nodule.name);

  // call nodule-level post-DB business logic
  req.nodule.doPostFormBusinessLogic(req, res);

  next();
}
```

[npm-image]: https://img.shields.io/npm/v/nodulejs.svg?style=flat
[npm-url]: https://www.npmjs.com/package/nodulejs
[downloads-image]: https://img.shields.io/npm/dm/nodulejs.svg?style=flat
[downloads-url]: https://npmjs.org/package/ndoulejs
