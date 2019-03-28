"use strict";

const Model = require('../../main/Model.js');

class Store extends Model {
    constructor(metaData) {
        super(metaData);
    }
    
    getStoreId() { return this.getFieldValue("storeId"); }
    setStoreId(value) { this.setFieldValue("storeId", value); }
    
    getManagerStaffId() { return this.getFieldValue("managerStaffId"); }
    setManagerStaffId(value) { this.setFieldValue("managerStaffId", value); }
    
    getAddressId() { return this.getFieldValue("addressId"); }
    setAddressId(value) { this.setFieldValue("addressId", value); }
    
    getLastUpdate() { return this.getFieldValue("lastUpdate"); }
    setLastUpdate(value) { this.setFieldValue("lastUpdate", value); }
    
    getManager() { return this.getFieldValue("manager"); }
    setManager(value) { this.setFieldValue("manager", value); }
    
    getAddress() { return this.getFieldValue("address"); }
    setAddress(value) { this.setFieldValue("address", value); }
}

module.exports = function(metaData) {
    return new Store(metaData);
};
