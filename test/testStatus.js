/*
 * Copyright (c) 2019  simplenodeorm.org
 */

const util = require('../main/util.js');

class TestStatus {
    constructor(testStatus, message, method) {
        this.testStatus = testStatus;
        this.message = message;
        this.method = method;
    }
}

module.exports = function(testStatus, message, method) {
    return new TestStatus(testStatus, message, method);
};