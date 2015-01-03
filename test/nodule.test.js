var assert  = require('assert');
var request = require('supertest');
var express = require('express');
var bodyParser = require('body-parser');
var demoApp = require('../demo/demoApp');

var app = express();
app.use(bodyParser.json());
demoApp(app, {debugToConsole: false});

describe('demoApp/nodulejs test suite', function(){

  describe('Testing multiple routes (home page) - GET /home', function(){
    it('should respond with home page HTML', function(done){
      request(app)
        .get('/home')
        .end(function(err, res){
          assert(res.text.indexOf('<h1>HOME PAGE') > -1, 'res.text='+res.text);
          done();
        });
    });
    
    it('should also respond with home page HTML', function(done){
      request(app)
        .get('/')
        .end(function(err, res){
          assert(res.text.indexOf('<h1>HOME PAGE') > -1, 'res.text='+res.text);
          done();
        });
    });
  });

  describe('Testing request-time custom property (home page alternate template) - GET /special', function(){
    it('should respond with alternate page HTML', function(done){
      request(app)
        .get('/special')
        .end(function(err, res){
          assert(res.text.indexOf('<h1>ALTERNATE HOME PAGE') > -1, 'res.text='+res.text);
          done();
        });
    });
  });

  describe('Testing normal route with :id wildcard - GET /json/getData/sner', function(){
    it('should respond to generic :id match with JSON object, id=sner', function(done){
      request(app)
        .get('/json/getData/sner')
        .end(function(err, res){
          assert.equal(res.body.id, 'sner');
          done();
        });
    });
  });

  describe('Testing RegExp route with wildcard, and negative routeIndex - GET /json/getData/specialId2', function(){
    it('should respond to specific :id match with special JSON object', function(done){
      request(app)
        .get('/json/getData/specialId2')
        .end(function(err, res){
          assert.equal(res.body.id, 'specialId2');
          assert.equal(res.body.msg, "getData called with special ID = specialId2, doing special things");
          done();
        });
    });
  });
  
  describe('Testing post request with alternate middleware - POST /json/submitForm, param1=test1', function(){
    it('should respond valid to post submit with expected param', function(done){
      request(app)
        .post('/json/submitForm')
        .send({param1: 'test1' })
        .end(function(err, res){
          assert.equal(res.body.data.dbMsg, 'valid data, param1=test1');
          done();
        });
    });
  });

  describe('Testing post submit with alternate middleware - POST /json/submitForm', function(){
    it('should respond to post submit with missing param', function(done){
      request(app)
        .post('/json/submitForm')
        .type('json')
        .end(function(err, res){
          assert.equal(res.body.msg, 'Form submit failed, please supply valid param1');
          done();
        });
    });
  });

  describe('Testing high positive routeIndex and nodule-specified middleware - GET /badUrl', function(){
    it('should show 404 error response', function(done){
      request(app)
        .get('/badUrl')
        .end(function(err, res){
          assert.equal(res.text, '<html><body><h1>404 error!</h1></body></html>');
          done();
        });
    });
  });
});