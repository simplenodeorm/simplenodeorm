"use strict";

const util = require("./util.js");

/**
 * this is the base class for defing the sql to object mapping definitions
 */
class MetaData {
    constructor(
        objectName, 
        module, 
        tableName, 
        fields, 
        oneToOneDefinitions,
        oneToManyDefinitions, 
        manyToOneDefinitions) {
        this.objectName = objectName; 
        this.module = module; 
        this.tableName = tableName; 
        this.fields = fields; 
        this.oneToOneDefinitions = oneToOneDefinitions;
        this.oneToManyDefinitions = oneToManyDefinitions;
        this.manyToOneDefinitions = manyToOneDefinitions;
        this.fieldConstraints = new Map();
        this.lazyLoadFields = new Set();
        
        // map of column name to field definitions
        this.columnToFieldMap = new Map();
        
        // map of field name to field definitions
        this.fieldMap = new Map();
        
        // map of field name to field definitions
        this.referenceMap = new Map();

        // add some default constraints - will be disabled by default in the model object
        for (let i = 0; i < fields.length; ++i) {
            if (fields[i].lazyLoad) {
                this.lazyLoadFields.add(fields[i].fieldName);
            }
            
            this.columnToFieldMap.set(fields[i].columnName, fields[i]);
            this.fieldMap.set(fields[i].fieldName, fields[i]);
            if (fields[i].required) {
                let l = null;
                if (!this.fieldConstraints.has(fields[i].fieldName)) {
                    l = [];
                    this.fieldConstraints.set(fields[i].fieldName, l);
                } else {
                    l = this.fieldConstraints.get(fields[i].fieldName);
                }
                l.push(new (require("../constraints/NotNullConstraint.js")));
            }

            if (this.isLengthConstraintRequired(fields[i])) {
                let l = null;
                if (!this.fieldConstraints.has(fields[i].fieldName)) {
                    l = [];
                    this.fieldConstraints.set(fields[i].fieldName, l);
                } else {
                    l = this.fieldConstraints.get(fields[i].fieldName);
                }
                l.push(new (require("../constraints/LengthConstraint.js"))(this.getMaxLength(fields[i])));
            }
            
            // add ref fields to lazy load set
            for (let i = 0; i < this.oneToOneDefinitions.length; ++i) {
                this.lazyLoadFields.add(this.oneToOneDefinitions[i].fieldName);
                this.referenceMap.set(this.oneToOneDefinitions[i].fieldName, this.oneToOneDefinitions[i]);
            }

            for (let i = 0; i < this.oneToManyDefinitions.length; ++i) {
                this.lazyLoadFields.add(this.oneToManyDefinitions[i].fieldName);
                this.referenceMap.set(this.oneToManyDefinitions[i].fieldName, this.oneToManyDefinitions[i]);
            }

            for (let i = 0; i < this.manyToOneDefinitions.length; ++i) {
                this.lazyLoadFields.add(this.manyToOneDefinitions[i].fieldName);
                this.referenceMap.set(this.manyToOneDefinitions[i].fieldName, this.manyToOneDefinitions[i]);
            }
            
            this.loadConstraints();
        }
    }
    
    /**
     * 
     * @returns ordered array of primary key field definitions
     */
    getPrimaryKeyFields() {
        let retval = [];
        for (let i = 0; i < this.fields.length; i++) {
            if (this.fields[i].primaryKey) {
                retval.push(this.fields[i]);
            }
        } 
        return retval;
    }

    getFieldConstraints(fieldName) {
        return this.fieldConstraints.get(fieldName);
    }

    addFieldConstraint(fieldName, constraint) {
        let len = 0;
        if (util.isNotValidObject(this.fieldConstraints.get(fieldName))) {
            this.fieldConstraints.set(fieldName, {});
        } else {
            len = this.fieldConstraints.get(fieldName).length;
        }
        this.fieldConstraints.get(fieldName)[len] = constraint;
    }

    isLengthConstraintRequired(field) {
        return (util.isValidObject(field.length) && (field.length > 0));
    }

    getMaxLength(field) {
        return field.length;
    }
    
    getOneToOneDefinitions() {
        return this.oneToOneDefinitions;
    }

    getOneToManyDefinitions() {
        return this.oneToManyDefinitions;
    }
    
    getManyToOneDefinitions() {
        return this.manyToOneDefinitions;
    }

    getFields() {
        return this.fields;
    }
    
    getObjectName() {
        return this.objectName;
    }

    getTableName() {
        return this.tableName;
    }

    getModule() {
        return this.module;
    }
    
    getColumnToFieldMap() {
        return this.columnToFieldMap;
    }

    getFieldMap() {
        return this.fieldMap;
    }
    
    getReferenceMap() {
        return this.referenceMap;
    }
    
    getField(fieldName) {
        return this.fieldMap.get(fieldName);
    }

    getReferenceDefinition(fieldName) {
        return this.referenceMap.get(fieldName);
    }

    isLazyLoad(fieldName) {
        return this.lazyLoadFields.has(fieldName);
    }
    
    getFieldNameFromColumnName(columnName) {
        let retval;
        let fld = this.columnToFieldMap.get(columnName);
        
        if (util.isValidObject(fld)) {
            retval = fld.fieldName;
        }
        
        return retval;
    }
    
    isVersioned() {
        return util.isDefined(this.getVersionField());
    }

    getVersionFieldName() {
        let retval;
        let field =  this.getVersionField();
        
        if (util.isDefined(field)) {
            retval = field.fieldName;
        }
        
        return retval;
    }
    
    getVersionField() {
        let retval;
        
        for (let i = 0; i < this.fields.length; ++i) {
            if (this.fields[i].versionColumn) {
                retval = this.fields[i];
                break;
            }
        }
        
        return retval;
    }
    
    loadConstraints() {};

    findRelationshipByName(nm) {
        let retval;
        let def = this.getOneToOneDefinitions();
        if (util.isValidObject(def)) {
            for (let i = 0; i < def.length; ++i) {
                if (nm === def[i].fieldName) {
                    retval = def[i];
                    break;
                }
            }
        }

        if (util.isUndefined(retval)) {
            def = this.getOneToManyDefinitions();
            if (util.isValidObject(def)) {
                for (let i = 0; i < def.length; ++i) {
                    if (nm === def[i].fieldName) {
                        retval = def[i];
                        break;
                    }
                }
            }
        }

        if (util.isUndefined(retval)) {
            def = this.getManyToOneDefinitions();
            if (util.isValidObject(def)) {
                for (let i = 0; i < def.length; ++i) {
                    if (nm === def[i].fieldName) {
                        retval = def[i];
                        break;
                    }
                }
            }
        }
    
        logger.logInfo('-------------------->4=' + retval);
        return retval;
    }
}

module.exports.MetaData = MetaData;


