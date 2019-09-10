"use strict";

const orm = require('../orm.js');
const util = require('./util.js');
const insertSqlMap = new Map();
const updateSqlMap = new Map();
const logger = require('./Logger.js');
const sleepTime = orm.appConfiguration.deasyncSleepTimeMillis || 200;
const maxDeasyncWaitTime = orm.appConfiguration.maxDeasyncWaitTime || 30000;

var deasync = require('deasync');

/**
 * this class is the heart of the orm - all the relations to object graph logic occurs here as well as the sql operations
 */
module.exports = class Repository {
    constructor(poolAlias, metaData) {
        this.metaData = metaData;
        this.poolAlias = poolAlias;
        this.selectedColumnFieldInfo = [];
        this.columnPositions = [];
        this.pkPositions = [];
        this.namedDbOperations = new Map();
        this.generatedSql = [];
        
        // default named db operations
        this.namedDbOperations.set(util.FIND_ONE, this.buildFindOneNamedOperation(metaData));
        this.namedDbOperations.set(util.GET_ALL, this.buildGetAllNamedOperation(metaData));
        this.namedDbOperations.set(util.DELETE, this.buildDeleteNamedOperation(metaData));
        this.selectClauses = [];
        this.joinClauses = [];
        
        // load custom db operations in extening classes. These are object-based db operations, 
        // below is an example of Account findOne(): 
        // select Account o from Account where o.finCoaCd = :finCoaCd and o.accountNbr = :accountNbr
        // currently the 'o' alias is important becausr the sql generator will key on 'o.'. Specify
        // with dot notations for example o.subAccounts.subAcctNbr = :subAcctNbr
        this.loadNamedDbOperations();
    }
    
    async tableExists() {
        let params = [];
        params.push(this.getMetaData().tableName);
        let result = await this.executeSqlQuerySync('SELECT table_name FROM user_tables where table_name = :tableName', params);
        if (util.isDefined(result.error)) {
            util.throwError("SQLError", result.error);
        }
        
        return (util.isDefined(result.result.rows) && (result.result.rows.length> 0) && (result.result.rows[0][0] === this.getMetaData().tableName));
    }
    
    
    async createTable() {
        let result = await repo.executeSql(repo.buildCreateTableSql());
        if (util.isDefined(result.error)) {
            util.throwError("SQLError", result.error);
        }
    }

    async createAutoIncrementGeneratorIfRequired() {
        let fields = this.getMetaData().fields;
        let showMessage = true;
        let dbType = orm.getDbType(this.poolAlias);
        
        switch(dbType) {
            case util.ORACLE:
                for (let i = 0; i < fields.length; ++i) {
                    if (util.isDefined(fields[i].autoIncrementGenerator)) {
                        if (showMessage) {
                            logger.logInfo('        creating sequences for ' + newTableRepos[i].getMetaData().getTableName());
                            showMessage = false;
                        }
                
                        let result = this.executeSql('CREATE SEQUENCE ' + fields[i].autoIncrementGenerator + ' START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE');
                        if (util.isDefined(result.error)) {
                            util.throwError("SQLError", result.error);
                        }
                    }
                }
                break;
            case util.POSTGRES:
                for (let i = 0; i < fields.length; ++i) {
                    if (util.isDefined(fields[i].autoIncrementGenerator)) {
                        if (showMessage) {
                            logger.logInfo('        creating sequences for ' + newTableRepos[i].getMetaData().getTableName());
                            showMessage = false;
                        }
                
                        let result = this.query('CREATE SEQUENCE ' + fields[i].autoIncrementGenerator);
                        if (util.isDefined(result.error)) {
                            util.throwError("SQLError", result.error);
                        }
                    }
                }
                break;
        }
    }

    buildCreateTableSql() {
        let retval = 'create table ' + this.getMetaData().tableName + '(';
        let primaryKey = ' primary key(';
        let comma = '';
        let fields = this.getMetaData().fields;
        
        for (let i = 0; i < fields.length; ++i) {
            let f = fields[i];
            if (f.primaryKey) {
                primaryKey += (comma + f.columnName);
                comma = ',';
            }
            
            retval += (' ' + f.columnName + ' ' + f.type);
            
            if (util.isDefined(f.length) && util.isDefined(f.decimalDigits)) {
                retval += '(' + f.length + ', ' + f.decimalDigits + ') ';
            } else if (util.isUndefined(f.length) && util.isDefined(f.decimalDigits)) {
                retval += '(' + util.DEFAULT_NUMBER_LENGTH + ', ' + f.decimalDigits + ') ';
            } else if (util.isDefined(f.length)) {
                retval += '(' + f.length + ') ';
            }
            
            if (util.isDefined(f.defaultValue)) {
                retval += (' DEFAULT ' + f.defaultValue);
            } else if (f.required) {
                retval += ' NOT NULL ';
            }
            
            retval += ',\n';
        }
        
        retval += (primaryKey + '))');
        
        return retval;
    }

    async createForeignKeys() {
        let repo = this;
        let md = repo.getMetaData();
        let showMessage = true;
        for (let i = 0; i < md.oneToOneDefinitions.length; ++i) {
            if (showMessage) {
                logger.logInfo('        adding foreign keys for table ' + md.tableName);
                showMessage = false;
            }
            await this.createForeignKey(md.oneToOneDefinitions[i]);
        }

        for (let i = 0; i < md.manyToManyDefinitions.length; ++i) {
            if (showMessage) {
                logger.logInfo('        adding foreign keys for table ' + md.tableName);
                showMessage = false;
            }
            await this.createForeignKey(md.manyToManyDefinitions[i]);
        }
    }
    
    async createForeignKey(fkdef) {
        let sql = ('alter table ' 
            + this.getMetaData().tableName 
            + ' add foreign key (' 
            + fkdef.joinColumns.sourceColumns
            + ') references  ' 
            + fkdef.targetTableName
            + '(' + fkdef.joinColumns.targetColumns + ')');
        let result = await this.executeSql(sql);
        if (util.isDefined(result.error)) {
            util.throwError("SQLError", result.error);
        }
    }

    
    loadNamedDbOperations() {
    }
    
    /**
     * 
     * @returns pool alias associated with this repository
     */
    getPoolAlias() {
        return this.poolAlias;
    }
    
    /**
     * 
     * @returns meta data for the associated model
     */
    getMetaData() {
        return this.metaData;
    }

    canJoin(ref) {
        return (ref.status === util.ENABLED);
    }

    /**
     * 
     * @returns relative js module path
     */
    getModule() {
        return this.metaData.getModule().replace("model/", "repository/").replace(".js", "Repository.js");
    }
    
    /**
     * 
     * @param {type} primaryKey - array of key values in order of primary key fields
     * @param {type} options - query options as json of the form below
     * {
     *     joinDepth: <desired join depth, default to maxDefaultJoinDepth if not set>
     *     conn: <database connection to use - will pull connection from pool if not set>
     *     maxRows: <if set will limit rows returned>
     * }
     * @returns return json error or result: {error: <result> } or { result: <data> }
     */
    async findOne(primaryKey, options) {
        options = checkOptions(options);
        let res =  await this.executeNamedDbOperation(util.FIND_ONE, primaryKey, options);
        if (util.isDefined(res.result)) {
            if (res.result && res.result.length > 0) {
                return {result: res.result[0]};
            }
        } else if (util.isDefined(res.error)) {
            return res;
        } 
    }
    
    findOneSync(primaryKey, options) {
        let resultWrapper = {result: undefined, error: undefined};
        let repo = this;
        (async function() {
            try {
                if (logger.isLogDebugEnabled()) {
                    logger.logDebug("findOneSync: before findOne");
                }
                let result = await repo.findOne(primaryKey, options);

                if (logger.isLogDebugEnabled()) {
                    logger.logDebug("findOneSync: after findOne - " + JSON.stringify(result));
                }
                resultWrapper.result = result.result;
                resultWrapper.error = result.error;
            } catch (e) { resultWrapper.error = e;}
        })(resultWrapper, repo, primaryKey, options);
        
        let startTime = Date.now();
        while (util.isUndefined(resultWrapper.result) 
            && util.isUndefined(resultWrapper.error)
            && ((Date.now() - startTime) < maxDeasyncWaitTime)) {
            deasync.sleep(sleepTime);
        }

        return resultWrapper;
    }
    
    /**
     * 
     * @param {type} whereComparisons - array of where definitions using WhereComparison.js - if empty then will count all rows
     * @param {type} options - query options as json of the form below
     * {
     *     joinDepth: <desired join depth, default to maxDefaultJoinDepth if not set>
     *     conn: <database connection to use - will create new connection if not set>
     *     distinct: <true/false if true will do count distinct>
     * }
     * @returns return json error or result: {error: <result> } or { result: <data> }
     */
    async count(whereComparisons, options) {
        options = checkOptions(options);
        let sql = 'select count(';
        let sep = '';
        let pkfields = this.metaData.getPrimaryKeyFields();
        sql += 'distinct ';
        for (let i = 0; i < pkfields.length; ++i) {
            sql += (sep + 't0.' + pkfields[i].columnName);
            sep = ' || \'.\' ||';
        }
        
        sql += (') from ' + this.metaData.getTableName() + ' t0 ' + this.getJoinClause(options.joinDepth));
        let params = [];
        if (util.isDefined(whereComparisons) && (whereComparisons.length > 0)) {
            sql += this.buildWhereClause(whereComparisons);
            params = this.getParametersFromWhereComp(whereComparisons);
        }
        
        let res = await this.executeSqlQuery(sql, params, options);
        
        if (util.isDefined(res.error)) {
            return { error: res.error };
        } else if (util.isDefined(res.result)) {
            return {result: res.result.rows[0][0] };
        }
    }

    countSync(whereComparisons, options) {
        let resultWrapper = {result: undefined, error: undefined};
        let repo = this;
        
        (async function() {
            let result = await repo.count(whereComparisons, options);
            resultWrapper.result = result.result;
            resultWrapper.error = result.error;
        })(resultWrapper, repo, whereComparisons, options);
        
        let startTime = Date.now();
        while (util.isUndefined(resultWrapper.result) 
            && util.isUndefined(resultWrapper.error)
            && ((Date.now() - startTime) < maxDeasyncWaitTime)) {
            deasync.sleep(sleepTime);
        }

        return resultWrapper;
    }

    
    /**
     * 
     * @param {type} whereComparisons - array of where definitions using WhereComparison.js - will fail if empty
     * @param {type} orderByEntries - array of order by defininitions using OrderByEntry.js
     * @param {type} options - query options as json of the form below
     * {
     *     joinDepth: <desired join depth, default to maxDefaultJoinDepth if not set>
     *     conn: <database connection to use - will create new connection if not set>
     *     maxRows: <if set will limit rows returned>
     *     autoCommit: <true/false - defaults to false if not set> 
     *     distint: <true/false - if true will force select distinct>
     * }
     * @returns return json error or result: {error: <result> } or { result: <data> }
     */
    async find(whereComparisons, orderByEntries, options) {
        options = checkOptions(options);
        let where = this.buildWhereClause(whereComparisons);
        let params = this.getParametersFromWhereComp(whereComparisons);
        let sql = (this.getSelectClause(options.joinDepth) + " from " + this.metaData.getTableName() + ' t0 ' + this.getJoinClause(options.joinDepth) + where);
        
        if (util.isDefined(orderByEntries)) {
            let comma = '';
            for (let i = 0; i < orderByEntries.length; ++i) {
                if (i === 0) {
                    sql += ' order by ';
                }
                sql += (comma + this.getColumnNameFromFieldName(orderByEntries[i].getFieldName()));
                if (orderByEntries[i].isDescending()) {
                    sql += ' desc';
                }
                
                comma = ',';
            }
        } else { // order by primary key if no order by input
            let pkfields = this.getMetaData().getPrimaryKeyFields();
            let comma = '';
            sql += ' order by ';
            for (let i = 0; i < pkfields.length; ++i) {
                sql += (comma + 't0.' + pkfields[i].columnName);
                comma = ',';
            }
        }
        
        return await this.executeQuery(sql, params, options);
    }

    findSync(whereComparisons, orderByEntries, options) {
        let resultWrapper = {result: undefined, error: undefined};
        let repo = this;
        (async function() {
            let result = await repo.find(whereComparisons, orderByEntries, options);
            resultWrapper.result = result.result;
            resultWrapper.error = result.error;
        })(resultWrapper, repo, whereComparisons, orderByEntries, options);
        
        let startTime = Date.now();
        while (util.isUndefined(resultWrapper.result) 
            && util.isUndefined(resultWrapper.error)
            && ((Date.now() - startTime) < maxDeasyncWaitTime)) {
            deasync.sleep(sleepTime);
        }

        return resultWrapper;
    }

    /**
     * 
    * @param {type} options - query options as json of the form below
     * {
     *     joinDepth: <desired join depth, default to maxDefaultJoinDepth if not set>
     *     conn: <database connection to use - will create new connection if not set>
     *     maxRows: <if set will limit rows returned>
     * }
     * @returns return json error or result: {error: <result> } or { result: <data> }
     */

    async getAll(options) {
        options = checkOptions(options);
        return await this.executeNamedDbOperation(util.GET_ALL, [], options);
    }

    getAllSync(options) {
        let resultWrapper = {result: undefined, error: undefined};
        let repo = this;
        (async function(resultWrapper, func, options) {
            let result = await repo.getAll(options);
            resultWrapper.result = result.result;
            resultWrapper.error = result.error;
        }(resultWrapper, repo, options));
        
        let startTime = Date.now();
        while (util.isUndefined(resultWrapper.result) 
            && util.isUndefined(resultWrapper.error)
            && ((Date.now() - startTime) < maxDeasyncWaitTime)) {
            deasync.sleep(sleepTime);
        }

        return resultWrapper;
    }

    /**
     * 
     * @param {type} modelInstances 1 or more model instances to delete
     * @param {type} options - query options as json of the form below
     * {
     *     joinDepth: <desired join depth, default to maxDefaultJoinDepth if not set>
     *     conn: <database connection to use - will create new connection if not set>
     *     maxRows: <if set will limit rows returned>
     *     autoCommit: <true/false - defaults to false if not set> 
     * }
     * @returns return json error or result: {error: <result> } or { result: <data> }
     */
   async delete(modelInstances, options) {
        options = checkOptions(options);
        let rowsAffected = 0;
        let l = modelInstances;
        
        // allow a single model or an array of models
        if (!(l instanceof Array)) {
            l = [];
            l.push(modelInstances);
        }

        if (l.length > 0) {
            let md = orm.getMetaData(l[0].getObjectName());
            let otodefs = md.getOneToOneDefinitions();
            let otmdefs = md.getOneToOneDefinitions();

            for (let i = 0; i < l.length; ++i) {
                if (util.isDefined(otodefs)) {
                    for (let j = 0; j < otodefs.length; ++j) {
                        if (util.isDefined(otodefs[j].cascadeDelete) && otodefs[j].cascadeDelete) {
                            let rel = l[i].__getFieldValue(otodefs[j].fieldName);
                            if (util.isDefined(rel)) {
                                let ret = await this.delete(rel, options);
                                if (util.isDefined(ret.error)) {
                                    return {error: ret.error};
                                } else if (util.isDefined(ret.rowsAffected)) {
                                    rowsAffected += ret.rowsAffected;
                                }
                            }
                        }
                    }
                }

                if (util.isDefined(otmdefs)) {
                    for (let j = 0; j < otmdefs.length; ++j) {
                        if (util.isDefined(otmdefs[j].cascadeDelete) && otmdefs[j].cascadeDelete) {
                            let rel = l[i].__getFieldValue(otmdefs[j].fieldName);
                            if (util.isDefined(rel)) {
                                let ret2 = await this.delete(rel, options);
                                if (util.isDefined(ret2.error)) {
                                    return {error: ret2.error};
                                } else if (util.isDefined(ret2.rowsAffected)) {
                                    rowsAffected += ret2.rowsAffected;
                                }
                            }
                        }
                    }
                }

                let ret3 = await this.executeNamedDbOperation(util.DELETE, this.getPrimaryKeyValuesFromModel(l[i]), options);
                
                if (util.isDefined(ret3.error)) {
                    return {error: ret3.error};
                } else if (util.isDefined(ret3.rowsAffected)) {
                    rowsAffected += ret3.rowsAffected;
                }
            }
        }
        
        return {rowsAffected: rowsAffected};
    }

    deleteSync(modelInstances, options) {
        let resultWrapper = {rowsAffected: undefined, error: undefined};
        let repo = this;
        (async function() {
            let result = await repo.delete(modelInstances, options);
            resultWrapper.rowsAffected = result.rowsAffected;
            resultWrapper.error = result.error;
        })(resultWrapper, repo, modelInstances, options);
        
        let startTime = Date.now();
        while (util.isUndefined(resultWrapper.rowsAffected) 
            && util.isUndefined(resultWrapper.error)
            && ((Date.now() - startTime) < maxDeasyncWaitTime)) {
            deasync.sleep(sleepTime);
        }

        return resultWrapper;
    }
    

    /**
     * @param {type} model - model instance to update/insert
     * @param {type} sql - insert/update sql
     * @param {type} params - bind parameters - should have entries in sql of type :p1, :p2 etc in matching order
     * @param {type} options - options as json of the form below
     * {
     *     joinDepth: <desired join depth, default to maxDefaultJoinDepth if not set>
     *     conn: <database connection to use - will create new connection if not set>
     *     maxRows: <if set will limit rows returned>
     *     autoCommit: <true/false - defaults to false if not set> 
     *     returnValues: <true/false if true will return the updated results, otherwise only rowsAffected count is returned>
     * }
     * @returns return json error or rowsAffected: {error: <result> } or { rowsAffecetd: <cnt> }
     */
    async executeSave(model, sql, params, options) {
        let rowsAffected = 0;
        options = checkOptions(options);

        let result = {rowsAffected: 0};
        if (model.__isNew() || !(await this.exists(model, options))) {
            model.__setNew(true);
            result = await this.executeSql(sql, params, options);
        } else if (model.__isModified()) {
            if (this.metaData.isVersioned()) {
                let currentVersion = await this.getCurrentVersion(model, options);
                if (util.isNotValidObject(currentVersion)) {
                    currentVersion = -1;
                } else if (currentVersion instanceof Date) {
                    currentVersion = currentVersion.getTime();
                }

                let verField = this.getVersionField(model);
                let ver = model.__getFieldValue(verField.fieldName);

                if (ver instanceof Date) {
                    ver = ver.getTime();
                }

                if ((currentVersion > -1) && (ver  < currentVersion)) {
                    util.throwError('OptimisticLockException', model.__model__ + ' has been modified by another user');
                }
            }

            try {
                result = await this.executeSql(sql, params, options);
            }
            
            catch (e) {
 logger.logInfo('------------------>error=' + e)
                result.error = e;
            }
        }
        
        let insertId;
        if (util.isDefined(result.error)) {
            return {error: result.error};
        } else {
            logger.logInfo('------------------>insertId=' + result.insertId)
            insertId = result.insertId;
            if (util.isDefined(result.rowsAffected)) {
                rowsAffected += result.rowsAffected;
            }

            // do this to prevent returning child objects
            // if return values true
            let childOptions = Object.assign(options);
            childOptions.returnValues = false;
            
            let otodefs = this.metaData.getOneToOneDefinitions();
            if (util.isValidObject(otodefs)) {
                for (let i = 0; i < otodefs.length; ++i) {
                    if (otodefs[i].cascadeUpdate) {
                        let oto = model.__getFieldValue(otodefs[i].fieldName, true);
                        if (util.isValidObject(oto)) {
                            this.populateReferenceColumns(model, otodefs[i], oto);
                            let res  = await orm.getRepository(otodefs[i].targetModelName).save(oto, childOptions);
                            
                            if (util.isDefined(res.error)) {
                                return {error: res.error};
                            } else if (util.isDefined(res.rowsAffected)) {
                                rowsAffected += res.rowsAffected;
                            }
                        }
                    }
                }
            }

            let otmdefs = this.metaData.getOneToManyDefinitions();
            if (util.isValidObject(otmdefs)) {
                for (let i = 0; i < otmdefs.length; ++i) {
                    if (otmdefs[i].cascadeUpdate) {
                        let otm = model.__getFieldValue(otmdefs[i].fieldName, true);
                        if (util.isValidObject(otm) ) {
                            this.populateReferenceColumns(model, otmdefs[i], otm);
                            let res = await orm.getRepository(otmdefs[i].targetModelName).save(otm, childOptions);
                            if (util.isDefined(res.error)) {
                                return {error: res.error};
                            } else if (util.isDefined(res.rowsAffected)) {
                                rowsAffected += res.rowsAffected;
                            }
                        }
                    }
                }
            }
        }

        return {rowsAffected: rowsAffected, insertId: insertId};
    }
    
    setAutoIncrementIdIfRequired(model, id) {
 logger('-------->1=' + id)
        let fields = model.__getMetaData().fields;
        logger('-------->2=' + fields)
        for (let i = 0; i < fields.length; ++i) {
            logger('-------->3=' + fields[i].fieldName)
            if (fields[i].autoIncrementGenerator) {
                logger('-------->4=' + fields[i].fieldName)
                model[fields[i].fieldName] = id;
                break;
            }
        }
    }
    
    getVersionField(model) {
        let retval;
        let fields = model.__getMetaData().fields;
        
        if (util.isDefined(fields)) {
            for (let i = 0; i < fields.length; ++i) {
                if (util.isDefined(fields[i].versionColumn) && fields[i].versionColumn) {
                    retval = fields[i];
                    break;
                }
            }
        }
        
        return retval;
    }
    
    async getCurrentVersion(model, options) {
        let md = this.metaData;
        let sql = ('select ' + md.getVersionField().columnName + ' from ' + md.tableName + ' where ');

        let params = [];
        let pkfields = md.getPrimaryKeyFields();
        let and = '';
        let dbType = orm.getDbType(this.poolAlias);
        for (let i = 0; i < pkfields.length; ++i) {
            sql += (and + pkfields[i].columnName + ' = ');
            switch(dbType) {
                case util.ORACLE:
                    sql += (':p' + pkfields[i].fieldName);
                    break;
                case util.MYSQL:
                    sql += ' ?';
                    break;
                case util.POSTGRES:
                    sql += ' $' + (i+1);
                    bindex++;
                    break;
            }

            params.push(model.__getFieldValue(pkfields[i].fieldName));
            and = ' and ';
        }

        let res = await this.executeSqlQuery(sql, params, options);
        if (util.isDefined(res.error)) {
            util.throwError('SQLError', res.error);
        } else if (res.result.rows.length === 0) {
            return 1;
        } else {
            return res.result.rows[0][0];
        }
    }
    
    /**
     * @param {type} pmodel - parent model instance
     * @param {type} refdef - relationship definition
     * @param {type} cmodel - child model isntance to pupulate
     */
    populateReferenceColumns(pmodel, refdef, cmodel) {
        let pcmap = orm.getMetaData(pmodel.getObjectName()).getColumnToFieldMap();
        let ccmap = orm.getMetaData(refdef.targetModelName).getColumnToFieldMap();
        
        let l;

        // allow a single model or an array of models
        if (cmodel instanceof Array) {
            l = cmodel;
        } else {
            l = [];
            l.push(cmodel);
        }
       
        let scols = refdef.joinColumns.sourceColumns.split(',');
        let tcols = refdef.joinColumns.targetColumns.split(',');
       
        for (let i = 0; i < l.length; ++i) {
            for (let j = 0; j < scols.length; ++j) {
                l[i].__setFieldValue(ccmap.get(tcols[j]), pmodel.__getFieldValue(pcmap.get(scols[j])));
            }
        }
    }
    
    /**
     * @param {type} model - model object source fo sql insert parameter values list
     * @param {type} options - options as json of the form below
     * {
     *     joinDepth: <desired join depth, default to maxDefaultJoinDepth if not set>
     *     conn: <database connection to use - will create new connection if not set>
     *     maxRows: <if set will limit rows returned>
     *     autoCommit: <true/false - defaults to false if not set> 
     * }
     */
    async loadInsertParameters(model, options) {
        options = checkOptions(options);
        let retval = [];
        let fields = model.__getMetaData().fields;
        let dbType = orm.getDbType(this.poolAlias);
        for (let i = 0; i < fields.length; ++i) {
            if (model[fields[i].fieldName]) {
                let val = doConversionIfRequired(fields[i], model.__getFieldValue(fields[i].fieldName, true), false);

                if (util.isNotValidObject(val) && (fields[i].required || util.isDefined(fields[i].defaultValue))) {
                    if (util.isValidObject(fields[i].autoIncrementGenerator)) {
                        if ((dbType === util.ORACLE) || (dbType === util.POSTGRES)) {
                            val = await this.getAutoIncrementValue(fields[i].autoIncrementGenerator, options);
                            model.__setFieldValue(fields[i].fieldName, val);
                        }
                    } else if (util.isNotValidObject(val) && util.isValidObject(fields[i].defaultValue)) {
                        val = fields[i].defaultValue;
                        if (this.isDateType(fields[i])) {
                            let dv = fields[i].defaultValue.toUpperCase();
                            if (dv.includes('SYSDATE')
                                || dv.includes('NOW')
                                || dv.includes('CURRENT_TIMESTAMP')) {
                                val = new Date();
                            } else {
                                val = new Date(val);
                            }
                        }

                        model.__setFieldValue(fields[i].fieldName, val);
                    } else if (fields[i].versionColumn) {
                        if (this.isDateType(fields[i])) {
                            val = new Date();
                        } else {
                            val = 1;
                        }
                        model.__setFieldValue(fields[i].fieldName, val);
                    }
                    if (this.isDateType(fields[i]) && util.isDefined(val)) {
                        val = new Date(val);
                        model.__setFieldValue(fields[i].fieldName, val);
                    }
                } else if (this.isDateType(fields[i]) && util.isDefined(val)) {
                    val = new Date(val);
                    model.__setFieldValue(fields[i].fieldName, val);
                } else if (this.isGeometryType(fields[i]) // handle geometry types in mysql
                    && util.isDefined(val)) {
                    val = 'POINT(' + val.x + ' ' + val.y + ')';
                } else if (val && (typeof val === "object") // handle blobs in mysql
                    && val.type && val.data
                    && (val.type.toLowerCase() === 'buffer')) {
                    val = val.toString();
                }

                if (util.isNotValidObject(val)) {
                    val = null;
                }

                retval.push(val);
            }
        }
        
        return retval;
    }
    
    /**
     * 
     * @param {type} model
     * @param {type} options
     * @returns {Array|nm$_Repository.Repository.loadUpdateParameters.retval|Repository.loadUpdateParameters.retval}
     */
    async loadUpdateParameters(model, options) {
        let retval = [];
        let pkparams = [];
        let md = model.__getMetaData();
        let fields = md.fields;
        for (let i = 0; i < fields.length; ++i) {
            let val = doConversionIfRequired(fields[i], model.__getFieldValue(fields[i].fieldName), false);
            
            if (util.isDefined(fields[i].primaryKey) && fields[i].primaryKey) {
                pkparams.push(val);
            } else {
                if (fields[i].versionColumn) {
                    if (this.isDateType(fields[i])) {
                       retval.push(this.currentDateFunctionName());
                    } else {
                        let curver = await this.getCurrentVersion(model, options);
                        retval.push(curver+1);
                        
                    }
                } else if (this.isGeometryType(fields[i]) && util.isDefined(val)) {
                    val = 'POINT(' + val.x + ' ' + val.y + ')';
                } else {
                        retval.push(val);
                    }
                }
            }
        
        for (let i = 0; i < pkparams.length; ++i) {
            retval.push(pkparams[i]);
        }
        
        return retval;
    }

    /**
     * 
     * @param {type} name - sequence nAME
     * @param {type} options
     * {
     *     joinDepth: <desired join depth, default to maxDefaultJoinDepth if not set>
     *     conn: <database connection to use - will create new connection if not set>
     *     maxRows: <if set will limit rows returned>
     *     autoCommit: <true/false - defaults to false if not set> 
     * }
     * @returns next sequence value
     */
    async getAutoIncrementValue(name, options) {
        let retval;
        options = checkOptions(options);
        let mr = options.maxRows;
        options.maxRows = 1;
        
        let dbType  = orm.getDbType(this.poolAlias);
        let res;
        
        switch(dbType) {
            case util.ORACLE:
                res = await this.executeSqlQuery('select ' + name + '.nextVal from dual', [], options);
                break;
            case util.POSTGRES:
                let sql = "select nextval('" + name + "')";
                res = await this.executeSqlQuery(sql, []);
                break;
        }
        
        if (util.isDefined(res)) {
            if (util.isDefined(mr)) {
                options.maxRows = mr;
            } else {
                options.maxRows = null;
            }
            
            retval = res.result.rows[0][0];
        }
    
        return retval;
    }
    
    /**
     * 
     * @param {type} model - source model for insert sql
     * @returns insert sql string
     */
    getInsertSql(model) {
        let retval = insertSqlMap.get(model.__model__);
        if (util.isNotValidObject(retval)) {
            let md = model.__getMetaData();
            retval = ('insert into ' + md.tableName+ '(');
            let fields = md.fields;
            let comma = '';
            for (let i = 0; i < fields.length; ++i) {
                if (model[fields[i].fieldName]) {
                    retval += (comma + fields[i].columnName);
                    comma = ',';
                }
            }

            retval += ') values (';

            let dbType = orm.getDbType(this.poolAlias);
            comma = '';
            for (let i = 0; i < fields.length; ++i) {
                if (model[fields[i].fieldName]) {
                    switch(dbType) {
                        case util.ORACLE:
                            retval += (comma + ' :' + (fields[i].fieldName));
                            break;
                        case util.MYSQL:
                            if (this.isGeometryType(fields[i])) {
                                retval += (comma + ' ST_GeomFromText(?)');
                            } else {
                                retval += (comma + ' ?');
                            }
                            break;
                        case util.POSTGRES:
                            retval += (comma + ' $' + (i+1));
                            break
                    }
                    comma = ',';
                }
            }

            retval += ')';
            insertSqlMap.set(model.__model__, retval);
        }

        return retval;
    }
    
    /**
     * 
     * @param {type} model - source model for update sql
     * @returns update sql string
     */
    getUpdateSql(model) {
        let nm = model.__model__;
        let retval = updateSqlMap.get(nm);
        if (util.isNotValidObject(retval)) {
            let md = model.__getMetaData();
            retval = ('update ' + md.tableName + ' ');
            let where = ' where ';
            let fields = md.fields;
            let comma = '';
            let and = '';
            let set = ' set ';
            let dbType = orm.getDbType(this.poolAlias);
            for (let i = 0; i < fields.length; ++i) {
                if (util.isDefined(fields[i].primaryKey) && fields[i].primaryKey) {
                    switch(dbType) {
                        case util.ORACLE:
                            where += (and + fields[i].columnName + ' = :' + fields[i].fieldName);
                            break;
                        case util.MYSQL:
                            where += (and + fields[i].columnName + ' = ?');
                            break;
                        case util.POSTGRES:
                            where += (and + fields[i].columnName + ' = $' + (i+1));
                            break;
                    }
                    and = ' and ';
                } else {
                    switch(dbType) {
                        case util.ORACLE:
                            retval += (comma + set + fields[i].columnName + ' = :' + fields[i].fieldName);
                            break;
                        case util.MYSQL:
                            if (this.isGeometryType(fields[i])) {
                                retval += (comma + set + fields[i].columnName + ' = ST_GeomFromText(?)');
                            } else {
                                retval += (comma + set + fields[i].columnName + ' = ?');
                            }
                            break;
                        case util.POSTGRES:
                            retval += (comma + set + fields[i].columnName + ' = $' + (i+1));
                            break;
                    }
                    comma = ', ';
                    set = '';
                }
            }
            retval += where;
            updateSqlMap.set(nm, retval);
        }
        
        return retval;
    }

    /**
     * 
     * @param {type} modelInstances - 1 or more model instances to save, if new will insert, if exists will update
     * @param {type} options - query options as json of the form below
     * {
     *     joinDepth: <desired join depth, default to maxDefaultJoinDepth if not set>
     *     conn: <database connection to use - will create new connection if not set>
     *     maxRows: <if set will limit rows returned>
     *     autoCommit: <true/false - defaults to false if not set> 
     * }
     * @returns return json error or result: {error: <result> } or { result: <data> }
     */
    async save(modelInstances, options) {
        options = checkOptions(options);

        let rowsAffected = 0;
        let l = modelInstances;
        let updatedValues = [];
        // allow a single model or an array of models
        if (!Array.isArray(l)) {
            l = [];
            l.push(modelInstances);
        }

        if (logger.isLogDebugEnabled()) {
            logger.logDebug("input: " + JSON.stringify(l));
        }

        for (let i = 0; i < l.length; ++i) {
            let res;
            let newModel = false;
            if (!l[i].__isNew) {
                let md = this.getMetaData();
                let model = require(orm.appConfiguration.ormModuleRootPath + "/" + md.getModule())(md);
                Object.assign(model, l[i]);
                l[i] = model;
            }

            if (l[i].__isNew()) {
                newModel = true;
                res = await this.executeSave(l[i], this.getInsertSql(l[i]), await this.loadInsertParameters(l[i]), options);
            } else {
                res = await this.executeSave(l[i], this.getUpdateSql(l[i]),  await this.loadUpdateParameters(l[i], options), options);
            }

            if (util.isDefined(res.error)) {
                return {error: res.error};
            } else if (util.isDefined(res.rowsAffected)) {
                rowsAffected += res.rowsAffected;
                if (newModel && res.insertId) {
                    this.setAutoIncrementIdIfRequired(l[i], res.insertId);
                }
            }

            if (options.returnValues) {
                l[i].__setMetaData(md);
                let res2 = await this.findOne(this.getPrimaryKeyValuesFromModel(l[i]), options);
                if (util.isDefined(res2.result)) {
                    updatedValues.push(res2.result);
                }
            }
        }

        if (updatedValues.length > 0) {
            return {rowsAffected: rowsAffected, updatedValues: updatedValues};
        } else {
            return {rowsAffected: rowsAffected};
        }
    }
    
    saveSync(modelInstances, options) {
        let resultWrapper = {rowsAffected: undefined, error: undefined};
        let repo = this;
        (async function() {
            let result = await repo.save(modelInstances, options);
            resultWrapper.rowsAffected = result.rowsAffected;
            resultWrapper.error = result.error;
            resultWrapper.updatedValues = result.updatedValues;
        })(resultWrapper, repo, modelInstances, options);
        
        let startTime = Date.now();
        while (util.isUndefined(resultWrapper.rowsAffected) 
            && util.isUndefined(resultWrapper.error)
            && ((Date.now() - startTime) < maxDeasyncWaitTime)) {
            deasync.sleep(sleepTime);
        }

        return resultWrapper;
    }


    /**
     * 
     * @param {type} inputParams - can be a list of primary key values or an object instance
     * @param {type} options
     * {
     *     joinDepth: <desired join depth, default to maxDefaultJoinDepth if not set>
     *     conn: <database connection to use - will create new connection if not set>
     *     maxRows: <if set will limit rows returned>
     *     autoCommit: <true/false - defaults to false if not set> 
     * }
     * @returns true or false
     */
    async exists(inputParams, options) {
        let retval = false;
        try {
            let pkfields = this.getMetaData().getPrimaryKeyFields();
            let sql = 'select count(*) from ' + this.getMetaData().getTableName() + ' where  ';
            let and = '';
            let params = [];
            let dbType = orm.getDbType(this.poolAlias);
            for (let i = 0; i < pkfields.length; ++i) {
                sql += (and + pkfields[i].columnName  + ' = ');

                switch(dbType) {
                    case util.ORACLE:
                        sql += (':p' + pkfields[i].fieldName);
                        break;
                    case util.MYSQL:
                        sql += ' ?';
                        break;
                    case util.POSTGRES:
                        sql += ' $' + (i+1);
                        bindex++;
                        break;
                }

                and = ' and ';

                if (Array.isArray(inputParams)) {
                    params.push(inputParams[i]);
                } else {
                    params.push(inputParams.__getFieldValue(pkfields[i].fieldName));
                }
            }

            let res = await this.executeSqlQuery(sql, params, options);
            retval = (util.isUndefined(res.error)
                && res.result
                && (res.result.rows.length === 1)
                && (res.result.rows[0][0] === 1));
        }
        catch (e) {};

        return retval;
    }

    existsSync(inputParams, options) {
        let resultWrapper = {result: undefined, error: undefined};
        let repo = this;
        (async function() {
            resultWrapper.result = await repo.exists(inputParams, options);
            })(resultWrapper, repo, inputParams, options);
        
        let startTime = Date.now();
        while (util.isUndefined(resultWrapper.result) 
            && ((Date.now() - startTime) < maxDeasyncWaitTime)) {

            deasync.sleep(sleepTime);
        }

        return resultWrapper.result;
    }


    /**
     * 
     * @param {type} operationName - name predefined object query such as 'select Account o from Account where o.finCoaCd = :finCoaCd and o.accountNbr = :accountNbr
     * @param {type} parameters - bind parameter values for wuery 
     * @param {type} options -
     * {
     *     joinDepth: <desired join depth, default to maxDefaultJoinDepth if not set>
     *     conn: <database connection to use - will create new connection if not set>
     *     maxRows: <if set will limit rows returned>
     *     autoCommit: <true/false - defaults to false if not set> 
     * }
     * @returns return json error or result: {error: <result> } or { result: <data> }
     */
    async executeNamedDbOperation(operationName, parameters, options) {
        options = checkOptions(options);
        let sql = this.getNamedDbOperationSql(operationName, options);
        if (logger.isLogDebugEnabled()) {
            logger.logDebug("executeNamedDbOperation[" + JSON.stringify(parameters) + "]: " + sql);
        }
        if (this.isSelect(sql)) {
            return await this.executeQuery(sql, parameters, options);
        } else {
            return await this.executeSql(sql, parameters, options);
        }
    }

    isSelect(sql) {
        let retval = false;
        
        if (util.isDefined(sql)) {
            retval = sql.trim().toLowerCase().startsWith("select");
        }
        
        return retval;
    }
    
    isDelete(sql) {
        let retval = false;
        
        if (util.isDefined(sql)) {
            retval = sql.trim().toLowerCase().startsWith("delete");
        }
        
        return retval;
    }

    isDateType(field) {
        let retval = false;
        if (util.isDefined(field)) {
            let type = field.type.toUpperCase();
            retval = (type.includes('DATE') || type.includes('TIME'));
        }
        
        return retval;
    }
    
    isGeometryType(field) {
        let retval = false;
        if (util.isDefined(field)) {
            let type = field.type.toUpperCase();
            retval = type.includes('GEOMETRY');
        }
        
        return retval;
    }
    
    
    currentDateFunctionName() {
        let retval;
        switch(orm.getDbType(this.poolAlias)) {
            case util.ORACLE:
                retval = 'sysdate';
                break;
            case util.MYSQL:
            case util.POSTGRES:
                retval = 'NOW()';
                break;
        }
    }
    
    getPrimaryKeyValuesFromModel(model) {
        let retval = [];
        let pkfields = model.__getMetaData().getPrimaryKeyFields();
        for (let i = 0; i < pkfields.length; ++i) {
            retval.push(model.__getFieldValue(pkfields[i].fieldName));
        }
        
        return retval;
    }
    
    /**
     * 
     * @param {type} oql - determine if this is a valid object query
     * @returns true or false
     */
    isStandardOqlSelect(oql) {
        let retval = false;
        
        if (util.isDefined(oql)) {
            let pos1 = oql.indexOf('select');
            let pos2 = oql.indexOf(' from ');

            if ((pos1 > -1) && (pos2 > pos1)) {
                let s = oql.substring(pos1 + 'select'.length, pos2).trim();

                s = s.replace(this.metaData.getObjectName(), '').replace('o', '').trim();
                retval = (s.length === 0);
            }
        }
        
        return retval;
    }

    /**
     * 
     * @param {type} sql - sql query string
     * @param {type} parameters - bind parameter value list
     * @param {type} options
     * {
     *     joinDepth: <desired join depth, default to maxDefaultJoinDepth if not set>
     *     conn: <database connection to use - will create new connection if not set>
     *     maxRows: <if set will limit rows returned>
     *     autoCommit: <true/false - defaults to false if not set> 
     * }
     * @returns json with standard oracledb result or error
     */
    async executeSqlQuery(sql, parameters, options) {
        options = checkOptions(options);
        
        if (util.isNotValidObject(parameters)) {
            parameters = {};
        }

        let conn;
        try {
            if (util.isValidObject(options.conn)) {
                conn = options.conn;
            } else if (options.poolAlias) {
                conn = await orm.getConnection(options.poolAlias);
            } else {
                conn = await orm.getConnection(this.getPoolAlias());
            }

            if (logger.isLogDebugEnabled()) {
                logger.logDebug('input parameters: ' + util.toString(parameters));
                logger.logDebug('sql: ' + sql);
            }

            let result = await this.executeDatabaseSpecificQuery(conn, sql, parameters, options);

            if (logger.isLogDebugEnabled()) {
                logger.logDebug("result: " + util.toString(result));
            }

            return {result: result};
        }

        catch (err) {
            if (!orm.appConfiguration.testMode) {
                logger.logError(this.getMetaData().getObjectName() + 'Repository.executeSqlQuery()', err);
                if (logger.isLogDebugEnabled()) {
                    logger.logDebug(sql);
                }
            }

            return {error: err};
        }

        finally {
            // only close if locally opened
            if (util.isNotValidObject(options.conn) && conn) {
                await this.closeDatabaseConnection(conn);
            }
        }
    }
    
    async closeDatabaseConnection(conn) {
        switch(orm.getDbType(this.poolAlias)) {
            case util.ORACLE:
                await conn.close();
                break;
            case util.MYSQL:
            case util.POSTGRES:
                await conn.release();
                break;
        }
    }
    
    async executeDatabaseSpecificQuery(conn, sql, parameters, options) {
        let retval;
        try {
            let poolAlias = this.poolAlias;
            if (options.poolAlias) {
                poolAlias = options.poolAlias;
            }
            switch (orm.getDbType(poolAlias)) {
                case util.ORACLE:
                    retval = await conn.execute(sql, parameters, options);
                    break;
                case util.MYSQL:
                    retval = util.convertObjectArrayToResultSet(await conn.query(sql.replace(/"/g, "`"), parameters));
                    break;
                case util.POSTGRES:
                    retval = await conn.query({text: sql, values: parameters, rowMode: 'array'});
                    retval.metaData = util.toColumnMetaData(retval.fields);
                    break;
            }
        } catch (e) {
            logger.logError(e.toString(), e);
            throw e;
        }
        return retval;
    
    }
    
    async executeDatabaseSpecificSql(conn, sql, parameters, options) {
        let retval;
        switch (orm.getDbType(this.poolAlias)) {
            case util.ORACLE:
                retval = await conn.execute(sql, parameters, options);
                break;
            case util.MYSQL:
                retval =  await conn.query(sql.replace(/"/g, "`"), parameters);
                break;
            case util.POSTGRES:
                retval = await conn.query({text: sql, values: parameters});
                retval.rowsAffected = retval.rowCount;
                break;
        }

        if (logger.isLogDebugEnabled()) {
            logger.logDebug("result: " + JSON.stringify(retval));
        }

        return retval;
    }

    executeSqlQuerySync(sql, parameters, options) {
        let resultWrapper = {result: undefined, error: undefined};
        let repo = this;
        (async function() {
            resultWrapper.result = await repo.executeSqlQuery(sql, parameters, options);
          })(resultWrapper, repo, sql, parameters);
        
        let startTime = Date.now();
        while (util.isUndefined(resultWrapper.result)
            && ((Date.now() - startTime) < maxDeasyncWaitTime)) {
            deasync.sleep(sleepTime);
        }

        return resultWrapper.result;
    }
    
    /**
     * 
     * @param {type} sql - sql query string
     * @param {type} parameters - bind parameter value list - order is important
     * @param {type} options
     * {
     *     joinDepth: <desired join depth, default to maxDefaultJoinDepth if not set>
     *     conn: <database connection to use - will create new connection if not set>
     *     maxRows: <if set will limit rows returned>
     *     autoCommit: <true/false - defaults to false if not set> 
     * }
     * @returns model graph json result or error
     */
    async executeQuery(sql, parameters, options) {
        try {
            options = checkOptions(options);
            if (util.isDefined(options.distinct) && options.distinct) {
                sql = 'select distinct ' + sql.substring(7);
            }
            let res = await this.executeSqlQuery(sql, parameters, options);
            if (util.isUndefined(res.error)) {
                let retval = [];
                // load column positions by alias if needed
                if (this.columnPositions[options.joinDepth].size === 0) {
                    for (let i = 0; i < this.selectedColumnFieldInfo[options.joinDepth].length; ++i) {
                        let a = this.selectedColumnFieldInfo[options.joinDepth][i].alias;

                        let cpos = this.columnPositions[options.joinDepth].get(a);
                        if (util.isUndefined(cpos)) {
                            cpos = [];
                            this.columnPositions[options.joinDepth].set(a, cpos);
                        }
                        cpos.push(i);

                        if (util.isDefined(this.selectedColumnFieldInfo[options.joinDepth][i].field.primaryKey)
                            && (this.selectedColumnFieldInfo[options.joinDepth][i].field.primaryKey)) {
                            let pkpos = this.pkPositions[options.joinDepth].get(a);
                            if (util.isUndefined(pkpos)) {
                                pkpos = [];
                                this.pkPositions[options.joinDepth].set(a, pkpos);
                            }

                            pkpos.push(i);
                        }
                    }
                }

                populateModel(this,
                    't0',
                    0,
                    0,
                    this.pkPositions,
                    new Map(),
                    this.selectedColumnFieldInfo,
                    res.result,
                    retval,
                    this.columnPositions,
                    options.joinDepth,
                    options.poolAlias);

                if (logger.isLogDebugEnabled()) {
                    logger.logDebug("executed query: row count=" + res.result.rows.length + ", objects created=" + retval.length);
                    logger.logDebug("result: " + util.toString(retval));
                }
                return {result: retval};
            } else {
                return res;
            }
        } catch (e) {
            logger.logError(e.toString(), e);
            return {error: e};
        }
    }
    
    /**
     * 
     * @param {type} sql - insert/update sql string
     * @param {type} parameters - bind parameter value list
     * @param {type} options
     * {
     *     joinDepth: <desired join depth, default to maxDefaultJoinDepth if not set>
     *     conn: <database connection to use - will create new connection if not set>
     *     maxRows: <if set will limit rows returned>
     *     autoCommit: <true/false - defaults to false if not set> 
     * }
     * @returns error if failure occurs
     */
    async executeSql(sql, parameters, options) {
        options = checkOptions(options);
        
        if (util.isNotValidObject(parameters)) {
            parameters = {};
        }

        if (logger.isLogDebugEnabled()) {
            logger.logDebug("parameters: " + JSON.stringify(parameters));
            logger.logDebug("sql: " + sql);
        }

        // declare these her for scope purposes to call inside promise
        let conn;
        try {
            if (util.isDefined(options.conn)) {
                conn = options.conn;
            } else if (options.poolAlias) {
                conn = await orm.getConnection(options.poolAlias);
            } else {
                conn = await orm.getConnection(this.getPoolAlias());
            }

            let res = await this.executeDatabaseSpecificSql(conn, sql, parameters, options);
 logger.logInfo('------------->' + JSON.stringify(res)) ;
            let rowsAffected = res.rowsAffected;
            if (!rowsAffected) {
                rowsAffected = res.affectedRows;
            }

            return {rowsAffected: rowsAffected, insertId: res.insertId};
        }

        catch (err) {
            if (!orm.appConfiguration.testMode) {
                logger.logError(this.getMetaData().getObjectName() + 'Repository.executeSql()', err);
                if (logger.isLogDebugEnabled()) {
                    logger.logDebug(sql);
                }
            }

            return {error: err};
        }

        finally {
            // only close if locally opened
            if (util.isNotValidObject(options.conn) && conn) {
                await this.closeDatabaseConnection(conn);
            }
        }
    }

    /**
     * 
     * @param {type} sqlKey - name of predefined object query
     * @param {type} options
     * {
     *     joinDepth: <desired join depth, default to maxDefaultJoinDepth if not set>
     *     conn: <database connection to use - will create new connection if not set>
     *     maxRows: <if set will limit rows returned>
     *     autoCommit: <true/false - defaults to false if not set> 
     * }
     * @returns standard sql query string
     */
    getNamedDbOperationSql(sqlKey, options) {
        options = checkOptions(options);
        let sql;
        if (util.isDefined(this.generatedSql[options.joinDepth])) {
            sql = this.generatedSql[options.joinDepth].get(sqlKey);
        }
            
        if (util.isNotValidObject(sql)) {
            let oql = this.namedDbOperations.get(sqlKey).trim();
            let op = '';
            if (this.isStandardOqlSelect(oql)) {
                op = this.getSelectClause(options.joinDepth);
            } else if (this.isDelete(oql)) {
                if (orm.getDbType(this.poolAlias) === util.MYSQL) {
                    op = 'delete t0';
                } else {
                    op = 'delete';
                }
            } else {
                op = oql.substring(0, oql.indexOf(' from '));
            }
            
            let replaceSet = new Set();
            let pos;
            pos = oql.indexOf('o.');
            while (pos > 0) {
                if (!util.isAlphaNumeric(oql.charAt(pos-1)) && (oql.charAt(pos-1) !== '.')) {
                    let pos2 = pos+2;
                    while (util.isAlphaNumeric(oql.charAt(pos2)) || (oql.charAt(pos2) === '.')) {
                        pos2++;
                    }

                    if (pos2 > (pos+1)) {
                        replaceSet.add(oql.substring(pos, pos2));
                    }

                    pos = oql.indexOf('o.', pos2);
                }
            }
        
            let where = '';
            pos = oql.indexOf(' where ');
            if (pos > 0) {
                where = oql.substring(pos);
            } else {
                pos = oql.indexOf(' order by ');
                if (pos > 0) {
                    where = oql.substring(pos);
                } 
            }

            let xref = new Map();
            
            if (replaceSet.size > 0) {
                replaceSet.forEach(token => {
                    xref.set(token, this.getColumnNameFromFieldName(token.trim().substring(2)));
                });                
            }
            
            if (this.isSelect(op)) {
                sql = (op + ' from ' + this.metaData.getTableName() + ' t0 ' + this.getJoinClause(options.joinDepth) + ' ' + where);
            } else {
                sql = (op + ' from ' + this.metaData.getTableName() + ' t0  ' + where);
            }

            if (xref.size > 0) {
                xref.forEach(function(item, key) {
                    sql = sql.replace(key, item);
                });
            }
            
            if (this.isSelect(op)) {
                this.generatedSql[options.joinDepth].set(sqlKey, sql);
            }
        }
        
        return sql;
    }

    /**
     * 
     * @param {type} fieldName object field name in dot notation for example in the Account object subAccounts.subAcctNm 
     * @returns alias.columnName for example t10.SUB_ACCT_NM
     */
    getColumnNameFromFieldName(fieldName) {
        let retval = null;
        if (logger.isLogDebugEnabled()) {
            logger.logDebug('fieldName=' + fieldName);
        }
        if (util.isDefined(fieldName)) {
            if (fieldName.trim().startsWith('o.')) {
                fieldName = fieldName.trim().substring(2);
            }
            
            let nameParts = fieldName.split('.');
            let curmd = this.metaData;
            let curAlias = 't0';
            for (let i = 0; i < nameParts.length; ++i) {
                if (i === (nameParts.length - 1)) {
                    let f = curmd.getFieldMap().get(nameParts[i]);

                    if (util.isDefined(f)) {
                        retval = (curAlias + '.' + f.columnName);
                    }
                } else {
                    let foundit = false;

                    let otodefs = curmd.getOneToOneDefinitions();
                    if (util.isDefined(otodefs)) {
                        for (let j = 0; j < otodefs.length; ++j) {
                            if (otodefs[j].fieldName === nameParts[i]) {
                                curmd = orm.getMetaData(otodefs[j].targetModelName);
                                curAlias = otodefs[j].alias;
                                foundit = true;
                                break;
                            }
                        }
                    }
                    
                    let otmdefs = curmd.getOneToManyDefinitions();
                    if (util.isDefined(otmdefs)) {
                        for (let j = 0; j < otmdefs.length; j++) {
                            if (otmdefs[j].fieldName === nameParts[i]) {
                                curmd = orm.getMetaData(otmdefs[j].targetModelName);
                                curAlias = otmdefs[j].alias;
                                foundit = true;
                                break;
                            }
                        }
                    }
                    
                    if (!foundit) {
                        util.throwError('failed to find relationship with name ' +  nameParts[i]);
                    }
                }
            }
        }
        
        return retval;
    }

    /**
     * recursive call to build select clause for for join depth specified by input parameter
     * @param {type} parentMetaData - meta data for parent model
     * @param {type} tableAlias current table alias
     * @param {type} currentDepth - current depth
     * @param {type} joinDepth - max join depth
     * @param {type} checkSet - set to prevent duplicate alias.columnname entries
     * @returns sql select clause
     */
    buildSelectClause(parentMetaData, tableAlias, currentDepth, joinDepth, checkSet) {
        // special case for depth 0 - just pull columns for table - no
        // joins
        let dbType = orm.getDbType(this.poolAlias);
        if (joinDepth === 0) {
            let pfields = parentMetaData.getFields();
            let comma = "";
            for (let i = 0; i < pfields.length; ++i) {
                this.selectClauses[joinDepth] += comma;
                this.selectedColumnFieldInfo[joinDepth].push({alias: tableAlias, field: pfields[i]});
                this.selectClauses[joinDepth] += (tableAlias + "." + pfields[i].columnName);
                
                comma = ", ";
            }
        } else {
            if (util.isNotValidObject(checkSet)) {
                checkSet = new Set();
            }
            let comma = "";
            if (currentDepth > 0) {
                comma = ", ";
            }

            let pfields = parentMetaData.getFields();
            for (let i = 0; i < pfields.length; ++i) {
                let f = (tableAlias + "." + pfields[i].columnName);
                if (!checkSet.has(f)) {
                    this.selectClauses[joinDepth] += comma;
                    this.selectedColumnFieldInfo[joinDepth].push({alias: tableAlias, field: pfields[i]});
    
                    let colsel = (tableAlias + "." + pfields[i].columnName);
                    if (dbType === 'mysql') {
                        colsel += (' as ' + tableAlias + "_" + pfields[i].columnName);
                    }
    
    
                    this.selectClauses[joinDepth] += colsel;

                    comma = ", ";
                    checkSet.add(f);
                }
            }
            
            if (currentDepth < joinDepth) {
                // only do this for top level table
                if (isRootTable(tableAlias)) {
                    let mtodefs = parentMetaData.getManyToManyDefinitions();
                    if (util.isDefined(mtodefs)) {
                       for (let i = 0; i < mtodefs.length; ++i) {
                           if (canJoin(mtodefs[i])) {
                                this.buildSelectClause(orm.getMetaData(mtodefs[i].targetModelName), 
                                buildAlias(tableAlias, mtodefs[i].alias, currentDepth), 
                                currentDepth+1, 
                                joinDepth, 
                                checkSet);

                            }
                        }
                    }

                    let otodefs = parentMetaData.getOneToOneDefinitions();
                    if (util.isDefined(otodefs)) {
                        for (let i = 0; i < otodefs.length; ++i) {
                            if (canJoin(otodefs[i])) {
                                this.buildSelectClause(orm.getMetaData(otodefs[i].targetModelName),
                                    buildAlias(tableAlias, otodefs[i].alias, currentDepth), 
                                    currentDepth+1, 
                                    joinDepth, 
                                    checkSet);
                            }
                        }
                    }
                }
                
                let otmdefs = parentMetaData.getOneToManyDefinitions();
                if (util.isDefined(otmdefs)) {
                    for (let i = 0; i < otmdefs.length; ++i) {
                        if (canJoin(otmdefs[i])) {
                            this.buildSelectClause(orm.getMetaData(otmdefs[i].targetModelName),
                                buildAlias(tableAlias, otmdefs[i].alias, currentDepth),
                                currentDepth+1, 
                                joinDepth, 
                                checkSet);
                        }
                    }
                }
            }
        }
    }

    /**
     * recursive call to build join clause for for join depth specified by input parameter
     * @param {type} parentMetaData - meta data for parent model
     * @param {type} tableAlias current table alias
     * @param {type} currentDepth - current depth
     * @param {type} joinDepth - max join depth
     * @param {type} checkSet - set to prevent duplicate join entries
     * @returns sql join clause
     */
    buildJoinClause(parentMetaData, tableAlias, currentDepth, joinDepth, checkSet) {
        if (joinDepth === 0) {
            this.joinClauses[joinDepth] = '';
        } else if (currentDepth < joinDepth) {
            if (util.isNotValidObject(checkSet)) {
                checkSet = new Set();
            }

            if (isRootTable(tableAlias)) {
                let mtodefs = parentMetaData.getManyToManyDefinitions();
                if (util.isDefined(mtodefs)) {
                    for (let i = 0; i < mtodefs.length; ++i) {
                        if (canJoin(mtodefs[i])) {
                            let jc = '';

                            let alias = buildAlias(tableAlias, mtodefs[i].alias, currentDepth);
                            jc += (" join " + mtodefs[i].targetTableName + " " + alias + " on (");
                            let targetColumns = mtodefs[i].joinColumns.targetColumns.split(",");
                            let sourceColumns = mtodefs[i].joinColumns.sourceColumns.split(",");

                            let and = "";
                            for (let j = 0; j < targetColumns.length; ++j) {
                                jc += (and + alias + "." + targetColumns[j] + " = " + tableAlias + "." + sourceColumns[j]);
                                and = " and ";
                            }

                            jc +=  ") ";

                            if (!checkSet.has(jc)) {
                                this.joinClauses[joinDepth] += jc;
                                checkSet.add(jc);
                                this.buildJoinClause(orm.getMetaData(mtodefs[i].targetModelName), 
                                    buildAlias(tableAlias, mtodefs[i].alias, currentDepth), 
                                    currentDepth+1, 
                                    joinDepth, 
                                    checkSet);
                            }
                        }
                    }
                }
            
                let otodefs = parentMetaData.getOneToOneDefinitions();
                if (util.isDefined(otodefs)) {
                    for (let i = 0; i < otodefs.length; ++i) {
                        if (canJoin(otodefs[i])) {
                            let jc = '';
                            if (!otodefs[i].required) {
                                jc += " left outer";
                            }

                            let alias = buildAlias(tableAlias, otodefs[i].alias,  currentDepth);
                            jc += (" join " + otodefs[i].targetTableName + " " + alias + " on (");
                            let targetColumns = otodefs[i].joinColumns.targetColumns.split(",");
                            let sourceColumns = otodefs[i].joinColumns.sourceColumns.split(",");

                            let and = "";
                            for (let j = 0; j < targetColumns.length; ++j) {
                                jc += (and + alias + "." + targetColumns[j] + " = " + tableAlias + "." + sourceColumns[j]);
                                and = " and ";
                            }

                            jc +=  ") ";

                            if (!checkSet.has(jc)) {
                                this.joinClauses[joinDepth] += jc;
                                checkSet.add(jc);
                                this.buildJoinClause(orm.getMetaData(otodefs[i].targetModelName), 
                                    buildAlias(tableAlias, otodefs[i].alias, currentDepth), 
                                    currentDepth+1, 
                                    joinDepth, 
                                    checkSet);
                            }
                        }
                    }
                }
            }
            
            let otmdefs = parentMetaData.getOneToManyDefinitions();
            if (util.isValidObject(otmdefs)) {
                for (let i = 0; i < otmdefs.length; ++i) {
                    if (canJoin(otmdefs[i])) {
                        if (util.isNotValidObject(otmdefs[i].joinTableName)) {
                            let jc = '';
                            if (!otmdefs[i].required) {
                                jc += " left outer";
                            }

                            let alias = buildAlias(tableAlias, otmdefs[i].alias, currentDepth);

                            jc += (" join " + otmdefs[i].targetTableName + " " + alias + " on (");

                            let targetColumns = otmdefs[i].joinColumns.targetColumns.split(",");
                            let sourceColumns = otmdefs[i].joinColumns.sourceColumns.split(",");


                            let and = "";
                            for (let j = 0; j < targetColumns.length; ++j) {
                                jc += (and + alias + "." + targetColumns[j] + " = " + tableAlias + "." + sourceColumns[j]);
                                and = " and ";
                            }

                            jc += ") ";

                            if (!checkSet.has(jc)) {
                                this.joinClauses[joinDepth] += jc;
                            }
                        } else {
                            let alias = buildAlias(tableAlias, otmdefs[i].alias, currentDepth);
                            for (let k = 0; k < 2; ++k) {
                                let jc = '';
                                if (!otmdefs[i].required) {
                                    jc += " left outer";
                                }

                                if (k === 0) {
                                    jc += (" join " + otmdefs[i].joinTableName + " " + alias + "jt on (");

                                    let targetColumns = otmdefs[i].joinColumns.targetColumns.split(",");
                                    let sourceColumns = otmdefs[i].joinColumns.sourceColumns.split(",");

                                    let and = "";
                                    for (let j = 0; j < targetColumns.length; ++j) {
                                        jc += (and + alias + "." + targetColumns[j] + " = " + tableAlias + "." + sourceColumns[j]);
                                        and = " and ";
                                    }

                                    jc += ") ";

                                    if (!checkSet.has(jc)) {
                                        this.joinClauses[joinDepth] += jc;
                                    }
                                } else {
                                    jc += (" join " + otmdefs[i].targetTableName + " " + alias + " on (");

                                    let targetColumns = otmdefs[i].joinColumns.inverseTargetColumns.split(",");
                                    let sourceColumns = otmdefs[i].joinColumns.inverseSourceColumns.split(",");

                                    let and = "";
                                    for (let j = 0; j < targetColumns.length; ++j) {
                                        jc += (and + alias + "jt." + targetColumns[j] + " = " + tableAlias + "." + sourceColumns[j]);
                                        and = " and ";
                                    }

                                    jc += ") ";

                                    if (!checkSet.has(jc)) {
                                        this.joinClauses[joinDepth] += jc;
                                    }
                                }
                            }
                        }
                        this.buildJoinClause(orm.getMetaData(otmdefs[i].targetModelName), 
                            buildAlias(tableAlias, otmdefs[i].alias, currentDepth), 
                            currentDepth+1, 
                            joinDepth, 
                            checkSet);
                    }
                }
            }
        }
    }

    /**
     * 
     * @param {type} whereComparisons - list of WhereComparison (WhereComparison.js) objects defining the where clause
     * @returns {Repository.buildWhereClause.where|String}
     */
    buildWhereClause(whereComparisons) {
        let where = '';
        
        let dbType = orm.getDbType(this.poolAlias);
        let bindex = 1;
        for (let i = 0; i < whereComparisons.length; ++i) {
            if (i > 0) {
                where += (' ' + whereComparisons[i].getLogicalOperator() + ' ');
            } else {
                where = ' where ';
            }
            where += whereComparisons[i].getOpenParen();
            let fieldName = whereComparisons[i].getFieldName().trim();
            if (fieldName.startsWith('o.')) {
                fieldName = fieldName.substring(2);
            }
            where += this.getColumnNameFromFieldName(fieldName);
            where += (' ' + whereComparisons[i].getComparisonOperator() + ' ');
            if (whereComparisons[i].getUseBindParams()) {
                switch(dbType) {
                    case util.ORACLE:
                        where += (':p' + (i+1));
                        break;
                    case util.MYSQL:
                        where += ' ?';
                        break;
                    case util.POSTGRES:
                        where += ' $' + bindex;
                        bindex++;
                        break;
                }
            } else {
                where += whereComparisons[i].getComparisonValue();
            }
            where += whereComparisons[i].getCloseParen();
        }

        return where;
    }
    
    /**
     * @param {type} md - model meta data
     * @returns object query string for find by primary key
     */
    buildFindOneNamedOperation(md) {
        let onm;
        if (md) {
            onm = md.getObjectName();
        } else {
            onm = this.metaData.getObjectName();
        }
        let sql = ('select ' + onm + ' o from ' + onm + ' where ');

        let dbType = orm.getDbType(this.poolAlias);
        let and = '';
        let pkfields = this.metaData.getPrimaryKeyFields();
        for (let i = 0; i < pkfields.length; ++i) {
            sql += (and + 'o.' +  pkfields[i].fieldName + ' = ');
            
            switch(dbType) {
                case util.ORACLE:
                    sql += (':' + pkfields[i].fieldName);
                    break;
                case util.MYSQL:
                    sql += ' ?';
                    break;
                case util.POSTGRES:
                    sql += (' $' + (i+1));
                    break;
    
            }
            and = ' and ';
        }

        return sql;
    }

    /**
     * 
     * @returns object query string for getAll()
     */
    buildGetAllNamedOperation() {
        let onm = this.metaData.getObjectName();
        let sql = ('select ' + onm + ' o from ' + onm + ' order by  ');

        let comma = '';
        let pkfields = this.metaData.getPrimaryKeyFields();
        for (let i = 0; i < pkfields.length; ++i) {
            sql += (comma + 'o.' +  pkfields[i].fieldName);
            comma = ',';
        }

        return sql;
    }

    buildDeleteNamedOperation() {
        let onm = this.metaData.getObjectName();
        let sql = ('delete from ' + onm + ' o where  ');

        let dbType = orm.getDbType(this.poolAlias);
        let and = '';
        let pkfields = this.metaData.getPrimaryKeyFields();
        for (let i = 0; i < pkfields.length; ++i) {
            sql += (and + 'o.' +  pkfields[i].fieldName + ' = ');
            switch(dbType) {
                case util.ORACLE:
                    sql += (':' + pkfields[i].fieldName);
                    break;
                case util.MYSQL:
                    sql += ' ?';
                    break;
                case util.POSTGRES:
                    sql += (' $' + (i+1));
                    break;
    
            }
            and = ' and ';
        }

        return sql;
    }

    getParametersFromWhereComp(whereComparisons) {
        let retval = [];
        for (let i = 0; i < whereComparisons.length; ++i) {
            if (whereComparisons[i].getUseBindParams()) {
                retval.push(whereComparisons[i].getComparisonValue());
            }
        }
        return retval;
    }

    async doBeginTransaction(conn) {
        switch (orm.getDbType(this.poolAlias)) {
            case util.ORACLE:
            case util.MYSQL:
                await conn.beginTransaction();
                break;
            case util.POSTGRES:
                await conn.query('BEGIN');
                break;
        }

    }

    async doRollback(conn) {
        switch(orm.getDbType(this.poolAlias)) {
            case util.ORACLE:
            case util.MYSQL:
                await conn.rollback();
                break;
            case util.POSTGRES:
                await conn.query('ROLLBACK');
                break;
        }
    }

    async doCommit(conn) {
        switch(orm.getDbType(this.poolAlias)) {
            case util.ORACLE:
            case util.MYSQL:
                await conn.commit();
                break;
            case util.POSTGRES:
                await conn.query('COMMIT');
                break;
        }
    }

    getJoinClause(depth) {
        return this.joinClauses[depth];
    }
    
    getSelectClause(depth)  {
        let retval = this.selectClauses[depth];
    
        if (util.isUndefined(retval)) {
            this.selectClauses[depth] = 'select ';
            this.joinClauses[depth] = '';
            this.selectedColumnFieldInfo[depth] = [];
            this.columnPositions[depth] = new Map();
            this.pkPositions[depth] = new Map();
            this.generatedSql[depth] = new Map();
             this.buildSelectClause(this.metaData, 't0', 0, depth);
            this.buildJoinClause(this.metaData, 't0', 0, depth);
            retval = this.selectClauses[depth];
        }
        
        return retval;
    }
};

/**
 * complex recursive method to populate model hierarchy from result set
 * @param {type} repo - model repositor
 * @param {type} curAlias - current table alias
 * @param {type} curDepth - current object graph depth
 * @param {type} curRow - current sql result set row
 * @param {type} pkp - primary key position array for current table (in current row)
 * @param {type} pkmap - object map by unique key
 * @param {type} scInfo - selected column information array
 * @param {type} result - sql result rows/columns
 * @param {type} retval - object grapth array
 * @param {type} columnPos - array of maps defining column positions by alias
 * @param {type} joinDepth - max joinDepth
 * @param {type} poolAlias - db pool used to pull this object
 */
function populateModel(repo, curAlias, curDepth, curRow, pkp, pkmap, scInfo, result, retval, columnPos, joinDepth, poolAlias) {
    for (let i = curRow; i < result.rows.length; ++i) {
        
        let curpkp = pkp[joinDepth].get(curAlias);
        if (util.isDefined(curpkp)) {
            let curpk = getPkValue(result.rows[i], curpkp);
            let md = repo.getMetaData();
            let objname = md.getObjectName();
            let objkey = (objname + "-" + curAlias + "-" + curpk);

            let curobj = pkmap.get(objkey);

            if (util.isUndefined(curobj)) {
                curobj = require(orm.appConfiguration.ormModuleRootPath + "/" + repo.getMetaData().getModule())(orm.getMetaData(objname));
                pkmap.set(objkey, curobj);

                if (isRootTable(curAlias)) {
                    retval.push(curobj);
                }
            }


            let cpos = columnPos[joinDepth].get(curAlias);
            for (let j = 0; j < cpos.length; ++j) {
                if (result.rows[i][cpos[j]] !== null) {
                    if (repo.isDateType(scInfo[joinDepth][cpos[j]].field)) {
                        curobj.__setFieldValue(scInfo[joinDepth][cpos[j]].field.fieldName,
                            doConversionIfRequired(scInfo[joinDepth][cpos[j]].field, new Date(result.rows[i][cpos[j]]), true));
                    } else {
                        curobj.__setFieldValue(scInfo[joinDepth][cpos[j]].field.fieldName,
                            doConversionIfRequired(scInfo[joinDepth][cpos[j]].field, result.rows[i][cpos[j]], true));
                    }
                }
            }

            if (curDepth < joinDepth)  {
                // populate many-to-one child models
                if (isRootTable(curAlias)) {
                    let mtodefs = md.getManyToManyDefinitions();
                    if (util.isDefined(mtodefs)) {
                        for (let j = 0; j < mtodefs.length; ++j) {
                            if (canJoin(mtodefs[j])) {
                                let a = buildAlias(curAlias, mtodefs[j].alias, curDepth);

                                let pk;
                                let pkpos = pkp[joinDepth].get(a);
                                if (pkpos) {
                                    pk = getPkValue(result.rows[i], pkp[joinDepth].get(a));
                                }

                                if (pk) {
                                    let r = orm.getRepository(mtodefs[j].targetModelName);
                                    let nm = r.getMetaData().getObjectName();
                                    let key = (nm + '-' + a + '-' + pk);

                                    let obj = pkmap.get(key);
                                    if (util.isUndefined(obj)) {
                                        obj = require(mtodefs[j].targetModule)(orm.getMetaData(mtodefs[j].targetModelName));
                                        curobj.__setFieldValue(mtodefs[j].fieldName, obj);
                                        pkmap.set(key, obj);
                                        populateModel(
                                            r, 
                                            a, 
                                            curDepth+1, 
                                            i, 
                                            pkp,
                                            pkmap, 
                                            scInfo, 
                                            result, 
                                            retval,
                                            columnPos,
                                            joinDepth);
                                    } else {
                                        curobj.__setFieldValue(mtodefs[j].fieldName, obj);
                                    }
                                } else {
                                    curobj.__setFieldValue(mtodefs[j].fieldName, null);
                                }
                            }
                        }
                    }

                    // populate one-to-one child models
                    let otodefs = md.getOneToOneDefinitions();
                    if (util.isDefined(otodefs)) {
                        for (let j = 0; j < otodefs.length; ++j) {
                            if (canJoin(otodefs[j])) {
                                let a = buildAlias(curAlias, otodefs[j].alias, curDepth);

                                let pk;
                                let pkpos = pkp[joinDepth].get(a);
                                if (pkpos) {
                                    pk = getPkValue(result.rows[i], pkp[joinDepth].get(a));
                                }

                                if (pk) {
                                    let r = orm.getRepository(otodefs[j].targetModelName);
                                    let nm = r.getMetaData().getObjectName();
                                    let key = (nm + '-' + a + '-' + pk);
                                    let obj = pkmap.get(key);
                                    if (util.isUndefined(obj)) {
                                        obj = require(orm.appConfiguration.ormModuleRootPath + "/" + otodefs[j].targetModule)(orm.getMetaData(otodefs[j].targetModelName));
                                        pkmap.set(key, obj);
                                        curobj.__setFieldValue(otodefs[j].fieldName, obj);
                                        populateModel(
                                            r, 
                                            a, 
                                            curDepth+1, 
                                            i, 
                                            pkp,
                                            pkmap, 
                                            scInfo, 
                                            result, 
                                            retval,
                                            columnPos,
                                            joinDepth);
                                    } else {
                                       curobj.__setFieldValue(otodefs[j].fieldName, obj);
                                    }
                                } else {
                                    curobj.__setFieldValue(otodefs[j].fieldName, null);
                                }
                           }
                        }
                    }
                }

                // populate one-to-many child models
                let otmdefs = md.getOneToManyDefinitions();
                if (util.isDefined(otmdefs)) {
                    for (let j = 0; j < otmdefs.length; ++j) {
                        if (canJoin(otmdefs[j])) {
                            let a = buildAlias(curAlias, otmdefs[j].alias, curDepth);

                            let pk;
                            let pkpos = pkp[joinDepth].get(a);

                            if (pkpos) {
                                pk = getPkValue(result.rows[i], pkp[joinDepth].get(a));
                            }

                            if (pk) {
                                let r = orm.getRepository(otmdefs[j].targetModelName);
                                let nm = r.getMetaData().getObjectName();
                                let key = (nm + '-' + a + '-' + pk);

                                let obj = pkmap.get(key);
                                if (util.isUndefined(obj)) {
                                    obj = require(orm.appConfiguration.ormModuleRootPath + "/" + otmdefs[j].targetModule)(orm.getMetaData(otmdefs[j].targetModelName));
                                    pkmap.set(key, obj);
                                    populateModel(
                                        r, 
                                        a, 
                                        curDepth+1, 
                                        i, 
                                        pkp,
                                        pkmap, 
                                        scInfo, 
                                        result, 
                                        retval,
                                        columnPos,
                                        joinDepth);
                                }

                                let l = curobj.__getFieldValue(otmdefs[j].fieldName, true);

                                if (util.isUndefined(l)) {
                                    l = [];
                                    curobj.__setFieldValue(otmdefs[j].fieldName, l);
                                }
                                
                                l.push(obj);
                            } else if (util.isUndefined(curobj.__getFieldValue(otmdefs[j].fieldName, true))) {
                               curobj.__setFieldValue(otmdefs[j].fieldName, null);
                            }
                        }
                    }
                }

                curobj.__setModified(false);
                curobj.__setNew(false);
                curobj.__poolAlias__ = poolAlias
            }
        }
    }
}

function doConversionIfRequired(field, value, fromDb) {
    let retval = value;
    
    if (util.isDefined(field.converter) && util.isValidObject(value)) {
        retval = require('../converters/' + field.converter + '.js')(field, value, fromDb);
    }
    
    return retval;
}
/**
 * 
 * @param {type} row - current result set array of row data
 * @param {type} pkpos - array of column positions for primary key
 * @returns primary key value array
 */
function getPkValue(row, pkpos) {
    let retval = '';
    for (let i = 0; i < pkpos.length; ++i) {
        // if pk field is null the exit 
        let key = row[pkpos[i]];
        if (util.isUndefined(key) || !key) {
            retval = null;
            break;
        }
        if (i > 0) {
            retval += util.PK_VALUE_SEPARATOR;
        }
        retval += row[pkpos[i]];
    }

    return retval;
}

/**
 * ensures that a valid options settings object is available
 * @param {type} options - options settings
 * @returns populated options settings if required
 */
function checkOptions(options) {
    let retval;
    if (util.isUndefined(options)) {
        retval = {"joinDepth": orm.appConfiguration.defaultMaxJoinDepth};
    } else {
        if (util.isUndefined(options.joinDepth)) {
            options.joinDepth = orm.appConfiguration.defaultMaxJoinDepth;
        }
        
        retval = options;
    }
    
    return retval;
}

function canJoin(ref) {
    return (ref.status === util.ENABLED);
}

function buildAlias(parentAlias, currentAlias, depth) {
    return (parentAlias + '_' + currentAlias + '_' + depth);
}

function isRootTable(alias) {
    return (alias === 't0');
}
