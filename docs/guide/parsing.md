# Parsing Connections

The `Connection` constructor accepts either a **URL string** or a **configuration object**. Both produce the same unified shape.

## URL strings

```js
new Connection('https://api.example.com/v2')
new Connection('postgres://admin:pw@db.example.com:5433/orders')
new Connection('mongodb+srv://cluster0.example.mongodb.net/app')
new Connection('redis://cache.example.com/2?timeout=5#section')
```

The parser extracts protocol, credentials, hostname, port, path, query parameters, and fragment:

```js
const conn = new Connection('http://u:p@example.com:8080/path?a=1&b=2#frag')

conn.connection.protocol  // 'http'
conn.connection.hostname  // 'example.com'
conn.connection.port      // 8080
conn.connection.path      // '/path'
conn.connection.params    // { a: '1', b: '2' }
conn.connection.fragment  // 'frag'
conn.auth                 // { username: 'u', password: 'p' }
```

### Special characters in credentials

Percent-encoded credentials are decoded on parse and re-encoded on serialization, so round-trips are lossless:

```js
const conn = new Connection('postgres://user:p%40ss@db.example.com/app')
conn.auth.password  // 'p@ss'  (decoded)
conn.toUrl()        // 'postgres://user:p%40ss@db.example.com/app'
```

A literal `@` in the password also parses correctly — the **last** `@` before the path delimits the credentials:

```js
new Connection('http://user:p@ss@example.com').auth.password // 'p@ss'
```

### Secure protocols

`connection.secure` is set to `true` when the protocol is in the secure list. The defaults are:

`ftps`, `sftp`, `https`, `ldaps`, `mongodb+srv`, `rediss`, `wss`, `amqps`, `mqtts`, `imaps`, `smtps`, `pop3s`

You can supply your own list:

```js
const conn = new Connection('foo://example.com', {
  secureConnectionProtocols: ['foo']
})
conn.connection.secure // true
```

### Multi-host / replica set URLs

Comma-separated host lists (MongoDB replica sets, Redis clusters, etc.) parse into `connection.hosts`:

```js
const conn = new Connection('mongodb://db1:27017,db2:27018,db3:27019/app?replicaSet=rs0')

conn.getHosts()
// [ { hostname: 'db1', port: 27017 },
//   { hostname: 'db2', port: 27018 },
//   { hostname: 'db3', port: 27019 } ]

conn.isReplicaSet()       // true
conn.connection.hostname  // 'db1' (primary)
conn.toUrl()              // 'mongodb://db1:27017,db2:27018,db3:27019/app?replicaSet=rs0'
```

Hosts without an explicit port get the protocol default. When multiple hosts are serialized, every known port is emitted explicitly.

### IPv6 addresses

Bracketed IPv6 hosts work in single- and multi-host URLs:

```js
const conn = new Connection('redis://[::1]:6380/0')
conn.connection.hostname  // '::1'
conn.connection.ipVersion // 6
conn.toUrl()              // 'redis://[::1]:6380/0'
```

### jdbc / odbc connection strings

Prefixed connection strings keep the prefix and parse the inner URL:

```js
const conn = new Connection('jdbc:postgres://db.example.com:5432/app')
conn.connection.prefix    // 'jdbc'
conn.connection.protocol  // 'postgres'
```

::: warning
`toUrl()` serializes the inner URL without the `jdbc:`/`odbc:` prefix. The prefix is preserved on the object (and through `clone()`), but not re-emitted.
:::

## Configuration objects

Field aliases let you pass whatever your existing config uses:

| Unified field | Accepted aliases |
| --- | --- |
| `hostname` | `hostname`, `host` |
| `path` | `path`, `database` |
| `username` | `username`, `user`, `principal` |
| `password` | `password`, `pass` |
| embedded URL | `url`, `uri`, `jdbcUrl`, `jdbcurl` |

Nested objects and embedded URLs compose — explicit fields win over values parsed from the embedded URL:

```js
const conn = new Connection({
  url: 'postgres://db.example.com/app',
  port: 5433,                  // overrides the URL's (default) port
  auth: { user: 'admin', pass: 'pw' }
})
```

The input object is never mutated.

## Normalization on serialization

`toUrl()` produces a canonical URL:

- Credentials are URI-encoded
- A port equal to the protocol's default is omitted (`http://x:80/` → `http://x/`)
- An explicit port `0` is preserved
- Multi-host lists always emit each host's port

```js
new Connection('redis://cache.example.com:6379/0').toUrl()
// 'redis://cache.example.com/0' — 6379 is the redis default
```

## Validation

Hostnames are validated against hostname, IPv4, and IPv6 grammars; ports must be 0–65535. Invalid input throws a [typed error](/guide/errors):

```js
Connection.isValid('postgres://bad!host/db')  // false — no try/catch needed
new Connection('postgres://bad!host/db')      // throws ValidationError
```
