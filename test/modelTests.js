"use strict";

const util = require("../main/util.js");
const testUtil = require("./testUtil.js");
const assert = require('chai').assert;
const modelTester = require('./modelTester.js');

module.exports.run = async function(orm) {
    testUtil.logInfo("running model tests...");
    let models = orm.getModelList();
    let success = true;
    for (let i = 0; i < models.length; ++i) {
        try {
            let md = orm.getMetaData(models[i]);
            assert(util.isDefined(md), 'failed to load metadata for model ' + models[i]);
            assert(md.getObjectName() === models[i], 'model/metadata mismatch: expected ' + models[i] + ' but found ' + md.getObjectName());
            modelTester.test(orm.newModelInstance(md), md);
        }
        
        catch (e) {
            testUtil.logError('Exception in modelTests[' + models[i] + '] - ' + e);
            success = false;
            if (orm.testConfiguration.stopTestsOnFailure) {
                break;
            }
        }
    }

    if (success) {
        testUtil.logInfo("    - model tests complete [SUCCESS]");
    } else {
        testUtil.logInfo("    - model tests complete");
    }
};

