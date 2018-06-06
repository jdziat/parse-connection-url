'use strict'
const Connector = require('./index.js')
const utilityFunctions = require('./util.js')
const httpsUrl = 'http://admin:admin@localhost:8443/some/path'
const knexPostgresString = 'postgres://admin:admin@localhost:5432/generic_database'
const solrString = 'https://root:admin@solrserver:5432/superman'
const zooObject = { password: 'somethingsomething',
  url: 'http://solr:8983/solr',
  username: 'solr' }
const sqldb = { jdbcUrl: 'jdbc:postgresql://postgres:5432/seal',
  password: 'somethingsomething',
  username: 'postgres' }

console.log(utilityFunctions.determineUrlType('http://admin:admin@localhost:8443/some/path?temp=sdfagdsf'))
console.log(utilityFunctions.determineUrlType('ftp://postgres/seal'))
console.log(utilityFunctions.determineUrlType('sftp://postgres:5432/seal'))
console.log(utilityFunctions.determineUrlType('ftps://postgres:5432/seal'))
console.log(utilityFunctions.determineUrlType('jdbc:postgresql://postgres:5432/seal'))
console.log(utilityFunctions.determineUrlType('postgresql://postgres:5432/seal'))
console.log(utilityFunctions.hasCredentials('postgresql://postgres:5432/seal'))
console.log(utilityFunctions.hasCredentials('https://root:admin@solrserver:5432/superman'))
const con = new Connector(httpsUrl, {secureConnectionProtocols: []})
const conPg = new Connector(knexPostgresString, {secureConnectionProtocols: []})
const conSolr = new Connector(solrString)
const connZoo = new Connector(zooObject)
const connSql = new Connector(sqldb)
console.log(connSql)
console.log(zooObject)
console.log(connZoo)
console.log(httpsUrl)
console.log(con.toUrl())
console.log(con)
console.log(JSON.stringify(con))
console.log(conPg.toUrl())
console.log(conPg.toKnexConnection())
console.log(conSolr.toUrl())
console.log(conSolr.toSolrConnection())
