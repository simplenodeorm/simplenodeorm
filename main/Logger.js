const fs = require('fs');
const appConfiguration = JSON.parse(fs.readFileSync('./appconfig.json'));
const ERROR = 'error';
const WARN = 'warning';
const INFO = 'info';
const DEBUG = 'debug';

const winston =  require('winston');
var twoDigit = '2-digit';
var options = {
  day: twoDigit,
  month: twoDigit,
  year: twoDigit,
  hour: twoDigit,
  minute: twoDigit,
  second: twoDigit
};


function formatter(args) {
  var dateTimeComponents = new Date().toLocaleTimeString('en-us', options).split(',');
  var logMessage = dateTimeComponents[0] + dateTimeComponents[1] + ' - ' + args.level + ': ' + args.message;
  return logMessage;
}

const logger = winston.createLogger({
  level: appConfiguration.logLevel,
  transports: [
    new winston.transports.File({ 
        filename: appConfiguration.logFile, 
        maxSize: 5000000, 
        maxFiles: 5, 
        handleExceptions: true,
        format: winston.format.combine(
            winston.format.timestamp({format: 'YYYY-MM-DD HH:mm:ss'}),
            winston.format.json()) 
     }),
    new winston.transports.Console({format: winston.format.simple(), handleExceptions: true})
  ]
});

module.exports.ERROR = ERROR;
module.exports.WARN = WARN;
module.exports.INFO = INFO;
module.exports.DEBUG = DEBUG;

module.exports.logDebug = function(msg) {
    logger.debug(msg);
};

module.exports.logInfo = function(msg) {
    logger.info(msg);
};

module.exports.logWarning = function(msg, e) {
    if (e) {
        msg += (' - ' + String(e));
    }
    
    logger.warn(msg);
};

module.exports.logError = function(msg, e) {
    if (e) {
        msg += (' - ' + String(e) + '\n' + e.stack);
    }
    logger.error(msg);
};

module.exports.isLogDebugEnabled = function() {
    return (logger.levels[logger.level] >= logger.levels[DEBUG]);
};

module.exports.isLogInfoEnabled = function() {
    return (logger.levels[logger.level] >= logger.levels[INFO]);
};


