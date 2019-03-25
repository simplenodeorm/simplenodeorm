"use strict";

var MetaData = require('../../main/MetaData.js').MetaData;

class EmployeeMetaData extends MetaData {
    constructor() {
        super(
        'Employee', // object name,
        'model/oracle/Employee.js', // relative module path,
        'EMPLOYEES', // table name
        [ // field definitions - order is important,
          //selected data will be in this order, primary key fields shoud be first
            { // 0
                fieldName: "employeeId",
                type: "NUMBER(6)",
                columnName: "EMPLOYEE_ID",
                autoIncrementGenerator: "EMPLOYEES_SEQ",
                required: true,
                primaryKey: true
            },
            { // 1
                fieldName: "firstName",
                type: "VARCHAR2",
                length: 20,
                columnName: "FIRST_NAME"
            },
            { // 2
                fieldName: "lastName",
                type: "VARCHAR2",
                length: 25,
                columnName: "LAST_NAME",
                required: true
            },
            { // 3
                fieldName: "email",
                type: "VARCHAR2",
                length: 25,
                columnName: "EMAIL",
                required: true
            },
            { // 4
                fieldName: "phoneNumber",
                type: "VARCHAR2",
                length: 20,
                columnName: "PHONE_NUMBER"
            },
            { // 5
                fieldName: "hireDate",
                type: "DATE",
                columnName: "HIRE_DATE",
                required: true
            },
            { // 6
                fieldName: "jobId",
                type: "VARCHAR2",
                length: 10,
                columnName: "JOB_ID",
                required: true
            },
            { // 7
                fieldName: "salary",
                type: "NUMBER(8,2)",
                columnName: "SALARY"
            },
            { // 8
                fieldName: "commissionPct",
                type: "NUMBER(2,2)",
                columnName: "COMMISSION_PCT"
            },
            { // 9
                fieldName: "managerId",
                type: "NUMBER(6)",
                columnName: "MANAGER_ID"
            },
            { // 10
                fieldName: "departmentId",
                type: "NUMBER(4)",
                columnName: "DEPARTMENT_ID"
            }
        ],
        [ // one-to-one definitions
            { // 0
               fieldName: "manager",
               type: 1,
               targetModelName: "Employee",
               targetModule: "../model/oracle/Employee.js",
               targetTableName: "EMPLOYEES",
               status: "enabled",
               joinColumns : {
                   sourceColumns : "MANAGER_ID",
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
    return new EmployeeMetaData();
};
