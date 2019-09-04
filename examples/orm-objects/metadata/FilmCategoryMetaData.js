"use strict";

let MetaData = require('../../../main/MetaData').MetaData;

class FilmCategoryMetaData extends MetaData {
    constructor() {
        super(
            'FilmCategory', // object name,
            'model/FilmCategory.js', // relative module path,
            'film_category', // table name
            [ // field definitions - order is important,
                //selected data will be in this order, primary key fields should be first
                { // 0
                    fieldName: "filmId",
                    type: "SMALLINT UNSIGNED",
                    columnName: "film_id",
                    required: true,
                    primaryKey: true
                },
                { // 1
                    fieldName: "categoryId",
                    type: "SMALLINT UNSIGNED",
                    columnName: "category_id",
                    required: true,
                    primaryKey: true
                },
                { // 2
                    fieldName: "lastUpdate",
                    type: "TIMESTAMP",
                    columnName: "last_update",
                    required: true,
                    defaultValue: "CURRENT_TIMESTAMP()"
                }
            ],
            [ // one-to-one definitions
                { // 0
                    fieldName: "category",
                    type: 1,
                    targetModelName: "Category",
                    targetModule: "model/Category.js",
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
                    targetModelName: "Film",
                    targetModule: "model/Film.js",
                    targetTableName: "film",
                    status: "enabled",
                    joinColumns: {
                        sourceColumns: "film_id",
                        targetColumns: "film_id"
                    }
                }
            ], // one-to-many definitions
            []); // many-to-many definitions
    
    }
}

module.exports = function() {
    return new FilmCategoryMetaData();
};
