'use strict'
const schemas = require('../src/schema.js')
const defaultUCS = schemas.createDefaultUnifiedConnection()

describe('Check the unified connection schema to make sure it has the correct defaults.', () => {
  it('Should have the auth and connection properties', () => {
    expect(defaultUCS).toHaveProperty('auth')
    expect(typeof defaultUCS.auth).toBe('object')
    expect(defaultUCS).toHaveProperty('connection')
    expect(typeof defaultUCS.connection).toBe('object')
  })
  it('Connection should contain the default properties: prefix,hostname,port,path,secure', () => {
    expect(defaultUCS.connection).toHaveProperty('prefix')
    expect(defaultUCS.connection).toHaveProperty('hostname')
    expect(defaultUCS.connection).toHaveProperty('port')
    expect(defaultUCS.connection).toHaveProperty('path')
    expect(defaultUCS.connection).toHaveProperty('secure')
  })
  it('Auth should contain the default properties: username, password', () => {
    expect(defaultUCS.auth).toHaveProperty('username')
    expect(defaultUCS.auth).toHaveProperty('password')
  })
  it('Should have correct default values', () => {
    expect(defaultUCS.connection.prefix).toBe('')
    expect(defaultUCS.connection.hostname).toBe('')
    expect(defaultUCS.connection.port).toBe(0)
    expect(defaultUCS.connection.path).toBe('')
    expect(defaultUCS.connection.secure).toBe(false)
    expect(defaultUCS.auth.username).toBe('')
    expect(defaultUCS.auth.password).toBe('')
  })
})
