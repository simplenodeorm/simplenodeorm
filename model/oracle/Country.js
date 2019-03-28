"use strict";

const Model = require('../../main/Model.js');

class Country extends Model {
    constructor(metaData) {
        super(metaData);
    }

    getCountryId() { return this.getFieldValue("countryId"); };
    setCountryId(value) { this.setFieldValue("countryId", value); };

    getCountryName() { return this.getFieldValue("countryName"); };
    setCountryName(value) { this.setFieldValue("countryName", value); };

    getRegionId() { return this.getFieldValue("regionId"); };
    setRegionId(value) { this.setFieldValue("regionId", value); };

    getRegion() { return this.getFieldValue("region"); };
    setRegion(value) { this.setFieldValue("region", value); };
}

module.exports = function(metaData) {
    return new Country(metaData);
};

