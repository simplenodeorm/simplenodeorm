"use strict";

const Model = require('@simplenodeorm/simplenodeorm/main/Model');

class Rental extends Model {
    constructor(metaData) {
        super(metaData);
    }
    
    getRentalId() { return this.getFieldValue("rentalId"); };
    setRentalId(value) { this.setFieldValue("rentalId", value); };
    
    getRentalDate() { return this.getFieldValue("rentalDate"); };
    setRentalDate(value) { this.setFieldValue("rentalDate", value); };
    
    getInventoryId() { return this.getFieldValue("inventoryId"); };
    setInventoryId(value) { this.setFieldValue("inventoryId", value); };
    
    getCustomerId() { return this.getFieldValue("customerId"); };
    setCustomerId(value) { this.setFieldValue("customerId", value); };
    
    getReturnDate() { return this.getFieldValue("returnDate"); };
    setReturnDate(value) { this.setFieldValue("returnDate", value); };
    
    getStaffId() { return this.getFieldValue("staffId"); };
    setStaffId(value) { this.setFieldValue("staffId", value); };
    
    getLastUpdate() { return this.getFieldValue("lastUpdate"); };
    setLastUpdate(value) { this.setFieldValue("lastUpdate", value); };
    
    getStaff() { return this.getFieldValue("staff"); };
    setStaff(value) { this.setFieldValue("staff", value); };
    
    getInventory() { return this.getFieldValue("inventory"); };
    setInventory(value) { this.setFieldValue("inventory", value); };
    
    getCustomer() { return this.getFieldValue("customer"); };
    setCustomer(value) { this.setFieldValue("customer", value); };
}

module.exports = function(metaData) {
    return new Rental(metaData);
};
