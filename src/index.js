'use strict'
/**
 * parse-connection-url
 * @exports Connection
 * @file Connection
 * @author Jordan Dziat <mailto:jordan@dziat.com>
 */

const { parseObject, parseUrl, getPort, serializeQueryString, isIpv6 } = require('./util.js')
const { ConnectionError, ValidationError, ParseError, ProtocolError } = require('./errors.js')

// Query parameter keys whose values are masked by toJSON()
const SENSITIVE_PARAM_KEYS = ['password', 'pass', 'secret', 'token', 'apikey', 'api_key', 'auth']

/**
 * Safely parses a port number, returning the default if invalid
 * @private
 * @param {*} value - The value to parse
 * @param {number} [defaultPort] - Default port if parsing fails
 * @returns {number} The parsed port or default
 */
function safeParsePort (value, defaultPort = 0) {
  if (value === undefined || value === null || value === '') {
    return defaultPort
  }
  const parsed = parseInt(value, 10)
  if (isNaN(parsed) || parsed < 0 || parsed > 65535) {
    return defaultPort
  }
  return parsed
}

/**
 * Validates a port number
 * @private
 * @param {*} value - The value to validate
 * @returns {boolean} True if valid port
 */
function isValidPort (value) {
  const parsed = parseInt(value, 10)
  return !isNaN(parsed) && parsed >= 0 && parsed <= 65535
}

/**
 * @typedef UnifiedConnectionSchema
 */
const defaultSecureConnectionProtocols = ['ftps', 'sftp', 'https', 'ldaps', 'mongodb+srv', 'rediss', 'wss', 'amqps', 'mqtts', 'imaps', 'smtps', 'pop3s']

class Connection {
  /**
   * @desc Creates a Connection object that can parse objects or url string to a number of different formats.
   * @constructor
   * @param {(UnifiedConnectionSchema|String)} urlOrObject - The values used to init both the solr and seal clients.
   * @param {Object} [options]
   * @param {String[]} [options.secureConnectionProtocols] - An array of protocol strings used to determine if a connection is marked as secure.
   * @throws {TypeError} If urlOrObject is null, undefined, or an invalid type.
   */
  constructor (urlOrObject, options) {
    if (urlOrObject === null || urlOrObject === undefined) {
      throw new TypeError('Connection requires a URL string or configuration object, received ' + urlOrObject)
    }
    if (typeof urlOrObject !== 'string' && typeof urlOrObject !== 'object') {
      throw new TypeError('Connection requires a URL string or configuration object, received ' + typeof urlOrObject)
    }
    options = options || {}
    const secureProtocols = options.secureConnectionProtocols || defaultSecureConnectionProtocols
    let properties
    if (typeof urlOrObject === 'string') {
      properties = parseUrl(urlOrObject, { secureProtocols })
    } else {
      properties = parseObject(urlOrObject, { secureProtocols })
    }
    this.connection = properties.connection
    this.auth = properties.auth
    Object.defineProperty(this, '_original', {
      enumerable: false,
      value: urlOrObject,
      writable: false
    })
  }

  /**
   * hasAuth
   * @desc Returns true if either a username or password is present.
   * @returns {Boolean}
   * @example
   * connection.hasAuth()
   * // returns true or false
   */
  hasAuth () {
    return this.hasPassword() || this.hasUsername()
  }

  /**
   * hasUsername
   * @desc Returns true if a username is present.
   * @returns {Boolean}
   * @example
   * connection.hasUsername()
   * // returns true or false
   */
  hasUsername () {
    return this.auth.username !== undefined && this.auth.username !== ''
  }

  /**
   * hasPassword
   * @desc Returns true if a password is present.
   * @returns {Boolean}
   * @example
   * connection.hasPassword()
   * // returns true or false
   */
  hasPassword () {
    return this.auth.password !== undefined && this.auth.password !== ''
  }

  /**
   * getAuthString
   * @desc Returns a URI-encoded auth string of username + : + password. If username and password are not present returns an empty string.
   * @returns {String}
   * @example
   * connection.getAuthString()
   * // returns ''
   */
  getAuthString () {
    if (this.hasAuth()) {
      return [encodeURIComponent(this.username()), encodeURIComponent(this.password())].join(':')
    }
    return ''
  }

