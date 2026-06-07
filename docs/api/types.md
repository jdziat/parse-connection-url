# Types & Schemas

Shipped in `index.d.ts`. In TypeScript, the namespace types hang off the default export:

```ts
import Connection = require('parse-connection-url')

const conn: Connection = new Connection(process.env.DATABASE_URL!)
const hosts: Connection.Host[] = conn.getHosts()
const knex: Connection.KnexConnection = conn.toKnexConnection()
```

## ConnectionSchema {#connectionschema}

The shape of `conn.connection`:

| Field | Type | Notes |
| --- | --- | --- |
| `protocol` | `string` | e.g. `'postgres'` |
| `hostname` | `string` | primary host |
| `port` | `number` | explicit or protocol default; `0` is honored |
| `path` | `string` | leading `/` |
| `secure` | `boolean` | from the secure-protocols list |
| `params` | `Record<string, string>` | query parameters |
| `fragment` | `string` | hash without `#` |
| `hosts` | [`Host[]`](#host) | populated for multi-host URLs |
| `type` | `string` | parser category: `http`, `sql`, `nosql`, `queue`, `search`, `kv`, `ftp`, `tcp`, `udp`, `connectionString`, `generic` |
| `prefix` | `string` | `'jdbc'` / `'odbc'` for prefixed connection strings |
| `ipVersion` | `4 \| 6` | set when the host is an IP literal |

## AuthSchema {#authschema}

The shape of `conn.auth`. Values are stored **decoded** — see [Security](/guide/security#credential-encoding-model).

| Field | Type |
| --- | --- |
| `username` | `string` |
| `password` | `string` |

## Host {#host}

```ts
interface Host {
  hostname: string
  port: number
}
```

## ConnectionInput

Accepted by the constructor / `Connection.from` / `Connection.parse` — all fields optional, with aliases:

```ts
interface ConnectionInput {
  url?: string; uri?: string; jdbcUrl?: string; jdbcurl?: string
  hostname?: string; host?: string
  port?: number
  protocol?: string
  path?: string; database?: string
  prefix?: string; type?: string
  username?: string; user?: string; principal?: string
  password?: string; pass?: string
  auth?: Partial<AuthSchema> & { user?: string; principal?: string; pass?: string }
  connection?: Partial<ConnectionSchema>
}
```

## ConnectionOptions

```ts
interface ConnectionOptions {
  secureConnectionProtocols?: string[]
}
```

## Exporter return types

| Type | Returned by | Shape |
| --- | --- | --- |
| `KnexConnection` | `toKnexConnection()` | `{ host, user, password, port, database }` |
| `SequelizeConfig` | `toSequelize()` | `{ dialect, host, port, database, username, password, dialectOptions? }` |
| `TypeORMConfig` | `toTypeORM()` | `{ type, host, port, database, username, password, extra? }` |
| `MongoOptions` | `toMongo()` | `{ authSource, replicaSet?, ssl, auth?, ...params }` |
| `RedisOptions` | `toRedis()` | `{ host, port, db, password?, username?, tls? }` |
| `SolrConnection` | `toSolrConnection()` | `{ host, username, password, port, bigint, secure, path }` |
| `StandardConnection` | `toStandardConnection()` | `{ url, username, password }` |
| `JSONOutput` | `toJSON()` | `{ url, connection, auth }` — masked |
