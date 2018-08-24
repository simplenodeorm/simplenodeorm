"use strict";

const util = require("../main/util.js");
const testUtil = require('./testUtil.js');
const fs = require('fs');
module.exports.run = async function(orm) {
    testUtil.logInfo("running repository tests...");
    let modelList = orm.getModelList();

    for (let i = 0; i < modelList.length; ++i) {
        try {
            let repo = orm.getRepository(modelList[i]);
            let md = orm.getMetaData(modelList[i]);
            let nm = (md.getObjectName() + 'Repository');
            let test = require("./" + repo.getModule().replace(".js", "Test.js"));
            
            // exit test based on orm.testConfiguration.stopTestsOnFailure
            if (!testUtil.outputTestResults(nm, await test.run(repo))) {
                break;
            }
        }

        catch (e) {
            testUtil.logError('Exception in repositoryTests[' + modelList[i] + 'Repository] - ' + e.stack);
        }
    }

    testUtil.logInfo("    - repository tests complete");
};
