/*
 * Copyright (c) 2019  simplenodeorm.org
 */

const util = require('../main/util.js');

module.exports = function(field, value, fromDb) {
    let retval = value;
    
    if (util.isValidObject(value)) {
        if (fromDb) {
            retval = (value === 'T');
        } else {
            if (value) {
                retval = 'T';
            } else {
                retval = 'F';
            }
        }
    } else {
        if (fromDb) {
            retval = false;
        } else {
            retval = 'N';
        }
    }
    
    return retval;
};

