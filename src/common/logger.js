'use strict'

var winston = require("winston");
winston.add(winston.transports.File, { filename: 'app.log' });

class Logger {

  constructor(appName) {
    this.appName = appName;
  }

  info(message) {
    if (this.appName) {
      message = "[" + this.appName + "] " + message;
    }
    winston.log("info", message);
  }

  error(error) {
    var message = (this.appName) ? "[" + this.appName + "] " : "";
    if (error instanceof Error) {
      message += error.name + ": " + error.message;
    } else {
      message += "Error: " + error;
    }
    winston.log("error", message);
  }
}

module.exports = Logger;