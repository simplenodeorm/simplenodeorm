"use strict";

let MetaData = require('@simplenodeorm/simplenodeorm/main/MetaData').MetaData;

class InventoryMetaData extends MetaData {
    constructor() {
        super(
            'Inventory', // object name,
            'model/Inventory.js', // relative module path,
            'inventory', // table name
            [ // field definitions - order is important,
                //selected data will be in this order, primary key fields should be first
                { // 0
                    fieldName: "inventoryId",
                    type: "MEDIUMINT UNSIGNED",
                    columnName: "inventory_id",
                    required: true,
                    primaryKey: true,
                    autoIncrementGenerator: "LAST_INSERT_ID()"
                },
                { // 1
                    fieldName: "filmId",
                    type: "SMALLINT UNSIGNED",
                    columnName: "film_id",
                    required: true
                },
                { // 2
                    fieldName: "storeId",
                    type: "TINYINT UNSIGNED",
                    columnName: "store_id",
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
                    fieldName: "film",
                    type: 1,
                    targetModelName: "Film",
                    targetModule: "model/Film.js",
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
                    targetModelName: "Store",
                    targetModule: "model/Store.js",
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
    return new InventoryMetaData();
};

