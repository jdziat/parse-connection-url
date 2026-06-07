'use strict'
const defaultSecureConnectionProtocols = ['ftps', 'sftp', 'https', 'ldaps', 'mongodb+srv', 'rediss', 'wss', 'amqps', 'mqtts', 'imaps', 'smtps', 'pop3s']
const schemas = require('./schema.js')
const { ParseError, ValidationError } = require('./errors.js')

/**
 * Safely parses a port number, returning undefined if invalid
 * @private
 * @param {string} portStr - The port string to parse
 * @returns {number|undefined} The parsed port or undefined
 */
function safeParsePort (portStr) {
  if (!portStr) {
    return undefined
  }
  const parsed = parseInt(portStr, 10)
  if (isNaN(parsed) || parsed < 0 || parsed > 65535) {
    return undefined
  }
  return parsed
}

// Default port numbers for common protocols
const DEFAULT_PORTS = {
  // Web protocols
  http: 80,
  https: 443,
  ws: 80,
  wss: 443,

  // File transfer
  ftp: 21,
  ftps: 990,
  sftp: 22,

  // SQL databases
  postgres: 5432,
  postgresql: 5432,
  mysql: 3306,
  mariadb: 3306,
  mssql: 1433,
  cockroachdb: 26257,
  cockroach: 26257,
  timescaledb: 5432,
  planetscale: 3306,

  // NoSQL databases
  mongodb: 27017,
  redis: 6379,
  rediss: 6379,
  cassandra: 9042,
  couchdb: 5984,
  neo4j: 7687,
  arangodb: 8529,
  dgraph: 8080,
  rethinkdb: 28015,

  // Search engines
  elasticsearch: 9200,
  opensearch: 9200,
  meilisearch: 7700,
  typesense: 8108,
  solr: 8983,

  // Message queues
  amqp: 5672,
  amqps: 5671,
  rabbitmq: 5672,
  kafka: 9092,
  nats: 4222,
  pulsar: 6650,
  mqtt: 1883,
  mqtts: 8883,
  stomp: 61613,

  // Caching
  memcached: 11211,

  // Time series
  influxdb: 8086,
  clickhouse: 8123,

  // Directory services
  ldap: 389,
  ldaps: 636,

  // Remote access
  ssh: 22,
  telnet: 23,

  // Email
  smtp: 25,
  smtps: 465,
  imap: 143,
  imaps: 993,
  pop3: 110,
  pop3s: 995,

  // RPC
  grpc: 50051,

  // Service discovery
  etcd: 2379,
  consul: 8500,
  zookeeper: 2181,

  // Secrets management
  vault: 8200
}

/**
 * Gets the default port for a protocol
 * @private
 * @param {String} protocol - The protocol name
 * @returns {Object|undefined} - Object with port property, or undefined if not found
 */
function getPort (protocol) {
  if (protocol && DEFAULT_PORTS[protocol.toLowerCase()]) {
    return { port: DEFAULT_PORTS[protocol.toLowerCase()] }
  }
  return undefined
}

//
// Start Stack Overflow Extract
// Stackoverflow link: https://stackoverflow.com/questions/106179/regular-expression-to-match-dns-hostname-or-ip-address
// Date Found: 06-05-2018
// Original Author: Jorge Ferreira
//
const ValidIpAddressRegex = /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/
const ValidHostnameRegex = /^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9-]*[A-Za-z0-9])$/

// IPv6 address regex (simplified version that handles common formats)
const ValidIpv6Regex = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$|^::1$|^::$/

/**
 * Parses a query string into an object
 * @private
 * @param {String} queryString - Query string without the leading ?
 * @returns {Object} - Object with key-value pairs
 */
function parseQueryString (queryString) {
  if (!queryString) {
    return {}
  }
  const params = {}
  const pairs = queryString.split('&')
  for (const pair of pairs) {
    const [key, value] = pair.split('=')
    if (key) {
      params[decodeURIComponent(key)] = value !== undefined ? decodeURIComponent(value) : ''
    }
  }
  return params
}

/**
 * Serializes an object to a query string
 * @private
 * @param {Object} params - Object with key-value pairs
 * @returns {String} - Query string without the leading ?
 */
function serializeQueryString (params) {
  if (!params || Object.keys(params).length === 0) {
    return ''
  }
  return Object.entries(params)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&')
}

/**
 * Checks if a hostname is an IPv6 address
 * @private
 * @param {String} hostname - The hostname to check
 * @returns {Boolean}
 */
