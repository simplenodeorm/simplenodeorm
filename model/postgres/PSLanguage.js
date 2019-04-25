"use strict";

const Model = require('../../main/Model.js');

class PSLanguage extends Model {
    constructor(metaData) {
        super(metaData);
    }
    
    getLanguageId() { return this.getFieldValue("languageId"); }
    setLanguageId(value) { this.setFieldValue("languageId", value); }
    
    getName() { return this.getFieldValue("name"); }
    setName(value) { this.setFieldValue("name", value); }
    
    getLastUpdate() { return this.getFieldValue("lastUpdate"); }
    setLastUpdate(value) { this.setFieldValue("lastUpdate", value); }
}

module.exports = function(metaData) {
    return new PSLanguage(metaData);
};
