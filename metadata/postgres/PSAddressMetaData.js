"use strict";

var MetaData = require('../../main/MetaData.js').MetaData;

class PSAddressMetaData extends MetaData {
    constructor() {
        super(
            'PSAddress', // object name,
            'model/postgres/PSAddress.js', // relative module path,
            'address', // table name
            [ // field definitions - order is important,
                //selected data will be in this order, primary key fields should be first
                { // 0
                    fieldName: "addressId",
                    type: "integer",
                    columnName: "address_id",
                    required: true,
                    primaryKey: true,
                    autoIncrementGenerator: "address_address_id_seq"
                },
                { // 1
                    fieldName: "address",
                    type: "character varying",
                    length: 50,
                    columnName: "address",
                    required: true
                },
                { // 2
                    fieldName: "address2",
                    type: "character varying",
                    length: 50,
                    columnName: "address2"
                },
                { // 3
                    fieldName: "district",
                    type: "character varying",
                    length: 20,
                    columnName: "district",
                    required: true
                },
                { // 4
                    fieldName: "cityId",
                    type: "smallint",
                    columnName: "city_id",
                    required: true
                },
                { // 5
                    fieldName: "postalCode",
                    type: "character varying",
                    length: 10,
                    columnName: "postal_code"
                },
                { // 6
                    fieldName: "phone",
                    type: "character varying",
                    length: 20,
                    columnName: "phone",
                    required: true
                },
                { // 7
                    fieldName: "lastUpdate",
                    type: "timestamp without time zone",
                    columnName: "last_update",
                    required: true,
                    defaultValue: "now()"
                }
            ],
            [ // one-to-one definitions
                { // 0
                    fieldName: "city",
                    type: 1,
                    targetModelName: "PSCity",
                    targetModule: "../model/postgres/PSCity.js",
                    targetTableName: "city",
                    status: "enabled",
                    required: true,
                    joinColumns: {
                        sourceColumns: "city_id",
                        targetColumns: "city_id"
                    }
                }
            ],
            [], // one-to-many definitions
            []); // many-to-one definitions
    
    }
}

module.exports = function() {
    return new PSAddressMetaData();
};
