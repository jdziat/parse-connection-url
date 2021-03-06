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
const con = new Connector({
  'connection': {
    'prefix': '', 'hostname': 'sealws', 'port': 8081, 'path': '/seal-ws', 'secure': false, 'type': 'http', 'protocol': 'http'
  },
  'auth': { 'username': 'root', 'password': 'test' }
})
console.log(con)
// console.log(JSON.stringify(Util.parseUrl('jdbc:postgresql://postgres:5432/blast')))
// const conn = new Connector('postgres://postgres:root@localhost:5432/generic_database')
// console.log(JSON.stringify(conn.toUrl()))
// console.log(JSON.stringify(conn))
// // console.log(JSON.stringify(Util.parseObject({
// //   'secure': false,
// //   'protocol': 'postgres',
// //   'port': 5432,
// //   'path': '/generic_database',
// //   'hostname': 'localhost',
// //   'username': 'postgres',
// //   'password': 'root'
// // })))

// console.log(JSON.stringify(Util.determineUrlType('postgres://postgres:root@localhost/generic_database')))
