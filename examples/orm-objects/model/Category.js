/*
 * Copyright (c) 2019  simplenodeorm.org
 */

"use strict";

const Model = require('../../../main/Model');

class Category extends Model {
    constructor(metaData) {
        super(metaData);
    }

    async getCategoryId() { return await this.__getFieldValue("categoryId"); }
    setCategoryId(value) { this.__setFieldValue("categoryId", value); }

    async getName() { return await this.__getFieldValue("name"); }
    setName(value) { this.__setFieldValue("name", value); }

    async getLastUpdate() { return await this.__getFieldValue("lastUpdate"); }
    setLastUpdate(value) { this.__setFieldValue("lastUpdate", value); }
}

module.exports = function(metaData) {
    return new Category(metaData);
};
