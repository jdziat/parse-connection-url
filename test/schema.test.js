/* eslint-disable no-undef, handle-callback-err */
'use strict'
const expect = require('chai').expect
const Joi = require('joi')
const schemas = require('../src/schema.js')
const UnifiedConnectionSchema = schemas.UnifiedConnectionSchema
const defaultUCS = Joi.validate({}, UnifiedConnectionSchema).value

describe('Check the unified connection schema to make sure it has the correct defaults.', function () {
  it('Should have the auth and connection properties', function () {
    expect(defaultUCS).to.have.property('auth')
    expect(defaultUCS.auth).to.be.an('object')
    expect(defaultUCS).to.have.property('connection')
    expect(defaultUCS.connection).to.be.an('object')
  })
  it('Connection should contain the default properties: prefix,hostname,port,path,secure', function () {
    expect(defaultUCS.connection).to.have.property('prefix')
    expect(defaultUCS.connection).to.have.property('hostname')
    expect(defaultUCS.connection).to.have.property('port')
    expect(defaultUCS.connection).to.have.property('path')
    expect(defaultUCS.connection).to.have.property('secure')
  })
})
