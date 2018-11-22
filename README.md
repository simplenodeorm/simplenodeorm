Simple Oracle ORM framework for Node.js.

Documentation:
http://simplenodeorm.org/wp-content/uploads/2018/09/simplenodeorm.pdf

Source:
https://github.com/rbtucker/simplenodeorm

Demo:
http://35.227.159.75/

Database with Demo Data:
docker run -d -p 8080:8080 -p 1521:1521 rbtucker16/hrdemo

Requirements:
1. ensure node.js 10.5 or above installed
2. install - npm i @simplenodeorm/simplenodeorm
3. ensure node-oracledb 2.2 installed
4. ensure oracle client is installed and setup correctly 
   - https://github.com/oracle/node-oracledb/blob/master/INSTALL.md
5. create database pool json for db connections
6. modify appconfig.json as required


