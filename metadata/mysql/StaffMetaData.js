"use strict";

var MetaData = require('../../main/MetaData.js').MetaData;

class StaffMetaData extends MetaData {
    constructor() {
        super(
            'Staff', // object name,
            'model/mysql/Staff.js', // relative module path,
            'staff', // table name
            [ // field definitions - order is important,
                //selected data will be in this order, primary key fields should be first
                { // 0
                    fieldName: "staffId",
                    type: "TINYINT UNSIGNED",
                    columnName: "staff_id",
                    required: true,
                    primaryKey: true,
                    autoincrementGenerator: "LAST_INSERT_ID()"
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
                    fieldName: "addressId",
                    type: "SMALLINT UNSIGNED",
                    length: 50,
                    columnName: "address_id",
                    required: true
                },
                { // 4
                    fieldName: "picture",
                    type: "BLOB",
                    columnName: "picture",
                    lob: true
                },
                { // 5
                    fieldName: "email",
                    type: "VARCHAR",
                    length: 50,
                    columnName: "email"
                },
                { // 6
                    fieldName: "storeId",
                    type: "TINYINT UNSIGNED",
                    columnName: "store_id",
                    required: true
                },
                { // 6
                    fieldName: "active",
                    type: "BOOLEAN",
                    columnName: "active",
                    required: true,
                    defaultValue: "TRUE"
                },
                { // 5
                    fieldName: "username",
                    type: "VARCHAR",
                    length: 16,
                    columnName: "username",
                    required: true
                },
                { // 5
                    fieldName: "password",
                    type: "VARCHAR",
                    length: 40,
                    columnName: "password"
                },
                { // 7
                    fieldName: "lastUpdate",
                    type: "TIMESTAMP",
                    columnName: "last_update",
                    required: true,
                    defaultValue: "CURRENT_TIMESTAMP()"
                }
            ],
            [ // one-to-one definitions
                { // 0
                    fieldName: "store",
                    type: 1,
                    targetModelName: "Store",
                    targetModule: "../model/mysql/Store.js",
                    targetTableName: "store",
                    status: "enabled",
                    joinColumns: {
                        sourceColumns: "store_id",
                        targetColumns: "store_id"
                    }
                },
                { // 1
                    fieldName: "addess",
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
    return new StaffMetaData();
};


