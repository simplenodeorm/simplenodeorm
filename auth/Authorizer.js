"use strict";

const util = require('../main/util.js');
const NodeCache = require( "node-cache" );

const myCache = new NodeCache( { stdTTL: 60, checkperiod: 100 } );

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

    setKey(key) {
        myCache.set(key, true);
    }

    getKey(key) {
        return myCache.get(key);
    }
}

module.exports = Authorizer;
