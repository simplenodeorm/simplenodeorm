"use strict";

const Model = require('../../../main/Model');

class Address extends Model {
    constructor(metaData) {
        super(metaData);
    }
    
    getAddressId() { return this.__getFieldValue("addressId"); }
    setAddressId(value) { this.__setFieldValue("addressId", value); }
    
    getAddress() { return this.__getFieldValue("address"); }
    setAddress(value) { this.__setFieldValue("address", value); }
    
    getAddress2() { return this.__getFieldValue("address2"); }
    setAddress2(value) { this.__setFieldValue("address2", value); }
    
    getDistrict() { return this.__getFieldValue("district"); }
    setDistrict(value) { this.__setFieldValue("district", value); }
    
    getCityId() { return this.__getFieldValue("cityId"); }
    setCityId(value) { this.__setFieldValue("cityId", value); }
    
    getPostalCode() { return this.__getFieldValue("postalCode"); }
    setPostalCode(value) { this.__setFieldValue("postalCode", value); }
    
    getPhone() { return this.__getFieldValue("phone"); }
    setPhone(value) { this.__setFieldValue("phone", value); }
    
    getLocation() { return this.__getFieldValue("location"); }
    setLocation(value) { this.__setFieldValue("location", value); }

    getLastUpdate() { return this.__getFieldValue("lastUpdate"); }
    setLastUpdate(value) { this.__setFieldValue("lastUpdate", value); }
    
    getCity() { return this.__getFieldValue("city"); }
    setCity(value) { this.__setFieldValue("city", value); }
}

module.exports = function(metaData) {
    return new Address(metaData);
};
