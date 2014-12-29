var assert = require('assert');
var sinon = require('sinon');
var nodulejs = require('../nodule.js');

var app = {};
var appConfig = {};

describe('app', function(){
  var nodule = nodulejs(app, appConfig);

  it('should initialize', function(done){
    assert(typeof nodule === 'object');
    done();
  });

  it('should find .js files but exclude .nu.js files', function(done){
    var spy = sinon.spy();
    var proxy = once(spy);
 //    nodule.loadModules(null, 'nu.js');
    done();
  });
});