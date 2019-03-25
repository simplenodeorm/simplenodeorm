"use strict";

var MetaData = require('../../main/MetaData.js').MetaData;

class RentalMetaData extends MetaData {
    constructor() {
        super(
            'Rental', // object name,
            'model/mysql/Rental.js', // relative module path,
            'rental', // table name
            [ // field definitions - order is important,
                //selected data will be in this order, primary key fields should be first
                { // 0
                    fieldName: "rentalId",
                    type: "INT",
                    columnName: "rental_id",
                    required: true,
                    primaryKey: true,
                    autoincrementGenerator: "LAST_INSERT_ID()"
                },
                { // 1
                    fieldName: "rentalDate",
                    type: "DATETIME",
                    columnName: "rental_date",
                    required: true
                },
                { // 2
                    fieldName: "inventoryId",
                    type: "MEDIUMINT UNSIGNED",
                    columnName: "inventory_id",
                    required: true
                },
                { // 3
                    fieldName: "customerId",
                    type: "SMALLINT UNSIGNED",
                    columnName: "customer_id",
                    required: true
                },
                { // 4
                    fieldName: "returnDate",
                    type: "DATETIME",
                    columnName: "return_date"
                },
                { // 5
                    fieldName: "staffId",
                    type: "TINYINT UNSIGNED",
                    columnName: "staff_id",
                    required: true
                },
                { // 6
                    fieldName: "lastUpdate",
                    type: "TIMESTAMP",
                    columnName: "last_update",
                    required: true,
                    defaultValue: "CURRENT_TIMESTAMP()"
                }
            ],
            [ // one-to-one definitions
                { // 0
                    fieldName: "staff",
                    type: 1,
                    targetModelName: "Staff",
                    targetModule: "../model/mysql/Staff.js",
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
                    targetModelName: "Inventory",
                    targetModule: "../model/mysql/Inventory.js",
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
                    targetModelName: "Customer",
                    targetModule: "../model/mysql/Customer.js",
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
    return new RentalMetaData();
};
