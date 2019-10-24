/*
 * Copyright (c) 2019  simplenodeorm.org
 */

const util = require('../main/util.js');

module.exports = function(field, value, fromDb) {
    let retval = value;
    
    if (util.isNumber(value)) {
        let num = value;

        if (fromDb) {
            num *= 100;
            retval = Number.parseFloat(num).toFixed(2);
        } else {
            retval = value/100;
        }
    }
    
    return retval;
};

