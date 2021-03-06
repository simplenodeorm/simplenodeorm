/*
 * Copyright (c) 2019  simplenodeorm.org
 */

"use strict";

const fs = require('fs');
const util = require("../main/util.js");
const orm = require("../orm.js");
const logger = require('../main/Logger.js');

module.exports.fillString = function(c, len) {
    let retval = '';
    for (let i = 0; i < len; ++i) {
        retval += c;
    }
    
    return retval;
};


module.exports.getGetFunctionName = function(field) {
    return ('get' + field.fieldName.substring(0, 1).toUpperCase() + field.fieldName.substring(1));
};

module.exports.getSetFunctionName = function(field) {
    return ('set' + field.fieldName.substring(0, 1).toUpperCase() + field.fieldName.substring(1));
};

module.exports.verifyQueryDesignerQueryResults = function(repo, doc, resultSet, objectGraph, testResults) {
    let columnPosMap = new Map();
    let fieldPosMap = new Map();

    for (let i = 0; i < doc.document.selectedColumns.length; ++i) {
        columnPosMap.set(doc.document.selectedColumns[i].path, i);
    }
    
    if (!Array.isArray(objectGraph)) {
        let tmp = objectGraph;
        objectGraph = [];
        objectGraph.push(tmp);
    }
    
    let md = repo.getMetaData();
    
    for (let i = 0; i < md.fields.length; ++i) {
        let pos = columnPosMap.get(md.fields[i].columnName);
        if (pos) {
            fieldPosMap.set(md.fields[i].fieldName, pos);
        }
    }
    
    let pkkeys = md.getPrimaryKeyFields();
    
    
    let topLevelKeyset = new Set();
    
    for (let i = 0; i < resultSet.result.rows.length; ++i) {
        let dot = '';
        let key = '';
        for ( let j = 0; j < pkkeys.length; ++j) {
            key += (dot + resultSet.result.rows[i][columnPosMap.get(pkkeys[j].fieldName)]);
            dot = '.';
        }
        topLevelKeyset.add(key);
    }
    
    if (objectGraph.length !== topLevelKeyset.size) {
        testResults.push(require('./testStatus.js')(util.ERROR,
            'result set unique top level object count['
            +  topLevelKeyset.size
            + '] does not match object graph count['
            + objectGraph.length + '] for model ' + md.modelName, 'verifyQueryDesignerQueryResults'));
    } else {
        for (let i = 0; i < objectGraph.length; ++i) {
            let dot = '';
            let key = '';
            for (let j = 0; j < pkkeys.length; ++j) {
                key += (dot + objectGraph[i][pkkeys[j].fieldName]);
                dot = '.'
            }
            if (!topLevelKeyset.has(key)) {
                testResults.push(require('./testStatus.js')(util.ERROR, 'object graph key [' + key + '] not found in results set keys', 'verifyQueryDesignerQueryResults'));
            }
        }
    
        verifyModelInstancesToResultSet(doc, objectGraph, resultSet, columnPosMap, testResults);
    }
};

function verifyModelInstancesToResultSet(doc, objectGraph, resultSet, columnPosMap, testResults) {
    
    for (let i = 0; i < objectGraph.length; ++i) {
        let verifyMap = new Map();
        let pkkeys = orm.getRepository(objectGraph[i].__model__).getMetaData().getPrimaryKeyFields();
        let results = getResultSetRowsForModelInstance(objectGraph[i], pkkeys, resultSet, columnPosMap);
        
        // set up verification table - will use this to ensure all results are
        // accounted for in object graph
        for (let j = 0; j < results.length; ++j) {
            for (let k = 0; k < doc.document.selectedColumns.length; ++k) {
                verifyMap.set(j + ":" + doc.document.selectedColumns[k].path, false);
            }
        }
        let firstOne = true;
    
        // match all row values in our current object
        for (let j = 0; j < results.length; ++j) {
            for (let k = 0; k < doc.document.selectedColumns.length; ++k) {
                let vkey = j + ":" + doc.document.selectedColumns[k].path;
                let resval = results[j][k];
                let mval = findModelObjectValueFomPath(orm, objectGraph[i], results[j], doc.document.selectedColumns[k].path, columnPosMap);
    
                if (mval.value && resval && ('date' === mval.type)) {
                    if (!isNaN(Date.parse(resval))) {
                        mval.value = Date.parse(mval.value);
                        resval = Date.parse(resval);
                    }
                }
    
                if ((mval.value === resval) || (!mval.value && !resval)) {
                    verifyMap.set(vkey, true);
                } else {
                    if (firstOne) {
                        firstOne = false;
                    }
    
                    let pos = doc.document.selectedColumns[k].path.lastIndexOf('.');
    
                    let fname;
    
                    if (pos > -1) {
                        fname = doc.document.selectedColumns[k].path.substring(pos+1);
                    } else {
                        fname = doc.document.selectedColumns[k].path;
                    }
                    
                    
                    if (!orm.testConfiguration.fieldsToIgnoreForRowToModelMatch.includes(fname)) {
                        testResults.push(require('./testStatus.js')(util.ERROR,
                            'object graph value for path '
                            + doc.document.selectedColumns[k].path
                            + ' ' + mval.value
                            + ' not equal to result set value ' + resval, 'verifyQueryDesignerQueryResults'));
                    } else {
                        verifyMap.set(vkey, true);
                    }
                }
            }
        }
    
        for (const [k, v] of verifyMap) {
            if (!v) {
                testResults.push(require('./testStatus.js')(util.ERROR,
                    'did not find matching model object value for result set path '
                    +  k,
                    'verifyQueryDesignerQueryResults'));
                
            }
        }
    }
}

