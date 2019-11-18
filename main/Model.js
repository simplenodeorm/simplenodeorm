/*
 * Copyright (c) 2019  simplenodeorm.org
 */

"use strict";

const util = require("./util.js");
var lazyLoader;

class Model {
    constructor(metaData) {
        this.__model__ = metaData.objectName;
        this.__metaData__ = metaData;
        this.__modified__ = false;
        this.__new__ = true;
        this.__constraintsEnabled__ = false;
        this.__initializeData();
    }

    __isModified() {
        return this.__modified__;
    }

    __setModified(modified) {
        this.__modified__ = modified;
    }

    __isNew() {
        return this.__new__;
    }

    __setNew(newModel) {
        this.__new__ = newModel;
    }
    
    __getFieldValue(fieldName, ignoreLazyLoad) {
        let retval =  this[fieldName];

        // only lazy load when running under node
        if (!ignoreLazyLoad && this.lazyLoadRequired(fieldName)) {
            if (util.isUndefined(lazyLoader)) {
                lazyLoader = require('./LazyLoader.js');
            }
            
            lazyLoader.lazyLoadData(this, fieldName);
        }
        
        return retval;
    }

    lazyLoadRequired(fieldName) {
        return (util.isUndefined(this[fieldName])
        && util.isNodeEnv()
        && this.__metaData__.isLazyLoad(fieldName));
    }

    __setFieldValue(fieldName, value) {
        // if constraints are enabled then check incoming data

        if (this.__metaData__ && this.__constraintsEnabled__) {
            let constraints = this.__metaData__.getFieldConstraints(fieldName);

            if (util.isValidObject(constraints)) {
                for (let i = 0; i < constraints.length; ++i) {
                    constraints[i].check(this.__metaData__.getObjectName(), fieldName, value);
                }
            }
        }

        if (!this.__modified__) {
            this.__modified__ = (this[fieldName] !== value);
        }

        this[fieldName] = value;
    }

    __beforeLoad() {};
    __beforeSave() {};
    __afterLoad() {};
    __afterSave() {};

    __enableConstraints(enabled) { this.__constraintsEnabled__ = enabled; };

    __getMetaData() {
        return this.__metaData__;
    }

    __setMetaData(metaData) {
        return this.__metaData__ = metaData;
    }

    __initializeData() {
        // initialize related reference fields to undefined for
        // lazy load check later
        let reldefs = this.__metaData__.getOneToOneDefinitions();
        if (util.isValidObject(reldefs)) {
            for (let i = 0; i < reldefs.length; ++i) {
                this[reldefs[i].fieldName] = undefined;
            }
        }

        reldefs = this.__metaData__.getOneToManyDefinitions();
        if (util.isValidObject(reldefs)) {
            for (let i = 0; i < reldefs.length; ++i) {
                this[reldefs[i].fieldName] = undefined;
            }
        }
        
        reldefs = this.__metaData__.getManyToManyDefinitions();
        if (util.isValidObject(reldefs)) {
            for (let i = 0; i < reldefs.length; ++i) {
                this[reldefs[i].fieldName] = undefined;
            }
        }
        
        let fields = this.__metaData__.fields;
        for (let i = 0; i < fields.length; ++i) {
            if (fields[i].lazyLoad) {
                this[fields[i].fieldName] = undefined;
            }
        }
    }
}

module.exports = Model;
