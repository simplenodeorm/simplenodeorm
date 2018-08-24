"use strict";

var MetaData = require('../../main/MetaData.js').MetaData;

class AccountMetaData extends MetaData {
    constructor() {
        super(
        'Account', // object name,
        'model/ca/Account.js', // relative module path,
        'CA_ACCOUNT_T', // table name
        [ // field definitions - order is important,
          //selected data will be in this order, primary key fields shoud be first
            { // 0
                fieldName: "finCoaCd",
                type: "VARCHAR2",
                length: 2,
                columnName: "FIN_COA_CD",
                required: true,
                primaryKey: true
            },
            { // 1
                fieldName: "accountNbr",
                type: "VARCHAR2",
                length: 7,
                columnName: "ACCOUNT_NBR",
                required: true,
                primaryKey: true
            },
            { // 2
                fieldName: "acCstmIcrexclCd",
                type: "VARCHAR2",
                length: 1,
                columnName: "AC_CSTM_ICREXCL_CD"
            },
            { // 3
                fieldName: "accountNm",
                type: "VARCHAR2",
                length: 40,
                columnName: "ACCOUNT_NM"
            },
            { // 4
                fieldName: "acctCityNm",
                type: "VARCHAR2",
                length: 25,
                columnName: "ACCT_CITY_NM"
            },
            { // 5
                fieldName: "acctClosedInd",
                type: "VARCHAR2",
                converter: "YNToBoolean",
                length: 1,
                columnName: "ACCT_CLOSED_IND"
            },
            { // 6
                fieldName: "acctCreateDt",
                type: "DATE",
                temporalType: "timestamp",
                columnName: "ACCT_CREATE_DT"
            },
            { // 7
                fieldName: "acctEffectDt",
                type: "DATE",
                temporalType: "timestamp",
                columnName: "ACCT_EFFECT_DT"
            },
            { // 8
                fieldName: "acctExpirationDt",
                type: "DATE",
                temporalType: "timestamp",
                columnName: "ACCT_EXPIRATION_DT"
            },
            { // 9
                fieldName: "acctFrngBnftCd",
                type: "VARCHAR2",
                converter: "YNToBoolean",
                length: 1,
                columnName: "ACCT_FRNG_BNFT_CD"
            },
            { // 10
                fieldName: "acctFscOfcUid",
                type: "VARCHAR2",
                length: 40,
                columnName: "ACCT_FSC_OFC_UID"
            },
            { // 11
                fieldName: "acctIcrTypCd",
                type: "VARCHAR2",
                length: 2,
                columnName: "ACCT_ICR_TYP_CD"
            },
            { // 12
                fieldName: "acctInFpCd",
                type: "VARCHAR2",
                converter: "YNToBoolean",
                length: 1,
                columnName: "ACCT_IN_FP_CD"
            },
            { // 13
                fieldName: "acctMgrUnvlId",
                type: "VARCHAR2",
                length: 40,
                columnName: "ACCT_MGR_UNVL_ID"
            },
            { // 14
                fieldName: "acctOffCmpInd",
                type: "VARCHAR2",
                converter: "YNToBoolean",
                length: 1,
                columnName: "ACCT_OFF_CMP_IND"
            },
            { // 15
                fieldName: "acctPhysCmpCd",
                type: "VARCHAR2",
                length: 2,
                columnName: "ACCT_PHYS_CMP_CD"
            },
            { // 16
                fieldName: "acctPndSfCd",
                type: "VARCHAR2",
                converter: "YNToBoolean",
                length: 1,
                columnName: "ACCT_PND_SF_CD"
            },
            { // 17
                fieldName: "acctRstrcStatCd",
                type: "VARCHAR2",
                length: 1,
                columnName: "ACCT_RSTRC_STAT_CD"
            },
            { // 18
                fieldName: "acctRstrcStatDt",
                type: "DATE",
                temporalType: "timestamp",
                columnName: "ACCT_RSTRC_STAT_DT"
            },
            { // 19
                fieldName: "acctSfCd",
                type: "VARCHAR2",
                length: 1,
                columnName: "ACCT_SF_CD"
            },
            { // 20
                fieldName: "acctSpvsrUnvlId",
                type: "VARCHAR2",
                length: 40,
                columnName: "ACCT_SPVSR_UNVL_ID"
            },
            { // 21
                fieldName: "acctStateCd",
                type: "VARCHAR2",
                length: 2,
                columnName: "ACCT_STATE_CD"
            },
            { // 22
                fieldName: "acctStreetAddr",
                type: "VARCHAR2",
                length: 30,
                columnName: "ACCT_STREET_ADDR"
            },
            { // 23
                fieldName: "acctTypCd",
                type: "VARCHAR2",
                length: 2,
                columnName: "ACCT_TYP_CD"
            },
            { // 24
                fieldName: "acctZipCd",
                type: "VARCHAR2",
                length: 20,
                columnName: "ACCT_ZIP_CD"
            },
            { // 25
                fieldName: "bdgtRecLvlCd",
                type: "VARCHAR2",
                length: 1,
                columnName: "BDGT_REC_LVL_CD"
            },
            { // 26
                fieldName: "cgAcctRespId",
                type: "NUMBER",
                columnName: "CG_ACCT_RESP_ID"
            },
            { // 27
                fieldName: "cgCfdaNbr",
                type: "VARCHAR2",
                length: 6,
                columnName: "CG_CFDA_NBR"
            },
            { // 28
                fieldName: "contAccountNbr",
                type: "VARCHAR2",
                length: 7,
                columnName: "CONT_ACCOUNT_NBR"
            },
            { // 29
                fieldName: "contFinCoaCd",
                type: "VARCHAR2",
                length: 2,
                columnName: "CONT_FIN_COA_CD"
            },
            { // 30
                fieldName: "contrCtrlFcoaCd",
                type: "VARCHAR2",
                length: 2,
                columnName: "CONTR_CTRL_FCOA_CD"
            },
            { // 31
                fieldName: "contrCtrlacctNbr",
                type: "VARCHAR2",
                length: 7,
                columnName: "CONTR_CTRLACCT_NBR"
            },
            { // 32
                fieldName: "endowAccountNbr",
                type: "VARCHAR2",
                length: 7,
                columnName: "ENDOW_ACCOUNT_NBR"
            },
            { // 33
                fieldName: "endowFinCoaCd",
                type: "VARCHAR2",
                length: 2,
                columnName: "ENDOW_FIN_COA_CD"
            },
            { // 34
                fieldName: "finExtEncSfCd",
                type: "VARCHAR2",
                converter: "YNToBoolean",
                length: 1,
                columnName: "FIN_EXT_ENC_SF_CD"
            },
            { // 35
                fieldName: "finHghEdFuncCd",
                type: "VARCHAR2",
                length: 4,
                columnName: "FIN_HGH_ED_FUNC_CD"
            },
            { // 36
                fieldName: "finIntEncSfCd",
                type: "VARCHAR2",
                converter: "YNToBoolean",
                length: 1,
                columnName: "FIN_INT_ENC_SF_CD"
            },
            { // 37
                fieldName: "finObjPrsctrlCd",
                type: "VARCHAR2",
                converter: "YNToBoolean",
                length: 1,
                columnName: "FIN_OBJ_PRSCTRL_CD"
            },
            { // 38
                fieldName: "finPreEncSfCd",
                type: "VARCHAR2",
                converter: "YNToBoolean",
                length: 1,
                columnName: "FIN_PRE_ENC_SF_CD"
            },
            { // 39
                fieldName: "finSeriesId",
                type: "VARCHAR2",
                length: 3,
                columnName: "FIN_SERIES_ID"
            },
            { // 40
                fieldName: "fundsTypeCd",
                type: "VARCHAR2",
                length: 3,
                columnName: "FUNDS_TYPE_CD"
            },
            { // 41
                fieldName: "icrAccountNbr",
                type: "VARCHAR2",
                length: 7,
                columnName: "ICR_ACCOUNT_NBR"
            },
            { // 42
                fieldName: "icrFinCoaCd",
                type: "VARCHAR2",
                length: 2,
                columnName: "ICR_FIN_COA_CD"
            },
            { // 43
                fieldName: "incomeAccountNbr",
                type: "VARCHAR2",
                length: 7,
                columnName: "INCOME_ACCOUNT_NBR"
            },
            { // 44
                fieldName: "incomeFinCoaCd",
                type: "VARCHAR2",
                length: 2,
                columnName: "INCOME_FIN_COA_CD"
            },
            { // 45
                fieldName: "lastUpdtTs",
                type: "DATE",
                temporalType: "timestamp",
                columnName: "LAST_UPDT_TS",
                defaultValue: "to_timestamp('2009-07-01 00:00:00.000', 'YYYY-MM-DD HH24:MI:SS.FF')"
            },
            { // 46
                fieldName: "lbrBenRtCatCd",
                type: "VARCHAR2",
                length: 2,
                columnName: "LBR_BEN_RT_CAT_CD",
                defaultValue: "'--'"
            },
            { // 47
                fieldName: "objId",
                type: "VARCHAR2",
                length: 36,
                  columnName: "OBJ_ID",
                defaultValue: "SYS_GUID()",
                required: true
            },
            { // 48
                fieldName: "orgCd",
                type: "VARCHAR2",
                length: 4,
                columnName: "ORG_CD"
            },
            { // 49
                fieldName: "rptsToAcctNbr",
                type: "VARCHAR2",
                length: 7,
                columnName: "RPTS_TO_ACCT_NBR"
            },
            { // 50
                fieldName: "rptsToFinCoaCd",
                type: "VARCHAR2",
                length: 2,
                columnName: "RPTS_TO_FIN_COA_CD"
            },
            { // 51
                fieldName: "subFundGrpCd",
                type: "VARCHAR2",
                length: 6,
                columnName: "SUB_FUND_GRP_CD"
            },
            { // 52
                fieldName: "verNbr",
                type: "NUMBER",
                columnName: "VER_NBR",
                versionColumn: true,
                defaultValue: "1",
                required: true
            }
        ],
        [ // one-to-one definitions
            { // 0
               fieldName: "organization",
               type: 1,
               targetModelName: "Organization",
               targetModule: "../model/ca/Organization.js",
               targetTableName: "CA_ORG_T",
               status: "enabled",
               joinColumns : {
                   sourceColumns : "FIN_COA_CD,ORG_CD",
                   targetColumns : "FIN_COA_CD,ORG_CD"
               }
            },
            { // 1
               fieldName: "accountType",
               type: 1,
               targetModelName: "AccountType",
               targetModule: "../model/ca/AccountType.js",
               targetTableName: "CA_ACCOUNT_TYPE_T",
               status: "enabled",
               joinColumns : {
                   sourceColumns : "ACCT_TYP_CD",
                   targetColumns : "ACCT_TYP_CD"
               }
            },
        ],
        [ // one-to-many definitions
            { // 0
               fieldName: "subAccounts",
               type: 2,
               targetModelName: "SubAccount",
               targetModule: "../model/ca/SubAccount.js",
               targetTableName: "CA_SUB_ACCT_T",
               cascadeUpdate: true,
               cascadeDelete: true,
               status: "enabled",
               joinColumns : {
                   sourceColumns : "FIN_COA_CD,ACCOUNT_NBR",
                   targetColumns : "FIN_COA_CD,ACCOUNT_NBR"
               }
            }
        []); // many-to-one definitions

    }

    
    // load custom constraints here
    loadConstraints() {
    }
}

module.exports = function() {
    return new AccountMetaData();
};
