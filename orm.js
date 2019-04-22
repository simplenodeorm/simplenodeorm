"use strict";

const fs = require('fs');
const util = require('./main/util.js');
const modelList = [];
const repositoryMap = new Map();
const events = require('events');
const appConfiguration = JSON.parse(fs.readFileSync('./appconfig.json'));
const testConfiguration = JSON.parse(fs.readFileSync('./testconfig.json'));
const logger = require('./main/Logger.js');
const basicAuth = require('express-basic-auth');
const cors = require('cors');
const uuidv1 = require('uuid/v1');
const path = require('path');
const fspath = require('fs-path');
const saveAuthorizer = new (require(appConfiguration.saveAuthorizer))();
const deleteAuthorizer = new (require(appConfiguration.deleteAuthorizer))();
const reportDocumentGroups = JSON.parse(fs.readFileSync('./report-document-groups.json'));
const queryDocumentGroups = JSON.parse(fs.readFileSync('./query-document-groups.json'));
const randomColor = require('randomcolor');
const tinycolor = require('tinycolor2');


// REST API stuff
const express = require('express');
const bodyParser = require('body-parser');
const server = express();

const APP_NAME = appConfiguration.applicationName || "SIMPLE ORM";
const REST_URL_BASE = appConfiguration.restUrlBase || '/hrorm';
const REST_SERVER_PORT = appConfiguration.restPort || 8888;
 
 
// create an event emitter to signal when
// connection pool is initialized
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
    
    if (appConfiguration.startRestServer) {
        startRestServer();
    }
}); 

const dbTypeMap = new Map();

// setup database pool and fire off orm load
require("./db/dbConfiguration.js")(poolCreatedEmitter, appConfiguration, testConfiguration, dbTypeMap);

function loadOrm() {
    logger.logInfo("loading " + APP_NAME + "...");
    loadOrmDefinitions();

    modelList.sort(function(a, b) {
        let s1 = (a.poolAlias + '.' + a.name);
        let s2 = (b.poolAlias + '.' + b.name);
        return (s1 < s2)
    });

    // ensure no changes after load
    Object.freeze(modelList);
    Object.freeze(repositoryMap);
    
    logger.logInfo(APP_NAME + " loaded ");
}

// export some of the constants for use in other modules
module.exports.APP_NAME = APP_NAME;
module.exports.appConfiguration = appConfiguration;
module.exports.testConfiguration = testConfiguration;

module.exports.newModelInstance = function (metaData) {
    return require('./' + metaData.module)(metaData);
};

module.exports.getMetaData = function (modelName) {
    return this.getRepository(modelName).getMetaData();
};

module.exports.getRepository = function (modelName) {
    return repositoryMap.get(modelName.toLowerCase());
};

module.exports.getModelList = function () {
    return modelList;
};

module.exports.getConnection = async function(poolAlias) {
    return await dbTypeMap.get(poolAlias + '.pool').getConnection();
};

