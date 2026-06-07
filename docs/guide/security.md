# Security & Logging

Connection objects carry credentials, so the library is deliberate about where they appear.

## `toJSON()` masks credentials

`JSON.stringify()` calls `toJSON()` automatically — so serialized connections are **safe to log by default**:

```js
const conn = new Connection('postgres://admin:s3cret@db.example.com/app?token=abc123')

JSON.stringify(conn, null, 2)
// {
//   "url": "postgres://admin:***@db.example.com/app?token=***",
//   "connection": { ..., "params": { "token": "***" } },
//   "auth": { "username": "admin", "password": "***" }
// }
```

Masking is **structural** — the URL is rebuilt with `***` in the password slot, never via string replacement, so a password that happens to be a substring of your hostname can't corrupt the output.

Sensitive query parameters are masked by key: `password`, `pass`, `secret`, `token`, `apikey`, `api_key`, `auth`.

## What is NOT masked

These return real credentials — that's their job. Don't log them:

| Method | Contains credentials |
| --- | --- |
| `toUrl()` / `toString()` / `toPrisma()` | yes (URI-encoded) |
| `toObject()` | yes (decoded) |
| All driver exporters (`toKnex`, `toRedis`, …) | yes (decoded) |
| `conn.auth` | yes (decoded) |

```js
logger.info({ db: conn })          // ✅ toJSON() masks
logger.info(`db: ${conn.toUrl()}`) // ❌ leaks the password
```

## Credential encoding model

Credentials are stored **decoded** (raw) and URI-encoded **only** when serialized to a URL:

```js
const conn = new Connection('postgres://user:p%40ss@db.example.com/app')
conn.auth.password          // 'p@ss'     — what the driver needs
conn.toUrl()                // '...p%40ss...' — what the URL needs
conn.toKnex().password      // 'p@ss'     — drivers get raw values
```

This guarantees `parse → toUrl() → parse` round-trips and prevents the classic bug of double-encoded passwords reaching a database driver.

## Prototype-pollution protection

`toMongo()` copies arbitrary query parameters into the options object — `__proto__`, `constructor`, and `prototype` keys are explicitly excluded.

## Environment variables

Prefer `fromEnv`/`tryFromEnv` over hand-passing URLs through your codebase — credentials stay in the environment until the moment they're parsed:

```js
const conn = Connection.fromEnv('DATABASE_URL')
```

## Reporting vulnerabilities

See the repository's [SECURITY.md](https://github.com/jdziat/parse-connection-url/blob/master/SECURITY.md) for the disclosure policy. Releases are published with [npm provenance](https://docs.npmjs.com/generating-provenance-statements) via OIDC trusted publishing — you can verify the package was built from this repository with `npm audit signatures`.
