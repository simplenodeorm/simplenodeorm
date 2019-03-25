"use strict";

const poolAlias = 'hrdb';
const Repository = require('../../main/Repository.js');

class JobHistoryRepository extends Repository {
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
    return new JobHistoryRepository (metaData);
};
