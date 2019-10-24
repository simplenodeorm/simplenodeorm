/*
 * Copyright (c) 2019  simplenodeorm.org
 */

"use strict";

const Model = require('../../../main/Model');

class Rental extends Model {
    constructor(metaData) {
        super(metaData);
    }
    
    getRentalId() { return this.__getFieldValue("rentalId"); };
    setRentalId(value) { this.__setFieldValue("rentalId", value); };
    
    getRentalDate() { return this.__getFieldValue("rentalDate"); };
    setRentalDate(value) { this.__setFieldValue("rentalDate", value); };
    
    getInventoryId() { return this.__getFieldValue("inventoryId"); };
    setInventoryId(value) { this.__setFieldValue("inventoryId", value); };
    
    getCustomerId() { return this.__getFieldValue("customerId"); };
    setCustomerId(value) { this.__setFieldValue("customerId", value); };
    
    getReturnDate() { return this.__getFieldValue("returnDate"); };
    setReturnDate(value) { this.__setFieldValue("returnDate", value); };
    
    getStaffId() { return this.__getFieldValue("staffId"); };
    setStaffId(value) { this.__setFieldValue("staffId", value); };
    
    getLastUpdate() { return this.__getFieldValue("lastUpdate"); };
    setLastUpdate(value) { this.__setFieldValue("lastUpdate", value); };
    
    getStaff() { return this.__getFieldValue("staff"); };
    setStaff(value) { this.__setFieldValue("staff", value); };
    
    getInventory() { return this.__getFieldValue("inventory"); };
    setInventory(value) { this.__setFieldValue("inventory", value); };
    
    getCustomer() { return this.__getFieldValue("customer"); };
    setCustomer(value) { this.__setFieldValue("customer", value); };
}

module.exports = function(metaData) {
    return new Rental(metaData);
};
