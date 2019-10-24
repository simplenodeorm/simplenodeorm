/*
 * Copyright (c) 2019  simplenodeorm.org
 */

"use strict";

const Model = require('../../../main/Model');

class Customer extends Model {
    constructor(metaData) {
        super(metaData);
    }
   
    getCustomerId() { return this.__getFieldValue("customerId"); }
    setCustomerId(value) { this.__setFieldValue("customerId", value); }
    
    getStoreId() { return this.__getFieldValue("storeId"); }
    setStoreId(value) { this.__setFieldValue("storeId", value); }
    
    getFirstName() { return this.__getFieldValue("firstName"); }
    setFirstName(value) { this.__setFieldValue("firstName", value); }
    
    getLastName() { return this.__getFieldValue("lastName"); }
    setLastName(value) { this.__setFieldValue("lastName", value); }

    getEmail() { return this.__getFieldValue("email"); }
    setEmail(value) { this.__setFieldValue("email", value); }

    getAddressId() { return this.__getFieldValue("addressId"); }
    setAddressId(value) { this.__setFieldValue("addressId", value); }

    getActive() { return this.__getFieldValue("active"); }
    setActive(value) { this.__setFieldValue("active", value); }

    getCreateDate() { return this.__getFieldValue("createDate"); }
    setCreateDate(value) { this.__setFieldValue("createDate", value); }

    getLastUpdate() { return this.__getFieldValue("lastUpdate"); }
    setLastUpdate(value) { this.__setFieldValue("lastUpdate", value); }
    
    getAddress() { return this.__getFieldValue("address"); }
    setAddress(value) { this.__setFieldValue("address", value); }
    
    getStore() { return this.__getFieldValue("store"); }
    setStore(value) { this.__setFieldValue("store", value); }
}

module.exports = function(metaData) {
    return new Customer(metaData);
};
