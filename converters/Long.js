const util = require('../main/util.js');

module.exports = function(field, value, fromDb) {
    let retval = value;
    
    if (util.isNumber(value)) {
        retval = Number.parseFloat(value).toFixed(0);
    }
    
    return retval;
};

