"use strict";

const oracledb = require('oracledb');
const fs = require('fs');
const util = require('./main/util.js');
const modelList = new Array();
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

// REST API stuff
const express = require('express');
const bodyParser = require('body-parser');
const server = express();

const APP_NAME = appConfiguration.applicationName || "SIMPLE ORM";
const REST_URL_BASE = appConfiguration.restUrlBase || '/hrorm';
const REST_SERVER_PORT = appConfiguration.restPort || 8888;
 
 
// create an event emitter to signal when
// connection pool is initialized
var poolCreatedEmitter = new events.EventEmitter();
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


// setup database pool and fire off orm load
require("./db/dbConfiguration.js")(poolCreatedEmitter, appConfiguration, testConfiguration);

function loadOrm() {
    logger.logInfo("loading " + APP_NAME + "...");
    loadOrmDefinitions();

    modelList.sort();

    // ensure no changes after load
    Object.freeze(modelList);
    Object.freeze(repositoryMap);
    
    logger.logInfo(APP_NAME + " loaded ");
};

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
    return await oracledb.getConnection(poolAlias);
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
    let modelFiles = new Array();
    loadModelFiles("./model", modelFiles);
    let indx = 1;

    for (let i = 0; i < modelFiles.length; ++i) {
        let modelName = getModelNameFromPath(modelFiles[i]);
        
        let md = new (require(modelFiles[i].replace('./model', './metadata').replace('.js', 'MetaData.js')));
        if (util.isDefined(md)) {
            modelList.push(modelName);
            let repo = require(modelFiles[i].replace('./model', './repository').replace('.js', 'Repository.js'))(md);
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
};



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
    server.use(bodyParser.urlencoded({extended: false}));
    server.use(bodyParser.json());
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
            res.status(200).send(buildQueryDocumentSql(req.body));
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
            logger.logError('error occured while saving query document ' + req.body.documentName, e);
            res.status(500).send('error occured while saving query document ' + req.body.documentName + ' - ' + e);
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
            let pathset = new Set();
            let data = new Object();
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

        let params = new Array();
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
            let f;
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

        let retval = new Array();

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

        let retval = new Array();

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

        let retval = new Array();

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
    let newTableRepos = new Array();
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
    data.children = new Array();

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
                        let def = new Object();
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
                        let def = new Object();
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
                        let def = new Object();
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

function buildQueryDocumentSql(queryDocument) {
    let relationshipTree = loadRelationshipTree(queryDocument.document);
    let joins = new Array();
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
        if (pos < 0) {
            alias = 't0';
            let md = repositoryMap.get(queryDocument.document.rootModel.toLowerCase()).getMetaData();
            colName = md.getField(queryDocument.document.selectedColumns[i].path).columnName;
            queryDocument.document.selectedColumns[i].model = queryDocument.document.rootModel;
        } else {
            let info = aliasMap.get(queryDocument.document.selectedColumns[i].path.substring(0, pos));
            let md = repositoryMap.get(info.model.toLowerCase()).getMetaData();
            queryDocument.document.selectedColumns[i].model = info.model;
            colName = md.getField(queryDocument.document.selectedColumns[i].path.substring(pos + 1)).columnName;
            alias = info.alias;
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
        }
        comma = ', ';
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
                        sql += ' to_timestamp(\'' + queryDocument.document.whereComparisons[i].comparisonValue + '\', \'YYYY-MM-DD"T"HH24:MI:SS.ff3"Z"\') ';
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

                sql += (comma + ' ' + alias + '.' + colName);
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
            } else {
                sql += (comma + alias + '.' + colName);
            }

            if (orderByColumns[i].sortDescending) {
                sql += ' desc';
            }

            comma = ',';
        }
    }

    return sql;
}

