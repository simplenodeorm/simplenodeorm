"use strict";

var MetaData = require('../../main/MetaData.js').MetaData;

class PSStaffMetaData extends MetaData {
    constructor() {
        super(
            'PSStaff', // object name,
            'model/postgres/PSStaff.js', // relative module path,
            'staff', // table name
            [ // field definitions - order is important,
                //selected data will be in this order, primary key fields should be first
                { // 0
                    fieldName: "staffId",
                    type: "integer",
                    columnName: "staff_id",
                    required: true,
                    primaryKey: true,
                    autoIncrementGenerator: "staff_staff_id_seq"
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
                    fieldName: "addressId",
                    type: "smallint",
                    length: 50,
                    columnName: "address_id",
                    required: true
                },
                { // 5
                    fieldName: "email",
                    type: "character varying",
                    length: 50,
                    columnName: "email"
                },
                { // 6
                    fieldName: "storeId",
                    type: "smallint",
                    columnName: "store_id",
                    required: true
                },
                { // 7
                    fieldName: "active",
                    type: "BOOLEAN",
                    columnName: "active",
                    required: true,
                    defaultValue: "true",
                    converter: "ZeroOneToBoolean"
                },
                { // 8
                    fieldName: "username",
                    type: "character varying",
                    length: 16,
                    columnName: "username",
                    required: true
                },
                { // 9
                    fieldName: "password",
                    type: "character varying",
                    length: 40,
                    columnName: "password"
                },
                { // 10
                    fieldName: "picture",
                    type: "bytea",
                    columnName: "picture"
                },
                { // 11
                    fieldName: "lastUpdate",
                    type: "timestamp without time zone",
                    columnName: "last_update",
                    required: true,
                    defaultValue: "now()"
                },
                
            ],
            [ // one-to-one definitions
                { // 0
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
    return new PSStaffMetaData();
};


