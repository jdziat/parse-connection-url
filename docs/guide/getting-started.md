# Getting Started

`parse-connection-url` parses connection strings and configuration objects into a single, unified shape — and converts that shape into the formats your drivers and ORMs expect.

## Installation

```sh
npm install parse-connection-url
```

Requires Node.js 18 or newer (tested on 20, 22, and 24). The package has **zero runtime dependencies** and ships with TypeScript definitions.

## Your first connection

```js
const Connection = require('parse-connection-url')

const conn = new Connection('postgres://admin:s3cret@db.example.com:5433/orders')

conn.connection.protocol  // 'postgres'
conn.connection.hostname  // 'db.example.com'
conn.connection.port      // 5433
conn.connection.path      // '/orders'
conn.connection.secure    // false
conn.auth.username        // 'admin'
conn.auth.password        // 's3cret'
```

Every connection — no matter how it was created — has the same two properties:

- **`connection`** — protocol, hostname, port, path, query params, fragment, hosts, secure flag
- **`auth`** — username and password (stored decoded; see [Security](/guide/security))

## From a config object

Objects with common field aliases parse to the same shape:

```js
const conn = new Connection({
  protocol: 'postgres',
  host: 'db.example.com',   // or hostname
  port: 5433,
  database: 'orders',       // or path
  user: 'admin',            // or username / principal
  pass: 's3cret'            // or password
})
```

Nested `connection`/`auth` objects and embedded URLs (`url`, `uri`, `jdbcUrl`) work too — see [Parsing Connections](/guide/parsing).

## From an environment variable

```js
// Throws ConnectionError (code ENV_NOT_DEFINED) if DATABASE_URL is unset
const conn = Connection.fromEnv('DATABASE_URL')

// Returns null instead of throwing
const maybe = Connection.tryFromEnv('DATABASE_URL')
```

## Straight to your driver

```js
const knex = require('knex')({
  client: 'pg',
  connection: new Connection(process.env.DATABASE_URL).toKnexConnection()
})
```

Exporters exist for Knex, Sequelize, TypeORM, Prisma, MongoDB, Redis, Solr, and plain HTTP — see [Driver & ORM Exporters](/guide/exporters).

## Default ports for 60+ protocols

When a URL omits the port, the well-known default for its protocol is filled in automatically:

```js
new Connection('redis://cache.example.com').connection.port    // 6379
new Connection('mongodb://db.example.com').connection.port     // 27017
new Connection('amqp://mq.example.com').connection.port        // 5672
```

Covered protocols include HTTP(S), WebSockets, FTP/SFTP, PostgreSQL, MySQL/MariaDB, MSSQL, CockroachDB, MongoDB, Redis, Cassandra, CouchDB, Neo4j, Elasticsearch, OpenSearch, Solr, AMQP/RabbitMQ, Kafka, NATS, MQTT, Memcached, InfluxDB, ClickHouse, LDAP, SSH, SMTP/IMAP/POP3, gRPC, etcd, Consul, ZooKeeper, Vault, and more.

## Quick API tour

```js
const conn = new Connection('rediss://user:pw@cache.example.com/2?timeout=5')

conn.toUrl()           // round-trip back to a URL string
conn.toRedis()         // { host, port, db: 2, username, password, tls: {} }
conn.connection.secure // true — rediss is a secure protocol
conn.getParam('timeout') // '5'

conn.withPort(6380)    // a NEW Connection with the port changed
conn.clone()           // deep copy
conn.toJSON()          // password masked with '***' — safe to log

Connection.isValid('not a url')          // false
Connection.parse('http://example.com')   // plain object, no class instance
Connection.builder()                     // fluent builder
```

Next: [Parsing Connections](/guide/parsing) for everything the parser understands.
