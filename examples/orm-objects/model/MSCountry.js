/*
 * Copyright (c) 2019  simplenodeorm.org
 */

"use strict";

const Model = require('../../../main/Model');

class MSCountry extends Model {
    constructor(metaData) {
        super(metaData);
    }
    
    getCountryId() { return this.__getFieldValue("countryId"); }
    setCountryId(value) { this.__setFieldValue("countryId", value); }
    
    getCountry() { return this.__getFieldValue("country"); }
    setCountry(value) { this.__setFieldValue("country", value); }
    
    getLastUpdate() { return this.__getFieldValue("lastUpdate"); }
    setLastUpdate(value) { this.__setFieldValue("lastUpdate", value); }
}

module.exports = function(metaData) {
    return new MSCountry(metaData);
};
