"use strict";

const Model = require('../../../main/Model');

class City extends Model {
    constructor(metaData) {
        super(metaData);
    }
    
    getCityId() { return this.getFieldValue("cityId"); }
    setCityId(value) { this.setFieldValue("cityId", value); }
    
    getCity() { return this.getFieldValue("city"); }
    setCity(value) { this.setFieldValue("city", value); }
    
    getCountryId() { return this.getFieldValue("countryId"); }
    setCountryId(value) { this.setFieldValue("countryId", value); }
    
    getLastUpdate() { return this.getFieldValue("lastUpdate"); }
    setLastUpdate(value) { this.setFieldValue("lastUpdate", value); }

    getCountry() { return this.getFieldValue("country"); }
    setCountry(value) { this.setFieldValue("country", value); }
}

module.exports = function(metaData) {
    return new City(metaData);
};
