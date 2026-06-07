# Connection

The class exported by the package.

```js
const Connection = require('parse-connection-url')
```

## Constructor

```ts
new Connection(urlOrObject: string | ConnectionInput, options?: ConnectionOptions)
```

Parses a URL string or configuration object. See [Parsing Connections](/guide/parsing) for accepted inputs and [Types](/api/types) for `ConnectionInput`.

- `options.secureConnectionProtocols?: string[]` — protocols treated as secure (replaces the [default list](/guide/parsing#secure-protocols))

**Throws** `TypeError` for `null`/`undefined`/non-string-non-object input, [`ParseError`](/api/errors) for malformed URLs, [`ValidationError`](/api/errors) for invalid hostnames/ports.

## Properties

| Property | Type | Description |
| --- | --- | --- |
| `connection` | [`ConnectionSchema`](/api/types#connectionschema) | protocol, hostname, port, path, params, fragment, hosts, secure, type, prefix, ipVersion |
| `auth` | [`AuthSchema`](/api/types#authschema) | `username`, `password` — stored **decoded** |

## Static methods

### `Connection.builder()`

Returns a new [`ConnectionBuilder`](/api/connection-builder).

### `Connection.from(urlOrObject, options?)`

Alias for `new Connection(...)`.

### `Connection.parse(urlOrObject, options?)`

Parses and returns a **plain object** (merged `auth` + `connection`) instead of a class instance.

### `Connection.isValid(urlOrObject, options?)`

`true` if the input parses without throwing.

### `Connection.fromEnv(key, options?)`

Parses the URL in environment variable `key`. **Throws** `ConnectionError` (code `ENV_NOT_DEFINED`) when unset.

### `Connection.tryFromEnv(key, options?)`

Like `fromEnv`, but returns `null` when the variable is unset or invalid.

### Error classes

`Connection.ConnectionError`, `Connection.ValidationError`, `Connection.ParseError`, `Connection.ProtocolError` — see [Errors](/api/errors).

## Serialization

### `toUrl()` → `string`

Canonical URL. Credentials URI-encoded; default ports omitted; multi-host lists fully serialized. See [normalization rules](/guide/parsing#normalization-on-serialization).

### `toString()` → `string`

Alias for `toUrl()`.

### `toJSON()` → `JSONOutput`

Logging-safe representation: password and sensitive query params masked with `***`. Called automatically by `JSON.stringify`. See [Security](/guide/security).

### `toObject()` → `AuthSchema & ConnectionSchema`

Merged plain object with **real** (unmasked) values.

## Exporters

See the [exporters guide](/guide/exporters) for examples.

| Method | Returns | Throws |
| --- | --- | --- |
| `toKnexConnection()` / `toKnex()` | `KnexConnection` | — |
| `toSequelize()` | `SequelizeConfig` | — |
| `toTypeORM()` | `TypeORMConfig` | — |
| `toPrisma()` | `string` (URL) | — |
| `toMongo()` | `MongoOptions` | — |
| `toRedis()` | `RedisOptions` | — |
| `toSolrConnection()` / `toSolr()` | `SolrConnection` | `ProtocolError` unless http/https |
| `toHttpUrl()` | `string` (URL) | `ProtocolError` unless http/https |
| `toStandardConnection()` | `StandardConnection` | — |

## Credentials

### `hasAuth()` / `hasUsername()` / `hasPassword()` → `boolean`

`hasAuth()` is true when either a username or a password is present.

### `getAuthString()` → `string`

URI-encoded `username:password`, or `''` when no auth.

### `username(value?)` / `password(value?)`

Getter when called without arguments (returns the **decoded** value, `''` when unset); setter returning `this` when passed a string. **Throws** `ValidationError` for non-string arguments.

```js
conn.username('admin').password('p@ss')  // chainable
conn.password()                          // 'p@ss'
```

## Query parameters

| Method | Description |
| --- | --- |
| `getParam(key)` | value or `undefined` |
| `setParam(key, value)` | sets (stringified); returns `this` |
| `hasParam(key)` | own-property check |
| `deleteParam(key)` | removes; returns `this` |
| `getParams()` | shallow copy of all params |

## Fragment

| Method | Description |
| --- | --- |
| `getFragment()` | fragment or `''` |
| `setFragment(value)` | sets (without `#`); returns `this` |
| `hasFragment()` | `boolean` |

## Hosts (replica sets)

| Method | Description |
| --- | --- |
| `getHosts()` | all hosts; falls back to `[{ hostname, port }]` of the primary |
| `addHost(hostname, port?)` | appends (primary is added first automatically); returns `this` |
| `setHosts(hosts)` | replaces all hosts; primary hostname/port follow the first entry |
| `isReplicaSet()` | `true` when more than one host is configured |

See [multi-host parsing](/guide/parsing#multi-host-replica-set-urls).

## Copying & immutable updates

### `clone()` → `Connection`

Structural deep copy preserving **all** properties, including ones that don't serialize to a URL (`type`, `prefix`, `ipVersion`, `secure`, `hosts`).

### `with*` methods → `Connection`

Each clones, applies one change, and returns the copy:

`withAuth(username?, password?)` · `withPort(port)` · `withHostname(hostname)` · `withPath(path)` · `withProtocol(protocol)` · `withParam(key, value)` · `withFragment(fragment)` · `withHosts(hosts)`

`withPort` **throws** `ValidationError` outside 0–65535. `withAuth` leaves omitted (`undefined`) arguments unchanged. See [Building & Modifying](/guide/building).

## Comparison

### `equals(other)` → `boolean`

`true` when both are `Connection` instances with identical canonical URLs.

### `isSimilar(other)` → `boolean`

`true` when protocol, hostname, and port match (path/params/auth ignored).
