'use strict'
const _ = require('lodash')
const defaultSecureConnectionProtocols = ['ftps', 'sftp', 'https', 'ldaps']
const portNumbers = require('port-numbers')
const Joi = require('joi')
const schemas = require('./schema.js')
//
// Start Stack Overlow Extract
// Stackoverflow link: https://stackoverflow.com/questions/106179/regular-expression-to-match-dns-hostname-or-ip-address
// Date Found: 06-05-2018
// Original Author: Jorge Ferreira
//
const ValidIpAddressRegex = /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/
const ValidHostnameRegex = /^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9-]*[A-Za-z0-9])$/
/**
 * determineUrlType
 * @private
 * @desc When passed a string determines what type of connection url/string is being provided and for what service.
 * @param {String} url - The connection string that you want to determine the type of.
 * @param {Object} options
 * @param {String[]} secureProtocols - An array of strings to be used to determine if a protocol is marked as secure.ex  ['zookeeper', 'http', 'ftp', 'tcp', 'udp', 'sql', 'connectionUrl']
 * @returns {String} typeOfUrl - The type of the url that was passed into the function. Can be 'zookeeper', 'http', 'ftp', 'tcp', 'udp', 'sql', 'connectionUrl'.
 */
function determineUrlType (url, secureProtocols) {
  secureProtocols = secureProtocols || [
    'zookeeper',
    'http',
    'ftp',
    'tcp',
    'udp',
    'sql',
    'connectionString'
  ]
  let typeOfUrl = ''
  const httpFound = /^http(s){0,1}:\/\//i.test(url)
  const httpEnabled = secureProtocols.indexOf('http') !== -1
  const tcpFound = /^(tcp):\/\//i.test(url)
  const tcpEnabled = secureProtocols.indexOf('tcp') !== -1
  const udpFound = /^(udp):\/\//i.test(url)
  const udpEnabled = secureProtocols.indexOf('udp') !== -1
  const ftpFound = /^(ftp(s){0,1}|(s){0,1}ftp):\/\//i.test(url)
  const ftpEnabled = secureProtocols.indexOf('ftp') !== -1
  const connectionUrlFound = /^(jdbc|odbc):{1}[a-z]{1,20}:{1}\/\//i.test(url)
  const connectionUrlEnabled =
    secureProtocols.indexOf('connectionString') !== -1
  const sqlConnectionFound = /(^[a-z]{0,10}sql|postgres|mysql|mssql|):\/\//i.test(
    url
  )
  const sqlEnabled = secureProtocols.indexOf('sql') !== -1
  const zookeeperFound =
    ValidIpAddressRegex.test(url) === true ||
    ValidHostnameRegex.test(url) === true
  const zookeeperEnabled = secureProtocols.indexOf('zookeeper') !== -1
  if (httpFound === true && httpEnabled === true) {
    typeOfUrl = 'http'
  } else if (tcpFound === true && tcpEnabled === true) {
    typeOfUrl = 'tcp'
  } else if (udpFound === true && udpEnabled === true) {
    typeOfUrl = 'udp'
  } else if (ftpFound === true && ftpEnabled === true) {
    typeOfUrl = 'ftp'
  } else if (connectionUrlFound === true && connectionUrlEnabled === true) {
    typeOfUrl = 'connectionString'
  } else if (sqlConnectionFound === true && sqlEnabled === true) {
    typeOfUrl = 'sql'
  } else if (zookeeperFound === true && zookeeperEnabled === true) {
    typeOfUrl = 'zookeeper'
  }
  if (typeOfUrl === '') {
    throw new Error(`Unrecognized type for "${url}".`)
  }
  return typeOfUrl
}
/**
 * hasCredentials
 * @private
 * @desc Determines if the url being passed has an authentication present.
 * @param {String} url - The connection string that you want to determine if credentials were supplied with it.
 * @returns {Boolean} foundCredentials - If a credential string is found returns true else false.
 */
