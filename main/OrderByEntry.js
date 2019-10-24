/*
 * Copyright (c) 2019  simplenodeorm.org
 */

"use strict";

const util = require('./util.js');

/**
 * this object defines one comparison entry for a where clause.
 */
class OrderByEntry {
    constructor(fieldName, descending) {
        this.fieldName = fieldName;
        this.descending = descending;
    }
    
    getFieldName() {
        return this.fieldName;
    }
    
    isDescending() {
        return this.descending;
    }
}

module.exports.OrderByEntry = OrderByEntry;

module.exports= function(fieldName, descending) {
    if (util.isUndefined(descending)) {
        descending = false;
    }
    return new OrderByEntry(fieldName, descending);
};

