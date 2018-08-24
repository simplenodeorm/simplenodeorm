"use strict";

const util = require("../main/util.js");
const testUtil = require("./testUtil.js");
const assert = require('chai').assert;

module.exports.run = async function(orm) {
    testUtil.logInfo("running model tests...");
    let models = orm.getModelList();
    
    for (let i = 0; i < models.length; ++i) {
        try {
            let md = orm.getMetaData(models[i]);
            assert(util.isDefined(md), 'failed to load metadata for model ' + models[i]);
            assert(md.getObjectName() === models[i], 'model/metadata mismatch: expected ' + models[i] + ' but found ' + md.getObjectName());
            let test = require("./" + md.module.replace(".js", "Test.js"));            
            await test.run(md);
        }
        
        catch (e) {
            testUtil.logError('Exception in modelTests[' + models[i] + '] - ' + e);
            if (orm.testConfiguration.stopTestsOnFailure) {
                break;
            }
        }
    }

    testUtil.logInfo("    - model tests complete");
};