function findModelObjectValueFomPath(orm, model, resultRow, path, columnPosMap) {
    let retval = {};
    
    let pathParts = path.split('.');
    let curmodel = model;
    let lastPath = '';
    for (let i = 0; i < pathParts.length - 1; ++i) {
        if (i === 0) {
            lastPath = pathParts[0];
        } else {
            lastPath += ('.' + pathParts[i]);
        }
        
        curmodel = curmodel[pathParts[i]];
    
        if (!curmodel) {
            break;
        } else {
            if (Array.isArray(curmodel)) {
                if (curmodel.length > 0) {
                    let md = orm.getRepository(curmodel[0].__model__).getMetaData();
                    let pkkeys = md.getPrimaryKeyFields();
            
                    let pkvalues = [];
                    for (let j = 0; j < pkkeys.length; ++j) {
                        pkvalues.push(resultRow[columnPosMap.get(lastPath + '.' + pkkeys[j].fieldName)]);
                    }
    
                    let match = false;
                    for (let j = 0; j < curmodel.length; ++j) {
                        match = true;
                        for (let k = 0; k < pkkeys.length; ++k) {
                            if (curmodel[j][pkkeys[k].fieldName] !== pkvalues[k]) {
                                match = false;
                                break;
                            }
                        }
                
                        if (match) {
                            curmodel = curmodel[j];
                            break;
                        }
                    }
                    
                    if (!match) {
                        curmodel = '';
                        break;
                    }
                } else {
                    curmodel = '';
                    break;
                }
            }
        }
    }
    
    if (curmodel) {
        let md = orm.getRepository(curmodel.__model__).getMetaData();
        
        let field;
        if (!path.includes('.')) {
            field = path;
        } else {
            field = path.substring(path.lastIndexOf('.') + 1)
        }
        
        retval.value = curmodel[field];
        retval.type = getDataType(md.getFieldMap().get(field).type);
    }
    
    return retval;
}

function getResultSetRowsForModelInstance(modelInstance, pkkeys, resultSet, columnPosMap) {
    let retval = [];
    let keyValues = [];
    for (let j = 0; j < pkkeys.length; ++j) {
        keyValues.push(modelInstance[pkkeys[j].fieldName]);
    }
    
    for (let i = 0; i < resultSet.result.rows.length; ++i) {
        let match = true;
        
        for (let j = 0; j < pkkeys.length; j++) {
            let val = resultSet.result.rows[i][columnPosMap.get(pkkeys[j].fieldName)];
            
            if (val !== keyValues[j]) {
                match = false;
                break;
            }
        }
        
        if (match) {
            retval.push(resultSet.result.rows[i]);
        }
    }
    
    return retval;
}

function getTestValue(field) {
    let testData;
    let dbType = getDataType(field.type.toUpperCase());
    switch(dbType) {
        case 'string':
            testData = 'N';
            break;
        case 'int':
        case 'float':
            testData = 5;
            break;
        case 'date':
            testData = new Date();
            break;
        case 'boolean':
            testData = true;
            break;
    }

    if (util.isDefined(field.converter)) {
        testData = require('../converters/' + field.converter + '.js')(field, testData, true);
    }

    return testData;
}

module.exports.getTestValue = getTestValue;


module.exports.logDebug = function(msg) {
    logger.logDebug(msg);
};

module.exports.logInfo = function(msg) {
    logger.logInfo(msg);
};

module.exports.logWarning = function(msg, e) {
    logger.logWarning(msg, e);
};

module.exports.logError = function(msg, e) {
    logger.logError(msg, e);
};

module.exports.isLogDebugEnabled = function() {
    return logger.isLogDebugEnabled();
};

module.exports.isLogInfoEnabled = function() {
    return logger.isLogInfoEnabled();
};


function getDataType(dbType) {
    let retval;
    if (util.isValidObject(dbType)) {
        dbType = dbType.toUpperCase();
        if (dbType.includes('VARCHAR')
            || dbType.includes('TEXT')
            || dbType.includes('CHAR')
            || dbType.includes('CLOB')
            || dbType.includes('ENUM')
            || dbType.includes('SET')
            || dbType.includes('GEOMETRY')
            || dbType.includes('BYTEA')
            || dbType.includes('BLOB')) {
            retval = "string";
        } else if (dbType.includes('DATE')
            || dbType.includes('TIME')) {
            retval = 'date';
        } else if (dbType.includes('NUMBER')
            || dbType.includes('INT')
            || dbType.includes('BIT')
            || dbType.includes('NUMERIC')
            || dbType.includes('YEAR')
            || dbType.includes('DECIMAL')) {
            if (!dbType.includes('(') || dbType.endsWith(", 0)")) {
                retval = 'int';
            } else {
                retval = 'float';
            }
        } else if (dbType.includes('FLOAT') ||  dbType.includes('DOUBLE'))     {
            retval = 'float';
        } else if (dbType.includes('BOOL')) {
            retval = 'boolean';
        }  else {
            retval = 'string';
            logger.logWarning('unable to determine type for dbType=' + dbType + ' setting type to string');
        }
    }
    
    return retval;
}

module.exports.findExampleData = async function(repository, maxRows) {
    let conn;

    try {
        conn = await orm.getConnection(orm.testConfiguration.poolAlias);
        let result = {};
        switch(repository.dbType) {
            case util.ORACLE:
                result = await conn.execute(buildExampleSelect(repository.getMetaData(), repository.dbType, maxRows));
                break;
            case util.MYSQL:
                let res = await conn.query(buildExampleSelect(repository.getMetaData(), repository.dbType, maxRows));
                result = util.convertObjectArrayToResultSet(res);
                break;
            case util.POSTGRES:
                let sql = buildExampleSelect(epository.getMetaData(), repository.dbType, maxRows);
                result = await conn.query({text: sql, rowMode: 'array'});
                result.metaData = util.toColumnMetaData(result.fields);
                break;
        }
        
        if (util.isUndefined(result.rows) || (result.rows.length === 0)) {
            return {nodata: true};
        } else {
            return {result: result};
        }
    }

    catch (err) {
        return {error: err};
    }

    finally {
        if (conn) {
            repository.releaseConnection(conn);
        }
    }
};

