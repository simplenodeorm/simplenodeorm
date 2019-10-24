/*
 * Copyright (c) 2019  simplenodeorm.org
 */

"use strict";

const poolAlias = 'sakila';
const Repository = require('../../../main/Repository');

class CityRepository extends Repository {
    constructor(metaData) {
        super(poolAlias, metaData);
    };
    
    loadNamedDbOperations() {
        // define named database operations here - the convention is as follows
        // namedDbOperations.set('functionName', 'objectQuery')
        // example: select Account o from Account where o.finCoaCd = :finCoaCd
        // and o.accountNbr := accountNbr
    };
}

module.exports = function(metaData) {
    return new CityRepository(metaData);
};
