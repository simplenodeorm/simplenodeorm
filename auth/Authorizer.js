"use strict";

const util = require('../main/util.js');

const loginCache = new Set();
let clearCount = 0;

class Authorizer {
    isAuthenticated(orm, req, user, pass) {
        let retval;
        let context = util.getContextFromUrl(req);
        if (this.isLoggedIn(context + '.' + user)) {
            retval = true;
        } else {
            retval = this.authenticate(orm, req, user, pass);
            if (retval) {
                loginCache.add(context + '.' + user);
            }
        }

        return retval;
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
            clearCount++;
        }
    }
}

module.exports = Authorizer;
