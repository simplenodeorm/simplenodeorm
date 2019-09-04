"use strict";

const Model = require('../../../main/Model');

class Staff extends Model {
    constructor(metaData) {
        super(metaData);
    }
    
    getStaffId() { return this.__getFieldValue("staffId"); }
    setStaffId(value) { this.__setFieldValue("staffId", value); }
    
    getFirstName() { return this.__getFieldValue("firstName"); }
    setFirstName(value) { this.__setFieldValue("firstName", value); }
    
    getLastName() { return this.__getFieldValue("lastName"); }
    setLastName(value) { this.__setFieldValue("lastName", value); }
    
    getAddressId() { return this.__getFieldValue("addressId"); }
    setAddressId(value) { this.__setFieldValue("addressId", value); }
    
    getPicture() { return this.__getFieldValue("picture"); }
    setPicture(value) { this.__setFieldValue("picture", value); }
    
    getEmail() { return this.__getFieldValue("email"); }
    setEmail(value) { this.__setFieldValue("email", value); }
    
    getStoreId() { return this.__getFieldValue("storeId"); }
    setStoreId(value) { this.__setFieldValue("storeId", value); }
    
    getActive() { return this.__getFieldValue("active"); }
    setActive(value) { this.__setFieldValue("active", value); }
    
    getUsername() { return this.__getFieldValue("username"); }
    setUsername(value) { this.__setFieldValue("username", value); }
    
    getPassword() { return this.__getFieldValue("password"); }
    setPassword(value) { this.__setFieldValue("password", value); }
    
    getLastUpdate() { return this.__getFieldValue("lastUpdate"); }
    setLastUpdate(value) { this.__setFieldValue("lastUpdate", value); }
}

module.exports = function(metaData) {
    return new Staff(metaData);
};
