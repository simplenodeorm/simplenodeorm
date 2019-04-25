"use strict";

var MetaData = require('../../main/MetaData.js').MetaData;

class PSActorMetaData extends MetaData {
    constructor() {
        super(
            'PSActor', // object name,
            'model/postgres/PSActor.js', // relative module path,
            'actor', // table name
            [ // field definitions - order is important,
                //selected data will be in this order, primary key fields should be first
                { // 0
                    fieldName: "actorId",
                    type: "integer",
                    columnName: "actor_id",
                    required: true,
                    primaryKey: true,
                    autoIncrementGenerator: "actor_actor_id_seq"
                },
                { // 1
                    fieldName: "firstName",
                    type: "character varying",
                    length: 45,
                    columnName: "first_name",
                    required: true
                },
                { // 2
                    fieldName: "lastName",
                    type: "character varying",
                    length: 45,
                    columnName: "last_name",
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
            [],// one-to-one definitions
            [], // one-to-many definitions
            []); // many-to-one definitions
    
    }
}

module.exports = function() {
    return new PSActorMetaData();
};