module.exports.getDbType = function(poolAlias) {
    return dbTypeMap.get(poolAlias);
};

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
    loadModelFiles("./model", modelFiles);
    let indx = 1;

    for (let i = 0; i < modelFiles.length; ++i) {
        let modelName = getModelNameFromPath(modelFiles[i]);
        
        let md = new (require(modelFiles[i].replace('./model', './metadata').replace('.js', 'MetaData.js')));
        if (util.isDefined(md)) {
            let repo = require(modelFiles[i].replace('./model', './repository').replace('.js', 'Repository.js'))(md);
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
                for (let k = 0; k < md.getManyToOneDefinitions().length; ++k) {
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

function startRestServer() {
    logger.logInfo('starting ' + APP_NAME + ' REST server...');
    server.use(bodyParser.urlencoded({limit: '5MB', extended: false}));
    server.use(bodyParser.json({limit: '5MB'} ));
    server.use(cors());

    // plug authentication in here
    if (util.isDefined(appConfiguration.authorizer)) {
        const authorizer = new (require(appConfiguration.authorizer));
        const authfunc = function (user, pass) {
            return authorizer.isAuthorized(user, pass);
        };

        server.use(basicAuth({authorizer: authfunc}));
    }

    server.listen(REST_SERVER_PORT, () => {
        logger.logInfo(APP_NAME + ' is live on port ' + REST_SERVER_PORT);
    });

    server.get(REST_URL_BASE + '/design/login', async function (req, res) {
        if (logger.isLogDebugEnabled()) {
            logger.logDebug("in /design/login");
        }
        res.status(200).send("success");
    });

    server.get(REST_URL_BASE + '/design/modelnames', async function (req, res) {
        res.status(200).send(modelList);
    });

    server.get(REST_URL_BASE + '/design/document/groups', async function (req, res) {
        res.status(200).send(queryDocumentGroups);
    });
    
    server.get(REST_URL_BASE + '/report/document/groups', async function (req, res) {
        res.status(200).send(reportDocumentGroups);
    });
    
    server.get(REST_URL_BASE + '/report/documents', async function (req, res) {
        try {
            res.status(200).send(loadReportDocuments());
        }

        catch (e) {
            logger.logError('error occured while loading report documents', e);
            res.status(500).send('error occured while loading report documents');
        }
    });

    server.get(REST_URL_BASE + '/design/documents', async function (req, res) {
        try {
            res.status(200).send(loadQueryDocuments());
        }

        catch (e) {
            logger.logError('error occured while loading query documents', e);
            res.status(500).send('error occured while loading query documents');
        }
    });

    server.get(REST_URL_BASE + '/design/authorizers', async function (req, res) {
        try {
            res.status(200).send(loadAuthorizers());
        }

        catch (e) {
            logger.logError('error occured while loading available authorizers', e);
            res.status(500).send('error occured while loading available authorizers');
        }
    });

    server.get(REST_URL_BASE + '/report/authorizers', async function (req, res) {
        try {
            res.status(200).send(loadAuthorizers());
        }

        catch (e) {
            logger.logError('error occured while loading available authorizers', e);
            res.status(500).send('error occured while loading available authorizers');
        }
    });

    server.post(REST_URL_BASE + '/design/generatesql', async function (req, res) {
        try {
            res.status(200).send(buildQueryDocumentSql(req.body, true));
        } catch (e) {
            logger.logError('error occured while building sql from query document', e);
            res.status(500).send('error occured while building sql from query document');
        }
    });

    server.post(REST_URL_BASE + '/design/runquery', async function (req, res) {
        try {
            (async function () {
                let doc = req.body;
                try {
                    if (doc.documentName && !doc.interactive) {
                        let params = doc.parameters;
                        doc = loadQueryDocument(doc.groupId + '.' + doc.documentName + '.json');
                        doc.parameters = params;
                        
                    }

                    let authorizer;
                    try {
                        logger.logInfo('authorizer: ' + doc.authenticator);
                        let Authenticator = require('./auth/' + doc.authenticator + '.js');
                        authorizer = new Authenticator();
                    } 
                    
                    catch(e) {
                    }
                    
                    if (!authorizer || !authorizer.checkAuthorization(req)) {
                        logger.logInfo('unauthorized access attempted');
                        res.status(401).send('unauthorized');
                    } else {
                        let sql = buildQueryDocumentSql(doc);

                        if (logger.isLogDebugEnabled()) {
                            logger.logDebug(util.toString(doc));
                            logger.logDebug(sql);
                        }

                        let repo = repositoryMap.get(doc.document.rootModel.toLowerCase());
                        let result = await repo.executeSqlQuery(sql, doc.parameters);
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
                                let retval = buildResultObjectGraph(doc, result.result.rows);
                                res.status(200).send(retval);
                            }

                            catch (e) {
                                logger.logError('error occured while building result object graph', e);
                                res.status(500).send('error occured while building result object graph - ' + e);
                            }
                        }
                    }
                }
                
                catch(e) {
                    logger.logError('error occured while running query document', e);
                    res.status(500).send('error occured while running query document - ' + e);
                }
            })(req, res);
        } catch (e) {
            logger.logError('error occured while running query document', e);
            res.status(500).send('error occured while running query document - ' + e);
        }
    });

    server.post(REST_URL_BASE + '/design/savequery', async function (req, res) {
        try {
            saveQueryDocument(req.body);
            res.status(200).send('success');
        } catch (e) {
            logger.logError('error occured while saving query document ' + req.body.documentName, e);
            res.status(500).send('error occured while saving query document ' + req.body.documentName + ' - ' + e);
        }
    });

    server.post(REST_URL_BASE + '/report/save', async function (req, res) {
        try {
            saveReport(req.body);
            res.status(200).send('success');
        } catch (e) {
            logger.logError('error occured while saving query document ' + req.body.document.documentName, e);
            res.status(500).send('error occured while saving query document ' + req.body.document.documentName + ' - ' + e);
        }
    });
    
    server.get(REST_URL_BASE + '/report/run/:docid', async function (req, res) {
        try {
            let report = loadReport(req.params.docid);
            let query = loadQueryDocument(report.document.queryDocumentId);
            let authorizer;
            try {
                logger.logInfo('authorizer: ' + report.authenticator);
                let Authenticator = require('./auth/' + report.authenticator + '.js');
                authorizer = new Authenticator();
            }
    
            catch(e) {
            }
    
            if (!authorizer || !authorizer.checkAuthorization(req)) {
                logger.logInfo('unauthorized access attempted');
                res.status(401).send('unauthorized');
            } else {
                let requiredInputs = getRequiredInputFields(query.document);
                // see if we need user input
                if (requiredInputs.length > 0) {
                    res.status(200).send({"userInputRequired": true, "whereComparisons": requiredInputs});
                } else {
                    res.status(200).send(await generateReport(report, query));
                }
            }
        } catch (e) {
            logger.logError('error occured while running report ' + req.params.docid, e);
            res.status(500).send('error occured while running report ' + req.params.docid + ' - ' + e);
        }
    });
    
    server.post(REST_URL_BASE + '/report/run/:docid', async function (req, res) {
        try {
            let report = loadReport(req.params.docid);
            let query = loadQueryDocument(report.document.queryDocumentId);
            res.status(200).send(await generateReport(report, query, req.body.parameters));
        } catch (e) {
            logger.logError('error occured while running report ' + req.params.docid, e);
            res.status(500).send('error occured while running report ' + req.params.docid + ' - ' + e);
        }
    });
    
    server.post(REST_URL_BASE + '/report/runfordesign', async function (req, res) {
        try {
            let report = req.body.report;
            let query = loadQueryDocument(report.document.queryDocumentId);
            res.status(200).send(await generateReport(report, query, req.body.parameters));
        } catch (e) {
            logger.logError('error occured while running report ' + req.body.report.reportName, e);
            res.status(500).send('error occured while running report ' + req.body.report.reportName + ' - ' + e);
        }
    });

    server.get(REST_URL_BASE + '/report/userinputrequired/:queryDocumentId', async function (req, res) {
        try {
            let query = loadQueryDocument(req.params.queryDocumentId);
            let requiredInputs = getRequiredInputFields(query.document);
            // see if we need user input
            if (requiredInputs.length > 0) {
                res.status(200).send({"userInputRequired": true, "whereComparisons": requiredInputs});
            } else {
                res.status(200).send({"userInputRequired": false});
            }
        } catch (e) {
            logger.logError('error occured while checking user input required ' + req.params.queryDocumentId, e);
            res.status(500).send('eerror occured while checking user input required  ' + req.params.queryDocumentId + ' - ' + e);
        }
    });


    server.get(REST_URL_BASE + '/design/deletedocument/:docid', async function (req, res) {
        try {
            deleteQueryDocument(req.params.docid);
            res.status(200).send('success');
        } catch (e) {
            logger.logError('error occured while deleting query document ' + req.params.docid, e);
            res.status(500).send('error occured while deleting query document ' + req.params.docid + ' - ' + e);
        }
    });

    server.get(REST_URL_BASE + '/report/delete/:docid', async function (req, res) {
        try {
            deleteReport(req.params.docid);
            res.status(200).send('success');
        } catch (e) {
            logger.logError('error occured while deleting report ' + req.params.docid, e);
            res.status(500).send('error occured while deleting report ' + req.params.docid + ' - ' + e);
        }
    });

    server.get(REST_URL_BASE + '/report/load/:docid', async function (req, res) {
        try {
            res.status(200).send(loadReport(req.params.docid));
        } catch (e) {
            logger.logError('error occured while loading report ' + req.params.docid, e);
            res.status(500).send('error occured while loading report ' + req.params.docid + ' - ' + e);
        }
    });

    server.get(REST_URL_BASE + '/report/querycolumninfo/:qdocid', async function (req, res) {
        try {
            let qdoc = loadQueryDocument(req.params.qdocid);
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
                    length: fld.length});
            }
            res.status(200).send(qcinfo);
        } catch (e) {
            logger.logError('error occured while loading query columns for query ' + req.params.qdocid, e);
            res.status(500).send('error occured while loading query columns for query ' + req.params.qdocid + ' - ' + e);
        }
    });

    server.get(REST_URL_BASE + '/design/loaddocument/:docid', async function (req, res) {
        try {
            res.status(200).send(loadQueryDocument(req.params.docid));
        } catch (e) {
            logger.logError('error occured while loading document ' + req.params.docid, e);
            res.status(500).send('error occured while loading document ' + req.params.docid + ' - ' + e);
        }
    });

    server.get(REST_URL_BASE + '/design/modeltree/:modelname', async function (req, res) {
        let modelname = req.params.modelname;
        let repo = repositoryMap.get(modelname.toLowerCase());
        if (repo && repo.metaData) {
            let data = {};
            data.key = 't0';
            data.title = modelname;
            loadModelData(data, repo.metaData, [], '', false);
            if (data.title) {
                res.status(200).json(data);
            } else {
                res.status(404).send('not found');
            }
        } else {
            logger.logError('no metadata found for' + modelname);
            res.status(500).send('no metadata found for' + modelname);
        }
    });

    server.get(REST_URL_BASE + '/report/querydocuments', async function (req, res) {
        try {
            let groupMap = new Map();
            let queryDocs = JSON.parse(loadQueryDocuments());
            loadGroupMap(queryDocumentGroups, groupMap);
            
            let retval = [];
            
            groupMap.forEach((v, k) => {
                if (queryDocs[k]) {
                    for (let i = 0; i < queryDocs[k].length; ++i) {
                        retval.push({key: k, group: v.title, documentName: queryDocs[k][i]});
                    }
                }
            });
            
            retval.sort((a, b) => {
                let retval = 0;
                if (a.group > b.group) {
                    retval = 1;
                } else if (a.group < b.group) {
                    retval = -1;
                } else {
                    if (a.documentName > b.documentName) {
                        retval = 1;
                    } else {
                        retval = -1;
                    }
                }
                
                return retval;
            });
            
            res.status(200).send(JSON.stringify(retval));
        }

        catch (e) {
            logger.logError('error occured while loading query documents', e);
            res.status(500).send('error occured while loading query documents');
        }
    });

    

    server.get(REST_URL_BASE + '/:module/:method', async function (req, res) {
        let repo = repositoryMap.get(req.params.module);
        let md = repo.getMetaData(req.params.module);
        if (util.isUndefined(repo)) {
            // support for using an alias for long module names
            if (util.isDefined(appConfiguration.aliases[req.params.module])) {
                repo = repositoryMap.get(appConfiguration.aliases[req.params.module]);
                md = repo.getMetaData(appConfiguration.aliases[req.params.module]);
            }
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
                    result = await repo.findOne(params);
                    break;
                case util.GET_ALL.toLowerCase():
                    result = await repo.getAll();
                    break;
                case util.FIND.toLowerCase():
                    for (let i = 0; i < fields.length; ++i) {
                        if (util.isDefined(req.query[fields[i].fieldName])) {
                            params.push(require('./main/WhereComparison.js')(fields[i].fieldName, req.query[fields[i].fieldName], util.EQUAL_TO));
                        }
                    }
                    result = await repo.find(params);
                    break;
                case util.COUNT.toLowerCase():
                    for (let i = 0; i < fields.length; ++i) {
                        if (util.isDefined(req.query[fields[i].fieldName])) {
                            params.push(require('./main/WhereComparison.js')(fields[i].fieldName, req.query[fields[i].fieldName], util.EQUAL_TO));
                        }
                    }
                    result = await repo.count(params);
                    break;
                case util.EXISTS.toLowerCase():
                    for (let i = 0; i < pk.length; ++i) {
                        params.push(req.query[pk[i].fieldName]);
                    }
                    result = await repo.exists(params);
                    break;
                case util.FIND_ONE_SYNC.toLowerCase():
                    for (let i = 0; i < pk.length; ++i) {
                        params.push(req.query[pk[i].fieldName]);
                    }
                    result = await repo.findOneSync(params);
                    break;
                case util.GET_ALL_SYNC.toLowerCase():
                    result = await repo.getAllSync(params);
                    break;
                case util.FIND_SYNC.toLowerCase():
                    for (let i = 0; i < fields.length; ++i) {
                        if (util.isDefined(req.query[fields[i].fieldName])) {
                            params.push(require('./main/WhereComparison.js')(fields[i].fieldName, req.query[fields[i].fieldName], util.EQUAL_TO));
                        }
                    }
                    result = await repo.findSync(params);
                    break;
                case util.COUNT_SYNC.toLowerCase():
                    for (let i = 0; i < fields.length; ++i) {
                        if (util.isDefined(req.query[fields[i].fieldName])) {
                            params.push(require('./main/WhereComparison.js')(fields[i].fieldName, req.query[fields[i].fieldName], util.EQUAL_TO));
                        }
                    }
                    result = await repo.countSync(params);
                    break;
                case util.EXISTS_SYNC.toLowerCase():
                    for (let i = 0; i < pk.length; ++i) {
                        params.push(req.query[pk[i].fieldName]);
                    }
                    result = await repo.existsSync(params);
                    break;
                default:
                    res.status(400).send('invalid method \'' + req.params.method + '\' specified');
                    break;
            }

            if (util.isUndefined(result)) {
                res.status(404).send('not found');
            } else if (util.isDefined(result.error)) {
                res.status(500).send(util.toString(result.error));
            } else if (util.isDefined(result.result)) {
                res.status(200).send(util.toDataTransferString(result.result));
            } else {
                res.status(200).send(result);
            }
        }

        res.end();
    });

    server.post(REST_URL_BASE + '/:module/:method', async function (req, res) {
        let repo = repositoryMap.get(req.params.module);
        let md = repo.getMetaData(req.params.module);
        if (util.isUndefined(repo)) {
            // support for using an alias for long module names
            if (util.isDefined(appConfiguration.aliases[req.params.module])) {
                repo = repositoryMap.get(appConfiguration.aliases[req.params.module]);
                md = repo.getMetaData(appConfiguration.aliases[req.params.module]);
            }
        }
        
        if ((req.params.method.toLowerCase() === util.SAVE.toLowerCase())
            && !saveAuthorizer.checkAuthorization(req)) {
            logger.logInfo('unauthorized access attempted');
            res.status(401).send('unauthorized');
        } else if (util.isUndefined(repo) || util.isUndefined(md)) {
            res.status(400).send('invalid module \'' + req.params.module + '\' specified');
        } else {
            let result;

            switch (req.params.method.toLowerCase()) {
                case util.FIND_ONE.toLowerCase():
                    result = await repo.findOne(req.body.primaryKeyValues);
                    break;
                case util.FIND.toLowerCase():
                    result = await repo.find(populateWhereFromRequestInput(req.body.whereComparisons),
                            populateOrderByFromRequestInput(req.body.orderByEntries), populateOptionsFromRequestInput(req.body.options));
                    break;
                case util.SAVE.toLowerCase():
                    result = repo.save(populateModelObjectsFromRequestInput(req.body.modelInstances), req.body.options);
                    break;
                case util.FIND_ONE_SYNC.toLowerCase():
                    result = await repo.findOneSYnc(req.body.primaryKeyValues);
                    break;
                case util.FIND_SYNC.toLowerCase():
                    result = await repo.findSync(populateWhereFromRequestInput(req.body.whereComparisons),
                            populateOrderByFromRequestInput(req.body.orderByEntries), populateOptionsFromRequestInput(req.body.options));
                    break;
                case util.SAVE_SYNC.toLowerCase():
                    result = repo.saveSync(populateModelObjectsFromRequestInput(req.body.modelInstances), req.body.options);
                    break;
                default:
                    res.status(400).send('invalid method \'' + req.params.method + '\' specified');
                    break;
            }

            if (util.isUndefined(result)) {
                res.status(404).send('not found');
            } else if (util.isDefined(result.error)) {
                res.status(500).send(util.toString(result.error));
            } else if (util.isDefined(result.result)) {
                res.status(200).send(util.toDataTransferString(result.result));
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

    server.put(REST_URL_BASE + '/:module/:method', function (req, res) {
        let repo = repositoryMap.get(req.params.module);
        let md = repo.getMetaData(req.params.module);
        if (util.isUndefined(repo)) {
            // support for using an alias for long module names
            if (util.isDefined(appConfiguration.aliases[req.params.module])) {
                repo = repositoryMap.get(appConfiguration.aliases[req.params.module]);
                md = repo.getMetaData(appConfiguration.aliases[req.params.module]);
            }
        }

        if (!saveAuthorizer.checkAuthorization(req)) {
            logger.logInfo('unauthorized access attempted');
            res.status(401).send('unauthorized');
        } else if (util.isUndefined(repo) || util.isUndefined(md)) {
            res.status(400).send('invalid module \'' + req.params.module + '\' specified');
        } else {
            let result;
            switch (req.params.method.toLowerCase()) {
                case util.SAVE.toLowerCase():
                    result = repo.save(populateModelObjectsFromRequestInput(req.body.modelInstances), populateOptionsFromRequestInput(req.body.options));
                    break;
                case util.SAVE_SYNC.toLowerCase():
                    result = repo.saveSync(populateModelObjectsFromRequestInput(req.body.modelInstances), populateOptionsFromRequestInput(req.body.options));
                    break;
                default:
                    res.status(400).send('invalid method \'' + req.params.method + '\' specified');
                    break;
            }

            if (util.isUndefined(result)) {
                res.status(404).send('not found');
            } else if (util.isDefined(result.error)) {
                res.status(500).send(util.toString(result.error));
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

    server.delete(REST_URL_BASE + '/:module/:method', function (req, res) {
        let repo = repositoryMap.get(req.params.module);
        let md = repo.getMetaData(req.params.module);
        if (util.isUndefined(repo)) {
            // support for using an alias for long module names
            if (util.isDefined(appConfiguration.aliases[req.params.module])) {
                repo = repositoryMap.get(appConfiguration.aliases[req.params.module]);
                md = repo.getMetaData(appConfiguration.aliases[req.params.module]);
            }
        }
        if (!deleteAuthorizer.checkAuthorization(req)) {
            logger.logInfo('unauthorized access attempted');
            res.status(401).send('unauthorized');
        } else if (util.isUndefined(repo) || util.isUndefined(md)) {
            res.status(400).send('invalid module \'' + req.params.module + '\' specified');
        } else {
            let result;
            switch (req.params.method.toLowerCase()) {
                case util.DELETE.toLowerCase():
                    result = repo.delete(populateModelObjectsFromRequestInput(req.body.modelInstances), populateOptionsFromRequestInput(req.body.options));
                    break;
                case util.DELETE_SYNC.toLowerCase():
                    result = repo.deleteSync(populateModelObjectsFromRequestInput(req.body.modelInstances), populateOptionsFromRequestInput(req.body.options));
                    break;
                default:
                    res.status(400).send('invalid method \'' + req.params.method + '\' specified');
                    break;
            }

            if (util.isDefined(result.error)) {
                res.status(500).send(util.toString(result.error));
            } else if (util.isDefined(result.rowsAffected)) {
                res.status(200).send(util.toDataTransferString(result));
            } else {
                res.status(200).send(result);
            }
        }

        res.end();
    });

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

            let md = this.getMetaData(input[0].__model__.toLowerCase());

            for (let i = 0; i < input.length; ++i) {
                let model = require('./' + md.getModule())(md);
                Object.assign(model, input[i]);
                retval.push(model);
            }
        }

        return retval;
    }
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

function buildQueryDocumentSql(queryDocument, forDisplay) {
    let relationshipTree = loadRelationshipTree(queryDocument.document);
    let joins = [];
    let joinset = new Set();
    let aliasMap = new Map();
    for (let i = 0; i < relationshipTree.length; ++i) {
        buildQueryDocumentJoins('t0', relationshipTree[i], joins, joinset, aliasMap);
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
            sql += (comma + queryDocument.document.selectedColumns[i].customInput.replace('?', alias + '.' + colName));
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
                    sql += (' :' + replaceIndex + ' ');
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

function buildQueryDocumentJoins(parentAlias, relationships, joins, joinset, aliasMap) {
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

function loadQueryDocuments() {
    let retval = {};
    let groups = fs.readdirSync(appConfiguration.queryDocumentRoot);

    for (let i = 0; i < groups.length; ++i) {
        let files = fs.readdirSync(appConfiguration.queryDocumentRoot + path.sep + groups[i]);
        retval[groups[i]] = [];
        for (let j = 0; j < files.length; ++j) {
            if (files[j].endsWith('.json')) {
                retval[groups[i]].push(files[j]);
            }
        }
        
        if (retval[groups[i]].length > 0) {
            retval[groups[i]].sort();
        }
    }
    
    if (logger.isLogDebugEnabled()) {
        logger.logDebug('query documents: ' + JSON.stringify(retval));
    }
    
    return JSON.stringify(retval);
}

function loadReportDocuments() {
    let retval = {};
    let groups = fs.readdirSync(appConfiguration.reportDocumentRoot);

    for (let i = 0; i < groups.length; ++i) {
        let files = fs.readdirSync(appConfiguration.reportDocumentRoot + path.sep + groups[i]);
        retval[groups[i]] = [];
        for (let j = 0; j < files.length; ++j) {
            if (files[j].endsWith('.json')) {
                retval[groups[i]].push(files[j]);
            }
        }
        
        if (retval[groups[i]].length > 0) {
            retval[groups[i]].sort();
        }
    }
    
    if (logger.isLogDebugEnabled()) {
        logger.logDebug('report documents: ' + JSON.stringify(retval));
    }
    
    return JSON.stringify(retval);
}


function loadAuthorizers() {
    let retval = [];
    let files = fs.readdirSync('./auth');

    for (let i = 0; i < files.length; ++i) {
        if ((files[i] !== 'Authorizer.js') && files[i].endsWith('Authorizer.js')) {
            retval.push(files[i].replace('.js', ''));
        }
    }
    
    retval.sort();
    if (logger.isLogDebugEnabled()) {
        logger.logDebug('autorizers: ' + JSON.stringify(retval));
    }
    
    return JSON.stringify(retval);
}


function saveQueryDocument(doc) {
    let fname = appConfiguration.queryDocumentRoot + path.sep + doc.group + path.sep + doc.documentName + '.json';
    fspath.writeFile(fname, JSON.stringify(doc), function(err){
        if(err) {
            throw err;
        } else {
            logger.logInfo('file created: ' + fname);
        }
    });
}

function saveReport(doc) {
    let fname = appConfiguration.reportDocumentRoot + path.sep + doc.group + path.sep + doc.document.reportName + '.json';
    fspath.writeFile(fname, JSON.stringify(doc), function(err){
        if(err) {
            throw err;
        } else {
            logger.logInfo('file created: ' + fname);
        }
    });
}

function deleteQueryDocument(docid) {
    let pos = docid.indexOf('.');
    let group = docid.substring(0, pos);
    let docName= docid.substring(pos+1);
    
    let fname = appConfiguration.queryDocumentRoot + path.sep + group + path.sep + docName;
    fs.unlinkSync(fname);
}

function deleteReport(docid) {
    let pos = docid.indexOf('.');
    let group = docid.substring(0, pos);
    let reportName= docid.substring(pos+1);
    
    let fname = appConfiguration.reportDocumentRoot + path.sep + group + path.sep + reportName;
    fs.unlinkSync(fname);
}

function loadQueryDocument(docid) {
    let pos = docid.indexOf('.');
    let group = docid.substring(0, pos);
    let docName= docid.substring(pos+1);
    
    let fname = (appConfiguration.queryDocumentRoot + path.sep + group + path.sep + docName);
    
    return JSON.parse(fs.readFileSync(fname));
}

function loadReport(docid) {
    let pos = docid.indexOf('.');
    let group = docid.substring(0, pos);
    let reportName= docid.substring(pos+1);
    
    let fname = (appConfiguration.reportDocumentRoot + path.sep + group + path.sep + reportName);
    
    if (!fname.endsWith('.json')) {
        fname += '.json';
    }
    return JSON.parse(fs.readFileSync(fname));
}

function loadGroupMap(curGroup, groupMap) {
    let g = {
        key: curGroup.key,
        title: curGroup.title
    };
    
    groupMap.set(g.key, g);
    
    if (curGroup.children) {
        for (let i = 0; i < curGroup.children.length; ++i) {
            loadGroupMap(curGroup.children[i], groupMap);
        }
    }
}

module.exports.buildResultObjectGraph = buildResultObjectGraph;
function buildResultObjectGraph (doc, resultRows, asObject) {
    let retval = [];
    let positionMap = new Map();
    let keyColumnMap = new Map();
    let aliasList = [];

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
                        let parentModel = parentObjectMap.get(alias.substring(0, alias.lastIndexOf('t')));
                        let fieldName = getParentFieldNameFromPath(doc.document.selectedColumns[keypos[0]].path);
                        let ref = repositoryMap.get(parentModel.__model__.toLowerCase()).getMetaData().findRelationshipByName(fieldName);
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

async function generateReport(report, query, parameters) {
    let retval = '';
    
    // SIM-4 all reports will run from object graphs
    query.document.resultFormat = 'object';
    let sql = buildQueryDocumentSql(query);
    
    if (logger.isLogDebugEnabled()) {
        logger.logDebug(util.toString(query));
        logger.logDebug(sql);
    }
    
    let repo = repositoryMap.get(query.document.rootModel.toLowerCase());
    let result = await repo.executeSqlQuery(sql, parameters);
    if (result.error) {
        throw new Error(result.error);
    } else {
        let haveCharts = false;
        let resultSet = buildResultObjectGraph(query, result.result.rows, true);
        
        // expect to work with array of results so
        // make an array if only 1 object comes back
        if (!Array.isArray(resultSet)) {
            resultSet = [resultSet];
        }
        let ppi = report.document.pixelsPerInch;
        let width = report.document.documentWidth/ppi;
        let height = report.document.documentHeight/ppi;
        let marginLeft = report.document.margins[0] / ppi;
        let marginTop = report.document.margins[1] / ppi;
        let chartData = {};
        let style = '@media print {body {width: '
            + width
            + 'in;} } @page {page-size: '
            + report.document.documentSize
            + '; orientation: '
            + report.document.orientation
            + '; margin: 0;} '
            + '.page {position: relative; background-color: white; width: '
            + width
            + 'in; height: '
            + height
            + 'in;}';
       
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
            if (report.document.reportObjects[i].objectType === 'chart') {
                haveCharts = true;
                chartData = {};
                chartData.chartjsurl = appConfiguration.chartjsurl;
            }
            if (report.document.reportObjects[i].style) {
                if (!mySet.has(report.document.reportObjects[i].style)) {
                    mySet.add(report.document.reportObjects[i].style);
                    style += (' '
                        + report.document.reportObjects[i].style.replace('div.rpt-'
                            + report.document.reportObjects[i].objectType
                            + '-' + report.document.reportObjects[i].id
                            + ':hover { border: dotted 1px red;}', ''));
                }
            
                switch(report.document.reportObjects[i].reportSection) {
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
        }
        
        do {
            rowInfo.pageBreakRequired = false;
            rowInfo.pageNumber = (pagenum+1);
            rowInfo.startRow = rowInfo.currentRow;
            rowInfo.incrementRowRequired = false;
            html += '<div style="top: 0;" class="page"><div style="position: absolute; overflow: hidden; left: 0; top: 0; width: '
                + report.document.documentWidth/rowInfo.ppi
                + 'in; height: '
                + report.document.headerHeight/rowInfo.ppi
                + 'in;">';
            for (let i = 0; i < headerObjects.length; ++i) {
                html += getObjectHtml(marginTop, headerObjects[i], rowInfo);
            }
 
            html += '</div><div style="position: absolute; overflow: hidden; left: 0; top: '
                + report.document.headerHeight/rowInfo.ppi
                + 'in; width: '
                + report.document.documentWidth/rowInfo.ppi
                + 'in; height: '
                + (report.document.documentHeight - (report.document.headerHeight + report.document.footerHeight))/rowInfo.ppi
                + 'in;">';
            for (let i = 0; i < bodyObjects.length; ++i) {
                html += getObjectHtml(0, bodyObjects[i], rowInfo);
            }
    
            html += '</div><div style="position: absolute; overflow: hidden; left: 0; top: '
                + (report.document.documentHeight - report.document.footerHeight)/rowInfo.ppi
                + 'in; width: '
                + report.document.documentWidth/rowInfo.ppi
                + 'in; height: '
                + report.document.footerHeight/rowInfo.ppi
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
                html += '<br />';
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
        case 'graph':
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
    function index(obj,i) {if (obj) { return obj[i]; } else { return '';}}
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
    
    rowInfo.chartData.charts = [];
    
    let retval = '<div style="'
        + getReportObjectStyle(yOffset, reportObject, rowInfo)
        + '" class="' + cname + '">'
        + '<canvas style="width: 100%; height: 100%" id="'
        + cname
        + '"></canvas></div>';
    
    loadChartLabels(reportObject, rowInfo);
    let ds = getChartDatasets(reportObject, rowInfo);
    let options = getChartOptions(reportObject, rowInfo);
    
    rowInfo.chartData.charts.push({
        canvasId: cname,
        type: reportObject.chartType,
        data: {
            labels: rowInfo.chartLabels,
            datasets: ds
        },
        options: options
    });
    
 
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
                    ds.backgroundColor = dataAxes[i].color;
                    ds.borderColor = dataAxes[i].color;
                    ds.borderWidth = 1;
                    ds.hoverBackgroundColor = tinycolor(ds.backgroundColor).darken(15).toString();
                    break;
                case 'line':
                    ds.borderColor = dataAxes[i].color;
                    ds.borderWidth = dataAxes[i].borderWidth;
                    if (reportObject.showBackground) {
                        ds.backgroundColor = tinycolor(ds.borderColor).lighten(40).desaturate(20).toString();
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
                let val = rowInfo.dataRows[i][dataAxes[j].dataPosition];
    
                if (!val) {
                    val = 0;
                }
                
                if (reportObject.reportColumns[j].precision) {
                    retval[j].data[pos] = val.toFixed(reportObject.reportColumns[j].precision);
                } else {
                    retval[j].data[pos] = val.toFixed(2);
                }
            }
            
            switch(reportObject.chartType) {
                case 'pie':
                case 'doughnut':
                    if (!retval[j].backgroundColor) {
                        retval[j].backgroundColor = [];
                    }
    
                    retval[j].backgroundColor.push(randomColor({luminosity: 'dark'}));
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
