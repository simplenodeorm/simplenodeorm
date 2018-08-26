"use strict";

const Model = require('../../main/Model.js');

class Account extends Model {
    constructor(metaData) {
        super(metaData);
    }

    getFinCoaCd() { return this.getFieldValue("finCoaCd"); };
    setFinCoaCd(value) { this.setFieldValue("finCoaCd", value); };

    getAccountNbr() { return this.getFieldValue("accountNbr"); };
    setAccountNbr(value) { this.setFieldValue("accountNbr", value); };

    getAcCstmIcrexclCd() { return this.getFieldValue("acCstmIcrexclCd"); };
    setAcCstmIcrexclCd(value) { this.setFieldValue("acCstmIcrexclCd", value); };

    getAccountNm() { return this.getFieldValue("accountNm"); };
    setAccountNm(value) { this.setFieldValue("accountNm", value); };

    getAcctCityNm() { return this.getFieldValue("acctCityNm"); };
    setAcctCityNm(value) { this.setFieldValue("acctCityNm", value); };

    getAcctClosedInd() { return this.getFieldValue("acctClosedInd"); };
    setAcctClosedInd(value) { this.setFieldValue("acctClosedInd", value); };

    getAcctCreateDt() { return this.getFieldValue("acctCreateDt"); };
    setAcctCreateDt(value) { this.setFieldValue("acctCreateDt", value); };

    getAcctEffectDt() { return this.getFieldValue("acctEffectDt"); };
    setAcctEffectDt(value) { this.setFieldValue("acctEffectDt", value); };

    getAcctExpirationDt() { return this.getFieldValue("acctExpirationDt"); };
    setAcctExpirationDt(value) { this.setFieldValue("acctExpirationDt", value); };

    getAcctFrngBnftCd() { return this.getFieldValue("acctFrngBnftCd"); };
    setAcctFrngBnftCd(value) { this.setFieldValue("acctFrngBnftCd", value); };

    getAcctFscOfcUid() { return this.getFieldValue("acctFscOfcUid"); };
    setAcctFscOfcUid(value) { this.setFieldValue("acctFscOfcUid", value); };

    getAcctIcrTypCd() { return this.getFieldValue("acctIcrTypCd"); };
    setAcctIcrTypCd(value) { this.setFieldValue("acctIcrTypCd", value); };

    getAcctInFpCd() { return this.getFieldValue("acctInFpCd"); };
    setAcctInFpCd(value) { this.setFieldValue("acctInFpCd", value); };

    getAcctMgrUnvlId() { return this.getFieldValue("acctMgrUnvlId"); };
    setAcctMgrUnvlId(value) { this.setFieldValue("acctMgrUnvlId", value); };

    getAcctOffCmpInd() { return this.getFieldValue("acctOffCmpInd"); };
    setAcctOffCmpInd(value) { this.setFieldValue("acctOffCmpInd", value); };

    getAcctPhysCmpCd() { return this.getFieldValue("acctPhysCmpCd"); };
    setAcctPhysCmpCd(value) { this.setFieldValue("acctPhysCmpCd", value); };

    getAcctPndSfCd() { return this.getFieldValue("acctPndSfCd"); };
    setAcctPndSfCd(value) { this.setFieldValue("acctPndSfCd", value); };

    getAcctRstrcStatCd() { return this.getFieldValue("acctRstrcStatCd"); };
    setAcctRstrcStatCd(value) { this.setFieldValue("acctRstrcStatCd", value); };

    getAcctRstrcStatDt() { return this.getFieldValue("acctRstrcStatDt"); };
    setAcctRstrcStatDt(value) { this.setFieldValue("acctRstrcStatDt", value); };

    getAcctSfCd() { return this.getFieldValue("acctSfCd"); };
    setAcctSfCd(value) { this.setFieldValue("acctSfCd", value); };

    getAcctSpvsrUnvlId() { return this.getFieldValue("acctSpvsrUnvlId"); };
    setAcctSpvsrUnvlId(value) { this.setFieldValue("acctSpvsrUnvlId", value); };

    getAcctStateCd() { return this.getFieldValue("acctStateCd"); };
    setAcctStateCd(value) { this.setFieldValue("acctStateCd", value); };

    getAcctStreetAddr() { return this.getFieldValue("acctStreetAddr"); };
    setAcctStreetAddr(value) { this.setFieldValue("acctStreetAddr", value); };

    getAcctTypCd() { return this.getFieldValue("acctTypCd"); };
    setAcctTypCd(value) { this.setFieldValue("acctTypCd", value); };

    getAcctZipCd() { return this.getFieldValue("acctZipCd"); };
    setAcctZipCd(value) { this.setFieldValue("acctZipCd", value); };

    getBdgtRecLvlCd() { return this.getFieldValue("bdgtRecLvlCd"); };
    setBdgtRecLvlCd(value) { this.setFieldValue("bdgtRecLvlCd", value); };

    getCgAcctRespId() { return this.getFieldValue("cgAcctRespId"); };
    setCgAcctRespId(value) { this.setFieldValue("cgAcctRespId", value); };

