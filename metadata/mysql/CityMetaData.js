"use strict";

var MetaData = require('../../main/MetaData.js').MetaData;

class CityMetaData extends MetaData {
    constructor() {
        super(
            'City', // object name,
            'model/mysql/City.js', // relative module path,
            'city', // table name
            [ // field definitions - order is important,
                //selected data will be in this order, primary key fields should be first
                { // 0
                    fieldName: "cityId",
                    type: "SMALLINT UNSIGNED",
                    columnName: "city_id",
                    required: true,
                    primaryKey: true,
                    autoincrementGenerator: "LAST_INSERT_ID()"
                },
                { // 1
                    fieldName: "city",
                    type: "VARCHAR",
                    length: 50,
                    columnName: "city",
                    required: true
                },
                { // 2
                    fieldName: "countryId",
                    type: "SMALLINT UNSIGNED",
                    columnName: "country_id",
                    required: true
                },
                { // 3
                    fieldName: "lastUpdate",
                    type: "TIMESTAMP",
                    columnName: "last_update",
                    required: true,
                    defaultValue: "CURRENT_TIMESTAMP()"
                }
            ],
            [ // one-to-one definitions
                { // 0
                    fieldName: "country",
                    type: 1,
                    targetModelName: "Country",
                    targetModule: "../model/mysql/Country.js",
                    targetTableName: "country",
                    status: "enabled",
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