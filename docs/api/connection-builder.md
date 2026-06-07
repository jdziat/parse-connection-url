# ConnectionBuilder

Fluent builder returned by [`Connection.builder()`](/api/connection#connection-builder). Every method returns the builder; `build()` produces the [`Connection`](/api/connection).

```js
const conn = Connection.builder()
  .protocol('postgres')
  .hostname('db.example.com')
  .port(5433)
  .database('orders')
  .username('admin')
  .password('s3cret')
  .param('ssl', 'true')
  .build()
```

## Defaults

| Field | Default |
| --- | --- |
| protocol | `'http'` |
| hostname | `'localhost'` |
| port | protocol default (resolved at `build()`) |
| path | `''` |
| username / password | `''` |
| secure | `false` |
| params | `{}` |

## Methods

### `protocol(protocol: string)`

Sets the protocol (e.g. `'postgres'`, `'redis'`, `'https'`).

### `hostname(hostname: string)` / `host(host: string)`

Sets the hostname. `host` is an alias.

### `port(port: number)`

Sets the port. **Throws** [`ValidationError`](/api/errors) outside 0–65535.

### `path(path: string)`

Sets the path; a leading `/` is added when missing.

### `database(database: string)`

Alias for `path('/' + database)` — the conventional way to name a database.

### `username(username: string)` / `user(user: string)`

Sets the username. `user` is an alias.

### `password(password: string)`

Sets the password (stored decoded — encoded only in `toUrl()`).

### `secure(secure: boolean)`

Marks the connection secure (independent of protocol).

### `param(key: string, value: string)`

Sets one query parameter (value is stringified).

### `params(params: Record<string, string>)`

Merges multiple query parameters.

### `build()`

Returns the constructed [`Connection`](/api/connection).
