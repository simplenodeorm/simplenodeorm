"use strict";

const PK_VALUE_SEPARATOR = '^';
const FIND_ONE = 'findOne';
const FIND = 'find';
const COUNT = 'count';
const GET_ALL = 'getAll';
const EXISTS = 'exists';
const SAVE = 'save';
const DELETE = 'delete';
const FIND_ONE_SYNC = 'findOneSync';
const FIND_SYNC = 'findSync';
const COUNT_SYNC = 'countSync';
const GET_ALL_SYNC = 'getAllSync';
const EXISTS_SYNC = 'existsSync';
const SAVE_SYNC = 'saveSync';
const DELETE_SYNC = 'deleteSync';

const ENABLED = "enabled";
const DISABLED = "disabled";
const LAZY_LOAD = "lazy";

const NOT_IMPLEMENTED = 'not implemented';
const NODATA = 'nodata';

const EQUAL_TO = '=';
const GREATER_THAN = '>';
const LESS_THAN = '<';
const LEES_THAN_OR_EQ = '<=';
const GREATER_THAN_OR_EQ = '>';
const NOT_EQUAL = '<>';
const LIKE = 'like';
const IN = 'in';
const NOT_NULL = 'is not null';
const NULL = 'is null';
const AND = 'and';
const OR = 'or';

const DATE_TYPE = 'DATE';
const DATETIME_TYPE = 'DATETIME';
const TIMESTAMP_TYPE = 'TIMESTAMP'; 

const ERROR = 'error';
const WARN = 'warning';
const INFO = 'info';
const DEBUG = 'debug';

const ORACLE = 'oracle';
const MYSQL = 'mysql';
const ONE_TO_ONE_REF_TYPE = 1;
const ONE_TO_MANY_REF_TYPE = 2;
const MANY_TO_ONE_REF_TYPE = 3;


module.exports.ERROR = ERROR;
module.exports.WARN = WARN;
module.exports.INFO = INFO;
module.exports.DEBUG = DEBUG;

// used for key string in composite primary key logic
module.exports.PK_VALUE_SEPARATOR = PK_VALUE_SEPARATOR;

// default set of db operation names
module.exports.FIND_ONE = FIND_ONE;
module.exports.FIND = FIND;
module.exports.COUNT = COUNT;
module.exports.GET_ALL = GET_ALL;
module.exports.EXISTS = EXISTS;
module.exports.SAVE = SAVE;
module.exports.DELETE = DELETE;
module.exports.FIND_ONE_SYNC = FIND_ONE_SYNC;
module.exports.FIND_SYNC = FIND_SYNC;
module.exports.COUNT_SYNC = COUNT_SYNC;
module.exports.GET_ALL_SYNC = GET_ALL_SYNC;
module.exports.EXISTS_SYNC = EXISTS_SYNC;
module.exports.SAVE_SYNC = SAVE_SYNC;
module.exports.DELETE_SYNC = DELETE_SYNC;
module.exports.ENABLED = ENABLED;
module.exports.DISABLED = DISABLED;
module.exports.LAZY_LOAD = LAZY_LOAD;
module.exports.NOT_IMPLEMENTED = NOT_IMPLEMENTED;
module.exports.EQUAL_TO = EQUAL_TO;
module.exports.GREATER_THAN = GREATER_THAN;
module.exports.LESS_THAN = LESS_THAN;
module.exports.LEES_THAN_OR_EQ = LEES_THAN_OR_EQ;
module.exports.GREATER_THAN_OR_EQ = GREATER_THAN_OR_EQ;
module.exports.NOT_EQUAL = NOT_EQUAL;
module.exports.LIKE = LIKE;
module.exports.IN = IN;
module.exports.NOT_NULL = NOT_NULL;
module.exports.NULL = NULL;
module.exports.AND = AND;
module.exports.OR = OR;
module.exports.NODATA = NODATA;
module.exports.DATE_TYPE = DATE_TYPE;
module.exports.DATETIME_TYPE = DATETIME_TYPE;
module.exports.TIMESTAMP_TYPE = TIMESTAMP_TYPE; 


