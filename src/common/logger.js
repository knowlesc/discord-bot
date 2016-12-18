'use strict'

var winston = require("winston");
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

  debug(message) {
    if (this.appName) {
      message = "[" + this.appName + "] " + message;
    }
    logger.log("debug", message);
  }

  info(message) {
    if (this.appName) {
      message = "[" + this.appName + "] " + message;
    }
    logger.log("info", message);
  }

  error(error) {
    var message = (this.appName) ? "[" + this.appName + "] " : "";
    if (error instanceof Error) {
      message += error.name + ": " + error.message;
    } else {
      message += "Error: " + error;
    }
    logger.log("error", message);
  }
}

module.exports = Logger;