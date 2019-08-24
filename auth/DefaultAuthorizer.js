"use strict";

const Authorizer = require('./Authorizer.js');

class DefaultAuthorizer extends Authorizer {
     constructor() {
        super();
    }
    
    isAuthorized(orm, username, password) {
        if (orm.logger.isLogDebugEnabled()) {
            orm.logger.logDebug("username: " + username);
        }
        return true;
    }
    
    checkAuthorization(orm, req) {
        return true;
    }
}

module.exports = DefaultAuthorizer;