function buildExampleSelect(modelDef, dbType, maxRows) {
    let retval = "select ";
    if (util.isUndefined(modelDef)) {
        util.throwError("UndefinedModelDefinition", 'Undefined model definition passed to method');
    } else if (util.isUndefined(modelDef.fields)) {
        util.throwError("UndefinedFieldDefinition", util.toString(modelDef) + '.fields is undefined');
    }
    
    if (util.isUndefined(maxRows)) {
        maxRows = 2;
    } else {
        maxRows++;
    }

    let comma = "";
    let fields = modelDef.fields;
    for (let i = 0; i < fields.length; ++i) {
        retval += (comma + fields[i].columnName);
        comma = ",";
    }
    
    retval += (" from " + modelDef.getTableName());
    
    switch(dbType) {
        case util.ORACLE:
            retval += (" where rownum < " + maxRows);
            break;
        case util.MYSQL:
            retval += (" limit " + maxRows);
            break;
        case util.POSTGRES:
            retval += (" LIMIT " + maxRows);
            break;
            
    }

    return retval;
}

module.exports.logInfo = function(msg) {
    logger.logInfo(msg);
};

module.exports.logError = function(msg) {
    logger.logError(msg);
};

module.exports.verifyRepositoryTestResult = async function(repo, functionName, exampleData, result, testResults) {
    switch(functionName) {
        case util.FIND_ONE:
            await this.verifyFindOneResults(repo, exampleData, result, testResults);
            break;
        case util.FIND:
            await this.verifyFindResults(repo, exampleData, result, testResults);
            break;
        case util.GET_ALL:
            await this.verifyGetAllResults(repo, exampleData, result, testResults);
            break;
        case util.EXISTS:
            if (!result) {
                testResults.push(require('./testStatus.js')(util.ERROR, 'expected true but was ' + result, functionName));
            }
            break;
        case util.SAVE:
        case util.DELETE:
        case util.COUNT:
            // not used in this context - everything happend in test method
            break;
        default:
            testResults.push(require('./testStatus.js')(util.WARN, util.NOT_IMPLEMENTED, functionName));
            break;

    }
};
    
module.exports.verifyFindOneResults = async function(repo, exampleData, result, testResults) {
    if (util.isDefined(result)) {
        if (util.isDefined(result.error)) {
            testResults.push(require('./testStatus.js')(util.ERROR, result.error, util.FIND_ONE));
        } else if (util.isDefined(result.result)) {
            if (await rowToModelMatch(exampleData.metaData, exampleData.rows[0], result.result, testResults, util.FIND_ONE)) {
                await oneToOneRelationshipMatch(repo, 't0', 0, result.result, testResults, util.FIND_ONE);
                await oneToManyRelationshipMatch(repo, 't0', 0, result.result, testResults, util.FIND_ONE);
            } else {
                testResults.push(require('./testStatus.js')(util.ERROR, 'model data does not match db data', util.FIND_ONE));
            }
        } else {
            testResults.push(require('./testStatus.js')(util.ERROR, 'no results found', util.FIND_ONE));
        } 
    } else {
        testResults.push(require('./testStatus.js')(util.ERROR, 'no results found', util.FIND_ONE));
    }
};

module.exports.verifyFindResults = async function(repo, whereList, result, testResults) {
    let fmap = repo.getMetaData().getFieldMap();
    let fields = repo.getMetaData().getFields();
    let sql = 'select ';
    let comma = '';
    for (let i = 0; i < fields.length; ++i) {
        sql += (comma + fields[i].columnName);
        comma = ',';
    }
   
    let params = [];
    sql += (' from ' + repo.getMetaData().getTableName() + ' where ');
    for (let i = 0; i < whereList.length; ++i) {
        if (i > 0) {
            sql += (' ' + whereList[i].getLogicalOperator());
        }
        sql += whereList[i].getOpenParen();
        sql += (' ' + fmap.get(whereList[i].fieldName).columnName);
        sql += (' ' + whereList[i].getComparisonOperator());
        sql += (' :' + whereList[i].fieldName);
        sql += whereList[i].getCloseParen();
        params.push(whereList[i].getComparisonValue());
   }
   let res = await runQuery(repo, sql, params);

   if (util.isDefined(res.error)) {
        testResults.push(require('./testStatus.js')(util.ERROR, res.error, util.FIND));
   } else if (util.isUndefined(res.result)) {
        testResults.push(require('./testStatus.js')(util.ERROR, 'no result found for params=' + util.toString(params), util.FIND));
   } else if (res.result.rows.length === 0) {
        testResults.push(require('./testStatus.js')(util.ERROR, 'no data found for params=' + util.toString(params), util.FIND));
   } else {
        if (res.result.rows.length === 1) {
            if (result.result.length === 1) {
                await rowToModelMatch(res.result.metaData, res.result.rows[0], result.result[0], testResults, util.FIND);
            } else {
                testResults.push(require('./testStatus.js')(util.ERROR, 'expected 1 model object found ' + result.result.length, util.FIND));
            }
        } else {
             // multiple rows - find row to model match by pk value and check data
            if (res.result.rows.length !== result.result.length) {
                testResults.push(require('./testStatus.js')(util.ERROR, 'expected ' +  res.result.rows.length + ' model object(s) found ' + result.result.length, util.FIND));
            } else {
                let rownum = -1;
                let model;
                for (let i = 0; (rownum < 0) && (i < res.result.rows.length); ++i) {
                    let pk = repo.getMetaData().getPrimaryKeyFields();
                    for (let k = 0; k < result.result.length; ++k) {
                        let foundit = true;
                        model = result.result[k];
                        for (let j = 0; j < pk.length; ++j) {
                            if (res.result.rows[i][j] !== await result.result[k].__getFieldValue(pk[j].fieldName)) {
                                foundit = false;
                                break;
                            }
                        }
                        
                        if (foundit) {
                            rownum = i;
                            break;
                        }
                    }
                }
                
                if (rownum > -1) {
                    await rowToModelMatch(res.result.metaData, res.result.rows[rownum], model,  testResults, util.FIND);
                } else {
                    testResults.push(require('./testStatus.js')(util.ERROR, 'failed to find model match for sql result', util.FIND));
                }
            }
        }
   }
    
};

module.exports.verifyGetAllResults = async function(repo, exampleData, result, testResults) {
    let cnt = await getAllCount(repo, testResults);
    if (result.result.length !== cnt) {
        testResults.push(require('./testStatus.js')(util.ERROR, 'getAll() count [' + result.result.length + '] does not matcg sql count]' + cnt + ']', util.GET_ALL));
    }
};


