/*
 * Copyright (c) 2019  simplenodeorm.org
 */

"use strict";

const Model = require('../../../main/Model');

class Staff extends Model {
    constructor(metaData) {
        super(metaData);
    }

    async getStaffId() { return await this.__getFieldValue("staffId"); }
    setStaffId(value) { this.__setFieldValue("staffId", value); }

    async getFirstName() { return await this.__getFieldValue("firstName"); }
    setFirstName(value) { this.__setFieldValue("firstName", value); }

    async getLastName() { return await this.__getFieldValue("lastName"); }
    setLastName(value) { this.__setFieldValue("lastName", value); }

    async getAddressId() { return await this.__getFieldValue("addressId"); }
    setAddressId(value) { this.__setFieldValue("addressId", value); }

    async getPicture() { return await this.__getFieldValue("picture"); }
    setPicture(value) { this.__setFieldValue("picture", value); }

    async getEmail() { return await this.__getFieldValue("email"); }
    setEmail(value) { this.__setFieldValue("email", value); }

    async getStoreId() { return await this.__getFieldValue("storeId"); }
    setStoreId(value) { this.__setFieldValue("storeId", value); }

    async getActive() { return await this.__getFieldValue("active"); }
    setActive(value) { this.__setFieldValue("active", value); }

    async getUsername() { return await this.__getFieldValue("username"); }
    setUsername(value) { this.__setFieldValue("username", value); }

    async getPassword() { return await this.__getFieldValue("password"); }
    setPassword(value) { this.__setFieldValue("password", value); }

    async getLastUpdate() { return await this.__getFieldValue("lastUpdate"); }
    setLastUpdate(value) { this.__setFieldValue("lastUpdate", value); }
}

module.exports = function(metaData) {
    return new Staff(metaData);
};
