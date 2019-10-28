/*
 * Copyright (c) 2019  simplenodeorm.org
 */

"use strict";

const fs = require('fs');
const util = require('./main/util.js');
const modelList = [];
const repositoryMap = new Map();
const events = require('events');
const basicAuth = require('basic-auth');
const uuidv1 = require('uuid/v1');
const path = require('path');
const fspath = require('fs-path');
const randomColor = require('randomcolor');
const tinycolor = require('tinycolor2');
const md5 = require('md5');

const NodeCache = require("node-cache");
const myCache = new NodeCache( { stdTTL: 60 * 60, checkperiod: 120 } );


const dbTypeMap = new Map();
const orm = this;


// These are variables setup via the app configuration. The default configuration
// is found in appconfig.json and testconfig.json. The environment variables
// APP_CONFIGURATION_FILE and APP_TEST_CONFIGURATION_FILE can be set to point to
// custom configuration files.
let appConfiguration;
let testConfiguration;
let logger;

module.exports.util = util;

// start and initialize the orm
module.exports.startOrm = function startOrm(installdir, appconfig, testconfig, serverStartedCallback) {
    appConfiguration = appconfig;
    testConfiguration = testconfig;

    // convert application relative paths in configuration files
    // to absolute path for current installation
    appConfiguration.authorizer = installdir + "/" + appConfiguration.authorizer;
    appConfiguration.ormModuleRootPath = installdir + "/" + appConfiguration.ormModuleRootPath;
    testConfiguration.testDbConfiguration = installdir + "/" + testConfiguration.testDbConfiguration;
    testConfiguration.testDataRootPath = installdir + "/" + testConfiguration.testDataRootPath;

    // export some of the constants for use in other modules
    module.exports.appConfiguration = appConfiguration;
    module.exports.testConfiguration = testConfiguration;

    logger = require('./main/Logger.js');
    logger.initialize(appConfiguration);
    module.exports.logger = logger;

    const poolCreatedEmitter = new events.EventEmitter();
    poolCreatedEmitter.on('poolscreated', async function() {
        loadOrm();

        // check for associated table existence and create if configured to do so
        if (appConfiguration.createTablesIfRequired) {
            createTablesIfRequired();
        }

        if (appConfiguration.testMode) {
            let suite = require("./test/testSuite.js");
            await suite.run();
        }

        serverStartedCallback(startApiServer(), logger);
    });

    // setup database pool and fire off orm load
    require("./db/dbConfiguration.js")(poolCreatedEmitter, appConfiguration, testConfiguration, dbTypeMap);
};

function loadOrm() {
    logger.logInfo("loading api ORM definitions...");
    loadOrmDefinitions();

    modelList.sort(function(a, b) {
        let s1 = (a.poolAlias + '.' + a.name);
        let s2 = (b.poolAlias + '.' + b.name);
        return (s1 < s2)
    });

    // ensure no changes after load
    Object.freeze(modelList);
    Object.freeze(repositoryMap);

    logger.logInfo("ORM definitions loaded ");
}

module.exports.newModelInstance = function (metaData) {
    return require(appConfiguration.ormModuleRootPath + '/' + metaData.module)(metaData);
};

function getMetaData(modelName) {
    return this.getRepository(modelName).getMetaData();
}

module.exports.getMetaData = getMetaData;

function getRepository(modelName) {
    return repositoryMap.get(modelName.toLowerCase());
}

module.exports.getRepository = getRepository;

module.exports.getModelList = function () {
    return modelList;
};

function getOneTimeAccessKey(ttl) {
    let retval = uuidv1();
    myCache.set(retval, true, ttl);
    return retval;
}

module.exports.getOneTimeAccessKey = getOneTimeAccessKey;

async function getConnection(poolAlias) {
    let pool = dbTypeMap.get(poolAlias + '.pool');
    if (logger.isLogDebugEnabled()) {
        logger.logDebug("poolAlias: " + poolAlias);
        logger.logDebug("pool: " + pool);
        logger.logDebug("type: " + dbTypeMap.get(poolAlias));
    }

    switch(dbTypeMap.get(poolAlias)) {
        case util.POSTGRES:
            return await pool.connect();
        default:
            return await pool.getConnection();
    }
}

module.exports.getConnection = getConnection;

function getDbType(poolAlias) {
    return dbTypeMap.get(poolAlias);
}

module.exports.getDbType = getDbType;



function getModelNameFromPath(path) {
    let retval = path;
    let pos = path.lastIndexOf('/');
    let pos2 = path.lastIndexOf('.');

    if ((pos > -1) && (pos2 > pos)) {
        retval = path.substring(pos+1, pos2);
    }

    return retval;
}

function loadOrmDefinitions() {
    logger.logInfo("loading orm definitions...");
    let modelFiles = [];
    loadModelFiles(appConfiguration.ormModuleRootPath + "/model", modelFiles);
    let indx = 1;

    for (let i = 0; i < modelFiles.length; ++i) {
        let modelName = getModelNameFromPath(modelFiles[i]);

        let md = new (require(modelFiles[i].replace(appConfiguration.ormModuleRootPath + '/model', appConfiguration.ormModuleRootPath + '/metadata').replace('.js', 'MetaData.js')));
        if (util.isDefined(md)) {
            let repo = require(modelFiles[i].replace(appConfiguration.ormModuleRootPath + '/model', appConfiguration.ormModuleRootPath + '/repository').replace('.js', 'Repository.js'))(md);
            modelList.push({poolAlias: repo.getPoolAlias(), name: modelName});
            repositoryMap.set(modelName.toLowerCase(), repo);
            if (md.getOneToOneDefinitions()) {
                for (let k = 0; k < md.getOneToOneDefinitions().length; ++k) {
                    md.getOneToOneDefinitions()[k].alias = ('t' + (indx++));
                }
            }

            if (md.getOneToManyDefinitions()) {
                for (let k = 0; k < md.getOneToManyDefinitions().length; ++k) {
                    md.getOneToManyDefinitions()[k].alias = ('t' + (indx++));
                }
            }

            if (md.getOneToManyDefinitions()) {
                for (let k = 0; k < md.getManyToManyDefinitions().length; ++k) {
                    md.getManyToOneDefinitions()[k].alias = ('t' + (indx++));
                }
            }
        }
    }

    logger.logInfo("orm definitions loaded");
}

function loadModelFiles(dir, modelFiles) {
    let files = fs.readdirSync(dir);

    for (let i = 0; i < files.length; ++i) {
        let curFile = (dir + '/' + files[i]);
        if ((files[i] !== '.') && (files[i] !== "..") && fs.lstatSync(curFile).isDirectory()) {
            loadModelFiles(dir + '/' + files[i], modelFiles);
        } else if (curFile.endsWith('.js')) {
            modelFiles.push(curFile);
        }
    }
}

