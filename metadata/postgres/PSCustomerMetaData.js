"use strict";

var MetaData = require('../../main/MetaData.js').MetaData;

class PSCustomerMetaData extends MetaData {
    constructor() {
        super(
            'PSCustomer', // object name,
            'model/postgres/PSCustomer.js', // relative module path,
            'customer', // table name
            [ // field definitions - order is important,
                //selected data will be in this order, primary key fields should be first
                { // 0
                    fieldName: "customerId",
                    type: "integer",
                    columnName: "customer_id",
                    required: true,
                    primaryKey: true,
                    autoIncrementGenerator: "customer_customer_id_seq"
                },
                { // 1
                    fieldName: "storeId",
                    type: "smallint",
                    columnName: "store_id",
                    required: true
                },
                { // 2
                    fieldName: "firstName",
                    type: "character varying",
                    length: 45,
                    columnName: "first_name",
                    required: true
                },
                { // 3
                    fieldName: "lastName",
                    type: "character varying",
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
                    type: "smallint",
                    columnName: "address_id",
                    required: true
                },
                { // 6
                    fieldName: "activebool",
                    type: "boolean",
                    columnName: "activebool",
                    required: true,
                    defaultValue: "true"
                },
                { // 7
                    fieldName: "active",
                    type: "integer",
                    columnName: "active",
                    converter: "ZeroOneToBoolean"
                },
                { // 8
                    fieldName: "createDate",
                    type: "date",
                    columnName: "create_date",
                    required: true,
                    defaultValue: "now()"
                },
                { // 9
                    fieldName: "lastUpdate",
                    type: "timestamp without time zone",
                    columnName: "last_update",
                    required: true,
                    defaultValue: "now()"
                }
            ],
            [ // one-to-one definitions
                { // 0
                    fieldName: "address",
                    type: 1,
                    targetModelName: "PSAddress",
                    targetModule: "../model/postgres/PSAddress.js",
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
                    targetModelName: "PSStore",
                    targetModule: "../model/postgres/PSStore.js",
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
    return new PSCustomerMetaData();
};
