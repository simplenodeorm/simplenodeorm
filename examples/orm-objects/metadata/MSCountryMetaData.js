/*
 * Copyright (c) 2019  simplenodeorm.org
 */

"use strict";

let MetaData = require('../../../main/MetaData').MetaData;

class MSCountryMetaData extends MetaData {
    constructor() {
        super(
            'MSCountry', // object name,
            'model/MSCountry.js', // relative module path,
            'country', // table name
            [ // field definitions - order is important,
                //selected data will be in this order, primary key fields should be first
                { // 0
                    fieldName: "countryId",
                    type: "SMALLINT UNSIGNED",
                    columnName: "country_id",
                    required: true,
                    primaryKey: true,
                    autoIncrementGenerator: "LAST_INSERT_ID()"
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
            []); // many-to-many definitions
    }
}

module.exports = function() {
    return new MSCountryMetaData();
};