function startApiServer() {
    logger.logInfo('starting api server...');
    let apiServer;
    try {
        const cors = require('cors');
        const express = require('express');
        const bodyParser = require('body-parser');
        apiServer = express();


        apiServer.use(bodyParser.urlencoded({limit: '5MB', extended: false}));
        apiServer.use(bodyParser.json({limit: '5MB'}));
        apiServer.use(cors());

        const authorizer = new (require(appConfiguration.authorizer));

        let server;
        if (appConfiguration.certKeyPath) {
            let options = {
                key: fs.readFileSync(appConfiguration.certKeyPath),
                cert: fs.readFileSync(appConfiguration.certPath),
                requestCert: false,
                rejectUnauthorized: false
            };
            server = require('https').createServer(options, apiServer);
            server.listen(appConfiguration.apiPort, function () {
                logger.logInfo('api server is live on port ' + appConfiguration.apiPort);
            });
        } else {
            apiServer.listen(appConfiguration.apiPort, function () {
                logger.logInfo('api server is live on port ' + appConfiguration.apiPort);
            });
        }

        apiServer.all('*', async function (req, res, next) {
            if (logger.isLogDebugEnabled()) {
                logger.logDebug("in /" + appConfiguration.context + ' checkAuthorization');
            }

            let session = getSession(req);
            let accessKey = getAccessKey(req);
            let cacheVal;

            if (session) {
                cacheVal = myCache.get(session);
            }

            if (accessKey && myCache.get(accessKey)) {
                myCache.del(accessKey);
                next();
            } else if (req.url.endsWith("/login")) {
                next();
            } else if (session && cacheVal) {
                myCache.set(session, cacheVal);
                next();
            } else {
                let user = basicAuth(req);

                if (user && user.name && await authorizer.isAuthenticated(orm, req, user.name, md5(user.pass))) {
                    next();
                } else {
                    res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
                    res.sendStatus(401);
                }
            }
        });

        apiServer.get('/*/accesskey', async function (req, res) {
            res.status(200).send(getOneTimeAccessKey(20));
        });

        apiServer.get('/*/api/query/login', async function (req, res) {
            let user = basicAuth(req);
            if (!user || !user.name || !user.pass) {
                res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
                res.sendStatus(401);
            } else {
                let result = await authorizer.isAuthenticated(orm, req, user.name, md5(user.pass));
                if (result) {
                    let cval = util.getContextFromUrl(req) + "." + uuidv1();
                    result.snosession = cval;
                    myCache.set(cval, user.name);
                    if (logger.isLogDebugEnabled()) {
                        logger.logDebug("login->myCache(" + cval + ")=" + myCache.get(cval));
                    }
                    res.status(200).send(result);
                } else {
                    res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
                    res.sendStatus(401);
                }
            }
        });

        apiServer.get('/*/api/query/modelnames', async function (req, res) {
            res.status(200).send(modelList);
        });

        apiServer.get('/*/api/query/document/groups', async function (req, res) {
            res.status(200).send(await loadQueryDocumentGroups());
        });

        apiServer.get('/*/api/report/document/groups', async function (req, res) {
            res.status(200).send(await loadReportDocumentGroups());
        });

        apiServer.get('/*/api/query/document/groupsonly', async function (req, res) {
            res.status(200).send(await loadQueryDocumentGroups(true));
        });

        apiServer.get('/*/api/report/lookupdefinitions', async function (req, res) {
            let rgroups = await loadReportDocumentGroups();
            if (logger.isLogDebugEnabled()) {
                logger.logDebug("lookupDefinitions=" + JSON.stringify(rgroups.lookupDefinitions));
            }
            res.status(200).send(rgroups.lookupDefinitions);
        });

        apiServer.post('/*/api/report/load/lookuplist', async function (req, res) {
            try {
                res.status(200).send(await loadLookupList(req.body, util.getContextFromUrl(req)));
            } catch(e) {
                logger.logError('error occured while loading lookup list', e);
                res.status(500).send(e);
            }
        });

        apiServer.get('/*/api/report/document/groupsonly', async function (req, res) {
            res.status(200).send(await loadReportDocumentGroups(true));
        });

        apiServer.post('/*/api/query/generatesql', async function (req, res) {
            try {
                res.status(200).send(buildQueryDocumentSql(req.body, new Map(), true));
            } catch (e) {
                logger.logError('error occured while building sql from query document', e);
                res.status(500).send(e);
            }
        });

        apiServer.post('/*/api/query/run', async function (req, res) {
            try {
                (async function () {
                    let doc = req.body;
                    try {
                        let options = {poolAlias: util.getContextFromUrl(req)};

                        if (doc.documentName && !doc.interactive) {
                            let params = doc.parameters;
                            doc = await loadQuery(doc.groupId + '.' + doc.documentName, options);
                            doc.parameters = params;

                        }

                        let aliasToModelMap = new Map();
                        let sql = buildQueryDocumentSql(doc, aliasToModelMap);

                        if (logger.isLogDebugEnabled()) {
                            logger.logDebug(util.toString(doc));
                            logger.logDebug(sql);
                        }

                        let repo = repositoryMap.get(doc.document.rootModel.toLowerCase());
                        let result = await repo.executeSqlQuery(sql, doc.parameters, options);
                        if (result.error) {
                            if (doc.validityCheckOnly) {
                                res.status(200).send('generated sql is invalid');
                            } else {
                                res.status(500).send(result.error);
                            }
                        } else if (doc.validityCheckOnly) {
                            res.status(200).send('generated sql is valid');
                        } else if (doc.resultFormat === 'result set') {
                            res.status(200).send(result);
                        } else {
                            try {
                                let retval = buildResultObjectGraph(doc, result.result.rows, aliasToModelMap);
                                res.status(200).send(retval);
                            } catch (e) {
                                logger.logError('error occured while building result object graph', e);
                                res.status(500).send(e);
                            }
                        }
                    } catch (e) {
                        logger.logError('error occured while running query document', e);
                        res.status(500).send(e);
                    }
                })(req, res);
            } catch (e) {
                logger.logError('error occured while running query document', e);
                res.status(500).send(e);
            }
        });

        apiServer.post('/*/api/query/save', async function (req, res) {
            try {
                saveQuery(req.body);
                res.status(200).send('success');
            } catch (e) {
                logger.logError('error occured while saving query document ' + req.body.documentName, e);
                res.status(500).send(e);
            }
        });

        apiServer.post('/*/api/report/save', async function (req, res) {
            try {
                saveReport(req.body);
                res.status(200).send('success');
            } catch (e) {
                logger.logError('error occured while saving query document ' + req.body.document.documentName, e);
                res.status(500).send(e);
            }
        });

        apiServer.get('/*/api/report/run/:docid', async function (req, res) {
            try {
                let options = {poolAlias: util.getContextFromUrl(req)};
                let report = await loadReport(req.params.docid, options);
                let query = await loadQuery(report.document.queryDocumentId, options);
                let requiredInputs = getRequiredInputFields(query.document);
                // see if we need user input
                if (requiredInputs.length > 0) {
                    res.status(200).send({"userInputRequired": true, "whereComparisons": requiredInputs});
                } else {
                    res.status(200).send(await generateReport(report, query, options));
                }
            } catch (e) {
                logger.logError('error occured while running report ' + req.params.docid, e);
                res.status(500).send(e);
            }
        });

        apiServer.post('/*/api/report/run/:docid', async function (req, res) {
            try {
                let options = {poolAlias: util.getContextFromUrl(req)};
                let report = await loadReport(req.params.docid, options);
                let query = await loadQuery(report.document.queryDocumentId, options);
                res.status(200).send(await generateReport(report, query, req.body.parameters, options));
            } catch (e) {
                logger.logError('error occured while running report ' + req.params.docid, e);
                res.status(500).send(e);
            }
        });

        apiServer.post('/*/api/report/runfordesign', async function (req, res) {
            try {
                let report = req.body.report;
                let options = {poolAlias: util.getContextFromUrl(req)};
                let query = await loadQuery(report.document.queryDocumentId, options);
                res.status(200).send(await generateReport(report, query, req.body.parameters, options));
            } catch (e) {
                logger.logError('error occured while running report ' + req.body.report.reportName, e);
                res.status(500).send(e);
            }
        });

        apiServer.get('/*/api/report/userinputrequired/:queryDocumentId', async function (req, res) {
            try {
                let options = {poolAlias: util.getContextFromUrl(req)};
                let query = await loadQuery(req.params.queryDocumentId, options);
                let requiredInputs = getRequiredInputFields(query.document);
                // see if we need user input
                if (requiredInputs.length > 0) {
                    res.status(200).send({"userInputRequired": true, "whereComparisons": requiredInputs});
                } else {
                    res.status(200).send({"userInputRequired": false});
                }
            } catch (e) {
                logger.logError('error occured while checking user input required ' + req.params.queryDocumentId, e);
                res.status(500).send(e);
            }
        });

        apiServer.get('/*/api/query/delete/:docid', async function (req, res) {
            try {
                deleteQuery(req.params.docid);
                res.status(200).send('success');
            } catch (e) {
                logger.logError('error occured while deleting query document ' + req.params.docid, e);
                res.status(500).send(e);
            }
        });

        apiServer.get('/*/api/report/delete/:docid', async function (req, res) {
            try {
                deleteReport(req.params.docid);
                res.status(200).send('success');
            } catch (e) {
                logger.logError('error occured while deleting report ' + req.params.docid, e);
                res.status(500).send(e);
            }
        });

        apiServer.get('/*/api/report/load/:docid', async function (req, res) {
            try {
                res.status(200).send(await loadReport(req.params.docid));
            } catch (e) {
                logger.logError('error occured while loading report ' + req.params.docid, e);
                res.status(500).send(e);
            }
        });

        apiServer.get('/*/api/report/querycolumninfo/:qdocid', async function (req, res) {
            try {
                let options = {poolAlias: util.getContextFromUrl(req)};
                let qdoc = await loadQuery(req.params.qdocid, options);

                let qcinfo = [];

                for (let i = 0; i < qdoc.document.selectedColumns.length; ++i) {
                    let fld = findField(repositoryMap.get(qdoc.document.rootModel.toLowerCase()).getMetaData(), qdoc.document.selectedColumns[i].path);
                    let label = qdoc.document.selectedColumns[i].label;
                    if (!label) {
                        label = fld.fieldName;
                    }

                    // SIM-3 add function
                    qcinfo.push({
                        path: qdoc.document.selectedColumns[i].path,
                        name: label,
                        type: fld.type,
                        function: qdoc.document.selectedColumns[i].function,
                        customInput: qdoc.document.selectedColumns[i].customInput,
                        length: fld.length
                    });
                }
                res.status(200).send(qcinfo);
            } catch (e) {
                logger.logError('error occured while loading query columns for query ' + req.params.qdocid, e);
                res.status(500).send(e);
            }
        });

        apiServer.get('/*/api/query/load/:docid', async function (req, res) {
            try {
                res.status(200).send(await loadQuery(req.params.docid));
            } catch (e) {
                logger.logError('error occured while loading document ' + req.params.docid, e);
                res.status(500).send(e);
            }
        });

        apiServer.get('/*/api/query/modeltree/:modelname', async function (req, res) {
            let repo = orm.getRepository(req.params.modelname);
            if (repo && repo.getMetaData()) {
                let data = {};
                data.key = 't0';
                data.title = req.params.modelname;
                loadModelData(data, repo.getMetaData(), [], '', false);
                if (data.title) {
                    res.status(200).json(data);
                } else {
                    res.status(404).send('not found');
                }
            } else {
                logger.logError('no model data found for ' + req.params.modelname);
                res.status(500).send('no model data found for ' + req.params.modelname);
            }
        });

        apiServer.get('/*/ormapi/:module/:method', async function (req, res) {
            try {
                let options = {poolAlias: util.getContextFromUrl(req)};

                if (logger.isLogDebugEnabled()) {
                    logger.logDebug("module: " + req.params.module);
                    logger.logDebug("method: " + req.params.method);
                    logger.logDebug("poolAlias: " + options.poolAlias);
                }

                let repo = getRepository(req.params.module);
                let md;
                if (util.isUndefined(repo)) {
                    // support for using an alias for long module names
                    if (util.isDefined(appConfiguration.aliases[req.params.module])) {
                        repo = repositoryMap.get(appConfiguration.aliases[req.params.module]);
                        md = repo.getMetaData(appConfiguration.aliases[req.params.module]);
                    }
                }

                if (!md) {
                    md = repo.getMetaData();
                }

                let params = [];
                let pk = md.getPrimaryKeyFields();
                let fields = md.getFields();

                if (util.isUndefined(repo) || util.isUndefined(md)) {
                    res.status(400).send('invalid module \'' + req.params.module + '\' specified');
                } else {
                    var result;
                    switch (req.params.method.toLowerCase()) {
                        case util.FIND_ONE.toLowerCase():
                            for (let i = 0; i < pk.length; ++i) {
                                params.push(req.query[pk[i].fieldName]);
                            }
                            result = await repo.findOne(params, options);
                            break;
                        case util.GET_ALL.toLowerCase():
                            result = await repo.getAll(options);
                            break;
                        case util.FIND.toLowerCase():
                            for (let i = 0; i < fields.length; ++i) {
                                if (util.isDefined(req.query[fields[i].fieldName])) {
                                    params.push(require('./main/WhereComparison.js')(fields[i].fieldName, req.query[fields[i].fieldName], util.EQUAL_TO));
                                }
                            }
                            result = await repo.find(params, options);
                            break;
                        case util.COUNT.toLowerCase():
                            for (let i = 0; i < fields.length; ++i) {
                                if (util.isDefined(req.query[fields[i].fieldName])) {
                                    params.push(require('./main/WhereComparison.js')(fields[i].fieldName, req.query[fields[i].fieldName], util.EQUAL_TO));
                                }
                            }
                            result = await repo.count(params, options);
                            break;
                        case util.EXISTS.toLowerCase():
                            for (let i = 0; i < pk.length; ++i) {
                                params.push(req.query[pk[i].fieldName]);
                            }
                            result = await repo.exists(params, options);
                            break;
                        case util.FIND_ONE_SYNC.toLowerCase():
                            for (let i = 0; i < pk.length; ++i) {
                                params.push(req.query[pk[i].fieldName]);
                            }
                            result = await repo.findOneSync(params, options);
                            break;
                        case util.GET_ALL_SYNC.toLowerCase():
                            result = await repo.getAllSync(params, options);
                            break;
                        case util.FIND_SYNC.toLowerCase():
                            for (let i = 0; i < fields.length; ++i) {
                                if (util.isDefined(req.query[fields[i].fieldName])) {
                                    params.push(require('./main/WhereComparison.js')(fields[i].fieldName, req.query[fields[i].fieldName], util.EQUAL_TO));
                                }
                            }
                            result = await repo.findSync(params, options);
                            break;
                        case util.COUNT_SYNC.toLowerCase():
                            for (let i = 0; i < fields.length; ++i) {
                                if (util.isDefined(req.query[fields[i].fieldName])) {
                                    params.push(require('./main/WhereComparison.js')(fields[i].fieldName, req.query[fields[i].fieldName], util.EQUAL_TO));
                                }
                            }
                            result = await repo.countSync(params, options);
                            break;
                        case util.EXISTS_SYNC.toLowerCase():
                            for (let i = 0; i < pk.length; ++i) {
                                params.push(req.query[pk[i].fieldName]);
                            }
                            result = await repo.existsSync(params, options);
                            break;
                        case util.NEW_MODEL.toLowerCase():
                            result = new (require(appConfiguration.ormModuleRootPath + '/model/' + req.params.module))(md);
                            break;
                        default:
                            res.status(400).send('invalid method \'' + req.params.method + '\' specified');
                            break;
                    }

                    if (util.isUndefined(result)) {
                        res.status(404).send('not found');
                    } else if (util.isDefined(result.error)) {
                        res.status(500).send(result.error);
                    } else if (util.isDefined(result.result)) {
                        if (options.includeMetaData) {
                            res.status(200).send(result.result);
                        } else {
                            res.status(200).send(util.toDataTransferString(result.result));
                        }
                    } else {
                        res.status(200).send(result);
                    }
                }

                res.end();
            } catch (err) {
                logger.logError("module: " + req.params.module);
                logger.logError("method: " + req.params.method);
                logger.logError("poolAlias: " + util.getContextFromUrl(req));
                logger.logError("unexpected error caught", err);
                res.status(500).send({result: { error: err}});
            }
        });

        apiServer.post('/*/ormapi/:module/:method', async function (req, res) {
            try {
                let repo = getRepository(req.params.module);
                let options = populateOptionsFromRequestInput(req.body.options);
                if (!options) {
                    options = {poolAlias: util.getContextFromUrl(req)};
                } else {
                    options.poolAlias = util.getContextFromUrl(req);
                }

                let md;
                if (util.isUndefined(repo)) {
                    // support for using an alias for long module names
                    if (util.isDefined(appConfiguration.aliases[req.params.module])) {
                        repo = repositoryMap.get(appConfiguration.aliases[req.params.module]);
                        md = repo.getMetaData(appConfiguration.aliases[req.params.module]);
                    }
                }

                if (!md) {
                    md = repo.getMetaData();
                }

                if (util.isUndefined(repo) || util.isUndefined(md)) {
                    res.status(400).send('invalid module \'' + req.params.module + '\' specified');
                } else {
                    let result;

                    switch (req.params.method.toLowerCase()) {
                        case util.FIND_ONE.toLowerCase():
                            result = await repo.findOne(req.body.primaryKeyValues, options);
                            break;
                        case util.FIND.toLowerCase():
                            result = await repo.find(populateWhereFromRequestInput(req.body.whereComparisons),
                                populateOrderByFromRequestInput(req.body.orderByEntries), options);
                            break;
                        case util.SAVE.toLowerCase():
                            startTransaction(repo, options);
                            result = await repo.save(populateModelObjectsFromRequestInput(req.body.modelInstances), options);
                            endTransaction(repo, result, options);
                            break;
                        case util.FIND_ONE_SYNC.toLowerCase():
                            result = await repo.findOneSYnc(req.body.primaryKeyValues);
                            break;
                        case util.FIND_SYNC.toLowerCase():
                            result = await repo.findSync(populateWhereFromRequestInput(req.body.whereComparisons),
                                populateOrderByFromRequestInput(req.body.orderByEntries), options);
                            break;
                        case util.SAVE_SYNC.toLowerCase():
                            startTransaction(repo, options);
                            result = repo.saveSync(populateModelObjectsFromRequestInput(req.body.modelInstances), options);
                            endTransaction(repo, result, options);
                            break;
                        case util.DELETE.toLowerCase():
                            startTransaction(repo, options);
                            result = await repo.delete(populateModelObjectsFromRequestInput(req.body.modelInstances), options);
                            endTransaction(repo, result, options);
                            break;
                        case util.DELETE_SYNC.toLowerCase():
                            startTransaction(repo, options);
                            result = repo.deleteSync(populateModelObjectsFromRequestInput(req.body.modelInstances), options);
                            endTransaction(repo, result, options);
                            break;
                        default:
                            res.status(400).send('invalid method \'' + req.params.method + '\' specified');
                            break;
                    }

                    if (util.isUndefined(result)) {
                        res.status(404).send('not found');
                    } else if (util.isDefined(result.error)) {
                        res.status(500).send(result.error);
                    } else if (util.isDefined(result.result)) {
                        if (options.includeMetaData) {
                            res.status(200).send(result.result);
                        } else {
                            res.status(200).send(util.toDataTransferString(result.result));
                        }
                    } else if (util.isDefined(result.updatedValues)) {
                        res.status(200).send(util.toDataTransferString(result.updatedValues));
                    } else if (util.isDefined(result.rowsAffected)) {
                        res.status(200).send(util.toDataTransferString(result));
                    } else {
                        res.status(200).send(result);
                    }
                }

                res.end();
            } catch (err) {
                logger.logError("module: " + req.params.module);
                logger.logError("method: " + req.params.method);
                logger.logError("poolAlias: " + util.getContextFromUrl(req));
                logger.logError("unexpected error caught", err);
                res.status(500).send({result: { error: err}});
            }
        });

        apiServer.put('/*/ormapi/:module/:method', async function (req, res) {
            let repo = repositoryMap.get(req.params.module);
            let options = populateOptionsFromRequestInput(req.body.options);
            if (!options) {
                options = {poolAlias: util.getContextFromUrl(req)};
            } else {
                options.poolAlias = util.getContextFromUrl(req);
            }
            let md = repo.getMetaData(req.params.module);
            if (util.isUndefined(repo)) {
                // support for using an alias for long module names
                if (util.isDefined(appConfiguration.aliases[req.params.module])) {
                    repo = repositoryMap.get(appConfiguration.aliases[req.params.module]);
                    md = repo.getMetaData(appConfiguration.aliases[req.params.module]);
                }
            }

            if (util.isUndefined(repo) || util.isUndefined(md)) {
                res.status(400).send('invalid module \'' + req.params.module + '\' specified');
            } else {
                let result;
                switch (req.params.method.toLowerCase()) {
                    case util.SAVE.toLowerCase():
                        startTransaction(repo, options);
                        result = await repo.save(populateModelObjectsFromRequestInput(req.body.modelInstances), options);
                        endTransaction(repo, result, options);
                        break;
                    case util.SAVE_SYNC.toLowerCase():
                        startTransaction(repo, options);
                        result = repo.saveSync(populateModelObjectsFromRequestInput(req.body.modelInstances), options);
                        endTransaction(repo, result, options);
                        break;
                    default:
                        res.status(400).send('invalid method \'' + req.params.method + '\' specified');
                        break;
                }

                if (util.isUndefined(result)) {
                    res.status(404).send('not found');
                } else if (util.isDefined(result.error)) {
                    res.status(500).send(result.error);
                } else if (util.isDefined(result.updatedValues)) {
                    res.status(200).send(util.toDataTransferString(result.updatedValues));
                } else if (util.isDefined(result.rowsAffected)) {
                    res.status(200).send(util.toDataTransferString(result));
                } else {
                    res.status(200).send(result);
                }
            }

            res.end();
        });

        apiServer.delete('/*/ormapi/:module/:method', async function (req, res) {
            let options = populateOptionsFromRequestInput(req.body.options);
            if (!options) {
                options = {poolAlias: util.getContextFromUrl(req)};
            } else {
                options.poolAlias = util.getContextFromUrl(req);
            }
            let repo = getRepository(req.params.module);
            let md = repo.getMetaData();
            if (util.isUndefined(repo)) {
                // support for using an alias for long module names
                if (util.isDefined(appConfiguration.aliases[req.params.module])) {
                    repo = repositoryMap.get(appConfiguration.aliases[req.params.module]);
                    md = repo.getMetaData(appConfiguration.aliases[req.params.module]);
                }
            }

            if (util.isUndefined(repo) || util.isUndefined(md)) {
                res.status(400).send('invalid module \'' + req.params.module + '\' specified');
            } else {
                let result;
                switch (req.params.method.toLowerCase()) {
                    case util.DELETE.toLowerCase():
                        startTransaction(repo, options);
                        result = await repo.delete(populateModelObjectsFromRequestInput(req.body.modelInstances), options);
                        endTransaction(repo, result, options);
                        break;
                    case util.DELETE_SYNC.toLowerCase():
                        startTransaction(repo, options);
                        result = repo.deleteSync(populateModelObjectsFromRequestInput(req.body.modelInstances), options);
                        endTransaction(repo, result, options);
                        break;
                    default:
                        res.status(400).send('invalid method \'' + req.params.method + '\' specified');
                        break;
                }

                if (util.isDefined(result.error)) {
                    res.status(500).send(result.error);
                } else if (util.isDefined(result.rowsAffected)) {
                    res.status(200).send(util.toDataTransferString(result));
                } else {
                    res.status(200).send(result);
                }
            }

            res.end();
        });
    }

    catch (e) {
        logger.logError('error occurred during api server start', e);
        apiServer = null;
    }

    return apiServer;
}

