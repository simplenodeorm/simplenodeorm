"use strict";

const Model = require('../../../main/Model');

class City extends Model {
    constructor(metaData) {
        super(metaData);
    }
    
    getCityId() { return this.__getFieldValue("cityId"); }
    setCityId(value) { this.__setFieldValue("cityId", value); }
    
    getCity() { return this.__getFieldValue("city"); }
    setCity(value) { this.__setFieldValue("city", value); }
    
    getCountryId() { return this.__getFieldValue("countryId"); }
    setCountryId(value) { this.__setFieldValue("countryId", value); }
    
    getLastUpdate() { return this.__getFieldValue("lastUpdate"); }
    setLastUpdate(value) { this.__setFieldValue("lastUpdate", value); }

    getCountry() { return this.__getFieldValue("country"); }
    setCountry(value) { this.__setFieldValue("country", value); }
}

module.exports = function(metaData) {
    return new City(metaData);
};
