"use strict";

class Authorizer {
    isAuthorized(orm, user, pass) {
        return false;
    }
    
    checkAuthorization(orm, req) {
        return false;
    }
}

module.exports = Authorizer;