function isIpv6 (hostname) {
  return ValidIpv6Regex.test(hostname)
}

/**
 * determineUrlType
 * @private
 * @desc When passed a string determines what type of connection url/string is being provided and for what service.
 * @param {String} url - The connection string that you want to determine the type of.
 * @param {String[]} [secureProtocols] - An array of strings to be used to determine if a protocol is marked as secure.
 * @returns {String} typeOfUrl - The type of the url that was passed into the function. Can be 'zookeeper', 'http', 'ftp', 'tcp', 'udp', 'sql', 'connectionString', 'nosql', 'queue', 'search', 'kv', 'generic'.
 * @throws {Error} If the URL type cannot be determined.
 */
function determineUrlType (url, secureProtocols) {
  secureProtocols = secureProtocols || [
    'zookeeper',
    'http',
    'ftp',
    'tcp',
    'udp',
    'sql',
    'connectionString',
    'nosql',
    'queue',
    'search',
    'kv',
    'generic'
  ]

  const httpFound = /^http(s)?:\/\//i.test(url)
  const httpEnabled = secureProtocols.indexOf('http') !== -1
  const tcpFound = /^tcp:\/\//i.test(url)
  const tcpEnabled = secureProtocols.indexOf('tcp') !== -1
  const udpFound = /^udp:\/\//i.test(url)
  const udpEnabled = secureProtocols.indexOf('udp') !== -1
  const ftpFound = /^(ftps?|sftp):\/\//i.test(url)
  const ftpEnabled = secureProtocols.indexOf('ftp') !== -1
  const connectionUrlFound = /^(jdbc|odbc):[a-z]{1,20}:\/\//i.test(url)
  const connectionUrlEnabled = secureProtocols.indexOf('connectionString') !== -1
  const sqlConnectionFound = /^([a-z]{0,10}sql|postgres(ql)?|mysql|mssql|mariadb|cockroachdb|timescaledb|clickhouse):\/\//i.test(url)
  const sqlEnabled = secureProtocols.indexOf('sql') !== -1
  const zookeeperFound = ValidIpAddressRegex.test(url) || ValidHostnameRegex.test(url)
  const zookeeperEnabled = secureProtocols.indexOf('zookeeper') !== -1

  // NoSQL databases
  const nosqlFound = /^(mongodb(\+srv)?|redis(s)?|memcached|cassandra|couchbase|couchdb|neo4j|dynamodb|rethinkdb|arangodb|orientdb|influxdb|scylladb):\/\//i.test(url)
  const nosqlEnabled = secureProtocols.indexOf('nosql') !== -1

  // Message queues
  const queueFound = /^(amqp(s)?|rabbitmq|kafka|pulsar|nats|mqtt(s)?|stomp|zeromq):\/\//i.test(url)
  const queueEnabled = secureProtocols.indexOf('queue') !== -1

  // Search engines
  const searchFound = /^(elasticsearch|solr|meilisearch|typesense|algolia|sphinxsearch):\/\//i.test(url)
  const searchEnabled = secureProtocols.indexOf('search') !== -1

  // Key-value / config stores
  const kvFound = /^(etcd|consul|vault|zookeeper):\/\//i.test(url)
  const kvEnabled = secureProtocols.indexOf('kv') !== -1

  // Generic protocol detection (any protocol://host format)
  const genericFound = /^[a-z][a-z0-9+.-]*:\/\//i.test(url)
  const genericEnabled = secureProtocols.indexOf('generic') !== -1

  if (httpFound && httpEnabled) {
    return 'http'
  }
  if (tcpFound && tcpEnabled) {
    return 'tcp'
  }
  if (udpFound && udpEnabled) {
    return 'udp'
  }
  if (ftpFound && ftpEnabled) {
    return 'ftp'
  }
  if (connectionUrlFound && connectionUrlEnabled) {
    return 'connectionString'
  }
  if (sqlConnectionFound && sqlEnabled) {
    return 'sql'
  }
  if (nosqlFound && nosqlEnabled) {
    return 'nosql'
  }
  if (queueFound && queueEnabled) {
    return 'queue'
  }
  if (searchFound && searchEnabled) {
    return 'search'
  }
  if (kvFound && kvEnabled) {
    return 'kv'
  }
  if (zookeeperFound && zookeeperEnabled) {
    return 'zookeeper'
  }
  if (genericFound && genericEnabled) {
    return 'generic'
  }

  throw new ParseError(url, `Unrecognized type for "${url}".`)
}

