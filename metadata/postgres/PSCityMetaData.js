"use strict";

var MetaData = require('../../main/MetaData.js').MetaData;

class PSCityMetaData extends MetaData {
    constructor() {
        super(
            'PSCity', // object name,
            'model/postgres/PSCity.js', // relative module path,
            'city', // table name
            [ // field definitions - order is important,
                //selected data will be in this order, primary key fields should be first
                { // 0
                    fieldName: "cityId",
                    type: "integer",
                    columnName: "city_id",
                    required: true,
                    primaryKey: true,
                    autoIncrementGenerator: "city_city_id_seq"
                },
                { // 1
                    fieldName: "city",
                    type: "character varying",
                    length: 50,
                    columnName: "city",
                    required: true
                },
                { // 2
                    fieldName: "countryId",
                    type: "smallint",
                    columnName: "country_id",
                    required: true
                },
                { // 3
                    fieldName: "lastUpdate",
                    type: "timestamp without time zone",
                    columnName: "last_update",
                    required: true,
                    defaultValue: "now()"
                }
            ],
            [ // one-to-one definitions
                { // 0
                    fieldName: "country",
                    type: 1,
                    targetModelName: "PSCountry",
                    targetModule: "../model/postgres/PSCountry.js",
                    targetTableName: "country",
                    status: "enabled",
                    required: true,
                    joinColumns: {
                        sourceColumns: "country_id",
                        targetColumns: "country_id"
                    }
                }
            ],
            [], // one-to-many definitions
            []); // many-to-one definitions
    }
}

module.exports = function() {
    return new PSCityMetaData();
};
