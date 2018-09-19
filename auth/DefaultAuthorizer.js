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
};

module.exports = DefaultAuthorizer;
