"use strict";

var MetaData = require('../../main/MetaData.js').MetaData;

class PSCountryMetaData extends MetaData {
    constructor() {
        super(
            'PSCountry', // object name,
            'model/postgres/PSCountry.js', // relative module path,
            'country', // table name
            [ // field definitions - order is important,
                //selected data will be in this order, primary key fields should be first
                { // 0
                    fieldName: "countryId",
                    type: "integer",
                    columnName: "country_id",
                    required: true,
                    primaryKey: true,
                    autoIncrementGenerator: "country_country_id_seq"
                },
                { // 1
                    fieldName: "country",
                    type: "character varying",
                    length: 50,
                    columnName: "country",
                    required: true
                },
                { // 2
                    fieldName: "lastUpdate",
                    type: "timestamp without time zone",
                    columnName: "last_update",
                    defaultValue: "now()"
                }
            ],
            [], // one-to-one definitions
            [], // one-to-many definitions
            []); // many-to-one definitions
    }
}

module.exports = function() {
    return new PSCountryMetaData();
};
