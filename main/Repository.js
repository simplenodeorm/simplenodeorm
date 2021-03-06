/*
 * Copyright (c) 2019  simplenodeorm.org
 */

"use strict";

const orm = require('../orm.js');
const util = require('./util.js');
const logger = require('./Logger.js');

/**
 * this class is the heart of the orm - all the relations to object graph logic occurs here as well as the sql operations
 */
module.exports = class Repository {
    constructor(metaData, dbType) {
        this.metaData = metaData;
        this.selectedColumnFieldInfo = [];
        this.columnPositions = [];
        this.pkPositions = [];
        this.namedDbOperations = new Map();
        this.generatedSql = [];
        this.dbType = dbType;
        
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
    
    loadNamedDbOperations() {
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
                sortRelatedEntriesIfRequired(res.result);
                return {result: res.result[0]};
            }
        } else if (util.isDefined(res.error)) {
            return res;
        } 
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
        let pkfields = this.metaData.getPrimaryKeyFields();

        if (pkfields.length > 1) {
            sql += ' concat('
        }

        let comma = '';
        for (let i = 0; i < pkfields.length; ++i) {
            sql += (comma + 't0.' + pkfields[i].columnName);
            comma = ',\'.\',';
         }

        if (pkfields.length > 1) {
            sql += ') ';
        }

        let join = this.getJoinClause(options.joinDepth);
        if (!join) {
            join = ''
        }
        sql += (') from ' + this.metaData.getTableName() + ' t0 ' + join);
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
        if (logger.isLogDebugEnabled()) {
            logger.logDebug("in Repository.find()");
            logger.logDebug("Repository.find - options: " + JSON.stringify(options));
        }
        options = checkOptions(options);
        let where = this.buildWhereClause(whereComparisons);
        let params = this.getParametersFromWhereComp(whereComparisons);
        let sql = (this.getSelectClause(options.joinDepth) + " from " + this.metaData.getTableName() + ' t0 ' + this.getJoinClause(options.joinDepth) + where);


        if (util.isDefined(orderByEntries) && (orderByEntries.length > 0)) {
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

        if (logger.isLogDebugEnabled()) {
            logger.logDebug("before find.executeQuery");
            logger.logDebug("sql: " + sql);
            logger.logDebug("poolAlias: " + options.poolAlias);
        }
        let retval = await this.executeQuery(sql, params, options);

        if (logger.isLogDebugEnabled()) {
            logger.logDebug("after find.executeQuery: retval=" + retval);
        }
        if (!retval.error) {
            sortRelatedEntriesIfRequired(retval.result);
        }

        return retval;
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
       try {
           options = checkOptions(options);
           let rowsAffected = 0;
           let l = modelInstances;


          // allow a single model or an array of models
           if (!Array.isArray(modelInstances)) {
               l = [];
               l.push(modelInstances);
           }

           if (l.length > 0) {
               let md = orm.getRepository(l[0].__model__).getMetaData();
               let otodefs = md.getOneToOneDefinitions();
               let otmdefs = md.getOneToOneDefinitions();

               for (let i = 0; i < l.length; ++i) {
                   if (util.isDefined(otodefs)) {
                       for (let j = 0; j < otodefs.length; ++j) {
                           if (util.isDefined(otodefs[j].cascadeDelete) && otodefs[j].cascadeDelete) {
                               let rel = await l[i].__getFieldValue(otodefs[j].fieldName);
                               if (util.isDefined(rel)) {
                                   let ret = await this.delete(rel, options);
                                   if (ret.error) {
                                       util.throwError("DeleteException[" + rel.__model + "]", ret.error);
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
                               let rel = await l[i].__getFieldValue(otmdefs[j].fieldName);
                               if (util.isDefined(rel)) {
                                   let ret2 = await this.delete(rel, options);
                                   if (ret2.error) {
                                       util.throwError("DeleteException[" + rel.__model + "]", ret2.error);
                                   } else if (util.isDefined(ret2.rowsAffected)) {
                                       rowsAffected += ret2.rowsAffected;
                                   }
                               }
                           }
                       }
                   }

                   let ret3 = await this.executeNamedDbOperation(util.DELETE, this.getPrimaryKeyValuesFromModel(l[i]), options);

                   if (ret3.error) {
                       util.throwError("DeleteException[" + l[0].__model + "]", ret3.error);
                   } else if (util.isDefined(ret3.rowsAffected)) {
                       rowsAffected += ret3.rowsAffected;
                   }
               }
           }

           return {rowsAffected: rowsAffected};
       } catch (e) {
           return {error: e};
       }
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
        let newObject = model.__isNew();

        if (!newObject) {
            let res = await this.exists(model, options);
            if (res.error) {
                util.throwError("CheckExistsException[" + model.__model__ + "]", res.error);
            } else {
                newObject = !res;
            }
        }

        if (newObject) {
            result = await this.executeSql(sql, params, options);
            if (result.error) {
                logger.logError("sql: " + sql);
                logger.logError("params: " + JSON.stringify(params));
                util.throwError("InsertException[" + model.__model__ + "]", result.error);
            }

            if (logger.isLogDebugEnabled()) {
                logger.logDebug("new object result: " + JSON.stringify(result))
            }
            if (result.insertId) {
                this.setAutoIncrementIdIfRequired(model, result.insertId)
            }
        } else if (model.__modified__) {
            if (this.metaData.isVersioned()) {
                let currentVersion = await this.getCurrentVersion(model, options);
                if (util.isNotValidObject(currentVersion)) {
                    currentVersion = -1;
                } else if (currentVersion instanceof Date) {
                    currentVersion = currentVersion.getTime();
                }

                let verField = this.getVersionField(model);

                if (logger.isLogDebugEnabled()) {
                    logger.logDebug("current version[" + verField.fieldName + "]=" + currentVersion);
                }

                let ver = model[verField.fieldName];

                if (ver instanceof Date) {
                    ver = ver.getTime();
                }

                if ((currentVersion > -1) && (ver < currentVersion)) {
                    util.throwError('OptimisticLockException', model.__model__ + ' has been modified by another user');
                }

                if (logger.isLogDebugEnabled()) {
                    logger.logDebug("new version[" + verField.fieldName + "]=" + currentVersion);
                }
            }

            result = await this.executeSql(sql, params, options);
            if (result.error) {
                logger.logError("sql: " + sql);
                logger.logError("params: " + JSON.stringify(params));
                logger.logError("error: " + result.error);
                util.throwError("UpdateException[" + model.__model__ + "]", result.error);
            }
        }

        if (util.isDefined(result.rowsAffected)) {
            rowsAffected += result.rowsAffected;
        } else if (util.isDefined(result.affectedRows)) {
            rowsAffected += result.affectedRows;
        }

        // do this to prevent returning child objects
        // if return values true
        let childOptions = Object.assign({}, options);
        childOptions.returnValues = false;

        let otodefs = this.metaData.getOneToOneDefinitions();
        if (util.isValidObject(otodefs)) {
            for (let i = 0; i < otodefs.length; ++i) {
                if (otodefs[i].cascadeUpdate) {
                    let oto = model[otodefs[i].fieldName];
                    if (util.isValidObject(oto)) {
                        this.populateReferenceColumns(model, otodefs[i], oto);
                        let res = await orm.getRepository(otodefs[i].targetModelName).save(oto, childOptions);

                        if (util.isDefined(res.error)) {
                            util.throwError("SaveRelatedObjectException", res.error);
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
                    let otm = model[otmdefs[i].fieldName];
                    if (util.isValidObject(otm)) {
                        this.populateReferenceColumns(model, otmdefs[i], otm);
                        let res = await orm.getRepository(otmdefs[i].targetModelName).save(otm, childOptions);
                        if (util.isDefined(res.error)) {
                            util.throwError("SaveRelatedObjectException", res.error);
                        } else if (util.isDefined(res.rowsAffected)) {
                            rowsAffected += res.rowsAffected;
                        }
                    }
                }
            }
        }

        return {model: model.__model__, rowsAffected: rowsAffected, insertId: result.insertId};
    }
    
    setAutoIncrementIdIfRequired(model, id) {
        let fields = orm.getRepository(model.__model__).getMetaData().fields;
        for (let i = 0; i < fields.length; ++i) {
            if (fields[i].autoIncrementGenerator) {
                model[fields[i].fieldName] = id;
                break;
            }
        }
    }
    
    getVersionField(model) {
        let retval;
        let fields = orm.getRepository(model.__model__).getMetaData().fields;
        
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

    async releaseConnection(conn) {
        switch(this.dbType) {
            case util.ORACLE:
                await conn.close();
                break;
            case util.MYSQL:
                await conn.release();
                break;
            case util.POSTGRES:
                await conn.release();
                break;
        }
    }

    async getCurrentVersion(model, options) {
        let md = this.metaData;
        let sql = ('select ' + md.getVersionField().columnName + ' from ' + md.tableName + ' where ');

        let params = [];
        let pkfields = md.getPrimaryKeyFields();
        let and = '';
         for (let i = 0; i < pkfields.length; ++i) {
            sql += (and + pkfields[i].columnName + ' = ');
            switch(this.dbType) {
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

            params.push(model[pkfields[i].fieldName]);
            and = ' and ';
        }

        let res = await this.executeSqlQuery(sql, params, options);
        if (util.isDefined(res.error)) {
            logger.logError("sql: " + sql);
            logger.logError("params: " + JSON.stringify(params));
            util.throwError('CurrentVersionException', res.error);
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
        try {
            let pcmap = orm.getRepository(pmodel.__model__).getMetaData().getColumnToFieldMap();
            let ccmap = orm.getRepository(refdef.targetModelName).getMetaData().getColumnToFieldMap();

            let l;

            // allow a single model or an array of models
            if (Array.isArray(cmodel)) {
                l = cmodel;
            } else {
                l = [];
                l.push(cmodel);
            }

            let scols = refdef.joinColumns.sourceColumns.split(',');
            let tcols = refdef.joinColumns.targetColumns.split(',');

            for (let i = 0; i < l.length; ++i) {
                for (let j = 0; j < scols.length; ++j) {
                    l[i][ccmap.get(tcols[j]).fieldName] = pmodel[pcmap.get(scols[j]).fieldName];
                }
            }
        }
        catch(e) {
            util.throwError("PopulateReferenceColumnsException", e);
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
        let fields = this.getMetaData().fields;
        for (let i = 0; i < fields.length; ++i) {
            let val = doConversionIfRequired(fields[i], model[fields[i].fieldName], false);
            if (util.isNotValidObject(val) && (fields[i].required || util.isDefined(fields[i].defaultValue))) {
                if (util.isValidObject(fields[i].autoIncrementGenerator)) {
                    if ((this.dbType === util.ORACLE) || (this.dbType === util.POSTGRES)) {
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
            } else if (this.isBlobType(fields[i])) {
                model.__setFieldValue(fields[i].fieldName, val);
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
        let md = this.getMetaData();
        let fields = md.fields;
        for (let i = 0; i < fields.length; ++i) {
            let val = doConversionIfRequired(fields[i], model[fields[i].fieldName], false);
            
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
                    retval.push('POINT(' + val.x + ' ' + val.y + ')');
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
        
        let res;
        
        switch(this.dbType) {
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
        let retval;
        let md = this.getMetaData();
        retval = ('insert into ' + md.tableName+ '(');
        let fields = md.fields;
        let comma = '';
        for (let i = 0; i < fields.length; ++i) {
            retval += (comma + fields[i].columnName);
            comma = ',';
        }

        retval += ') values (';

        comma = '';
        for (let i = 0; i < fields.length; ++i) {
            switch(this.dbType) {
                case util.ORACLE:
                    retval += (comma + ' :' + (fields[i].fieldName));
                    break;
                case util.MYSQL:
                    if (this.isGeometryType(fields[i])) {
                        retval += (comma + ' ST_GeomFromText(?)');
                    } else if (this.isBlobType(fields[i])) {
                        retval += (comma + ' BINARY(?)');
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

        retval += ')';

        return retval;
    }
    
    /**
     * 
     * @param {type} model - source model for update sql
     * @returns update sql string
     */
   getUpdateSql(model) {
        let retval;
        let md = this.getMetaData();
        retval = ('update ' + md.tableName + ' ');
        let where = ' where ';
        let fields = md.fields;
        let comma = '';
        let and = '';
        let set = ' set ';

        for (let i = 0; i < fields.length; ++i) {
            if (util.isDefined(fields[i].primaryKey) && fields[i].primaryKey) {
                switch(this.dbType) {
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
                switch(this.dbType) {
                    case util.ORACLE:
                        retval += (comma + set + fields[i].columnName + ' = :' + fields[i].fieldName);
                        break;
                    case util.MYSQL:
                        if (this.isGeometryType(fields[i])) {
                            retval += (comma + set + fields[i].columnName + ' = ST_GeomFromText(?)');
                        } else if (this.isBlobType(fields[i])) {
                            retval += (comma + set + fields[i].columnName + ' = BINARY(?)');
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
        try {
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

            let md = this.getMetaData();
            let modelName = md.objectName;
            let insertIds = [];
            for (let i = 0; i < l.length; ++i) {
                let res;
                let newModel = false;
                if (!l[i].__isNew) {
                    let model = require(orm.appConfiguration.ormModuleRootPath + "/" + md.getModule())(md);
                    Object.assign(model, l[i]);
                    l[i] = model;
                }

                if (l[i].__isNew()) {
                    newModel = true;
                    res = await this.executeSave(l[i], this.getInsertSql(l[i]), await this.loadInsertParameters(l[i]), options);
                    if (res.error) {
                        util.throwError("ExecuteSaveInsertException", res.error);
                    }
                    if (res.insertId) {
                        insertIds.push(res.insertId);
                    }
                } else {
                    res = await this.executeSave(l[i], this.getUpdateSql(l[i]), await this.loadUpdateParameters(l[i], options), options);
                    if (res.error) {
                        util.throwError("ExecuteSaveUpdateException", res.error);
                    }
                }

                if (util.isDefined(res.rowsAffected)) {
                    rowsAffected += res.rowsAffected;
                    if (newModel && res.insertId) {
                        this.setAutoIncrementIdIfRequired(l[i], res.insertId);
                    }
                }

                if (options.returnValues) {
                    l[i].__setMetaData(this.getMetaData());
                    let res2 = await this.findOne(this.getPrimaryKeyValuesFromModel(l[i]), options);
                    if (res2.error) {
                        util.throwError("FindUpdatedValueException", res.error);
                    }
                    if (util.isDefined(res2.result)) {
                        updatedValues.push(res2.result);
                    }
                }
            }

            if (updatedValues.length > 0) {
                return {rowsAffected: rowsAffected, updatedValues: updatedValues};
            } else {
                if (insertIds.length > 0) {
                    return {model:  modelName, rowsAffected: rowsAffected, insertIds: insertIds};
                } else {
                    return {model: modelName, rowsAffected: rowsAffected};
                }
            }
        } catch (e) {
            logger.logError("Exception thrown in save()", e);
            return {error: e};
        }
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

            for (let i = 0; i < pkfields.length; ++i) {
                sql += (and + pkfields[i].columnName  + ' = ');

                switch(this.dbType) {
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
                    params.push(await inputParams.__getFieldValue(pkfields[i].fieldName));
                }
            }

            let res = await this.executeSqlQuery(sql, params, options);
            retval = (util.isUndefined(res.error)
                && res.result
                && (res.result.rows.length === 1)
                && (res.result.rows[0][0] === 1));
        }
        catch (e) {}

        return retval;
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

    isBlobType(field) {
        let retval = false;
        if (util.isDefined(field)) {
            let type = field.type.toUpperCase();
            retval = type.includes('BLOB');
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
        switch(this.dbType) {
            case util.ORACLE:
                retval = 'sysdate';
                break;
            case util.MYSQL:
                retval = "CURRENT_TIMESTAMP()";
                break;
            case util.POSTGRES:
                retval = 'NOW()';
                break;
        }
    }
    
    getPrimaryKeyValuesFromModel(model) {
        let retval = [];
        let pkfields = orm.getRepository(model.__model__).getMetaData().getPrimaryKeyFields();
        for (let i = 0; i < pkfields.length; ++i) {
            retval.push(model[pkfields[i].fieldName]);
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
        if (logger.isLogDebugEnabled()) {
            logger.logDebug("in Repository.executeSqlQuery()");
         }


        options = checkOptions(options);
        
        if (util.isNotValidObject(parameters)) {
            parameters = {};
        }

        let conn;
        try {
            if (logger.isLogDebugEnabled()) {
                logger.logDebug("in Repository.executeSqlQuery(), before get connection");
                logger.logDebug('input parameters: ' + util.toString(parameters));
                logger.logDebug('sql: ' + sql);
                logger.logDebug('poolAlias: ' + options.poolAlias);
            }
            if (util.isValidObject(options.conn)) {
                conn = options.conn;
            } else if (options.poolAlias) {
                conn = await orm.getConnection(options.poolAlias);
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
                await this.releaseConnection(conn);
            }
        }
    }
    
    async executeDatabaseSpecificQuery(conn, sql, parameters, options) {
        let retval;

        try {

            if (logger.isLogDebugEnabled()) {
                logger.logDebug("executeDatabaseSpecificQuery - before execute");
            }
            switch (this.dbType) {
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
            if (logger.isLogDebugEnabled()) {
                logger.logDebug("executeDatabaseSpecificQuery - after execute: result=" + retval);
            }
        } catch (e) {
            logger.logError(e.toString(), e);
            throw e;
        }
        return retval;
    
    }
    
    async executeDatabaseSpecificSql(conn, sql, parameters, options) {
        let retval;
        switch (this.dbType) {
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

            if (logger.isLogDebugEnabled()) {
                logger.logDebug("in Repository.executeQuery(): before executeSqlQuery");
                logger.logDebug("sql: " + sql);
                logger.logDebug("poolAlias: " + options.poolAlias);
                logger.logDebug("parameters: " + JSON.stringify(parameters));
            }

            let res = await this.executeSqlQuery(sql, parameters, options);
            if (logger.isLogDebugEnabled()) {
                logger.logDebug("in Repository.executeQuery(): after executeSqlQuery");
                logger.logDebug("res: " + res);
            }

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

                await populateModel(this,
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
            }

            let res = await this.executeDatabaseSpecificSql(conn, sql, parameters, options);

            let rowsAffected = res.rowsAffected;
            if (!rowsAffected) {
                rowsAffected = res.affectedRows;
            }

            return {rowsAffected: rowsAffected, insertId: res.insertId};
        }

        catch (err) {
            logger.logError(this.getMetaData().getObjectName() + 'Repository.executeSql()', err);
            if (logger.isLogDebugEnabled()) {
                logger.logDebug(sql);
            }

            return {error: err};
        }

        finally {
            // only close if locally opened
            if (util.isNotValidObject(options.conn) && conn) {
                await this.releaseConnection(conn);
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
                if (this.dbType === util.MYSQL) {
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
                                curAlias = curAlias + '_' + otodefs[j].alias + '_' + i;
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
                                curAlias = curAlias + '_' + otmdefs[j].alias + '_' + i;
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
        // special case for depth 0 - just pull columns for table - no joins
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
                    if (this.dbType === util.MYSQL) {
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
                switch(this.dbType) {
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

        let and = '';
        let pkfields = this.metaData.getPrimaryKeyFields();
        for (let i = 0; i < pkfields.length; ++i) {
            sql += (and + 'o.' +  pkfields[i].fieldName + ' = ');
            
            switch(this.dbType) {
                case util.ORACLE:
                    sql += (':' + pkfields[i].fieldName);
                    break;
                case util.MYSQL:
                    sql += ' ?';
                    break;
                case util.POSTGRES:
                    sql += (' ' + (i+1));
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

        let and = '';
        let pkfields = this.metaData.getPrimaryKeyFields();
        for (let i = 0; i < pkfields.length; ++i) {
            sql += (and + 'o.' +  pkfields[i].fieldName + ' = ');
            switch(this.dbType) {
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
        switch (this.dbType) {
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
        switch(this.dbType) {
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
        switch(this.dbType) {
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
async function populateModel(repo, curAlias, curDepth, curRow, pkp, pkmap, scInfo, result, retval, columnPos, joinDepth, poolAlias) {
    let otmset = new Set();
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
                curobj.__poolAlias__ = poolAlias;
                curobj.__new__ = false;
                curobj.__modified__ = false;
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
                                        obj.__poolAlias__ = poolAlias;
                                        obj.__new__ = false;
                                        obj.__modified__ = false;

                                        curobj.__setFieldValue(mtodefs[j].fieldName, obj);
                                        pkmap.set(key, obj);
                                        await populateModel(
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
                                            joinDepth,
                                            poolAlias);
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
                                        obj.__poolAlias__ = poolAlias;
                                        obj.__new__ = false;
                                        obj.__modified__ = false;
                                        pkmap.set(key, obj);
                                        curobj.__setFieldValue(otodefs[j].fieldName, obj);
                                        await populateModel(
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
                                            joinDepth,
                                            poolAlias);
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
                                    obj.__poolAlias__ = poolAlias;
                                    obj.__new__ = false;
                                    obj.__modified__ = false;
                                    pkmap.set(key, obj);
                                    await populateModel(
                                        r,
                                        a,
                                        curDepth + 1,
                                        i,
                                        pkp,
                                        pkmap,
                                        scInfo,
                                        result,
                                        retval,
                                        columnPos,
                                        joinDepth,
                                        poolAlias);
                                }

                                if (!otmset.has(key)) {
                                    otmset.add(key);
                                    let l = await curobj.__getFieldValue(otmdefs[j].fieldName, true);

                                    if (util.isUndefined(l)) {
                                        l = [];
                                        curobj.__setFieldValue(otmdefs[j].fieldName, l);
                                    }

                                    l.push(obj);
                                }
                            } else if (util.isUndefined(await curobj.__getFieldValue(otmdefs[j].fieldName, true))) {
                               curobj.__setFieldValue(otmdefs[j].fieldName, null);
                            }
                        }
                    }
                }
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

function sortRelatedEntriesIfRequired(results) {
    if (results) {
        for (let i = 0; i < results.length; ++i) {
            if (results[i] && results[i].__metaData__ && results[i].__metaData__.oneToManyDefinitions) {
                for (let j = 0; j < results[i].__metaData__.oneToManyDefinitions.length; ++j) {
                    if (results[i][results[i].__metaData__.oneToManyDefinitions[j].fieldName]
                        && (results[i][results[i].__metaData__.oneToManyDefinitions[j].fieldName].length > 1)
                        && results[i].__metaData__.oneToManyDefinitions[j].orderBy) {
                        const keycols = results[i].__metaData__.oneToManyDefinitions[j].orderBy.split(",");
                        const desc = results[i].__metaData__.oneToManyDefinitions[j].orderByDesc;
                        results[i][results[i].__metaData__.oneToManyDefinitions[j].fieldName].sort(function (a, b) {
                            let retval = 0;
                            let val1 = "";
                            let val2 = "";

                            for (let k = 0; k < keycols.length; ++k) {
                                val1 = a[keycols[k]];
                                val2 = b[keycols[k]];

                                if (val1 > val2) {
                                    if (desc) {
                                        retval = -1;
                                    } else {
                                        retval = 1;
                                    }
                                    break;
                                } else if (val1 < val2) {
                                    if (desc) {
                                        retval = 1;
                                    } else {
                                        retval = -1;
                                    }
                                    break;
                                }
                             }

                            return retval;
                        })
                    }
                }
            }
        }
    }
}