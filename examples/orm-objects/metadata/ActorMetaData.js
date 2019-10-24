/*
 * Copyright (c) 2019  simplenodeorm.org
 */

"use strict";

let MetaData = require('../../../main/MetaData').MetaData;

class ActorMetaData extends MetaData {
    constructor() {
        super(
            'Actor', // object name,
            'model/Actor.js', // relative module path,
            'actor', // table name
            [ // field definitions - order is important,
                //selected data will be in this order, primary key fields should be first
                { // 0
                    fieldName: "actorId",
                    type: "SMALLINT UNSIGNED",
                    columnName: "actor_id",
                    required: true,
                    primaryKey: true,
                    autoIncrementGenerator: "LAST_INSERT_ID()"
                },
                { // 1
                    fieldName: "firstName",
                    type: "VARCHAR",
                    length: 45,
                    columnName: "first_name",
                    required: true
                },
                { // 2
                    fieldName: "lastName",
                    type: "VARCHAR",
                    length: 45,
                    columnName: "last_name",
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
            [],// one-to-one definitions
            [], // one-to-many definitions
            []); // many-to-many definitions
    
    }
}

module.exports = function() {
    return new ActorMetaData();
};