module.exports.isGetAllTestAllowed = async function(repo, testResults) {
    let cnt = await getAllCount(repo, testResults);
    return ((cnt > 0) && (cnt < orm.appConfiguration.maxRowsForGetAll));
};


module.exports.getFindTestWhereLists = async function(repo, result) {
    let retval = [];
    
    let pkeys = repo.getMetaData().getPrimaryKeyFields();
    let wlist = [];
    
    // add primary key find
    for (let i = 0; i < pkeys.length; ++i) {
        wlist.push(require('../main/WhereComparison.js')(pkeys[i].fieldName, result.rows[0][i], util.EQUAL_TO));
    }
    
    retval.push(wlist);

    // do a search by partial key
    wlist = [];
    if (pkeys.length > 1) {
        let sql = 'select count(*) from ' + repo.getMetaData().getTableName() + ' where ';
        
        let and = '';
        let params = [];
        for (let i = 0; i < (pkeys.length-1); ++i) {
            sql += (and + pkeys[i].columnName + ' = :' + pkeys[i].fieldName);
            and = ' and ';
            params.push(result.rows[0][i]);
            wlist.push(require('../main/WhereComparison.js')(pkeys[i].fieldName, result.rows[0][i], util.EQUAL_TO));
        }
        
        let res = await runQuery(repo, sql, params);
        
        // add if result count is reasonable
        if (util.isDefined(res.result) 
            && (res.result.rows.length > 0) 
            && (Number(res.result.rows[0][0]) < orm.testConfiguration.maxRowsForGetAll)) {
            retval.push(wlist);
        }
    }
    
    return retval;
};

module.exports.testCount = async function(repository, testResults) {
    let res = await runQuery(repository, 'select count(*) from ' + repository.getMetaData().getTableName());

    if (util.isDefined(res.error)) {
        testResults.push(require('./testStatus.js')(util.ERROR, res.error, util.COUNT));
    } else {
        if (repository.dbType === util.MYSQL) {
            res = util.convertObjectArrayToResultSet(res.result).rows[0][0];
       } else {
            res = res[0][0];
        }
        let res2 = await repository.count([], {poolAlias: orm.testConfiguration.poolAlias, joinDepth: 0});
        if (util.isDefined(res2.error)) {
            testResults.push(require('./testStatus.js')(util.ERROR, res2.error, util.COUNT));
        } else if (res !== res2.result) {
            testResults.push(require('./testStatus.js')(util.ERROR, 'expect count = ' + res.result + ' but was ' +  res2.result, util.COUNT));
        }
    }
};

module.exports.testSave = async function(repository, testResults, insertOnly) {
    let updateFunction = this.testUpdate;
    let insertFunction = this.testInsert;
    let md = repository.getMetaData();

      // test update functionality
    let result = await this.findExampleData(repository,2);

   if (util.isDefined(result.error)) {
        testResults.push(require('./testStatus.js')(util.ERROR, result.error, util.SAVE));
    } else if (result.nodata) {
        testResults.push(require('./testStatus.js')(util.WARN,  md.getObjectName() + 'Repository: no test data found in table ' + md.getTableName(), util.SAVE));
    } else if (util.isDefined(result.result) && (result.result.rows.length > 0)) {
        let conn;

        try {
            conn = await orm.getConnection(orm.testConfiguration.poolAlias, {autoCommit: false});
            repository.doBeginTransaction(conn);

            if (!insertOnly) {
                await updateFunction(repository, result.result.rows, conn, testResults);
            } else {
                await insertFunction(repository, conn, testResults);
            }
        }

        catch (e) {
            testResults.push(require('./testStatus.js')(util.ERROR, e, util.SAVE));
        }

        finally {
            if (conn) {
                repository.doRollback(conn);
                repository.releaseConnection(conn);
            }
        }
    }
};

function sleep(milliseconds) {
    if (milliseconds) {
        var start = new Date().getTime();
        for (var i = 0; i < 1e7; i++) {
            if ((new Date().getTime() - start) > milliseconds) {
                break;
            }
        }
    }
}

module.exports.testUpdate = async function(repository, rows, conn, testResults) {
    logger.logInfo("            testing update");
    if (!orm.testConfiguration.modelsToExcludeFromUpdateTests
        || !orm.testConfiguration.modelsToExcludeFromUpdateTests.includes(repository.getMetaData().getObjectName())) {
        try {

            let md = repository.getMetaData();
            let pkfields = md.getPrimaryKeyFields();
            let pkset = new Set();

            for (let i = 0; i < rows.length; ++i) {
                let params = [];
                let key = '';
                for (let j = 0; j < pkfields.length; ++j) {
                    params.push(rows[i][j]);
                    key = ('-' + key + rows[i][j]);
                }

                if (!pkset.has(key)) {
                    pkset.add(key);

                    let res = await repository.findOne(params, {
                        poolAlias: orm.testConfiguration.poolAlias,
                        conn: conn
                    });

                    if (util.isDefined(res.error)) {
                        testResults.push(require('./testStatus.js')(util.ERROR, res.error, util.SAVE + '[update]'));
                    } else {
                        let m = res.result;
                        if (await updateModelForTest(md, m)) {
                            // sleep here to allow for
                            // different timestamps for fields that
                            // use time as version
                            sleep(orm.testConfiguration.updateTestDelayMillis);
                            let res2 = await repository.save(m, {
                                conn: conn,
                                poolAlias: orm.testConfiguration.poolAlias
                            });

                            if (util.isDefined(res2.error)) {
                                testResults.push(require('./testStatus.js')(util.ERROR, res2.error, util.SAVE + '[update]'));
                            } else {
                                res2 = await repository.findOne(params, {
                                    poolAlias: orm.testConfiguration.poolAlias,
                                    conn: conn
                                });
                                if (util.isDefined(res2.error)) {
                                    testResults.push(require('./testStatus.js')(util.ERROR, res2.error, util.SAVE + '[update]'));
                                } else {
                                    await verifyModelUpdates(m, res2.result, testResults);
                                }
                            }
                        } else {
                            testResults.push(require('./testStatus.js')(util.WARN, 'unable to determine updateable fields for test on ' + md.getObjectName(), util.SAVE + '[update]'));
                        }
                    }
                }
            }

        } catch (e) {
            testResults.push(require('./testStatus.js')(util.ERROR, "update test failed - " + e, util.SAVE));
        }
    }
};

