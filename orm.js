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

// REST API stuff
const express = require('express');
const bodyParser = require('body-parser');
const server = express();

const APP_NAME = appConfiguration.applicationName || "SIMPLE ORM";
const REST_URL_BASE = appConfiguration.restUrlBase || '/orm';
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
    server.use(bodyParser.urlencoded({ extended: false }));
    server.use(bodyParser.json());
    server.use(cors());

    // plug authentication in here
    if (util.isDefined(appConfiguration.authorizer)) {
        const authorizer = new (require(appConfiguration.authorizer));
        const authfunc = function(user, pass) {
            return authorizer.isAuthorized(user, pass);
        };
    
        server.use(basicAuth({ authorizer: authfunc}));
    }

    server.listen(REST_SERVER_PORT, () => {
        logger.logInfo(APP_NAME + ' is live on port ' + REST_SERVER_PORT);
    });
    
    server.get(REST_URL_BASE + '/design/login', async function(req, res) {
        if (logger.isLogDebugEnabled()) {
            logger.logDebug("in /design/login");
        }
        res.status(200).send("success");
    });
    
    server.get(REST_URL_BASE + '/design/modelnames', async function(req, res) {
        res.status(200).send(modelList);
    });
    
    server.post(REST_URL_BASE + '/design/generatesql', async function(req, res) {
        res.status(200).send(buildSql(req.body));
    });
    
    server.get(REST_URL_BASE + '/design/modeltree/:modelname', async function(req, res) {
        let modelname = req.params.modelname;
        let repo = repositoryMap.get(modelname.toLowerCase());
        if (repo && repo.metaData) {
            let pathset = new Set();
            let data = new Object();
            data.key = 't0';
            data.title = modelname;
            loadModelData(data, repo.metaData, 0, pathset, '', false);
            if (data.title) {
                res.status(200).json(data);
            } else {
                res.status(404).send('not found');
            }
        } else {
            res.status(500).send('no metadata found for' + modelname);
        }
    });

    server.get(REST_URL_BASE + '/:module/:method', async function(req, res) {
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
            switch(req.params.method.toLowerCase()) {
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

    server.post(REST_URL_BASE + '/:module/:method', async function(req, res) {
        let repo = repositoryMap.get(req.params.module);
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
            
            switch(req.params.method.toLowerCase()) {
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

    server.put(REST_URL_BASE + '/:module/:method', function(req, res) {
        let repo = repositoryMap.get(req.params.module);
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
            let f;
            switch(req.params.method.toLowerCase()) {
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

    server.delete(REST_URL_BASE + '/:module/:method', function(req, res) {
        let repo = repositoryMap.get(req.params.module);
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
            switch(req.params.method.toLowerCase()) {
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
            let wc =  require('./main/WhereComparison.js')();
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
            let obe =  require('./main/OrderByEntry.js')();
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
                let model =  require('./' + md.getModule())(md);
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
    logger.logInfo('creating tables if required...');
    
    let keys = Array.from(repositoryMap.keys());
    
    for (let i = 0; i < keys.length; ++i) {
        let repo = repositoryMap.get(keys[i]);
        let exists = await repo.tableExists();
        if (!exists) {
            logger.logInfo('    creating table ' + repo.getMetaData().getTableName());
            await repo.createTable();
            newTableRepos.push(repo);
        }
    }
    
    for (let i = 0; i < newTableRepos.length; ++i) {
        await newTableRepos[i].createForeignKeys();
        await newTableRepos[i].createAutoIncrementGeneratorIfRequired();
    }
}

function loadModelData(data, md, level, pathset, path, child) {
    data.objectName = md.objectName;
    data.tableName = md.tableName;
    data.children = new Array();

    let key = 1;

    for (let i = 0; i < md.fields.length; ++i) {
        let f = Object.assign({}, md.fields[i]);
        f.key = (data.key + '-c' + i);
        f.title = f.fieldName;
        f.isLeaf=true;
        f.key = getUniqueKey();
        if (path) {
            f.__path__ = path + '.' + f.fieldName;
        } else {
            f.__path__ = f.fieldName;
        }
        data.children.push(f);
    }

    if (md && (level < appConfiguration.defaultDesignTableDepth)) {
        // add only top level many-to one defs
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
                    if (repo && !pathset.has(newpath)) {
                        pathset.add(newpath);
                        let def = new Object();
                        def.key = getUniqueKey();
                        def.__path__ = newpath;
                        def.__type__ = 'mto';
                        def.title = md.manyToOneDefinitions[i].fieldName;
                        def.joinColumns = md.manyToOneDefinitions[i].joinColumns;
                        def.targetModelName = md.manyToOneDefinitions[i].targetModelName;
                        def.targetTableName = md.manyToOneDefinitions[i].targetTableName;
                        loadModelData(def, repo.metaData, level+1, pathset, newpath, true);
                        data.children.push(def);
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
                    if (repo && !pathset.has(newpath)) {
                        pathset.add(newpath);
                        let def = new Object();
                        def.key = getUniqueKey();
                        def.__path__ = newpath;
                        def.__type__ = 'oto';
                        def.title = md.oneToOneDefinitions[i].fieldName;
                        def.joinColumns = md.oneToOneDefinitions[i].joinColumns;
                        def.targetModelName = md.oneToOneDefinitions[i].targetModelName;
                        def.targetTableName = md.oneToOneDefinitions[i].targetTableName;
                        loadModelData(def, repo.metaData, level+1, pathset, newpath, true);
                        data.children.push(def);
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
                    
                    if (repo && !pathset.has(newpath)) {
                        pathset.add(newpath);
                        let def = new Object();
                        def.__path__ = newpath;
                        def.__type__ = 'otm';
                        def.key = getUniqueKey();
                        def.title = md.oneToManyDefinitions[i].fieldName;
                        def.joinColumns = md.oneToManyDefinitions[i].joinColumns;
                        def.targetModelName = md.oneToManyDefinitions[i].targetModelName;
                        def.targetTableName = md.oneToManyDefinitions[i].targetTableName;
                        loadModelData(def, repo.metaData, level+1, pathset, newpath, true);
                        data.children.push(def);
                    }
                }
            }
        }
    }
}

    
function getUniqueKey() {
    return uuidv1();
}

