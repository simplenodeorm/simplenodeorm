/*
 * Copyright (c) 2019  simplenodeorm.org
 */

const util = require('../main/util.js');

module.exports = function(field, value, fromDb) {
    let retval = value;
    
    if (util.isValidObject(value)) {
        if (fromDb) {
            retval = (value === 1);
        } else {
            if (value) {
                retval = 1;
            } else {
                retval = 0;
            }
        }

    }
    
    return retval;
};