async function startTransaction(repo, options) {
    let conn = await getConnection(repo.getPoolAlias());
    await repo.doBeginTransaction(conn);
    options.conn = conn;
}

async function endTransaction(repo, result, options) {
    if (options.conn) {
        if (result.error) {
            repo.doRollback(options.conn);
        } else {
            repo.doCommit(options.conn);
        }

        switch(orm.getDbType(repo.poolAlias)) {
            case util.ORACLE:
                await options.conn.close();
                break;
            case util.MYSQL:
                await options.conn.release();
                break;
            case util.POSTGRES:
                await options.conn.release();
                break;
        }

        options.conn = '';
    }
}


function populateWhereFromRequestInput(input) {
    if (util.isUndefined(input)) {
        return input;
    } else {
        if (util.isString(input)) {
            input = JSON.parse(input);
        }

        let retval = [];

        for (let i = 0; i < input.length; ++i) {
            let wc = require('./main/WhereComparison.js')();
            Object.assign(wc, input[i]);
            retval.push(wc);
        }

        return retval;
    }
}

function populateOrderByFromRequestInput(input) {
    if (util.isUndefined(input)) {
        return input;
    } else {
        if (util.isString(input)) {
            input = JSON.parse(input);
        }

        let retval = [];

        for (let i = 0; i < input.length; ++i) {
            let obe = require('./main/OrderByEntry.js')();
            Object.assign(obe, input[i]);
            retval.push(obe);
        }

        return retval;
    }
}

function populateModelObjectsFromRequestInput(input) {
    if (util.isUndefined(input)) {
        return input;
    } else {
        if (util.isString(input)) {
            input = JSON.parse(input);
        }

        let retval = [];

        if (input.length > 0) {
            let md = getRepository(input[0].__model__).getMetaData();

            for (let i = 0; i < input.length; ++i) {
                let model = require(appConfiguration.ormModuleRootPath + "/" + md.getModule())(md);
                Object.assign(model, input[i]);
                retval.push(model);
            }
        }

        return retval;
    }
}

async function loadLookupList(lookupDef, ctx) {
    if (logger.isLogDebugEnabled()) {
        logger.logInfo("lookupDefinition=" + JSON.stringify(lookupDef));
    }

    let retval = myCache.get("reportlookuplist");

    if (!retval) {
        let repo = getRepository(lookupDef.modelName);
        let sql = "select " + lookupDef.key + ", " + lookupDef.displayField + " from " + lookupDef.table + " order by " + lookupDef.orderBy;
        let result = parseOrmResult(await repo.executeSqlQuery(sql, [], {poolAlias: ctx}), "LoadLookupListException");


        if (logger.isLogDebugEnabled()) {
            logger.logInfo("loadLookupList.result=" + JSON.stringify(result));
        }


        retval = [];

        for (let i = 0; i < result.length; ++i) {
            retval.push({
                key: result[i][0],
                name: result[i][1]
            });
        }

        myCache.set("reportlookuplist", retval);
    }

    return retval;
}

function populateOptionsFromRequestInput(input) {
    let retval = input;

    if (util.isDefined(input)) {
        if (util.isString(input)) {
            retval = JSON.parse(input);
        }
    }

    return retval;
}

async function createTablesIfRequired() {
    let newTableRepos = [];
    logger.logInfo('in createTablesIfRequired()');

    let keys = Array.from(repositoryMap.keys());

    for (let i = 0; i < keys.length; ++i) {
        let repo = repositoryMap.get(keys[i]);
        let exists = await repo.tableExists();
        if (!exists) {
            logger.logInfo('creating table ' + repo.getMetaData().getTableName());
            await repo.createTable();
            newTableRepos.push(repo);
        }
    }

    for (let i = 0; i < newTableRepos.length; ++i) {
        logger.logInfo('adding forign keys for table ' + newTableRepos[i].getMetaData().getTableName() + ' if required');
        await newTableRepos[i].createForeignKeys();
        logger.logInfo('creating sequences for ' + newTableRepos[i].getMetaData().getTableName() + ' if required');
        await newTableRepos[i].createAutoIncrementGeneratorIfRequired();
    }
}

