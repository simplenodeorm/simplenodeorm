"use strict";

const Model = require('../../main/Model.js');

class Country extends Model {
    constructor(metaData) {
        super(metaData);
    }
    
    getCountryId() { return this.getFieldValue("countryId"); }
    setCountryId(value) { this.setFieldValue("countryId", value); }
    
    getCountry() { return this.getFieldValue("country"); }
    setCountry(value) { this.setFieldValue("country", value); }
    
    getLastUpdate() { return this.getFieldValue("lastUpdate"); }
    setLastUpdate(value) { this.setFieldValue("lastUpdate", value); }
}

module.exports = function(metaData) {
    return new Country(metaData);
};