module.exports.testInsert = async function (repository, conn, testResults) {
    logger.logInfo("            testing insert");
    try {
        let md = repository.getMetaData();
        let modelTestData = loadModelInsertData(md);

        if (util.isUndefined(modelTestData) || (modelTestData.length === 0)) {
            testResults.push(require('./testStatus.js')(util.WARN, 'no insert test data found for ' + md.getObjectName(), util.SAVE + '[insert]'));
        } else {
            let models = [];
            for (let i = 0; i < modelTestData.length; ++i) {
                models.push(modelTestData[i]);
            }

            let res = await repository.save(models, {
                poolAlias: orm.testConfiguration.poolAlias,
                conn: conn,
                returnValues: true
            });

            if (res.error) {
                testResults.push(require('./testStatus.js')(util.ERROR, res.error + md.getObjectName(), util.SAVE + '[insert]'));
            } else {
                if (util.isDefined(res.updatedValues)) {
                    if (res.updatedValues.length !== models.length) {
                        testResults.push(require('./testStatus.js')(util.ERROR, 'expected to have ' + models.length + ' ' + md.getObjectName() + ' objects inserted  but found ' + res.updateValues.length, util.SAVE + '[insert]'));
                    } else {
                        for (let i = 0; i < res.updatedValues.length; ++i) {
                            await verifyModelInserts(models[i], res.updatedValues[i], testResults);
                        }
                    }
                }
            }
        }
    }

    catch (e) {
         testResults.push(require('./testStatus.js')(util.ERROR, "insert test failed - " + e, util.SAVE));
    }
};

async function verifyModelInserts(modelBeforeSave, modelFromDbAfterSave, testResults) {
    let repo = orm.getRepository(modelBeforeSave.__model__);

    let md = repo.getMetaData();
    let fields = md.fields;
    
    for (let i = 0; i < fields.length; ++i) {
        let val1 = await modelBeforeSave.__getFieldValue(fields[i].fieldName);
        let val2 = await modelFromDbAfterSave.__getFieldValue(fields[i].fieldName);
        
        let mismatch = ((util.isValidObject(val1) && util.isNotValidObject(val2)) || (util.isValidObject(val2) && util.isNotValidObject(val1)));

        if (!mismatch) {
            if (!orm.testConfiguration.fieldsToIgnoreForRowToModelMatch.includes(fields[i].fieldName)) {
                if (util.isValidObject(val1) && util.isValidObject(val2)) {
                    if (val1 instanceof Date) {
                        val1 = val1.getTime();
                        val2 = val2.getTime();
                    } else if (val1.trim && val2.trim) {
                        val1 = val1.trim();
                        val2 = val2.trim();
                    } else if ((typeof val1 === "boolean") || (typeof val2 === "boolean")) {
                        val1 = String(val1);
                        val2 = String(val2);
                    }

                    if (val1 != val2) {
                        testResults.push(require('./testStatus.js')(util.ERROR, 'column value mismatch on ' + modelBeforeSave.__model__ + '.' + fields[i].fieldName + ' expected ' + val1 + ' but found ' + val2, util.SAVE + '[insert]'));
                    }
                }
            }
        }
    }
}

async function verifyModelUpdates(modelBeforeSave, modelFromDbAfterSave, testResults) {
    let onm = modelBeforeSave.__model__;
    let md = orm.getRepository(onm).getMetaData();
    
    let fields = md.fields;
    
    for (let i = 0; i < fields.length; ++i) {
        
        let val1 = await modelBeforeSave.__getFieldValue(fields[i].fieldName);
        let val2 = await modelFromDbAfterSave.__getFieldValue(fields[i].fieldName);

        if (util.isValidObject(val1) && util.isValidObject(val2)) {
            if (val1 instanceof Date) {
                if (!fields[i].versionColumn) {
                    // round of millis
                    val1.setSeconds(val1.getSeconds(), 0);
                    val1 = val1.getTime();
                }
            } else if (val1 instanceof Object) {
                val1 = util.toString(val1);
                val1 = val1.trim();
            }

            if (val2 instanceof Date) {
                if (!fields[i].versionColumn) {
                    // round off millis
                    val2.setSeconds(val2.getSeconds(), 0);
                    val2 = val2.getTime();
                }
            } else if (val2 instanceof Object) {
                val2 = util.toString(val2);
                val2 = val2.trim();
            }

            if (util.isValidObject(fields[i].versionColumn) && fields[i].versionColumn) {
                if (modelBeforeSave.__isModified()) {
                    if (Number(val1) >= Number(val2)) {
                        testResults.push(require('./testStatus.js')(util.ERROR, 'version column value match on ' + onm + '.' + fields[i].fieldName + ' - expected updated version[' + val2 + '] to be greater than original version[' + val1 + ']', util.SAVE + '[update]'));
                    }
                }
            } else {
                if (val1 !== val2) {
                    testResults.push(require('./testStatus.js')(util.ERROR, 'column value mismatch on ' + onm + '.' + fields[i].fieldName + ' - expected ' + val1 + ' but found ' + val2, util.SAVE + '[update]'));
                }
            }
        } else if ((util.isNotValidObject(val1) && util.isValidObject(val2)) 
            || (util.isNotValidObject(val2) && util.isValidObject(val1))) {
            testResults.push(require('./testStatus.js')(util.ERROR, 'column value mismatch on ' + onm + '.' + fields[i].fieldName + ' - expected ' + val1 + ' but found ' + val2, util.SAVE + '[update]'));
        }
    }
    
    let otmdefs = md.getOneToManyDefinitions();
    
    if (util.isValidObject(otmdefs) && (otmdefs.length > 0)) {
        let val1 = await modelBeforeSave.__getFieldValue(otmdefs[0].fieldName);
        let val2 = await modelFromDbAfterSave.__getFieldValue(otmdefs[0].fieldName);
        if (util.isValidObject(val1) && util.isValidObject(val2) 
            && (val1.length > 0) && (val1.length === val2.length)) {
            await verifyModelUpdates(val1[0], val2[0], testResults);
        }
    }
}