module.exports.ORACLE = ORACLE;
module.exports.MYSQL = MYSQL;

module.exports.ONE_TO_ONE_REF_TYPE = ONE_TO_ONE_REF_TYPE;
module.exports.ONE_TO_MANY_REF_TYPE = ONE_TO_MANY_REF_TYPE;
module.exports.MANY_TO_ONE_REF_TYPE = MANY_TO_ONE_REF_TYPE;

module.exports.toString = function(inputObject, replacer) {
    return JSON.stringify(inputObject, replacer);
};


module.exports.toDataTransferString = function(inputObject) {
    return this.toString(inputObject, this.modelJSONReplacer);
};

module.exports.toGetter = function(fieldName) {
    return ('get' + fieldName.substring(0, 1).toUpperCase() + fieldName.substring(1));
};

module.exports.toSetter = function(fieldName) {
    return ('set' + fieldName.substring(0, 1).toUpperCase() + fieldName.substring(1));
};

module.exports.throwError = function(ename, emessage) {
    let err;
    if (this.isString(emessage)) {
        err = new Error(emessage);
    } else {
        err = new Error(this.toString(err));
    }
    
    err.name = ename;
    err.type = 'Error';
    Error.captureStackTrace(err);
    throw err;
};

module.exports.throwWarning = function(ename, emessage) {
    let err;
    if (emessage instanceof String) {
        err = new Error(emessage);
    } else {
        err = new Error(this.toString(err));
    }
    
    err.name = ename;
    err.type = 'Warning';
    Error.captureStackTrace(err);
    throw err;
};


function isUndefined(obj) {
    return (typeof(obj) === 'undefined');
};

module.exports.isUndefined = isUndefined;

function isDefined(obj) {
    return !isUndefined(obj);
};

module.exports.isDefined = isDefined;

module.exports.modelJSONReplacer = function(key, value) {
    switch(key) {
        case 'metaData':
            return undefined;
        default:
            return value;
    }
};

module.exports.jsonToModel = function (json, orm) {
    return JSON.parse(json, function (key, value) {
        if (isDefined(value.__model__) && isUndefined(value.getFieldValue)) {
            let md = orm.getMetaData(value.__model__);
            let m = require('../' + md.getModule())(md);
            return Object.assign(m, value);
        } else {
            return value;
        }
    });
};



module.exports.isAlphaNumeric = function(ch) {
  return /^[a-z0-9]+$/i.test(ch);
};

module.exports.isString = function(input) {
    return (this.isDefined(input) && (typeof input === 'string'));
};

module.exports.isNumber = function(input) {
    return (this.isDefined(input) && (typeof input === 'number'));
};

module.exports.isNodeEnv = function() {
    return ((typeof process !== 'undefined') && (process.release.name === 'node'));
};

module.exports.isValidObject = function(obj) {
    return (this.isDefined(obj) && (obj !== null));
};

module.exports.isNotValidObject = function(obj) {
    return !this.isValidObject(obj);
};

module.exports.isNumber = function(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
};

module.exports.isUnaryOperator = function(op) {
    return (op && ((op === 'is null') || (op === 'is not null'))); 
};


module.exports.designJSONReplacer = function(key, value) {
    switch(key) {
        case 'relationships':
            if (util.isDefined(value) && (value.length > 0)) {
                return value;
            } else {
                return undefined;
            }
        case 'module':
        case 'fieldConstraints':
        case 'lazyLoadFields':
        case 'converter':
        case 'defaultValue':
        case 'autoIncrementGenerator':
        case 'oneToManyDefinitions':
        case 'oneToOneDefinitions':
        case 'manyToOneDefinitions':
            return undefined;
        default:
            return value;
    }
};

module.exports.isQuoteRequired = function(field) {
    return !field.type.includes('NUMBER');
};