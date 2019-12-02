Simple ORM framework for Node.js that supports MySQL, Oracle and PostgreSQL.

Source:
https://github.com/simplenodeorm/simplenodeorm.git

Simplenodeorm is an extensible, cloud-ready object relational mapping application that provides database access to Oracle, 
MySQL and PostgreSQL databases. Query and Report Design is supported via the <a href="https://github.com/simplenodeorm/simplenodedesigner/blob/master/public/docs/qdesigner-full.pdf" target="_blank">Query Designer</a> and <a href="https://github.com/simplenodeorm/simplenodereport/blob/master/public/docs/rdesigner-full.pdf" target="_blank">Report Designer</a> applications. 
REST access is supported. Simplenodeorm can be plugged into an application as shown in the example code snippet below:

```
const fs = require('fs');
const orm = require('@simplenodeorm/simplenodeorm');
const md5 = require('md5');
const WhereComparison = require('@simplenodeorm/simplenodeorm/main/WhereComparison');
const OrderByEntry = require('@simplenodeorm/simplenodeorm/main/OrderByEntry');
const { promisify } = require('util');
const readFileAsync = promisify(fs.readFile);
const appConfiguration = JSON.parse(fs.readFileSync('./appconfig.json'));
const testConfiguration = JSON.parse(fs.readFileSync('./testconfig.json'));
const utilities = require('./utils/utilities');

orm.startOrm(__dirname, appConfiguration, testConfiguration, onServerStarted);

function onServerStarted(server, logger) {
    logger.logInfo("ClinicalHelper server started");

    server.post('/*/panel/access', async function (req, res) {
        try {
            let repo = orm.getRepository("PanelAccess");
            let inparams = req.body;
            let sql = "select panelId, allowView, allowCreate, allowUpdate, allowDelete "
                + "from PanelAccess "
                + "where roleId in (select roleId from RoleUser where practiceId = ? and userId = ?) and panelId in "
                + utilities.buildInBindList(inparams.panelIds.length)
                + " order by panelId";
            let params = [];
            params.push(inparams.practiceId);
            params.push(inparams.userId);
            for (let i = 0; i < inparams.panelIds.length; ++i ) {
                params.push(inparams.panelIds[i]);
            }

            let result = orm.parseOrmResult(await repo.executeSqlQuery(sql, params,{poolAlias: orm.util.getContextFromUrl(req)}), "PanelAccessCheckException");

            let retval = {};

            for (let i = 0; i < result.length; ++i) {
                let info = result[i];

                let access = retval[info[0]];
                if (!access) {
                    access = {
                        panelId: info[0],
                        allowView: false,
                        allowCreate: false,
                        allowUpdate: false,
                        allowDelete: false
                    };

                    retval[info[0]] = access;
                }

                if (info[1]) {
                    access.allowView = true;


```
For a real-world implementation see the <a href="https://www.npmjs.com/package/@clinicalhelper/clinicalhelper" target="_blank">Clinical Helper</a> mental health practice management application on NPM. 
For a quick tour of the Clinical Helper application click <a href="https://github.com/clinicalhelper/clinicalhelperclient/blob/master/public/docs/quicktour.pdf" target="_blank">here</a>.
For detailed information on simplenodeorm see <a href="https://github.com/simplenodeorm/simplenodeorm/blob/master/simplenodeorm.pdf" target="_blank">simplenodeorm.pdf</a>

There are 2 associated applications to create, save and run queries and reports. These can be found on NPM and in github at the links below:

<a href="https://www.npmjs.com/package/@simplenodeorm/simplenodedesigner" target="_blank">Query Designer - NPM</a><br />
<a href="https://github.com/simplenodeorm/simplenodedesigner" target="_blank">Query Designer - GitHub</a><br />
<a href="https://github.com/simplenodeorm/simplenodedesigner/blob/master/public/docs/qdesigner-full.pdf" target="_blank">Query Designer - Documentation</a><br /><br />

<a href="https://www.npmjs.com/package/@simplenodeorm/simplenodereport" target="_blank">Report Designer - NPM</a><br />
<a href="https://github.com/simplenodeorm/simplenodereport" target="_blank">Report Designer - GitHub</a><br />
<a href="https://github.com/simplenodeorm/simplenodereport/blob/master/public/docs/rdesigner-full.pdf" target="_blank">Report Designer - Documentation</a>