function loadModelData(data, md, refs, path, child) {
    data.objectName = md.objectName;
    data.tableName = md.tableName;
    data.children = [];

    for (let i = 0; i < md.fields.length; ++i) {
        let f = Object.assign({}, md.fields[i]);
        f.title = f.fieldName;
        f.isLeaf = true;
        f.key = getUniqueKey();
        if (path) {
            f.__path__ = path + '.' + f.fieldName;
        } else {
            f.__path__ = f.fieldName;
        }
        data.children.push(f);
    }

    if (md) {
        if (!child && md.manyToOneDefintions) {
            for (let i = 0; i < md.manyToOneDefinitions.length; ++i) {
                if (md.manyToOneDefinitions[i].targetModelName) {
                    let repo = repositoryMap.get(md.manyToOneDefinitions[i].targetModelName.toLowerCase());
                    let newpath;
                    if (path) {
                        newpath = path + '.' + md.manyToOneDefinitions[i].fieldName;
                    } else {
                        newpath = md.manyToOneDefinitions[i].fieldName;
                    }
                    if (repo) {
                        let def = {};
                        def.key = getUniqueKey();
                        def.__path__ = newpath;
                        def.__type__ = 'mto';
                        def.title = md.manyToOneDefinitions[i].fieldName;
                        def.joinColumns = md.manyToOneDefinitions[i].joinColumns;
                        def.targetModelName = md.manyToOneDefinitions[i].targetModelName;
                        def.targetTableName = md.manyToOneDefinitions[i].targetTableName;
                        if (!circularReference(refs, def)) {
                            refs.push(def);
                            loadModelData(def, repo.metaData, refs, newpath, true);
                            data.children.push(def);
                            if (data.key === 't0') {
                                refs = [];
                            }
                        }
                    }
                }
            }
        }

        if (md.oneToOneDefinitions) {
            for (let i = 0; i < md.oneToOneDefinitions.length; ++i) {
                if (md.oneToOneDefinitions[i].targetModelName) {
                    let repo = repositoryMap.get(md.oneToOneDefinitions[i].targetModelName.toLowerCase());
                    let newpath;
                    if (path) {
                        newpath = path + '.' + md.oneToOneDefinitions[i].fieldName;
                    } else {
                        newpath = md.oneToOneDefinitions[i].fieldName;
                    }
                    if (repo) {
                        let def = {};
                        def.key = getUniqueKey();
                        def.__path__ = newpath;
                        def.__type__ = 'oto';
                        def.title = md.oneToOneDefinitions[i].fieldName;
                        def.joinColumns = md.oneToOneDefinitions[i].joinColumns;
                        def.targetModelName = md.oneToOneDefinitions[i].targetModelName;
                        def.targetTableName = md.oneToOneDefinitions[i].targetTableName;
                        if (!circularReference(refs, def)) {
                            refs.push(def);
                            loadModelData(def, repo.metaData, refs, newpath, true);
                            data.children.push(def);
                            if (data.key === 't0') {
                                refs = [];
                            }
                        }
                    }
                }
            }
        }

        if (md.oneToManyDefinitions) {
            for (let i = 0; i < md.oneToManyDefinitions.length; ++i) {
                if (md.oneToManyDefinitions[i].targetModelName) {
                    let repo = repositoryMap.get(md.oneToManyDefinitions[i].targetModelName.toLowerCase());
                    let newpath;

                    if (path) {
                        newpath = path + '.' + md.oneToManyDefinitions[i].fieldName;
                    } else {
                        newpath = md.oneToManyDefinitions[i].fieldName;
                    }

                    if (repo) {
                        let def = {};
                        def.__path__ = newpath;
                        def.__type__ = 'otm';
                        def.key = getUniqueKey();
                        def.title = md.oneToManyDefinitions[i].fieldName;
                        def.joinColumns = md.oneToManyDefinitions[i].joinColumns;
                        def.targetModelName = md.oneToManyDefinitions[i].targetModelName;
                        def.targetTableName = md.oneToManyDefinitions[i].targetTableName;
                        if (!circularReference(refs, def)) {
                            refs.push(def);
                            loadModelData(def, repo.metaData, refs, newpath, true);
                            data.children.push(def);
                            if (data.key === 't0') {
                                refs = [];
                            }
                        }
                    }
                }
            }
        }
    }
}

function circularReference(parentRefs, curRef) {
    let retval = false;
    let curnm = (curRef.title + '.' + curRef.targetModelName);

    for (let i = 0; i < parentRefs.length; ++i) {
        let refnm = parentRefs[i].title + '.' + parentRefs[i].targetModelName;
        if (curnm === refnm) {
            retval = true;
            break;
        }
    }

    return retval;
}

function getUniqueKey() {
    return uuidv1();
}

module.exports.buildQueryDocumentSql = buildQueryDocumentSql;

function buildQueryDocumentSql(queryDocument, aliasToModelMap, forDisplay) {
    let relationshipTree = loadRelationshipTree(queryDocument.document);
    let joins = [];
    let joinset = new Set();
    let aliasMap = new Map();
    aliasToModelMap.set("t0", queryDocument.document.rootModel);
    for (let i = 0; i < relationshipTree.length; ++i) {
        buildQueryDocumentJoins('t0', relationshipTree[i], joins, joinset, aliasMap, aliasToModelMap);
    }

    let sql = 'select ';
    if (queryDocument.distinct) {
        sql += ' distinct ';
    }
    let comma = '';
    for (let i = 0; i < queryDocument.document.selectedColumns.length; ++i) {
        let pos = queryDocument.document.selectedColumns[i].path.lastIndexOf('.');
        let alias;
        let colName;
        let repo;
        if (pos < 0) {
            alias = 't0';
            repo = repositoryMap.get(queryDocument.document.rootModel.toLowerCase());
            let md = repo.getMetaData();
            colName = md.getField(queryDocument.document.selectedColumns[i].path).columnName;
            queryDocument.document.selectedColumns[i].model = queryDocument.document.rootModel;
        } else {
            let info = aliasMap.get(queryDocument.document.selectedColumns[i].path.substring(0, pos));
            if (info) {
                repo = repositoryMap.get(info.model.toLowerCase());
                let md = repo.getMetaData();
                queryDocument.document.selectedColumns[i].model = info.model;
                colName = md.getField(queryDocument.document.selectedColumns[i].path.substring(pos + 1)).columnName;
                alias = info.alias;
            }
        }

        queryDocument.document.selectedColumns[i].alias = alias;

        if (queryDocument.document.selectedColumns[i].customInput) {
            sql += (comma + queryDocument.document.selectedColumns[i].customInput.replace('?', alias + '.' + colName).replace(/\$/g, alias));

        } else {
            if (queryDocument.document.selectedColumns[i].function) {
                sql += (comma + queryDocument.document.selectedColumns[i].function + '(' + alias + '.' + colName + ')');
            } else {
                sql += (comma + alias + '.' + colName);
            }
        }

        if (queryDocument.document.selectedColumns[i].label) {
            sql += (' as "' + queryDocument.document.selectedColumns[i].label + '" ');
        } else if (!forDisplay && (dbTypeMap.get(repo.poolAlias) === 'mysql')) {
            sql += (' as ' + alias + '_' + colName)
        }
        comma = ', ';
    }

    // SIM-4 - add any missing primary key values if object graph result
    // need the primary keys to build object graph correctly
    let requiredPkColumns;

    if (queryDocument.resultFormat === 'object') {
        requiredPkColumns = getMissingPKColumnsForObjectResultSelect(queryDocument, aliasMap);
        if (requiredPkColumns && (requiredPkColumns.length > 0)) {
            for (let i = 0; i < requiredPkColumns.length; ++i) {
                sql += (',' + requiredPkColumns[i].alias + '.' + requiredPkColumns[i].columnName);

                if (!forDisplay && (dbTypeMap.get(requiredPkColumns[i].poolAlias) === util.MYSQL)) {
                    sql += (' as ' + requiredPkColumns[i].alias + '_' + requiredPkColumns[i].columnName)
                }

                queryDocument.document.selectedColumns.push(requiredPkColumns[i]);
            }
        }
    }


    let md = repositoryMap.get(queryDocument.document.rootModel.toLowerCase()).getMetaData();
    sql += (' from ' + md.tableName + ' t0 ');

    for (let i = 0; i < joins.length; ++i) {
        sql += (' ' + joins[i]);
    }

    sql += ' where ';

    let replaceIndex = 1;
    for (let i = 0; i < queryDocument.document.whereComparisons.length; ++i) {

        if (i > 0) {
            sql += (' ' + queryDocument.document.whereComparisons[i].logicalOperator + ' ');
        }

        let alias;
        let field;
        let repo;
        let pos = queryDocument.document.whereComparisons[i].fieldName.lastIndexOf('.');
        if (pos < 0) {
            alias = 't0';
            repo = repositoryMap.get(queryDocument.document.rootModel.toLowerCase());
            let md = repo.getMetaData();
            field = md.getField(queryDocument.document.whereComparisons[i].fieldName);
        } else {
            let info = aliasMap.get(queryDocument.document.whereComparisons[i].fieldName.substring(0, pos));
            repo = repositoryMap.get(info.model.toLowerCase());
            let md = repo.getMetaData();
            field = md.getField(queryDocument.document.whereComparisons[i].fieldName.substring(pos + 1));
            alias = info.alias;
        }
        if (queryDocument.document.whereComparisons[i].customFilterInput) {
            let fname = (alias + '.' + field.columnName);
            sql += (' ' + queryDocument.document.whereComparisons[i].customFilterInput.replace('?', fname) + ' ');
        } else {
            if (queryDocument.document.whereComparisons[i].openParen) {
                sql += queryDocument.document.whereComparisons[i].openParen;
            }

            sql += (' ' + alias + '.' + field.columnName + ' ' + queryDocument.document.whereComparisons[i].comparisonOperator);

            if (!util.isUnaryOperator(queryDocument.document.whereComparisons[i].comparisonOperator)) {
                if (queryDocument.document.whereComparisons[i].comparisonValue) {
                    if (repo.isDateType(field)) {
                        switch(dbTypeMap.get(repo.poolAlias)) {
                            case util.ORACLE:
                                sql += ' to_timestamp(\'' + queryDocument.document.whereComparisons[i].comparisonValue + '\', \'YYYY-MM-DD"T"HH24:MI:SS.ff3"Z"\') ';
                                break;
                            case util.MYSQL:
                                sql += (' \'' + queryDocument.document.whereComparisons[i].comparisonValue + '\'');
                                break;
                        }
                    } else if (util.isQuoteRequired(field)) {
                        if (queryDocument.document.whereComparisons[i].comparisonOperator === 'in') {
                            let vals = queryDocument.document.whereComparisons[i].comparisonValue.split(',');
                            comma = '';
                            sql += '(';
                            for (let j = 0; j < vals.length; ++j) {
                                sql += (comma + '\'' + vals[j] + '\'');
                                comma = ',';
                            }
                            sql += ')';
                        } else {
                            sql += (' \'' + queryDocument.document.whereComparisons[i].comparisonValue + '\'');
                        }
                    } else {
                        if (queryDocument.document.whereComparisons[i].comparisonOperator === 'in') {
                            let vals = queryDocument.document.whereComparisons[i].comparisonValue.split(',');
                            comma = '';
                            sql += '(';
                            for (let j = 0; j < vals.length; ++j) {
                                sql += (comma + vals[j]);
                                comma = ',';
                            }
                            sql += ')';
                        } else {
                            sql += (' ' + queryDocument.document.whereComparisons[i].comparisonValue);
                        }

                    }
                } else {
                    switch (dbTypeMap.get(repo.poolAlias)) {
                        case util.ORACLE:
                            sql += (' :' + replaceIndex + ' ');
                            break;
                        case util.POSTGRES:
                        case util.MYSQL:
                            sql += (' ? ');
                            break;
                    }

                    replaceIndex++;
                }
            }

            if (queryDocument.document.whereComparisons[i].closeParen) {
                sql += queryDocument.document.whereComparisons[i].closeParen;
            }
        }
    }

    if (requiresGroupBy(queryDocument.document.selectedColumns)) {
        sql += ' group by ';
        comma = '';
        for (let i = 0; i < queryDocument.document.selectedColumns.length; ++i) {
            if (!queryDocument.document.selectedColumns[i].function) {
                let alias;
                let colName;
                let pos = queryDocument.document.selectedColumns[i].path.lastIndexOf('.');

                if (pos < 0) {
                    alias = 't0';
                    let md = repositoryMap.get(queryDocument.document.rootModel.toLowerCase()).getMetaData();
                    colName = md.getField(queryDocument.document.selectedColumns[i].path).columnName;
                } else {
                    let info = aliasMap.get(queryDocument.document.selectedColumns[i].path.substring(0, pos));
                    let md = repositoryMap.get(info.model.toLowerCase()).getMetaData();
                    colName = md.getField(queryDocument.document.selectedColumns[i].path.substring(pos + 1)).columnName;
                    alias = info.alias;
                }

                if (queryDocument.document.selectedColumns[i].customInput) {
                    sql += (comma + ' ' + queryDocument.document.selectedColumns[i].customInput.replace('?', (alias + '.' + colName)));
                } else {
                    sql += (comma + ' ' + alias + '.' + colName);
                }

                comma = ',';
            }
        }
    }

    let orderByColumns = getOrderByColumns(queryDocument.document.selectedColumns);

    if (orderByColumns.length > 0) {
        comma = '';
        sql += ' order by ';

        for (let i = 0; i < orderByColumns.length; ++i) {
            let pos = orderByColumns[i].path.lastIndexOf('.');
            let alias;
            let colName;

            if (pos < 0) {
                alias = 't0';
                let md = repositoryMap.get(queryDocument.document.rootModel.toLowerCase()).getMetaData();
                colName = md.getField(orderByColumns[i].path).columnName;
            } else {
                let info = aliasMap.get(orderByColumns[i].path.substring(0, pos));
                let md = repositoryMap.get(info.model.toLowerCase()).getMetaData();
                colName = md.getField(orderByColumns[i].path.substring(pos + 1)).columnName;
                alias = info.alias;
            }

            if (orderByColumns[i].function) {
                sql += (comma + orderByColumns[i].function + '(' + alias + '.' + colName + ')');
            } else if (orderByColumns[i].customInput) {
                sql += (comma + ' ' + orderByColumns[i].customInput.replace('?', (alias + '.' + colName)));
            } else {
                sql += (comma + ' ' + alias + '.' + colName);
            }

            if (orderByColumns[i].sortDescending) {
                sql += ' desc';
            }

            comma = ',';
        }
    }

    return sql;
}

