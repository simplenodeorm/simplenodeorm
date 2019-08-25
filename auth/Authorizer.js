"use strict";

const util = require('../main/util.js');

const loginCache = new Set();
let clearCount = 0;

class Authorizer {
    async isAuthenticated(orm, req, user, pass) {
        let context = util.getContextFromUrl(req);
        if (this.isLoggedIn(context + '.' + user)) {
            return true;
        } else {
            let retval = this.authenticate(orm, req, user, pass);
            if (retval) {
                loginCache.add(context + '.' + user);
            }
        }
    }

    authenticate(orm, req, user, pass) {
        return false;
    }

    isAuthorized(orm, options, req) {
        return this.authorize(orm, options, req);
    }

    async authorize(orm, req) {
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
