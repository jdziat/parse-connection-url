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
  'auth': { 'username': 'root', 'password': '{enc3}0be3c7edcbbc24dd9083fcd47249a8c238de94aced171b54202f3a0db9ffe0af1318e6bdbda986fbe932b6be8d8ea8a5a10099887e091e41fc46cf6b522528509e525f4edf2e36e5172eb6f759dc3b387f8835985e1370cdfdc004d54fd92505aadd03e9f1a6c6d3e5aca78c4c77ac4e9d151302aca7926b13628afc1ec58df28e4f6d430a198944e7146faf969ba869' }
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
