'use strict'
/**
 * SealSolrClient
 * @exports Connection
 * @file Connection
 * @author Jordan Dziat <mailto:jordan@dziat.com>
 */

const _ = require('lodash')
const {parseObject, parseUrl} = require('./util.js')
const portNumbers = require('port-numbers')
/**
 * @typedef UnifiedConnectionSchema
 */
const defaultSecureConnectionProtocols = ['ftps', 'sftp', 'https', 'ldaps']

class Connection {
  /**
   * @desc Creates a Connection object that can parse objects or url string to a number of different formats.
   * @constructor
   * @param {(UnifiedConnectionSchema|String)} urlOrObject - The values used to init both the solr and seal clients.
   * @param {Object} options
   * @param {String[]} options.secureProtocols - An array of strings to be used to determine if a protocol is marked as secure.
   */
  constructor (urlOrObject, options) {
    options = options || {}
    const self = this
    const secureProtocols = options.secureConnectionProtocols || defaultSecureConnectionProtocols
    let properties
    if (_.isString(urlOrObject)) {
      properties = parseUrl(urlOrObject, {secureProtocols})
    } else if (_.isObject(urlOrObject)) {
      properties = parseObject(urlOrObject, {secureProtocols})
    }
    self.connection = properties.connection
    self.auth = properties.auth
    Object.defineProperty(self, '_original', {
      enumerable: false,
      value: urlOrObject,
      writable: false
    })
  }
  /**
   * hasAuth
   * @desc Returns true if both a username and password are present.
   * @returns {Boolean}
   * @example
   * connection.hasAuth()
   * // returns true or false
   */
  hasAuth () {
    const self = this
    if (self.hasPassword() || self.hasUsername()) {
      return true
    } else {
      return false
    }
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
    const self = this
    const auth = self.auth
    if (!_.isUndefined(auth.username) && auth.username !== '') {
      return true
    } else {
      return false
    }
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
    const self = this
    const auth = self.auth
    if (!_.isUndefined(auth.password) && auth.password !== '') {
      return true
    } else {
      return false
    }
  }
  /**
   * getAuthString
   * @desc Returns an encodedURICompenent version auth string of username + : + password. If username and password are not present returns an empty string.
   * @returns {String}
   * @example
   * connection.getAuthString()
   * // returns ''
   */
  getAuthString () {
    const self = this
    if (self.hasAuth()) {
      return [self.username(), self.password()].join(':')
    } else {
      return ''
    }
  }
  /**
   * toHttpUrl
   * @desc Returns a string representation of this connection if the protocol is either http or https.
   * @returns {String}
   */
  toHttpUrl () {
    const self = this
    const conn = self.connection
    const httpConnections = ['http', 'https']
    if (httpConnections.indexOf(conn.protocol.toLowerCase()) !== -1) {
      return self.toUrl()
    } else {
      throw new Error(`The protocol: ${conn.protocol}, is not a valid http protocol.`)
    }
  }
  /**
   * toKnexConnection
   * @desc Returns an object that conforms to the knexjs connection format.
   * @returns {Object}
   */
  toKnexConnection () {
    const self = this
    const auth = self.auth
    const conn = self.connection
    const knexConnection = {}
    knexConnection.host = conn.hostname
    knexConnection.user = auth.username
    knexConnection.password = auth.password
    knexConnection.port = conn.port
    knexConnection.database = conn.path.replace('/', '')
    return knexConnection
  }
  toObject () {
    const self = this
    const auth = self.auth
    const conn = self.connection
    return _.merge({}, auth, conn)
  }
  /**
   * toSolrConnection
   * @desc Returns an object that conforms to the solr connection format.
   * @returns {Object}
   */
  toSolrConnection () {
    const self = this
    const auth = self.auth
    const conn = self.connection
    const httpConnections = ['http', 'https']
    if (httpConnections.indexOf(conn.protocol.toLowerCase()) === -1) {
      throw new Error('Invalid protocol for a solr connection.')
    }
    const solrConnection = {}
    solrConnection.host = conn.hostname
    solrConnection.username = auth.username
    solrConnection.password = auth.password
    solrConnection.port = conn.port
    solrConnection.bigint = true
    solrConnection.secure = conn.secure
    solrConnection.path = conn.path
    if (_.isUndefined(solrConnection.port)) {
      solrConnection.port = 8983
    }
    return solrConnection
  }
  /**
   * toStandardConnection
   * @desc Returns a string representation of this connection.
   * @returns {Object} connection
   */
  toStandardConnection () {
    const self = this
    const response = {}
    response.url = [self.connection.protocol, self.connection.hostname].join('://')
    if (self.connection.port !== '' && !_.isUndefined(self.connection.port)) {
      response.url += ':' + self.connection.port
    }
    response.username = self.auth.username
    response.password = self.auth.password
    return response
  }
  /**
   * toUrl
   * @desc Returns a string representation of this connection.
   * @returns {String}
   */
  toUrl () {
    const self = this
    const connection = self.connection
    let connectionString = connection.protocol + '://'
    if (self.hasAuth() === true) {
      connectionString += self.getAuthString() + '@'
    }
    connectionString += connection.hostname
    const defaultPort = (portNumbers.getPort(connection.protocol) || ((connection.protocol === 'postgres') ? {port: 5432} : {port: ''})).port
    if (!_.isUndefined(connection.port) && connection.port !== '') {
      if (connection.port !== defaultPort) {
        connectionString += ':' + connection.port
      }
    }
    if (!_.isUndefined(connection.path) && connection.path !== '') {
      connectionString += connection.path
    }
    return connectionString
  }
  /**
   * username
   * @desc Returns a URI encoded string of the username of this connection.
   * @param {String} [username] - If a string is provided it will encode the username and assign it to the current connection and return the encoded result.
   * @returns {String}
   */
  username (username) {
    const self = this
    const auth = self.auth
    if (_.isString(username)) {
      auth.username = encodeURIComponent(username)
    } else if (_.isUndefined(username)) {
      return auth.username || ''
    } else {
      throw new Error('Username must be a string.')
    }
  }
  /**
   * password
   * @desc Returns a URI encoded string of the password of this connection.
   * @param {String} [password] - If a string is provided it will encode the password and assign it to the current connection and return the encoded result.
   * @returns {String}
   */
  password (password) {
    const self = this
    const auth = self.auth
    if (_.isString(password)) {
      auth.password = encodeURIComponent(password)
    } else if (_.isUndefined(password)) {
      return auth.password || ''
    } else {
      throw new Error('Password must be a string.')
    }
  }
}
module.exports = Connection
