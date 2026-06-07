## [2.0.0](https://github.com/jdziat/parse-connection-url/compare/v1.3.4...v2.0.0) (2026-06-07)

### ⚠ BREAKING CHANGES

* Node.js >= 18 is now required. Parsing errors throw typed
error subclasses instead of plain Error. username()/password() getters
return decoded values. toUrl() URI-encodes credentials and serializes all
hosts for replica-set connections.

### Features

* modernize library with zero-dependency parser, new API, and parsing fixes ([de2a74e](https://github.com/jdziat/parse-connection-url/commit/de2a74e86bd6768bfae1cad320d03069c6e27cd2))
