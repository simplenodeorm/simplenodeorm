"use strict";

class Authorizer {
    isAuthorized(user, pass) {
        return false;
    }
    
    checkAuthorization(req) {
        return false;
    }

}

module.exports = Authorizer;
