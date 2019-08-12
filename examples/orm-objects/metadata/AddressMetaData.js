"use strict";

let MetaData = require('@simplenodeorm/simplenodeorm/main/MetaData').MetaData;

class AddressMetaData extends MetaData {
    constructor() {
        super(
            'Address', // object name,
            'model/Address.js', // relative module path,
            'address', // table name
            [ // field definitions - order is important,
                //selected data will be in this order, primary key fields should be first
                { // 0
                    fieldName: "addressId",
                    type: "SMALLINT UNSIGNED",
                    columnName: "address_id",
                    required: true,
                    primaryKey: true,
                    autoIncrementGenerator: "LAST_INSERT_ID()"
                },
                { // 1
                    fieldName: "address",
                    type: "VARCHAR",
                    length: 50,
                    columnName: "address",
                    required: true
                },
                { // 2
                    fieldName: "address2",
                    type: "VARCHAR",
                    length: 50,
                    columnName: "address2"
                },
                { // 3
                    fieldName: "district",
                    type: "VARCHAR",
                    length: 20,
                    columnName: "district",
                    required: true
                },
                { // 4
                    fieldName: "cityId",
                    type: "SMALLINT UNSIGNED",
                    length: 20,
                    columnName: "city_id",
                    required: true
                },
                { // 5
                    fieldName: "postalCode",
                    type: "VARCHAR",
                    length: 10,
                    columnName: "postal_code"
                },
                { // 6
                    fieldName: "phone",
                    type: "VARCHAR",
                    length: 20,
                    columnName: "phone",
                    required: true
                },
                { // 7
                    fieldName: "location",
                    type: "GEOMETRY",
                    columnName: "location",
                    required: true
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
                    fieldName: "city",
                    type: 1,
                    targetModelName: "City",
                    targetModule: "model/City.js",
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
    return new AddressMetaData();
};
