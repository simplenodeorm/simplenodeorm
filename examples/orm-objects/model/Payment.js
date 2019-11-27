/*
 * Copyright (c) 2019  simplenodeorm.org
 */

"use strict";

const Model = require('../../../main/Model');

class Payment extends Model {
    constructor(metaData) {
        super(metaData);
    }

    async getPaymentId() { return await this.__getFieldValue("paymentId"); }
    setPaymentId(value) { this.__setFieldValue("paymentId", value); }

    async getCustomerId() { return await this.__getFieldValue("customerId"); }
    setCustomerId(value) { this.__setFieldValue("customerId", value); }

    async getStaffId() { return await this.__getFieldValue("staffId"); }
    setStaffId(value) { this.__setFieldValue("staffId", value); }

    async getRentalId() { return await this.__getFieldValue("rentalId"); }
    setRentalId(value) { this.__setFieldValue("rentalId", value); }

    async getAmount() { return await this.__getFieldValue("amount"); }
    setAmount(value) { this.__setFieldValue("amount", value); }

    async getPaymentDate() { return await this.__getFieldValue("paymentDate"); }
    setPaymentDate(value) { this.__setFieldValue("paymentDate", value); }

    async getLastUpdate() { return await this.__getFieldValue("lastUpdate"); }
    setLastUpdate(value) { this.__setFieldValue("lastUpdate", value); }

    async getRental() { return await this.__getFieldValue("rental"); }
    setRental(value) { this.__setFieldValue("rental", value); }

    async getCustomer() { return await this.__getFieldValue("customer"); }
    setCustomer(value) { this.__setFieldValue("customer", value); }

    async getStaff() { return await this.__getFieldValue("staff"); }
    setStaff(value) { this.__setFieldValue("staff", value); }
}

module.exports = function(metaData) {
    return new Payment(metaData);
};
