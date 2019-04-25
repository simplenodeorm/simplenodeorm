"use strict";

var MetaData = require('../../main/MetaData.js').MetaData;

class PSRentalMetaData extends MetaData {
    constructor() {
        super(
            'PSRental', // object name,
            'model/postgres/PSRental.js', // relative module path,
            'rental', // table name
            [ // field definitions - order is important,
                //selected data will be in this order, primary key fields should be first
                { // 0
                    fieldName: "rentalId",
                    type: "integer",
                    columnName: "rental_id",
                    required: true,
                    primaryKey: true,
                    autoIncrementGenerator: "rental_rental_id_seq"
                },
                { // 1
                    fieldName: "rentalDate",
                    type: "timestamp without time zone",
                    columnName: "rental_date",
                    required: true
                },
                { // 2
                    fieldName: "inventoryId",
                    type: "integer",
                    columnName: "inventory_id",
                    required: true
                },
                { // 3
                    fieldName: "customerId",
                    type: "smallint",
                    columnName: "customer_id",
                    required: true
                },
                { // 4
                    fieldName: "returnDate",
                    type: "timestamp without time zone",
                    columnName: "return_date"
                },
                { // 5
                    fieldName: "staffId",
                    type: "smallint",
                    columnName: "staff_id",
                    required: true
                },
                { // 6
                    fieldName: "lastUpdate",
                    type: "timestamp without time zone",
                    columnName: "last_update",
                    required: true,
                    defaultValue: "now()"
                }
            ],
            [ // one-to-one definitions
                { // 0
                    fieldName: "staff",
                    type: 1,
                    targetModelName: "PSStaff",
                    targetModule: "../model/postgres/PSStaff.js",
                    targetTableName: "staff",
                    status: "enabled",
                    joinColumns: {
                        sourceColumns: "staff_id",
                        targetColumns: "staff_id"
                    }
                },
                { // 1
                    fieldName: "inventory",
                    type: 1,
                    targetModelName: "PSInventory",
                    targetModule: "../model/postgres/PSInventory.js",
                    targetTableName: "inventory",
                    status: "enabled",
                    joinColumns: {
                        sourceColumns: "inventory_id",
                        targetColumns: "inventory_id"
                    }
                },
                { // 1
                    fieldName: "customer",
                    type: 1,
                    targetModelName: "PSCustomer",
                    targetModule: "../model/postgres/PSCustomer.js",
                    targetTableName: "customer",
                    status: "enabled",
                    joinColumns: {
                        sourceColumns: "customer_id",
                        targetColumns: "customer_id"
                    }
                }
            ],
            [], // one-to-many definitions
            []); // many-to-one definitions
    
    }
}

module.exports = function() {
    return new PSRentalMetaData();
};
