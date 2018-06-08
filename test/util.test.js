/* eslint-disable no-undef, handle-callback-err */
'use strict'
const _ = require('lodash')
const expect = require('chai').expect
const Connection = require('../src/index.js')
const utilityFunctions = require('../src/util.js')
const fixtures = require('./fixtures.json')
fixtures.connections.forEach((conn) => {
  let connection = new Connection(conn.conn, conn.options)
  describe(`Checking the connection: "${conn.desc}"`, function () {
    describe('#determineUrlType', function () {
      it('When passed a string it should accurately return the connection type.', function () {
        if (_.isString(conn.conn)) {
          expect(utilityFunctions.determineUrlType(conn.conn)).to.be.an('string')
          expect(utilityFunctions.determineUrlType(conn.conn)).to.be.equal(conn.type)
        } else {
          expect(utilityFunctions.determineUrlType(connection.toUrl())).to.be.an('string')
          expect(utilityFunctions.determineUrlType(connection.toUrl())).to.be.equal(conn.type)
        }
      })
    })
    describe('#parseUrl', function () {
      it('When passed a url it should return an accurate connection object.', function () {
        if (_.isString(conn.conn)) {
          expect(utilityFunctions.parseUrl(conn.conn)).to.be.an('object')
          expect(utilityFunctions.parseUrl(conn.conn)).to.be.deep.equal(conn.expectedConn)
        }
      })
    })
    describe('#parseObject', function () {
      it('When passed a object it should return an accurate connection object.', function () {
        if (_.isObject(conn.conn) && !_.isString(conn.conn)) {
          expect(utilityFunctions.parseObject(conn.conn)).to.be.an('object')
          expect(utilityFunctions.parseObject(conn.conn)).to.be.deep.equal(conn.expectedConn)
        }
      })
    })
    describe('#hasCredentials', function () {
      it('When passed a connection url with an auth portion should return true.', function () {
        if (_.isString(conn.conn)) {
          expect(utilityFunctions.hasCredentials(conn.conn)).to.be.an('boolean')
          expect(utilityFunctions.hasCredentials(conn.conn)).to.be.deep.equal(conn.hasAuth)
        }
      })
    })
  })
})
