"use strict";

var MetaData = require('../../main/MetaData.js').MetaData;

class PSLanguageMetaData extends MetaData {
    constructor() {
        super(
            'PSLanguage', // object name,
            'model/postgres/PSLanguage.js', // relative module path,
            'language', // table name
            [ // field definitions - order is important,
                //selected data will be in this order, primary key fields should be first
                { // 0
                    fieldName: "languageId",
                    type: "integer",
                    columnName: "language_id",
                    required: true,
                    primaryKey: true,
                    autoIncrementGenerator: "language_language_id_seq"
                },
                { // 1
                    fieldName: "name",
                    type: "character",
                    length: 20,
                    columnName: "name",
                    required: true
                },
                { // 2
                    fieldName: "lastUpdate",
                    type: "timestamp without time zone ",
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
    return new PSLanguageMetaData();
};

