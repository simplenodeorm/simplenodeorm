"use strict";

const assert = require('chai').assert;
const util = require('../main/util.js');
const testUtil = require("./testUtil.js");

module.exports.run = async function(orm) {
    testUtil.logInfo("running orm tests...");
    let models = orm.getModelList();
    assert(util.isDefined(models) || (models.length > 0), 'failed to load orm model list');
    let repo = orm.getRepository(models[0]);
    assert(util.isDefined(repo), 'failed to load repositoryMap');
    assert(util.isDefined(repo.getMetaData()), 'failed to load metaDataMap');
    let poolSet = new Set();
    for (let i = 0; i < models.length; ++i) {
        repo = orm.getRepository(models[i]);
        assert(util.isDefined(repo), 'failed to load ' + models[i] + 'Repository');
        let md = repo.getMetaData();
        assert(util.isDefined(md), 'failed to load ' + models[i] + 'MetaData');
        assert(util.isDefined(orm.newModelInstance(md)), 'failed to load ' + models[i]);
        poolSet.add(repo.getPoolAlias());
        assert(util.isDefined(orm.getMetaData(models[i])), 'failed to load ' + models[i] + 'MetaData');
    }
    
    
    for (let alias of poolSet) {
        let conn;
        try {
            conn = await orm.getConnection(alias);
            assert(util.isDefined(conn), 'failed to obtain database connection for pool alias ' + alias);
        }

        finally {
            if (conn) {
                await conn.close();
            }
        }
    }

    testUtil.logInfo("    - orm tests complete");
};

