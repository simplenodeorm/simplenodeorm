"use strict";

const Model = require('../main/Model.js');

class Location extends Model {
    constructor(metaData) {
        super(metaData);
    }

    getLocationId() { return this.getFieldValue("locationId"); };
    setLocationId(value) { this.setFieldValue("locationId", value); };

    getStreetAddress() { return this.getFieldValue("streetAddress"); };
    setStreetAddress(value) { this.setFieldValue("streetAddress", value); };

    getPostalCode() { return this.getFieldValue("postalCode"); };
    setPostalCode(value) { this.setFieldValue("postalCode", value); };

    getCity() { return this.getFieldValue("city"); };
    setCity(value) { this.setFieldValue("city", value); };
  
    getStateProvince() { return this.getFieldValue("stateProvince"); };
    setStateProvince(value) { this.setFieldValue("stateProvince", value); };

    getCountryId() { return this.getFieldValue("countryId"); };
    setCountryId(value) { this.setFieldValue("countryId", value); };
};

module.exports = function(metaData) {
    return new Location(metaData);
};

