"use strict";

const util = require('../main/util.js');

const loginCache = new Map();
let clearCount = 0;

class Authorizer {
    isAuthenticated(orm, req, user, pass) {
        let schema = util.getContextFromUrl(req);
        if (this.isLoggedIn(schema + '.' + user)) {
            return true;
        } else {
            return this.authenticate(orm, req, user, pass);
        }
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

    isLoggedIn(key) {
        let retval = loginCache.has(key);
        if (clearCount > 1000) {
            loginCache.clear();
            clearCount = 0;
        } else {
            clearCount = 0;
        }

    }
}

module.exports = Authorizer;