/**
 * hasCredentials
 * @private
 * @desc Determines if the url being passed has an authentication present.
 * @param {String} url - The connection string that you want to determine if credentials were supplied with it.
 * @returns {Boolean} foundCredentials - If a credential string is found returns true else false.
 */
function hasCredentials (url) {
  const typeOf = determineUrlType(url)
  if (typeOf === 'zookeeper') {
    return false
  }

  const firstDelimiter = url.indexOf('://') + 3
  let secondEndpoint = url.indexOf('/', firstDelimiter)
  if (secondEndpoint === -1) {
    secondEndpoint = url.length
  }
  const atIndex = url.indexOf('@', firstDelimiter)
  return atIndex !== -1 && atIndex < secondEndpoint
}

/**
 * parseObject
 * @private
 * @desc Parses out the given connection to a common response. Used by the constructor.
 * @param {Object} conn - The connection configuration object.
 * @param {Object} [options] - Parsing options.
 * @param {String[]} [options.secureProtocols] - An array of strings to be used to determine if a protocol is marked as secure.
 * @returns {Object} The parsed unified connection object.
 */
function parseObject (conn, options) {
  // Copy the input so the caller's object is never mutated
  conn = { ...(conn || {}) }
  conn.connection = { ...(conn.connection || {}) }
  conn.auth = { ...(conn.auth || {}) }
  options = options || {}
  const secureConnectionProtocols = options.secureProtocols || defaultSecureConnectionProtocols
  const response = schemas.createDefaultUnifiedConnection()

  if (conn.url !== undefined || conn.uri !== undefined || conn.jdbcUrl !== undefined || conn.jdbcurl !== undefined) {
    const url = conn.url || conn.uri || conn.jdbcUrl || conn.jdbcurl
    const props = parseUrl(url)
    response.auth = props.auth || {}
    response.connection = props.connection || {}
  }

  if (conn.auth !== undefined) {
    response.auth.username = conn.auth.username || conn.auth.user || conn.auth.principal || conn.auth.prinicipal || response.auth.username
    response.auth.password = conn.auth.password || conn.auth.pass || response.auth.password
  }

  if (conn.protocol !== undefined) {
    response.connection.secure = secureConnectionProtocols.indexOf(conn.protocol) !== -1
  }

  response.auth.username = conn.username || conn.user || conn.principal || conn.prinicipal || conn.auth.username || response.auth.username
  response.auth.password = conn.password || conn.pass || conn.auth.password || response.auth.password
  response.connection.prefix = conn.prefix || conn.connection.prefix || response.connection.prefix
  response.connection.protocol = conn.protocol || conn.connection.protocol || response.connection.protocol || 'http'
  response.connection.type = conn.type || conn.connection.type || response.connection.type || determineUrlType(response.connection.protocol + '://')

  const portLookup = getPort(response.connection.protocol)
  // Honor an explicitly-provided port (including 0); otherwise fall back to any parsed/default value
  const explicitPort = [conn.port, conn.connection.port].find((p) => p !== undefined && p !== null && p !== '')
  if (explicitPort !== undefined) {
    response.connection.port = explicitPort
  } else {
    response.connection.port = response.connection.port || (portLookup ? portLookup.port : 0)
  }
  response.connection.hostname = conn.hostname || conn.connection.hostname || conn.host || response.connection.hostname
  response.connection.path = conn.path || conn.connection.path || conn.database || response.connection.path

  return response
}

/**
 * Parses a single host[:port] entry from a multi-host (replica set) list.
 * Supports bracketed IPv6 entries like [::1]:6380.
 * @private
 * @param {String} entry - A single host[:port] entry.
 * @param {Number|undefined} defaultPort - Port to use when the entry has none.
 * @param {String} url - The full URL, for error reporting.
 * @returns {{hostname: String, port: (Number|undefined)}}
 * @throws {ParseError|ValidationError} If the entry is malformed or the hostname is invalid.
 */
