"use strict";

const orm = require('../../../orm.js');
const testUtil = require('../../testUtil.js');
const util = require('../../../main/util.js');
const assert = require('chai').assert;

module.exports.run = function(metaData) {
    let fields = metaData.getFields();

    // test basic data handling
    let model = testDataHandling(metaData, fields);

    // model should be modified now
    assert(model.isModified(), 'expected model to be modified but is not');

    // test constraint handling
    model.enableConstraints(true);
    testConstraints(model, fields);
    model.enableConstraints(false);
};

function testDataHandling(metaData, fields) {
    let retval = require('../../../' + metaData.module)(metaData);
    assert(retval,'unable to create model object of type ' + metaData.getObjectName());

    // field finCoaCd
    let testData = testUtil.getTestValue(fields[0]);
    retval.setFinCoaCd(testData);
    let result = retval.getFinCoaCd();
    assert(testData === result, 'Account.getFinCoaCd() expected to be ' + testData + ' but was ' + result);

    // field accountNbr
    testData = testUtil.getTestValue(fields[1]);
    retval.setAccountNbr(testData);
    result = retval.getAccountNbr();
    assert(testData === result, 'Account.getAccountNbr() expected to be ' + testData + ' but was ' + result);

    // field acCstmIcrexclCd
    testData = testUtil.getTestValue(fields[2]);
    retval.setAcCstmIcrexclCd(testData);
    result = retval.getAcCstmIcrexclCd();
    assert(testData === result, 'Account.getAcCstmIcrexclCd() expected to be ' + testData + ' but was ' + result);

    // field accountNm
    testData = testUtil.getTestValue(fields[3]);
    retval.setAccountNm(testData);
    result = retval.getAccountNm();
    assert(testData === result, 'Account.getAccountNm() expected to be ' + testData + ' but was ' + result);

    // field acctCityNm
    testData = testUtil.getTestValue(fields[4]);
    retval.setAcctCityNm(testData);
    result = retval.getAcctCityNm();
    assert(testData === result, 'Account.getAcctCityNm() expected to be ' + testData + ' but was ' + result);

    // field acctClosedInd
    testData = testUtil.getTestValue(fields[5]);
    retval.setAcctClosedInd(testData);
    result = retval.getAcctClosedInd();
    assert(testData === result, 'Account.getAcctClosedInd() expected to be ' + testData + ' but was ' + result);

    // field acctCreateDt
    testData = testUtil.getTestValue(fields[6]);
    retval.setAcctCreateDt(testData);
    result = retval.getAcctCreateDt();
    assert(testData === result, 'Account.getAcctCreateDt() expected to be ' + testData + ' but was ' + result);

    // field acctEffectDt
    testData = testUtil.getTestValue(fields[7]);
    retval.setAcctEffectDt(testData);
    result = retval.getAcctEffectDt();
    assert(testData === result, 'Account.getAcctEffectDt() expected to be ' + testData + ' but was ' + result);

    // field acctExpirationDt
    testData = testUtil.getTestValue(fields[8]);
    retval.setAcctExpirationDt(testData);
    result = retval.getAcctExpirationDt();
    assert(testData === result, 'Account.getAcctExpirationDt() expected to be ' + testData + ' but was ' + result);

    // field acctFrngBnftCd
    testData = testUtil.getTestValue(fields[9]);
    retval.setAcctFrngBnftCd(testData);
    result = retval.getAcctFrngBnftCd();
    assert(testData === result, 'Account.getAcctFrngBnftCd() expected to be ' + testData + ' but was ' + result);

    // field acctFscOfcUid
    testData = testUtil.getTestValue(fields[10]);
    retval.setAcctFscOfcUid(testData);
    result = retval.getAcctFscOfcUid();
    assert(testData === result, 'Account.getAcctFscOfcUid() expected to be ' + testData + ' but was ' + result);

    // field acctIcrTypCd
    testData = testUtil.getTestValue(fields[11]);
    retval.setAcctIcrTypCd(testData);
    result = retval.getAcctIcrTypCd();
    assert(testData === result, 'Account.getAcctIcrTypCd() expected to be ' + testData + ' but was ' + result);

    // field acctInFpCd
    testData = testUtil.getTestValue(fields[12]);
    retval.setAcctInFpCd(testData);
    result = retval.getAcctInFpCd();
    assert(testData === result, 'Account.getAcctInFpCd() expected to be ' + testData + ' but was ' + result);

    // field acctMgrUnvlId
    testData = testUtil.getTestValue(fields[13]);
    retval.setAcctMgrUnvlId(testData);
    result = retval.getAcctMgrUnvlId();
    assert(testData === result, 'Account.getAcctMgrUnvlId() expected to be ' + testData + ' but was ' + result);

    // field acctOffCmpInd
    testData = testUtil.getTestValue(fields[14]);
    retval.setAcctOffCmpInd(testData);
    result = retval.getAcctOffCmpInd();
    assert(testData === result, 'Account.getAcctOffCmpInd() expected to be ' + testData + ' but was ' + result);

    // field acctPhysCmpCd
    testData = testUtil.getTestValue(fields[15]);
    retval.setAcctPhysCmpCd(testData);
    result = retval.getAcctPhysCmpCd();
    assert(testData === result, 'Account.getAcctPhysCmpCd() expected to be ' + testData + ' but was ' + result);

    // field acctPndSfCd
    testData = testUtil.getTestValue(fields[16]);
    retval.setAcctPndSfCd(testData);
    result = retval.getAcctPndSfCd();
    assert(testData === result, 'Account.getAcctPndSfCd() expected to be ' + testData + ' but was ' + result);

    // field acctRstrcStatCd
    testData = testUtil.getTestValue(fields[17]);
    retval.setAcctRstrcStatCd(testData);
    result = retval.getAcctRstrcStatCd();
    assert(testData === result, 'Account.getAcctRstrcStatCd() expected to be ' + testData + ' but was ' + result);

    // field acctRstrcStatDt
    testData = testUtil.getTestValue(fields[18]);
    retval.setAcctRstrcStatDt(testData);
    result = retval.getAcctRstrcStatDt();
    assert(testData === result, 'Account.getAcctRstrcStatDt() expected to be ' + testData + ' but was ' + result);

    // field acctSfCd
    testData = testUtil.getTestValue(fields[19]);
    retval.setAcctSfCd(testData);
    result = retval.getAcctSfCd();
    assert(testData === result, 'Account.getAcctSfCd() expected to be ' + testData + ' but was ' + result);

    // field acctSpvsrUnvlId
    testData = testUtil.getTestValue(fields[20]);
    retval.setAcctSpvsrUnvlId(testData);
    result = retval.getAcctSpvsrUnvlId();
    assert(testData === result, 'Account.getAcctSpvsrUnvlId() expected to be ' + testData + ' but was ' + result);

    // field acctStateCd
    testData = testUtil.getTestValue(fields[21]);
    retval.setAcctStateCd(testData);
    result = retval.getAcctStateCd();
    assert(testData === result, 'Account.getAcctStateCd() expected to be ' + testData + ' but was ' + result);

    // field acctStreetAddr
    testData = testUtil.getTestValue(fields[22]);
    retval.setAcctStreetAddr(testData);
    result = retval.getAcctStreetAddr();
    assert(testData === result, 'Account.getAcctStreetAddr() expected to be ' + testData + ' but was ' + result);

    // field acctTypCd
    testData = testUtil.getTestValue(fields[23]);
    retval.setAcctTypCd(testData);
    result = retval.getAcctTypCd();
    assert(testData === result, 'Account.getAcctTypCd() expected to be ' + testData + ' but was ' + result);

    // field acctZipCd
    testData = testUtil.getTestValue(fields[24]);
    retval.setAcctZipCd(testData);
    result = retval.getAcctZipCd();
    assert(testData === result, 'Account.getAcctZipCd() expected to be ' + testData + ' but was ' + result);

    // field bdgtRecLvlCd
    testData = testUtil.getTestValue(fields[25]);
    retval.setBdgtRecLvlCd(testData);
    result = retval.getBdgtRecLvlCd();
    assert(testData === result, 'Account.getBdgtRecLvlCd() expected to be ' + testData + ' but was ' + result);

    // field cgAcctRespId
    testData = testUtil.getTestValue(fields[26]);
    retval.setCgAcctRespId(testData);
    result = retval.getCgAcctRespId();
    assert(testData === result, 'Account.getCgAcctRespId() expected to be ' + testData + ' but was ' + result);

    // field cgCfdaNbr
    testData = testUtil.getTestValue(fields[27]);
    retval.setCgCfdaNbr(testData);
    result = retval.getCgCfdaNbr();
    assert(testData === result, 'Account.getCgCfdaNbr() expected to be ' + testData + ' but was ' + result);

    // field contAccountNbr
    testData = testUtil.getTestValue(fields[28]);
    retval.setContAccountNbr(testData);
    result = retval.getContAccountNbr();
    assert(testData === result, 'Account.getContAccountNbr() expected to be ' + testData + ' but was ' + result);

    // field contFinCoaCd
    testData = testUtil.getTestValue(fields[29]);
    retval.setContFinCoaCd(testData);
    result = retval.getContFinCoaCd();
    assert(testData === result, 'Account.getContFinCoaCd() expected to be ' + testData + ' but was ' + result);

    // field contrCtrlFcoaCd
    testData = testUtil.getTestValue(fields[30]);
    retval.setContrCtrlFcoaCd(testData);
    result = retval.getContrCtrlFcoaCd();
    assert(testData === result, 'Account.getContrCtrlFcoaCd() expected to be ' + testData + ' but was ' + result);

    // field contrCtrlacctNbr
    testData = testUtil.getTestValue(fields[31]);
    retval.setContrCtrlacctNbr(testData);
    result = retval.getContrCtrlacctNbr();
    assert(testData === result, 'Account.getContrCtrlacctNbr() expected to be ' + testData + ' but was ' + result);

    // field endowAccountNbr
    testData = testUtil.getTestValue(fields[32]);
    retval.setEndowAccountNbr(testData);
    result = retval.getEndowAccountNbr();
    assert(testData === result, 'Account.getEndowAccountNbr() expected to be ' + testData + ' but was ' + result);

    // field endowFinCoaCd
    testData = testUtil.getTestValue(fields[33]);
    retval.setEndowFinCoaCd(testData);
    result = retval.getEndowFinCoaCd();
    assert(testData === result, 'Account.getEndowFinCoaCd() expected to be ' + testData + ' but was ' + result);

    // field finExtEncSfCd
    testData = testUtil.getTestValue(fields[34]);
    retval.setFinExtEncSfCd(testData);
    result = retval.getFinExtEncSfCd();
    assert(testData === result, 'Account.getFinExtEncSfCd() expected to be ' + testData + ' but was ' + result);

    // field finHghEdFuncCd
    testData = testUtil.getTestValue(fields[35]);
    retval.setFinHghEdFuncCd(testData);
    result = retval.getFinHghEdFuncCd();
    assert(testData === result, 'Account.getFinHghEdFuncCd() expected to be ' + testData + ' but was ' + result);

    // field finIntEncSfCd
    testData = testUtil.getTestValue(fields[36]);
    retval.setFinIntEncSfCd(testData);
    result = retval.getFinIntEncSfCd();
    assert(testData === result, 'Account.getFinIntEncSfCd() expected to be ' + testData + ' but was ' + result);

    // field finObjPrsctrlCd
    testData = testUtil.getTestValue(fields[37]);
    retval.setFinObjPrsctrlCd(testData);
    result = retval.getFinObjPrsctrlCd();
    assert(testData === result, 'Account.getFinObjPrsctrlCd() expected to be ' + testData + ' but was ' + result);

    // field finPreEncSfCd
    testData = testUtil.getTestValue(fields[38]);
    retval.setFinPreEncSfCd(testData);
    result = retval.getFinPreEncSfCd();
    assert(testData === result, 'Account.getFinPreEncSfCd() expected to be ' + testData + ' but was ' + result);

    // field finSeriesId
    testData = testUtil.getTestValue(fields[39]);
    retval.setFinSeriesId(testData);
    result = retval.getFinSeriesId();
    assert(testData === result, 'Account.getFinSeriesId() expected to be ' + testData + ' but was ' + result);

    // field fundsTypeCd
    testData = testUtil.getTestValue(fields[40]);
    retval.setFundsTypeCd(testData);
    result = retval.getFundsTypeCd();
    assert(testData === result, 'Account.getFundsTypeCd() expected to be ' + testData + ' but was ' + result);

    // field icrAccountNbr
    testData = testUtil.getTestValue(fields[41]);
    retval.setIcrAccountNbr(testData);
    result = retval.getIcrAccountNbr();
    assert(testData === result, 'Account.getIcrAccountNbr() expected to be ' + testData + ' but was ' + result);

    // field icrFinCoaCd
    testData = testUtil.getTestValue(fields[42]);
    retval.setIcrFinCoaCd(testData);
    result = retval.getIcrFinCoaCd();
    assert(testData === result, 'Account.getIcrFinCoaCd() expected to be ' + testData + ' but was ' + result);

    // field incomeAccountNbr
    testData = testUtil.getTestValue(fields[43]);
    retval.setIncomeAccountNbr(testData);
    result = retval.getIncomeAccountNbr();
    assert(testData === result, 'Account.getIncomeAccountNbr() expected to be ' + testData + ' but was ' + result);

    // field incomeFinCoaCd
    testData = testUtil.getTestValue(fields[44]);
    retval.setIncomeFinCoaCd(testData);
    result = retval.getIncomeFinCoaCd();
    assert(testData === result, 'Account.getIncomeFinCoaCd() expected to be ' + testData + ' but was ' + result);

    // field lastUpdtTs
    testData = testUtil.getTestValue(fields[45]);
    retval.setLastUpdtTs(testData);
    result = retval.getLastUpdtTs();
    assert(testData === result, 'Account.getLastUpdtTs() expected to be ' + testData + ' but was ' + result);

    // field lbrBenRtCatCd
    testData = testUtil.getTestValue(fields[46]);
    retval.setLbrBenRtCatCd(testData);
    result = retval.getLbrBenRtCatCd();
    assert(testData === result, 'Account.getLbrBenRtCatCd() expected to be ' + testData + ' but was ' + result);

    // field objId
    testData = testUtil.getTestValue(fields[47]);
    retval.setObjId(testData);
    result = retval.getObjId();
    assert(testData === result, 'Account.getObjId() expected to be ' + testData + ' but was ' + result);

    // field orgCd
    testData = testUtil.getTestValue(fields[48]);
    retval.setOrgCd(testData);
    result = retval.getOrgCd();
    assert(testData === result, 'Account.getOrgCd() expected to be ' + testData + ' but was ' + result);

    // field rptsToAcctNbr
    testData = testUtil.getTestValue(fields[49]);
    retval.setRptsToAcctNbr(testData);
    result = retval.getRptsToAcctNbr();
    assert(testData === result, 'Account.getRptsToAcctNbr() expected to be ' + testData + ' but was ' + result);

    // field rptsToFinCoaCd
    testData = testUtil.getTestValue(fields[50]);
    retval.setRptsToFinCoaCd(testData);
    result = retval.getRptsToFinCoaCd();
    assert(testData === result, 'Account.getRptsToFinCoaCd() expected to be ' + testData + ' but was ' + result);

    // field subFundGrpCd
    testData = testUtil.getTestValue(fields[51]);
    retval.setSubFundGrpCd(testData);
    result = retval.getSubFundGrpCd();
    assert(testData === result, 'Account.getSubFundGrpCd() expected to be ' + testData + ' but was ' + result);

    // field verNbr
    testData = testUtil.getTestValue(fields[52]);
    retval.setVerNbr(testData);
    result = retval.getVerNbr();
    assert(testData === result, 'Account.getVerNbr() expected to be ' + testData + ' but was ' + result);
    return retval;
};

