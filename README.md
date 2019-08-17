Simple ORM framework for Node.js that supports MySQL, Oracle and PostgreSQL.

Source:
https://github.com/simplenodeorm/simplenodeorm.git


Simplenodeorm provides database access to Oracle, MySQL and PostgreSQL databases. It is designed to be imported 
into an existing javascript app to provide database access based on configuration files provided by the parent 
application as in the example below:


```
const fs = require('fs');
const orm = require('@simplenodeorm/simplenodeorm/orm');

const appConfiguration = JSON.parse(fs.readFileSync('./appconfig.json'));
const testConfiguration = JSON.parse(fs.readFileSync('./testconfig.json'));
const customizations = require('./Customization.js');


// these are expected to be full paths so do this for the example so it 
// is self-contained
appConfiguration.queryDocumentRoot = __dirname + "/" + appConfiguration.queryDocumentRoot;
appConfiguration.reportDocumentRoot = __dirname + "/" +  appConfiguration.reportDocumentRoot;
appConfiguration.reportDocumentGroupsDefinition = __dirname + "/" + appConfiguration.reportDocumentGroupsDefinition;
appConfiguration.queryDocumentGroupsDefinition = __dirname + "/" + appConfiguration.queryDocumentGroupsDefinition;


    orm.startOrm(__dirname, appConfiguration, testConfiguration, onServerStarted, customizations);

function onServerStarted(server, logger) {
    logger.logInfo("simplenodeorm server started for example application");

    server.get('/example', async function (req, res) {
        res.status(200).send("exam call made");
    });

    let repo = orm.getRepository("Film");
    let allFilms = repo.getAll();
}

```
It is expected that the required ORM objects have been created and are located in the location 
specified by appConfiguration.ormModuleRootPath. The callback function (“onServerStart” above) will 
be called with the express server instance and the server logger. You can use this server 
instance to add you own customized http handlers.

The Customization module is to facilitate report and query document interactions for the Query Designer 
and Report Designer applications. By default, the Query and Report Designers save documents on the file system
at locations defined in the appConfiguration entries:
```
  "queryDocumentRoot" : "<absolute-path-to>/queries",
  "reportDocumentRoot" : "<absolute-path-to>/reports",
  "reportDocumentGroupsDefinition": "<absolute-path-to>/report-document-groups.json",
  "queryDocumentGroupsDefinition": "<absolute-path-to>/query-document-groups.json",
```
Query and Report documents are saved in JSON files by group defined as a JSON hierarchy. An example Report Group definition
is shown below:
 ```
 {
     "title": "Reports",
     "key" : "grp0",
     "isLeaf": false,
     "children": [
         {
             "title": "General",
             "key" : "grp1",
             "isLeaf": false
         },
         {
             "title": "Financial",
             "key" : "grp2",
             "isLeaf": false,
             "children": [
                 {
                     "title": "Accounting",
                     "key" : "grp3",
                     "isLeaf": false
                 },
                 {
                     "title": "Purchasing",
                     "key" : "grp4",
                     "isLeaf": false
                 }
             ]
 
         },
         {
             "title": "Personnel",
             "key" : "grp5",
             "isLeaf": false
         }
         
     ]
 }
 ```
 If you want to customize the way Query and Report documents are handled such as storing the group hierarchy and documents 
 in the database you can implement the following methods in the Customization module:

```
 module.exports.loadReportDocumentGroups = function(orm) {}
 module.exports.loadQueryDocumentGroups = function(orm) {}
 module.exports.loadReportDocuments = function(orm) {}
 module.exports.loadReport = function(orm, documentId) {}
 module.exports.saveReport = function(orm, reportDocument) {}
 module.exports.deleteReport = function(orm, reportId) {}
 module.exports.loadQueryDocuments = function(orm) {}
 module.exports.loadQuery = function(orm, queryId) {}
 module.exports.saveQuery = function(orm, queryDocument) {}
 module.exports.deleteQuery = function(orm, queryId) {};
```
For more detailed information see <a href="https://github.com/simplenodeorm/simplenodeorm/blob/master/simplenodeorm.pdf">simplenodeorm.pdf</a>

For help in generating ORM model, metadata and repository objects a java maven application is available on github
at <a href="https://github.com/simplenodeorm/ormobjectgenerator">ormobjectgenerator</a>

An example implementation is available on github at <a href="https://github.com/simplenodeorm/simplenodeorm-example">simplenodeorm example application</a>

There are 2 associated applications to create, save and run queries and reports. These can be found on NPM and in github at the links below:

<a href="https://www.npmjs.com/package/@simplenodeorm/simplenodedesigner">Query Designer - NPM</a><br />
<a href="https://github.com/simplenodeorm/simplenodedesigner">Query Designer - GitHub</a><br />
<a href="https://github.com/simplenodeorm/simplenodedesigner/blob/master/public/docs/qdesigner-full.pdf">Query Designer - Documentation</a><br /><br />

<a href="https://www.npmjs.com/package/@simplenodeorm/simplenodereport">Report Designer - NPM</a><br />
<a href="https://github.com/simplenodeorm/simplenodereport">Report Designer - GitHub</a><br />
<a href="https://github.com/simplenodeorm/simplenodereport/blob/master/public/docs/rdesigner-full.pdf">Report Designer - Documentation</a>