function parseHostPort (entry, defaultPort, url) {
  let hostname
  let port
  if (entry.charAt(0) === '[') {
    const closeBracket = entry.indexOf(']')
    if (closeBracket === -1) {
      throw new ParseError(url, 'Unterminated IPv6 address in host list: ' + entry)
    }
    hostname = entry.slice(1, closeBracket)
    if (entry.charAt(closeBracket + 1) === ':') {
      port = safeParsePort(entry.slice(closeBracket + 2))
    }
  } else {
    const colon = entry.indexOf(':')
    if (colon !== -1) {
      hostname = entry.slice(0, colon)
      port = safeParsePort(entry.slice(colon + 1))
    } else {
      hostname = entry
    }
  }
  if (!hostname ||
      (!ValidIpAddressRegex.test(hostname) &&
       !ValidHostnameRegex.test(hostname) &&
       !ValidIpv6Regex.test(hostname))) {
    throw new ValidationError('hostname', hostname, 'Invalid hostname: ' + hostname)
  }
  return { hostname, port: port !== undefined ? port : defaultPort }
}

/**
 * parseUrl
 * @private
 * @desc Parses out the given connection to a common response. Used by the constructor.
 * @param {String} url - A url that will be parsed out to its relevant Connection representation.
 * @param {Object} [options] - Parsing options.
 * @param {String[]} [options.secureProtocols] - An array of strings to be used to determine if a protocol is marked as secure.
 * @returns {Object} The parsed unified connection object.
 * @throws {Error} If the URL is malformed.
 */
