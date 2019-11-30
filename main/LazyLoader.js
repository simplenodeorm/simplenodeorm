/*
 * Copyright (c) 2019  simplenodeorm.org
 */

const orm = require('../orm.js');
const util = require('./util.js');

module.exports.lazyLoadData = async function (model, fieldName) {
    if (orm.logger.isLogDebugEnabled()) {
        orm.logger.logDebug("lazyLoadData: " + JSON.stringify(model));
    }

    let result = await loadData(model, fieldName);

    if (result && result.error) {
        util.throwError('LazyLoadError', result.error);
    }

    return result;
};

async function loadData(model, fieldName) {
    let retval = null;
    let md = model.__getMetaData();
    let ref = md.getReferenceDefinition(fieldName);
    if (util.isDefined(ref)) {
        let refrepo = orm.getRepository(ref.targetModelName);
        if (util.isDefined(refrepo)) {
            let srccols = ref.joinColumns.sourceColumns.split(',');
            let tgtcols = ref.joinColumns.targetColumns.split(',');
            let criteria = [];
            if (srccols.length === tgtcols.length) {
                for (let i = 0; i < srccols.length; ++i) {
                    let fnm = md.getFieldNameFromColumnName(srccols[i]);

                    if (util.isDefined(fnm)) {
                        let srcval = await model.__getFieldValue(fnm);
                        criteria.push(require('./WhereComparison.js')(refrepo.getMetaData().getFieldNameFromColumnName(tgtcols[i]), srcval, util.EQUAL_TO));
                    }
                }

                let res = await refrepo.find(criteria, [], {poolAlias: model.__poolAlias__, joinDepth: 0});
                if (util.isDefined(res.error)) {
                    result = res;
                } else if (util.isDefined(res.result)) {
                    if (ref.type !== util.ONE_TO_MANY_REF_TYPE) {
                       retval = res.result[0];
                    } else {
                       retval = res.result;
                    }
                }
            }
        } else {
            retval = {error: ref.targetModelName + ' repository not found'};
        }
    }
        
    return retval;
}
