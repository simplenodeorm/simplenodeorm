"use strict";

const util = require('../main/util.js');

class Authorizer {
    async isAuthenticated(orm, req, user, pass) {
        return await this.authenticate(orm, req, user, pass);
    }

    async authenticate(orm, req, user, pass) {
        return false;
    }

    async isAuthorized(orm, options, req) {
        return await this.authorize(orm, options, req);
    }

    async authorize(orm, req) {
        return false
    }
}

module.exports = Authorizer;
