'use strict';

var request       = require('request'),
    objectAssign  = require('object-assign'),
    events        = require('events');

var MailService   = require('./lib/MailService.js'),
    GarminService = require('./lib/GarminService.js');

var defaults = {
  username: '',
  password: '',
  host: 'imap.gmail.com',
  port: 993,
  tls: true,
  label: 'INBOX',
  // deleteAfterRead: true,
  // reconnect: true,
  autoUpdate: true
};

var Livetrack = function(options) {

  var that = this;

  // extend defaults
  var _options = objectAssign(defaults, options);

  var mailService = new MailService(_options);
  var garminService;

  mailService.on('ready', (function() {
    that.emit('ready');
  }).bind(this));

  mailService.on('session', function(sessionId, sessionToken) {
    console.log('New Session found', sessionId, sessionToken);

    garminService = new GarminService(sessionId, sessionToken, function(err) {
      if(err) {
        that.emit('error', err);
        return;
      }

      that.emit('session');

    });

  });

  mailService.on('error', function(err) {
    console.log('MailService error:', err);
    that.emit('error', err);
  });

};

Livetrack.prototype.__proto__ = events.EventEmitter.prototype;

module.exports = Livetrack;