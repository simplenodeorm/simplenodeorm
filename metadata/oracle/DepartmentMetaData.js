"use strict";

var MetaData = require('../../main/MetaData.js').MetaData;

class DepartmentMetaData extends MetaData {
    constructor() {
        super(
        'Department', // object name,
        'model/oracle/Department.js', // relative module path,
        'DEPARTMENTS', // table name
        [ // field definitions - order is important,
          //selected data will be in this order, primary key fields shoud be first
            { // 0
                fieldName: "departmentId",
                type: "NUMBER(4)",
                columnName: "DEPARTMENT_ID",
                autoIncrementGenerator: "DEPARTMENTS_SEQ",
                required: true,
                primaryKey: true
            },
            { // 1
                fieldName: "departmentName",
                type: "VARCHAR2",
                length: 30,
                columnName: "DEPARTMENT_NAME",
                required: true
            },
            { // 2
                fieldName: "managerId",
                type: "NUMBER(6)",
                columnName: "MANAGER_ID"
            },
            { // 3
                fieldName: "locationId",
                type: "NUMBER(4)",
                columnName: "LOCATION_ID"
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
               fieldName: "location",
               type: 1,
               targetModelName: "Location",
               targetModule: "../model/oracle/Location.js",
               targetTableName: "LOCATIONS",
               status: "enabled",
               joinColumns : {
                   sourceColumns : "LOCATION_ID",
                   targetColumns : "LOCATION_ID"
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
    return new DepartmentMetaData();
};
