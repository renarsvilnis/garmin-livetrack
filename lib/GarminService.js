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

var GarminService = function(sessionId, sessionToken, callback) {

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
   * Timestamp when last update was done
   * @type {Number}
   */
  this._lastUpdate = 0;

  /**
   * Timestamp of last log entry placed into the log
   * @type {Number}
   */
  this._lastLogTimestamp = 0;

  // Start service by validating session
  this._validateSession(function(err) {
    if(err) {
      console.log(err.message);
    } else {
      console.log('Session valid');
    }
  });
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
 * List of available event types that can be recieved from Garmin 
 * session service
 * @type {Object}
 */
GarminService.SESSION_EVENTS = {
  PROGRESS: 'InProgress',
  END: 'Expired'
};

/**
 * List of available event types that can be recieved from Garmin
 * tracking log service
 * @type {Object}
 */
GarminService.LOG_EVENTS = {
  PAUSE: 'PAUSE',
  END: 'END'
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
 * @param  {Function} callback
 */
GarminService.prototype._validateSession = function(callback) {

  if(this._sessionValidated)
    return;

  // Add request time to the url. Doesn't effect results but why not.
  var url = this.sessionUrl + '?requestTime=' + Date.now();

  request(this.sessionUrl, (function(err, res, body) {

    if(err || res.statusCode != 200) {
      callback(new Error('Issue while trying to get session info'));
      return;
    }

    try {
      var jsonBody = JSON.parse(body);
    } catch(e) {
     callback(new Error('Invalid session info response'));
      return;
    }

    // Available session states: InProgress, Expired
    if(jsonBody.sessionStatus && jsonBody.sessionStatus == 'InProgress') {
      this._sessionValidated = true;
      callback(null);
    } else {
     callback(new Error('Session expired'));
    }

  }).bind(this));
};

/**
 * Get log update
 * @public
 * @param  {Function} callback
 */
GarminService.prototype.getUpdate = function(callback) {

  if(!this._sessionValidated) {
    callback(new Error('Session invalidated'));
    return;
  }

  var currentTime = Date.now();
  var url = this.logUrl + '?requestTime=' + currentTime + '&from=' + this._lastUpdate;

  this._lastUpdate = currentTime;

  request(url, (function(err, res, body) {

    if(err || res.statusCode != 200) {
      callback(new Error('Issue while getting tracking log'));
      return;
    }

    try {
      var jsonBody = JSON.parse(body);
    } catch(e) {
      callback(new Error('Invalid tracking log response'));
      return;
    }

    var sessionEnded = false;

    jsonBody.forEach((function(entry) {

      // ugly way to stop forEach
      if(sessionEnded)
        return;

      // TODO: make next event
      if(entry.events.length > 0) {
        entry.events.forEach((function(event) {

          // ugly way to stop forEach
          if(sessionEnded)
            return;

          if(event == GarminService.LOG_EVENTS.END)
            sessionEnded = true;

        }).bind(this));
      }

      this._pushLogEntry(entry);
      
    }).bind(this));

    if(sessionEnded) {
      callback(new Error('Session ended'));
    } else {
      callback(null);  
    }

  }).bind(this));
};

/**
 * Push a entry into log
 * @private
 * @param  {Object} entry
 */
GarminService.prototype._pushLogEntry = function(entry) {
  // Only allows to push in never entries
  if(entry.timestamp && entry.timestamp > this._lastLogTimestamp) {
    this._log.push(entry);
    this._lastLogTimestamp = entry.timestamp;
  }
}


module.exports = GarminService;