"use strict";

var MetaData = require('../../main/MetaData.js').MetaData;

class PSFilmCategoryMetaData extends MetaData {
    constructor() {
        super(
            'PSFilmCategory', // object name,
            'model/postgres/PSFilmCategory.js', // relative module path,
            'film_category', // table name
            [ // field definitions - order is important,
                //selected data will be in this order, primary key fields should be first
                { // 0
                    fieldName: "filmId",
                    type: "smallint",
                    columnName: "film_id",
                    required: true,
                    primaryKey: true
                },
                { // 1
                    fieldName: "categoryId",
                    type: "smallint",
                    columnName: "category_id",
                    required: true,
                    primaryKey: true
                },
                { // 2
                    fieldName: "lastUpdate",
                    type: "timestamp without time zone",
                    columnName: "last_update",
                    required: true,
                    defaultValue: "now()"
                }
            ],
            [ // one-to-one definitions
                { // 0
                    fieldName: "category",
                    type: 1,
                    targetModelName: "PSCategory",
                    targetModule: "../model/postgres/PSCategory.js",
                    targetTableName: "category",
                    status: "enabled",
                    required: true,
                    joinColumns: {
                        sourceColumns: "category_id",
                        targetColumns: "category_id"
                    }
                }
            ],
            [
                { // 0
                    fieldName: "films",
                    type: 2,
                    targetModelName: "PSFilm",
                    targetModule: "../model/postgres/PSFilm.js",
                    targetTableName: "film",
                    status: "enabled",
                    joinColumns: {
                        sourceColumns: "film_id",
                        targetColumns: "film_id"
                    }
                }
            ], // one-to-many definitions
            []); // many-to-one definitions
    
    }
}

module.exports = function() {
    return new PSFilmCategoryMetaData();
};
