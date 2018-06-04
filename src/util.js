'use strict'
const _ = require('lodash')
const defaultSecureConnectionProtocols = ['ftps', 'sftp', 'https', 'ldaps']

/**
 * parseObject
 * @private
 * @desc Parses out the given connection to a common response. Used by the constructor.
 * @param {ConnectionOptions} conn -
 * @param {Object} options
 * @param {String[]} secureProtocols - An array of strings to be used to determine if a protocol is marked as secure.
 * @returns {Object}
 */
function parseObject (conn, options) {
  options = options || {}
  const self = this || {}
  self.secureConnectionProtocols = options.secureProtocols || defaultSecureConnectionProtocols
  let response = {
    auth: {},
    connection: {}
  }
  if (!_.isUndefined(conn.url)) {
    const props = parseUrl(conn.url)
    response.auth = props.auth
    response.connection = props.connection
  }
  response.auth.username = conn.username || conn.user || conn.prinicipal || response.auth.username
  if (!_.isUndefined(conn.auth)) {
    response.auth.username = conn.auth.username || conn.auth.user || conn.auth.prinicipal || response.auth.username
  }
  response.auth.password = conn.password || conn.pass || response.auth.password
  if (!_.isUndefined(conn.protocol)) {
    response.connection.secure = (self.secureConnectionProtocols.indexOf(conn.protocol))
  }
  response.connection.protocol = conn.protocol || response.connection.protocol
  response.connection.port = conn.port || response.connection.port
  response.connection.hostname = conn.hostname || conn.host || response.connection.hostname
  response.connection.path = conn.path || conn.database || response.connection.path
  return response
}
/**
 * parseUrl
 * @private
 * @desc Parses out the given connection to a common response. Used by the constructor.
 * @param {String} ulr - A url that will be parsed out to it's relevant Connection representation.
 * @param {Object} options
 * @param {String[]} secureProtocols - An array of strings to be used to determine if a protocol is marked as secure.
 * @returns {Object}
 */
function parseUrl (url, options) {
  options = options || {}
  const self = this || {}
  self.secureConnectionProtocols = options.secureProtocols || defaultSecureConnectionProtocols
  url = url.trim()
  let response = {
    auth: {},
    protocol: '',
    connection: {
      secure: false
    }
  }
  let endOffset = url.length
  let protocolStart = url.indexOf('://')
  let protocolEnd = protocolStart + 3
  let forwardSlashIndex = url.indexOf('/', protocolEnd)
  let atIndex = url.indexOf('@')
  let colonIndex = url.indexOf(':', protocolEnd)
  if (protocolStart === -1) {
    throw new Error(`Must be a valid url with '://' within it. Url: ${url} does not meet those requirements`)
  }
  response.connection.protocol = url.substr(0, protocolStart)
  if (self.secureConnectionProtocols.indexOf(response.connection.protocol) !== -1) {
    response.connection.secure = true
  }
  if (atIndex !== -1) {
    response.auth.username = encodeURIComponent(url.substr(protocolEnd, colonIndex - protocolEnd))
    response.auth.password = encodeURIComponent(url.substr(colonIndex + 1, atIndex - colonIndex - 1))
    protocolEnd = atIndex + 1
    colonIndex = url.indexOf(':', protocolEnd)
  }

  if (colonIndex !== -1) {
    endOffset = colonIndex - protocolEnd
    response.connection.port = _.toInteger(url.substr(colonIndex + 1, forwardSlashIndex - colonIndex - 1))
  }
  if (forwardSlashIndex !== -1) {
    if (colonIndex === -1) {
      endOffset = forwardSlashIndex - protocolEnd
    }
    response.connection.path = url.substr(forwardSlashIndex)
  }
  response.connection.hostname = url.substr(protocolEnd, endOffset)
  if (response.connection.hostname.indexOf(/@|\\|\/|\||\(|\)|!|#|\$|%|\^|&|\*|=|-|_|`|~|\{|\}|\[|\]|"|'|:|;|<|>|\?/) !== -1) {
    throw new Error('Invalid character found in hostname. ' + response.connection.hostname)
  }
  return response
}

module.exports = {
  parseUrl,
  parseObject
}
