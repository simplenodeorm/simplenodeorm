/*
 * Copyright (c) 2019  simplenodeorm.org
 */

const util = require('../main/util.js');

module.exports = function(field, value, fromDb) {
    let retval = value;
    
    if (util.isNumber(value)) {
        retval = Number.parseFloat(value).toFixed(2);
    }
    
    return retval;
};

