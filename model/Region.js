"use strict";

const Model = require('../main/Model.js');

class Region extends Model {
    constructor(metaData) {
        super(metaData);
    }

    getRegionId() { return this.getFieldValue("regionId"); };
    setRegionId(value) { this.setFieldValue("regionId", value); };

    getRegionName() { return this.getFieldValue("regionName"); };
    setRegionName(value) { this.setFieldValue("regionName", value); };
};

module.exports = function(metaData) {
    return new Region(metaData);
};

