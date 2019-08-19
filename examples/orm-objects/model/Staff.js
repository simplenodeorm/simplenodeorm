"use strict";

const Model = require('../../../main/Model');

class Staff extends Model {
    constructor(metaData) {
        super(metaData);
    }
    
    getStaffId() { return this.getFieldValue("staffId"); }
    setStaffId(value) { this.setFieldValue("staffId", value); }
    
    getFirstName() { return this.getFieldValue("firstName"); }
    setFirstName(value) { this.setFieldValue("firstName", value); }
    
    getLastName() { return this.getFieldValue("lastName"); }
    setLastName(value) { this.setFieldValue("lastName", value); }
    
    getAddressId() { return this.getFieldValue("addressId"); }
    setAddressId(value) { this.setFieldValue("addressId", value); }
    
    getPicture() { return this.getFieldValue("picture"); }
    setPicture(value) { this.setFieldValue("picture", value); }
    
    getEmail() { return this.getFieldValue("email"); }
    setEmail(value) { this.setFieldValue("email", value); }
    
    getStoreId() { return this.getFieldValue("storeId"); }
    setStoreId(value) { this.setFieldValue("storeId", value); }
    
    getActive() { return this.getFieldValue("active"); }
    setActive(value) { this.setFieldValue("active", value); }
    
    getUsername() { return this.getFieldValue("username"); }
    setUsername(value) { this.setFieldValue("username", value); }
    
    getPassword() { return this.getFieldValue("password"); }
    setPassword(value) { this.setFieldValue("password", value); }
    
    getLastUpdate() { return this.getFieldValue("lastUpdate"); }
    setLastUpdate(value) { this.setFieldValue("lastUpdate", value); }
}

module.exports = function(metaData) {
    return new Staff(metaData);
};
