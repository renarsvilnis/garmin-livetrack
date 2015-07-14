'use strict';

var chai = require('chai');
var expect = chai.expect;

var Livetrack = require('./../index.js');

var config = require('./config.js');

var livetrack = new Livetrack(config);

describe('MailService', function() {

  it('should create connection to webmail provider', function(done) {
    livetrack.on('ready', done);
  });

  
});

describe('GarminService', function() {

  it('should create session', function(done) {
    livetrack.on('session', done);
  });
});
