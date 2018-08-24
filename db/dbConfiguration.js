"use strict";

const oracledb = require('oracledb');
const util = require("../main/util.js");
const fs = require('fs');
const logger = require('../main/Logger.js');
const dbType = new Map();

module.exports = function(poolCreatedEmitter, appConfiguration, testConfiguration) {
    if (appConfiguration.testMode) {
        initPool(testConfiguration.testDbConfiguration, poolCreatedEmitter);
    } else {
        initPool(appConfiguration.dbConfiguration, poolCreatedEmitter);
    }
};

async function initPool(securityPath, poolCreatedEmitter) {
    logger.logInfo("creating connection pools...");
    
    // read db connection info
    let pdefs = JSON.parse(fs.readFileSync(securityPath));
    
    for (let i = 0; i < pdefs.pools.length; ++i) {
        await oracledb.createPool(pdefs.pools[i]).then(function(pool) {
            logger.logInfo("    " + pool.poolAlias + " connection pool created");
            dbType.set(pool.poolAlias, pool.tdbType);
        });
    }

    if (util.isDefined(oracledb)) {
        // fetch CLOBS as string
        oracledb.fetchAsString = [ oracledb.CLOB ];
        oracledb.fetchAsBuffer = [ oracledb.BLOB ];
    }
    
    // tell orm init that pools are created
    poolCreatedEmitter.emit('poolscreated');

}

module.exports.getDbType = function(alias) {
    return dbType.get(alias);
}

