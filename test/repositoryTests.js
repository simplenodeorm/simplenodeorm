/*
 * Copyright (c) 2019  simplenodeorm.org
 */

"use strict";

const testUtil = require('./testUtil.js');
const repositoryTester = require('./repositoryTester.js');

module.exports.run = async function(orm) {
    testUtil.logInfo("running repository tests...");
    let modelList = orm.getModelList();

    for (let i = 0; i < modelList.length; ++i) {
        try {
            let repo = orm.getRepository(modelList[i]);
            let md = orm.getMetaData(modelList[i]);
            let nm = (md.getObjectName() + 'Repository');

            if (modelList[i] !== "Film") {
                // exit test based on orm.testConfiguration.stopTestsOnFailure
                if (!testUtil.outputTestResults(nm, await repositoryTester.test(repo))) {
                    break;
                }
            }
        }

        catch (e) {
            testUtil.logError('Exception in repositoryTests[' + modelList[i].name + 'Repository] - ' + e.stack);
        }
    }

    testUtil.logInfo("    - repository tests complete");
};
