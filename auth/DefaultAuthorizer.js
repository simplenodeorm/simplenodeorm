"use strict";

const logger = require('../main/Logger.js');
const Authorizer = require('./Authorizer.js');

class DefaultAuthorizer extends Authorizer {
    constructor() {
        super();
    }
    
    isAuthorized(username, password) {
        logger.logInfo('username: ' + username);
        return true;
    }
};

module.exports = DefaultAuthorizer;
