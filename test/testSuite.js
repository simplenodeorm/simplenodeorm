"use strict";

const testUtil = require("./testUtil.js");
const ormTests = module.require("./ormTests.js");
const modelTests = module.require("./modelTests.js");
const repositoryTests = module.require("./repositoryTests.js");
const orm = require("../orm.js");

module.exports.run = async function() {
    testUtil.logInfo("running testSuite...");
    
    try {
        await ormTests.run(orm);
        await modelTests.run(orm);
        await repositoryTests.run(orm);
    }
    
    catch (e) {
        testUtil.logError('Exception in testSuite ' + e.stack);
    }
    
    testUtil.logInfo("testSuite complete");
};
