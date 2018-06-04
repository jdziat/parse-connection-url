/* eslint-disable no-undef, handle-callback-err */
'use strict'
const expect = require('chai').expect
const Connection = require('../src/index.js')
const fixtures = require('./fixtures.json')
fixtures.connections.forEach((conn) => {
  let connection = new Connection(conn.conn, conn.options)
  describe(`Checking the connection: "${conn.desc}"`, function () {
    describe('#getAuthString', function () {
      it('Returns a auth string for use in other methods.', function () {
        expect(connection.getAuthString()).to.be.an('string')
        expect(connection.getAuthString()).to.be.equal(conn.auth)
      })
    })
    describe('#toUrl', function () {
      it('Should return a valid url string', function () {
        expect(connection.toUrl()).to.be.an('string')
        expect(connection.toUrl()).to.be.equal(conn.expectedUrl)
      })
    })
    describe('#toSolrConnection', function () {
      it('Should return a solr connection object', function () {
        const toSolrConnection = connection.toSolrConnection.bind(connection)
        if (conn.protocol === 'http' || conn.protocol === 'https') {
          expect(connection.toSolrConnection()).to.be.an('object')
          expect(toSolrConnection).to.not.throw()
          expect(connection.toSolrConnection()).to.have.property('host')
          expect(connection.toSolrConnection()).to.have.property('username')
          expect(connection.toSolrConnection()).to.have.property('password')
          expect(connection.toSolrConnection()).to.have.property('port')
          expect(connection.toSolrConnection()).to.have.property('bigint')
          expect(connection.toSolrConnection()).to.have.property('path')
        } else {
          expect(toSolrConnection).to.throw()
        }
      })
    })
    describe('#toKnexConnection', function () {
      it('Should return a valid url string', function () {
        expect(connection.toUrl()).to.be.an('string')
        expect(connection.toUrl()).to.be.equal(conn.expectedUrl)
      })
    })
    describe('#hasUsername', function () {
      it('Should return a boolean value if a username is present.', function () {
        expect(connection.hasUsername()).to.be.an('boolean')
        expect(connection.hasUsername()).to.be.equal(conn.hasUsername)
      })
    })
    describe('#username', function () {
      it('Should return a string value if a password is present.', function () {
        expect(connection.username()).to.be.an('string')
        expect(connection.username()).to.be.equal(conn.username.valid)
        expect(connection.username()).to.not.equal(conn.username.invalid)
      })
    })
    describe('#hasPassword', function () {
      it('Should return a boolean value if a password is present.', function () {
        expect(connection.hasPassword()).to.be.an('boolean')
        expect(connection.hasPassword()).to.be.equal(conn.hasPassword)
      })
    })
    describe('#password', function () {
      it('Should return a string value if a password is present.', function () {
        expect(connection.password()).to.be.an('string')
        expect(connection.password()).to.be.equal(conn.password.valid)
        expect(connection.password()).to.not.equal(conn.password.invalid)
      })
    })
    describe('#hasAuth', function () {
      it('Should return a boolean value if a username and password is present.', function () {
        expect(connection.hasAuth()).to.be.an('boolean')
        expect(connection.hasAuth()).to.be.equal(conn.hasAuth)
      })
    })
  })
})
