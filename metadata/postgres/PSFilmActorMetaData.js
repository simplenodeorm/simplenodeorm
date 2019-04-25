"use strict";

var MetaData = require('../../main/MetaData.js').MetaData;

class PSFilmActorMetaData extends MetaData {
    constructor() {
        super(
            'PSFilmActor', // object name,
            'model/postgres/PSFilmActor.js', // relative module path,
            'film_actor', // table name
            [ // field definitions - order is important,
                //selected data will be in this order, primary key fields should be first
                { // 0
                    fieldName: "actorId",
                    type: "smallint",
                    columnName: "actor_id",
                    required: true,
                    primaryKey: true
                },
                { // 1
                    fieldName: "filmId",
                    type: "smallint",
                    columnName: "film_id",
                    primaryKey: true,
                    required: true
                },
                { // 3
                    fieldName: "lastUpdate",
                    type: "timestamp without time zone",
                    columnName: "last_update",
                    required: true,
                    defaultValue: "now()"
                }
            ],
            [ // one-to-one definitions
                { // 0
                    fieldName: "actor",
                    type: 1,
                    targetModelName: "PSActor",
                    targetModule: "../model/postgres/PSActor.js",
                    targetTableName: "actor",
                    status: "enabled",
                    required: true,
                    joinColumns: {
                        sourceColumns: "actor_id",
                        targetColumns: "actor_id"
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
    return new PSFilmActorMetaData();
};