  /**
   * toHttpUrl
   * @desc Returns a string representation of this connection if the protocol is either http or https.
   * @returns {String}
   * @throws {Error} If the protocol is not http or https.
   */
  toHttpUrl () {
    const httpConnections = ['http', 'https']
    if (httpConnections.indexOf(this.connection.protocol.toLowerCase()) !== -1) {
      return this.toUrl()
    }
    throw new ProtocolError(this.connection.protocol, ['http', 'https'], `The protocol: ${this.connection.protocol}, is not a valid http protocol.`)
  }

  /**
   * toKnexConnection
   * @desc Returns an object that conforms to the knexjs connection format.
   * @returns {Object}
   */
  toKnexConnection () {
    return {
      host: this.connection.hostname,
      user: this.auth.username,
      password: this.auth.password,
      port: this.connection.port,
      database: this.connection.path.replace('/', '')
    }
  }

  /**
   * toObject
   * @desc Returns a merged object containing all auth and connection properties.
   * @returns {Object}
   */
  toObject () {
    return { ...this.auth, ...this.connection }
  }

  /**
   * toSolrConnection
   * @desc Returns an object that conforms to the solr connection format.
   * @returns {Object}
   * @throws {Error} If the protocol is not http or https.
   */
  toSolrConnection () {
    const httpConnections = ['http', 'https']
    if (httpConnections.indexOf(this.connection.protocol.toLowerCase()) === -1) {
      throw new ProtocolError(this.connection.protocol, ['http', 'https'], 'Invalid protocol for a solr connection.')
    }
    return {
      host: this.connection.hostname,
      username: this.auth.username,
      password: this.auth.password,
      port: this.connection.port !== undefined ? this.connection.port : 8983,
      bigint: true,
      secure: this.connection.secure,
      path: this.connection.path
    }
  }

  /**
   * toStandardConnection
   * @desc Returns a string representation of this connection.
   * @returns {Object} connection
   */
  toStandardConnection () {
    let url = [this.connection.protocol, this.connection.hostname].join('://')
    if (this.connection.port !== '' && this.connection.port !== undefined) {
      url += ':' + this.connection.port
    }
    return {
      url,
      username: this.auth.username,
      password: this.auth.password
    }
  }

  /**
   * toKnex
   * @desc Alias for toKnexConnection. Returns an object that conforms to the knexjs connection format.
   * @returns {Object}
   */
  toKnex () {
    return this.toKnexConnection()
  }

  /**
   * toSolr
   * @desc Alias for toSolrConnection. Returns an object that conforms to the solr connection format.
   * @returns {Object}
   * @throws {Error} If the protocol is not http or https.
   */
  toSolr () {
    return this.toSolrConnection()
  }