function hasCredentials (url) {
  let foundCredentials = false
  let typeOf = determineUrlType(url)
  if (typeOf !== 'zookeeper') {
    let firstDelimiter = url.indexOf('://') + 3
    let secondEndpoint = url.indexOf('/', firstDelimiter)
    if (secondEndpoint === -1) {
      secondEndpoint = url.length
    }
    let hasUsernamePassword = url.indexOf('@', firstDelimiter)
    if (hasUsernamePassword < secondEndpoint && hasUsernamePassword !== -1) {
      foundCredentials = true
    }
  }
  return foundCredentials
}

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
  conn = conn || {}
  conn.connection = conn.connection || {}
  conn.auth = conn.auth || {}
  options = options || {}
  const self = this || {}
  self.secureConnectionProtocols =
    options.secureProtocols || defaultSecureConnectionProtocols
  const response = Joi.validate({}, schemas.UnifiedConnectionSchema).value
  if (
    !_.isUndefined(conn.url) ||
    !_.isUndefined(conn.uri) ||
    !_.isUndefined(conn.jdbcUrl) ||
    !_.isUndefined(conn.jdbcurl)
  ) {
    let url = conn.url || conn.uri || conn.jdbcUrl || conn.jdbcurl
    const props = parseUrl(url)
    response.auth = props.auth || {}
    response.connection = props.connection || {}
  }
  conn = conn || {}
  if (!_.isUndefined(conn.auth)) {
    response.auth.username =
      conn.auth.username ||
      conn.auth.user ||
      conn.auth.prinicipal ||
      response.auth.username
    response.auth.password =
      conn.auth.password || conn.auth.pass || response.auth.password
  }
  if (!_.isUndefined(conn.protocol)) {
    response.connection.secure =
      self.secureConnectionProtocols.indexOf(conn.protocol) !== -1
  }
  response.auth.username =
    conn.username ||
    conn.user ||
    conn.prinicipal ||
    conn.auth.username ||
    response.auth.username
  response.auth.password =
    conn.password || conn.pass || conn.auth.password || response.auth.password
  response.connection.prefix =
    conn.prefix || conn.connection.prefix || response.connection.prefix
  response.connection.protocol =
    conn.protocol ||
    conn.connection.protocol ||
    response.connection.protocol ||
    'http'
  response.connection.type =
    conn.type ||
    conn.connection.type ||
    response.connection.type ||
    determineUrlType(response.connection.protocol + '://')
  response.connection.port =
    conn.port ||
    conn.connection.port ||
    response.connection.port ||
    portNumbers.getPort(response.connection.protocol).port

  response.connection.hostname =
    conn.hostname ||
    conn.connection.hostname ||
    conn.host ||
    response.connection.hostname
  response.connection.path =
    conn.path ||
    conn.connection.path ||
    conn.database ||
    response.connection.path
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
  self.secureConnectionProtocols =
    options.secureProtocols || defaultSecureConnectionProtocols
  url = url.trim()
  const response = Joi.validate({}, schemas.UnifiedConnectionSchema).value
  response.connection.type = determineUrlType(url)
  let endOffset = url.length
  let protocolStart = url.indexOf('://')
  let protocolEnd = protocolStart + 3
  let forwardSlashIndex =
    url.indexOf('/', protocolEnd) === -1
      ? url.length
      : url.indexOf('/', protocolEnd)
  let atIndex = url.indexOf('@')
  let colonIndex = url.indexOf(':', protocolEnd)
  response.connection.protocol = url.substr(0, protocolStart)
  if (
    response.connection.type === 'connectionUrl' ||
    response.connection.type === 'connectionString'
  ) {
    const connectionColon = url.indexOf(':') + 1
    response.connection.prefix = url.substr(0, connectionColon - 1)
    response.connection.protocol = url.substr(
      connectionColon,
      protocolStart - connectionColon
    )
  }
  if (protocolStart === -1) {
    throw new Error(
      `Must be a valid url with '://' within it. Url: ${url} does not meet those requirements`
    )
  }
  if (
    self.secureConnectionProtocols.indexOf(response.connection.protocol) !== -1
  ) {
    response.connection.secure = true
  }
  if (atIndex !== -1) {
    response.auth.username = encodeURIComponent(
      url.substr(protocolEnd, colonIndex - protocolEnd)
    )
    response.auth.password = encodeURIComponent(
      url.substr(colonIndex + 1, atIndex - colonIndex - 1)
    )
    protocolEnd = atIndex + 1
    colonIndex = url.indexOf(':', protocolEnd)
  }

  if (colonIndex !== -1) {
    endOffset = colonIndex - protocolEnd
    response.connection.port = _.toInteger(
      url.substr(colonIndex + 1, forwardSlashIndex - colonIndex - 1)
    )
  }
  if (forwardSlashIndex !== -1) {
    if (colonIndex === -1) {
      endOffset = forwardSlashIndex - protocolEnd
    }
    response.connection.path = url.substr(forwardSlashIndex)
  }
  let portNumberLookup
  if (!_.isUndefined(response.connection.protocol)) {
    const portFound = portNumbers.getPort(response.connection.protocol)
    if (_.isObject(portFound)) {
      portNumberLookup = portFound.port
    }
  }
  response.connection.port = response.connection.port || portNumberLookup
  response.connection.hostname = url.substr(protocolEnd, endOffset)
  if (response.connection.hostname.indexOf(ValidIpAddressRegex) !== -1) {
    throw new Error(
      'Invalid character found in hostname. ' + response.connection.hostname
    )
  }
  return response
}

module.exports = {
  determineUrlType,
  hasCredentials,
  parseUrl,
  parseObject
}