function testConstraints(model, fields) {
    // test not null constraint

    // field finCoaCd
    try {
        model.setFinCoaCd();
        if (fields[0].required) {
            assert.fail('No Exception', 'Exception', 'expected Account.setFinCoaCd() to fail NotNullConstraint and throw Exception but it did not');
        }
    }

     catch (e) {
        if ((e.name !== 'NotNullConstraint') ||  !fields[0].required) {
            throw e;
        }
    }

    // field accountNbr
    try {
        model.setAccountNbr();
        if (fields[1].required) {
            assert.fail('No Exception', 'Exception', 'expected Account.setAccountNbr() to fail NotNullConstraint and throw Exception but it did not');
        }
    }

     catch (e) {
        if ((e.name !== 'NotNullConstraint') ||  !fields[1].required) {
            throw e;
        }
    }

    // field acCstmIcrexclCd
    try {
        model.setAcCstmIcrexclCd();
        if (fields[2].required) {
            assert.fail('No Exception', 'Exception', 'expected Account.setAcCstmIcrexclCd() to fail NotNullConstraint and throw Exception but it did not');
        }
    }

     catch (e) {
        if ((e.name !== 'NotNullConstraint') ||  !fields[2].required) {
            throw e;
        }
    }

    // field accountNm
    try {
        model.setAccountNm();
        if (fields[3].required) {
            assert.fail('No Exception', 'Exception', 'expected Account.setAccountNm() to fail NotNullConstraint and throw Exception but it did not');
        }
    }

     catch (e) {
        if ((e.name !== 'NotNullConstraint') ||  !fields[3].required) {
            throw e;
        }
    }

    // field acctCityNm
    try {
        model.setAcctCityNm();
        if (fields[4].required) {
            assert.fail('No Exception', 'Exception', 'expected Account.setAcctCityNm() to fail NotNullConstraint and throw Exception but it did not');
        }
    }

     catch (e) {
        if ((e.name !== 'NotNullConstraint') ||  !fields[4].required) {
            throw e;
        }
    }

    // field acctClosedInd
    try {
        model.setAcctClosedInd();
        if (fields[5].required) {
            assert.fail('No Exception', 'Exception', 'expected Account.setAcctClosedInd() to fail NotNullConstraint and throw Exception but it did not');
        }
    }

     catch (e) {
        if ((e.name !== 'NotNullConstraint') ||  !fields[5].required) {
            throw e;
        }
    }

    // field acctCreateDt
    try {
        model.setAcctCreateDt();
        if (fields[6].required) {
            assert.fail('No Exception', 'Exception', 'expected Account.setAcctCreateDt() to fail NotNullConstraint and throw Exception but it did not');
        }
    }

     catch (e) {
        if ((e.name !== 'NotNullConstraint') ||  !fields[6].required) {
            throw e;
        }
    }

    // field acctEffectDt
    try {
        model.setAcctEffectDt();
        if (fields[7].required) {
            assert.fail('No Exception', 'Exception', 'expected Account.setAcctEffectDt() to fail NotNullConstraint and throw Exception but it did not');
        }
    }

     catch (e) {
        if ((e.name !== 'NotNullConstraint') ||  !fields[7].required) {
            throw e;
        }
    }

    // field acctExpirationDt
    try {
        model.setAcctExpirationDt();
        if (fields[8].required) {
            assert.fail('No Exception', 'Exception', 'expected Account.setAcctExpirationDt() to fail NotNullConstraint and throw Exception but it did not');
        }
    }

     catch (e) {
        if ((e.name !== 'NotNullConstraint') ||  !fields[8].required) {
            throw e;
        }
    }

    // field acctFrngBnftCd
    try {
        model.setAcctFrngBnftCd();
        if (fields[9].required) {
            assert.fail('No Exception', 'Exception', 'expected Account.setAcctFrngBnftCd() to fail NotNullConstraint and throw Exception but it did not');
        }
    }

     catch (e) {
        if ((e.name !== 'NotNullConstraint') ||  !fields[9].required) {
            throw e;
        }
    }

    // field acctFscOfcUid
    try {
        model.setAcctFscOfcUid();
        if (fields[10].required) {
            assert.fail('No Exception', 'Exception', 'expected Account.setAcctFscOfcUid() to fail NotNullConstraint and throw Exception but it did not');
        }
    }

     catch (e) {
        if ((e.name !== 'NotNullConstraint') ||  !fields[10].required) {
            throw e;
        }
    }

    // field acctIcrTypCd
    try {
        model.setAcctIcrTypCd();
        if (fields[11].required) {
            assert.fail('No Exception', 'Exception', 'expected Account.setAcctIcrTypCd() to fail NotNullConstraint and throw Exception but it did not');
        }
    }

     catch (e) {
        if ((e.name !== 'NotNullConstraint') ||  !fields[11].required) {
            throw e;
        }
    }

    // field acctInFpCd
    try {
        model.setAcctInFpCd();
        if (fields[12].required) {
            assert.fail('No Exception', 'Exception', 'expected Account.setAcctInFpCd() to fail NotNullConstraint and throw Exception but it did not');
        }
    }

     catch (e) {
        if ((e.name !== 'NotNullConstraint') ||  !fields[12].required) {
            throw e;
        }
    }

    // field acctMgrUnvlId
    try {
        model.setAcctMgrUnvlId();
        if (fields[13].required) {
            assert.fail('No Exception', 'Exception', 'expected Account.setAcctMgrUnvlId() to fail NotNullConstraint and throw Exception but it did not');
        }
    }

     catch (e) {
        if ((e.name !== 'NotNullConstraint') ||  !fields[13].required) {
            throw e;
        }
    }

    // field acctOffCmpInd
    try {
        model.setAcctOffCmpInd();
        if (fields[14].required) {
            assert.fail('No Exception', 'Exception', 'expected Account.setAcctOffCmpInd() to fail NotNullConstraint and throw Exception but it did not');
        }
    }

     catch (e) {
        if ((e.name !== 'NotNullConstraint') ||  !fields[14].required) {
            throw e;
        }
    }

    // field acctPhysCmpCd
    try {
        model.setAcctPhysCmpCd();
        if (fields[15].required) {
            assert.fail('No Exception', 'Exception', 'expected Account.setAcctPhysCmpCd() to fail NotNullConstraint and throw Exception but it did not');
        }
    }

     catch (e) {
        if ((e.name !== 'NotNullConstraint') ||  !fields[15].required) {
            throw e;
        }
    }

    // field acctPndSfCd
    try {
        model.setAcctPndSfCd();
        if (fields[16].required) {
            assert.fail('No Exception', 'Exception', 'expected Account.setAcctPndSfCd() to fail NotNullConstraint and throw Exception but it did not');
        }
    }

     catch (e) {
        if ((e.name !== 'NotNullConstraint') ||  !fields[16].required) {
            throw e;
        }
    }

    // field acctRstrcStatCd
    try {
        model.setAcctRstrcStatCd();
        if (fields[17].required) {
            assert.fail('No Exception', 'Exception', 'expected Account.setAcctRstrcStatCd() to fail NotNullConstraint and throw Exception but it did not');
        }
    }

     catch (e) {
        if ((e.name !== 'NotNullConstraint') ||  !fields[17].required) {
            throw e;
        }
    }

    // field acctRstrcStatDt
    try {
        model.setAcctRstrcStatDt();
        if (fields[18].required) {
            assert.fail('No Exception', 'Exception', 'expected Account.setAcctRstrcStatDt() to fail NotNullConstraint and throw Exception but it did not');
        }
    }

     catch (e) {
        if ((e.name !== 'NotNullConstraint') ||  !fields[18].required) {
            throw e;
        }
    }

    // field acctSfCd
    try {
        model.setAcctSfCd();
        if (fields[19].required) {
            assert.fail('No Exception', 'Exception', 'expected Account.setAcctSfCd() to fail NotNullConstraint and throw Exception but it did not');
        }
    }

     catch (e) {
        if ((e.name !== 'NotNullConstraint') ||  !fields[19].required) {
            throw e;
        }
    }

    // field acctSpvsrUnvlId
    try {
        model.setAcctSpvsrUnvlId();
        if (fields[20].required) {
            assert.fail('No Exception', 'Exception', 'expected Account.setAcctSpvsrUnvlId() to fail NotNullConstraint and throw Exception but it did not');
        }
    }

     catch (e) {
        if ((e.name !== 'NotNullConstraint') ||  !fields[20].required) {
            throw e;
        }
    }

    // field acctStateCd
    try {
        model.setAcctStateCd();
        if (fields[21].required) {
            assert.fail('No Exception', 'Exception', 'expected Account.setAcctStateCd() to fail NotNullConstraint and throw Exception but it did not');
        }
    }

     catch (e) {
        if ((e.name !== 'NotNullConstraint') ||  !fields[21].required) {
            throw e;
        }
    }

    // field acctStreetAddr
    try {
        model.setAcctStreetAddr();
        if (fields[22].required) {
            assert.fail('No Exception', 'Exception', 'expected Account.setAcctStreetAddr() to fail NotNullConstraint and throw Exception but it did not');
        }
    }

     catch (e) {
        if ((e.name !== 'NotNullConstraint') ||  !fields[22].required) {
            throw e;
        }
    }

    // field acctTypCd
    try {
        model.setAcctTypCd();
        if (fields[23].required) {
            assert.fail('No Exception', 'Exception', 'expected Account.setAcctTypCd() to fail NotNullConstraint and throw Exception but it did not');
        }
    }

     catch (e) {
        if ((e.name !== 'NotNullConstraint') ||  !fields[23].required) {
            throw e;
        }
    }

    // field acctZipCd
    try {
        model.setAcctZipCd();
        if (fields[24].required) {
            assert.fail('No Exception', 'Exception', 'expected Account.setAcctZipCd() to fail NotNullConstraint and throw Exception but it did not');
        }
    }

     catch (e) {
        if ((e.name !== 'NotNullConstraint') ||  !fields[24].required) {
            throw e;
        }
    }

    // field bdgtRecLvlCd
    try {
        model.setBdgtRecLvlCd();
        if (fields[25].required) {
            assert.fail('No Exception', 'Exception', 'expected Account.setBdgtRecLvlCd() to fail NotNullConstraint and throw Exception but it did not');
        }
    }

     catch (e) {
        if ((e.name !== 'NotNullConstraint') ||  !fields[25].required) {
            throw e;
        }
    }

    // field cgAcctRespId
    try {
        model.setCgAcctRespId();
        if (fields[26].required) {
            assert.fail('No Exception', 'Exception', 'expected Account.setCgAcctRespId() to fail NotNullConstraint and throw Exception but it did not');
        }
    }

     catch (e) {
        if ((e.name !== 'NotNullConstraint') ||  !fields[26].required) {
            throw e;
        }
    }

    // field cgCfdaNbr
    try {
        model.setCgCfdaNbr();
        if (fields[27].required) {
            assert.fail('No Exception', 'Exception', 'expected Account.setCgCfdaNbr() to fail NotNullConstraint and throw Exception but it did not');
        }
    }

     catch (e) {
        if ((e.name !== 'NotNullConstraint') ||  !fields[27].required) {
            throw e;
        }
    }

    // field contAccountNbr
    try {
        model.setContAccountNbr();
        if (fields[28].required) {
            assert.fail('No Exception', 'Exception', 'expected Account.setContAccountNbr() to fail NotNullConstraint and throw Exception but it did not');
        }
    }

     catch (e) {
        if ((e.name !== 'NotNullConstraint') ||  !fields[28].required) {
            throw e;
        }
    }

    // field contFinCoaCd
    try {
        model.setContFinCoaCd();
        if (fields[29].required) {
            assert.fail('No Exception', 'Exception', 'expected Account.setContFinCoaCd() to fail NotNullConstraint and throw Exception but it did not');
        }
    }

     catch (e) {
        if ((e.name !== 'NotNullConstraint') ||  !fields[29].required) {
            throw e;
        }
    }

    // field contrCtrlFcoaCd
    try {
        model.setContrCtrlFcoaCd();
        if (fields[30].required) {
            assert.fail('No Exception', 'Exception', 'expected Account.setContrCtrlFcoaCd() to fail NotNullConstraint and throw Exception but it did not');
        }
    }

     catch (e) {
        if ((e.name !== 'NotNullConstraint') ||  !fields[30].required) {
            throw e;
        }
    }

    // field contrCtrlacctNbr
    try {
        model.setContrCtrlacctNbr();
        if (fields[31].required) {
            assert.fail('No Exception', 'Exception', 'expected Account.setContrCtrlacctNbr() to fail NotNullConstraint and throw Exception but it did not');
        }
    }

     catch (e) {
        if ((e.name !== 'NotNullConstraint') ||  !fields[31].required) {
            throw e;
        }
    }

    // field endowAccountNbr
    try {
        model.setEndowAccountNbr();
        if (fields[32].required) {
            assert.fail('No Exception', 'Exception', 'expected Account.setEndowAccountNbr() to fail NotNullConstraint and throw Exception but it did not');
        }
    }

     catch (e) {
        if ((e.name !== 'NotNullConstraint') ||  !fields[32].required) {
            throw e;
        }
    }

    // field endowFinCoaCd
    try {
        model.setEndowFinCoaCd();
        if (fields[33].required) {
            assert.fail('No Exception', 'Exception', 'expected Account.setEndowFinCoaCd() to fail NotNullConstraint and throw Exception but it did not');
        }
    }

     catch (e) {
        if ((e.name !== 'NotNullConstraint') ||  !fields[33].required) {
            throw e;
        }
    }

    // field finExtEncSfCd
    try {
        model.setFinExtEncSfCd();
        if (fields[34].required) {
            assert.fail('No Exception', 'Exception', 'expected Account.setFinExtEncSfCd() to fail NotNullConstraint and throw Exception but it did not');
        }
    }

     catch (e) {
        if ((e.name !== 'NotNullConstraint') ||  !fields[34].required) {
            throw e;
        }
    }

    // field finHghEdFuncCd
    try {
        model.setFinHghEdFuncCd();
        if (fields[35].required) {
            assert.fail('No Exception', 'Exception', 'expected Account.setFinHghEdFuncCd() to fail NotNullConstraint and throw Exception but it did not');
        }
    }

     catch (e) {
        if ((e.name !== 'NotNullConstraint') ||  !fields[35].required) {
            throw e;
        }
    }

    // field finIntEncSfCd
    try {
        model.setFinIntEncSfCd();
        if (fields[36].required) {
            assert.fail('No Exception', 'Exception', 'expected Account.setFinIntEncSfCd() to fail NotNullConstraint and throw Exception but it did not');
        }
    }

     catch (e) {
        if ((e.name !== 'NotNullConstraint') ||  !fields[36].required) {
            throw e;
        }
    }

    // field finObjPrsctrlCd
    try {
        model.setFinObjPrsctrlCd();
        if (fields[37].required) {
            assert.fail('No Exception', 'Exception', 'expected Account.setFinObjPrsctrlCd() to fail NotNullConstraint and throw Exception but it did not');
        }
    }

     catch (e) {
        if ((e.name !== 'NotNullConstraint') ||  !fields[37].required) {
            throw e;
        }
    }

    // field finPreEncSfCd
    try {
        model.setFinPreEncSfCd();
        if (fields[38].required) {
            assert.fail('No Exception', 'Exception', 'expected Account.setFinPreEncSfCd() to fail NotNullConstraint and throw Exception but it did not');
        }
    }

     catch (e) {
        if ((e.name !== 'NotNullConstraint') ||  !fields[38].required) {
            throw e;
        }
    }

    // field finSeriesId
    try {
        model.setFinSeriesId();
        if (fields[39].required) {
            assert.fail('No Exception', 'Exception', 'expected Account.setFinSeriesId() to fail NotNullConstraint and throw Exception but it did not');
        }
    }

     catch (e) {
        if ((e.name !== 'NotNullConstraint') ||  !fields[39].required) {
            throw e;
        }
    }

    // field fundsTypeCd
    try {
        model.setFundsTypeCd();
        if (fields[40].required) {
            assert.fail('No Exception', 'Exception', 'expected Account.setFundsTypeCd() to fail NotNullConstraint and throw Exception but it did not');
        }
    }

     catch (e) {
        if ((e.name !== 'NotNullConstraint') ||  !fields[40].required) {
            throw e;
        }
    }

    // field icrAccountNbr
    try {
        model.setIcrAccountNbr();
        if (fields[41].required) {
            assert.fail('No Exception', 'Exception', 'expected Account.setIcrAccountNbr() to fail NotNullConstraint and throw Exception but it did not');
        }
    }

     catch (e) {
        if ((e.name !== 'NotNullConstraint') ||  !fields[41].required) {
            throw e;
        }
    }

    // field icrFinCoaCd
    try {
        model.setIcrFinCoaCd();
        if (fields[42].required) {
            assert.fail('No Exception', 'Exception', 'expected Account.setIcrFinCoaCd() to fail NotNullConstraint and throw Exception but it did not');
        }
    }

     catch (e) {
        if ((e.name !== 'NotNullConstraint') ||  !fields[42].required) {
            throw e;
        }
    }

    // field incomeAccountNbr
    try {
        model.setIncomeAccountNbr();
        if (fields[43].required) {
            assert.fail('No Exception', 'Exception', 'expected Account.setIncomeAccountNbr() to fail NotNullConstraint and throw Exception but it did not');
        }
    }

     catch (e) {
        if ((e.name !== 'NotNullConstraint') ||  !fields[43].required) {
            throw e;
        }
    }

    // field incomeFinCoaCd
    try {
        model.setIncomeFinCoaCd();
        if (fields[44].required) {
            assert.fail('No Exception', 'Exception', 'expected Account.setIncomeFinCoaCd() to fail NotNullConstraint and throw Exception but it did not');
        }
    }

     catch (e) {
        if ((e.name !== 'NotNullConstraint') ||  !fields[44].required) {
            throw e;
        }
    }

    // field lastUpdtTs
    try {
        model.setLastUpdtTs();
        if (fields[45].required) {
            assert.fail('No Exception', 'Exception', 'expected Account.setLastUpdtTs() to fail NotNullConstraint and throw Exception but it did not');
        }
    }

     catch (e) {
        if ((e.name !== 'NotNullConstraint') ||  !fields[45].required) {
            throw e;
        }
    }

    // field lbrBenRtCatCd
    try {
        model.setLbrBenRtCatCd();
        if (fields[46].required) {
            assert.fail('No Exception', 'Exception', 'expected Account.setLbrBenRtCatCd() to fail NotNullConstraint and throw Exception but it did not');
        }
    }

     catch (e) {
        if ((e.name !== 'NotNullConstraint') ||  !fields[46].required) {
            throw e;
        }
    }

    // field objId
    try {
        model.setObjId();
        if (fields[47].required) {
            assert.fail('No Exception', 'Exception', 'expected Account.setObjId() to fail NotNullConstraint and throw Exception but it did not');
        }
    }

     catch (e) {
        if ((e.name !== 'NotNullConstraint') ||  !fields[47].required) {
            throw e;
        }
    }

    // field orgCd
    try {
        model.setOrgCd();
        if (fields[48].required) {
            assert.fail('No Exception', 'Exception', 'expected Account.setOrgCd() to fail NotNullConstraint and throw Exception but it did not');
        }
    }

     catch (e) {
        if ((e.name !== 'NotNullConstraint') ||  !fields[48].required) {
            throw e;
        }
    }

    // field rptsToAcctNbr
    try {
        model.setRptsToAcctNbr();
        if (fields[49].required) {
            assert.fail('No Exception', 'Exception', 'expected Account.setRptsToAcctNbr() to fail NotNullConstraint and throw Exception but it did not');
        }
    }

     catch (e) {
        if ((e.name !== 'NotNullConstraint') ||  !fields[49].required) {
            throw e;
        }
    }

    // field rptsToFinCoaCd
    try {
        model.setRptsToFinCoaCd();
        if (fields[50].required) {
            assert.fail('No Exception', 'Exception', 'expected Account.setRptsToFinCoaCd() to fail NotNullConstraint and throw Exception but it did not');
        }
    }

     catch (e) {
        if ((e.name !== 'NotNullConstraint') ||  !fields[50].required) {
            throw e;
        }
    }

    // field subFundGrpCd
    try {
        model.setSubFundGrpCd();
        if (fields[51].required) {
            assert.fail('No Exception', 'Exception', 'expected Account.setSubFundGrpCd() to fail NotNullConstraint and throw Exception but it did not');
        }
    }

     catch (e) {
        if ((e.name !== 'NotNullConstraint') ||  !fields[51].required) {
            throw e;
        }
    }

    // field verNbr
    try {
        model.setVerNbr();
        if (fields[52].required) {
            assert.fail('No Exception', 'Exception', 'expected Account.setVerNbr() to fail NotNullConstraint and throw Exception but it did not');
        }
    }

     catch (e) {
        if ((e.name !== 'NotNullConstraint') ||  !fields[52].required) {
            throw e;
        }
    }

    // test length constraint

    // field finCoaCd
    assert(model.isLengthConstraintRequired(fields[0]), 'expected ' + fields[0].fieldName + '  to require LengthConstraint but it did not');
    assert(fields[0].fieldName === 'finCoaCd', 'expected length contraint field name to be finCoaCd but was ' + fields[0].fieldName);
    try {
        let len = model.getMaxLength(fields[0]);
        model.setFinCoaCd(testUtil.fillString('x', len+2));
        assert.fail('No Exception', 'Exception', 'expected Account.setFinCoaCd() to fail LengthConstraint(' + len + ') and throw Exception but it did not');
    }

    catch (e) {
        if (e.name !== 'LengthConstraint') {
            throw e;
        }
    }

    // field accountNbr
    assert(model.isLengthConstraintRequired(fields[1]), 'expected ' + fields[1].fieldName + '  to require LengthConstraint but it did not');
    assert(fields[1].fieldName === 'accountNbr', 'expected length contraint field name to be accountNbr but was ' + fields[1].fieldName);
    try {
        let len = model.getMaxLength(fields[1]);
        model.setAccountNbr(testUtil.fillString('x', len+2));
        assert.fail('No Exception', 'Exception', 'expected Account.setAccountNbr() to fail LengthConstraint(' + len + ') and throw Exception but it did not');
    }

    catch (e) {
        if (e.name !== 'LengthConstraint') {
            throw e;
        }
    }

    // field acCstmIcrexclCd
    assert(model.isLengthConstraintRequired(fields[2]), 'expected ' + fields[2].fieldName + '  to require LengthConstraint but it did not');
    assert(fields[2].fieldName === 'acCstmIcrexclCd', 'expected length contraint field name to be acCstmIcrexclCd but was ' + fields[2].fieldName);
    try {
        let len = model.getMaxLength(fields[2]);
        model.setAcCstmIcrexclCd(testUtil.fillString('x', len+2));
        assert.fail('No Exception', 'Exception', 'expected Account.setAcCstmIcrexclCd() to fail LengthConstraint(' + len + ') and throw Exception but it did not');
    }

    catch (e) {
        if (e.name !== 'LengthConstraint') {
            throw e;
        }
    }

    // field accountNm
    assert(model.isLengthConstraintRequired(fields[3]), 'expected ' + fields[3].fieldName + '  to require LengthConstraint but it did not');
    assert(fields[3].fieldName === 'accountNm', 'expected length contraint field name to be accountNm but was ' + fields[3].fieldName);
    try {
        let len = model.getMaxLength(fields[3]);
        model.setAccountNm(testUtil.fillString('x', len+2));
        assert.fail('No Exception', 'Exception', 'expected Account.setAccountNm() to fail LengthConstraint(' + len + ') and throw Exception but it did not');
    }

    catch (e) {
        if (e.name !== 'LengthConstraint') {
            throw e;
        }
    }

    // field acctCityNm
    assert(model.isLengthConstraintRequired(fields[4]), 'expected ' + fields[4].fieldName + '  to require LengthConstraint but it did not');
    assert(fields[4].fieldName === 'acctCityNm', 'expected length contraint field name to be acctCityNm but was ' + fields[4].fieldName);
    try {
        let len = model.getMaxLength(fields[4]);
        model.setAcctCityNm(testUtil.fillString('x', len+2));
        assert.fail('No Exception', 'Exception', 'expected Account.setAcctCityNm() to fail LengthConstraint(' + len + ') and throw Exception but it did not');
    }

    catch (e) {
        if (e.name !== 'LengthConstraint') {
            throw e;
        }
    }

    // field acctClosedInd
    assert(model.isLengthConstraintRequired(fields[5]), 'expected ' + fields[5].fieldName + '  to require LengthConstraint but it did not');
    assert(fields[5].fieldName === 'acctClosedInd', 'expected length contraint field name to be acctClosedInd but was ' + fields[5].fieldName);
    try {
        let len = model.getMaxLength(fields[5]);
        model.setAcctClosedInd(testUtil.fillString('x', len+2));
        assert.fail('No Exception', 'Exception', 'expected Account.setAcctClosedInd() to fail LengthConstraint(' + len + ') and throw Exception but it did not');
    }

    catch (e) {
        if (e.name !== 'LengthConstraint') {
            throw e;
        }
    }

    // field acctFrngBnftCd
    assert(model.isLengthConstraintRequired(fields[9]), 'expected ' + fields[9].fieldName + '  to require LengthConstraint but it did not');
    assert(fields[9].fieldName === 'acctFrngBnftCd', 'expected length contraint field name to be acctFrngBnftCd but was ' + fields[9].fieldName);
    try {
        let len = model.getMaxLength(fields[9]);
        model.setAcctFrngBnftCd(testUtil.fillString('x', len+2));
        assert.fail('No Exception', 'Exception', 'expected Account.setAcctFrngBnftCd() to fail LengthConstraint(' + len + ') and throw Exception but it did not');
    }

    catch (e) {
        if (e.name !== 'LengthConstraint') {
            throw e;
        }
    }

    // field acctFscOfcUid
    assert(model.isLengthConstraintRequired(fields[10]), 'expected ' + fields[10].fieldName + '  to require LengthConstraint but it did not');
    assert(fields[10].fieldName === 'acctFscOfcUid', 'expected length contraint field name to be acctFscOfcUid but was ' + fields[10].fieldName);
    try {
        let len = model.getMaxLength(fields[10]);
        model.setAcctFscOfcUid(testUtil.fillString('x', len+2));
        assert.fail('No Exception', 'Exception', 'expected Account.setAcctFscOfcUid() to fail LengthConstraint(' + len + ') and throw Exception but it did not');
    }

    catch (e) {
        if (e.name !== 'LengthConstraint') {
            throw e;
        }
    }

    // field acctIcrTypCd
    assert(model.isLengthConstraintRequired(fields[11]), 'expected ' + fields[11].fieldName + '  to require LengthConstraint but it did not');
    assert(fields[11].fieldName === 'acctIcrTypCd', 'expected length contraint field name to be acctIcrTypCd but was ' + fields[11].fieldName);
    try {
        let len = model.getMaxLength(fields[11]);
        model.setAcctIcrTypCd(testUtil.fillString('x', len+2));
        assert.fail('No Exception', 'Exception', 'expected Account.setAcctIcrTypCd() to fail LengthConstraint(' + len + ') and throw Exception but it did not');
    }

    catch (e) {
        if (e.name !== 'LengthConstraint') {
            throw e;
        }
    }

    // field acctInFpCd
    assert(model.isLengthConstraintRequired(fields[12]), 'expected ' + fields[12].fieldName + '  to require LengthConstraint but it did not');
    assert(fields[12].fieldName === 'acctInFpCd', 'expected length contraint field name to be acctInFpCd but was ' + fields[12].fieldName);
    try {
        let len = model.getMaxLength(fields[12]);
        model.setAcctInFpCd(testUtil.fillString('x', len+2));
        assert.fail('No Exception', 'Exception', 'expected Account.setAcctInFpCd() to fail LengthConstraint(' + len + ') and throw Exception but it did not');
    }

    catch (e) {
        if (e.name !== 'LengthConstraint') {
            throw e;
        }
    }

    // field acctMgrUnvlId
    assert(model.isLengthConstraintRequired(fields[13]), 'expected ' + fields[13].fieldName + '  to require LengthConstraint but it did not');
    assert(fields[13].fieldName === 'acctMgrUnvlId', 'expected length contraint field name to be acctMgrUnvlId but was ' + fields[13].fieldName);
    try {
        let len = model.getMaxLength(fields[13]);
        model.setAcctMgrUnvlId(testUtil.fillString('x', len+2));
        assert.fail('No Exception', 'Exception', 'expected Account.setAcctMgrUnvlId() to fail LengthConstraint(' + len + ') and throw Exception but it did not');
    }

    catch (e) {
        if (e.name !== 'LengthConstraint') {
            throw e;
        }
    }

    // field acctOffCmpInd
    assert(model.isLengthConstraintRequired(fields[14]), 'expected ' + fields[14].fieldName + '  to require LengthConstraint but it did not');
    assert(fields[14].fieldName === 'acctOffCmpInd', 'expected length contraint field name to be acctOffCmpInd but was ' + fields[14].fieldName);
    try {
        let len = model.getMaxLength(fields[14]);
        model.setAcctOffCmpInd(testUtil.fillString('x', len+2));
        assert.fail('No Exception', 'Exception', 'expected Account.setAcctOffCmpInd() to fail LengthConstraint(' + len + ') and throw Exception but it did not');
    }

    catch (e) {
        if (e.name !== 'LengthConstraint') {
            throw e;
        }
    }

    // field acctPhysCmpCd
    assert(model.isLengthConstraintRequired(fields[15]), 'expected ' + fields[15].fieldName + '  to require LengthConstraint but it did not');
    assert(fields[15].fieldName === 'acctPhysCmpCd', 'expected length contraint field name to be acctPhysCmpCd but was ' + fields[15].fieldName);
    try {
        let len = model.getMaxLength(fields[15]);
        model.setAcctPhysCmpCd(testUtil.fillString('x', len+2));
        assert.fail('No Exception', 'Exception', 'expected Account.setAcctPhysCmpCd() to fail LengthConstraint(' + len + ') and throw Exception but it did not');
    }

    catch (e) {
        if (e.name !== 'LengthConstraint') {
            throw e;
        }
    }

    // field acctPndSfCd
    assert(model.isLengthConstraintRequired(fields[16]), 'expected ' + fields[16].fieldName + '  to require LengthConstraint but it did not');
    assert(fields[16].fieldName === 'acctPndSfCd', 'expected length contraint field name to be acctPndSfCd but was ' + fields[16].fieldName);
    try {
        let len = model.getMaxLength(fields[16]);
        model.setAcctPndSfCd(testUtil.fillString('x', len+2));
        assert.fail('No Exception', 'Exception', 'expected Account.setAcctPndSfCd() to fail LengthConstraint(' + len + ') and throw Exception but it did not');
    }

    catch (e) {
        if (e.name !== 'LengthConstraint') {
            throw e;
        }
    }

    // field acctRstrcStatCd
    assert(model.isLengthConstraintRequired(fields[17]), 'expected ' + fields[17].fieldName + '  to require LengthConstraint but it did not');
    assert(fields[17].fieldName === 'acctRstrcStatCd', 'expected length contraint field name to be acctRstrcStatCd but was ' + fields[17].fieldName);
    try {
        let len = model.getMaxLength(fields[17]);
        model.setAcctRstrcStatCd(testUtil.fillString('x', len+2));
        assert.fail('No Exception', 'Exception', 'expected Account.setAcctRstrcStatCd() to fail LengthConstraint(' + len + ') and throw Exception but it did not');
    }

    catch (e) {
        if (e.name !== 'LengthConstraint') {
            throw e;
        }
    }

    // field acctSfCd
    assert(model.isLengthConstraintRequired(fields[19]), 'expected ' + fields[19].fieldName + '  to require LengthConstraint but it did not');
    assert(fields[19].fieldName === 'acctSfCd', 'expected length contraint field name to be acctSfCd but was ' + fields[19].fieldName);
    try {
        let len = model.getMaxLength(fields[19]);
        model.setAcctSfCd(testUtil.fillString('x', len+2));
        assert.fail('No Exception', 'Exception', 'expected Account.setAcctSfCd() to fail LengthConstraint(' + len + ') and throw Exception but it did not');
    }

    catch (e) {
        if (e.name !== 'LengthConstraint') {
            throw e;
        }
    }

    // field acctSpvsrUnvlId
    assert(model.isLengthConstraintRequired(fields[20]), 'expected ' + fields[20].fieldName + '  to require LengthConstraint but it did not');
    assert(fields[20].fieldName === 'acctSpvsrUnvlId', 'expected length contraint field name to be acctSpvsrUnvlId but was ' + fields[20].fieldName);
    try {
        let len = model.getMaxLength(fields[20]);
        model.setAcctSpvsrUnvlId(testUtil.fillString('x', len+2));
        assert.fail('No Exception', 'Exception', 'expected Account.setAcctSpvsrUnvlId() to fail LengthConstraint(' + len + ') and throw Exception but it did not');
    }

    catch (e) {
        if (e.name !== 'LengthConstraint') {
            throw e;
        }
    }

    // field acctStateCd
    assert(model.isLengthConstraintRequired(fields[21]), 'expected ' + fields[21].fieldName + '  to require LengthConstraint but it did not');
    assert(fields[21].fieldName === 'acctStateCd', 'expected length contraint field name to be acctStateCd but was ' + fields[21].fieldName);
    try {
        let len = model.getMaxLength(fields[21]);
        model.setAcctStateCd(testUtil.fillString('x', len+2));
        assert.fail('No Exception', 'Exception', 'expected Account.setAcctStateCd() to fail LengthConstraint(' + len + ') and throw Exception but it did not');
    }

    catch (e) {
        if (e.name !== 'LengthConstraint') {
            throw e;
        }
    }

    // field acctStreetAddr
    assert(model.isLengthConstraintRequired(fields[22]), 'expected ' + fields[22].fieldName + '  to require LengthConstraint but it did not');
    assert(fields[22].fieldName === 'acctStreetAddr', 'expected length contraint field name to be acctStreetAddr but was ' + fields[22].fieldName);
    try {
        let len = model.getMaxLength(fields[22]);
        model.setAcctStreetAddr(testUtil.fillString('x', len+2));
        assert.fail('No Exception', 'Exception', 'expected Account.setAcctStreetAddr() to fail LengthConstraint(' + len + ') and throw Exception but it did not');
    }

    catch (e) {
        if (e.name !== 'LengthConstraint') {
            throw e;
        }
    }

    // field acctTypCd
    assert(model.isLengthConstraintRequired(fields[23]), 'expected ' + fields[23].fieldName + '  to require LengthConstraint but it did not');
    assert(fields[23].fieldName === 'acctTypCd', 'expected length contraint field name to be acctTypCd but was ' + fields[23].fieldName);
    try {
        let len = model.getMaxLength(fields[23]);
        model.setAcctTypCd(testUtil.fillString('x', len+2));
        assert.fail('No Exception', 'Exception', 'expected Account.setAcctTypCd() to fail LengthConstraint(' + len + ') and throw Exception but it did not');
    }

    catch (e) {
        if (e.name !== 'LengthConstraint') {
            throw e;
        }
    }

    // field acctZipCd
    assert(model.isLengthConstraintRequired(fields[24]), 'expected ' + fields[24].fieldName + '  to require LengthConstraint but it did not');
    assert(fields[24].fieldName === 'acctZipCd', 'expected length contraint field name to be acctZipCd but was ' + fields[24].fieldName);
    try {
        let len = model.getMaxLength(fields[24]);
        model.setAcctZipCd(testUtil.fillString('x', len+2));
        assert.fail('No Exception', 'Exception', 'expected Account.setAcctZipCd() to fail LengthConstraint(' + len + ') and throw Exception but it did not');
    }

    catch (e) {
        if (e.name !== 'LengthConstraint') {
            throw e;
        }
    }

    // field bdgtRecLvlCd
    assert(model.isLengthConstraintRequired(fields[25]), 'expected ' + fields[25].fieldName + '  to require LengthConstraint but it did not');
    assert(fields[25].fieldName === 'bdgtRecLvlCd', 'expected length contraint field name to be bdgtRecLvlCd but was ' + fields[25].fieldName);
    try {
        let len = model.getMaxLength(fields[25]);
        model.setBdgtRecLvlCd(testUtil.fillString('x', len+2));
        assert.fail('No Exception', 'Exception', 'expected Account.setBdgtRecLvlCd() to fail LengthConstraint(' + len + ') and throw Exception but it did not');
    }

    catch (e) {
        if (e.name !== 'LengthConstraint') {
            throw e;
        }
    }

    // field cgCfdaNbr
    assert(model.isLengthConstraintRequired(fields[27]), 'expected ' + fields[27].fieldName + '  to require LengthConstraint but it did not');
    assert(fields[27].fieldName === 'cgCfdaNbr', 'expected length contraint field name to be cgCfdaNbr but was ' + fields[27].fieldName);
    try {
        let len = model.getMaxLength(fields[27]);
        model.setCgCfdaNbr(testUtil.fillString('x', len+2));
        assert.fail('No Exception', 'Exception', 'expected Account.setCgCfdaNbr() to fail LengthConstraint(' + len + ') and throw Exception but it did not');
    }

    catch (e) {
        if (e.name !== 'LengthConstraint') {
            throw e;
        }
    }

    // field contAccountNbr
    assert(model.isLengthConstraintRequired(fields[28]), 'expected ' + fields[28].fieldName + '  to require LengthConstraint but it did not');
    assert(fields[28].fieldName === 'contAccountNbr', 'expected length contraint field name to be contAccountNbr but was ' + fields[28].fieldName);
    try {
        let len = model.getMaxLength(fields[28]);
        model.setContAccountNbr(testUtil.fillString('x', len+2));
        assert.fail('No Exception', 'Exception', 'expected Account.setContAccountNbr() to fail LengthConstraint(' + len + ') and throw Exception but it did not');
    }

    catch (e) {
        if (e.name !== 'LengthConstraint') {
            throw e;
        }
    }

    // field contFinCoaCd
    assert(model.isLengthConstraintRequired(fields[29]), 'expected ' + fields[29].fieldName + '  to require LengthConstraint but it did not');
    assert(fields[29].fieldName === 'contFinCoaCd', 'expected length contraint field name to be contFinCoaCd but was ' + fields[29].fieldName);
    try {
        let len = model.getMaxLength(fields[29]);
        model.setContFinCoaCd(testUtil.fillString('x', len+2));
        assert.fail('No Exception', 'Exception', 'expected Account.setContFinCoaCd() to fail LengthConstraint(' + len + ') and throw Exception but it did not');
    }

    catch (e) {
        if (e.name !== 'LengthConstraint') {
            throw e;
        }
    }

    // field contrCtrlFcoaCd
    assert(model.isLengthConstraintRequired(fields[30]), 'expected ' + fields[30].fieldName + '  to require LengthConstraint but it did not');
    assert(fields[30].fieldName === 'contrCtrlFcoaCd', 'expected length contraint field name to be contrCtrlFcoaCd but was ' + fields[30].fieldName);
    try {
        let len = model.getMaxLength(fields[30]);
        model.setContrCtrlFcoaCd(testUtil.fillString('x', len+2));
        assert.fail('No Exception', 'Exception', 'expected Account.setContrCtrlFcoaCd() to fail LengthConstraint(' + len + ') and throw Exception but it did not');
    }

    catch (e) {
        if (e.name !== 'LengthConstraint') {
            throw e;
        }
    }

    // field contrCtrlacctNbr
    assert(model.isLengthConstraintRequired(fields[31]), 'expected ' + fields[31].fieldName + '  to require LengthConstraint but it did not');
    assert(fields[31].fieldName === 'contrCtrlacctNbr', 'expected length contraint field name to be contrCtrlacctNbr but was ' + fields[31].fieldName);
    try {
        let len = model.getMaxLength(fields[31]);
        model.setContrCtrlacctNbr(testUtil.fillString('x', len+2));
        assert.fail('No Exception', 'Exception', 'expected Account.setContrCtrlacctNbr() to fail LengthConstraint(' + len + ') and throw Exception but it did not');
    }

    catch (e) {
        if (e.name !== 'LengthConstraint') {
            throw e;
        }
    }

    // field endowAccountNbr
    assert(model.isLengthConstraintRequired(fields[32]), 'expected ' + fields[32].fieldName + '  to require LengthConstraint but it did not');
    assert(fields[32].fieldName === 'endowAccountNbr', 'expected length contraint field name to be endowAccountNbr but was ' + fields[32].fieldName);
    try {
        let len = model.getMaxLength(fields[32]);
        model.setEndowAccountNbr(testUtil.fillString('x', len+2));
        assert.fail('No Exception', 'Exception', 'expected Account.setEndowAccountNbr() to fail LengthConstraint(' + len + ') and throw Exception but it did not');
    }

    catch (e) {
        if (e.name !== 'LengthConstraint') {
            throw e;
        }
    }

    // field endowFinCoaCd
    assert(model.isLengthConstraintRequired(fields[33]), 'expected ' + fields[33].fieldName + '  to require LengthConstraint but it did not');
    assert(fields[33].fieldName === 'endowFinCoaCd', 'expected length contraint field name to be endowFinCoaCd but was ' + fields[33].fieldName);
    try {
        let len = model.getMaxLength(fields[33]);
        model.setEndowFinCoaCd(testUtil.fillString('x', len+2));
        assert.fail('No Exception', 'Exception', 'expected Account.setEndowFinCoaCd() to fail LengthConstraint(' + len + ') and throw Exception but it did not');
    }

    catch (e) {
        if (e.name !== 'LengthConstraint') {
            throw e;
        }
    }

    // field finExtEncSfCd
    assert(model.isLengthConstraintRequired(fields[34]), 'expected ' + fields[34].fieldName + '  to require LengthConstraint but it did not');
    assert(fields[34].fieldName === 'finExtEncSfCd', 'expected length contraint field name to be finExtEncSfCd but was ' + fields[34].fieldName);
    try {
        let len = model.getMaxLength(fields[34]);
        model.setFinExtEncSfCd(testUtil.fillString('x', len+2));
        assert.fail('No Exception', 'Exception', 'expected Account.setFinExtEncSfCd() to fail LengthConstraint(' + len + ') and throw Exception but it did not');
    }

    catch (e) {
        if (e.name !== 'LengthConstraint') {
            throw e;
        }
    }

    // field finHghEdFuncCd
    assert(model.isLengthConstraintRequired(fields[35]), 'expected ' + fields[35].fieldName + '  to require LengthConstraint but it did not');
    assert(fields[35].fieldName === 'finHghEdFuncCd', 'expected length contraint field name to be finHghEdFuncCd but was ' + fields[35].fieldName);
    try {
        let len = model.getMaxLength(fields[35]);
        model.setFinHghEdFuncCd(testUtil.fillString('x', len+2));
        assert.fail('No Exception', 'Exception', 'expected Account.setFinHghEdFuncCd() to fail LengthConstraint(' + len + ') and throw Exception but it did not');
    }

    catch (e) {
        if (e.name !== 'LengthConstraint') {
            throw e;
        }
    }

    // field finIntEncSfCd
    assert(model.isLengthConstraintRequired(fields[36]), 'expected ' + fields[36].fieldName + '  to require LengthConstraint but it did not');
    assert(fields[36].fieldName === 'finIntEncSfCd', 'expected length contraint field name to be finIntEncSfCd but was ' + fields[36].fieldName);
    try {
        let len = model.getMaxLength(fields[36]);
        model.setFinIntEncSfCd(testUtil.fillString('x', len+2));
        assert.fail('No Exception', 'Exception', 'expected Account.setFinIntEncSfCd() to fail LengthConstraint(' + len + ') and throw Exception but it did not');
    }

    catch (e) {
        if (e.name !== 'LengthConstraint') {
            throw e;
        }
    }

    // field finObjPrsctrlCd
    assert(model.isLengthConstraintRequired(fields[37]), 'expected ' + fields[37].fieldName + '  to require LengthConstraint but it did not');
    assert(fields[37].fieldName === 'finObjPrsctrlCd', 'expected length contraint field name to be finObjPrsctrlCd but was ' + fields[37].fieldName);
    try {
        let len = model.getMaxLength(fields[37]);
        model.setFinObjPrsctrlCd(testUtil.fillString('x', len+2));
        assert.fail('No Exception', 'Exception', 'expected Account.setFinObjPrsctrlCd() to fail LengthConstraint(' + len + ') and throw Exception but it did not');
    }

    catch (e) {
        if (e.name !== 'LengthConstraint') {
            throw e;
        }
    }

    // field finPreEncSfCd
    assert(model.isLengthConstraintRequired(fields[38]), 'expected ' + fields[38].fieldName + '  to require LengthConstraint but it did not');
    assert(fields[38].fieldName === 'finPreEncSfCd', 'expected length contraint field name to be finPreEncSfCd but was ' + fields[38].fieldName);
    try {
        let len = model.getMaxLength(fields[38]);
        model.setFinPreEncSfCd(testUtil.fillString('x', len+2));
        assert.fail('No Exception', 'Exception', 'expected Account.setFinPreEncSfCd() to fail LengthConstraint(' + len + ') and throw Exception but it did not');
    }

    catch (e) {
        if (e.name !== 'LengthConstraint') {
            throw e;
        }
    }

    // field finSeriesId
    assert(model.isLengthConstraintRequired(fields[39]), 'expected ' + fields[39].fieldName + '  to require LengthConstraint but it did not');
    assert(fields[39].fieldName === 'finSeriesId', 'expected length contraint field name to be finSeriesId but was ' + fields[39].fieldName);
    try {
        let len = model.getMaxLength(fields[39]);
        model.setFinSeriesId(testUtil.fillString('x', len+2));
        assert.fail('No Exception', 'Exception', 'expected Account.setFinSeriesId() to fail LengthConstraint(' + len + ') and throw Exception but it did not');
    }

    catch (e) {
        if (e.name !== 'LengthConstraint') {
            throw e;
        }
    }

    // field fundsTypeCd
    assert(model.isLengthConstraintRequired(fields[40]), 'expected ' + fields[40].fieldName + '  to require LengthConstraint but it did not');
    assert(fields[40].fieldName === 'fundsTypeCd', 'expected length contraint field name to be fundsTypeCd but was ' + fields[40].fieldName);
    try {
        let len = model.getMaxLength(fields[40]);
        model.setFundsTypeCd(testUtil.fillString('x', len+2));
        assert.fail('No Exception', 'Exception', 'expected Account.setFundsTypeCd() to fail LengthConstraint(' + len + ') and throw Exception but it did not');
    }

    catch (e) {
        if (e.name !== 'LengthConstraint') {
            throw e;
        }
    }

    // field icrAccountNbr
    assert(model.isLengthConstraintRequired(fields[41]), 'expected ' + fields[41].fieldName + '  to require LengthConstraint but it did not');
    assert(fields[41].fieldName === 'icrAccountNbr', 'expected length contraint field name to be icrAccountNbr but was ' + fields[41].fieldName);
    try {
        let len = model.getMaxLength(fields[41]);
        model.setIcrAccountNbr(testUtil.fillString('x', len+2));
        assert.fail('No Exception', 'Exception', 'expected Account.setIcrAccountNbr() to fail LengthConstraint(' + len + ') and throw Exception but it did not');
    }

    catch (e) {
        if (e.name !== 'LengthConstraint') {
            throw e;
        }
    }

    // field icrFinCoaCd
    assert(model.isLengthConstraintRequired(fields[42]), 'expected ' + fields[42].fieldName + '  to require LengthConstraint but it did not');
    assert(fields[42].fieldName === 'icrFinCoaCd', 'expected length contraint field name to be icrFinCoaCd but was ' + fields[42].fieldName);
    try {
        let len = model.getMaxLength(fields[42]);
        model.setIcrFinCoaCd(testUtil.fillString('x', len+2));
        assert.fail('No Exception', 'Exception', 'expected Account.setIcrFinCoaCd() to fail LengthConstraint(' + len + ') and throw Exception but it did not');
    }

    catch (e) {
        if (e.name !== 'LengthConstraint') {
            throw e;
        }
    }

    // field incomeAccountNbr
    assert(model.isLengthConstraintRequired(fields[43]), 'expected ' + fields[43].fieldName + '  to require LengthConstraint but it did not');
    assert(fields[43].fieldName === 'incomeAccountNbr', 'expected length contraint field name to be incomeAccountNbr but was ' + fields[43].fieldName);
    try {
        let len = model.getMaxLength(fields[43]);
        model.setIncomeAccountNbr(testUtil.fillString('x', len+2));
        assert.fail('No Exception', 'Exception', 'expected Account.setIncomeAccountNbr() to fail LengthConstraint(' + len + ') and throw Exception but it did not');
    }

    catch (e) {
        if (e.name !== 'LengthConstraint') {
            throw e;
        }
    }

    // field incomeFinCoaCd
    assert(model.isLengthConstraintRequired(fields[44]), 'expected ' + fields[44].fieldName + '  to require LengthConstraint but it did not');
    assert(fields[44].fieldName === 'incomeFinCoaCd', 'expected length contraint field name to be incomeFinCoaCd but was ' + fields[44].fieldName);
    try {
        let len = model.getMaxLength(fields[44]);
        model.setIncomeFinCoaCd(testUtil.fillString('x', len+2));
        assert.fail('No Exception', 'Exception', 'expected Account.setIncomeFinCoaCd() to fail LengthConstraint(' + len + ') and throw Exception but it did not');
    }

    catch (e) {
        if (e.name !== 'LengthConstraint') {
            throw e;
        }
    }

    // field lbrBenRtCatCd
    assert(model.isLengthConstraintRequired(fields[46]), 'expected ' + fields[46].fieldName + '  to require LengthConstraint but it did not');
    assert(fields[46].fieldName === 'lbrBenRtCatCd', 'expected length contraint field name to be lbrBenRtCatCd but was ' + fields[46].fieldName);
    try {
        let len = model.getMaxLength(fields[46]);
        model.setLbrBenRtCatCd(testUtil.fillString('x', len+2));
        assert.fail('No Exception', 'Exception', 'expected Account.setLbrBenRtCatCd() to fail LengthConstraint(' + len + ') and throw Exception but it did not');
    }

    catch (e) {
        if (e.name !== 'LengthConstraint') {
            throw e;
        }
    }

    // field objId
    assert(model.isLengthConstraintRequired(fields[47]), 'expected ' + fields[47].fieldName + '  to require LengthConstraint but it did not');
    assert(fields[47].fieldName === 'objId', 'expected length contraint field name to be objId but was ' + fields[47].fieldName);
    try {
        let len = model.getMaxLength(fields[47]);
        model.setObjId(testUtil.fillString('x', len+2));
        assert.fail('No Exception', 'Exception', 'expected Account.setObjId() to fail LengthConstraint(' + len + ') and throw Exception but it did not');
    }

    catch (e) {
        if (e.name !== 'LengthConstraint') {
            throw e;
        }
    }

    // field orgCd
    assert(model.isLengthConstraintRequired(fields[48]), 'expected ' + fields[48].fieldName + '  to require LengthConstraint but it did not');
    assert(fields[48].fieldName === 'orgCd', 'expected length contraint field name to be orgCd but was ' + fields[48].fieldName);
    try {
        let len = model.getMaxLength(fields[48]);
        model.setOrgCd(testUtil.fillString('x', len+2));
        assert.fail('No Exception', 'Exception', 'expected Account.setOrgCd() to fail LengthConstraint(' + len + ') and throw Exception but it did not');
    }

    catch (e) {
        if (e.name !== 'LengthConstraint') {
            throw e;
        }
    }

    // field rptsToAcctNbr
    assert(model.isLengthConstraintRequired(fields[49]), 'expected ' + fields[49].fieldName + '  to require LengthConstraint but it did not');
    assert(fields[49].fieldName === 'rptsToAcctNbr', 'expected length contraint field name to be rptsToAcctNbr but was ' + fields[49].fieldName);
    try {
        let len = model.getMaxLength(fields[49]);
        model.setRptsToAcctNbr(testUtil.fillString('x', len+2));
        assert.fail('No Exception', 'Exception', 'expected Account.setRptsToAcctNbr() to fail LengthConstraint(' + len + ') and throw Exception but it did not');
    }

    catch (e) {
        if (e.name !== 'LengthConstraint') {
            throw e;
        }
    }

    // field rptsToFinCoaCd
    assert(model.isLengthConstraintRequired(fields[50]), 'expected ' + fields[50].fieldName + '  to require LengthConstraint but it did not');
    assert(fields[50].fieldName === 'rptsToFinCoaCd', 'expected length contraint field name to be rptsToFinCoaCd but was ' + fields[50].fieldName);
    try {
        let len = model.getMaxLength(fields[50]);
        model.setRptsToFinCoaCd(testUtil.fillString('x', len+2));
        assert.fail('No Exception', 'Exception', 'expected Account.setRptsToFinCoaCd() to fail LengthConstraint(' + len + ') and throw Exception but it did not');
    }

    catch (e) {
        if (e.name !== 'LengthConstraint') {
            throw e;
        }
    }

    // field subFundGrpCd
    assert(model.isLengthConstraintRequired(fields[51]), 'expected ' + fields[51].fieldName + '  to require LengthConstraint but it did not');
    assert(fields[51].fieldName === 'subFundGrpCd', 'expected length contraint field name to be subFundGrpCd but was ' + fields[51].fieldName);
    try {
        let len = model.getMaxLength(fields[51]);
        model.setSubFundGrpCd(testUtil.fillString('x', len+2));
        assert.fail('No Exception', 'Exception', 'expected Account.setSubFundGrpCd() to fail LengthConstraint(' + len + ') and throw Exception but it did not');
    }

    catch (e) {
        if (e.name !== 'LengthConstraint') {
            throw e;
        }
    }
};

