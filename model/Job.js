"use strict";

const Model = require('../main/Model.js');

class Job extends Model {
    constructor(metaData) {
        super(metaData);
    }

    getJobId() { return this.getFieldValue("jobId"); };
    setJobId(value) { this.setFieldValue("jobId", value); };

    getJobTitle() { return this.getFieldValue("jobTitle"); };
    setJobTitle(value) { this.setFieldValue("jobTitle", value); };

    getMinSalary() { return this.getFieldValue("minSalary"); };
    setMinSalary(value) { this.setFieldValue("minSalary", value); };

    getMaxSalary() { return this.getFieldValue("maxSalary"); };
    setMaxSalary(value) { this.setFieldValue("maxSalary", value); };
    
    getEmployees() { return this.getFieldValue("employees"); };
    setEmployees(value) { this.setFieldValue("employees", value); };
}

module.exports = function(metaData) {
    return new Job(metaData);
};

