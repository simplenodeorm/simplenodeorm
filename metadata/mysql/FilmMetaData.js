"use strict";

var MetaData = require('../../main/MetaData.js').MetaData;

class FilmMetaData extends MetaData {
    constructor() {
        super(
            'Film', // object name,
            'model/mysql/Film.js', // relative module path,
            'film', // table name
            [ // field definitions - order is important,
                //selected data will be in this order, primary key fields should be first
                { // 0
                    fieldName: "filmId",
                    type: "SMALLINT UNSIGNED",
                    columnName: "film_id",
                    required: true,
                    primaryKey: true,
                    autoIncrementGenerator: "LAST_INSERT_ID()"
                },
                { // 1
                    fieldName: "title",
                    type: "VARCHAR",
                    length: 255,
                    columnName: "title",
                    required: true
                },
                { // 2
                    fieldName: "description",
                    type: "TEXT",
                    lob: true,
                    columnName: "description"
                },
                { // 3
                    fieldName: "releaseYear",
                    type: "YEAR",
                    columnName: "release_year"
                },
                { // 4
                    fieldName: "languageId",
                    type: "TINYINT UNSIGNED",
                    columnName: "language_id",
                    required: true
                },
                { // 5
                    fieldName: "originalLanguageId",
                    type: "TINYINT UNSIGNED",
                    columnName: "original_language_id"
                },
                { // 6
                    fieldName: "rentalDuration",
                    type: "TINYINT UNSIGNED",
                    columnName: "rental_duration",
                    required: true,
                    defaultValue: "3"
                    
                },
                { // 7
                    fieldName: "rentalRate",
                    type: "DECIMAL(4,2)",
                    length: 20,
                    columnName: "rental_rate",
                    required: true,
                    defaultValue: "4.99"
                },
                { // 8
                    fieldName: "length",
                    type: "SMALLINT UNSIGNED",
                    columnName: "length",
                    required: true
        
                },
                { // 9
                    fieldName: "replacementCost",
                    type: "DECIMAL(5,2)",
                    columnName: "replacement_cost",
                    required: true,
                    defaultValue: "19.99"
        
                },
                { // 10
                    fieldName: "rating",
                    type: "ENUM('G','PG','PG-13','R','NC-17')",
                    columnName: "rating",
                    required: true,
                    defaultValue: "G"
        
                },
                { // 11
                    fieldName: "specialFeatures",
                    type: "SET('Trailers','Commentaries','Deleted Scenes','Behind the Scenes')",
                    columnName: "special_features"
        
                },
                { // 12
                    fieldName: "lastUpdate",
                    type: "TIMESTAMP",
                    columnName: "last_update",
                    required: true,
                    defaultValue: "CURRENT_TIMESTAMP()"
                }
            ],
            [ // one-to-one definitions
                { // 0
                    fieldName: "language",
                    type: 1,
                    targetModelName: "Language",
                    targetModule: "../model/mysql/Language.js",
                    targetTableName: "language",
                    status: "enabled",
                    joinColumns: {
                        sourceColumns: "language_id",
                        targetColumns: "language_id"
                    }
                },
                { // 1
                    fieldName: "originalLanguage",
                    type: 1,
                    targetModelName: "Language",
                    targetModule: "../model/mysql/Language.js",
                    targetTableName: "language",
                    status: "enabled",
                    joinColumns: {
                        sourceColumns: "original_language_id",
                        targetColumns: "language_id"
                    }
                }
            ],
            [], // one-to-many definitions
            []); // many-to-one definitions
    
    }
}

module.exports = function() {
    return new FilmMetaData();
};
