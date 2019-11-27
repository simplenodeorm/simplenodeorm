/*
 * Copyright (c) 2019  simplenodeorm.org
 */

"use strict";

const Model = require('../../../main/Model');

class Customer extends Model {
    constructor(metaData) {
        super(metaData);
    }

    async getCustomerId() { return await this.__getFieldValue("customerId"); }
    setCustomerId(value) { this.__setFieldValue("customerId", value); }

    async getStoreId() { return await this.__getFieldValue("storeId"); }
    setStoreId(value) { this.__setFieldValue("storeId", value); }

    async getFirstName() { return await this.__getFieldValue("firstName"); }
    setFirstName(value) { this.__setFieldValue("firstName", value); }

    async getLastName() { return await this.__getFieldValue("lastName"); }
    setLastName(value) { this.__setFieldValue("lastName", value); }

    async getEmail() { return await this.__getFieldValue("email"); }
    setEmail(value) { this.__setFieldValue("email", value); }

    async getAddressId() { return await this.__getFieldValue("addressId"); }
    setAddressId(value) { this.__setFieldValue("addressId", value); }

    async getActive() { return await this.__getFieldValue("active"); }
    setActive(value) { this.__setFieldValue("active", value); }

    async getCreateDate() { return await this.__getFieldValue("createDate"); }
    setCreateDate(value) { this.__setFieldValue("createDate", value); }

    async getLastUpdate() { return await this.__getFieldValue("lastUpdate"); }
    setLastUpdate(value) { this.__setFieldValue("lastUpdate", value); }

    async getAddress() { return await this.__getFieldValue("address"); }
    setAddress(value) { this.__setFieldValue("address", value); }

    async getStore() { return await this.__getFieldValue("store"); }
    setStore(value) { this.__setFieldValue("store", value); }
}

module.exports = function(metaData) {
    return new Customer(metaData);
};
