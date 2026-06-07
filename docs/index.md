---
layout: home

hero:
  name: parse-connection-url
  text: One parser for every connection string.
  tagline: Parse URLs and config objects into a unified shape, then export to Knex, Sequelize, TypeORM, MongoDB, Redis, and more. Zero dependencies.
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: API Reference
      link: /api/connection
    - theme: alt
      text: GitHub
      link: https://github.com/jdziat/parse-connection-url

features:
  - icon: 🔌
    title: Parse anything
    details: URL strings, config objects, jdbc/odbc connection strings, multi-host replica sets, IPv6 hosts, and 60+ protocols with sensible default ports.
  - icon: 📦
    title: Zero dependencies
    details: No runtime dependencies at all. Published with npm provenance attestations via OIDC trusted publishing.
  - icon: 🔁
    title: Round-trip safe
    details: Credentials are stored decoded and URI-encoded only at serialization, so parse → toUrl() → parse always survives special characters.
  - icon: 🛠️
    title: Export everywhere
    details: First-class exporters for Knex, Sequelize, TypeORM, Prisma, MongoDB, Redis, Solr, and plain HTTP — plus a fluent builder and immutable with* API.
  - icon: 🔒
    title: Safe to log
    details: toJSON() masks passwords and sensitive query parameters, so accidental console.log or structured logging never leaks credentials.
  - icon: 🧪
    title: Battle-tested
    details: 300+ tests across Linux, macOS, and Windows on Node 20, 22, and 24. Typed errors and full TypeScript definitions included.
---
