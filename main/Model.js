"use strict";

const util = require("./util.js");
var lazyLoader;

class Model {
    constructor(metaData) {
        this.__model__ = metaData.objectName;
        this.metaData = metaData;
        this.modified = false;
        this.newModel = true;
        this.constraintsEnabled = false;
        this.data = {};
        this.initializeData();
    }

    isModified() {
        return this.modified;
    }

    setModified(modified) {
        this.modified = modified;
    }

    isNew() {
        return this.newModel;
    }

    setNew(newModel) {
        this.newModel = newModel;
    }
    
    getData() {
        return this.data;
    }

    setData(data) {
        this.data = data;
    }

    getFieldValue(fieldName, ignoreLazyLoad) {
        let retval =  this.data[fieldName];

        // only lazy load when running under node
        if (!ignoreLazyLoad 
            && util.isUndefined(retval) 
            && util.isNodeEnv() 
            && this.metaData.isLazyLoad(fieldName)) {
            if (util.isUndefined(lazyLoader)) {
                lazyLoader = require('./LazyLoader.js');
            }
            
            lazyLoader.lazyLoadData(this, fieldName);
        }
        
        return retval;
    }

    setFieldValue(fieldName, value) {
        // if constraints are enabled then check incoming data
        if (this.metaData && this.constraintsEnabled) {
            let constraints = this.metaData.getFieldConstraints(fieldName);
        
            if (util.isValidObject(constraints)) {
                for (let i = 0; i < constraints.length; ++i) {
                    constraints[i].check(this.metaData.getObjectName(), fieldName, value);
                }
            }
        }

        if (!this.modified) {
            this.modified = (this.data[fieldName] !== value);
        }
        
        this.data[fieldName] = value;
    }

    getFields() {
        return this.metaData.getFields();
    }
    
    beforeLoad() {};
    beforeSave() {};
    afterLoad() {};
    afterSave() {};
    enableConstraints(enabled) { this.constraintsEnabled = enabled; };

    addFieldConstraint(fieldName, constraint) {
        this.metaData.addFieldConstraint(fieldName, constraint);
    };

    isLengthConstraintRequired(field) {
        return this.metaData.isLengthConstraintRequired(field);
    }

    getMaxLength(field) {
        return this.metaData.getMaxLength(field);
    }
    
    getObjectName() {
        return this.metaData.getObjectName();
    }

    getTableName() {
        return this.metaData.getTableName();
    }

    getModule() {
        return this.metaData.getModule();
    }
    
    getMetaData() {
        return this.metaData;
    }

    getOneToOneDefinitions() {
        return this.metaData.getOneToOneDefinitions();
    }
    
    getOneToManyDefinitions() {
        return this.metaData.getOneToManyDefinitions();
    }

    getManyToOneDefinitions() {
        return this.metaData.getManyToOneDefinitions();
    }

    initializeData() {
        // initialize related reference fields to undefined for
        // lazy load check later
        let reldefs = this.metaData.getOneToOneDefinitions();
        if (util.isValidObject(reldefs)) {
            for (let i = 0; i < reldefs.length; ++i) {
                this.data[reldefs[i].fieldName] = undefined;
            }
        }

        reldefs = this.metaData.getOneToManyDefinitions();
        if (util.isValidObject(reldefs)) {
            for (let i = 0; i < reldefs.length; ++i) {
                this.data[reldefs[i].fieldName] = undefined;
            }
        }
        
        reldefs = this.metaData.getManyToOneDefinitions();
        if (util.isValidObject(reldefs)) {
            for (let i = 0; i < reldefs.length; ++i) {
                this.data[reldefs[i].fieldName] = undefined;
            }
        }
        
        let fields = this.metaData.getFields();
        for (let i = 0; i < fields.length; ++i) {
            if (fields[i].lazyLoad) {
                this.data[fields[i].fieldName] = undefined;
            }
        }
    }
}

module.exports = Model;
