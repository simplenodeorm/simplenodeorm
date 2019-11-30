/*
 * Copyright (c) 2019  simplenodeorm.org
 */

"use strict";

const Repository = require('../../../main/Repository');

class CustomerRepository extends Repository {
    constructor(metaData) {
        super(metaData, "mysql");
    };
    
    loadNamedDbOperations() {
        // define named database operations here - the convention is as follows
        // namedDbOperations.set('functionName', 'objectQuery')
        // example: select Account o from Account where o.finCoaCd = :finCoaCd
        // and o.accountNbr := accountNbr
    };
}

module.exports = function(metaData) {
    return new CustomerRepository(metaData);
};
