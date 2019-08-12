"use strict";

const Model = require('@simplenodeorm/simplenodeorm/main/Model');

class Customer extends Model {
    constructor(metaData) {
        super(metaData);
    }
   
    getCustomerId() { return this.getFieldValue("customerId"); }
    setCustomerId(value) { this.setFieldValue("customerId", value); }
    
    getStoreId() { return this.getFieldValue("storeId"); }
    setStoreId(value) { this.setFieldValue("storeId", value); }
    
    getFirstName() { return this.getFieldValue("firstName"); }
    setFirstName(value) { this.setFieldValue("firstName", value); }
    
    getLastName() { return this.getFieldValue("lastName"); }
    setLastName(value) { this.setFieldValue("lastName", value); }

    getEmail() { return this.getFieldValue("email"); }
    setEmail(value) { this.setFieldValue("email", value); }

    getAddressId() { return this.getFieldValue("addressId"); }
    setAddressId(value) { this.setFieldValue("addressId", value); }

    getActive() { return this.getFieldValue("active"); }
    setActive(value) { this.setFieldValue("active", value); }

    getCreateDate() { return this.getFieldValue("createDate"); }
    setCreateDate(value) { this.setFieldValue("createDate", value); }

    getLastUpdate() { return this.getFieldValue("lastUpdate"); }
    setLastUpdate(value) { this.setFieldValue("lastUpdate", value); }
    
    getAddress() { return this.getFieldValue("address"); }
    setAddress(value) { this.setFieldValue("address", value); }
    
    getStore() { return this.getFieldValue("store"); }
    setStore(value) { this.setFieldValue("store", value); }
}

module.exports = function(metaData) {
    return new Customer(metaData);
};
