'use strict';

var Imap    = require('imap'),
    mimelib = require('mimelib'),
    events  = require('events');

var searchRegex = /href=\"http:\/\/livetrack\.garmin\.com\/session\/(.*)\/token\/([^\"]*)"/;

var MailService = function(options) {

  // storing localy so that don't need to make 100x function binds
  var that = this;

  var imap = this.imap = new Imap({
    user: options.username,
    password: options.password,
    host: options.host,
    port: options.port,
    tls: options.tls
  });

  imap.once('ready', function() {

    // Second argument is for readOnly
    // TODO: second argument depending if to delete email after reading
    // NOTE: not using an arrow function because doesn't inherit this
    imap.openBox(options.label, true, function(err, box) {

      if (err) {
        that.emit('error', err);
      } else {
        that.emit('ready');
        // searchMail();
      }

    });

    // Listen to new emails
    imap.on('mail', function(count) {
      searchMail();
    });

  });

  imap.once('error', function(err) {
    that.emit('error', err);
  });

  imap.once('end', function() {
    that.emit('end');
  });

  var fetchMessages = function(results) {

    // fetch emails from search results
    var f = imap.fetch(results, {
      struct: true,
      markSeen: true,
      bodies: 'TEXT'
    });

    // on each mail
    f.on('message', function(msg) {

      // on reading mail body
      msg.on('body', function(stream, info) {
        var buffer = '';

        console.log(info);

        stream.on('data', function(chunk) {
          buffer += chunk.toString('utf8');
        });

        stream.once('end', function() {

          // decode email from Quoted-printable format
          var emailBody = mimelib.decodeQuotedPrintable(buffer);
          var regexResults = emailBody.match(searchRegex);

          if (regexResults.length != 3) {
            that.emit('error', 'No session url found');
          } else {
            var sessionId = regexResults[1],
                sessionToken = regexResults[2];

            that.emit('session', sessionId, sessionToken);
          }

        });

      });
    });

    f.on('error', function(err) {
      console.log('Fetch error: ' + err);
    });

    f.once('end', function() {
      console.log('Done fetching all messages!');
    });
  };

  var searchMail = function() {
    // search for unseen emails from garmin
    var f = imap.search([
      // 'UNSEEN',
      ['FROM', 'noreply@garmin.com']
    ], function(err, results) {

      if (err) {
        MailService.emit('error', err);
      } else if (!results.length) {
        MailService.emit('error', 'No livetrack emails found');
      } else {
        fetchMessages(results);
      }

    });
  };

  imap.connect();
};

MailService.prototype.__proto__ = events.EventEmitter.prototype;

module.exports = MailService;