    getCgCfdaNbr() { return this.getFieldValue("cgCfdaNbr"); };
    setCgCfdaNbr(value) { this.setFieldValue("cgCfdaNbr", value); };

    getContAccountNbr() { return this.getFieldValue("contAccountNbr"); };
    setContAccountNbr(value) { this.setFieldValue("contAccountNbr", value); };

    getContFinCoaCd() { return this.getFieldValue("contFinCoaCd"); };
    setContFinCoaCd(value) { this.setFieldValue("contFinCoaCd", value); };

    getContrCtrlFcoaCd() { return this.getFieldValue("contrCtrlFcoaCd"); };
    setContrCtrlFcoaCd(value) { this.setFieldValue("contrCtrlFcoaCd", value); };

    getContrCtrlacctNbr() { return this.getFieldValue("contrCtrlacctNbr"); };
    setContrCtrlacctNbr(value) { this.setFieldValue("contrCtrlacctNbr", value); };

    getEndowAccountNbr() { return this.getFieldValue("endowAccountNbr"); };
    setEndowAccountNbr(value) { this.setFieldValue("endowAccountNbr", value); };

    getEndowFinCoaCd() { return this.getFieldValue("endowFinCoaCd"); };
    setEndowFinCoaCd(value) { this.setFieldValue("endowFinCoaCd", value); };

    getFinExtEncSfCd() { return this.getFieldValue("finExtEncSfCd"); };
    setFinExtEncSfCd(value) { this.setFieldValue("finExtEncSfCd", value); };

    getFinHghEdFuncCd() { return this.getFieldValue("finHghEdFuncCd"); };
    setFinHghEdFuncCd(value) { this.setFieldValue("finHghEdFuncCd", value); };

    getFinIntEncSfCd() { return this.getFieldValue("finIntEncSfCd"); };
    setFinIntEncSfCd(value) { this.setFieldValue("finIntEncSfCd", value); };

    getFinObjPrsctrlCd() { return this.getFieldValue("finObjPrsctrlCd"); };
    setFinObjPrsctrlCd(value) { this.setFieldValue("finObjPrsctrlCd", value); };

    getFinPreEncSfCd() { return this.getFieldValue("finPreEncSfCd"); };
    setFinPreEncSfCd(value) { this.setFieldValue("finPreEncSfCd", value); };

    getFinSeriesId() { return this.getFieldValue("finSeriesId"); };
    setFinSeriesId(value) { this.setFieldValue("finSeriesId", value); };

    getFundsTypeCd() { return this.getFieldValue("fundsTypeCd"); };
    setFundsTypeCd(value) { this.setFieldValue("fundsTypeCd", value); };

    getIcrAccountNbr() { return this.getFieldValue("icrAccountNbr"); };
    setIcrAccountNbr(value) { this.setFieldValue("icrAccountNbr", value); };

    getIcrFinCoaCd() { return this.getFieldValue("icrFinCoaCd"); };
    setIcrFinCoaCd(value) { this.setFieldValue("icrFinCoaCd", value); };

    getIncomeAccountNbr() { return this.getFieldValue("incomeAccountNbr"); };
    setIncomeAccountNbr(value) { this.setFieldValue("incomeAccountNbr", value); };

    getIncomeFinCoaCd() { return this.getFieldValue("incomeFinCoaCd"); };
    setIncomeFinCoaCd(value) { this.setFieldValue("incomeFinCoaCd", value); };

    getLastUpdtTs() { return this.getFieldValue("lastUpdtTs"); };
    setLastUpdtTs(value) { this.setFieldValue("lastUpdtTs", value); };

    getLbrBenRtCatCd() { return this.getFieldValue("lbrBenRtCatCd"); };
    setLbrBenRtCatCd(value) { this.setFieldValue("lbrBenRtCatCd", value); };

    getObjId() { return this.getFieldValue("objId"); };
    setObjId(value) { this.setFieldValue("objId", value); };

    getOrgCd() { return this.getFieldValue("orgCd"); };
    setOrgCd(value) { this.setFieldValue("orgCd", value); };

    getRptsToAcctNbr() { return this.getFieldValue("rptsToAcctNbr"); };
    setRptsToAcctNbr(value) { this.setFieldValue("rptsToAcctNbr", value); };

    getRptsToFinCoaCd() { return this.getFieldValue("rptsToFinCoaCd"); };
    setRptsToFinCoaCd(value) { this.setFieldValue("rptsToFinCoaCd", value); };

    getSubFundGrpCd() { return this.getFieldValue("subFundGrpCd"); };
    setSubFundGrpCd(value) { this.setFieldValue("subFundGrpCd", value); };

    getVerNbr() { return this.getFieldValue("verNbr"); };
    setVerNbr(value) { this.setFieldValue("verNbr", value); };


    getOrganization() { return this.getFieldValue("organization"); };
    setOrganization(value) { this.setFieldValue("organization", value); };

    getAccountType() { return this.getFieldValue("accountType"); };
    setAccountType(value) { this.setFieldValue("accountType", value); };

    getSubAccounts() { return this.getFieldValue("subAccounts"); };
    setSubAccounts(value) { this.setFieldValue("subAccounts", value); };

};

module.exports = function(metaData) {
    return new Account(metaData);
};

