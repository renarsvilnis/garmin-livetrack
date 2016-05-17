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
  secure: true,
  label: 'INBOX',
  // deleteAfterRead: true,
  // reconnect: true,
  // ignoreSeen: true
  // autoUpdate: true
};

var Livetrack = function(options) {

  /**
   * Options object
   * @private
   * @type {Object}
   */
  this._options = objectAssign(defaults, options);

  /**
   * Garmin service instance
   * @private
   * @type {GarminService}
   */
  this._garminService = null;

  /**
   * Mail service instance
   * @private
   * @type {MailService}
   */
  this._mailService = null;

  // create mail service factory
  this._mailServiceFactory();
};

/**
 * Extend service prototype with EventEmitter
 * @private
 * @type {object}
 */
Livetrack.prototype.__proto__ = events.EventEmitter.prototype;

/**
 * Factory for creating a mail service
 * @private
 * @type {Object}
 */
Livetrack.prototype._mailServiceFactory = function() {

  // TODO: check if existing MailService then remove events

  this._mailService = new MailService(this._options);
  this._mailService.on('ready', this._onMailReady.bind(this));
  this._mailService.on('session', this._onMailSession.bind(this));
  this._mailService.on('error', this._onMailError.bind(this));
};

/**
 * Mail service on ready event
 * @private
 */
Livetrack.prototype._onMailReady = function() {
  this.emit('ready');
};

/**
 * Mail service on session event
 * @private
 * @param  {String} sessionId    Garmin service session id
 * @param  {String} sessionToken Garmin service session token
 */
Livetrack.prototype._onMailSession = function(sessionId, sessionToken) {
  new GarminService(sessionId, sessionToken, (function(err, session) {

    if(err) {
      this.emit('error', err);
      this._garminService = null;
    } else {
      this.emit('session');
      this._garminService = session;
    }

  }).bind(this));

};

/**
 * Mail service on error event
 * @private
 * @param  {Error} err
 */
Livetrack.prototype._onMailError = function(err) {
  this.emit('error', err);
};

module.exports = Livetrack;