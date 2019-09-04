"use strict";

const Model = require('../../../main/Model');

class Store extends Model {
    constructor(metaData) {
        super(metaData);
    }
    
    getStoreId() { return this.__getFieldValue("storeId"); }
    setStoreId(value) { this.__setFieldValue("storeId", value); }
    
    getManagerStaffId() { return this.__getFieldValue("managerStaffId"); }
    setManagerStaffId(value) { this.__setFieldValue("managerStaffId", value); }
    
    getAddressId() { return this.__getFieldValue("addressId"); }
    setAddressId(value) { this.__setFieldValue("addressId", value); }
    
    getLastUpdate() { return this.__getFieldValue("lastUpdate"); }
    setLastUpdate(value) { this.__setFieldValue("lastUpdate", value); }
    
    getManager() { return this.__getFieldValue("manager"); }
    setManager(value) { this.__setFieldValue("manager", value); }
    
    getAddress() { return this.__getFieldValue("address"); }
    setAddress(value) { this.__setFieldValue("address", value); }
}

module.exports = function(metaData) {
    return new Store(metaData);
};
