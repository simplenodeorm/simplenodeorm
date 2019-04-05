"use strict";

const fs = require('fs');
const assert = require('chai').assert;
const util = require('../main/util.js');
const testUtil = require("./testUtil.js");

module.exports.run = async function(orm) {
    testUtil.logInfo("running orm tests...");
    let models = orm.getModelList();
    assert(util.isDefined(models) || (models.length > 0), 'failed to load orm model list');
    let repo;
    
    if (models.length > 0) {
        repo = orm.getRepository(models[0].name);
        assert(util.isDefined(repo), 'failed to load repositoryMap');
        assert(util.isDefined(repo.getMetaData()), 'failed to load metaDataMap');
    } else {
        testUtil.logWarning("no model objects found");
    }
    
    let poolSet = new Set();
    for (let i = 0; i < models.length; ++i) {
        repo = orm.getRepository(models[i].name);
        assert(util.isDefined(repo), 'failed to load ' + models[i].name + 'Repository');
        let md = repo.getMetaData();
        assert(util.isDefined(md), 'failed to load ' + models[i].name + 'MetaData');
        assert(util.isDefined(orm.newModelInstance(md)), 'failed to load ' + models[i].name);
        poolSet.add(repo.getPoolAlias());
        assert(util.isDefined(orm.getMetaData(models[i].name)), 'failed to load ' + models[i].name + 'MetaData');
    }
    
    
    for (let alias of poolSet) {
        let conn;
        try {
            conn = await orm.getConnection(alias);
            assert(util.isDefined(conn), 'failed to obtain database connection for pool alias ' + alias);
        }

        finally {
            if (conn) {
                switch(orm.getDbType(alias)) {
                    case util.ORACLE:
                        await conn.close();
                        break;
                    case util.MYSQL:
                        await conn.release();
                        break;
                }
            }
        }
    }
    
    await runQueryDesignerQueryTests(orm, models);

    testUtil.logInfo("    - orm tests complete [SUCCESS]");
};

async function runQueryDesignerQueryTests(orm, models) {
    testUtil.logInfo("    - starting query designer query tests...");
    let flist = fs.readdirSync('./test/testdata/querydesigner');
    
    for (let i = 0; i < flist.length; ++i) {
        if (flist[i].startsWith("test_query")) {
            testUtil.logInfo("    - test query file " + flist[i] + '...');
        }
    }
}
