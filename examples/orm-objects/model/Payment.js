/*
 * Copyright (c) 2019  simplenodeorm.org
 */

"use strict";

const Model = require('../../../main/Model');

class Payment extends Model {
    constructor(metaData) {
        super(metaData);
    }

    getPaymentId() { return this.__getFieldValue("paymentId"); }
    setPaymentId(value) { this.__setFieldValue("paymentId", value); }
    
    getCustomerId() { return this.__getFieldValue("customerId"); }
    setCustomerId(value) { this.__setFieldValue("customerId", value); }
    
    getStaffId() { return this.__getFieldValue("staffId"); }
    setStaffId(value) { this.__setFieldValue("staffId", value); }
    
    getRentalId() { return this.__getFieldValue("rentalId"); }
    setRentalId(value) { this.__setFieldValue("rentalId", value); }

    getAmount() { return this.__getFieldValue("amount"); }
    setAmount(value) { this.__setFieldValue("amount", value); }

    getPaymentDate() { return this.__getFieldValue("paymentDate"); }
    setPaymentDate(value) { this.__setFieldValue("paymentDate", value); }

    getLastUpdate() { return this.__getFieldValue("lastUpdate"); }
    setLastUpdate(value) { this.__setFieldValue("lastUpdate", value); }

    getRental() { return this.__getFieldValue("rental"); }
    setRental(value) { this.__setFieldValue("rental", value); }

    getCustomer() { return this.__getFieldValue("customer"); }
    setCustomer(value) { this.__setFieldValue("customer", value); }

    getStaff() { return this.__getFieldValue("staff"); }
    setStaff(value) { this.__setFieldValue("staff", value); }
}

module.exports = function(metaData) {
    return new Payment(metaData);
};