function getMissingPKColumnsForObjectResultSelect(queryDocument, aliasMap) {
    let retval = [];
    if (!requiresGroupBy(queryDocument.document.selectedColumns)) {
        let tset = new Set();

        for (let i = 0; i < queryDocument.document.selectedColumns.length; ++i) {
            let pos = queryDocument.document.selectedColumns[i].path.lastIndexOf('.');
            let alias;
            let repo;
            if (pos < 0) {
                repo = repositoryMap.get(queryDocument.document.rootModel.toLowerCase());
                alias = 't0';
            } else {
                let info = aliasMap.get(queryDocument.document.selectedColumns[i].path.substring(0, pos));
                alias = info.alias;
                repo = repositoryMap.get(info.model.toLowerCase());
            }

            // evaluate missing primary keys for model
            if (!tset.has(alias)) {
                tset.add(alias);
                let pkkeys = repo.getMetaData().getPrimaryKeyFields();
                let model = repo.getMetaData().objectName;
                let pkmap = new Map();
                for (let j = 0; j < pkkeys.length; ++j) {
                    pkmap.set(pkkeys[j].fieldName, pkkeys[j]);
                }

                let parentPath = '@#$';
                let fieldName = queryDocument.document.selectedColumns[i].path;
                if (pos > -1) {
                    parentPath = queryDocument.document.selectedColumns[i].path.substring(0, pos);
                    fieldName = queryDocument.document.selectedColumns[i].path.substring(pos + 1);
                }

                for (let j = 0; j < queryDocument.document.selectedColumns.length; ++j) {
                    let pos2 = queryDocument.document.selectedColumns[j].path.lastIndexOf('.');
                    let curParentPath = '@#$';
                    if (pos2 > -1) {
                        curParentPath = queryDocument.document.selectedColumns[j].path.substring(0, pos2);
                    }

                    if (parentPath === curParentPath) {
                        if (pkmap.has(fieldName)) {
                            pkmap.delete(fieldName);
                        }
                    }

                    if (pkmap.size === 0) {
                        break;
                    }
                }

                if (pkmap.size > 0) {
                    for (let [k, v] of pkmap) {
                        let sc = {};
                        sc.alias = alias;
                        sc.poolAlias = repo.poolAlias;
                        sc.model = model;
                        sc.columnName = v.columnName;
                        if (parentPath !== '@#$') {
                            sc.path = parentPath + '.' + k;
                        } else {
                            sc.path = k;
                        }

                        retval.push(sc);
                    }
                }
            }
        }
    }

    return retval;
}



function getOrderByColumns(selectedColumns) {
    let retval = [];

    for (let i = 0; i < selectedColumns.length; ++i) {
        if (selectedColumns[i].sortPosition) {
            retval.push(selectedColumns[i]);
        }
    }

    retval.sort(function (a, b) {
        return (a.sortPosition - b.sortPosition);
    });

    return retval;
}

function requiresGroupBy(selectedColumns) {
    let haveFunctions = false;
    let haveNonFunctions = false;
    for (let i = 0; i < selectedColumns.length; ++i) {
        if (selectedColumns[i].function) {
            haveFunctions = true;
        } else {
            haveNonFunctions = true;
        }
    }


    return (haveFunctions && haveNonFunctions);
}

function loadRelationshipTree(queryDocument) {
    let retval = [];
    let paths = getDistinctJoinPaths(queryDocument.selectedColumns);
    for (let i = 0; i < paths.length; ++i) {
        let l = [];
        retval.push(l);
        loadRelationships(queryDocument.rootModel, paths[i], l);
    }

    return retval;
}

function loadRelationships(model, path, rlist) {
    let pos = path.indexOf('.');
    let fieldName;
    if (pos < 0) {
        fieldName = path;
    } else {
        fieldName = path.substring(0, pos);
    }
    let md = repositoryMap.get(model.toLowerCase()).getMetaData();
    if (util.isDefined(md)) {
        let def = md.findRelationshipByName(fieldName);
        if (util.isDefined(def)) {
            rlist.push(def);
            if (fieldName !== path) {
                loadRelationships(def.targetModelName, path.substring(pos + 1), rlist);
            }
        }
    }
}

function getDistinctJoinPaths(selectedColumns) {
    let retval = [];
    let pset = new Set();

    for (let i = 0; i < selectedColumns.length; ++i) {
        let pos = selectedColumns[i].path.lastIndexOf('.');
        let rootPath;
        if (pos > -1) {
            rootPath = selectedColumns[i].path.substring(0, pos);
            if (!pset.has(rootPath)) {
                retval.push(rootPath);
                pset.add(rootPath);
            }
        }
    }

    retval.sort(function (a, b) {
        return (b.length - a.length);
    });

    return retval;
}

function buildQueryDocumentJoins(parentAlias, relationships, joins, joinset, aliasMap, aliasToModelMap) {
    let pathPart = '';
    let dot = '';
    for (let i = 0; i < relationships.length; ++i) {
        let alias = (parentAlias + relationships[i].alias);

        let join;

        if (relationships[i].required) {
            join = ' join ';
        } else {
            join = ' left outer join ';
        }

        join += (relationships[i].targetTableName + ' ' + alias + ' on (');

        aliasToModelMap.set(alias, relationships[i].targetModelName);

        pathPart += (dot + relationships[i].fieldName);
        dot = '.';

        aliasMap.set(pathPart, {alias: alias, model: relationships[i].targetModelName});
        let srccols = relationships[i].joinColumns.sourceColumns.split(',');
        let tgtcols = relationships[i].joinColumns.targetColumns.split(',');
        let and = '';
        for (let j = 0; j < srccols.length; ++j) {
            join += (and + alias + '.' + tgtcols[j] + ' = ' + parentAlias + '.' + srccols[j]);
            and = ' and ';
        }

        join += ') ';

        if (!joinset.has(join)) {
            joins.push(join);
            joinset.add(join);
        }

        parentAlias = alias;
    }
}

function saveQuery(doc) {
    let fname = appConfiguration.queryDocumentRoot + path.sep + doc.group + path.sep + doc.documentName + '.json';
    fspath.writeFile(fname, JSON.stringify(doc), function (err) {
        if (err) {
            throw err;
        } else {
            logger.logInfo('file created: ' + fname);
        }
    });
}

function saveReport(doc) {
    let fname = appConfiguration.reportDocumentRoot + path.sep + doc.group + path.sep + doc.document.reportName + '.json';
    fspath.writeFile(fname, JSON.stringify(doc), function (err) {
        if (err) {
            throw err;
        } else {
            logger.logInfo('file created: ' + fname);
        }
    });
}

function deleteQuery(docid) {
    let pos = docid.indexOf('.');
    let group = docid.substring(0, pos);
    let docName = docid.substring(pos + 1);

    let fname = appConfiguration.queryDocumentRoot + path.sep + group + path.sep + docName;
    fs.unlinkSync(fname);
}

function deleteReport(docid) {
    let pos = docid.indexOf('.');
    let group = docid.substring(0, pos);
    let reportName = docid.substring(pos + 1);

    let fname = appConfiguration.reportDocumentRoot + path.sep + group + path.sep + reportName;
    fs.unlinkSync(fname);
}

async function loadQuery(docid) {
    let pos = docid.indexOf('.');
    let group = docid.substring(0, pos);
    let docName = docid.substring(pos + 1);

    let fname = (appConfiguration.queryDocumentRoot + path.sep + group + path.sep + docName);

    if (!fname.endsWith('.json')) {
        fname = fname + '.json';
    }
    return JSON.parse(fs.readFileSync(fname));
}

async function loadReport(docid) {
    let pos = docid.indexOf('.');
    let group = docid.substring(0, pos);
    let reportName = docid.substring(pos + 1);

    let fname = (appConfiguration.reportDocumentRoot + path.sep + group + path.sep + reportName);

    if (!fname.endsWith('.json')) {
        fname += '.json';
    }
    return JSON.parse(fs.readFileSync(fname));
}

module.exports.buildResultObjectGraph = buildResultObjectGraph;

function buildResultObjectGraph (doc, resultRows, aliasToModelMap, asObject) {
    let retval = [];
    let positionMap = new Map();
    let keyColumnMap = new Map();
    let aliasList = [];

    if (logger.isLogDebugEnabled()) {
        logger.logDebug("aliasToModelMap: ");
        for (let [k, v] of aliasToModelMap) {
            logger.logDebug(k + '=' + v);
        }
    }

    // determine the various table column positions in the select
    for (let i = 0; i < doc.document.selectedColumns.length; ++i) {
        let pos = positionMap.get(doc.document.selectedColumns[i].alias);
        if (util.isUndefined(pos)) {
            pos = [];
            positionMap.set(doc.document.selectedColumns[i].alias, pos);
            aliasList.push(doc.document.selectedColumns[i].alias);
        }

        pos.push(i);
    }

    for (var [key, value] of positionMap) {
        let keypos = keyColumnMap.get(key);
        // see if we have all primary key columns in select
        if (util.isUndefined(keypos)) {
            let md = repositoryMap.get(doc.document.selectedColumns[value[0]].model.toLowerCase()).getMetaData();
            let keySet = new Set();
            let pkfields = md.getPrimaryKeyFields();
            for (let i = 0; i < pkfields.length; ++i) {
                keySet.add(pkfields.fieldName);
            }

            let keyPositions = [];
            for (let i = 0; i < value.length; ++i) {
                let fieldName = doc.document.selectedColumns[value[i]].path.substring(doc.document.selectedColumns[value[i]].path.lastIndexOf('.'));

                if (keySet.has(fieldName)) {
                    keyPositions.push(value[i]);
                }
            }

            if (keyPositions.length === keySet.size) {
                keyColumnMap.set(doc.document.selectedColumns[value[0]].alias, keyPositions);
            } else {
                keyColumnMap.set(doc.document.selectedColumns[value[0]].alias, value);
            }
        }
    }

    aliasList.sort();

    // object references by key
    let objectMap = new Map();
    //object references by alias fr current branch
    let parentObjectMap = new Map();

    for (let i = 0; i < resultRows.length; ++i) {
        let key = '';
        for (let j = 0; j < aliasList.length; ++j) {
            let alias = aliasList[j];
            let keypos = keyColumnMap.get(alias);

            let pkey = buildObjectKeyFromRowPositions(resultRows[i], keypos);

            if (pkey) {
                key += ('.' + pkey);
            }

            if (pkey) {
                let model = objectMap.get(key);
                let newModel = false;
                if (!model) {
                    newModel = true;
                    model = {};
                    if (alias === 't0') {
                        model.__model__ = doc.document.rootModel;
                        retval.push(model);
                        parentObjectMap = new Map();
                        parentObjectMap.set(alias, model);
                    } else {
                        let parentAlias = alias.substring(0, alias.lastIndexOf('t'));
                        let parentModel = parentObjectMap.get(parentAlias);
                        let fieldName = getParentFieldNameFromPath(doc.document.selectedColumns[keypos[0]].path);
                        let ref = getRepository(aliasToModelMap.get(parentAlias)).getMetaData().findRelationshipByName(fieldName);
                        if (logger.isLogDebugEnabled()) {
                            logger.logDebug("parentAlias: " + alias.substring(0, alias.lastIndexOf('t')));
                            logger.logDebug("parentModel: " + aliasToModelMap.get(parentAlias));
                            if (parentModel) {
                                logger.logDebug("parentObject: " + JSON.stringify(parentModel));
                            } else {
                                logger.logDebug("parentObject: not found");
                            }
                        }
                        model.__model__ = ref.targetModelName;
                        if (ref.type === 1) {
                            parentModel[fieldName] = model;
                        } else {
                            if (!parentModel[fieldName]) {
                                parentModel[fieldName] = [];
                            }
                            parentModel[fieldName].push(model);
                        }
                        parentObjectMap.set(alias, model);
                    }
                    objectMap.set(key, model);
                }

                if (newModel) {
                    let colpos = positionMap.get(alias);
                    for (let l = 0; l < colpos.length; ++l) {
                        let pos = doc.document.selectedColumns[colpos[l]].path.lastIndexOf('.');
                        let fieldName = doc.document.selectedColumns[colpos[l]].path.substring(pos + 1);

                        model[fieldName] = resultRows[i][colpos[l]];
                    }
                }
            }
        }
    }

    if (retval && (retval.length === 1)) {
        retval = retval[0];
    }

    if (!asObject) {
        return JSON.stringify(retval);
    } else {
        return retval;
    }
}

