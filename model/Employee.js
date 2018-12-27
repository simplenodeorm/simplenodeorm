"use strict";

const Model = require('../main/Model.js');

class Employee extends Model {
    constructor(metaData) {
        super(metaData);
    }

    getEmployeeId() { return this.getFieldValue("employeeId"); };
    setEmployeeId(value) { this.setFieldValue("employeeId", value); };

    getFirstName() { return this.getFieldValue("firstName"); };
    setFirstName(value) { this.setFieldValue("firstName", value); };

    getLastName() { return this.getFieldValue("lastName"); };
    setLastName(value) { this.setFieldValue("lastName", value); };

    getEmail() { return this.getFieldValue("email"); };
    setEmail(value) { this.setFieldValue("email", value); };

    getPhoneNumber() { return this.getFieldValue("phoneNumber"); };
    setPhoneNumber(value) { this.setFieldValue("phoneNumber", value); };
  
    getHireDate() { return this.getFieldValue("hireDate"); };
    setHireDate(value) { this.setFieldValue("hireDate", value); };

    getJobId() { return this.getFieldValue("jobId"); };
    setJobId(value) { this.setFieldValue("jobId", value); };

    getSalary() { return this.getFieldValue("salary"); };
    setSalary(value) { this.setFieldValue("salary", value); };

    getCommissionPct() { return this.getFieldValue("commissionPct"); };
    setCommissionPct(value) { this.setFieldValue("commissionPct", value); };

    getManagerId() { return this.getFieldValue("managerId"); };
    setManagerId(value) { this.setFieldValue("managerId", value); };

    getDepartmentId() { return this.getFieldValue("departmentId"); };
    setDepartmentId(value) { this.setFieldValue("departmentId", value); };

    getManager() { return this.getFieldValue("manager"); };
    setManager(value) { this.setFieldValue("manager", value); };

    getDepartment() { return this.getFieldValue("department"); };
    setDepartment(value) { this.setFieldValue("department", value); };

    getJob() { return this.getFieldValue("job"); };
    setJob(value) { this.setFieldValue("job", value); };
}

module.exports = function(metaData) {
    return new Employee(metaData);
};

