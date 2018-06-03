# Parse Connection Url
<p align="center">
  <a href="https://standardjs.com"><img src="https://img.shields.io/badge/code_style-standard-brightgreen.svg" alt="Standard - JavaScript Style Guide"></a>
</p>

A Nodejs module that allows you to parse connection strings/objects in a consistent way.

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

