"use strict";

let MetaData = require('@simplenodeorm/simplenodeorm/main/MetaData').MetaData;

class CustomerMetaData extends MetaData {
    constructor() {
        super(
            'Customer', // object name,
            'model/Customer.js', // relative module path,
            'customer', // table name
            [ // field definitions - order is important,
                //selected data will be in this order, primary key fields should be first
                { // 0
                    fieldName: "customerId",
                    type: "SMALLINT UNSIGNED",
                    columnName: "customer_id",
                    required: true,
                    primaryKey: true,
                    autoIncrementGenerator: "LAST_INSERT_ID()"
                },
                { // 1
                    fieldName: "storeId",
                    type: "TINYINT UNSIGNED",
                    columnName: "store_id",
                    required: true
                },
                { // 2
                    fieldName: "firstName",
                    type: "VARCHAR",
                    length: 45,
                    columnName: "first_name",
                    required: true
                },
                { // 3
                    fieldName: "lastName",
                    type: "VARCHAR",
                    length: 45,
                    columnName: "last_name",
                    required: true
                },
                { // 4
                    fieldName: "email",
                    type: "VARCHAR",
                    length: 50,
                    columnName: "email"
                },
                { // 5
                    fieldName: "addressId",
                    type: "SMALLINT UNSIGNED",
                    columnName: "address_id",
                    required: true
                },
                { // 6
                    fieldName: "active",
                    type: "BOOLEAN",
                    columnName: "active",
                    required: true,
                    defaultValue: "true",
                    converter: "ZeroOneToBoolean"
                },
                { // 7
                    fieldName: "createDate",
                    type: "DATETIME",
                    columnName: "create_date",
                    required: true,
                    defaultValue: "CURRENT_TIMESTAMP"
                },
                { // 8
                    fieldName: "lastUpdate",
                    type: "TIMESTAMP",
                    columnName: "last_update",
                    required: true,
                    defaultValue: "CURRENT_TIMESTAMP()"
                }
            ],
            [ // one-to-one definitions
                { // 0
                    fieldName: "address",
                    type: 1,
                    targetModelName: "Address",
                    targetModule: "model/Address.js",
                    targetTableName: "address",
                    status: "enabled",
                    required: true,
                    joinColumns: {
                        sourceColumns: "address_id",
                        targetColumns: "address_id"
                    }
                },
                { // 0
                    fieldName: "store",
                    type: 1,
                    targetModelName: "Store",
                    targetModule: "model/Store.js",
                    targetTableName: "store",
                    status: "enabled",
                    required: true,
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
    return new CustomerMetaData();
};
