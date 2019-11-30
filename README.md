Simple ORM framework for Node.js that supports MySQL, Oracle and PostgreSQL.

Source:
https://github.com/simplenodeorm/simplenodeorm.git


Simplenodeorm is a cloud-ready object relational mapping application that provides database access to Oracle, MySQL and PostgreSQL databases
as well as query design and reporting functionality.It is designed to be imported into an existing javascript app to provide database access 
based on configuration files provided by the parent application as in the example code snippet below:


```
const appConfiguration = JSON.parse(fs.readFileSync('./appconfig.json'));
const testConfiguration = JSON.parse(fs.readFileSync('./testconfig.json'));
const utilities = require('./utils/utilities');

orm.startOrm(__dirname, appConfiguration, testConfiguration, onServerStarted);

function onServerStarted(server, logger) {
    logger.logInfo("ClinicalHelper server started");

 server.get('/*/dropdown/content/:module/:practiceId', async function (req, res) {
        try {
            let repo = orm.getRepository(req.params.module);
            let whereList = [];
            let orderByList = [];

            whereList.push(new WhereComparison('practiceId', req.params.practiceId,
 		orm.util.EQUAL_TO));
            whereList.push(new WhereComparison('active', 1, orm.util.EQUAL_TO));
            orderByList.push(new OrderByEntry("name"));

            let result = orm.parseOrmResult(await repo.find(whereList, orderByList, {poolAlias: 
				alias, mySession: session}), "DropdownContentException");

            if (result.error) {
                orm.util.throwError("DropdownContentLoadException", e);
            }
            res.status(200).send(result);
        } catch (e) {
            logger.logError('error occured while retrieving dropdown content for ' 
			+ req.params.module, e);
            res.status(500).send(e);
        }
    });

server.post('/*/save/panelaccess', async function (req, res) {
        let poolAlias = orm.util.getContextFromUrl(req);
        let conn = await orm.getConnection(poolAlias);
        let repo = orm.getRepository("PanelAccess");
        try {
            let options = { conn: conn, poolAlias: poolAlias, returnValues: true};
            repo.doBeginTransaction(conn);
            let accessObjects = [];
            for (let i = 0; i < req.body.length; ++i) {
                let accessInfo = req.body[i];
                let panelAccess = orm.newModelInstance(repo.getMetaData());
                if (accessInfo.__modified__) {
                    panelAccess.__new__ = accessInfo.__new__;
                    panelAccess.__modified__ = accessInfo.__modified__;
                    panelAccess.setPracticeId(Number(accessInfo.practiceId));
                    panelAccess.setRoleId(Number(accessInfo.roleId));
                    panelAccess.setPanelId(Number(accessInfo.panelId));
                    panelAccess.setAllowView(Number(accessInfo.allowView));
                    panelAccess.setAllowCreate(Number(accessInfo.allowCreate));
                    panelAccess.setAllowUpdate(Number(accessInfo.allowUpdate));
                    panelAccess.setAllowDelete(Number(accessInfo.allowDelete));
                    panelAccess.setUpdatedBy(Number(accessInfo.updatedBy));

                    accessObjects.push(panelAccess);
                }
            }

            let result = await repo.save(accessObjects, options);
            if (result.error) {
                await repo.doRollback(conn);
                logger.logError('error occurred while saving panel access', result.error);
                res.status(500).send(result.error);
            } else {
                await repo.doCommit(conn);
                res.status(200).send(true);
            }
        } catch (e) {
            await repo.doRollback(conn);
            logger.logError('error occurred while saving panel access', e);
            res.status(500).send({error: e});
        }

        finally {
            conn.release()
        }
    });
```
For a real-world implementation see npm project <a href="https://www.npmjs.com/package/@clinicalhelper/clinicalhelper">Clinical Helper</a> 
For a quick tour of the Clinical Helper application click <a href="https://github.com/clinical-helper/clinicalhelperclient/blob/master/public/docs/quicktour.pdf">here</a>
For detailed information on simplenodeorm see <a href="https://github.com/simplenodeorm/simplenodeorm/blob/master/simplenodeorm.pdf">simplenodeorm.pdf</a>

There are 2 associated applications to create, save and run queries and reports. These can be found on NPM and in github at the links below:

<a href="https://www.npmjs.com/package/@simplenodeorm/simplenodedesigner">Query Designer - NPM</a><br />
<a href="https://github.com/simplenodeorm/simplenodedesigner">Query Designer - GitHub</a><br />
<a href="https://github.com/simplenodeorm/simplenodedesigner/blob/master/public/docs/qdesigner-full.pdf">Query Designer - Documentation</a><br /><br />

<a href="https://www.npmjs.com/package/@simplenodeorm/simplenodereport">Report Designer - NPM</a><br />
<a href="https://github.com/simplenodeorm/simplenodereport">Report Designer - GitHub</a><br />
<a href="https://github.com/simplenodeorm/simplenodereport/blob/master/public/docs/rdesigner-full.pdf">Report Designer - Documentation</a>

