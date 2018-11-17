"use strict";

const fs = require('fs');
const logger = require('../main/Logger.js');
const Authorizer = require('./Authorizer.js');
const appConfiguration = JSON.parse(fs.readFileSync('./appconfig.json'));

class DefaultDeleteAuthorizer extends Authorizer {
     constructor() {
        super();
    }
    
    isAuthorized(username, password) {
        if (logger.isLogDebugEnabled()) {
            logger.logDebug("username: " + username);
        }
        return true;
    }
    
    checkAuthorization(req) {
        return appConfiguration.allowUpdates || appConfiguration.testMode;
    }
};

module.exports = DefaultDeleteAuthorizer;