function loadModelInsertData(metaData) {
    let retval = [];
    let flist = fs.readdirSync(orm.testConfiguration.testDataRootPath);
    for (let i = 0; i < flist.length; ++i) {
        if (flist[i].endsWith('.json')) {
            let pos = flist[i].indexOf('_');
            if ((pos > -1) && (metaData.objectName === flist[i].substring(0, pos))) {
                retval.push(util.jsonToModel(fs.readFileSync(orm.testConfiguration.testDataRootPath + '/' + flist[i]), orm));
            }
        }
    }
    
    return retval;
}
    
async function updateModelForTest(metaData, model) {
    let updateableFields = findUpdateableFields(metaData);
    if (util.isNotValidObject(updateableFields) || (updateableFields.length === 0)) {
        return false;
    } else {
        let saveValue = await model.__getFieldValue(updateableFields[0].fieldName);
        let testValue = getTestValue(updateableFields[0]);

        if (testValue !== saveValue) {
            model.__setFieldValue(updateableFields[0].fieldName, testValue);
        }

        let otmdefs = metaData.getOneToManyDefinitions();

        /// update a child for test if available
        if (util.isValidObject(otmdefs)) {
            for (let i = 0; i < otmdefs.length; ++i) {
                if (otmdefs[i].cascadeUpdate) {
                    let otmModels = await model.__getFieldValue(otmdefs[i].fieldName, true);
                    if (util.isValidObject(otmModels) && (otmModels.length > 0)) {
                        await updateModelForTest(orm.getRepository(otmdefs[i].targetModelName).getMetaData(), otmModels[0]);
                        break;
                    }
                }    
            }
        }

        return true;
    }
}

function findUpdateableFields(metaData) {
    let retval = [];
    
    let fields = metaData.getFields();
    let pkfields = metaData.getPrimaryKeyFields();
    let pknames = new Set();
    for (let i = 0; i < pkfields.length; ++i) {
        pknames.add(pkfields[i].fieldName);
    }
    
    let relset = new Set();
    
    let otodefs = metaData.getOneToOneDefinitions();
    if (util.isValidObject(otodefs)) {
        for (let i = 0; i < otodefs.length; ++i) {
            let srccols = otodefs[i].joinColumns.sourceColumns.split(',');
            for (let j = 0; j < srccols.length; ++j) {
                relset.add(srccols[j]);
            }
        }
    }
    
    let otmdefs = metaData.getOneToManyDefinitions();
    if (util.isValidObject(otmdefs)) {
        for (let i = 0; i < otmdefs.length; ++i) {
            let srccols = otmdefs[i].joinColumns.sourceColumns.split(',');
            for (let j = 0; j < srccols.length; ++j) {
                relset.add(srccols[j]);
            }
        }
    }

    let mtodefs = metaData.getManyToManyDefinitions();
    if (util.isValidObject(mtodefs)) {
        for (let i = 0; i < mtodefs.length; ++i) {
            let srccols = mtodefs[i].joinColumns.sourceColumns.split(',');
            for (let j = 0; j < srccols.length; ++j) {
                relset.add(srccols[j]);
            }
        }
    }

    // try to find something we can modify safely
    for (let i = 0; i < fields.length; ++i) {
        if (!pknames.has(fields[i].fieldName)
            && !relset.has(fields[i].columnName) 
            && !fields[i].versionColumn
            && !orm.testConfiguration.fieldsToIgnoreForUpdate.includes(fields[i].fieldName)) {
            retval.push(fields[i]);
        }
    }

    return retval;
}

module.exports.testDelete = async function(repository, testResults) {
    let conn;
    
    try {
        conn = await orm.getConnection(orm.testConfiguration.poolAlias);
    
        let md = repository.getMetaData();
        let modelTestData = loadModelInsertData(md);

        if (util.isNotValidObject(modelTestData)) {
            testResults.push(require('./testStatus.js')(util.WARN, 'not insert test data found for ' + md.getObjectName() , util.SAVE + '[insert]'));
        } else {

            repository.doBeginTransaction(conn);
            let models = [];
            for (let i = 0; i < modelTestData.length; ++i) {
                models.push(modelTestData[i]);
            }

            let res = await repository.save(models, {poolAlias: orm.testConfiguration.poolAlias, conn: conn, returnValues: true});

            if (res.error) {
                testResults.push(require('./testStatus.js')(util.ERROR, res.error + md.getObjectName() , util.DELETE));
            } else {
                if (util.isDefined(res.updatedValues)) {
                    if (res.updatedValues.length !== models.length) {
                        testResults.push(require('./testStatus.js')(util.ERROR, 'expected to have ' + models.length + ' ' + md.getObjectName() + ' objects inserted  but found ' + res.updateValues.length, util.DELETE));
                    } else {
                        let res2 = await repository.delete(res.updatedValues, {poolAlias: orm.testConfiguration.poolAlias, conn: conn});
                        if (util.isDefined(res2.error)) {
                            testResults.push(require('./testStatus.js')(util.ERROR, res.error, util.DELETE));
                        } else if (res2.rowsAffected === 0) {
                            testResults.push(require('./testStatus.js')(util.ERROR, 'expected ' + md.getObjectName() + ' rows to be deleted but rowsAffected = 0', util.DELETE));
                        } else {
                            for (let i = 0; i < res.updatedValues.length; ++i) {
                                let params = repository.getPrimaryKeyValuesFromModel(res.updatedValues[i]);
                                let m = await repository.findOne(params, {poolAlias: orm.testConfiguration.poolAlias, conn: conn});
                                if (util.isValidObject(m)) {
                                    if (util.isDefined(m.error)) {
                                        testResults.push(require('./testStatus.js')(util.ERROR, m.error, util.DELETE));
                                    } else {
                                        testResults.push(require('./testStatus.js')(util.ERROR, 'found ' + md.getObjectName() + ' object which should have been deleted - ' + util.toString(params), util.DELETE));
                                    }
                                    break;
                                }
                            }
                        }
                    }
                }
            }
        }

        repository.doRollback(conn);
    }
    
    catch (e) {
        testResults.push(require('./testStatus.js')(util.ERROR, e, util.DELETE));
    }
    
    finally {
        if (conn) {
            repository.releaseConnection(conn);
        }
    }
};