function parseUrl (url, options) {
  options = options || {}
  const secureConnectionProtocols = options.secureProtocols || defaultSecureConnectionProtocols
  url = url.trim()

  const response = schemas.createDefaultUnifiedConnection()
  response.connection.type = determineUrlType(url)

  // Extract fragment first (before query string processing)
  const hashIndex = url.indexOf('#')
  let urlWithoutFragment = url
  if (hashIndex !== -1) {
    response.connection.fragment = url.slice(hashIndex + 1)
    urlWithoutFragment = url.slice(0, hashIndex)
  }

  // Extract query string
  const queryIndex = urlWithoutFragment.indexOf('?')
  let urlWithoutQuery = urlWithoutFragment
  if (queryIndex !== -1) {
    const queryString = urlWithoutFragment.slice(queryIndex + 1)
    urlWithoutQuery = urlWithoutFragment.slice(0, queryIndex)
    response.connection.params = parseQueryString(queryString)
  }

  let endOffset = urlWithoutQuery.length
  const protocolStart = urlWithoutQuery.indexOf('://')
  let protocolEnd = protocolStart + 3

  // Check for IPv6 address (enclosed in brackets)
  const isIpv6Address = urlWithoutQuery.charAt(protocolEnd) === '['
  let ipv6EndBracket = -1
  if (isIpv6Address) {
    ipv6EndBracket = urlWithoutQuery.indexOf(']', protocolEnd)
  }

  const forwardSlashIndex = urlWithoutQuery.indexOf('/', protocolEnd) === -1 ? urlWithoutQuery.length : urlWithoutQuery.indexOf('/', protocolEnd)
  // Use the LAST '@' before the path so passwords containing a literal '@' parse correctly
  const atIndex = urlWithoutQuery.lastIndexOf('@', forwardSlashIndex - 1)
  let colonIndex = isIpv6Address && ipv6EndBracket !== -1
    ? urlWithoutQuery.indexOf(':', ipv6EndBracket)
    : urlWithoutQuery.indexOf(':', protocolEnd)

  response.connection.protocol = urlWithoutQuery.slice(0, protocolStart)

  if (response.connection.type === 'connectionUrl' || response.connection.type === 'connectionString') {
    const connectionColon = urlWithoutQuery.indexOf(':') + 1
    response.connection.prefix = urlWithoutQuery.slice(0, connectionColon - 1)
    response.connection.protocol = urlWithoutQuery.slice(connectionColon, protocolStart)
  }

  if (protocolStart === -1) {
    throw new ParseError(url, `Must be a valid url with '://' within it. Url: ${url} does not meet those requirements`)
  }

  if (secureConnectionProtocols.indexOf(response.connection.protocol) !== -1) {
    response.connection.secure = true
  }

  if (atIndex !== -1 && atIndex < forwardSlashIndex) {
    // Find the colon between username and password (before @)
    const authColonIndex = urlWithoutQuery.indexOf(':', protocolEnd)
    if (authColonIndex !== -1 && authColonIndex < atIndex) {
      response.auth.username = decodeURIComponent(urlWithoutQuery.slice(protocolEnd, authColonIndex))
      response.auth.password = decodeURIComponent(urlWithoutQuery.slice(authColonIndex + 1, atIndex))
    } else {
      response.auth.username = decodeURIComponent(urlWithoutQuery.slice(protocolEnd, atIndex))
    }
    protocolEnd = atIndex + 1
    // Recalculate colonIndex and IPv6 detection after auth
    if (urlWithoutQuery.charAt(protocolEnd) === '[') {
      ipv6EndBracket = urlWithoutQuery.indexOf(']', protocolEnd)
      colonIndex = ipv6EndBracket !== -1 ? urlWithoutQuery.indexOf(':', ipv6EndBracket) : -1
    } else {
      colonIndex = urlWithoutQuery.indexOf(':', protocolEnd)
    }
  }

  // Track the explicitly-parsed port separately from defaults so an explicit ':0' is honored
  let parsedPort

  const authority = urlWithoutQuery.slice(protocolEnd, forwardSlashIndex)
  if (authority.indexOf(',') !== -1) {
    // Multi-host (replica set) list: host[:port],host[:port],...
    const portLookup = getPort(response.connection.protocol)
    const defaultPort = portLookup ? portLookup.port : undefined
    response.connection.hosts = authority.split(',').map((entry) => parseHostPort(entry.trim(), defaultPort, url))
    const primary = response.connection.hosts[0]
    response.connection.hostname = primary.hostname
    parsedPort = primary.port
    if (ValidIpAddressRegex.test(primary.hostname)) {
      response.connection.ipVersion = 4
    } else if (ValidIpv6Regex.test(primary.hostname)) {
      response.connection.ipVersion = 6
    }
    if (forwardSlashIndex < urlWithoutQuery.length) {
      response.connection.path = urlWithoutQuery.slice(forwardSlashIndex)
    }
  } else if (urlWithoutQuery.charAt(protocolEnd) === '[') {
    // Handle IPv6 addresses
    const closeBracket = urlWithoutQuery.indexOf(']', protocolEnd)
    if (closeBracket !== -1) {
      response.connection.hostname = urlWithoutQuery.slice(protocolEnd + 1, closeBracket)
      response.connection.ipVersion = 6
      // Check for port after the closing bracket
      if (urlWithoutQuery.charAt(closeBracket + 1) === ':') {
        const portEndIndex = urlWithoutQuery.indexOf('/', closeBracket + 2)
        parsedPort = safeParsePort(urlWithoutQuery.slice(closeBracket + 2, portEndIndex === -1 ? urlWithoutQuery.length : portEndIndex))
      }
      if (forwardSlashIndex > closeBracket) {
        response.connection.path = urlWithoutQuery.slice(forwardSlashIndex)
      }
    }
  } else {
    // Regular hostname/IPv4 handling
    if (colonIndex !== -1 && colonIndex < forwardSlashIndex) {
      endOffset = colonIndex - protocolEnd
      parsedPort = safeParsePort(urlWithoutQuery.slice(colonIndex + 1, forwardSlashIndex))
    }

    if (forwardSlashIndex !== -1 && forwardSlashIndex < urlWithoutQuery.length) {
      if (colonIndex === -1 || colonIndex > forwardSlashIndex) {
        endOffset = forwardSlashIndex - protocolEnd
      }
      response.connection.path = urlWithoutQuery.slice(forwardSlashIndex)
    }

    response.connection.hostname = urlWithoutQuery.slice(protocolEnd, protocolEnd + endOffset)

    // Determine IP version
    if (ValidIpAddressRegex.test(response.connection.hostname)) {
      response.connection.ipVersion = 4
    }
  }

  let portNumberLookup
  if (response.connection.protocol !== undefined) {
    const portFound = getPort(response.connection.protocol)
    if (typeof portFound === 'object' && portFound !== null) {
      portNumberLookup = portFound.port
    }
  }

  response.connection.port = parsedPort !== undefined ? parsedPort : portNumberLookup

  // Validate hostname is either a valid IP address, IPv6 address, or valid hostname
  if (response.connection.hostname &&
      !ValidIpAddressRegex.test(response.connection.hostname) &&
      !ValidHostnameRegex.test(response.connection.hostname) &&
      !ValidIpv6Regex.test(response.connection.hostname)) {
    throw new ValidationError('hostname', response.connection.hostname, 'Invalid hostname: ' + response.connection.hostname)
  }

  return response
}

module.exports = {
  determineUrlType,
  hasCredentials,
  parseUrl,
  parseObject,
  getPort,
  parseQueryString,
  serializeQueryString,
  isIpv6,
  DEFAULT_PORTS
}
