"use strict";

const logger = require('../main/Logger.js');
const Authorizer = require('./Authorizer.js');

class DefaultAuthorizer extends Authorizer {
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
        return true;
    }
};

module.exports = DefaultAuthorizer;
