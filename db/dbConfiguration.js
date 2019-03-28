"use strict";

const oracledb = require('oracledb');
const mysqldb = require('promise-mysql');
const util = require("../main/util.js");
const fs = require('fs');
const logger = require('../main/Logger.js');

module.exports = function(poolCreatedEmitter, appConfiguration, testConfiguration, dbTypeMap) {
    if (appConfiguration.testMode) {
        initPool(testConfiguration.testDbConfiguration, poolCreatedEmitter, dbTypeMap);
    } else {
        initPool(appConfiguration.dbConfiguration, poolCreatedEmitter, dbTypeMap);
    }
};

async function initPool(securityPath, poolCreatedEmitter, dbTypeMap) {
    logger.logInfo("creating connection pools...");
    
    // read db connection info
    let pdefs = JSON.parse(fs.readFileSync(securityPath));
    let haveOracle = false;
    for (let i = 0; i < pdefs.pools.length; ++i) {
        let pool;
        switch(pdefs.pools[i].dbtype) {
            case util.ORACLE:
                pool = await oracledb.createPool(pdefs.pools[i]);
                haveOracle = true;
                break;
            case util.MYSQL:
                pool = mysqldb.createPool(pdefs.pools[i]);
                break;
        }


        if (pool) {
            logger.logInfo("    " + pdefs.pools[i].poolAlias + " connection pool created");
            dbTypeMap.set(pdefs.pools[i].poolAlias, pdefs.pools[i].dbtype);
            dbTypeMap.set(pdefs.pools[i].poolAlias + '.pool', pool);
        } else {
            logger.logWarning('invalid dbtype: ' + pdefs.pools[i].dbtype)
        }
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
};

