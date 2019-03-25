"use strict";

var MetaData = require('../../main/MetaData.js').MetaData;

class JobHistoryMetaData extends MetaData {
    constructor() {
        super(
        'JobHistory', // object name,
        'model/oracle/JobHistory.js', // relative module path,
        'JOB_HISTORY', // table name
        [ // field definitions - order is important,
          //selected data will be in this order, primary key fields shoud be first
            { // 0
                fieldName: "employeeId",
                type: "NUMBER(6)",
                columnName: "EMPLOYEE_ID",
                required: true,
                primaryKey: true
            },
            { // 1
                fieldName: "startDate",
                type: "DATE",
                columnName: "START_DATE",
                required: true,
                primaryKey: true
            },
            { // 2
                fieldName: "endDate",
                type: "DATE",
                columnName: "END_DATE",
                required: true
            },
            { // 3
                fieldName: "jobId",
                type: "VARCHAR2",
                length: 10,
                columnName: "JOB_ID",
                required: true
            },
            { // 4
                fieldName: "departmentId",
                type: "NUMBER(4)",
                columnName: "DEPARTMENT_ID"
            },
        ],
        [ // one-to-one definitions
            { // 0
               fieldName: "employee",
               type: 1,
               targetModelName: "Employee",
               targetModule: "../model/oracle/Employee.js",
               targetTableName: "EMPLOYEES",
               status: "enabled",
               joinColumns : {
                   sourceColumns : "EMPLOYEE_ID",
                   targetColumns : "EMPLOYEE_ID"
               }
            },
            { // 1
               fieldName: "department",
               type: 1,
               targetModelName: "Department",
               targetModule: "../model/oracle/Department.js",
               targetTableName: "DEPARTMENTS",
               status: "enabled",
               joinColumns : {
                   sourceColumns : "DEPARTMENT_ID",
                   targetColumns : "DEPARTMENT_ID"
               }
            },
            { // 1
               fieldName: "job",
               type: 1,
               targetModelName: "Job",
               targetModule: "../model/oracle/Job.js",
               targetTableName: "JOBS",
               status: "enabled",
               joinColumns : {
                   sourceColumns : "JOB_ID",
                   targetColumns : "JOB_ID"
               }
            }
        ],
        [], // one-to-many definitions
        []); // many-to-one definitions

    }

    
    // load custom constraints here
    loadConstraints() {
    }
}

module.exports = function() {
    return new JobHistoryMetaData();
};
