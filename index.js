'use strict';

var objectAssign  = require('object-assign'),
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

  /**
   * Options object
   * @type {Object}
   */
  var _options = objectAssign(defaults, options);

  /**
   * Garmin service instance
   * @type {GarminService}
   */
  this._garminService = null;

  /**
   * Mail service instance
   * @type {MailService}
   */
  this._mailService = null;

  // create mail service factory
  this._mailServiceFactory();
};

/**
 * Extend service prototype with EventEmitter
 * @type {object}
 */
Livetrack.prototype.__proto__ = events.EventEmitter.prototype;

/**
 * Factory for creating a mail service
 * @type {Object}
 */
Livetrack.prototype._mailServiceFactory = function() {

  // TODO: check if existing MailService then remove events

  this._mailService = new MailService(_options);
  this._mailService.on('ready', this._mailReady.bind(this));
  this._mailService.on('session', this._mailSession.bind(this));
  this._mailService.on('error', this._mailError.bind(this));
};

/**
 * Mail service on ready event
 */
Livetrack.prototype._mailReady = function() {
  this.emit('ready');
};

/**
 * Mail service on session event
 * @param  {String} sessionId    Garmin service session id
 * @param  {String} sessionToken Garmin service session token
 */
Livetrack.prototype._mailSession = function(sessionId, sessionToken) {
  console.log('New Session found', sessionId, sessionToken);

  this._garminService = new GarminService(sessionId, sessionToken, (function(err) {
    if(err) {
      this.emit('error', err);
      return;
    }

    this.emit('session');

  }).bind(this));
};

/**
 * Mail service on error event
 * @param  {Error} err
 */
Livetrack.prototype._mailError = function(err) {
  console.log('MailService error:', err);
  this.emit('error', err);
};



module.exports = Livetrack;