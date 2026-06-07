# parse-connection-url

[![npm version](https://img.shields.io/npm/v/parse-connection-url.svg)](https://www.npmjs.com/package/parse-connection-url)
[![CI](https://github.com/jdziat/parse-connection-url/actions/workflows/ci.yml/badge.svg)](https://github.com/jdziat/parse-connection-url/actions/workflows/ci.yml)
[![npm provenance](https://img.shields.io/badge/npm-provenance-green)](https://www.npmjs.com/package/parse-connection-url#provenance)
[![Node.js Version](https://img.shields.io/node/v/parse-connection-url.svg)](https://nodejs.org)
[![Zero Dependencies](https://img.shields.io/badge/dependencies-0-brightgreen.svg)](https://www.npmjs.com/package/parse-connection-url)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

One parser for every connection string. Parse URLs and config objects into a unified shape, then export to Knex, Sequelize, TypeORM, Prisma, MongoDB, Redis, and more. **Zero runtime dependencies.**

📚 **[Full documentation →](https://jdziat.github.io/parse-connection-url/)**

## Highlights

- **Parse anything** — URL strings, config objects (with field aliases), `jdbc:`/`odbc:` connection strings, multi-host replica sets, IPv6 hosts, 60+ protocols with default ports
- **Round-trip safe** — credentials stored decoded, URI-encoded only at serialization; `parse → toUrl() → parse` survives special characters
- **Export everywhere** — `toKnex`, `toSequelize`, `toTypeORM`, `toPrisma`, `toMongo`, `toRedis`, `toSolr`, `toHttpUrl`
- **Safe to log** — `toJSON()` masks passwords and sensitive query params (`token`, `secret`, …), so `JSON.stringify(conn)` never leaks
- **Typed errors** — `ParseError` / `ValidationError` / `ProtocolError` with stable `code`s, plus `Connection.isValid()` for try/catch-free checks
- **Builder + immutable API** — `Connection.builder()` and chainable `with*` methods
- **Trustworthy supply chain** — zero dependencies, published with [npm provenance](https://docs.npmjs.com/generating-provenance-statements) via OIDC trusted publishing, tested on Linux/macOS/Windows × Node 20/22/24

## Installation

```sh
npm install parse-connection-url
```

Requires Node.js ≥ 18. TypeScript definitions included.

## Quick start

```js
const Connection = require('parse-connection-url')

const conn = new Connection('postgres://admin:s3cret@db.example.com:5433/orders?ssl=true')

conn.connection
// { protocol: 'postgres', hostname: 'db.example.com', port: 5433,
//   path: '/orders', params: { ssl: 'true' }, secure: false, ... }
conn.auth
// { username: 'admin', password: 's3cret' }

conn.toUrl()
// 'postgres://admin:s3cret@db.example.com:5433/orders?ssl=true'
```

### Straight to your driver or ORM

```js
const knex = require('knex')({ client: 'pg', connection: conn.toKnexConnection() })
const sequelize = new Sequelize(conn.toSequelize())
const dataSource = new DataSource({ ...conn.toTypeORM(), entities: [] })
const redis = createClient(new Connection(process.env.REDIS_URL).toRedis())
```

### Config objects, env vars, validation

```js
// Objects with common aliases (host/hostname, user/username, database/path, ...)
new Connection({ protocol: 'mysql', host: 'db', user: 'app', pass: 'pw', database: 'shop' })

// Environment variables
const conn = Connection.fromEnv('DATABASE_URL')        // throws if unset
const maybe = Connection.tryFromEnv('DATABASE_URL')    // null if unset

// Validation without try/catch
Connection.isValid('not a url') // false
```

### Multi-host / replica sets

```js
const rs = new Connection('mongodb://db1:27017,db2:27018,db3:27019/app?replicaSet=rs0')
rs.getHosts()      // [{ hostname: 'db1', port: 27017 }, ...]
rs.isReplicaSet()  // true
rs.toUrl()         // round-trips all hosts
```

### Builder and immutable updates

```js
const conn = Connection.builder()
  .protocol('postgres').host('db.example.com').database('orders')
  .user('admin').password('s3cret')
  .build()

const replica = conn.withHostname('replica.example.com').withParam('readonly', 'true')
// conn is unchanged — every with* method returns a new Connection
```

### Safe logging

```js
JSON.stringify(conn)
// password and sensitive query params masked with '***'

conn.toUrl() // ⚠️ real credentials — don't log this
```

### Typed errors

```js
try {
  new Connection(userInput)
} catch (err) {
  if (err instanceof Connection.ParseError) {
    // err.code === 'PARSE_ERROR', err.details.url
  }
}
```

## Documentation

| | |
| --- | --- |
| [Getting started](https://jdziat.github.io/parse-connection-url/guide/getting-started) | install, first parse, quick API tour |
| [Parsing](https://jdziat.github.io/parse-connection-url/guide/parsing) | URLs, objects, multi-host, IPv6, jdbc/odbc, normalization |
| [Exporters](https://jdziat.github.io/parse-connection-url/guide/exporters) | Knex, Sequelize, TypeORM, Prisma, Mongo, Redis, Solr recipes |
| [Building & modifying](https://jdziat.github.io/parse-connection-url/guide/building) | builder, `with*`, params, fragments, hosts |
| [Security & logging](https://jdziat.github.io/parse-connection-url/guide/security) | masking, encoding model, provenance |
| [Error handling](https://jdziat.github.io/parse-connection-url/guide/errors) | the error hierarchy and codes |
| [Migrating to v2](https://jdziat.github.io/parse-connection-url/guide/migration-v2) | breaking changes from 1.x |
| [API reference](https://jdziat.github.io/parse-connection-url/api/connection) | every method and type |

## Support

Please [open an issue](https://github.com/jdziat/parse-connection-url/issues/new). Security reports: see [SECURITY.md](SECURITY.md).

## Contributing

Contributions welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) — note that commit messages follow [Conventional Commits](https://www.conventionalcommits.org) (enforced by commitlint) and releases are fully automated with semantic-release.

## License

[MIT](LICENSE) © Jordan Dziat
