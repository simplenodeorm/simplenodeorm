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
   server.get('/*/practice/addresses/:practiceId', async function (req, res) {
        try {
            let repo = orm.getRepository("PracticeAddress");
            let whereList = [];
            whereList.push(new WhereComparison('practiceId', req.params.practiceId, orm.util.EQUAL_TO));
            let result = orm.parseOrmResult(await repo.find(whereList, [new OrderByEntry("name")],
                {poolAlias: orm.util.getContextFromUrl(req)}), "PracticeAddressException");

            if (result.length === 0) {
                result = [orm.newModelInstance(repo.getMetaData)];
                result[0].address = orm.newModelInstance(orm.getRepository("Address").getMetaData());
            }
           res.status(200).send(result);
        } catch (e) {
            logger.logError('error occured while retrieving panel access summary', e);
            res.status(500).send(e);
        }
    });

    server.post('/*/officehours/save', async function (req, res) {
        let poolAlias = orm.util.getContextFromUrl(req);
        let conn = await orm.getConnection(poolAlias);
        let options = { conn: conn, poolAlias:  poolAlias};
        let repo = orm.getRepository("OfficeHours");
        try {
            await repo.doBeginTransaction(conn);

            let result = await repo.save(req.body, options);

            if (result.error) {
                orm.util.throwError("SaveOfficeHoursException", result.error);
            }

            await repo.doCommit(conn);
            res.status(200).send(true);
        } catch (e) {
            await repo.doRollback(conn);
            logger.logError('error occured while saving office hours', e);
            res.status(500).send(e);
        }
    });

    server.get('/*/exists/rolename/:practiceId/:checkname', async function (req, res) {
        try {
            let repo = orm.getRepository("Role");
            let sql = "select 1 from Role where exists (select roleId from Role where practiceId = ? and name = ?)";
            let params = [];
            params.push(req.params.practiceId);
            params.push(req.params.checkname);

            let result = orm.parseOrmResult(await repo.executeSqlQuery(sql, params,{poolAlias: orm.util.getContextFromUrl(req)}), "RolenameExistsException");

            if (result && result[0] && result[0][0]) {
                res.status(200).send(result[0][0] === 1);
            } else {
                return res.status(200).send(false);
            }
        } catch (e) {
            logger.logError('error occured while checking rolename exists', e);
            res.status(500).send(e);
        }
    });

```
For a real-world implementation see the <a href="https://www.npmjs.com/package/@clinicalhelper/clinicalhelper" target="_blank">Clinical Helper</a> mental health practice management application on NPM. 
For a quick tour of the Clinical Helper application click <a href="https://github.com/clinicalhelper/clinicalhelperclient/blob/master/public/docs/quicktour.pdf" target="_blank">here</a>.
For detailed information on simplenodeorm see <a href="https://github.com/simplenodeorm/simplenodeorm/blob/master/simplenodeorm.pdf" target="_blank">simplenodeorm.pdf</a>

There is a docker image on dockerhub that contains a running demo of the Clinical Helper as well as the Query and Report Designers. Follow the instuctions
found <a href="https://github.com/clinicalhelper/clinicalhelperdemo/blob/master/README.md" target="_blank">here</a> to run the demo.

There are 2 associated applications to create, save and run queries and reports. These can be found on NPM and in github at the links below:

<a href="https://www.npmjs.com/package/@simplenodeorm/simplenodedesigner" target="_blank">Query Designer - NPM</a><br />
<a href="https://github.com/simplenodeorm/simplenodedesigner" target="_blank">Query Designer - GitHub</a><br />
<a href="https://github.com/simplenodeorm/simplenodedesigner/blob/master/public/docs/qdesigner-full.pdf" target="_blank">Query Designer - Documentation</a><br /><br />

<a href="https://www.npmjs.com/package/@simplenodeorm/simplenodereport" target="_blank">Report Designer - NPM</a><br />
<a href="https://github.com/simplenodeorm/simplenodereport" target="_blank">Report Designer - GitHub</a><br />
<a href="https://github.com/simplenodeorm/simplenodereport/blob/master/public/docs/rdesigner-full.pdf" target="_blank">Report Designer - Documentation</a>

