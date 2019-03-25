"use strict";

var MetaData = require('../../main/MetaData.js').MetaData;

class CountryMetaData extends MetaData {
    constructor() {
        super(
            'Country', // object name,
            'model/mysql/Country.js', // relative module path,
            'country', // table name
            [ // field definitions - order is important,
                //selected data will be in this order, primary key fields should be first
                { // 0
                    fieldName: "countryId",
                    type: "SMALLINT UNSIGNED",
                    columnName: "country_id",
                    required: true,
                    primaryKey: true,
                    autoincrementGenerator: "LAST_INSERT_ID()"
                },
                { // 1
                    fieldName: "country",
                    type: "VARCHAR",
                    length: 50,
                    columnName: "country",
                    required: true
                },
                { // 2
                    fieldName: "lastUpdate",
                    type: "TIMESTAMP",
                    columnName: "last_update",
                    defaultValue: "CURRENT_TIMESTAMP()"
                }
            ],
            [], // one-to-one definitions
            [], // one-to-many definitions
            []); // many-to-one definitions
    }
}

module.exports = function() {
    return new CountryMetaData();
};
