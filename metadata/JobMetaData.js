"use strict";

var MetaData = require('../main/MetaData.js').MetaData;

class JobMetaData extends MetaData {
    constructor() {
        super(
        'Job', // object name,
        'model/Job.js', // relative module path,
        'JOBS', // table name
        [ // field definitions - order is important,
          //selected data will be in this order, primary key fields should be first
            { // 0
                fieldName: "jobId",
                type: "VARCHAR2",
                length: 10,
                columnName: "JOB_ID",
                required: true,
                primaryKey: true
            },
            { // 1
                fieldName: "jobTitle",
                type: "VARCHAR2",
                length: 35,
                columnName: "JOB_TITLE",
                required: true
            },
            { // 2
                fieldName: "minSalary",
                type: "NUMBER(6)",
                columnName: "MIN_SALARY"
            },
            { // 3
                fieldName: "maxSalary",
                type: "NUMBER(6)",
                columnName: "MAX_SALARY"
            },
        ],
        [],// one-to-one definitions
        [ // one-to-many definitions
            { // 0
               fieldName: "employees",
               type: 2,
               targetModelName: "Employee",
               targetModule: "../model/Employee.js",
               targetTableName: "EMPLOYEES",
               status: "enabled",
               joinColumns : {
                   sourceColumns : "JOB_ID",
                   targetColumns : "JOB_ID"
               }
            },

        ],
        []); // many-to-one definitions

    }

    
    // load custom constraints here
    loadConstraints() {
    }
}

module.exports = function() {
    return new JobMetaData();
};
