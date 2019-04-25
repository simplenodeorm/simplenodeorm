"use strict";

var MetaData = require('../../main/MetaData.js').MetaData;

class PSStoreMetaData extends MetaData {
    constructor() {
        super(
            'PSStore', // object name,
            'model/postgres/PSStore.js', // relative module path,
            'store', // table name
            [ // field definitions - order is important,
                //selected data will be in this order, primary key fields should be first
                { // 0
                    fieldName: "storeId",
                    type: "integer",
                    columnName: "store_id",
                    required: true,
                    primaryKey: true,
                    autoIncrementGenerator: "store_store_id_seq"
                },
                { // 1
                    fieldName: "managerStaffId",
                    type: "smallint",
                    columnName: "manager_staff_id",
                    required: true
                },
                { // 2
                    fieldName: "addressId",
                    type: "smallint",
                    columnName: "address_id",
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
                    fieldName: "manager",
                    type: 1,
                    targetModelName: "PSStaff",
                    targetModule: "../model/postgres/PSStaff.js",
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
                    targetModelName: "PSAddress",
                    targetModule: "../model/postgres/PSAddress.js",
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
    return new PSStoreMetaData();
};
