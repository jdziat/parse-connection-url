'use strict'
const Connector = require('./index.js')
const Util = require('./util.js')
// const utilityFunctions = require('./util.js')
// const httpsUrl = 'http://admin:admin@localhost:8443/some/path'
// const knexPostgresString = 'postgres://admin:admin@localhost:5432/generic_database'
// const solrString = 'https://root:admin@solrserver:5432/superman'
// const zooObject = { password: 'somethingsomething',
//   url: 'http://solr:8983/solr',
//   username: 'solr' }
// const sqldb = { jdbcUrl: 'jdbc:postgresql://postgres:5432/blast',
//   password: 'somethingsomething',
//   username: 'postgres' }
// const connectionUrl = 'jdbc:mssql://admin:admin@somethingelse:5432/dreadnaught'

const conn = new Connector('http://localhost')
console.log(JSON.stringify(conn))
console.log(JSON.stringify(Util.parseObject({
  'secure': false,
  'protocol': 'postgres',
  'port': 5432,
  'path': '/generic_database',
  'hostname': 'localhost',
  'username': 'postgres',
  'password': 'root'
})))
