# Errors

All error classes are attached to the `Connection` export:

```js
const Connection = require('parse-connection-url')
const { ConnectionError, ValidationError, ParseError, ProtocolError } = Connection
```

Usage patterns: [Error Handling guide](/guide/errors).

## ConnectionError

Base class — `extends Error`.

```ts
class ConnectionError extends Error {
  code: string                  // stable machine-readable code
  details: Record<string, any>  // structured context
}
```

Thrown directly by `Connection.fromEnv()` with code `ENV_NOT_DEFINED` and `details: { key }`.

## ValidationError

`extends ConnectionError` — invalid field values.

| Property | Value |
| --- | --- |
| `code` | `'VALIDATION_ERROR'` |
| `details.field` | the failing field (e.g. `'hostname'`, `'port'`, `'password'`) |
| `details.value` | the rejected value |

Thrown by: hostname validation during parsing, `withPort()`, builder `.port()`, and `username()`/`password()` setters given non-strings.

## ParseError

`extends ConnectionError` — unparseable input.

| Property | Value |
| --- | --- |
| `code` | `'PARSE_ERROR'` |
| `details.url` | the input that failed |

Thrown by: URLs without `://`, unrecognized URL types, unterminated IPv6 brackets in host lists.

## ProtocolError

`extends ConnectionError` — wrong protocol for an operation.

| Property | Value |
| --- | --- |
| `code` | `'PROTOCOL_ERROR'` |
| `details.protocol` | the actual protocol |
| `details.expected` | allowed protocols (e.g. `['http', 'https']`) |

Thrown by: `toHttpUrl()` and `toSolrConnection()` on non-HTTP connections.
