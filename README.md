Simple ORM framework for Node.js that supports MySQL and Oracle.

Documentation:
http://simplenodeorm.org/wp-content/uploads/2019/03/simplenodeorm.pdf

Source:
https://github.com/rbtucker/simplenodeorm

Demo:
http://simplenodeorm.org

Requirements:
1. ensure node.js 10.5 or above installed
2. install - npm i @simplenodeorm/simplenodeorm
3. if using oracle, ensure node-oracledb 2.2 and oracle client are installed and setup correctly 
   - https://github.com/oracle/node-oracledb/blob/master/INSTALL.md
5. create database pool json for db connections
6. make sure you specify dbtype in pool configuration - supported options['oracle', 'mysql']
7. modify appconfig.json as required


