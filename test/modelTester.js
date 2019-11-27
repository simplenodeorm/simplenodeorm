/*
 * Copyright (c) 2019  simplenodeorm.org
 */

"use strict";

const testUtil = require("./testUtil.js");
const assert = require('chai').assert;

module.exports.test = async function(model, metaData) {
    for (let i = 0; i < metaData.fields.length; ++i) {
        await testFieldDataHandling(model, metaData, metaData.fields[i]);
    }
    
    assert(model.__isModified(), 'expected model to be modified but is not');
    
        // test constraint handling
    model.__enableConstraints(true);
    
    for (let i = 0; i < metaData.fields.length; ++i) {
        await testFieldConstraints(model, metaData, metaData.fields[i]);
    }
    
    model.__enableConstraints(false);

};

async function testFieldConstraints(model, metaData, field) {
    if (field.required) {
        try {
            let nm = testUtil.getSetFunctionName(field);
            await model[nm]();
            assert.fail('No Exception', 'Exception', 'expected ' + metaData.objectName + '.' + testUtil.getSetFunctionName(field) + '  to fail NotNullConstraint and throw Exception but it did not');
        }
        
        catch (e) {
           if (e.name !== 'NotNullConstraint') {
               testUtil.logError('model=' + metaData.objectName + ': ' + e.toString(), e);
               assert.fail('Exception', 'Exception', 'unexpected exception thrown on ' + metaData.objectName + '.' + testUtil.getSetFunctionName(field));
           }
       }
    }
    
    if (metaData.isLengthConstraintRequired(field)) {
        try {
            let len = metaData.getMaxLength(field);
            let nm = testUtil.getSetFunctionName(field);
            await model[nm](testUtil.fillString('x', len+2));
            assert.fail('No Exception', 'Exception', 'expected ' + metaData.objectName + '.' + nm + ' to fail LengthConstraint(' + len + ') and throw Exception but it did not');
        }

        catch (e) {
            if (e.name !== 'LengthConstraint') {
                testUtil.logError('model=' + metaData.objectName + ': ' + e.toString(), e);
                assert.fail('Exception', 'Exception', 'unexpected exception thrown on ' + metaData.objectName + '.' + testUtil.getSetFunctionName(field));
            }
        }
    }
}


async function testFieldDataHandling(model, metaData, field) {
    let testData = testUtil.getTestValue(field);
    let nm = testUtil.getSetFunctionName(field);
    try {
        await model[nm](testData);
        nm = testUtil.getGetFunctionName(field);
        let result = await model[nm]();
        assert(testData === result, metaData.objectName + '.' + testUtil.getSetFunctionName(field) + 'expected to be ' + testData + ' but was ' + result);
    }
    
    catch (e) {
        testUtil.logError('model='+ metaData.objectName + ': ' + e.toString(), e);
        assert.fail('Exception', 'Exception', 'unexpected exception thrown on ' + metaData.objectName + '.' + testUtil.getSetFunctionName(field));
    }
}
