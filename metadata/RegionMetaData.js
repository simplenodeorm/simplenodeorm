"use strict";

var MetaData = require('../main/MetaData.js').MetaData;

class RegionMetaData extends MetaData {
    constructor() {
        super(
        'Region', // object name,
        'model/Region.js', // relative module path,
        'REGIONS', // table name
        [ // field definitions - order is important,
          //selected data will be in this order, primary key fields shoud be first
            { // 0
                fieldName: "regionId",
                type: "NUMBER",
                columnName: "REGION_ID",
                required: true,
                primaryKey: true
            },
            { // 1
                fieldName: "regionName",
                type: "VARCHAR2",
                length: 25,
                columnName: "REGION_NAME"
            }
        ],
        [], // one-to-one definitions
        [], // one-to-many definitions
        []); // many-to-one definitions

    }

    
    // load custom constraints here
    loadConstraints() {
    }
}

module.exports = function() {
    return new RegionMetaData();
};
