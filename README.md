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

orm.startOrm(__dirname, appConfiguration, testConfiguration, onServerStarted, customizations);

function onServerStarted(server, logger) {
    logger.logInfo("simplenodeorm server started");
    
    server.get('/clinicalhelper', async function (req, res) {
        res.status(200).send("clinicalhelper call made");
    });
}
```
It is expected that the required ORM object have been created and are located in the  location 
specified by appConfiguration.ormModuleRootPath. The callback function (“onServerStart” above) will 
be called with the express server instance and the server logger. You can use this server 
instance to add you own customized http handlers.

The Customization module is to facilitate report and query document interactions for the Query Designer 
and the Report Designer. By default, the Query and Report Designers save documents on the file system
at locations defined in the appConfiguration entries:
```
  "queryDocumentRoot" : "examples/queries",
  "reportDocumentRoot" : "examples/reports",
  "reportDocumentGroupsDefinition": "<absolute-path-to>/report-document-groups.json",
  "queryDocumentGroupsDefinition": "<absolute-path-to>/query-document-groups.json",
```
Query and Report documents are saved in JSON files by group defained as a JSON hierarchy. An example Report Group definition
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
 module.exports.loadReportDocumentGroups = function() {}
 module.exports.loadQueryDocumentGroups = function() {}
 module.exports.loadReportDocuments = function() {}
 module.exports.loadReport = function(documentId) {}
 module.exports.saveReport = function(reportDocument) {}
 module.exports.deleteReport = function(reportId) {}
 module.exports.loadQueryDocuments = function() {}
 module.exports.loadQuery = function(queryId) {}
 module.exports.saveQuery = function(queryDicument) {}
 module.exports.deleteQuery = function(queryId) {};
```
For more detailed information see <a href="https://github.com/simplenodeorm/simplenodeorm/blob/master/simplenodeorm.pdf">simplenodeorm.pdf</a>
