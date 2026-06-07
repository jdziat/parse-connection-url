'use strict'
const Connection = require('../src/index.js')

describe('Error Handling', () => {
  describe('Constructor validation', () => {
    it('Should throw TypeError for null input', () => {
      expect(() => new Connection(null)).toThrow(TypeError)
    })

    it('Should throw TypeError for undefined input', () => {
      expect(() => new Connection(undefined)).toThrow(TypeError)
    })

    it('Should throw TypeError for number input', () => {
      expect(() => new Connection(123)).toThrow(TypeError)
    })

    it('Should throw TypeError for boolean input', () => {
      expect(() => new Connection(true)).toThrow(TypeError)
    })

    it('Should throw for malformed URL without protocol separator', () => {
      expect(() => new Connection('http:localhost')).toThrow()
    })
  })

  describe('Method validation', () => {
    it('Should throw for non-string username', () => {
      const conn = new Connection('http://localhost')
      expect(() => conn.username(123)).toThrow()
      expect(() => conn.username(null)).toThrow()
      expect(() => conn.username({})).toThrow()
    })

    it('Should throw for non-string password', () => {
      const conn = new Connection('http://localhost')
      expect(() => conn.password(123)).toThrow()
      expect(() => conn.password(null)).toThrow()
      expect(() => conn.password({})).toThrow()
    })
  })

  describe('Protocol validation', () => {
    it('Should throw for toHttpUrl with non-http protocol', () => {
      const conn = new Connection('postgres://localhost/db')
      expect(() => conn.toHttpUrl()).toThrow()
    })

    it('Should throw for toSolrConnection with non-http protocol', () => {
      const conn = new Connection('postgres://localhost/db')
      expect(() => conn.toSolrConnection()).toThrow()
    })
  })
})

describe('Edge Cases', () => {
  describe('Special characters in credentials', () => {
    it('Should handle URL-encoded @ in password', () => {
      const conn = new Connection('http://user:p%40ss@localhost')
      expect(conn.auth.password).toBe('p@ss')
    })

    it('Should handle URL-encoded : in password', () => {
      const conn = new Connection('http://user:pass%3Aword@localhost')
      expect(conn.auth.password).toBe('pass:word')
    })

    it('Should handle URL-encoded / in password', () => {
      const conn = new Connection('http://user:pass%2Fword@localhost')
      expect(conn.auth.password).toBe('pass/word')
    })

    it('Should handle spaces in password', () => {
      const conn = new Connection('http://user:my%20password@localhost')
      expect(conn.auth.password).toBe('my password')
    })
  })

  describe('Long inputs', () => {
    it('Should handle very long paths', () => {
      const longPath = '/' + 'x'.repeat(2000)
      const conn = new Connection('http://localhost' + longPath)
      expect(conn.connection.path).toBe(longPath)
    })

    it('Should handle long query strings', () => {
      const longValue = 'x'.repeat(1000)
      const conn = new Connection(`http://localhost?key=${longValue}`)
      expect(conn.getParam('key')).toBe(longValue)
    })
  })

  describe('Empty values', () => {
    it('Should handle empty path', () => {
      const conn = new Connection('http://localhost')
      expect(conn.connection.path).toBe('')
    })

    it('Should handle empty query parameters', () => {
      const conn = new Connection('http://localhost?empty=')
      expect(conn.getParam('empty')).toBe('')
    })

    it('Should handle connection with no auth', () => {
      const conn = new Connection('http://localhost')
      expect(conn.auth.username).toBe('')
      expect(conn.auth.password).toBe('')
      expect(conn.hasAuth()).toBe(false)
    })
  })

  describe('Clone edge cases', () => {
    it('Should preserve ipVersion in clone', () => {
      const conn = new Connection('http://[::1]:8080')
      const cloned = conn.clone()
      expect(cloned.connection.ipVersion).toBe(6)
    })

    it('Should preserve type in clone', () => {
      const conn = new Connection('postgres://localhost/db')
      const cloned = conn.clone()
      expect(cloned.connection.type).toBe(conn.connection.type)
    })

    it('Should preserve prefix in clone', () => {
      const conn = new Connection('jdbc:postgresql://localhost/db')
      const cloned = conn.clone()
      expect(cloned.connection.prefix).toBe('jdbc')
    })

    it('Should have independent params after clone', () => {
      const conn = new Connection('http://localhost?key=value')
      const cloned = conn.clone()
      cloned.setParam('new', 'param')
      expect(conn.hasParam('new')).toBe(false)
      expect(cloned.hasParam('new')).toBe(true)
    })
  })

  describe('Setter chaining', () => {
    it('Should allow chaining username and password setters', () => {
      const conn = new Connection('http://localhost')
      const result = conn.username('user').password('pass')
      expect(result).toBe(conn)
      expect(conn.auth.username).toBe('user')
      expect(conn.auth.password).toBe('pass')
    })

    it('Should allow chaining with setParam', () => {
      const conn = new Connection('http://localhost')
      conn.username('user').password('pass').setParam('ssl', 'true')
      expect(conn.getParam('ssl')).toBe('true')
    })
  })

  describe('Principal alias', () => {
    it('Should accept principal as username alias', () => {
      const conn = new Connection({
        protocol: 'http',
        hostname: 'localhost',
        principal: 'admin'
      })
      expect(conn.auth.username).toBe('admin')
    })

    it('Should accept auth.principal as username alias', () => {
      const conn = new Connection({
        protocol: 'http',
        hostname: 'localhost',
        auth: {
          principal: 'admin',
          password: 'secret'
        }
      })
      expect(conn.auth.username).toBe('admin')
    })
  })
})
