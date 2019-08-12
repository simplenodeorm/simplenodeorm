"use strict";

let MetaData = require('@simplenodeorm/simplenodeorm/main/MetaData').MetaData;

class CategoryMetaData extends MetaData {
    constructor() {
        super(
            'Category', // object name,
            'model/Category.js', // relative module path,
            'category', // table name
            [ // field definitions - order is important,
                //selected data will be in this order, primary key fields should be first
                { // 0
                    fieldName: "categoryId",
                    type: "SMALLINT UNSIGNED",
                    columnName: "category_id",
                    required: true,
                    primaryKey: true,
                    autoIncrementGenerator: "LAST_INSERT_ID()"
                },
                { // 1
                    fieldName: "name",
                    type: "VARCHAR",
                    length: 25,
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
    return new CategoryMetaData();
};
