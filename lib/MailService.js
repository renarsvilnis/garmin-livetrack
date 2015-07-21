'use strict';

var Imap    = require('imap'),
    mimelib = require('mimelib'),
    events  = require('events');

/**
 * Regex for extracting session id and token
 * @type {RegExp}
 */
var mailRegex = /href=\"http:\/\/livetrack\.garmin\.com\/session\/(.*)\/token\/([^\"]*)"/;

var MailService = function(options) {

  /**
   * MailService options
   * @type {Object}
   */
  this._options = options;

  /**
   * imap instance
   * @type {Imap}
   */
  this._imap = new Imap({
    user: options.username,
    password: options.password,
    host: options.host,
    port: options.port,
    tls: options.tls
  });

  this._imap.once('ready', this._openBox.bind(this));
  this._imap.once('error', this._onImapError.bind(this));
  this._imap.once('end', this._onImapEnd.bind(this));
  this._imap.on('mail', this._fetchMail.bind(this));

  this._imap.connect();
};

/**
 * Extend service prototype with EventEmitter
 * @private
 * @type {object}
 */
MailService.prototype.__proto__ = events.EventEmitter.prototype;

/**
 * imap on error event
 * @private
 * @param {Error} err
 */
MailService.prototype._onImapError = function(err) {
  this.emit('error', err);
};

/**
 * imap on end event
 * @private
 */
MailService.prototype._onImapEnd = function() {
  this.emit('end');
}

/**
 * Initial specific mail box open
 * @private
 */
MailService.prototype._openBox = function() {

  // TODO: second argument depending if to delete email after reading
  this._imap.openBox(this._options.label, true, (function(err, box) {

    if (err) {
      this.emit('error', err);
    } else {
      this.emit('ready');
    }

  }).bind(this));

};

/**
 * Search for emails in the box from Garmin
 * @private
 * @return {Function}
 */
MailService.prototype._searchMail = function(callback) {
  // TODO: ignore flag for seen email
  var f = this._imap.search([
    // 'UNSEEN',
    ['FROM', 'noreply@garmin.com']
  ], function(err, results) {

    if (err) {
      callback(err);
    } else if (!results.length) {
      callback(new Error('No livetrack emails found'));
    } else {
      callback(null, results);
    }

  });
};

/**
 * Fetches all session related Garmin emails from opened box
 * @private
 */
MailService.prototype._fetchMail = function() {

  this._searchMail((function(err, results) {

    if(err) {
      this.emit(err);
      return;
    }

    // fetch emails from search results
    var f = this._imap.fetch(results, {
      struct: true,
      markSeen: true,
      bodies: 'TEXT'
    });

    // on each mail
    f.on('message', (function(msg) {
      msg.on('body', this._onMailRead.bind(this));
    }).bind(this));

    // f.on('error', function(err) {
    //   console.log('Fetch error: ' + err);
    // });

    // f.once('end', function() {
    //   console.log('Done fetching all messages!');
    // });
  }).bind(this));

};

/**
 * On email body read
 * @private
 * @param  {Object} stream
 * @param  {Object} info
 */
MailService.prototype._onMailRead = function(stream, info) {
  // email body
  var body = '';

  stream.on('data', function(chunk) {
    body += chunk.toString('utf8');
  });

  stream.once('end', (function() {

    // decode email from Quoted-printable format
    var mailBody = mimelib.decodeQuotedPrintable(body);

    // search for session token and id
    var regexResults = mailBody.match(mailRegex);

    if(regexResults.length !== 3) {
      this.emit('error', 'No session url found');
    } else {
      var sessionId = regexResults[1],
          sessionToken = regexResults[2];

      this.emit('session', sessionId, sessionToken);
    }

  }).bind(this));
};

module.exports = MailService;