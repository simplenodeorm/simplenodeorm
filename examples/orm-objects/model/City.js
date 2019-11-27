/*
 * Copyright (c) 2019  simplenodeorm.org
 */

"use strict";

const Model = require('../../../main/Model');

class City extends Model {
    constructor(metaData) {
        super(metaData);
    }

    async getCityId() { return await this.__getFieldValue("cityId"); }
    setCityId(value) { this.__setFieldValue("cityId", value); }

    async getCity() { return await this.__getFieldValue("city"); }
    setCity(value) { this.__setFieldValue("city", value); }

    async getCountryId() { return await this.__getFieldValue("countryId"); }
    setCountryId(value) { this.__setFieldValue("countryId", value); }

    async getLastUpdate() { return await this.__getFieldValue("lastUpdate"); }
    setLastUpdate(value) { this.__setFieldValue("lastUpdate", value); }

    async getCountry() { return await this.__getFieldValue("country"); }
    setCountry(value) { this.__setFieldValue("country", value); }
}

module.exports = function(metaData) {
    return new City(metaData);
};
