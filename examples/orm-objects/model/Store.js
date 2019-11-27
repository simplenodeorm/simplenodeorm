/*
 * Copyright (c) 2019  simplenodeorm.org
 */

"use strict";

const Model = require('../../../main/Model');

class Store extends Model {
    constructor(metaData) {
        super(metaData);
    }

    async getStoreId() { return await this.__getFieldValue("storeId"); }
    setStoreId(value) { this.__setFieldValue("storeId", value); }

    async getManagerStaffId() { return await this.__getFieldValue("managerStaffId"); }
    setManagerStaffId(value) { this.__setFieldValue("managerStaffId", value); }

    async getAddressId() { return await this.__getFieldValue("addressId"); }
    setAddressId(value) { this.__setFieldValue("addressId", value); }

    async getLastUpdate() { return await this.__getFieldValue("lastUpdate"); }
    setLastUpdate(value) { this.__setFieldValue("lastUpdate", value); }

    async getManager() { return await this.__getFieldValue("manager"); }
    setManager(value) { this.__setFieldValue("manager", value); }

    async getAddress() { return await this.__getFieldValue("address"); }
    setAddress(value) { this.__setFieldValue("address", value); }
}

module.exports = function(metaData) {
    return new Store(metaData);
};
