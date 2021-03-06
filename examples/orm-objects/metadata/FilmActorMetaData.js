/*
 * Copyright (c) 2019  simplenodeorm.org
 */

"use strict";

let MetaData = require('../../../main/MetaData').MetaData;

class FilmActorMetaData extends MetaData {
    constructor() {
        super(
            'FilmActor', // object name,
            'model/FilmActor.js', // relative module path,
            'film_actor', // table name
            [ // field definitions - order is important,
                //selected data will be in this order, primary key fields should be first
                { // 0
                    fieldName: "actorId",
                    type: "SMALLINT UNSIGNED",
                    columnName: "actor_id",
                    required: true,
                    primaryKey: true
                },
                { // 1
                    fieldName: "filmId",
                    type: "SMALLINT UNSIGNED",
                    columnName: "film_id",
                    primaryKey: true,
                    required: true
                },
                { // 3
                    fieldName: "lastUpdate",
                    type: "TIMESTAMP",
                    columnName: "last_update",
                    required: true,
                    defaultValue: "CURRENT_TIMESTAMP()"
                }
            ],
            [ // one-to-one definitions
                { // 0
                    fieldName: "actor",
                    type: 1,
                    targetModelName: "Actor",
                    targetModule: "model/Actor.js",
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
    return new FilmActorMetaData();
};
