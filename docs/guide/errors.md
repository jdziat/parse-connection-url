# Error Handling

All library errors extend a common `ConnectionError` base (which extends `Error`), each with a stable `code` and structured `details` for programmatic handling.

## The hierarchy

```
Error
└── ConnectionError        code: string, details: object
    ├── ValidationError    code 'VALIDATION_ERROR'  details: { field, value }
    ├── ParseError         code 'PARSE_ERROR'       details: { url }
    └── ProtocolError      code 'PROTOCOL_ERROR'    details: { protocol, expected }
```

The classes are attached to the export, so no extra imports are needed:

```js
const Connection = require('parse-connection-url')

try {
  const conn = new Connection(input)
} catch (err) {
  if (err instanceof Connection.ParseError) {
    console.error(`Unparseable URL: ${err.details.url}`)
  } else if (err instanceof Connection.ValidationError) {
    console.error(`Bad ${err.details.field}: ${err.details.value}`)
  } else {
    throw err
  }
}
```

## What throws what

| Situation | Throws |
| --- | --- |
| `new Connection(null)` / wrong input type | `TypeError` |
| Unrecognized or malformed URL | `ParseError` |
| Invalid hostname or port | `ValidationError` |
| Non-string passed to `username()` / `password()` / `withAuth()` | `ValidationError` |
| `withPort()` / builder `.port()` out of range | `ValidationError` |
| `toHttpUrl()` / `toSolrConnection()` on a non-HTTP protocol | `ProtocolError` |
| `fromEnv()` with an unset variable | `ConnectionError` (code `ENV_NOT_DEFINED`) |

## Validating without try/catch

```js
if (Connection.isValid(userInput)) {
  const conn = new Connection(userInput)
}

// or for environment variables:
const conn = Connection.tryFromEnv('DATABASE_URL') // null when unset/invalid
```

## Matching on codes

Codes are stable across versions — prefer them over message text:

```js
catch (err) {
  switch (err.code) {
    case 'PARSE_ERROR':      /* re-prompt the user */ break
    case 'VALIDATION_ERROR': /* highlight the field */ break
    case 'PROTOCOL_ERROR':   /* wrong kind of URL */ break
    case 'ENV_NOT_DEFINED':  /* missing configuration */ break
  }
}
```

Full class reference: [API → Errors](/api/errors).