async function getAllCount(repo, testResults) {
    let retval = 0;
    
    let res = await runQuery(repo, "select count(*) from " + repo.getMetaData().tableName);
    if (util.isDefined(res.error)) {
        testResults.push(require('./testStatus.js')(util.ERROR, res.error, 'getAll.allowGetAllTest'));
    } else {
        if (repo.dbType === util.MYSQL) {
            retval = util.convertObjectArrayToResultSet(res.result).rows[0][0];
        } else {
            if (res.result.rows.length > 0) {
                retval = res.result.rows[0][0];
            }
        }
    }

    return retval;
}

module.exports.outputTestResults = function(nm, testResults) {
    let retval = true;
    if (util.isDefined(testResults)) {
        for (let i = 0; i < testResults.length; ++i) {
            switch(testResults[i].testStatus) {
                case util.ERROR:
                    this.logError('    * ' + nm + '[FAIL] method=' + testResults[i].method + ', error: ' + testResults[i].message);
                    break;
                case util.WARN:
                    this.logWarning('       ' + nm + '[WARN] method=' + testResults[i].method + ', warning: ' + testResults[i].message);
                    break;
                case util.INFO:
                    this.logInfo('       ' + nm + '[INFO] method=' + testResults[i].method + ', info: ' + testResults[i].message);
                    break;
                default:
                    this.logWarning('       ' + nm + '[WARN] unknown test result - ' + testResults[i].message);
                    break;
            }
        }  

        let errors = haveTestErrors(testResults);
        let warnings = haveTestWarnings(testResults);
        if (!errors) {
            if (warnings) {
                this.logInfo('       * ' + nm + '[SUCCESS] with warnings');
            } else {
                this.logInfo('       ' + nm + '[SUCCESS]');
            }
        }
        if (orm.testConfiguration.stopTestsOnFailure && errors) {
            retval = false;
        }
    }
    
    return retval;
};


async function rowToModelMatch(columnNames, rowData, modelObject, testResults, parentFunction) {
    let retval = false;
    let md = orm.getRepository(modelObject.__model__).getMetaData();
    let fields = md.getFields();
    if (fields) {
        let cmap = md.getColumnToFieldMap();
        let failed = false;

        for (let i = 0; i < columnNames.length; ++i) {
            let field = cmap.get(columnNames[i].name);

            if (!orm.testConfiguration.fieldsToIgnoreForRowToModelMatch.includes(field.fieldName)) {
                let rd = rowData[i];
                if (util.isDefined(field.converter)) {
                    rd = require('../converters/' + field.converter + '.js')(field, rd, true);
                }
    
                let fv = await modelObject.__getFieldValue(cmap.get(columnNames[i].name).fieldName);
                if (util.isNotValidObject(fv)) {
                    fv = null;
                }
    
                if (rd) {
                    if (rd instanceof Date) {
                        rd = rd.getTime();
                    } else if (rd instanceof Object) {
                        rd = util.toString(rd);
                    }
                }
    
                if (fv) {
                    if (fv instanceof Date) {
                        fv = fv.getTime();
                    } else if (fv instanceof Object) {
                        fv = util.toString(fv);
                    }
                }
    
                if (rd !== fv) {
                    failed = true;
                    testResults.push(require('./testStatus.js')(util.ERROR, '[' + columnNames[i].name + ']: ' + fv + ' != ' + rd, parentFunction + '.rowToModelMatch'));
                    break;
                }
            }
        }


        
        retval = !failed;
    }
    
    return retval;
}

