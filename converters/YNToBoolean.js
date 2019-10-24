/*
 * Copyright (c) 2019  simplenodeorm.org
 */

const util = require('../main/util.js');

module.exports = function(field, value, fromDb) {
    let retval = value;
    
    if (util.isValidObject(value)) {
        if (fromDb) {
            retval = (value === 'Y');
        } else {
            if (value) {
                retval = 'Y';
            } else {
                retval = 'N';
            }
        }

    }
    
    return retval;
};

