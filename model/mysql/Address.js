"use strict";

const Model = require('../../main/Model.js');

class Address extends Model {
    constructor(metaData) {
        super(metaData);
    }
    
    getAddressId() { return this.getFieldValue("addressId"); }
    setAddressId(value) { this.setFieldValue("addressId", value); }
    
    getAddress() { return this.getFieldValue("address"); }
    setAddress(value) { this.setFieldValue("address", value); }
    
    getAddress2() { return this.getFieldValue("address2"); }
    setAddress2(value) { this.setFieldValue("address2", value); }
    
    getDistrict() { return this.getFieldValue("district"); }
    setDistrict(value) { this.setFieldValue("district", value); }
    
    getCityId() { return this.getFieldValue("cityId"); }
    setCityId(value) { this.setFieldValue("cityId", value); }
    
    getPostalCode() { return this.getFieldValue("postalCode"); }
    setPostalCode(value) { this.setFieldValue("postalCode", value); }
    
    getPhone() { return this.getFieldValue("phone"); }
    setPhone(value) { this.setFieldValue("phone", value); }
    
    getLocation() { return this.getFieldValue("location"); }
    setLocation(value) { this.setFieldValue("location", value); }

    getLastUpdate() { return this.getFieldValue("lastUpdate"); }
    setLastUpdate(value) { this.setFieldValue("lastUpdate", value); }
    
    getCity() { return this.getFieldValue("city"); }
    setCity(value) { this.setFieldValue("city", value); }
}

module.exports = function(metaData) {
    return new Address(metaData);
};
