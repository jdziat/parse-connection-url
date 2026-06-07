'use strict'

/**
 * Base error class for connection-related errors
 * @extends Error
 */
class ConnectionError extends Error {
  /**
   * @param {string} code - Error code for programmatic handling
   * @param {string} message - Human-readable error message
   * @param {Object} [details={}] - Additional error details
   */
  constructor (code, message, details = {}) {
    super(message)
    this.name = 'ConnectionError'
    this.code = code
    this.details = details
    Error.captureStackTrace(this, this.constructor)
  }
}

/**
 * Error thrown when validation fails
 * @extends ConnectionError
 */
class ValidationError extends ConnectionError {
  /**
   * @param {string} field - The field that failed validation
   * @param {*} value - The invalid value
   * @param {string} message - Human-readable error message
   */
  constructor (field, value, message) {
    super('VALIDATION_ERROR', message, { field, value })
    this.name = 'ValidationError'
  }
}

/**
 * Error thrown when URL parsing fails
 * @extends ConnectionError
 */
class ParseError extends ConnectionError {
  /**
   * @param {string} url - The URL that failed to parse
   * @param {string} message - Human-readable error message
   */
  constructor (url, message) {
    super('PARSE_ERROR', message, { url })
    this.name = 'ParseError'
  }
}

/**
 * Error thrown when protocol is invalid for an operation
 * @extends ConnectionError
 */
class ProtocolError extends ConnectionError {
  /**
   * @param {string} protocol - The invalid protocol
   * @param {string[]} expected - List of expected protocols
   * @param {string} message - Human-readable error message
   */
  constructor (protocol, expected, message) {
    super('PROTOCOL_ERROR', message, { protocol, expected })
    this.name = 'ProtocolError'
  }
}

module.exports = {
  ConnectionError,
  ValidationError,
  ParseError,
  ProtocolError
}
