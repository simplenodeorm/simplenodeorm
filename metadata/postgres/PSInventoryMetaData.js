"use strict";

var MetaData = require('../../main/MetaData.js').MetaData;

class PSInventoryMetaData extends MetaData {
    constructor() {
        super(
            'PSInventory', // object name,
            'model/postgres/PSInventory.js', // relative module path,
            'inventory', // table name
            [ // field definitions - order is important,
                //selected data will be in this order, primary key fields should be first
                { // 0
                    fieldName: "inventoryId",
                    type: "integer",
                    columnName: "inventory_id",
                    required: true,
                    primaryKey: true,
                    autoIncrementGenerator: "inventory_inventory_id_seq"
                },
                { // 1
                    fieldName: "filmId",
                    type: "smallint",
                    columnName: "film_id",
                    required: true
                },
                { // 2
                    fieldName: "storeId",
                    type: "smallint",
                    columnName: "store_id",
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
                    fieldName: "film",
                    type: 1,
                    targetModelName: "PSFilm",
                    targetModule: "../model/postgres/PSFilm.js",
                    targetTableName: "film",
                    status: "enabled",
                    joinColumns: {
                        sourceColumns: "film_id",
                        targetColumns: "film_id"
                    }
                },
                { // 1
                    fieldName: "store",
                    type: 1,
                    targetModelName: "PSStore",
                    targetModule: "../model/postgres/PSStore.js",
                    targetTableName: "store",
                    status: "enabled",
                    joinColumns: {
                        sourceColumns: "store_id",
                        targetColumns: "store_id"
                    }
                }
            ],
            [], // one-to-many definitions
            []); // many-to-one definitions
    
    }
}

module.exports = function() {
    return new PSInventoryMetaData();
};

