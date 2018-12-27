"use strict";

const util = require("../main/util.js");
const FieldConstraint = require('../main/FieldConstraint.js');

class LengthConstraint extends FieldConstraint {
    constructor(maxLength) {
        super();
        this.maxLength = maxLength;
    }

    check(objectName, fieldName, value) {
        if (util.isDefined(value) && util.isDefined(value.length) && (value.length > this.maxLength)) {
            util.throwError("LengthConstraint", objectName + "." + fieldName + " max length " + this.maxLength + " exceeded(" + value.length + ")", "LengthConstraint");
        }
    }
}

module.exports = LengthConstraint; 
