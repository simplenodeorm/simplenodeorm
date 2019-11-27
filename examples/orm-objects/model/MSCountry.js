/*
 * Copyright (c) 2019  simplenodeorm.org
 */

"use strict";

const Model = require('../../../main/Model');

class MSCountry extends Model {
    constructor(metaData) {
        super(metaData);
    }

    async getCountryId() { return await this.__getFieldValue("countryId"); }
    setCountryId(value) { this.__setFieldValue("countryId", value); }

    async getCountry() { return await this.__getFieldValue("country"); }
    setCountry(value) { this.__setFieldValue("country", value); }

    async getLastUpdate() { return await this.__getFieldValue("lastUpdate"); }
    setLastUpdate(value) { this.__setFieldValue("lastUpdate", value); }
}

module.exports = function(metaData) {
    return new MSCountry(metaData);
};
