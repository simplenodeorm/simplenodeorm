"use strict";

var MetaData = require('../../main/MetaData.js').MetaData;

class PSCategoryMetaData extends MetaData {
    constructor() {
        super(
            'PSCategory', // object name,
            'model/postgres/PSCategory.js', // relative module path,
            'category', // table name
            [ // field definitions - order is important,
                //selected data will be in this order, primary key fields should be first
                { // 0
                    fieldName: "categoryId",
                    type: "integer",
                    columnName: "category_id",
                    required: true,
                    primaryKey: true,
                    autoIncrementGenerator: "category_category_id_seq"
                },
                { // 1
                    fieldName: "name",
                    type: "character varying",
                    length: 25,
                    columnName: "name",
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
    return new PSCategoryMetaData();
};
