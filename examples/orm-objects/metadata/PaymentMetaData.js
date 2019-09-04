"use strict";

let MetaData = require('../../../main/MetaData').MetaData;

class PaymentMetaData extends MetaData {
    constructor() {
        super(
            'Payment', // object name,
            'model/Payment.js', // relative module path,
            'payment', // table name
            [ // field definitions - order is important,
                //selected data will be in this order, primary key fields should be first
                { // 0
                    fieldName: "paymentId",
                    type: "SMALLINT UNSIGNED",
                    columnName: "payment_id",
                    required: true,
                    primaryKey: true,
                    autoIncrementGenerator: "LAST_INSERT_ID()"
                },
                { // 1
                    fieldName: "customerId",
                    type: "SMALLINT UNSIGNED",
                    columnName: "customer_id",
                    required: true
                },
                { // 2
                    fieldName: "staffId",
                    type: "TINYINT UNSIGNED",
                    columnName: "staff_id",
                    required: true
                },
                { // 3
                    fieldName: "rentalId",
                    type: "INT",
                    columnName: "rental_id"
                },
                { // 4
                    fieldName: "amount",
                    type: "DECIMAL(5,2)",
                    columnName: "amount",
                    required: true
                },
                { // 5
                    fieldName: "paymentDate",
                    type: "DATETIME",
                    columnName: "payment_date",
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
                    fieldName: "rental",
                    type: 1,
                    targetModelName: "Rental",
                    targetModule: "model/Rental.js",
                    targetTableName: "rental",
                    status: "enabled",
                    joinColumns: {
                        sourceColumns: "rental_id",
                        targetColumns: "rental_id"
                    }
                },
                { // 1
                    fieldName: "customer",
                    type: 1,
                    targetModelName: "Customer",
                    targetModule: "model/Customer.js",
                    targetTableName: "customer",
                    status: "enabled",
                    joinColumns: {
                        sourceColumns: "customer_id",
                        targetColumns: "customer_id"
                    }
                },
                { // 1
                    fieldName: "staff",
                    type: 1,
                    targetModelName: "Staff",
                    targetModule: "model/Staff.js",
                    targetTableName: "staff",
                    status: "enabled",
                    joinColumns: {
                        sourceColumns: "staff_id",
                        targetColumns: "staff_id"
                    }
                }
            ],
            [], // one-to-many definitions
            []); // many-to-many definitions
    
    }
}

module.exports = function() {
    return new PaymentMetaData();
};

