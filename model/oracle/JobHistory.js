"use strict";

const Model = require('../../main/Model.js');

class JobHistory extends Model {
    constructor(metaData) {
        super(metaData);
    }

    getEmployeeId() { return this.getFieldValue("employeeId"); };
    setEmployeeId(value) { this.setFieldValue("employeeId", value); };

    getStartDate() { return this.getFieldValue("startDate"); };
    setStartDate(value) { this.setFieldValue("startDate", value); };

    getEndDate() { return this.getFieldValue("endDate"); };
    setEndDate(value) { this.setFieldValue("endDate", value); };

    getJobId() { return this.getFieldValue("jobId"); };
    setJobId(value) { this.setFieldValue("jobId", value); };
  
    getDepartmentId() { return this.getFieldValue("departmentId"); };
    setDepartmentId(value) { this.setFieldValue("departmentId", value); };

    getEmployee() { return this.getFieldValue("employee"); };
    setEmployee(value) { this.setFieldValue("employee", value); };

    getJob() { return this.getFieldValue("job"); };
    setJob(value) { this.setFieldValue("job", value); };
  
    getDepartment() { return this.getFieldValue("department"); };
    setDepartment(value) { this.setFieldValue("department", value); };
}

module.exports = function(metaData) {
    return new JobHistory(metaData);
};

