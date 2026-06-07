# Building & Modifying Connections

Three styles: a fluent **builder** for constructing from scratch, **immutable `with*` methods** for derived copies, and **mutable setters** when you want in-place changes.

## The builder

```js
const conn = Connection.builder()
  .protocol('postgres')
  .hostname('db.example.com')   // .host() is an alias
  .port(5433)
  .database('orders')           // .path('/orders') also works
  .username('admin')            // .user() is an alias
  .password('s3cret')
  .param('ssl', 'true')
  .build()

conn.toUrl() // 'postgres://admin:s3cret@db.example.com:5433/orders?ssl=true'
```

Defaults: protocol `http`, hostname `localhost`. `port()` validates 0–65535 and throws `ValidationError` on bad input.

## Immutable `with*` methods

Each returns a **new** `Connection`; the original is untouched. Perfect for deriving per-environment or per-tenant variants:

```js
const base = new Connection('postgres://admin:pw@db.example.com/app')

const replica = base.withHostname('replica.example.com')
const tuned   = base.withParam('statement_timeout', '5000')
const onPort  = base.withPort(5433)
const moved   = base.withPath('/app_test')
const tls     = base.withProtocol('postgres')        // protocol swap
const tagged  = base.withFragment('primary')
const multi   = base.withHosts([
  { hostname: 'db1', port: 5432 },
  { hostname: 'db2', port: 5432 }
])
const reauth  = base.withAuth('reporting', 'other-pw')

base.toUrl()  // unchanged
```

`withAuth` leaves omitted (undefined) arguments alone:

```js
base.withAuth('reporting')          // password kept from base
base.withAuth(undefined, 'new-pw')  // username kept from base
```

They chain, since each returns a `Connection`:

```js
const staging = base
  .withHostname('staging-db.example.com')
  .withPath('/app_staging')
  .withParam('application_name', 'staging')
```

## Cloning

`clone()` is a structural deep copy — it preserves everything, including properties that don't serialize to a URL (`type`, `prefix`, `ipVersion`, `secure`, `hosts`):

```js
const copy = conn.clone()
copy.setParam('x', '1')   // conn is unaffected
```

## Mutable setters

When in-place mutation is what you want:

```js
conn.username('admin')        // getter when called without args
conn.password('s3cret')
conn.setParam('ssl', 'true')  // also: getParam, hasParam, deleteParam, getParams
conn.setFragment('section')   // also: getFragment, hasFragment
conn.addHost('db2', 5433)     // also: setHosts, getHosts, isReplicaSet
```

Setters return `this` for chaining. Values are stored **decoded** — encoding happens automatically in `toUrl()`:

```js
conn.password('p@ss')
conn.auth.password  // 'p@ss'
conn.toUrl()        // '...:p%40ss@...'
```

## Comparing connections

```js
const a = new Connection('http://example.com/x')
const b = new Connection('http://example.com:80/x')

a.equals(b)     // true  — same canonical URL
a.isSimilar(b)  // true  — same protocol + hostname + port

const c = new Connection('http://example.com/other')
a.equals(c)     // false — different path
a.isSimilar(c)  // true  — path is ignored
```
