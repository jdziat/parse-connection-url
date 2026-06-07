# Parse Connection Url

[![npm version](https://badge.fury.io/js/parse-connection-url.svg)](https://www.npmjs.com/package/parse-connection-url)
[![CI](https://github.com/jdziat/parse-connection-url/workflows/CI/badge.svg)](https://github.com/jdziat/parse-connection-url/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/node/v/parse-connection-url.svg)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![Zero Dependencies](https://img.shields.io/badge/dependencies-0-brightgreen.svg)](https://www.npmjs.com/package/parse-connection-url)

A Node.js module that allows you to parse connection strings and objects in a consistent way. Zero dependencies.

## Table of Contents

- [Documentation](#documentation)
- [Installation](#installation)
- [Usage](#usage)
- [Support](#support)
- [Contributing](#contributing)

## Documentation

Click on the following link to go to the full documentation.
[Documentation](https://jdziat.github.io/parse-connection-url/) 

## Installation


```
npm i -S parse-connection-url
```

## Usage

```js
const Connection = require('parse-connection-url')
const httpConn = new Connection('http://admin:admin@localhost:8443/some/path')
console.log(httpConn)
// {
//   connection: 
//    { secure: false,
//      protocol: 'http',
//      port: 8443,
//      path: '/some/pathn',
//      hostname: 'localhost' },
//   auth: { username: 'admin', password: 'admin' } }
console.log(httpConn.toUrl())
// "http://admin:admin@localhost:8443/some/path"

const knexPostgresConn = new Connection('postgres://admin:admin@localhost:5432/generic_database')
console.log(knexPostgresConn)
//  {
//   connection: 
//    { secure: false,
//      protocol: 'postgres',
//      port: 5432,
//      path: '/generic_database',
//      hostname: 'localhost' },
//   auth: { username: 'admin', password: 'admin' } }
console.log(knexPostgresConn.toKnexConnection())
// { host: 'localhost',
//   user: 'admin',
//   password: 'admin',
//   port: 5432,
//   database: 'generic_database' }

```

## Support

Please [open an issue](https://github.com/jdziat/parse-connection-url/issues/new) for support.

## Contributing

