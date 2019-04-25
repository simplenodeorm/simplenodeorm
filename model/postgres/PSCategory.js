"use strict";

const Model = require('../../main/Model.js');

class PSCategory extends Model {
    constructor(metaData) {
        super(metaData);
    }

    getCategoryId() { return this.getFieldValue("categoryId"); }
    setCategoryId(value) { this.setFieldValue("categoryId", value); }
    
    getName() { return this.getFieldValue("name"); }
    setName(value) { this.setFieldValue("name", value); }
    
    getLastUpdate() { return this.getFieldValue("lastUpdate"); }
    setLastUpdate(value) { this.setFieldValue("lastUpdate", value); }
}

module.exports = function(metaData) {
    return new PSCategory(metaData);
};
