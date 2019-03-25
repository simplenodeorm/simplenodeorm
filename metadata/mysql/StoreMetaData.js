"use strict";

var MetaData = require('../../main/MetaData.js').MetaData;

class StoreMetaData extends MetaData {
    constructor() {
        super(
            'Store', // object name,
            'model/mysql/Store.js', // relative module path,
            'store', // table name
            [ // field definitions - order is important,
                //selected data will be in this order, primary key fields should be first
                { // 0
                    fieldName: "storeId",
                    type: "TINYINT UNSIGNED",
                    columnName: "store_id",
                    required: true,
                    primaryKey: true,
                    autoincrementGenerator: "LAST_INSERT_ID()"
                },
                { // 1
                    fieldName: "managerSraffId",
                    type: "TINYINT UNSIGNED",
                    columnName: "manager_staff_id",
                    required: true
                },
                { // 2
                    fieldName: "addressId",
                    type: "SMALLINT UNSIGNED",
                    columnName: "address_id",
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
                    fieldName: "manager",
                    type: 1,
                    targetModelName: "Staff",
                    targetModule: "../model/mysql/Staff.js",
                    targetTableName: "staff",
                    status: "enabled",
                    joinColumns: {
                        sourceColumns: "manager_staff_id",
                        targetColumns: "staff_id"
                    }
                },
                { // 1
                    fieldName: "address",
                    type: 1,
                    targetModelName: "Address",
                    targetModule: "../model/mysql/Address.js",
                    targetTableName: "address",
                    status: "enabled",
                    joinColumns: {
                        sourceColumns: "address_id",
                        targetColumns: "address_id"
                    }
                }
            ],
            [], // one-to-many definitions
            []); // many-to-one definitions
    
    }
}

module.exports = function() {
    return new StoreMetaData();
};
