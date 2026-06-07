# Migrating to v2

v2.0.0 modernized the library and fixed several long-standing parsing bugs. Most code upgrades with no changes — but read the breaking changes below.

## Breaking changes

### Node.js ≥ 18 required

v2 requires Node 18+ and is tested on Node 20, 22, and 24. (v1 supported older Node versions via the `joi` dependency, which is gone — v2 has **zero runtime dependencies**.)

### Typed errors instead of plain `Error`

Parsing and validation failures now throw `ParseError` / `ValidationError` / `ProtocolError` (all extending `ConnectionError`, which extends `Error`).

- `catch (e)` blocks that treat everything as `Error` keep working — `instanceof Error` is still `true`
- Code matching on **message text** should switch to the stable `code` property — see [Error Handling](/guide/errors)

### `username()` / `password()` getters return decoded values

v1 stored setter-provided credentials URI-encoded; v2 stores everything **decoded** and encodes only in `toUrl()`:

```js
const conn = new Connection('http://example.com').password('p@ss')

// v1: conn.password() === 'p%40ss'   conn.toKnex().password === 'p%40ss' (bug!)
// v2: conn.password() === 'p@ss'     conn.toKnex().password === 'p@ss'
```

If you were decoding exporter output yourself to work around the v1 behavior, remove that workaround.

### `toUrl()` URI-encodes credentials

```js
new Connection('postgres://user:p%40ss@db/app').toUrl()
// v1: 'postgres://user:p@ss@db/app'   (invalid URL — re-parsing fails)
// v2: 'postgres://user:p%40ss@db/app' (round-trips)
```

### Multi-host connections serialize all hosts

`toUrl()` on a connection with multiple hosts (parsed from a comma-separated URL, or built via `addHost`/`setHosts`/`withHosts`) now emits every host:

```js
const conn = new Connection('mongodb://db1/app').addHost('db2', 27018)
// v1: conn.toUrl() === 'mongodb://db1/app'              (hosts dropped)
// v2: conn.toUrl() === 'mongodb://db1:27017,db2:27018/app'
```

## Fixes you get automatically

- **`clone()` and every `with*` method** no longer throw for passwords containing `@`, `:`, `/`, or `#`
- **`toJSON()` masking** is structural — a password that's a substring of the hostname no longer corrupts the masked URL; sensitive query params (`token`, `secret`, …) are masked too
- **Multi-host URLs** (`mongodb://h1,h2,h3/db`) parse into `connection.hosts` instead of silently dropping hosts
- **Literal `@` in passwords** parses correctly (last-`@` delimiting)
- **Explicit port `0`** is honored instead of being replaced by the protocol default
- **Object input is never mutated** by the constructor

## New in v2

- Fluent **builder**: `Connection.builder()...build()` — [guide](/guide/building)
- **Immutable API**: `withPort`, `withHostname`, `withPath`, `withProtocol`, `withParam`, `withFragment`, `withHosts`, `withAuth`
- **Statics**: `Connection.from`, `Connection.parse`, `Connection.isValid`, `Connection.fromEnv`, `Connection.tryFromEnv`
- **Exporters**: `toSequelize`, `toTypeORM`, `toPrisma`, `toMongo`, `toRedis` — [guide](/guide/exporters)
- **Params/fragment/hosts** accessors: `getParam`, `setParam`, `hasParam`, `deleteParam`, `getParams`, `getFragment`, `setFragment`, `hasFragment`, `getHosts`, `addHost`, `setHosts`, `isReplicaSet`
- **Comparison**: `equals`, `isSimilar`
- **TypeScript definitions** (`index.d.ts`) shipped in the package
- Releases published with **npm provenance** via OIDC trusted publishing

## Checklist

1. Ensure Node ≥ 18 (CI tests on 20/22/24)
2. Replace error-message matching with `err.code` / `instanceof` checks
3. Remove any manual `decodeURIComponent` on exporter output
4. If you relied on multi-host URLs serializing only the primary host, update expectations
5. `npm install parse-connection-url@^2`
