'use strict'
const Connection = require('../src/index.js')
const utilityFunctions = require('../src/util.js')
const fixtures = require('./fixtures.json')

describe('Testing that we can parse out a saved connection object.', () => {
  const conn = new Connection(fixtures.connection)
  it('The newly created connection should match the previously created one.', () => {
    expect(conn).toEqual(fixtures.connection)
  })
})

fixtures.connections.forEach((conn) => {
  const connection = new Connection(conn.conn, conn.options)
  describe(`Checking the connection: "${conn.desc}"`, () => {
    describe('#determineUrlType', () => {
      it('When passed a string it should accurately return the connection type.', () => {
        if (typeof conn.conn === 'string') {
          expect(typeof utilityFunctions.determineUrlType(conn.conn)).toBe('string')
          expect(utilityFunctions.determineUrlType(conn.conn)).toBe(conn.type)
        } else {
          expect(typeof utilityFunctions.determineUrlType(connection.toUrl())).toBe('string')
          expect(utilityFunctions.determineUrlType(connection.toUrl())).toBe(conn.type)
        }
      })
    })
    describe('#parseUrl', () => {
      it('When passed a url it should return an accurate connection object.', () => {
        if (typeof conn.conn === 'string') {
          expect(typeof utilityFunctions.parseUrl(conn.conn)).toBe('object')
          expect(utilityFunctions.parseUrl(conn.conn)).toEqual(conn.expectedConn)
        }
      })
    })
    describe('#parseObject', () => {
      it('When passed a object it should return an accurate connection object.', () => {
        if (typeof conn.conn === 'object' && conn.conn !== null && typeof conn.conn !== 'string') {
          expect(typeof utilityFunctions.parseObject(conn.conn)).toBe('object')
          expect(utilityFunctions.parseObject(conn.conn)).toEqual(conn.expectedConn)
        }
      })
    })
    describe('#hasCredentials', () => {
      it('When passed a connection url with an auth portion should return true.', () => {
        if (typeof conn.conn === 'string') {
          expect(typeof utilityFunctions.hasCredentials(conn.conn)).toBe('boolean')
          expect(utilityFunctions.hasCredentials(conn.conn)).toEqual(conn.hasAuth)
        }
      })
    })
  })
})
