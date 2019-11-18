/*
 * Copyright (c) 2019  simplenodeorm.org
 */

const orm = require('../orm.js');
const util = require('./util.js');
var deasync = require('deasync');

module.exports.lazyLoadData = function (model, fieldName) {
    let resultWrapper = {result: undefined, error: undefined};
    if (orm.logger.isLogDebugEnabled()) {
        orm.logger.logDebug("in lazyLoadData()");
    }

    let ld = deasync(loadData);

    if (orm.logger.isLogDebugEnabled()) {
        orm.logger.logDebug("before loadData call");
    }

    ld(model, fieldName, resultWrapper);

    if (orm.logger.isLogDebugEnabled()) {
        orm.logger.logDebug("after loadData call");
    }

    if (util.isDefined(resultWrapper.error)) {
        util.thowError('LazyLoadError', resultWrapper.error);
    } else if (util.isDefined(resultWrapper.result)) {
        resultWrapper.result.__new__ = false;
        resultWrapper.result.__modified__ = false;
        model.__setFieldValue(fieldName, resultWrapper.result);
    } else {
        model.__setFieldValue(fieldName, null);
    }

};

async function loadData(model, fieldName, resultWrapper) {
    let retval = null;
    let md = model.__getMetaData();
    
    let field = md.getField(fieldName);
    if (orm.logger.isLogDebugEnabled()) {
        orm.logger.logDebug("in loadData(): model=" + md.getObjectName() + ", field=" + fieldName);
    }

    if (util.isDefined(field)) {
        if (orm.logger.isLogDebugEnabled()) {
            orm.logger.logDebug("in loadData field");
        }
        let params = [];
        let sql = 'select ' + field.columnName + ' from ' + md.tableName + ' where ';
        let and = '';
        let pkfields = md.getPrimaryKeyFields();
        for (let i = 0; i < pkfields.length; ++i) {
            sql += (and + pkfields[i].columnName + ' = ? ');
            and = ' and ';
            params.push(model.__getFieldValue(pkfields[i].fieldName));
        }

        let ret = await repo.executeSqlQuery(sql, params, {maxRows: 1, poolAlias: model.__poolAlias__});
        if (util.isDefined(ret.error)) {
            resultWrapper.error = ret.error;
        } else if (util.isDefined(ret.result)) {
            resultWrapper.result = ret.result.rows[0][0];
        } else {
            resultWrapper.result = null;
        }
    } else {
        if (orm.logger.isLogDebugEnabled()) {
            orm.logger.logDebug("in loadData ref");
        }
        let ref = md.getReferenceDefinition(fieldName);
        if (util.isDefined(ref)) {
            if (orm.logger.isLogDebugEnabled()) {
                orm.logger.logDebug("found ref")
            }
            let refrepo = orm.getRepository(ref.targetModelName);
            let okToQuery = true;
            if (util.isDefined(refrepo)) {
                let srccols = ref.joinColumns.sourceColumns.split(',');
                let tgtcols = ref.joinColumns.targetColumns.split(',');
                let criteria = [];
                if (srccols.length !== tgtcols.length) {
                    okToQuery = false;
                } else {
                    if (orm.logger.isLogDebugEnabled()) {
                        orm.logger.logDebug("okToQuery=true");
                    }
                    for (let i = 0; i < srccols.length; ++i) {
                        let fnm = md.getFieldNameFromColumnName(srccols[i]);
                        
                        if (util.isDefined(fnm)) {
                            let srcval = model.__getFieldValue(fnm);
                            
                            // no query if no reference key
                            if (util.isUndefined(srcval)) {
                                okToQuery = false;
                                break;
                            } else {
                                criteria.push(require('./WhereComparison.js')(refrepo.getMetaData().getFieldNameFromColumnName(tgtcols[i]), srcval, util.EQUAL_TO));
                            }
                        }
                    }
                    
                    if (okToQuery) {
                        if (orm.logger.isLogDebugEnabled()) {
                            orm.logger.logDebug("before find: poolAlias=" + model.__poolAlias__);
                        }
                        let res = await refrepo.find(criteria, [], {joinDepth: 0, poolAlias: model.__poolAlias__});

                        if (orm.logger.isLogDebugEnabled()) {
                            orm.logger.logDebug("after find");
                        }
                        if (util.isDefined(res.error)) {
                            resultWrapper.error = res.error;
                        } else if (util.isDefined(res.result)) {
                            if (ref.type !== util.ONE_TO_MANY_REF_TYPE) {
                               resultWrapper.result = res.result[0];
                            } else {
                               resultWrapper.result = res.result;
                            }
                        } else {
                            resultWrapper.result = null;
                        }
                    }
                }
            } else {
                resultWrapper.error = (ref.targetModelName + ' repository not found');
            }
        }
    }
        
    return retval;
}