async function oneToOneRelationshipMatch(repository, curAlias, curDepth, modelObject, testResults, parentFunction) {
    let otodefs = modelObject.__getMetaData().getOneToOneDefinitions();
    if (util.isValidObject(otodefs)) {
       for (let i = 0; i < otodefs.length; ++i) {
            if (repository.canJoin(curAlias, otodefs[i])) {
                let sql = buildSelectFromRelationship(modelObject,  otodefs[i]);
                if (sql) {
                    let result = await runQuery(repository, sql);
                    if (util.isDefined(result.error)) {
                        testResults.push(require('./testStatus.js')(util.ERROR, result.error, parentFunction + '.oneToOneRelationshipMatch'));
                    } else if (result.result.rows.length === 0) {
                        testResults.push(require('./testStatus.js')(util.WARN, 'no data found for one-to-one relationship ' + otodefs[i].fieldName,  parentFunction + '.oneToOneRelationshipMatch'));
                    } else if (result.result.rows.length > 1) {
                        testResults.push(require('./testStatus.js')(util.ERROR, 'expected one row for  one-to-one relationship ' + otodefs[i].fieldName + ' found ' + result.result.rows.length,  parentFunction + '.oneToOneRelationshipMatch'));
                    } else if ((curDepth+1) < 2) {
                        let relobj = await modelObject.__getFieldValue(otodefs[i].fieldName);
                        if (util.isDefined(relobj)) {
                            let repo = orm.getRepository(otodefs[i].targetModelName);
                            let md = orm.getMetaData(otodefs[i].targetModelName);
                            let params = [];
                            let pkfields = md.getPrimaryKeyFields();
                            
                            let haveRefFields = true;
                            for (let j = 0; j < pkfields.length; ++j) {
                                let val = await relobj.__getFieldValue(pkfields[j].fieldName);
                                if (val) {
                                    params.push(val);
                                } else {
                                    haveRefFields = false;
                                    break;
                                }
                            }

                            if (haveRefFields) {
                                sql = buildPrimaryKeySelect(md);
                                if (sql) {
                                    let res = await runQuery(repository, sql, params);
                                    if (res.result.rows.length > 0) {
                                        await rowToModelMatch(res.result.metaData, res.result.rows[0], relobj, testResults, parentFunction);
                                        await oneToOneRelationshipMatch(repo, otodefs[i].alias, curDepth+1, relobj, testResults, parentFunction);
                                        await oneToManyRelationshipMatch(repo, otodefs[i].alias, curDepth+1, relobj, testResults, parentFunction);
                                    } else if (otodefs[i].required) {
                                        testResults.push(require('./testStatus.js')(util.ERROR, 'no results found for required one-to-one relationship ' + otodefs[i].fieldName,  parentFunction + '.oneToOneRelationshipMatch'));
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

async function oneToManyRelationshipMatch(repository, curAlias, curDepth, modelObject, testResults, parentFunction) {
    let otmdefs = modelObject.__getMetaData().getOneToManyDefinitions();
    if (util.isValidObject(otmdefs)) {
       for (let i = 0; i < otmdefs.length; ++i) {
            if (repository.canJoin(curAlias, otmdefs[i])) {
                let sql = buildSelectFromRelationship(modelObject,  otmdefs[i]);
                if (sql && (sql.length > 0)) {
                    let result = await runQuery(repository, sql);
                    if (util.isDefined(result.error)) {
                        testResults.push(require('./testStatus.js')(util.ERROR, result.error, parentFunction + '.oneToManyRelationshipMatch'));
                    } else if (result.result.rows.length > 0) {
                        let repo = orm.getRepository(otmdefs[i].targetModelName);
                        let childModels = await modelObject.__getFieldValue(otmdefs[i].fieldName);

                        if (util.isValidObject(childModels)) {
                            for (let j = 0; j < childModels.length; ++j) {
                                let cm = childModels[j];
                                let rd = await findRowDataForModel(result.result.metaData, cm, result.result.rows);

                                if (rd) {
                                    await rowToModelMatch(result.result.metaData, rd, cm, testResults, parentFunction);

                                    if (curDepth < 2) {
                                        await oneToOneRelationshipMatch(repo, otmdefs[i].alias, curDepth+1, cm, testResults, parentFunction);
                                        await oneToManyRelationshipMatch(repo, otmdefs[i].alias, curDepth+1, cm, testResults, parentFunction);
                                    }
                                } else {
                                    testResults.push(require('./testStatus.js')(util.WARN, 'no data found for one-to-many relationship ' + otmdefs[i].fieldName,  parentFunction + '.oneToManyRelationshipMatch'));
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

async function findRowDataForModel(columnNames, model, rows) {
    let retval;
    let pkfields = model.getMetaData().getPrimaryKeyFields();
    
    let cmap = new Map();
    
    for (let i = 0; i < pkfields.length; ++i) {
        cmap.set(pkfields[i].columnName, await model.__getFieldValue(pkfields[i].fieldName));
    }
    
    for (let i = 0; i < rows.length; ++i) {
        let goodCnt = 0;
        for (let j = 0; j < rows[i].length; ++j) {
            if (cmap.has(columnNames[j].name) && (cmap.get(columnNames[j].name) === rows[i][j])) {
                goodCnt++;
            }
        }
        
        if (goodCnt === cmap.size) {
            retval = rows[i];
            break;
        }
    }
    
    return retval;
}

async function runQuery(repository, sql, parameters, options) {
    let conn;
    try {
        if (util.isNotValidObject(options)) {
            options = {};
        }

        if (util.isNotValidObject(parameters)) {
            parameters = {};
        }

        conn = await orm.getConnection(orm.testConfiguration.poolAlias);
        let result;
        switch(repository.dbType) {
            case util.ORACLE:
                result = await conn.execute(sql, parameters, options);
                break;
            case util.MYSQL:
            case util.POSTGRES:
               result = await conn.query(sql, parameters);
                break;
        }
    
        return {result: result};
    }

    catch (err) {
        return {error: err};
    }

    finally {
        if (conn) {
            repository.releaseConnection(conn);
         }
    }
}

function haveTestErrors(testResults) {
    let retval = false;
    
    if (util.isValidObject(testResults)) {
        for (let i = 0; i < testResults.length; ++i) {
            if (testResults[i].testStatus === util.ERROR) {
                retval = true;
                break;
            }
        }
    }
    
    return retval;
}

function haveTestWarnings(testResults) {
    let retval = false;
    
    if (util.isValidObject(testResults)) {
        for (let i = 0; i < testResults.length; ++i) {
            if (testResults[i].testStatus === util.WARN) {
                retval = true;
                break;
            }
        }
    }
    
    return retval;
}

async function buildSelectFromRelationship(modelObject, reldef) {
    let retval = "select ";
    let md = orm.getMetaData(reldef.targetModelName);
    let comma = '';
    for (let i = 0; i < md.fields.length; ++i) {
        retval += (comma + md.fields[i].columnName);
        comma = ', ';
    }
    
    let cmap = modelObject.getMetaData().getColumnToFieldMap();
    
    retval += " from ";
    retval += md.tableName;
    retval += " where ";
    
    let targetCols = reldef.joinColumns.targetColumns.split(",");
    let sourceCols = reldef.joinColumns.sourceColumns.split(",");
    let and = "";
    
    for (let i = 0; i < targetCols.length; ++i) {
        let val = await modelObject.__getFieldValue(cmap.get(sourceCols[i]).fieldName);
        
        if (util.isNotValidObject(val)) {
            retval = null;
            break;
        } else {
            retval += (and + targetCols[i] + " = ");
            let isstr = ("string" === getDataType(cmap.get(sourceCols[i]).type));
            if (isstr) {
                retval += "'";
            }

            retval += val;

            if (isstr) {
                retval += "'";
            }

            and = " and ";
        }
    }
    
    return retval;
}

function buildPrimaryKeySelect(md) {
    let retval = "select ";
    let comma = '';
    for (let i = 0; i < md.fields.length; ++i) {
        retval += (comma + md.fields[i].columnName);
        comma = ', ';
    }
    
    retval += " from ";
    retval += md.tableName;
    retval += " where ";
    
    let and = ' ';
    let pkfields = md.getPrimaryKeyFields();
    for (let i = 0; i < pkfields.length; ++i) {
        retval += (and + pkfields[i].columnName + ' = :' + pkfields[i].fieldName);
        and = ' and ';
    }
    
    return retval;
}