"use strict";


const Authorizer = require('./Authorizer.js');

class DefaultAuthorizer extends Authorizer {
    authenticate(orm, req, user, pass) {
        return true;
    }

    authorize(orm, options, req) {
        return true
    }

}

module.exports = DefaultAuthorizer;
