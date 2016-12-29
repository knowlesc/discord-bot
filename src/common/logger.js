'use strict'

var winston = require('winston');
var logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)({
      level: 'info'
    }),
    new (winston.transports.File)({
      filename: 'app.log',
      level: 'debug'
    })
  ]
});

class Logger {

  constructor(appName) {
    this.appName = appName;
  }

  debug(message, category) {
    logger.log('debug', this.appendMessagePrefix(message, category));
  }

  info(message, category) {
    logger.log('info', this.appendMessagePrefix(message, category));
  }

  error(error, category) {
    var message = '';
    if (error instanceof Error) {
      message = error.name + ': ' + error.message;
    } else {
      message = 'Error: ' + error;
    }

    logger.log('error', this.appendMessagePrefix(message, category));
  }

  appendMessagePrefix(message, category) {
    var prefix = '';

    if (category) {
      prefix = '[' + category + '] ';
    } else if (this.appName) {
      prefix = '[' + this.appName + '] ';
    }

    return prefix + message;
  }
}

module.exports = Logger;