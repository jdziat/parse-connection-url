'use strict'
const Joi = require('joi')
/**
 * @typedef {object} ConnectionSchema
 * @type Object
 * @property {String} prefix - For connection-strings there is a prefix in the url. Example: jdbc or odbc.
 * @property {String} hostname - The hostname for the connection.
 * @property {Number} port - The port used by the service.
 * @property {String} path - The path is a string that can reference a specific resource like an api endpoint or a database.
 * @property {Boolean} secure - Whether or not the connection you are parsing is secured via TLS/SSL.
 */
const ConnectionSchema = Joi.object().keys({
  prefix: Joi.string().default(''),
  hostname: Joi.string().default(''),
  port: Joi.number().default(0),
  path: Joi.string().default(''),
  secure: Joi.boolean().default(false)
})
/**
 * @typedef {object} ConnectionSchema
 * @type Object
 * @property {String} url - For connection-strings there is a prefix in the url. Example: jdbc or odbc.
 * @property {Object} auth - Contains the username and password for the connection..
 * @property {String} auth.username - The connection username that was supplied.
 * @property {String} auth.password - The connection password that was supplied.
 */
const StandardConnectionSchema = Joi.object().keys({
  prefix: Joi.string().default(''),
  hostname: Joi.string().default(''),
  port: Joi.number().default(0),
  path: Joi.string().default(''),
  secure: Joi.boolean().default(false)
})
/**
 * @typedef {object} AuthSchema
 * @type Object
 * @property {String} username - The username used for authentication purposes.
 * @property {String} password - The password used for authentication purposes.
 */
const AuthSchema = Joi.object().keys({
  username: Joi.string().default(''),
  password: Joi.string().default('')
})
/**
 * @typedef {object} UnifiedConnectionShema
 * @type Object
 * @property {ConnectionSchema} connection
 * @property {AuthSchema} auth
 */
const UnifiedConnectionSchema = Joi.object().keys({
  connection: ConnectionSchema.default(),
  auth: AuthSchema.default()
})
module.exports = {AuthSchema, ConnectionSchema, UnifiedConnectionSchema, StandardConnectionSchema}
