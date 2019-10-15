"use strict";

const util = require('../main/util.js');

class Authorizer {
    isAuthenticated(orm, req, user, pass) {
        return this.authenticate(orm, req, user, pass);
    }

    authenticate(orm, req, user, pass) {
        return false;
    }

    isAuthorized(orm, options, req) {
        return this.authorize(orm, options, req);
    }

    authorize(orm, req) {
        return false
    }
}

module.exports = Authorizer;
