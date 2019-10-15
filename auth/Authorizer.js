"use strict";

const util = require('../main/util.js');

const myCache = new NodeCache( { stdTTL: 60, checkperiod: 100 } );

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

    setKey(key) {
        myCache.set(key, true);
    }

    getKey(key) {
        return myCache.get(key);
    }
}

module.exports = Authorizer;
