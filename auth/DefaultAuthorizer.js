/*
 * Copyright (c) 2019  simplenodeorm.org
 */

"use strict";


const Authorizer = require('./Authorizer.js');

class DefaultAuthorizer extends Authorizer {
    async authenticate(orm, req, user, pass) {
        return true;
    }

    async authorize(orm, options, req) {
        return true
    }

}

module.exports = DefaultAuthorizer;
