"use strict";

var MetaData = require('../../main/MetaData.js').MetaData;

class FilmTextMetaData extends MetaData {
    constructor() {
        super(
            'FilmText', // object name,
            'model/mysql/FilmText.js', // relative module path,
            'film_text', // table name
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
                    fieldName: "title",
                    type: "VARCHAR",
                    length: 255,
                    columnName: "title",
                    required: true
                },
                { // 3
                    fieldName: "description",
                    type: "TEXT",
                    columnName: "description",
                    required: true
                }
            ],
            [], // one-to-one definitions
            [], // one-to-many definitions
            []); // many-to-one definitions
    
    }
}

module.exports = function() {
    return new FilmTextMetaData();
};

    
