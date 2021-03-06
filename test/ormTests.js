/*
 * Copyright (c) 2019  simplenodeorm.org
 */

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
        repo = orm.getRepository(models[0]);
        assert(util.isDefined(repo), 'failed to load repositoryMap');
        assert(util.isDefined(repo.getMetaData()), 'failed to load metaDataMap');
    } else {
        testUtil.logWarning("no model objects found");
    }
    
    for (let i = 0; i < models.length; ++i) {
        repo = orm.getRepository(models[i]);
        if (repo.dbType) {
            assert(util.isDefined(repo), 'failed to load ' + models[i].name + 'Repository');
            let md = repo.getMetaData();
            assert(util.isDefined(md), 'failed to load ' + models[i].name + 'MetaData');
            assert(util.isDefined(orm.newModelInstance(md)), 'failed to load ' + models[i].name);
            assert(util.isDefined(orm.getMetaData(models[i])), 'failed to load ' + models[i].name + 'MetaData');
        }
    }
    
    // exit test based on orm.testConfiguration.stopTestsOnFailure
    assert(await testUtil.outputTestResults('query designer query tests',
        await runQueryDesignerQueryTests(orm)), 'query designer query test failures');
    testUtil.logInfo("    - orm tests complete");
};

async function runQueryDesignerQueryTests(orm) {
    testUtil.logInfo("    - starting query designer query tests...");
    let testResults = [];
    if (fs.existsSync(orm.testConfiguration.testDataRootPath + '/querydesigner')) {
        let flist = fs.readdirSync(orm.testConfiguration.testDataRootPath + '/querydesigner');

        if (!flist || (flist.length === 0)) {
            testResults.push(require('./testStatus.js')(util.WARN, 'no query designer test query documents found', 'ormTests.runQueryDesignerQueryTests'));
        } else {
            for (let i = 0; i < flist.length; ++i) {
                if (flist[i].startsWith("test_query")) {
                    testUtil.logInfo("    - test query file " + flist[i] + '...');
                    try {
                        let doc = JSON.parse(fs.readFileSync(orm.testConfiguration.testDataRootPath + '/querydesigner/' + flist[i]));
                        let sql = orm.buildQueryDocumentSql(doc);
                        let repo = orm.getRepository(doc.document.rootModel);
                        if (!repo) {
                            testResults.push(require('./testStatus.js')(util.ERROR,
                                'failed to find repository query document root model' + doc.document.rootModel,
                                'ormTests.runQueryDesignerQueryTests'));
                        }
                        let resultSet = await repo.executeSqlQuery(sql, []);
                        if (resultSet.error) {
                            testResults.push(require('./testStatus.js')(util.ERROR,
                                'query for document ' + flist[i] + ' returned error - ' + util.toString(resultSet.error),
                                'ormTests.runQueryDesignerQueryTests'));
                        }
                        let objectGraph = orm.buildResultObjectGraph(doc, resultSet.result.rows);

                        if (!objectGraph) {
                            testResults.push(require('./testStatus.js')(util.ERROR,
                                'failed to build object graph from query document ' + flist[i] + ' result set',
                                'ormTests.runQueryDesignerQueryTests'));
                        } else {
                            await testUtil.verifyQueryDesignerQueryResults(repo, doc, resultSet, JSON.parse(objectGraph), testResults);
                        }

                    } catch (e) {
                        testResults.push(require('./testStatus.js')(util.ERROR,
                            'An unexpected exception was thrown - ' + e, 'ormTests.runQueryDesignerQueryTests'));
                    }

                }
            }
        }
    }
    return testResults;
}
