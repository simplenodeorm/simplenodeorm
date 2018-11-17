"use strict";

const util = require("../main/util.js");
const testUtil = require("./testUtil.js");
const assert = require('chai').assert;

module.exports.test = function(model, metaData) {
    for (let i = 0; i < metaData.fields.length; ++i) {
        testFieldDataHandlig(model, metaData, metaData.fields[i]);
    }
    
    assert(model.isModified(), 'expected model to be modified but is not');
    
        // test constraint handling
    model.enableConstraints(true);
    
    for (let i = 0; i < metaData.fields.length; ++i) {
        testFieldConstraints(model, metaData, metaData.fields[i]);
    }
    
    model.enableConstraints(false);

};

function testFieldConstraints(model, metaData, field) {
    if (field.required) {
        try {
            let nm = testUtil.getSetFunctionName(field);
            model[nm]();
            assert.fail('No Exception', 'Exception', 'expected Account.setSubFundGrpCd() to fail NotNullConstraint and throw Exception but it did not');
        }
        
        catch (e) {
           if (e.name !== 'NotNullConstraint') {
               throw e;
           }
       }
    }
    
    if (model.isLengthConstraintRequired(field)) {
        try {
            let len = model.getMaxLength(field);
            let nm = testUtil.getSetFunctionName(field);
            model[nm](testUtil.fillString('x', len+2));
            assert.fail('No Exception', 'Exception', 'expected ' + metaData.objectName + '.' + nm + ' to fail LengthConstraint(' + len + ') and throw Exception but it did not');
        }

        catch (e) {
            if (e.name !== 'LengthConstraint') {
                throw e;
            }
        }
    }
}


function testFieldDataHandlig(model, metaData, field) {
    let testData = testUtil.getTestValue(field);
    let nm = testUtil.getSetFunctionName(field);
    model[nm](testData);
    nm = testUtil.getGetFunctionName(field);
    let result = model[nm]();
    assert(testData === result, metaData.objectName + '.' + testUtil.getSetFunctionName(field) + 'expected to be ' + testData + ' but was ' + result);
  
};
