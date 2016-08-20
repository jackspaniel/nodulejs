# nodulejs

[![Gitter](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/jackspaniel/nodulejs?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][downloads-url]
[![Build status][travis-image]][travis-url]
[![Test coverage][coveralls-image]][coveralls-url]

__NOTE:__ This is still very much an active repo. We just haven't needed to change anything in a while. Any feature requests, issues or inquiries will be answered promptly.

nodulejs is a lightweight utility based on node/express, whose sole purpose is to discover and initialize web components (standard AMD Javascript objects) called "nodules". Nodules are tied to one or more express routes, and attached to each incoming express request as __req.nodule__.

A nodule looks like this:
```js
module.exports = function(app) {
  return {
    route: '/home', 
    middlewares: [getProfile, getMoreData],
 };
     
  var getProfile = function(req, res, next) {
    // make call to an API or database
  };
    
  var getMoreData = function(req, res, next) {
    // make another async DB/API call which is dependent on getProfile
    // do business logic on returned data
    // render template
  };
};
```

Which has the exact same behavior as this:
```js
// filename app/myModule.js
module.exports = function(app) {
  app.get('/home', getProfile, getMoreData);
     
  var getProfile = function(req, res, next) {
    // make call to an API or database
  };
    
  var getMoreData = function(req, res, next) {
    // make another async DB/API call which is dependent on getProfile
    // do business logic on returned data
    // render template
  };
};

// in app.js or some sub component:
require('./app/myModule.js');
```
But notice that in the nodulejs example, it is not necessary to require the component myModule.js from another file. The nodule is discovered automatically by the nodulesjs framework - based on configurable file search patterns. This makes it less onerous to reorganize code. Renaming files, moving files, creating subdirectories are all much easier because there is no path to maintain off in another file. 

Conversely a nodule's route is not tied to its filename or path. We feel this is the best of both worlds - as files can be renamed and moved w/o impacting the back end or front end code. Developers are more likely to rename and reorganize files - which results in tigher, more self-explanatory code. Each nodule is roughly 1-1 with a web route (although it can serve multiple routes). Our experience is that in large distributed teams, this separation of features into bite-sized files aids development considerably.

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
3. __customDebug__: <span style="color:grey">(OPTIONAL)</span> custom debug function <br>*__example:__ function(identifier) { return function(msg){ myDebug(msg) } }*

There are 4 local properties unique to each nodule:

A nodule can have any properties you want to add*, which will be propagated throughout the middleware chain as as req.nodule. But nodulejs only cares about 4 core properties, which are needed to register express middleware at app-init time:

1. __route__: <span style="color:grey">(REQUIRED)</span> one or more express routes - can be a string, RegExp, or array of either
2. __routeVerb__: <span style="color:grey">(OPTIONAL, default=get)</span> get, post, put, del
3. __routeIndex__: <span style="color:grey">(OPTIONAL, default=0)</span> use to load routes before or after others, can be negative, like z-index
4. __middlewares__:  <span style="color:grey">(OPTIONAL but your app isn't going to do much w/o them)</span> an array of middleware functions to call for each nodule, or *__function(nodule){...}__* which returns said array. This array can be globally static for all nodules, semi-global based on rules (by using the function option), or specified one-off within each nodule.

*nodulejs can be a building block for more complex behaviors. See the [yukon component framework](https://github.com/jackspaniel/yukon) for an example. 

### To run node tests
```
Download nodulejs - https://github.com/jackspaniel/nodulejs/archive/master.zip
$ npm install
$ make test 
```

### To see the Demo App in action outside of test mode
```
node app
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
[downloads-url]: https://npmjs.org/package/nodulejs
[travis-image]: https://travis-ci.org/jackspaniel/nodulejs.svg
[travis-url]: https://travis-ci.org/jackspaniel/nodulejs?branch=master
[coveralls-image]: https://coveralls.io/repos/jackspaniel/nodulejs/badge.svg?branch=master&cache-bust=true
[coveralls-url]: https://coveralls.io/r/jackspaniel/nodulejs?branch=master
