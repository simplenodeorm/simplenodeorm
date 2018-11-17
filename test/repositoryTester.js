"use strict";

const orm = require('../orm.js');
const util = require("../main/util.js");
const testUtil = require("./testUtil.js");
const assert = require('chai').assert;

module.exports.test = async function( repository) {
    let metaData = repository.getMetaData();
    testUtil.logInfo('    - testing ' + metaData.objectName + 'Repository...');
    let testResults = new  Array();

    // test function array
    let functions = [
        testFindOne,
        testFind,
        testCount,
        testGetAll,
        testExists,
        testSave,
        testDelete];

    if (util.isUndefined(repository)) {
        testResults.push(require('../../testStatus.js')(util.ERROR, 'no repository found for ' + metaData.objectName, 'test.run'));
    } else {
        let metaData = repository.getMetaData();
        if (util.isUndefined(metaData)) {
            testResults.push(require('../../testStatus.js')(util.ERROR, 'no meta data definition found for ' + metaData.objectName, 'test.run'));
        }

        if (util.isUndefined(repository.getPoolAlias())) {
            testResults.push(require('../../testStatus.js')(util.ERROR, 'no pool alias found in ' +  metaData.objectName + 'Repository', 'test.run'));
        }

        // test relationship field/column handling
        testRelationshipHandling(repository, metaData);
        // test findOne first false is returned that indicates 
        // table is empty so skip rest of tests except tesrSave with insert only
        if (await functions[0](repository, testResults)) {
            for (let i = 1; i < functions.length; ++i) {
                await functions[i](repository, testResults);
            }
         } else {
             await testSave(repository, testResults, true);
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
            let refField = metaData.getOneToOneDefinitions()[i].fieldName + '.' + otoMd.getFields()[0].fieldName;
            let refColumn = ref.alias + '.' + otoMd.getFields()[0].columnName;
            let col = repository.getColumnNameFromFieldName(refField);
            assert(col === refColumn, 'expected column name to be ' + refColumn + ' but was ' + col);
        }
    }

    if (util.isDefined(metaData.getOneToManyDefinitions())) {
        // test one-to-many definitions
        for (let i = 0; i < metaData.getOneToManyDefinitions().length; ++i) {
            let otmMd = orm.getMetaData(metaData.getOneToManyDefinitions()[i].targetModelName);
            let ref = metaData.getOneToManyDefinitions()[i];
            let refField = metaData.getOneToManyDefinitions()[i].fieldName + '.' + otmMd.getFields()[0].fieldName;
            let refColumn = ref.alias + '.' + otmMd.getFields()[0].columnName;
            let col = repository.getColumnNameFromFieldName(refField);
            assert(col === refColumn, 'expected column name to be ' + refColumn + ' but was ' + col);
        }
    }
};

async function testFindOne(repository,  testResults) {
    await testUtil.findExampleData(repository.getPoolAlias(), repository.getMetaData()).then(async function(result) {
        if (util.isDefined(result.error)) {
            testResults.push(require('../../testStatus.js')(util.ERROR, util.toString(result.error), util.FIND_ONE));
            return true;
        } else if (result.nodata) {
            testResults.push(require('../../testStatus.js')(util.WARN,  repository.getMetaData().objectName + 'Repository: no test data found in table ' + repository.getMetaData().tableName, util.FIND_ONE));
            return false;
        } else if (util.isDefined(result.result)) {
            let pkfields = repository.getMetaData().getPrimaryKeyFields();
            let params = new Array();
            for (let i = 0; i < pkfields.length; ++i) {
               params.push(result.result.rows[0][i]);
            }
            testUtil.verifyRepositoryTestResult(repository, util.FIND_ONE, result.result, await repository.findOne(params), testResults);
            testUtil.verifyRepositoryTestResult(repository, util.FIND_ONE, result.result, repository.findOneSync(params), testResults);
            return true;
        }
     });
};

async function testFind(repository, testResults) {
    await testUtil.findExampleData(repository.getPoolAlias(), repository.getMetaData(), 10).then(async function(result) {
        if (util.isDefined(result.error)) {
            testResults.push(require('../../testStatus.js')(util.ERROR, util.toString(result.error), util.FIND));
        } else if (result.nodata) {
            testResults.push(require('../../testStatus.js')(util.WARN,  repository.getMetaData().objectName + 'Repository: no test data found in table' + repository.getMetaData().tableName, util.FIND));
        } else if (util.isDefined(result.result)) {
            let whereList = testUtil.getFindTestWhereLists(repository, result.result);
            if (whereList.length === 0) {
                testResults.push(require('../../testStatus.js')(util.WARN,  repository.getMetaData().objectName + 'Repository: no test data found in table ' + repository.getMetaData().tableName, util.FIND));
            } else {
                 for (let i = 0; i < whereList.length; ++i) {
                    await testUtil.verifyRepositoryTestResult(repository, util.FIND, whereList[i], await repository.find(whereList[i]), testResults);
                 }
                 
                 for (let i = 0; i < whereList.length; ++i) {
                    await testUtil.verifyRepositoryTestResult(repository, util.FIND, whereList[i], repository.findSync(whereList[i]), testResults);
                 }
            }
        }
    });
};

async function testGetAll(repository, testResults) {
    // control getAll test to only test tables with small number of rows
    if (await testUtil.isGetAllTestAllowed(repository, testResults)) {
        await testUtil.verifyRepositoryTestResult(repository, util.GET_ALL, {}, await repository.getAll(), testResults);
        await testUtil.verifyRepositoryTestResult(repository, util.GET_ALL, {}, repository.getAllSync(), testResults);
    } else {
        testResults.push(require('../../testStatus.js')(util.WARN,  'not performing getAll() test on ' + repository.getMetaData().objectName, util.GET_ALL));
    }
};

async function testExists(repository,testResults) {
    return await testUtil.findExampleData(repository.getPoolAlias(), repository.getMetaData()).then(async function(result) {
        if (util.isDefined(result.error)) {
            testResults.push(require('../../testStatus.js')(util.ERROR, util.toString(result.error), util.EXISTS));
        } else if (result.nodata) {
            testResults.push(require('../../testStatus.js')(util.WARN,  repository.getMetaData().objectName + 'Repository: no test data found in table ' + repository.getMetaData().tableName, util.EXISTS));
        } else if (util.isDefined(result.result)) {
            let pkfields = repository.getMetaData().getPrimaryKeyFields();
            let model = orm.newModelInstance(repository.getMetaData());
            let foundpk = true;
            for (let i = 0; i < pkfields.length; ++i) {
                let val = result.result.rows[0][i];

                if (util.isUndefined(val)) {
                    testResults.push(require('../../testStatus.js')(util.ERROR, 'no primary key value found for field ' + pkfields[i].fieldName, util.EXISTS));
                    foundpk = false;
                    break;
                } else {
                    model.setFieldValue(pkfields[i].fieldName, result.result.rows[0][i]);
                }
            }

            if (foundpk) {
                await testUtil.verifyRepositoryTestResult(repository, util.EXISTS, result.result, await repository.exists(model), testResults);
           }
        }
    });
};

async function testCount(repository,  testResults) {
    await testUtil.testCount(repository, testResults);
};

async function testSave(repository, testResults) {
    await testUtil.testSave(repository, testResults);
};

async function testDelete(repository, testResults) {
    await testUtil.testDelete(repository, testResults);
};


