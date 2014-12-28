var assert = require('assert');
var nodulejs = require('../nodule.js');

var app = {};
var appConfig = {};


describe('app', function(){
  it('should initialize', function(done){
    var nodule = nodulejs(app, appConfig);
    assert(typeof nodule === 'object');
    done();
  })
});