  /**
   * toSequelize
   * @desc Returns an object that conforms to the Sequelize ORM connection format.
   * @returns {Object}
   */
  toSequelize () {
    const dialectMap = {
      postgres: 'postgres',
      postgresql: 'postgres',
      mysql: 'mysql',
      mariadb: 'mariadb',
      mssql: 'mssql',
      sqlite: 'sqlite'
    }
    const protocol = this.connection.protocol.toLowerCase()
    return {
      dialect: dialectMap[protocol] || protocol,
      host: this.connection.hostname,
      port: this.connection.port,
      database: this.connection.path.replace(/^\//, ''),
      username: this.auth.username,
      password: this.auth.password,
      dialectOptions: Object.keys(this.connection.params || {}).length > 0 ? { ...this.connection.params } : undefined
    }
  }

  /**
   * toTypeORM
   * @desc Returns an object that conforms to the TypeORM connection format.
   * @returns {Object}
   */
  toTypeORM () {
    const typeMap = {
      postgres: 'postgres',
      postgresql: 'postgres',
      mysql: 'mysql',
      mariadb: 'mariadb',
      mssql: 'mssql',
      mongodb: 'mongodb',
      sqlite: 'sqlite'
    }
    const protocol = this.connection.protocol.toLowerCase()
    return {
      type: typeMap[protocol] || protocol,
      host: this.connection.hostname,
      port: this.connection.port,
      database: this.connection.path.replace(/^\//, ''),
      username: this.auth.username,
      password: this.auth.password,
      extra: Object.keys(this.connection.params || {}).length > 0 ? { ...this.connection.params } : undefined
    }
  }

  /**
   * toPrisma
   * @desc Returns the connection URL in Prisma-compatible format.
   * @returns {String}
   */
  toPrisma () {
    return this.toUrl()
  }

  /**
   * toMongo
   * @desc Returns an object that conforms to the MongoDB native driver options format.
   * @returns {Object}
   */
  toMongo () {
    const db = this.connection.path.replace(/^\//, '')
    const options = {
      authSource: this.getParam('authSource') || db || 'admin',
      replicaSet: this.getParam('replicaSet') || undefined,
      ssl: this.connection.secure || this.getParam('ssl') === 'true' || this.getParam('tls') === 'true'
    }

    if (this.hasAuth()) {
      options.auth = {
        username: this.auth.username,
        password: this.auth.password
      }
    }

    // Add any additional params (with prototype pollution protection)
    const excludeParams = ['authSource', 'replicaSet', 'ssl', 'tls']
    const dangerousKeys = ['__proto__', 'constructor', 'prototype']
    const params = this.connection.params || {}
    Object.keys(params).forEach(key => {
      if (!excludeParams.includes(key) &&
          !dangerousKeys.includes(key) &&
          Object.prototype.hasOwnProperty.call(params, key)) {
        options[key] = params[key]
      }
    })

    return options
  }

  /**
   * toRedis
   * @desc Returns an object that conforms to the Redis client options format.
   * @returns {Object}
   */
  toRedis () {
    const dbNum = parseInt(this.connection.path.replace(/^\//, ''), 10)
    const options = {
      host: this.connection.hostname,
      port: this.connection.port || 6379,
      db: isNaN(dbNum) ? 0 : dbNum
    }

    if (this.auth.password) {
      options.password = this.auth.password
    }

    if (this.auth.username) {
      options.username = this.auth.username
    }

    if (this.connection.secure) {
      options.tls = {}
    }

    return options
  }

  /**
   * toJSON
   * @desc Returns a JSON-serializable representation of this connection.
   * Passwords are masked with '***' for security in both URL and auth object.
   * @returns {Object}
   */
  toJSON () {
    // Build URL with the password and sensitive query parameter values masked
    const maskedUrl = this._buildUrl(true)

    // Also mask password-like query params in the connection copy
    const connectionCopy = { ...this.connection }
    if (connectionCopy.params) {
      connectionCopy.params = { ...connectionCopy.params }
      for (const param of SENSITIVE_PARAM_KEYS) {
        if (connectionCopy.params[param]) {
          connectionCopy.params[param] = '***'
        }
      }
    }

    return {
      url: maskedUrl,
      connection: connectionCopy,
      auth: {
        username: this.auth.username,
        password: this.auth.password ? '***' : ''
      }
    }
  }

  /**
   * toString
   * @desc Returns the URL string representation of this connection.
   * @returns {String}
   */
  toString () {
    return this.toUrl()
  }

  /**
   * username
   * @desc Gets or sets the username of this connection. The value is stored decoded (raw)
   * and is URI-encoded only when serialized to a URL.
   * @param {String} [username] - If a string is provided it will be assigned to the current connection.
   * @returns {String|Connection} The current (decoded) username when called without arguments, or this for chaining when setting.
   * @throws {Error} If username is provided but not a string.
   */
  username (username) {
    if (typeof username === 'string') {
      this.auth.username = username
      return this
    }
    if (username === undefined) {
      return this.auth.username || ''
    }
    throw new ValidationError('username', username, 'Username must be a string.')
  }

  /**
   * password
   * @desc Gets or sets the password of this connection. The value is stored decoded (raw)
   * and is URI-encoded only when serialized to a URL.
   * @param {String} [password] - If a string is provided it will be assigned to the current connection.
   * @returns {String|Connection} The current (decoded) password when called without arguments, or this for chaining when setting.
   * @throws {Error} If password is provided but not a string.
   */
  password (password) {
    if (typeof password === 'string') {
      this.auth.password = password
      return this
    }
    if (password === undefined) {
      return this.auth.password || ''
    }
    throw new ValidationError('password', password, 'Password must be a string.')
  }

  /**
   * getParam
   * @desc Gets a query parameter value.
   * @param {String} key - The parameter key.
   * @returns {String|undefined} The parameter value or undefined if not found.
   */
  getParam (key) {
    return this.connection.params ? this.connection.params[key] : undefined
  }

  /**
   * setParam
   * @desc Sets a query parameter value.
   * @param {String} key - The parameter key.
   * @param {String} value - The parameter value.
   * @returns {Connection} This connection instance for chaining.
   */
  setParam (key, value) {
    if (!this.connection.params) {
      this.connection.params = {}
    }
    this.connection.params[key] = String(value)
    return this
  }

  /**
   * hasParam
   * @desc Checks if a query parameter exists.
   * @param {String} key - The parameter key.
   * @returns {Boolean} True if the parameter exists.
   */
  hasParam (key) {
    return this.connection.params && Object.prototype.hasOwnProperty.call(this.connection.params, key)
  }

  /**
   * deleteParam
   * @desc Deletes a query parameter.
   * @param {String} key - The parameter key to delete.
   * @returns {Connection} This connection instance for chaining.
   */
  deleteParam (key) {
    if (this.connection.params) {
      delete this.connection.params[key]
    }
    return this
  }

  /**
   * getParams
   * @desc Gets all query parameters.
   * @returns {Object} Object containing all query parameters.
   */
  getParams () {
    return this.connection.params ? { ...this.connection.params } : {}
  }

  /**
   * clone
   * @desc Creates a deep copy of this connection via a structural copy (no URL round-trip),
   * preserving all properties including those that do not serialize to a URL (type, prefix,
   * ipVersion, secure, hosts). The clone's _original references this connection's original input.
   * @returns {Connection} A new Connection instance with the same values.
   */
  clone () {
    const cloned = Object.create(Connection.prototype)
    cloned.connection = {
      ...this.connection,
      params: { ...this.connection.params },
      hosts: this.connection.hosts ? this.connection.hosts.map(h => ({ ...h })) : []
    }
    cloned.auth = { ...this.auth }
    Object.defineProperty(cloned, '_original', {
      enumerable: false,
      value: this._original,
      writable: false
    })
    return cloned
  }

  /**
   * getFragment
   * @desc Gets the URL fragment (hash).
   * @returns {String} The fragment or empty string if not set.
   */
  getFragment () {
    return this.connection.fragment || ''
  }

  /**
   * setFragment
   * @desc Sets the URL fragment (hash).
   * @param {String} fragment - The fragment value (without #).
   * @returns {Connection} This connection instance for chaining.
   */
  setFragment (fragment) {
    this.connection.fragment = String(fragment)
    return this
  }

  /**
   * hasFragment
   * @desc Checks if a fragment exists.
   * @returns {Boolean} True if a fragment exists.
   */
  hasFragment () {
    return Boolean(this.connection.fragment)
  }

  /**
   * withFragment
   * @desc Returns a new Connection with the specified fragment (immutable).
   * @param {String} fragment - The fragment value.
   * @returns {Connection} A new Connection instance with the updated fragment.
   */
  withFragment (fragment) {
    const cloned = this.clone()
    cloned.setFragment(fragment)
    return cloned
  }

  /**
   * getHosts
   * @desc Gets all hosts for replica set connections.
   * @returns {Array<{hostname: String, port: Number}>} Array of host objects.
   */
  getHosts () {
    if (this.connection.hosts && this.connection.hosts.length > 0) {
      return [...this.connection.hosts]
    }
    // Return primary host if no replica set defined
    return [{
      hostname: this.connection.hostname,
      port: this.connection.port
    }]
  }

  /**
   * addHost
   * @desc Adds a host to the replica set.
   * @param {String} hostname - The hostname.
   * @param {Number} [port] - The port number.
   * @returns {Connection} This connection instance for chaining.
   */
  addHost (hostname, port) {
    if (!this.connection.hosts) {
      this.connection.hosts = []
    }
    // If this is the first additional host, add the primary host first
    if (this.connection.hosts.length === 0 && this.connection.hostname) {
      this.connection.hosts.push({
        hostname: this.connection.hostname,
        port: this.connection.port
      })
    }
    this.connection.hosts.push({
      hostname,
      port: safeParsePort(port, this.connection.port)
    })
    return this
  }

  /**
   * setHosts
   * @desc Sets all hosts for replica set connections.
   * @param {Array<{hostname: String, port: Number}>} hosts - Array of host objects.
   * @returns {Connection} This connection instance for chaining.
   */
  setHosts (hosts) {
    this.connection.hosts = hosts.map(h => ({
      hostname: h.hostname || h.host,
      port: safeParsePort(h.port, this.connection.port)
    }))
    // Update primary hostname/port from first host
    if (this.connection.hosts.length > 0) {
      this.connection.hostname = this.connection.hosts[0].hostname
      this.connection.port = this.connection.hosts[0].port
    }
    return this
  }

  /**
   * isReplicaSet
   * @desc Checks if this connection is configured as a replica set.
   * @returns {Boolean} True if multiple hosts are configured.
   */
  isReplicaSet () {
    return this.connection.hosts && this.connection.hosts.length > 1
  }

  /**
   * withHosts
   * @desc Returns a new Connection with the specified hosts (immutable).
   * @param {Array<{hostname: String, port: Number}>} hosts - Array of host objects.
   * @returns {Connection} A new Connection instance with the updated hosts.
   */
  withHosts (hosts) {
    const cloned = this.clone()
    cloned.setHosts(hosts)
    return cloned
  }

  /**
   * withAuth
   * @desc Returns a new Connection with the specified auth credentials (immutable).
   * Omitted (undefined) arguments leave the cloned connection's existing credentials unchanged.
   * @param {String} [username] - The username.
   * @param {String} [password] - The password.
   * @returns {Connection} A new Connection instance with the updated auth.
   * @throws {ValidationError} If a provided argument is not a string.
   */
  withAuth (username, password) {
    const cloned = this.clone()
    if (username !== undefined) {
      cloned.username(username)
    }
    if (password !== undefined) {
      cloned.password(password)
    }
    return cloned
  }

  /**
   * withPort
   * @desc Returns a new Connection with the specified port (immutable).
   * @param {Number} port - The port number (0-65535).
   * @returns {Connection} A new Connection instance with the updated port.
   * @throws {ValidationError} If port is not a valid port number.
   */
  withPort (port) {
    if (!isValidPort(port)) {
      throw new ValidationError('port', port, `Invalid port number: ${port}. Must be between 0 and 65535.`)
    }
    const cloned = this.clone()
    cloned.connection.port = safeParsePort(port, this.connection.port)
    return cloned
  }

  /**
   * withHostname
   * @desc Returns a new Connection with the specified hostname (immutable).
   * @param {String} hostname - The hostname.
   * @returns {Connection} A new Connection instance with the updated hostname.
   */
  withHostname (hostname) {
    const cloned = this.clone()
    cloned.connection.hostname = hostname
    return cloned
  }

  /**
   * withPath
   * @desc Returns a new Connection with the specified path (immutable).
   * @param {String} path - The path.
   * @returns {Connection} A new Connection instance with the updated path.
   */
  withPath (path) {
    const cloned = this.clone()
    cloned.connection.path = path.startsWith('/') ? path : '/' + path
    return cloned
  }

  /**
   * withProtocol
   * @desc Returns a new Connection with the specified protocol (immutable).
   * @param {String} protocol - The protocol.
   * @returns {Connection} A new Connection instance with the updated protocol.
   */
  withProtocol (protocol) {
    const cloned = this.clone()
    cloned.connection.protocol = protocol
    return cloned
  }

  /**
   * withParam
   * @desc Returns a new Connection with the specified query parameter (immutable).
   * @param {String} key - The parameter key.
   * @param {String} value - The parameter value.
   * @returns {Connection} A new Connection instance with the updated parameter.
   */
  withParam (key, value) {
    const cloned = this.clone()
    cloned.setParam(key, value)
    return cloned
  }

  /**
   * equals
   * @desc Checks if this connection equals another connection.
   * @param {Connection} other - The other connection to compare.
   * @returns {Boolean} True if the connections are equal.
   */
  equals (other) {
    if (!(other instanceof Connection)) {
      return false
    }
    return this.toUrl() === other.toUrl()
  }

  /**
   * isSimilar
   * @desc Checks if this connection is similar to another (same protocol, hostname, port).
   * @param {Connection} other - The other connection to compare.
   * @returns {Boolean} True if the connections are similar.
   */
  isSimilar (other) {
    if (!(other instanceof Connection)) {
      return false
    }
    return this.connection.protocol === other.connection.protocol &&
           this.connection.hostname === other.connection.hostname &&
           this.connection.port === other.connection.port
  }

  /**
   * toUrl
   * @desc Returns a string representation of this connection. Credentials are URI-encoded.
   * When multiple hosts are set (replica sets), all hosts are serialized comma-separated,
   * each with its port when known.
   * @returns {String}
   */
  toUrl () {
    return this._buildUrl(false)
  }

  /**
   * _buildUrl
   * @desc Builds the URL string representation.
   * @private
   * @param {Boolean} maskSensitive - When true, masks the password and sensitive query parameter values with '***'.
   * @returns {String}
   */
  _buildUrl (maskSensitive) {
    const parts = [this.connection.protocol, '://']
    if (this.hasAuth()) {
      const password = maskSensitive && this.hasPassword() ? '***' : encodeURIComponent(this.password())
      parts.push(encodeURIComponent(this.username()), ':', password, '@')
    }

    const hosts = this.connection.hosts
    if (hosts && hosts.length > 1) {
      // Multi-host (replica set): serialize every host, always with its port when known
      parts.push(hosts.map((h) => {
        const name = isIpv6(h.hostname) ? '[' + h.hostname + ']' : h.hostname
        return h.port !== undefined && h.port !== '' ? name + ':' + h.port : name
      }).join(','))
    } else {
      // Handle IPv6 addresses
      if (this.connection.ipVersion === 6 || isIpv6(this.connection.hostname)) {
        parts.push('[', this.connection.hostname, ']')
      } else {
        parts.push(this.connection.hostname)
      }

      const portLookup = getPort(this.connection.protocol)
      const defaultPort = (portLookup || ((this.connection.protocol === 'postgres') ? { port: 5432 } : { port: '' })).port
      if (this.connection.port !== undefined && this.connection.port !== '') {
        if (this.connection.port !== defaultPort) {
          parts.push(':', String(this.connection.port))
        }
      }
    }

    if (this.connection.path !== undefined && this.connection.path !== '') {
      parts.push(this.connection.path)
    }

    // Add query parameters
    let params = this.connection.params
    if (maskSensitive && params) {
      params = { ...params }
      for (const key of SENSITIVE_PARAM_KEYS) {
        if (params[key]) {
          params[key] = '***'
        }
      }
    }
    const queryString = serializeQueryString(params)
    if (queryString) {
      parts.push('?', queryString)
    }

    // Add fragment
    if (this.connection.fragment) {
      parts.push('#', this.connection.fragment)
    }

    return parts.join('')
  }

  /**
   * builder
   * @desc Creates a new ConnectionBuilder for fluent connection building.
   * @returns {ConnectionBuilder} A new builder instance.
   * @static
   */
  static builder () {
    return new ConnectionBuilder()
  }

  /**
   * from
   * @desc Creates a new Connection from a URL or configuration object.
   * @param {String|Object} urlOrObject - A URL string or configuration object.
   * @param {Object} [options] - Optional configuration options.
   * @returns {Connection} A new Connection instance.
   * @static
   */
  static from (urlOrObject, options) {
    return new Connection(urlOrObject, options)
  }

  /**
   * parse
   * @desc Parses a URL or configuration object and returns a plain object.
   * @param {String|Object} urlOrObject - A URL string or configuration object.
   * @param {Object} [options] - Optional configuration options.
   * @returns {Object} A plain object with connection and auth properties.
   * @static
   */
  static parse (urlOrObject, options) {
    const conn = new Connection(urlOrObject, options)
    return conn.toObject()
  }

  /**
   * isValid
   * @desc Checks if a URL or configuration object is valid.
   * @param {String|Object} urlOrObject - A URL string or configuration object.
   * @param {Object} [options] - Optional configuration options.
   * @returns {Boolean} True if the input is valid, false otherwise.
   * @static
   */
  static isValid (urlOrObject, options) {
    try {
      new Connection(urlOrObject, options)
      return true
    } catch {
      return false
    }
  }

  /**
   * fromEnv
   * @desc Creates a new Connection from an environment variable.
   * @param {String} key - The environment variable name.
   * @param {Object} [options] - Optional configuration options.
   * @returns {Connection} A new Connection instance.
   * @throws {Error} If the environment variable is not defined.
   * @static
   */
  static fromEnv (key, options) {
    const url = process.env[key]
    if (!url) {
      throw new ConnectionError('ENV_NOT_DEFINED', `Environment variable ${key} is not defined`, { key })
    }
    return new Connection(url, options)
  }

  /**
   * tryFromEnv
   * @desc Creates a new Connection from an environment variable, or returns null if not defined.
   * @param {String} key - The environment variable name.
   * @param {Object} [options] - Optional configuration options.
   * @returns {Connection|null} A new Connection instance or null if not defined.
   * @static
   */
  static tryFromEnv (key, options) {
    const url = process.env[key]
    if (!url) {
      return null
    }
    try {
      return new Connection(url, options)
    } catch {
      return null
    }
  }
}

/**
 * ConnectionBuilder
 * @desc Fluent builder for creating Connection instances.
 */
class ConnectionBuilder {
  constructor () {
    this._protocol = 'http'
    this._hostname = 'localhost'
    this._port = undefined
    this._path = ''
    this._username = ''
    this._password = ''
    this._secure = false
    this._params = {}
  }

  /**
   * protocol
   * @param {String} protocol - The protocol.
   * @returns {ConnectionBuilder} This builder instance.
   */
  protocol (protocol) {
    this._protocol = protocol
    return this
  }

  /**
   * hostname
   * @param {String} hostname - The hostname.
   * @returns {ConnectionBuilder} This builder instance.
   */
  hostname (hostname) {
    this._hostname = hostname
    return this
  }

  /**
   * host
   * @param {String} host - Alias for hostname.
   * @returns {ConnectionBuilder} This builder instance.
   */
  host (host) {
    return this.hostname(host)
  }

  /**
   * port
   * @param {Number} port - The port number.
   * @returns {ConnectionBuilder} This builder instance.
   * @throws {ValidationError} If port is not a valid number between 0-65535.
   */
  port (port) {
    if (!isValidPort(port)) {
      throw new ValidationError('port', port, `Invalid port number: ${port}. Must be between 0 and 65535.`)
    }
    this._port = safeParsePort(port)
    return this
  }

  /**
   * path
   * @param {String} path - The path.
   * @returns {ConnectionBuilder} This builder instance.
   */
  path (path) {
    this._path = path.startsWith('/') ? path : '/' + path
    return this
  }

  /**
   * database
   * @param {String} database - The database name (alias for path).
   * @returns {ConnectionBuilder} This builder instance.
   */
  database (database) {
    return this.path('/' + database)
  }

  /**
   * username
   * @param {String} username - The username.
   * @returns {ConnectionBuilder} This builder instance.
   */
  username (username) {
    this._username = username
    return this
  }

  /**
   * user
   * @param {String} user - Alias for username.
   * @returns {ConnectionBuilder} This builder instance.
   */
  user (user) {
    return this.username(user)
  }

  /**
   * password
   * @param {String} password - The password.
   * @returns {ConnectionBuilder} This builder instance.
   */
  password (password) {
    this._password = password
    return this
  }

  /**
   * secure
   * @param {Boolean} secure - Whether the connection is secure.
   * @returns {ConnectionBuilder} This builder instance.
   */
  secure (secure) {
    this._secure = secure
    return this
  }

  /**
   * param
   * @param {String} key - The parameter key.
   * @param {String} value - The parameter value.
   * @returns {ConnectionBuilder} This builder instance.
   */
  param (key, value) {
    this._params[key] = String(value)
    return this
  }

  /**
   * params
   * @param {Object} params - Object containing multiple parameters.
   * @returns {ConnectionBuilder} This builder instance.
   */
  params (params) {
    Object.assign(this._params, params)
    return this
  }

  /**
   * build
   * @desc Builds and returns a new Connection instance.
   * @returns {Connection} The built connection.
   */
  build () {
    const config = {
      protocol: this._protocol,
      hostname: this._hostname,
      port: this._port,
      path: this._path,
      username: this._username,
      password: this._password,
      secure: this._secure
    }
    const conn = new Connection(config)
    conn.connection.params = { ...this._params }
    return conn
  }
}

// Attach error classes to Connection for easy access
Connection.ConnectionError = ConnectionError
Connection.ValidationError = ValidationError
Connection.ParseError = ParseError
Connection.ProtocolError = ProtocolError

module.exports = Connection
