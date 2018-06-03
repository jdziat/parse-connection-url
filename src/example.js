'use strict'
const Connector = require('./index.js')
const httpsUrl = 'http://admin:admin@localhost:8443/some/path'
const knexPostgresString = 'postgres://admin:admin@localhost:5432/generic_database'
const solrString = 'https://root:admin@solrserver:5432/superman'
const con = new Connector(httpsUrl, {secureConnectionProtocols: []})
const conPg = new Connector(knexPostgresString, {secureConnectionProtocols: []})
const conSolr = new Connector(solrString)

console.log(httpsUrl)
console.log(con.toUrl())
console.log(con)
console.log(JSON.stringify(con))
console.log(conPg.toUrl())
console.log(conPg.toKnexConnection())
console.log(conSolr.toUrl())
console.log(conSolr.toSolrConnection())
const knexPostgresConn = new Connector('postgres://admin:admin@localhost:5432/generic_database')
console.log(knexPostgresConn)
// {
//   connection:
//    { secure: false,
//      protocol: 'http',
//      port: 8443,
//      path: '/some/pathn',
//      hostname: 'localhost' },
//   auth: { username: 'admin', password: 'admin' } }
console.log(knexPostgresConn.toKnexConnection())
// "http://admin:admin@localhost:8443/some/path"
