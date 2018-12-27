"use strict";

const Model = require('../main/Model.js');

class Department extends Model {
    constructor(metaData) {
        super(metaData);
    }

    getDepartmentId() { return this.getFieldValue("departmentId"); };
    setDepartmentId(value) { this.setFieldValue("departmentId", value); };

    getDepartmentName() { return this.getFieldValue("departmentName"); };
    setDepartmentName(value) { this.setFieldValue("departmentName", value); };

    getManagerId() { return this.getFieldValue("managerId"); };
    setManagerId(value) { this.setFieldValue("managerId", value); };

    getLocationId() { return this.getFieldValue("locationId"); };
    setLocationId(value) { this.setFieldValue("locationId", value); };
  
    getManager() { return this.getFieldValue("manager"); };
    setManager(value) { this.setFieldValue("manager", value); };

    getLocation() { return this.getFieldValue("location"); };
    setLocation(value) { this.setFieldValue("location", value); };
}

module.exports = function(metaData) {
    return new Department(metaData);
};