function getOrderByColumns(selectedColumns) {
    let retval = new Array();

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
    let retval = new Array();
    let paths = getDistinctJoinPaths(queryDocument.selectedColumns);
    for (let i = 0; i < paths.length; ++i) {
        let l = new Array();
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
    let retval = new Array();
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
    let retval = new Object();
    let groups = fs.readdirSync(appConfiguration.queryDocumentRoot);

    for (let i = 0; i < groups.length; ++i) {
        let files = fs.readdirSync(appConfiguration.queryDocumentRoot + path.sep + groups[i]);
        retval[groups[i]] = new Array();
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
    let retval = new Object();
    let groups = fs.readdirSync(appConfiguration.reportDocumentRoot);

    for (let i = 0; i < groups.length; ++i) {
        let files = fs.readdirSync(appConfiguration.reportDocumentRoot + path.sep + groups[i]);
        retval[groups[i]] = new Array();
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
    let fname = appConfiguration.reportDocumentRoot + path.sep + doc.group + path.sep + doc.reportName + '.json';
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


function buildResultObjectGraph(doc, resultRows) {
    let retval = [];
    let positionMap = new Map();
    let keyColumnMap = new Map();
    let aliasList = [];

    // determine the various table column positions in the select
    for (let i = 0; i < doc.document.selectedColumns.length; ++i) {
        let pos = positionMap.get(doc.document.selectedColumns[i].alias);
        if (util.isUndefined(pos)) {
            pos = new Array();
            positionMap.set(doc.document.selectedColumns[i].alias, pos);
            aliasList.push(doc.document.selectedColumns[i].alias);
        }
        
        pos.push(i);
    }
    
    aliasList.sort();
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

            let keyPositions = new Array();
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
    
    let lastKeyMap = new Map();
    for (let i = 0; i < resultRows.length; ++i) {
        let key = '';
        let keypos = keyColumnMap.get('t0');
        let lastKey = lastKeyMap.get('t0');

        for (let j = 0; j < keypos.length; ++j) {
            key += (resultRows[i][keypos[j]] + '.');
        }

        if (!lastKey || (lastKey !== key)) {
            lastKeyMap.set('t0', key);
            let model = new Object();
            model.__model__ = doc.document.rootModel;
            retval.push(model);
            
            let colpos = positionMap.get('t0');
            for (let k = 0; k < colpos.length; ++k) {
                let pos = doc.document.selectedColumns[colpos[k]].path.lastIndexOf('.');
                let fieldName = doc.document.selectedColumns[colpos[k]].path.substring(pos+1);
                model[fieldName] = resultRows[i][colpos[k]];
            }
        }   
    
        for (let j = 0; j< aliasList.length; ++j) {
            if (aliasList[j] !== 't0') {
                key = '';
                keypos = keyColumnMap.get(aliasList[j]);
                lastKey = lastKeyMap.get(aliasList[j]);
                
                let allNull = true;
                for (let k = 0; k < keypos.length; ++k) {
                    key += (resultRows[i][keypos[k]] + '.');
                    
                    if (resultRows[i][keypos[k]]) {
                        allNull = false;
                    }
                }
                
                if (allNull) {
                    break;
                }
                
                if (!lastKey || (lastKey !== key)) {
                    lastKeyMap.set(aliasList[j], key);
                    let curmodel = retval[retval.length-1];
                    
                    let pos = doc.document.selectedColumns[keypos[0]].path.lastIndexOf('.');
                    let rootpath =  doc.document.selectedColumns[keypos[0]].path.substring(0, pos);
                    let pathParts = rootpath.split('.');
                    // walk down relationship path
                    for (let k = 0; k < pathParts.length; ++k) {
                        let modelName = curmodel.__model__;
                        let ref = repositoryMap.get(modelName.toLowerCase()).getMetaData().findRelationshipByName(pathParts[k]);
                        if (util.isUndefined(curmodel[ref.fieldName]) || (curmodel[ref.fieldName].length === 0)) {
                            let obj = new Object();
                            obj.__model__ = ref.targetModelName;
                            switch(ref.type) {
                                case 1:
                                    curmodel[ref.fieldName] = obj;
                                    break;
                                case 2:
                                case 3:
                                    curmodel[ref.fieldName] = new Array();
                                    curmodel[ref.fieldName].push(obj);
                                    break;
                            }
                            curmodel = obj;
                        } else {
                            switch(ref.type) {
                                case 1:
                                    curmodel = curmodel[ref.fieldName];
                                    break;
                                case 2:
                                case 3:
                                    curmodel = curmodel[ref.fieldName][curmodel[ref.fieldName].length - 1];
                                    break;
                            }
                        }
                        
                        modelName = curmodel.__model__;
                    }

                    let colpos = positionMap.get(aliasList[j]);
                    for (let l = 0; l < colpos.length; ++l) {
                        let pos = doc.document.selectedColumns[colpos[l]].path.lastIndexOf('.');
                        let fieldName = doc.document.selectedColumns[colpos[l]].path.substring(pos+1);
                        curmodel[fieldName] = resultRows[i][colpos[l]];
                    }
                }
            }
        }
    }
    
    if (retval && (retval.length === 1)) {
        retval = retval[0];
    }
    
    return JSON.stringify(retval);
}