# Driver & ORM Exporters

Parse once, export to whatever your stack needs. All exporters return **decoded (raw) credentials** — exactly what drivers expect.

| Method | Returns | For |
| --- | --- | --- |
| [`toKnexConnection()`](#knex) / `toKnex()` | object | [Knex.js](https://knexjs.org) |
| [`toSequelize()`](#sequelize) | object | [Sequelize](https://sequelize.org) |
| [`toTypeORM()`](#typeorm) | object | [TypeORM](https://typeorm.io) |
| [`toPrisma()`](#prisma) | URL string | [Prisma](https://www.prisma.io) |
| [`toMongo()`](#mongodb) | options object | MongoDB native driver |
| [`toRedis()`](#redis) | options object | node-redis / ioredis |
| [`toSolrConnection()`](#solr) / `toSolr()` | object | solr-client |
| [`toHttpUrl()`](#http) | URL string | HTTP clients |
| [`toStandardConnection()`](#standard) | `{ url, username, password }` | generic clients |
| `toObject()` | merged plain object | your own code |

## Knex {#knex}

```js
const conn = new Connection('postgres://admin:pw@db.example.com:5433/orders')

require('knex')({
  client: 'pg',
  connection: conn.toKnexConnection()
  // { host: 'db.example.com', user: 'admin', password: 'pw',
  //   port: 5433, database: 'orders' }
})
```

## Sequelize {#sequelize}

Protocol maps to dialect (`postgres`/`postgresql` → `postgres`, `mysql`, `mariadb`, `mssql`, `sqlite`). Query parameters become `dialectOptions`:

```js
const conn = new Connection('postgres://admin:pw@db.example.com/orders?ssl=true')

new Sequelize(conn.toSequelize())
// { dialect: 'postgres', host: 'db.example.com', port: 5432,
//   database: 'orders', username: 'admin', password: 'pw',
//   dialectOptions: { ssl: 'true' } }
```

## TypeORM {#typeorm}

Same protocol mapping (plus `mongodb`); query parameters become `extra`:

```js
const conn = new Connection('mysql://app:pw@db.example.com/shop')

new DataSource({ ...conn.toTypeORM(), entities: [/* ... */] })
// { type: 'mysql', host: 'db.example.com', port: 3306,
//   database: 'shop', username: 'app', password: 'pw' }
```

## Prisma {#prisma}

Prisma consumes URLs directly — `toPrisma()` returns the canonical URL string (alias for `toUrl()`):

```js
process.env.DATABASE_URL = conn.toPrisma()
```

## MongoDB {#mongodb}

Builds a native-driver options object. `authSource` comes from the query param, then the database path, then `'admin'`; `ssl` reflects the secure flag or `ssl`/`tls` params; remaining query params are copied through (with prototype-pollution protection):

```js
const conn = new Connection('mongodb://app:pw@db1:27017,db2:27018/orders?replicaSet=rs0')

conn.toMongo()
// { authSource: 'orders', replicaSet: 'rs0', ssl: false,
//   auth: { username: 'app', password: 'pw' } }
```

::: tip
For the connection string itself (e.g. `MongoClient(url)`), use `toUrl()` — multi-host lists round-trip correctly.
:::

## Redis {#redis}

The path becomes the database number; `rediss://` or a secure flag adds `tls: {}`:

```js
new Connection('rediss://default:pw@cache.example.com/2').toRedis()
// { host: 'cache.example.com', port: 6379, db: 2,
//   password: 'pw', username: 'default', tls: {} }
```

## Solr {#solr}

Requires an `http`/`https` protocol (throws [`ProtocolError`](/api/errors) otherwise). Port defaults to 8983:

```js
new Connection('http://solr.example.com:8983/solr/core1').toSolrConnection()
// { host: 'solr.example.com', username: '', password: '',
//   port: 8983, bigint: true, secure: false, path: '/solr/core1' }
```

## HTTP {#http}

`toHttpUrl()` is `toUrl()` with a guard — it throws [`ProtocolError`](/api/errors) unless the protocol is `http` or `https`:

```js
new Connection('https://api.example.com/v2').toHttpUrl()
// 'https://api.example.com/v2'

new Connection('postgres://db.example.com/app').toHttpUrl()
// throws ProtocolError
```

## Standard {#standard}

A minimal `{ url, username, password }` shape (URL without path/params):

```js
new Connection('http://u:p@example.com:8080/path').toStandardConnection()
// { url: 'http://example.com:8080', username: 'u', password: 'p' }
```

## Writing your own

Everything is on `connection` and `auth` — compose freely:

```js
function toPgPool (conn) {
  return {
    host: conn.connection.hostname,
    port: conn.connection.port,
    database: conn.connection.path.replace(/^\//, ''),
    user: conn.auth.username,
    password: conn.auth.password,
    ssl: conn.connection.secure
  }
}
```
