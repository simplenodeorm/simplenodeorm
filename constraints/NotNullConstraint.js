/*
 * Copyright (c) 2019  simplenodeorm.org
 */

"use strict";

const FieldConstraint = require("../main/FieldConstraint.js");
const util = require("../main/util.js");
class NotNullConstraint extends FieldConstraint {
    constructor() {
        super();
    }
    
    check(objectName, fieldName, value) {
        if (util.isUndefined(value)) {
            util.throwError("NotNullConstraint", objectName + "." + fieldName + " is null");
        }
    }
}

module.exports = NotNullConstraint;
