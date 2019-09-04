"use strict";

const Model = require('../../../main/Model');

class Language extends Model {
    constructor(metaData) {
        super(metaData);
    }
    
    getLanguageId() { return this.__getFieldValue("languageId"); }
    setLanguageId(value) { this.__setFieldValue("languageId", value); }
    
    getName() { return this.__getFieldValue("name"); }
    setName(value) { this.__setFieldValue("name", value); }
    
    getLastUpdate() { return this.__getFieldValue("lastUpdate"); }
    setLastUpdate(value) { this.__setFieldValue("lastUpdate", value); }
}

module.exports = function(metaData) {
    return new Language(metaData);
};
