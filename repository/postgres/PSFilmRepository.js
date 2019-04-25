"use strict";

const poolAlias = 'dvdrent';
const Repository = require('../../main/Repository.js');

class PSFilmRepository extends Repository {
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
    return new PSFilmRepository(metaData);
};
