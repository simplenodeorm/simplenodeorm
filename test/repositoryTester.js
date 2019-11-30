/*
 * Copyright (c) 2019  simplenodeorm.org
 */

"use strict";

const orm = require('../orm.js');
const util = require("../main/util.js");
const testUtil = require("./testUtil.js");
const assert = require('chai').assert;

module.exports.test = async function( repository) {
    let metaData = repository.getMetaData();
    testUtil.logInfo('    - testing ' + metaData.objectName + 'Repository...');
    let testResults = [];

    // test function array - both sync and async versions will be tested
    let functions = [
        testFindOne,
        testFind,
        testCount,
        testGetAll,
        testExists,
        testSave,
        testDelete];

    let functionNames = [
        "findOne",
        "find",
        "count",
        "getAll",
        "exists",
        "save",
        "delete"];
    if (util.isUndefined(repository)) {
        testResults.push(require('./testStatus.js')(util.ERROR, 'no repository found for ' + metaData.objectName, 'test.run'));
    } else {
        let lastTest;
        try {
            let metaData = repository.getMetaData();
            if (util.isUndefined(metaData)) {
                testResults.push(require('./testStatus.js')(util.ERROR, 'no meta data definition found for ' + metaData.objectName, 'test.run'));
            }

            lastTest = functionNames[0];
            // test relationship field/column handling
            testRelationshipHandling(repository, metaData);
            // test findOne first false is returned that indicates
            // table is empty so skip rest of tests except tesrSave with insert only
            testUtil.logInfo("        testing " + functionNames[0]);
            if (await functions[0](repository, testResults)) {
                for (let i = 1; i < functions.length; ++i) {
                    lastTest = functionNames[i];
                    testUtil.logInfo("        testing " + functionNames[i]);
                    await functions[i](repository, testResults);

                    // if save try to test insert
                    if (i === 5) {
                        await functions[i](repository, testResults, true);
                    }
                }
            } else {
                await testSave(repository, testResults, true);
            }
        } catch(e) {
            testResults.push(require('./testStatus.js')(util.ERROR,  repository.getMetaData().objectName + 'Repository: unexpected exception thrown ' + e, lastTest));

        }
     }

     return testResults;
};

async function testRelationshipHandling(repository, metaData) {
    if (util.isDefined(metaData.getOneToOneDefinitions())) {
        // test one-to-one definitions
        for (let i = 0; i < metaData.getOneToOneDefinitions().length; ++i) {
            let otoMd = orm.getMetaData(metaData.getOneToOneDefinitions()[i].targetModelName);
            let ref = metaData.getOneToOneDefinitions()[i];
            let refField = metaData.getOneToOneDefinitions()[i].fieldName + '.' + otoMd.fields[0].fieldName;
            let refColumn = 't0_' + ref.alias + '_0.' + otoMd.fields[0].columnName;
            let col = repository.getColumnNameFromFieldName(refField);
            assert(col === refColumn, 'expected column name to be ' + refColumn + ' but was ' + col);
        }
    }

    if (util.isDefined(metaData.getOneToManyDefinitions())) {
        // test one-to-many definitions
        for (let i = 0; i < metaData.getOneToManyDefinitions().length; ++i) {
            let otmMd = orm.getMetaData(metaData.getOneToManyDefinitions()[i].targetModelName);
            let ref = metaData.getOneToManyDefinitions()[i];
            let refField = metaData.getOneToManyDefinitions()[i].fieldName + '.' + otmMd.fields[0].fieldName;
            let refColumn = 't0_' + ref.alias + '_0.' + otmMd.fields[0].columnName;
            let col = repository.getColumnNameFromFieldName(refField);
            assert(col === refColumn, 'expected column name to be ' + refColumn + ' but was ' + col);
        }
    }
}

