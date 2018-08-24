Simple ORM framework for Node.js that has been tested on Oracle 
but can support other databases with some minor changes. See included
simplenodeorm.pdf for implementation and design details.

1. ensure node.js 10.5 or above installed
2. install - npm install simplenodeorm
3. if using oracle ensure oracle client setup correctly 
   - https://github.com/oracle/node-oracledb/blob/master/INSTALL.md
4. create database pool json for db connections
5. modify appconfig.json as required
6. see code under examples directory for example model, 
   metadata and repository objects and database configuration json 
7. add model, repository and metadata objects as described in included 
   simplenodeorm.pdf
8. for testing add model, repository and metadata tests as described in 
   included simplenodeorm.pdf


