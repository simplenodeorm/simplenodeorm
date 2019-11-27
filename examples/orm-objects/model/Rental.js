/*
 * Copyright (c) 2019  simplenodeorm.org
 */

"use strict";

const Model = require('../../../main/Model');

class Rental extends Model {
    constructor(metaData) {
        super(metaData);
    }

    async getRentalId() { return await this.__getFieldValue("rentalId"); };
    setRentalId(value) { this.__setFieldValue("rentalId", value); };

    async getRentalDate() { return await this.__getFieldValue("rentalDate"); };
    setRentalDate(value) { this.__setFieldValue("rentalDate", value); };

    async getInventoryId() { return await this.__getFieldValue("inventoryId"); };
    setInventoryId(value) { this.__setFieldValue("inventoryId", value); };

    async getCustomerId() { return await this.__getFieldValue("customerId"); };
    setCustomerId(value) { this.__setFieldValue("customerId", value); };

    async getReturnDate() { return await this.__getFieldValue("returnDate"); };
    setReturnDate(value) { this.__setFieldValue("returnDate", value); };

    async getStaffId() { return await this.__getFieldValue("staffId"); };
    setStaffId(value) { this.__setFieldValue("staffId", value); };

    async getLastUpdate() { return await this.__getFieldValue("lastUpdate"); };
    setLastUpdate(value) { this.__setFieldValue("lastUpdate", value); };

    async getStaff() { return await this.__getFieldValue("staff"); };
    setStaff(value) { this.__setFieldValue("staff", value); };

    async getInventory() { return await this.__getFieldValue("inventory"); };
    setInventory(value) { this.__setFieldValue("inventory", value); };

    async getCustomer() { return await this.__getFieldValue("customer"); };
    setCustomer(value) { this.__setFieldValue("customer", value); };
}

module.exports = function(metaData) {
    return new Rental(metaData);
};
