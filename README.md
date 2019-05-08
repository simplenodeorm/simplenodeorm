Simple ORM framework for Node.js that supports MySQL, Oracle and PostgreSQL.

Source:
https://github.com/simplnodeorm/simplenodeorm.git

Website (demo and documentation):
http://simplenodeorm.org

Requirements:
1. ensure node.js 10.5 or above installed
2. install - npm i @simplenodeorm/simplenodeorm
3. if using oracle, ensure node-oracledb 2.2 and oracle client are installed and setup correctly 
   - https://github.com/oracle/node-oracledb/blob/master/INSTALL.md
5. create database pool json for db connections
6. make sure you specify dbtype in pool configuration - supported options['oracle', 'mysql', 'postgres']
7. modify appconfig.json as required