function getParentFieldNameFromPath(path) {
    let parts = path.split('.');
    return parts[parts.length-2];
}

function buildObjectKeyFromRowPositions(row, keypos) {
    let retval = '';
    let dot = '';
    let allNull = true;
    for (let j = 0; j < keypos.length; ++j) {
        if (row[keypos[j]]) {
            allNull = false;
        }
        retval += (dot + row[keypos[j]]);
        dot = '.'
    }

    if (allNull) {
        retval = '';
    }

    return retval;
}

function findField(metaData, fieldPath) {
    let fields = fieldPath.split('.');
    let i = 0;
    if (fields.length > 1) {
        for (; i < fields.length - 1; ++i) {
            metaData = repositoryMap.get(metaData.getReferenceDefinition(fields[i]).targetModelName.toLowerCase()).getMetaData();
        }
    }
    return metaData.getField(fields[i]);
}

function getRequiredInputFields(querydoc) {
    let retval = [];
    for (let i = 0; i < querydoc.whereComparisons.length; ++i) {
        if (!querydoc.whereComparisons[i].customFilterInput
            && !isUnaryOperator(querydoc.whereComparisons[i].comparisonOperator)
            && !querydoc.whereComparisons[i].comparisonValue) {
            retval.push(querydoc.whereComparisons[i]);
        }
    }

    return retval;
}

function isUnaryOperator(op) {
    return (op && ((op === 'is null') || (op === 'is not null')));
}

async function generateReport(report, query, parameters, options) {
    let retval = '';

    // SIM-4 all reports will run from object graphs
    query.document.resultFormat = 'object';
    let aliasToModelMap = new Map();
    let sql = buildQueryDocumentSql(query, aliasToModelMap);

    if (logger.isLogDebugEnabled()) {
        logger.logDebug(util.toString(query));
        logger.logDebug(sql);
    }

    let repo = repositoryMap.get(query.document.rootModel.toLowerCase());
    if (!parameters) {
        parameters = [];
    }
    let result = await repo.executeSqlQuery(sql, parameters, options);
    if (result.error) {
        throw new Error(result.error);
    } else {
        let haveCharts = false;

        let resultSet = buildResultObjectGraph(query, result.result.rows, aliasToModelMap, true);

        // expect to work with array of results so
        // make an array if only 1 object comes back
        if (!Array.isArray(resultSet)) {
            resultSet = [resultSet];
        }
        let ppi = report.document.pixelsPerInch;
        let width = Number(report.document.documentWidth/ppi).toFixed(3);
        let height = Number((report.document.documentHeight -2)/ppi).toFixed(3);
        let marginLeft = report.document.margins[0] / ppi;
        let marginTop = report.document.margins[1] / ppi;
        let chartData = {};

        /*
        let style = '@media print { .printIcon { display: none; } body {width: '
            + width
            + 'in;} @media screen .pb { display: block; height: 1px; page-break-before: always;}} @page {page-size: '
            + report.document.documentSize
            + '; orientation: '
            + report.document.orientation
            + '; margin: 0;}'
            + '.page {position: relative; background-color: white; width: '
            + width
            + 'in; height: '
            + height
            + 'in;} @media screen .pb { display: block; height: 4px; page-break-before: always; width: 100%; background: black}'
*/
        let style = ' @media print { '
            + ' .printButton { display: none; } '
            + ' body {width: ' + width + 'in;} '
            + ' .pb { display: block; height: 1px; page-break-before: always;} '
            + ' @page {page-size: ' + report.document.documentSize + '; orientation: ' + report.document.orientation + '; margin: 0;} '
            + ' } '
            + ' @media screen {'
            + '.page {position: relative; background-color: white; width: '+ width + 'in; height: '+ height+ 'in;} '
            + ' .pb { display: block; height: 4px; page-break-before: always; width: 100%; background: black} '
            + ' .printButton { left: 15px; top: 15px; cursor: pointer; position: fixed; z-index: 500;} '
            + ' }';

        let headerObjects = [];
        let bodyObjects = [];
        let footerObjects = [];
        let columnMap = new Map();

        if (report.document.reportColumns) {
            for (let i = 0; i < report.document.reportColumns.length; ++i) {
                columnMap.set(report.document.reportColumns[i].key, report.document.reportColumns[i]);
            }
        }

        let mySet = new Set();
        for (let i = 0; i < report.document.reportObjects.length; ++i) {
            if (report.document.reportObjects[i].objectType !== 'deleted') {
                if (report.document.reportObjects[i].objectType === 'chart') {
                    haveCharts = true;
                    chartData = {};
                    chartData.chartjsurl = appConfiguration.chartjsurl;
                }

                if (report.document.reportObjects[i].style) {
                    if (logger.isLogDebugEnabled()) {
                        logger.logDebug("reportObject[" + report.document.reportObjects[i].objectType + "].style=" + report.document.reportObjects[i].style);
                    }
                    if (!mySet.has(report.document.reportObjects[i].style)) {
                        mySet.add(report.document.reportObjects[i].style);
                        style += (' '
                            + report.document.reportObjects[i].style.replace('div.rpt-'
                                + report.document.reportObjects[i].objectType
                                + '-' + report.document.reportObjects[i].id
                                + ':hover { border: dotted 1px red;}', ''));
                    }

                    switch (report.document.reportObjects[i].reportSection) {
                        case "header":
                            headerObjects.push(report.document.reportObjects[i]);
                            break;
                        case "body":
                            bodyObjects.push(report.document.reportObjects[i]);
                            break;
                        case "footer":
                            footerObjects.push(report.document.reportObjects[i]);
                            break;
                    }
                }
            }
        }

        let done = false;
        let pagenum = 0;
        let html = '';

        let rowInfo = {
            currentRow: 0,
            totalsRequired: false,
            rows: resultSet,
            ppi: report.document.pixelsPerInch,
            columnMap: columnMap,
            marginLeft: marginLeft,
            marginTop: marginTop,
            pageBreakRequired: false,
            forcePageBreak: false
        };

        if (haveCharts) {
            rowInfo.dataRows = result.result.rows;
            rowInfo.queryColumns = query.document.selectedColumns;
            rowInfo.chartData = chartData;
            rowInfo.chartData.charts = [];
        }

        let bodyStart = Number(report.document.headerHeight/rowInfo.ppi).toFixed(3);
        let footerStart =  Number((report.document.documentHeight - report.document.footerHeight)/rowInfo.ppi).toFixed(3);
        do {
            rowInfo.pageBreakRequired = false;
            rowInfo.pageNumber = (pagenum+1);
            rowInfo.startRow = rowInfo.currentRow;
            rowInfo.incrementRowRequired = false;
            html += '<div class="page"><div style="position: absolute; overflow: hidden; left: 0; top: 0; width: '
                +  width
                + 'in; height: '
                + bodyStart
                + 'in;">';
            for (let i = 0; i < headerObjects.length; ++i) {
                html += getObjectHtml(marginTop, headerObjects[i], rowInfo);
            }

            html += '</div><div style="position: absolute; overflow: hidden; left: 0; top: '
                + bodyStart
                + 'in; width: '
                + width
                + 'in; height: '
                + (footerStart - bodyStart)
                + 'in;">';
            for (let i = 0; i < bodyObjects.length; ++i) {
                html += getObjectHtml(0, bodyObjects[i], rowInfo);
            }

            html += '</div><div style="position: absolute; overflow: hidden; left: 0; top: '
                + footerStart
                + 'in; width: '
                + width
                + 'in; height: '
                + (height - footerStart)
                + 'in;">';

            for (let i = 0; i < footerObjects.length; ++i) {
                html += getObjectHtml(0, footerObjects[i], rowInfo);
            }

            html += '</div>';

            if (rowInfo.incrementRowRequired) {
                rowInfo.currentRow = rowInfo.currentRow + 1;
            }

            html += '</div>';
            if (!rowInfo.forcePageBreak
                && (!rowInfo.pageBreakRequired
                    || (rowInfo.currentRow >= rowInfo.rows.length))) {
                done = true;
            } else {
                html += '<div class="pb">&nbsp;</div>';
            }

            pagenum++;
        } while (!done);

        if (haveCharts) {
            retval = {"style": style, "html": html, chartData: chartData};
        } else {
            retval = {"style": style, "html": html};
        }
    }

    return retval;
}

function getObjectHtml(yOffset, reportObject, rowInfo) {
    let retval = '';

    switch(reportObject.objectType) {
        case 'dbdata':
            retval = getDbDataHtml(yOffset, reportObject, rowInfo);
            break;
        case 'dbcol':
            retval = getDbColumnHtml(yOffset, reportObject, rowInfo);
            break;
        case 'current date':
            retval = getCurrentDateHtml(yOffset, reportObject, rowInfo);
            break;
        case 'image':
            retval = getImageHtml(yOffset, reportObject, rowInfo);
            break;
        case 'label':
            retval = getLabelHtml(yOffset, reportObject, rowInfo);
            break;
        case 'link':
            retval = getLinkHtml(yOffset, reportObject, rowInfo);
            break;
        case 'email':
            retval = getEmailHtml(yOffset, reportObject, rowInfo);
            break;
        case 'page number':
            retval = getPageNumberHtml(yOffset, reportObject, rowInfo);
            break;
        case 'shape':
            retval = getShapeHtml(yOffset, reportObject, rowInfo);
            break;
        case 'chart':
            retval = getChartHtml(yOffset, reportObject, rowInfo);
            break;
    }

    return retval;
}

function getDbDataHeader(reportObject, rowInfo) {
    let retval = '';
    for (let i = 0; i < reportObject.reportColumns.length; ++i) {
        if (reportObject.reportColumns[i].displayResult) {
            let nm = rowInfo.columnMap.get(reportObject.reportColumns[i].key).name;
            let width = (reportObject.reportColumns[i].width / rowInfo.ppi).toFixed(3) + 'in;';
            retval += ('<th style="width: '
                + width
                + '"><div>'
                + nm
                + '</div></th>');
        }
    }

    return retval;
}

function getDbDataRows(reportObject, rowInfo, numRows) {
    let retval = '';
    let start = rowInfo.currentRow;
    rowInfo.pageRowsDisplayed = 0;
    for (let i = start; (i < (start + numRows)) && (i < rowInfo.rows.length); ++i) {
        retval += ('<tr>' + getDbDataRowColumns(reportObject, rowInfo, rowInfo.rows[i]) + '</tr>');
        rowInfo.currentRow = rowInfo.currentRow + 1;
        rowInfo.pageRowsDisplayed++;
    }
    return retval;
}

