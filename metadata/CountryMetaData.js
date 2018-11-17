"use strict";

var MetaData = require('../main/MetaData.js').MetaData;

class CountryMetaData extends MetaData {
    constructor() {
        super(
        'Country', // object name,
        'model/Country.js', // relative module path,
        'COUNTRIES', // table name
        [ // field definitions - order is important,
          //selected data will be in this order, primary key fields shoud be first
            { // 0
                fieldName: "countryId",
                type: "CHAR",
                length: 2,
                columnName: "COUNTRY_ID",
                required: true,
                primaryKey: true
            },
            { // 1
                fieldName: "countryName",
                type: "VARCHAR2",
                length: 40,
                columnName: "COUNTRY_NAME"
            },
            { // 2
                fieldName: "regionId",
                type: "NUMBER",
                columnName: "REGION_ID"
            }
        ],
        [ // one-to-one definitions
            { // 0
               fieldName: "region",
               type: 1,
               targetModelName: "Region",
               targetModule: "../model/Region.js",
               targetTableName: "REGIONS",
               status: "enabled",
               required: true,
               joinColumns : {
                   sourceColumns : "REGION_ID",
                   targetColumns : "REGION_ID"
               }
            }
        ],
        [], // one-to-many definitions
        []); // many-to-one definitions

    }

    
    // load custom constraints here
    loadConstraints() {
    }
}

module.exports = function() {
    return new CountryMetaData();
};
