'use strict';

// http://livetrack.garmin.com/services/session/1debb03f-2acd-48b0-a8c9-2ba613bfcb3c/token/5B72E4867D3AE6EB4B3D11F612044D8?requestTime=1436824940406
// http://livetrack.garmin.com/services/trackLog/1debb03f-2acd-48b0-a8c9-2ba613bfcb3c/token/5B72E4867D3AE6EB4B3D11F612044D8?requestTime=1436825001695&from=1436824890000

var request = require('request'),
    format  = require('string-template'),
    events  = require('events');

/**
 * Template url for garmin service
 * @type {String}
 */
var API_URL = 'http://livetrack.garmin.com/services/{service}/{id}/token/{token}';

/**
 * Interval beetween each activity log entry
 * Found by looking at the larger sum of log entries
 * @type {Number}
 */
var LOGGING_INTERVAL = 4000;

var GarminService = function(sessionId, sessionToken) {

  /**
   * Session ID
   * @public
   * @type {String}
   */
  this.sessionId = sessionId;

  /**
   * Session Token
   * @public
   * @type {String}
   */
  this.sessionToken = sessionToken;

  /**
   * Url for session service
   * @public
   * @type {String}
   */
  this.sessionUrl = format(API_URL, {
    service: GarminService.SERVICE.SESSION,
    id: this.sessionId,
    token: this.sessionToken
  });

  /**
   * Url for tracking log service
   * @public
   * @type {String}
   */
  this.logUrl = format(API_URL, {
    service: GarminService.SERVICE.LOG,
    id: this.sessionId,
    token: this.sessionToken
  });

  /**
   * List of tracking log data
   * @private
   * @type {Array}
   */
  this._log = [];

  /**
   * Flag to indicate session validation
   * @private
   * @type {Boolean}
   */
  this._sessionValidated = false;

  /**
   * Indication when last update was met
   * @type {Number}
   */
  this._lastUpdate = 0;

  // Start service by validating session
  this._validateSession();
};

/**
 * List of available Garmin services
 * @static
 * @type {Object}
 */
GarminService.SERVICE = {
  SESSION: 'session',
  LOG: 'trackLog'
};

/**
 * Extend service prototype with EventEmitter
 * @type {object}
 */
GarminService.prototype.__proto__ = events.EventEmitter.prototype;

/**
 * Return all tracking log data from current session
 * @public
 * @return {Array} - Log data
 */
GarminService.prototype.getTrackingLog = function() {
  return this._log;
};

/**
 * Validate session
 * @private
 * @fires GarminService#session or GarminService#session
 */
GarminService.prototype._validateSession = function() {

  if(this._sessionValidated)
    return;

  // Add request time to the url. Doesn't effect results but why not.
  var url = this.sessionUrl + '?requestTime=' + Date.now();

  request(this.sessionUrl, (function(err, res, body) {

    if(err || res.statusCode != 200) {
      this.emit('error', 'Issue while trying to get session info');
      return;
    }

    try {
      var jsonBody = JSON.parse(body);
    } catch(e) {
      this.emit('error', 'Invalid session info response');
      return;
    }

    // Available session states: InProgress, Expired
    if(jsonBody.sessionStatus && jsonBody.sessionStatus == 'InProgress') {
      this._sessionValidated = true;
      this.emit('session');
    } else {
      this.emit('error', 'Session expired');
    }

  }).bind(this));
};

// TODO: jsdoc
// TODO: naming
// TODO: setting intervals
// TODO: adding entries to log
// TODO: 
GarminService.prototype.getUpdate = function(callback) {

  if(!this._sessionValidated) {
    this.emit('error', 'Session invalidated');
    return;
  }

  // TODO: add parameter
  var url = this.logUrl;

  request(url, (function(err, res, body) {

    if(err || res.statusCode != 200) {
      this.emit('error', 'Issue while getting tracking log');
      return;
    }

    try {
      var jsonBody = JSON.parse(body);
    } catch(e) {
      this.emit('error', 'Invalid tracking log response');
    }

    // if(jsonBody.sessionStatus)

  }).bind(this));
};


module.exports = GarminService;