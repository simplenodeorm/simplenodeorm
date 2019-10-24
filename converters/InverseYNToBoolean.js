/*
 * Copyright (c) 2019  simplenodeorm.org
 */

const util = require('../main/util.js');

module.exports = function(field, value, fromDb) {
    let retval = value;
    
    if (util.isValidObject(value)) {
        if (fromDb) {
            retval = (value === 'N');
        } else {
            if (value) {
                retval = 'N';
            } else {
                retval = 'Y';
            }
        }
    } else {
        if (fromDb) {
            retval = true;
        } else {
            retval = 'Y';
        }
    }
    
    return retval;
};

