/*
 * Copyright (c) 2019  simplenodeorm.org
 */

"use strict";

const Model = require('../../../main/Model');

class Category extends Model {
    constructor(metaData) {
        super(metaData);
    }

    getCategoryId() { return this.__getFieldValue("categoryId"); }
    setCategoryId(value) { this.__setFieldValue("categoryId", value); }
    
    getName() { return this.__getFieldValue("name"); }
    setName(value) { this.__setFieldValue("name", value); }
    
    getLastUpdate() { return this.__getFieldValue("lastUpdate"); }
    setLastUpdate(value) { this.__setFieldValue("lastUpdate", value); }
}

module.exports = function(metaData) {
    return new Category(metaData);
};
