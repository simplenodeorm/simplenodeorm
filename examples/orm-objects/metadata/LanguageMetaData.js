"use strict";

let MetaData = require('@simplenodeorm/simplenodeorm/main/MetaData').MetaData;

class LanguageMetaData extends MetaData {
    constructor() {
        super(
            'Language', // object name,
            'model/Language.js', // relative module path,
            'language', // table name
            [ // field definitions - order is important,
                //selected data will be in this order, primary key fields should be first
                { // 0
                    fieldName: "languageId",
                    type: "TINYINT UNSIGNED",
                    columnName: "language_id",
                    required: true,
                    primaryKey: true,
                    autoIncrementGenerator: "LAST_INSERT_ID()"
                },
                { // 1
                    fieldName: "name",
                    type: "VARCHAR",
                    length: 20,
                    columnName: "name",
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
    return new LanguageMetaData();
};

