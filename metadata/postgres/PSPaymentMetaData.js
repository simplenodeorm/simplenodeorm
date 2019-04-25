"use strict";

var MetaData = require('../../main/MetaData.js').MetaData;

class PSPaymentMetaData extends MetaData {
    constructor() {
        super(
            'PSPayment', // object name,
            'model/posrgres/PSPayment.js', // relative module path,
            'payment', // table name
            [ // field definitions - order is important,
                //selected data will be in this order, primary key fields should be first
                { // 0
                    fieldName: "paymentId",
                    type: "integer",
                    columnName: "payment_id",
                    required: true,
                    primaryKey: true,
                    autoIncrementGenerator: "payment_payment_id_seq"
                },
                { // 1
                    fieldName: "customerId",
                    type: "smallint",
                    columnName: "customer_id",
                    required: true
                },
                { // 2
                    fieldName: "staffId",
                    type: "smallint",
                    columnName: "staff_id",
                    required: true
                },
                { // 3
                    fieldName: "rentalId",
                    type: "integer",
                    columnName: "rental_id"
                },
                { // 4
                    fieldName: "amount",
                    type: "numeric(5,2)",
                    columnName: "amount",
                    required: true
                },
                { // 5
                    fieldName: "paymentDate",
                    type: "timestamp without time zone",
                    columnName: "payment_date",
                    required: true
                }
            ],
            [ // one-to-one definitions
                { // 0
                    fieldName: "rental",
                    type: 1,
                    targetModelName: "PSRental",
                    targetModule: "../model/postgres/PSRental.js",
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
                    targetModelName: "PSCustomer",
                    targetModule: "../model/postgres/PSCustomer.js",
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
                    targetModelName: "PSStaff",
                    targetModule: "../model/postgres/PSStaff.js",
                    targetTableName: "staff",
                    status: "enabled",
                    joinColumns: {
                        sourceColumns: "staff_id",
                        targetColumns: "staff_id"
                    }
                }
            ],
            [], // one-to-many definitions
            []); // many-to-one definitions
    
    }
}

module.exports = function() {
    return new PSPaymentMetaData();
};

