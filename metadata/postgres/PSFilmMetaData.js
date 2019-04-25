"use strict";

var MetaData = require('../../main/MetaData.js').MetaData;

class PSFilmMetaData extends MetaData {
    constructor() {
        super(
            'PSFilm', // object name,
            'model/postgres/PSFilm.js', // relative module path,
            'film', // table name
            [ // field definitions - order is important,
                //selected data will be in this order, primary key fields should be first
                { // 0
                    fieldName: "filmId",
                    type: "integer",
                    columnName: "film_id",
                    required: true,
                    primaryKey: true,
                    autoIncrementGenerator: "film_film_id_seq"
                },
                { // 1
                    fieldName: "title",
                    type: "character varying",
                    length: 255,
                    columnName: "title",
                    required: true
                },
                { // 2
                    fieldName: "description",
                    type: "text",
                    lob: true,
                    columnName: "description"
                },
                { // 3
                    fieldName: "releaseYear",
                    type: "year",
                    columnName: "release_year"
                },
                { // 4
                    fieldName: "languageId",
                    type: "smallint",
                    columnName: "language_id",
                    required: true
                },
                { // 5
                    fieldName: "originalLanguageId",
                    type: "smallint",
                    columnName: "original_language_id"
                },
                { // 6
                    fieldName: "rentalDuration",
                    type: "smallint",
                    columnName: "rental_duration",
                    required: true,
                    defaultValue: "3"
                    
                },
                { // 7
                    fieldName: "rentalRate",
                    type: "numeric(4,2)",
                    columnName: "rental_rate",
                    required: true,
                    defaultValue: "4.99"
                },
                { // 8
                    fieldName: "length",
                    type: "smallint",
                    columnName: "length",
                    required: true
        
                },
                { // 9
                    fieldName: "replacementCost",
                    type: "numeric(5,2)",
                    columnName: "replacement_cost",
                    required: true,
                    defaultValue: "19.99"
        
                },
                { // 10
                    fieldName: "rating",
                    type: "mpaa_rating",
                    columnName: "rating",
                    required: true,
                    defaultValue: "G"
        
                },
                { // 11
                    fieldName: "specialFeatures",
                    type: "text[]",
                    columnName: "special_features"
        
                },
                { // 12
                    fieldName: "text",
                    type: "tsvector",
                    columnName: "fulltext",
                    required: true
                },
                { // 13
                    fieldName: "lastUpdate",
                    type: "timestamp without time zone",
                    columnName: "last_update",
                    required: true,
                    defaultValue: "now()"
                }
            ],
            [ // one-to-one definitions
                { // 0
                    fieldName: "language",
                    type: 1,
                    targetModelName: "PSLanguage",
                    targetModule: "../model/postgres/PSLanguage.js",
                    targetTableName: "language",
                    status: "enabled",
                    joinColumns: {
                        sourceColumns: "language_id",
                        targetColumns: "language_id"
                    }
                },
            ],
            [], // one-to-many definitions
            []); // many-to-one definitions
    
    }
}

module.exports = function() {
    return new PSFilmMetaData();
};
