Simple ORM framework for Node.js that supports MySQL, Oracle and PostgreSQL.

Source:
https://github.com/simplenodeorm/simplenodeorm.git


Simplenodeorm provides database access to Oracle, MySQL and PostgreSQL databases. It is designed to be imported 
into an existing javascript app to provide database access based on configuration files provided by the parent 
application as in the example below:


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

It is expected that the required ORM object have been created and are located in the  location 
specified by <appconfig>.ormModuleRootPath. The callback function (“onServerStart” above) will 
be called with the express server instance and the server logger. You can use this server 
instance to add you own customized http handlers.

For mor detailed information see simplenodeorm.pdf
