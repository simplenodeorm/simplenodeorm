"use strict";

const Model = require('../../../main/Model');

class Payment extends Model {
    constructor(metaData) {
        super(metaData);
    }

    getPaymentId() { return this.getFieldValue("paymentId"); }
    setPaymentId(value) { this.setFieldValue("paymentId", value); }
    
    getCustomerId() { return this.getFieldValue("customerId"); }
    setCustomerId(value) { this.setFieldValue("customerId", value); }
    
    getStaffId() { return this.getFieldValue("staffId"); }
    setStaffId(value) { this.setFieldValue("staffId", value); }
    
    getRentalId() { return this.getFieldValue("rentalId"); }
    setRentalId(value) { this.setFieldValue("rentalId", value); }

    getAmount() { return this.getFieldValue("amount"); }
    setAmount(value) { this.setFieldValue("amount", value); }

    getPaymentDate() { return this.getFieldValue("paymentDate"); }
    setPaymentDate(value) { this.setFieldValue("paymentDate", value); }

    getLastUpdate() { return this.getFieldValue("lastUpdate"); }
    setLastUpdate(value) { this.setFieldValue("lastUpdate", value); }

    getRental() { return this.getFieldValue("rental"); }
    setRental(value) { this.setFieldValue("rental", value); }

    getCustomer() { return this.getFieldValue("customer"); }
    setCustomer(value) { this.setFieldValue("customer", value); }

    getStaff() { return this.getFieldValue("staff"); }
    setStaff(value) { this.setFieldValue("staff", value); }
}

module.exports = function(metaData) {
    return new Payment(metaData);
};