function getDbDataRowColumns(reportObject, rowInfo, data) {
    let retval = '';
    for (let i = 0; i < reportObject.reportColumns.length; ++i) {
        if (reportObject.reportColumns[i].displayResult) {
            let path = rowInfo.columnMap.get(reportObject.reportColumns[i].key).path;
            let val = getDbDataByPath(path, data);
            if (logger.isLogDebugEnabled()) {
                logger.logDebug("report column key=" + reportObject.reportColumns[i].key);
                logger.logDebug("report column path=" + rowInfo.columnMap.get(reportObject.reportColumns[i].key).path);
                logger.logDebug("report column value=" + val);
                logger.logDebug("row data=" + JSON.stringify(data));
            }
            retval += '<td><div>';
            if (reportObject.reportColumns[i].specialHandlingType
                && reportObject.reportColumns[i].specialHandlingType !== 'none') {
                switch (reportObject.reportColumns[i].specialHandlingType) {
                    case 'email':
                        val = '<a href="mailto:'
                            + val
                            + '" target="_blank">'
                            + val
                            + '</a>';
                        break;
                    case 'link':
                        val = '<a href="'
                            + val
                            + '" target="_blank">'
                            + val
                            + '</a>';
                        break;
                    case 'image':
                        val = '<img alt="" style="width: auto; height: auto; max-width: 100%; max-height: 100%" src="'
                            + val
                            + '"/>';
                        break;
                    case 'sum':
                    case 'avg':
                        if (!reportObject.reportColumns[i].total) {
                            reportObject.reportColumns[i].total = 0;
                            reportObject.reportColumns[i].count = 0;
                        }

                        if (val) {
                            reportObject.reportColumns[i].total += val;
                            reportObject.reportColumns[i].count++;
                        }
                        rowInfo.totalsRequired = true;
                        break;
                    case 'max':
                        if (!reportObject.reportColumns[i].max
                            || (reportObject.reportColumns[i].max < val)) {
                            if (reportObject.reportColumns[i].precision && val) {
                                reportObject.reportColumns[i].max
                                    = val.toFixed(reportObject.reportColumns[i].precision);
                            } else {
                                reportObject.reportColumns[i].max = val;
                            }
                        }
                        rowInfo.totalsRequired = true;
                        break;
                    case 'min':
                        if (!reportObject.reportColumns[i].min
                            || (reportObject.reportColumns[i].min > val)) {
                            if (reportObject.reportColumns[i].precision && val) {
                                reportObject.reportColumns[i].min
                                    = val.toFixed(reportObject.reportColumns[i].precision);
                            } else {
                                reportObject.reportColumns[i].min = val;
                            }
                        }
                        rowInfo.totalsRequired = true;
                        break;
                }
            }

            if (val) {
                if (reportObject.reportColumns[i].isNumeric) {
                    if (reportObject.reportColumns[i].precision) {
                        retval += val.toFixed(reportObject.reportColumns[i].precision);
                    } else {
                        retval += val;
                    }
                } else {
                    retval += val;
                }
            } else {
                val = '&nbsp;';
            }

            retval += '</div></td>';
        }
    }
    return retval;
}

function getDbDataByPath(path, rowData) {
    function index(obj,i) {
        if (obj) {
            if (Array.isArray(obj) && (obj.length === 1)) {
                obj = obj[0];
            }
            return obj[i];
        } else {
            return '';
        }
    }
    return path.split('.').reduce(index, rowData);
}

function getReportObjectStyle(yOffset, reportObject, rowInfo) {
    let left = rowInfo.marginLeft + Number(reportObject.rect.left / rowInfo.ppi);
    let top = yOffset + (reportObject.rect.top / rowInfo.ppi);
    let width = reportObject.rect.width / rowInfo.ppi;
    let height = reportObject.rect.height / rowInfo.ppi;
    return 'left: '
        + left.toFixed(3)
        + 'in; top: '
        + top.toFixed(3)
        + 'in; width: '
        + width.toFixed(3)
        + 'in; height: '
        + height.toFixed(3)
        + 'in;';
}

function getLabelHtml(yOffset, reportObject, rowInfo) {
    let cname = 'rpt-' + reportObject.objectType.replace(/ /g, '-')
        + '-' + reportObject.id;

    let retval = '<div style="'
        + getReportObjectStyle(yOffset, reportObject, rowInfo)
        + '" class="' + cname + '">';

    retval += ('<div>' + reportObject.labelText + '</div></div>');
    return retval;
}

function getShapeHtml(yOffset, reportObject, rowInfo) {
    let cname = 'rpt-' + reportObject.objectType.replace(/ /g, '-')
        + '-' + reportObject.id;

    let retval = '<div style="'
        + getReportObjectStyle(yOffset, reportObject, rowInfo)
        + '" class="' + cname + '">';

    retval += '&nbsp;</div>';
    return retval;
}

function getImageHtml(yOffset, reportObject, rowInfo) {
    let cname = 'rpt-' + reportObject.objectType.replace(/ /g, '-')
        + '-' + reportObject.id;
    let style;
    if (!reportObject.sizeToContent) {
        if (!reportObject.retainAspect) {
            style = 'width: 100%; height: 100%;';
        } else {
            style = 'width: auto; height: auto; max-width: 100%; max-height: 100%;';
        }
    }

    let retval = '<div style="'
        + getReportObjectStyle(yOffset, reportObject, rowInfo)
        + '" class="' + cname + '">';
    if (style) {
        retval += '<img alt="'
            + reportObject.altText
            + '" src="'
            + reportObject.url
            + '" style="'
            + style
            + '" class="' + cname + '"/>';
    } else {
        retval += '<img alt="'
            + reportObject.altText
            + '" src="'
            + reportObject.url
            + ' class="' + cname + '"/>';
    }

    retval += '</div>';

    return retval;
}

function getLinkHtml(yOffset, reportObject, rowInfo) {
    let cname = 'rpt-' + reportObject.objectType.replace(/ /g, '-')
        + '-' + reportObject.id;

    let retval = '<div style="z-index: 1; '
        + getReportObjectStyle(yOffset, reportObject, rowInfo)
        + '" class="' + cname + '">';

    retval += ('<a href="' + reportObject.url + '" target="__blank">' + reportObject.linkText + '</a></div>');
    return retval;
}

function getEmailHtml(yOffset, reportObject, rowInfo) {
    let cname = 'rpt-' + reportObject.objectType.replace(/ /g, '-')
        + '-' + reportObject.id;

    let retval = '<div style="z-index: 1; '
        + getReportObjectStyle(yOffset, reportObject, rowInfo)
        + '" class="' + cname + '">';

    if (!reportObject.emailText) {
        reportObject.emailText = reportObject.email;
    }
    retval += ('<a href="mailto:' + reportObject.email + '" target="_blank">' + reportObject.emailText + '</a></div>');
    return retval;
}

function getCurrentDateHtml(yOffset, reportObject, rowInfo) {
    let cname = 'rpt-' + reportObject.objectType.replace(/ /g, '-')
        + '-' + reportObject.id;

    let retval = '<div style="'
        + getReportObjectStyle(yOffset, reportObject, rowInfo)
        + '" class="' + cname + '">';

    retval += ('<div>' + formatDate(new Date(),reportObject.format) + '</div></div>');
    return retval;
}

function formatDate(dt, format) {
    let dstr = dt.toISOString();
    let day = dstr.substring(8, 10);
    let mon = dstr.substring(5, 7);
    let year = dstr.substring(0, 4);
    let mname;
    if (format.includes('MMM')) {
        mname = config.monthNames[dt.getMonth()];
    }

    let retval = format.replace('dd', day).replace('yyyy', year);

    if (mname) {
        if (format.includes(' MMM ')) {
            retval = retval.replace('MMM', mname.substring(0, 3));
        } else {
            retval = retval.replace('MMMMMMMMM', mname);
        }
    } else {
        retval = retval.replace('mm', mon);
    }

    return retval;
}

function getPageNumberHtml(yOffset, reportObject, rowInfo) {
    let cname = 'rpt-' + reportObject.objectType.replace(/ /g, '-')
        + '-' + reportObject.id;

    let retval = '<div style="'
        + getReportObjectStyle(yOffset, reportObject, rowInfo)
        + '" class="' + cname + '">';
    retval += ('<div>' + reportObject.format.replace('?', rowInfo.pageNumber) + '</div></div>');
    return retval;
}


function getDbDataHtml(yOffset, reportObject, rowInfo) {
    let cname = 'rpt-' + reportObject.objectType.replace(/ /g, '-')
        + '-' + reportObject.id;

    let retval = '<div style="'
        + getReportObjectStyle(yOffset, reportObject, rowInfo)
        + '" class="' + cname + '">';

    let cy = (reportObject.rect.height / rowInfo.ppi).toFixed(3);
    let dataRowHeight = (reportObject.dataRowHeight / rowInfo.ppi).toFixed(3);
    let numRows = Math.floor(cy / dataRowHeight);
    if (!Array.isArray(rowInfo.rows)) {
        let obj = rowInfo.rows;
        rowInfo.rows = [];
        rowInfo.rows.push(obj);
    }
    retval += ('<table><thead><tr>'
        + getDbDataHeader(reportObject, rowInfo)
        + '</tr></thead><tbody>'
        + getDbDataRows(reportObject, rowInfo, numRows)
        + '</tbody>');

    if (rowInfo.forcePageBreak || ((rowInfo.currentRow >= rowInfo.rows.length) && rowInfo.totalsRequired)) {
        if (rowInfo.pageRowsDisplayed < numRows) {
            retval += '<tr>';
            for (let i = 0; i < reportObject.reportColumns.length; ++i) {
                if (reportObject.reportColumns[i].displayResult) {
                    retval += ('<td/><div style="font-weight: bold; border-top: ' + reportObject.totalsSeparator + ';">');
                    if (reportObject.reportColumns[i].total || reportObject.reportColumns[i].min || reportObject.reportColumns[i].max) {
                        switch (reportObject.reportColumns[i].specialHandlingType) {
                            case 'sum':
                                retval += reportObject.reportColumns[i].total.toFixed(2);
                                break;
                            case 'avg':
                                if (reportObject.reportColumns[i].count
                                    && (reportObject.reportColumns[i].count > 0)) {
                                    retval += Number(reportObject.reportColumns[i].total / reportObject.reportColumns[i].count).toFixed(2);
                                }
                                break;
                            case 'max':
                                if (reportObject.reportColumns[i].max) {
                                    if (reportObject.reportColumns[i].precision) {
                                        retval += Number(reportObject.reportColumns[i].max).toFixed(reportObject.reportColumns[i].precision);
                                    } else {
                                        retval += reportObject.reportColumns[i].max;
                                    }
                                }
                                break;
                            case 'min':
                                if (reportObject.reportColumns[i].min) {
                                    if (reportObject.reportColumns[i].precision) {
                                        retval += Number(reportObject.reportColumns[i].min).toFixed(reportObject.reportColumns[i].precision);
                                    } else {
                                        retval += reportObject.reportColumns[i].min;
                                    }
                                }
                                break;
                        }
                    } else {
                        retval += '&nbsp;'
                    }
                    retval += '</div></td>';
                }
            }

            retval += '</tr>';
        } else if (reportObject.displayFormat === 2) {
            rowInfo.forcePageBreak = true;
        }
    }
    retval += '</table></div>';
    if ((Number(reportObject.displayFormat) === 2)
        && (rowInfo.currentRow < rowInfo.rows.length)) {
        rowInfo.pageBreakRequired = true;
    }

    return retval
}

function getDbColumnHtml(yOffset, reportObject, rowInfo) {
    let cname = 'rpt-' + reportObject.objectType.replace(/ /g, '-')
        + '-' + reportObject.id;

    let retval = ('<div style="'
        + getReportObjectStyle(yOffset, reportObject, rowInfo)
        + '" class="' + cname + '">');

    let crow = Math.min(rowInfo.currentRow, rowInfo.rows.length-1);
    let val = getDbDataByPath(reportObject.columnPath, rowInfo.rows[crow]);
    retval += ('<div>' + val + '</div></div>');

    rowInfo.incrementRowRequired = true;
    if ((Number(reportObject.displayFormat) === 4)
        && (rowInfo.currentRow < rowInfo.rows.length)) {
        rowInfo.pageBreakRequired = true;
    }

    return retval;
}

function getChartHtml(yOffset, reportObject, rowInfo) {
    let cname = 'rpt-' + reportObject.objectType.replace(/ /g, '-')
        + '-' + reportObject.id;

    let retval = '<div style="'
        + getReportObjectStyle(yOffset, reportObject, rowInfo)
        + '" class="' + cname + '">'
        + '<canvas style="width: 100%; height: 100%" id="'
        + cname
        + '"></canvas></div>';

    loadChartLabels(reportObject, rowInfo);
    let ds = getChartDatasets(reportObject, rowInfo);
    let options = getChartOptions(reportObject, rowInfo);
    let data = {
        canvasId: cname,
        type: reportObject.chartType,
        data: {
            labels: rowInfo.chartLabels,
            datasets: ds
        },
        options: options
    };

    rowInfo.chartData.charts.push(data);

    return retval
}

