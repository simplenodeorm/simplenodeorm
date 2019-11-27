/*
 * Copyright (c) 2019  simplenodeorm.org
 */

"use strict";

const Model = require('../../../main/Model');

class Address extends Model {
    constructor(metaData) {
        super(metaData);
    }
    
    async getAddressId() { return await this.__getFieldValue("addressId"); }
    setAddressId(value) { this.__setFieldValue("addressId", value); }

    async getAddress() { return await this.__getFieldValue("address"); }
    setAddress(value) { this.__setFieldValue("address", value); }

    async getAddress2() { return await this.__getFieldValue("address2"); }
    setAddress2(value) { this.__setFieldValue("address2", value); }

    async getDistrict() { return await this.__getFieldValue("district"); }
    setDistrict(value) { this.__setFieldValue("district", value); }

    async getCityId() { return await this.__getFieldValue("cityId"); }
    setCityId(value) { this.__setFieldValue("cityId", value); }

    async getPostalCode() { return await this.__getFieldValue("postalCode"); }
    setPostalCode(value) { this.__setFieldValue("postalCode", value); }

    async getPhone() { return await this.__getFieldValue("phone"); }
    setPhone(value) { this.__setFieldValue("phone", value); }

    async getLocation() { return await this.__getFieldValue("location"); }
    setLocation(value) { this.__setFieldValue("location", value); }

    async getLastUpdate() { return await this.__getFieldValue("lastUpdate"); }
    setLastUpdate(value) { this.__setFieldValue("lastUpdate", value); }

    async getCity() { return await this.__getFieldValue("city"); }
    setCity(value) { this.__setFieldValue("city", value); }
}

module.exports = function(metaData) {
    return new Address(metaData);
};