async function testFindOne(repository,  testResults) {
    let retval;
    let result = await testUtil.findExampleData(repository);

    if (result) {
       if (util.isDefined(result.error)) {
            testResults.push(require('./testStatus.js')(util.ERROR, util.toString(result.error), util.FIND_ONE));
            retval = false;
        } else if (result.nodata) {
            testResults.push(require('./testStatus.js')(util.WARN,  repository.getMetaData().objectName + 'Repository: no test data found in table ' + repository.getMetaData().tableName, util.FIND_ONE));
            retval = false;
        } else if (util.isDefined(result.result)) {

            let pkfields = repository.getMetaData().getPrimaryKeyFields();
            let params = [];
            for (let i = 0; i < pkfields.length; ++i) {
               params.push(result.result.rows[0][i]);
            }
            testUtil.verifyRepositoryTestResult(repository, util.FIND_ONE, result.result, await repository.findOne(params, {poolAlias: orm.testConfiguration.poolAlias}), testResults);
            retval =  true;
        }
     }

     return retval;
}

async function testFind(repository, testResults) {
    await testUtil.findExampleData(repository, 10).then(async function(result) {
        if (util.isDefined(result.error)) {
            testResults.push(require('./testStatus.js')(util.ERROR, util.toString(result.error), util.FIND));
        } else if (result.nodata) {
            testResults.push(require('./testStatus.js')(util.WARN,  repository.getMetaData().objectName + 'Repository: no test data found in table' + repository.getMetaData().tableName, util.FIND));
        } else if (util.isDefined(result.result)) {
            let whereList = testUtil.getFindTestWhereLists(repository, result.result);
            if (whereList.length === 0) {
                testResults.push(require('./testStatus.js')(util.WARN,  repository.getMetaData().objectName + 'Repository: no test data found in table ' + repository.getMetaData().tableName, util.FIND));
            } else {
                 for (let i = 0; i < whereList.length; ++i) {
                    await testUtil.verifyRepositoryTestResult(repository, util.FIND, whereList[i], await repository.find(whereList[i], [], {poolAlias: orm.testConfiguration.poolAlias}), testResults);
                 }
             }
        }
    });
}

async function testGetAll(repository, testResults) {
    // control getAll test to only test tables with small number of rows
    if (await testUtil.isGetAllTestAllowed(repository, testResults)) {
        await testUtil.verifyRepositoryTestResult(repository, util.GET_ALL, {}, await repository.getAll({poolAlias: orm.testConfiguration.poolAlias}), testResults);
    } else {
        testResults.push(require('./testStatus.js')(util.WARN,  'not performing getAll() test on ' + repository.getMetaData().objectName, util.GET_ALL));
    }
}

async function testExists(repository,testResults) {
    return await testUtil.findExampleData(repository).then(async function(result) {
        if (util.isDefined(result.error)) {
            testResults.push(require('./testStatus.js')(util.ERROR, util.toString(result.error), util.EXISTS));
        } else if (result.nodata) {
            testResults.push(require('./testStatus.js')(util.WARN,  repository.getMetaData().objectName + 'Repository: no test data found in table ' + repository.getMetaData().tableName, util.EXISTS));
        } else if (util.isDefined(result.result)) {
            let pkfields = repository.getMetaData().getPrimaryKeyFields();
            let model = orm.newModelInstance(repository.getMetaData());
            let foundpk = true;
            for (let i = 0; i < pkfields.length; ++i) {
                let val = result.result.rows[0][i];

                if (util.isUndefined(val)) {
                    testResults.push(require('./testStatus.js')(util.ERROR, 'no primary key value found for field ' + pkfields[i].fieldName, util.EXISTS));
                    foundpk = false;
                    break;
                } else {
                    model.__setFieldValue(pkfields[i].fieldName, result.result.rows[0][i]);
                }
            }

            if (foundpk) {
                await testUtil.verifyRepositoryTestResult(repository, util.EXISTS, result.result, await repository.exists(model, {poolAlias: orm.testConfiguration.poolAlias}), testResults);
           }
        }
    });
}

async function testCount(repository,  testResults) {
    await testUtil.testCount(repository, testResults);
}

async function testSave(repository, testResults, insertOnly) {
    await testUtil.testSave(repository, testResults, insertOnly);
}

async function testDelete(repository, testResults) {
    await testUtil.testDelete(repository, testResults);
}


