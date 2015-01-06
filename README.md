# nodulejs

[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][downloads-url]

nodulejs is a lightweight utility based on node/express whose sole purpose is to discover and initialize web components called "nodules". Nodules are tied to one or more express routes, and attached to each express request as __req.nodule__.

For a fully fleshed-out implementation of nodulejs, see the [yukon API framework](https://github.com/jackspaniel/yukon).

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

1. __dirs__: <span style="color:grey">(OPTIONAL, default='/nodules')</span> path(s) to look for your nodules, exclude property can be full or partal match <br>*__example:__ [{ path: '/app', exclude: ['demoApp.js', '.test.js', '/shared/'] }, { path: '/lib/nodules', exclude: ['.test.js'] }]*
2. __debugToConsole__: <span style="color:grey">(OPTIONAL, default=false)</span> set to true to see nodulejs debug output in the console
3. __customDebug__: <span style="color:grey">(OPTIONAL)</span> custom debug function <br>*__example:__ function(identifier) { return function(msg){... your debug function here ...} }*

## What is a nodule? 
A nodule is a self-discovering, self-initializing component that would be analogous to a JSP or PHP page in those worlds. Except it has an advantage in that its route is declared, not tied by default to the file name or file structure. So you are free to re-organize nodules without upsetting urls. But more importantly, because nodules are self-discovering, there are no onerous config files to maintain (IE - Spring). This system allows a much more scalable architecture on large sites--as there are no config or other shared files which grow to enormous sizes as the site grows, and nodules can be re-organized, placed into sub-folders, etc. with zero impact.

### What does a nodule do? 
Not a whole lot out of the box. See the [yukon API framework](https://github.com/jackspaniel/yukon) for a fully-fleshed out implementation. I split nodulejs off from yukon with the idea that it can potentially be a building block for other frameworks.

A nodule can have any properties you want to add, which will be propagated throughout the middleware chain as as req.nodule. But nodulejs only cares about 4 core properties, which are needed to register express middleware at app-init time:

1. __route__: <span style="color:grey">(REQUIRED)</span> one or more express routes - can be a string, RegExp, or array of either
2. __routeVerb__: <span style="color:grey">(OPTIONAL, default=get)</span> get, post, put, del
3. __routeIndex__: <span style="color:grey">(OPTIONAL, default=0)</span> use to load routes before or after others, can be negative, like z-index
4. __middlewares__:  <span style="color:grey">(OPTIONAL but your app isn't going to do much w/o them)</span> an array of middleware functions to call for each nodule, or function(nodule) which returns said array. This array can be globally static for all modules, semi-global based on rules (by using the function option), or specified one-off within each nodule.

### Ok, what problem does this solve?
From a __feature-development point of view__, we wanted to give developers the flexibility of [component-based architecture](http://en.wikipedia.org/wiki/Component-based_software_engineering) as much as possible, but still keep system-wide control over the middleware chain. On a small site with a small development team the latter might not be an issue. But on a large site with devs scattered all over the globe, some kind of middleware sandbox was a necessity. 

Our feature devs spend 80-90% of their effort in jade templates or on the client side. For them, node components are often just a pass-through to the API(s), with some business logic applied to the request on the way in, and api data on the way out. Ideally they should have to learn the as little as possible of the vagaries/plumbing/whatever-your-favorite-metaphor-for-framework-stuff of node. Creating a new node component should be as easy for them as creating a new JSP - but again, without the framework losing control of the middleware chain.

From a __framework-development point of view__, we knew that as requirements evolved, we would constantly need to add default properties to each component, while hopefully causing as little disruption as possible to existing components. This is easily accomplished by adding a default property to the base config, then specifying the property only in the nodules that need the new property.

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
([homePage.js](https://github.com/jackspaniel/nodulejs/blob/master/demo/homePage.js) from the demoApp)
```js
module.exports = function(app) {
  return {
    route: ['/', '/home', '/special'],
  
    doNoduleBusinessLogic: function(req, res) {
      this.templateName = (req.path.indexOf('special') > -1) 
                          ? 'altHomePage.jade' 
                          : 'homePage.jade';
    }
  };
};
```

#### Form submit 
([submitForm.js](https://github.com/jackspaniel/nodulejs/blob/master/demo/json/submitForm.js) from the demoApp)
```js
module.exports = function(app) {
  return {
    route : '/json/submitForm',  

    routeVerb: 'post', 
    
    doPreFormBusinessLogic: function(req, res) {
      this.dbParams = {param1: req.body ? req.body.param1 : null}; // in real life don't forget to sanitize query params!
    },

    doPostFormBusinessLogic: function(req, res) {
      if (req.nodule.responseData.dbMsg.indexOf('valid data') === -1)
        this.customMsg = 'Form submit failed, please supply valid param1';
    }
  };
};
```

#### Catch-all page
([404 error nodule](https://github.com/jackspaniel/nodulejs/blob/master/demo/404.js) - shows routeIndex and one-off middleware)
```js
module.exports = function(app) {
  return {
    route: '*',

    routeIndex: 1000, // high routes are registered last
  
    middlewares: [
      function(req, res, next) {
        req.nodule.debug('404 error middleware called!');
        res.send('<html><body><h1>404 error!</h1></body></html>');
      }
    ]
  };
};
```

#### Demo App config
(from [demoApp.js](https://github.com/jackspaniel/nodulejs/blob/master/demo/demoApp.js) - shows defining several nodule-dependent middleware chains at app init time, and adding extra nodule properties)
```js
var config =  {
  
  dirs: [
    { path: myDir, exclude: ['demoApp.js', '.test.js'] },
  ],

  debugToConsole: true, 
  
  noduleDefaults: {

    middlewares: function(nodule) {
      var strRoute = nodule.route.toString();

      if (nodule.routeVerb === 'post') 
        return [doPreForm, doPostForm, sendJsonResponse];
      else if (strRoute.indexOf('/json') === 0) 
        return [doBusinessLogic, sendJsonResponse];
      else  
        return [doBusinessLogic, sendHtmlResponse];
    },
  
    // custom properties on top of the nodulejs core properties
    templateName: 'default.jade',

    templateDir: null,

    doNoduleBusinessLogic: function(req, res) { },
  },
};
```

#### Middleware which calls nodule-level business-logic function
(from [demoApp.js](https://github.com/jackspaniel/nodulejs/blob/master/demo/demoApp.js))
```js
function doBusinessLogic(req, res, next) {
  debug('doBusinessLogic middleware executed for: ' + req.nodule.name);

  // app-level business logic can go here

  req.nodule.doNoduleBusinessLogic(req, res);

  // app-level business logic can also go here

  next();
}
```

#### Multiple middleware functions which make an asynchronous call to the DB
(from [demoApp.js](https://github.com/jackspaniel/nodulejs/blob/master/demo/demoApp.js) - goes with Form submit example above)
```js
...
    middlewares: function(nodule) {
      if (nodule.routeVerb === 'post') 
        return [doPreForm, doPostForm, sendJsonResponse];
...


function doPreForm(req, res, next) {

  req.nodule.doPreFormBusinessLogic(req, res);

  makeDbCall({
    params: req.nodule.dbParams, 
    callback: function(err, response) { 
      req.nodule.responseData = response;
      next(); 
    }
  });
}

function doPostForm(req, res, next) {
  
  req.nodule.doPostFormBusinessLogic(req, res);
  
  next();
}

// DB simulator, see /json/formSubmit.js
function makeDbCall(call) {
  var response = (call.params.param1) ? 'valid data, param1='+call.params.param1 : 'missing param1, please resubmit';
  call.callback(null, {dbMsg:response});
}
```

# License
### MIT

[npm-image]: https://img.shields.io/npm/v/nodulejs.svg?style=flat
[npm-url]: https://www.npmjs.com/package/nodulejs
[downloads-image]: https://img.shields.io/npm/dm/nodulejs.svg?style=flat
[downloads-url]: https://npmjs.org/package/ndoulejs
