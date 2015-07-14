'use strict';

// http://livetrack.garmin.com/services/session/1debb03f-2acd-48b0-a8c9-2ba613bfcb3c/token/5B72E4867D3AE6EB4B3D11F612044D8?requestTime=1436824940406
// http://livetrack.garmin.com/services/trackLog/1debb03f-2acd-48b0-a8c9-2ba613bfcb3c/token/5B72E4867D3AE6EB4B3D11F612044D8?requestTime=1436825001695&from=1436824890000

var request = require('request'),
    format  = require('string-template'),
    events  = require('events');

// List of available Garmin services
var SERVICE = {
  SESSION: 'session',
  LOG: 'trackLog'
};

var API_URL = 'http://livetrack.garmin.com/services/{service}/{id}/token/{token}';

var GarminService = (function() {

  var instance;

  var _sessionId,
      _sessionToken;

  var sessionUrl,
      logUrl;
  
  var GarminService = function(sessionId, sessionToken) {

    instance = this;

    _sessionId = sessionId;
    _sessionToken = sessionToken;

    sessionUrl = format(API_URL, {
      service: SERVICE.SESSION,
      id: _sessionId,
      token: _sessionToken
    });

    logUrl = format(API_URL, {
      service: SERVICE.LOG,
      id: _sessionId,
      token: _sessionToken
    });

    validateSession();
  };

  GarminService.prototype.__proto__ = events.EventEmitter.prototype;

  var validateSession = function() {

    request(sessionUrl, function(err, res, body) {

      if(err || res.statusCode != 200) {
        instance.emit('error', 'Issue while trying to get session info');
        return;
      }

      try {
        var jsonBody = JSON.parse(body);
      } catch(e) {
        instance.emit('error', 'Invalid session info response');
        return;
      }

      // Available session states: InProgress, Expired
      if(jsonBody.sessionStatus && jsonBody.sessionStatus == 'InProgress') {
        instance.emit('session');
      } else {
        instance.emit('error', 'Session expired');
      }

    });
  };

  return GarminService;
})();

// function requestInfo() {
//   request(apiUrl, function(err, res, body) {
//     console.log('sesion', session);
//     console.log('token', token);
//     console.log('api-url', apiUrl);
//     console.log(res.statusCode);

//     if (!err && res.statusCode == 200) {
//       var json = JSON.parse(body);
//       console.log('Api response', json);
//     } else {
//       console.log('Session ended');
//     }
//   });

// };

module.exports = GarminService;