function loadChartLabels(reportObject, rowInfo) {
    let labels = [];
    let categorySet = new Set();
    rowInfo.categoryPosition = -1;
    for (let i = 0; ((rowInfo.categoryPosition === -1) && (i < reportObject.reportColumns.length)); ++i) {
        if (reportObject.reportColumns[i].axis === 'category') {
            for (let j = 0; j < rowInfo.queryColumns.length; ++j) {
                if (rowInfo.queryColumns[j].path === reportObject.reportColumns[i].path) {
                    rowInfo.categoryPosition = j;
                    break;
                }
            }
        }
    }

    if (rowInfo.categoryPosition > -1) {
        for (let i = 0; i < rowInfo.dataRows.length; ++i) {
            let cat = rowInfo.dataRows[i][rowInfo.categoryPosition];
            if (cat && !categorySet.has(cat)) {
                labels.push(cat);
                categorySet.add(cat);
            }
        }
    }

    rowInfo.chartLabels = labels;
}

function getChartDatasets(reportObject, rowInfo) {
    let retval = [];
    let posMap = new Map();
    for (let i = 0; i < rowInfo.chartLabels.length; ++i) {
        posMap.set(rowInfo.chartLabels[i], i);
    }

    let dataAxes = getChartDataAxisDefs(reportObject, rowInfo);
    for (let i = 0; i < dataAxes.length; ++i) {
        let ds = {};
        ds.id = ('ds' + i);
        if (dataAxes[i].label) {
            ds.label = dataAxes[i].label;
        }

        if (dataAxes[i].color) {
            switch (reportObject.chartType) {
                case 'bar':
                case 'horizontalBar':
                    ds.backgroundColor = dataAxes[i].color;
                    ds.borderColor = dataAxes[i].color;
                    ds.borderWidth = 1;
                    ds.hoverBackgroundColor = tinycolor(ds.backgroundColor).darken(15).toString();
                    break;
                case 'line':
                case 'radar':
                case 'scatter':
                    ds.borderColor = dataAxes[i].color;
                    ds.borderWidth = dataAxes[i].borderWidth;
                    if (reportObject.showBackground) {
                        ds.backgroundColor = tinycolor(ds.borderColor).lighten(40).desaturate(20).setAlpha(0.3).toString();
                        ds.hoverBackgroundColor = tinycolor(ds.borderColor).darken(20).toString();
                    } else {
                        ds.backgroundColor = 'transparent';
                        ds.hoverBackgroundColor = 'transparent';
                    }
                    ds.pointStyle = reportObject.pointStyle;
                    ds.pointRadius = reportObject.pointRadius;
                    break;

            }
        }
        ds.data = [];
        retval.push(ds);
    }

    for (let i = 0; i < rowInfo.dataRows.length; ++i) {
        for (let j = 0; j < retval.length; j++) {
            let pos = posMap.get(rowInfo.dataRows[i][rowInfo.categoryPosition]);
            if (pos > -1) {
                let yval = rowInfo.dataRows[i][dataAxes[j].dataPosition];
                let xval =  rowInfo.dataRows[i][rowInfo.categoryPosition];
                if (!yval) {
                    yval = 0;
                }

                yval = Number(yval);

                if (reportObject.reportColumns[j].precision) {
                    yval = yval.toFixed(reportObject.reportColumns[j].precision);
                } else if (yval) {
                    yval = yval.toFixed(2);
                }

                if (reportObject.chartType === 'scatter') {
                    retval[j].data.push({x: xval, y: yval});
                } else {
                    retval[j].data[pos] = yval;
                }
            }

            switch(reportObject.chartType) {
                case 'pie':
                case 'doughnut':
                case 'polarArea':
                    if (!retval[j].backgroundColor) {
                        retval[j].backgroundColor = [];
                    }

                    if (reportObject.chartType === 'polarArea') {
                        retval[j].backgroundColor.push(randomColor({luminosity: 'dark', alpha: 0.3, format: 'rgba'}));
                    } else {
                        retval[j].backgroundColor.push(randomColor({luminosity: 'dark'}));
                    }

                    break;
            }
        }
    }

    return retval;
}

function getChartOptions(reportObject) {
    let retval = {};
    let tstyle = 'normal';

    if (reportObject.titleFontSettings.italic) {
        tstyle = 'italic';
    }

    let lstyle = 'normal';

    if (reportObject.legendFontSettings.italic) {
        lstyle = 'italic';
    }


    if (reportObject.responsive) {
        retval.responsive = reportObject.responsive;
    }

    if (reportObject.maintainAspect) {
        retval.maintainAspect = reportObject.maintainAspect;
    }

    retval.title = {};
    retval.title.display = reportObject.titleFontSettings.display;

    if (retval.title.display) {
        if (reportObject.titleFontSettings.position) {
            retval.title.position = reportObject.titleFontSettings.position;
        }

        if (reportObject.titleFontSettings.fontSize) {
            retval.title.fontSize = reportObject.titleFontSettings.fontSize;
        }

        if (reportObject.titleFontSettings.fontColor) {
            retval.title.fontColor = reportObject.titleFontSettings.fontColor
        }

        if (reportObject.titleFontSettings.font) {
            retval.title.fontFamily = reportObject.titleFontSettings.font;
            retval.title.fonstStyle = tstyle;
            retval.title.text = reportObject.title;
        }
    }


    retval.legend = {};
    retval.title.display = reportObject.titleFontSettings.display;

    if (reportObject.legendFontSettings.display) {
        if (reportObject.legendFontSettings.position) {
            retval.legend.position = reportObject.legendFontSettings.position;
            retval.legend.labels = {};

            if (reportObject.legendFontSettings.fontSize) {
                retval.legend.labels.fontSize = reportObject.legendFontSettings.fontSize;
            }

            if (reportObject.legendFontSettings.fontColor) {
                retval.legend.labels.fontColor = reportObject.legendFontSettings.fontColor
            }

            if (reportObject.legendFontSettings.font) {
                retval.legend.labels.boxWidth = 10;
                retval.legend.labels.boxHeight = 2;
                retval.legend.labels.fontFamily = reportObject.legendFontSettings.font;
                retval.legend.labels.fontStyle = lstyle;
            }
        }
    }

    if (reportObject.yAxes || reportObject.xAxes) {
        retval.scales = {};
        if (reportObject.yAxes && reportObject.yAxes.label) {
            retval.scales.yAxes = [];
            retval.scales.yAxes.push({scaleLabel: {display: true, labelString: reportObject.yAxes.label}});
        }

        if (reportObject.xAxes && reportObject.xAxes.label) {
            retval.scales.xAxes = [];
            retval.scales.xAxes.push({scaleLabel: {display: true, labelString: reportObject.xAxes.label}});
        }
    }

    return retval;
}

function getChartDataAxisDefs(reportObject, rowInfo) {
    let retval = [];

    for (let i = 0; i < reportObject.reportColumns.length; ++i) {
        if (reportObject.reportColumns[i].axis === 'data') {
            for (let j = 0; j < rowInfo.queryColumns.length; ++j) {
                if (rowInfo.queryColumns[j].path === reportObject.reportColumns[i].path) {
                    reportObject.reportColumns[i].dataPosition = j;
                    retval.push(reportObject.reportColumns[i]);
                    break;
                }
            }
        }
    }

    return retval;
}

async function loadReportDocumentGroups(groupsonly) {
    let retval;
    try {
        if (util.isValidObject(appConfiguration.reportDocumentGroupsDefinition) && fs.existsSync(appConfiguration.reportDocumentGroupsDefinition)) {
            retval = JSON.parse(fs.readFileSync(appConfiguration.reportDocumentGroupsDefinition));
            let reports = {};
            let groups = fs.readdirSync(appConfiguration.reportDocumentRoot);

            for (let i = 0; i < groups.length; ++i) {
                let rpath = appConfiguration.reportDocumentRoot + path.sep + groups[i];
                if (fs.lstatSync(rpath).isDirectory()) {
                    let files = fs.readdirSync(rpath);
                    reports[groups[i]] = [];
                    for (let j = 0; j < files.length; ++j) {
                        if (files[j].endsWith('.json')) {
                            reports[groups[i]].push(files[j]);
                        }
                    }

                    if (reports[groups[i]].length > 0) {
                        reports[groups[i]].sort();
                    }
                }
            }

            traverseDocumentGroups(retval, reports);
        }
        if (groupsonly) {
            util.removeTreeLeafItems(retval);
        }
    } catch(e) {
        logger.logError('error ocurred during document reports definition load - ' + e);
    }


    return retval;
}

async function loadQueryDocumentGroups(groupsonly) {
    let retval;
    try {
        if (util.isValidObject(appConfiguration.queryDocumentGroupsDefinition) && fs.existsSync(appConfiguration.queryDocumentGroupsDefinition)) {
            retval = JSON.parse(fs.readFileSync(appConfiguration.queryDocumentGroupsDefinition));
            let queries = {};
            let groups = fs.readdirSync(appConfiguration.queryDocumentRoot);

            for (let i = 0; i < groups.length; ++i) {
                let rpath = appConfiguration.queryDocumentRoot + path.sep + groups[i];
                if (fs.lstatSync(rpath).isDirectory()) {
                    let files = fs.readdirSync(rpath);
                    queries[groups[i]] = [];
                    for (let j = 0; j < files.length; ++j) {
                        if (files[j].endsWith('.json')) {
                            queries[groups[i]].push(files[j]);
                        }
                    }

                    if (queries[groups[i]].length > 0) {
                        queries[groups[i]].sort();
                    }
                }
            }

            traverseDocumentGroups(retval, queries);
        }


        if (groupsonly) {
            util.removeTreeLeafItems(retval);
        }
    } catch (e) {
        logger.logError('error ocurred during document groups definition load - ' + e);
    }

    return retval;
}


function traverseDocumentGroups(grp,  documents) {
    if (!grp.isLeaf) {
        let canRecurse = grp.children;
        if (documents) {
            let docs = documents[grp.key];
            if (docs) {
                if (!grp.children) {
                    grp.children = [];
                    canRecurse = false;
                }

                for (let j = 0; j < docs.length; ++j) {
                    let leaf = {
                        title: docs[j].replace(/_/g, ' ').replace('.json', ''),
                        isLeaf: true,
                        key: (grp.key + '.' + docs[j])
                    };
                    grp.children.push(leaf);
                }
            }
        }

        if (canRecurse) {
            for (let i = 0; i < grp.children.length; ++i) {
                traverseDocumentGroups(grp.children[i], documents);
            }
        }
    }
}

function getSession(req) {
    let session = req.headers['x-snosession'];

    if (logger.isLogDebugEnabled()) {
        logger.logDebug("snosession=" + session);
        if (session) {
            logger.logDebug("myCache[" + session + "]=" + myCache.get(session));
        }
    }
    return session;
}

function getAccessKey(req) {
    let retval;
    if ((req.method === "POST") && req.body && req.body.key) {
        retval = req.body.key;
        if (logger.isLogDebugEnabled()) {
            logger.logDebug("found access key in body object: " + retval);
            logger.logDebug("myCache(" + retval + ")=" + myCache.get(retval));
        }
    } else if ((req.method === "GET") && req.query && req.query.key) {
        retval = req.query.key;
        if (logger.isLogDebugEnabled()) {
            logger.logDebug("found access key in query object: " + retval);
            logger.logDebug("myCache(" + retval + ")=" + myCache.get(retval));
        }
    }

    return retval;
}

function parseOrmResult(res, errorName) {
    if (res) {
        if (res.error) {
            logger.logError(res.error);
            if (errorName) {
                util.throwError(errorName, res.error);
            }
        } else if (res.result) {
            if (res.result.rows) {
                return res.result.rows;
            } else {
                return res.result;
            }
        }
    }
}

module.exports.parseOrmResult = parseOrmResult;

// self test mode if environment variable set
if (process.env.RUN_SELF_TEST) {
    const appConfig = JSON.parse(fs.readFileSync('./examples/appconfig.json'));
    const testConfig = JSON.parse(fs.readFileSync('./examples/testconfig.json'));


    // these are expected to be full paths so do this for eample purposes
    appConfig.queryDocumentRoot = __dirname + "/" + appConfig.queryDocumentRoot;
    appConfig.reportDocumentRoot = __dirname + "/" + appConfig.reportDocumentRoot;
    appConfig.reportDocumentGroupsDefinition = __dirname + "/" + appConfig.reportDocumentGroupsDefinition;
    appConfig.queryDocumentReportsDefinition = __dirname + "/" + appConfig.queryDocumentReportssDefinition;

    module.exports.startOrm(__dirname, appConfig, testConfig,
        function onServerStarted(server, logger) {
            logger.logInfo("simplenodeorm server started for self test");
        });
}


