"use strict";

var MetaData = require('../main/MetaData.js').MetaData;

class LocationMetaData extends MetaData {
    constructor() {
        super(
        'Location', // object name,
        'model/Location.js', // relative module path,
        'LOCATIONS', // table name
        [ // field definitions - order is important,
          //selected data will be in this order, primary key fields shoud be first
            { // 0
                fieldName: "locationId",
                type: "NUMBER(4)",
                columnName: "LOCATION_ID",
                autoIncrementGenerator: "LOCATIONS_SEQ",
                required: true,
                primaryKey: true
            },
            { // 1
                fieldName: "streetAddress",
                type: "VARCHAR2",
                length: 40,
                columnName: "STREET_ADDRESS"
            },
            { // 2
                fieldName: "postalCode",
                type: "VARCHAR2",
                length: 12,
                columnName: "POSTAL_CODE"
            },
            { // 3
                fieldName: "city",
                type: "VARCHAR2",
                length: 30,
                columnName: "CITY",
                required: true
            },
            { // 4
                fieldName: "stateProvince",
                type: "VARCHAR2",
                length: 25,
                columnName: "STATE_PROVINCE"
            },
            { // 5
                fieldName: "countryId",
                type: "CHAR",
                length: 2,
                columnName: "COUNTRY_ID"
            }
        ],
        [ // one-to-one definitions
            { // 0
               fieldName: "country",
               type: 1,
               targetModelName: "Country",
               targetModule: "../model/Country.js",
               targetTableName: "COUNTRIES",
               status: "enabled",
               joinColumns : {
                   sourceColumns : "COUNTRY_ID",
                   targetColumns : "COUNTRY_ID"
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
    return new LocationMetaData();
};
