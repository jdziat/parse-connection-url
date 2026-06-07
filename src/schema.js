'use strict'
/**
 * @typedef {object} ConnectionSchema
 * @type Object
 * @property {String} prefix - For connection-strings there is a prefix in the url. Example: jdbc or odbc.
 * @property {String} hostname - The hostname for the connection.
 * @property {Number} port - The port used by the service.
 * @property {String} path - The path is a string that can reference a specific resource like an api endpoint or a database.
 * @property {Boolean} secure - Whether or not the connection you are parsing is secured via TLS/SSL.
 */

/**
 * @typedef {object} AuthSchema
 * @type Object
 * @property {String} username - The username used for authentication purposes.
 * @property {String} password - The password used for authentication purposes.
 */

/**
 * @typedef {object} UnifiedConnectionSchema
 * @type Object
 * @property {ConnectionSchema} connection
 * @property {AuthSchema} auth
 */

/**
 * Creates a default connection object with all properties initialized.
 * @returns {ConnectionSchema}
 */
function createDefaultConnection () {
  return {
    prefix: '',
    hostname: '',
    port: 0,
    path: '',
    secure: false,
    params: {},
    fragment: '',
    hosts: [] // For replica sets: [{hostname: 'host1', port: 27017}, ...]
  }
}

/**
 * Creates a default auth object with all properties initialized.
 * @returns {AuthSchema}
 */
function createDefaultAuth () {
  return {
    username: '',
    password: ''
  }
}

/**
 * Creates a default unified connection object with connection and auth properties.
 * @returns {UnifiedConnectionSchema}
 */
function createDefaultUnifiedConnection () {
  return {
    connection: createDefaultConnection(),
    auth: createDefaultAuth()
  }
}

module.exports = {
  createDefaultConnection,
  createDefaultAuth,
  createDefaultUnifiedConnection
}
