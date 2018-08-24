"use strict";

const util = require('./util.js');

/**
 * this object defines one comparison entry for a where clause.
 */
class WhereComparison {
    constructor(fieldName, comparisonValue, comparisonOperator, logicalOperator, useBindParams) {
        this.fieldName = fieldName;
        this.comparisonValue = comparisonValue;
        this.comparisonOperator = comparisonOperator;
        this.openParen = '';
        this.closeParen = '';
        if (util.isDefined(logicalOperator)) {
            this.logicalOperator = logicalOperator;
        } else {
            this.logicalOperator = util.AND;
        }
        
        if (util.isDefined(useBindParams)) {
            this.useBindParams = useBindParams;
        } else {
            this.useBindParams = true;
        }
        
        if (this.isUnaryOperator()) {
            this.useBindParams = false;
            comparisonValue = '';
        }
        
        if (util.IN === comparisonOperator) {
            this.useBindParams = false;
        }
    }

    getFieldName() {
        return this.fieldName;
    }

    getComparisonValue() {
        let retval = '';
        if (util.isDefined(this.comparisonOperator)) {
            if (this.comparisonOperator.trim().toLowerCase() === util.IN) {
                let needQuote = util.isString(this.comparisonValue[0]);
                retval = '(';
                let comma = '';
                for (let i = 0; i < this.comparisonValue.length; ++i) {
                    retval += comma;
                    if (needQuote) {
                        retval += ('\'');
                    }
                    retval += this.comparisonValue[i];

                    if (needQuote) {
                        retval += ('\'');
                    }
                    comma = ',';
                }

                retval += ')';

            } else {
                if (this.useBindParams) {
                    retval = this.comparisonValue;
                } else {
                    let needQuote = util.isString(this.comparisonValue);
                    if (needQuote) {
                        retval += ('\'');
                    }

                    retval += this.comparisonValue;

                    if (needQuote) {
                        retval += ('\'');
                    }
                }
            }
        }
        
        return retval;
    }

    getComparisonOperator() {
        return this.comparisonOperator;
    }
    
    getLogicalOperator() {
        return this.logicalOperator;
    }
    
    setOpenParen(openParen) {
        this.openParen = openParen;
    }

    getOpenParen() {
        return this.openParen;
    }
    
    setCloseParen(closeParen) {
        this.closeParen = closeParen;
    }
    
    getCloseParen() {
        return this.closeParen;
    }
    
    getUseBindParams() {
        return this.useBindParams;
    }
    
    setUseBindParams(useBindParams) {
        this.useBindParams = useBindParams;
    }
    
    isUnaryOperator() {
        let retval = false;
        if (this.comparisonOperator) {
            let o = this.comparisonOperator.trim().toLowerCase();
            retval = ((o === util.NOT_NULL) || (o === util.NULL));
        }
        
        return retval;
    }
};


module.exports.WhereComparison = WhereComparison;

module.exports= function(fieldName, comparisonValue, comparisonOperator, logicalOperator, useBindParams) {
    return new WhereComparison(fieldName, comparisonValue, comparisonOperator, logicalOperator, useBindParams);
};

