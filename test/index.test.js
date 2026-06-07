'use strict'
const Connection = require('../src/index.js')
const fixtures = require('./fixtures.json')

describe('Connection constructor input validation', () => {
  it('Should throw TypeError when passed null', () => {
    expect(() => new Connection(null)).toThrow(TypeError)
    expect(() => new Connection(null)).toThrow(/requires a URL string or configuration object/)
  })
  it('Should throw TypeError when passed undefined', () => {
    expect(() => new Connection(undefined)).toThrow(TypeError)
    expect(() => new Connection(undefined)).toThrow(/requires a URL string or configuration object/)
  })
  it('Should throw TypeError when passed a number', () => {
    expect(() => new Connection(123)).toThrow(TypeError)
    expect(() => new Connection(123)).toThrow(/requires a URL string or configuration object/)
  })
  it('Should throw TypeError when passed a boolean', () => {
    expect(() => new Connection(true)).toThrow(TypeError)
    expect(() => new Connection(true)).toThrow(/requires a URL string or configuration object/)
  })
  it('Should not throw when passed a valid string', () => {
    expect(() => new Connection('http://example.com')).not.toThrow()
  })
  it('Should not throw when passed a valid object', () => {
    expect(() => new Connection({ hostname: 'example.com', protocol: 'http' })).not.toThrow()
  })
})

describe('Hostname validation', () => {
  it('Should accept valid hostnames', () => {
    expect(() => new Connection('http://localhost')).not.toThrow()
    expect(() => new Connection('http://example.com')).not.toThrow()
    expect(() => new Connection('http://sub.example.com')).not.toThrow()
    expect(() => new Connection('http://my-host.example.org')).not.toThrow()
  })

  it('Should accept valid IP addresses', () => {
    expect(() => new Connection('http://127.0.0.1')).not.toThrow()
    expect(() => new Connection('http://192.168.1.1')).not.toThrow()
    expect(() => new Connection('http://10.0.0.1')).not.toThrow()
    expect(() => new Connection('http://255.255.255.255')).not.toThrow()
  })

  it('Should reject invalid hostnames with underscores', () => {
    expect(() => new Connection('http://invalid_host')).toThrow(/Invalid hostname/)
  })

  it('Should reject invalid hostnames with spaces', () => {
    expect(() => new Connection('http://host%20with%20spaces')).toThrow(/Invalid hostname/)
  })

  it('Should reject hostnames starting with hyphens', () => {
    expect(() => new Connection('http://-invalid.com')).toThrow(/Invalid hostname/)
  })

  it('Should reject hostnames with consecutive dots', () => {
    expect(() => new Connection('http://invalid..host.com')).toThrow(/Invalid hostname/)
  })
})

fixtures.connections.forEach((conn) => {
  const connection = new Connection(conn.conn, conn.options)
  describe(`Checking the connection: "${conn.desc}"`, () => {
    describe('#getAuthString', () => {
      it('Returns a auth string for use in other methods.', () => {
        expect(typeof connection.getAuthString()).toBe('string')
        expect(connection.getAuthString()).toBe(conn.auth)
      })
    })
    describe('#toUrl', () => {
      it('Should return a valid url string', () => {
        expect(typeof connection.toUrl()).toBe('string')
        expect(connection.toUrl()).toBe(conn.expectedUrl)
      })
    })
    describe('#toSolrConnection', () => {
      it('Should return a solr connection object', () => {
        const toSolrConnection = connection.toSolrConnection.bind(connection)
        if (conn.protocol === 'http' || conn.protocol === 'https') {
          expect(typeof connection.toSolrConnection()).toBe('object')
          expect(toSolrConnection).not.toThrow()
          expect(connection.toSolrConnection()).toHaveProperty('host')
          expect(connection.toSolrConnection()).toHaveProperty('username')
          expect(connection.toSolrConnection()).toHaveProperty('password')
          expect(connection.toSolrConnection()).toHaveProperty('port')
          expect(connection.toSolrConnection()).toHaveProperty('bigint')
          expect(connection.toSolrConnection()).toHaveProperty('path')
        } else {
          expect(toSolrConnection).toThrow()
        }
      })
    })
    describe('#hasUsername', () => {
      it('Should return a boolean value if a username is present.', () => {
        expect(typeof connection.hasUsername()).toBe('boolean')
        expect(connection.hasUsername()).toBe(conn.hasUsername)
      })
    })
    describe('#username', () => {
      it('Should return a string value if a password is present.', () => {
        expect(typeof connection.username()).toBe('string')
        expect(connection.username()).toBe(conn.username.valid)
        expect(connection.username()).not.toBe(conn.username.invalid)
      })
    })
    describe('#hasPassword', () => {
      it('Should return a boolean value if a password is present.', () => {
        expect(typeof connection.hasPassword()).toBe('boolean')
        expect(connection.hasPassword()).toBe(conn.hasPassword)
      })
    })
    describe('#password', () => {
      it('Should return a string value if a password is present.', () => {
        expect(typeof connection.password()).toBe('string')
        expect(connection.password()).toBe(conn.password.valid)
        expect(connection.password()).not.toBe(conn.password.invalid)
      })
    })
    describe('#hasAuth', () => {
      it('Should return a boolean value if a username and password is present.', () => {
        expect(typeof connection.hasAuth()).toBe('boolean')
        expect(connection.hasAuth()).toBe(conn.hasAuth)
      })
    })
    describe('type', () => {
      it('Should return one of the defined types. Values are: http,sql,solr,zookeeper,connectionString.', () => {
        expect(typeof connection.connection.type).toBe('string')
        expect(connection.connection.type).toBe(conn.type)
      })
    })
    describe('original', () => {
      it('The original value that was given to the constructor is stored in _original.', () => {
        expect(connection.conn).toBe(conn._original)
      })
    })
  })
})

// Phase 2 Feature Tests

describe('Query parameter support', () => {
  it('Should parse query parameters from URL', () => {
    const conn = new Connection('http://localhost:8080/api?foo=bar&baz=qux')
    expect(conn.getParam('foo')).toBe('bar')
    expect(conn.getParam('baz')).toBe('qux')
    expect(conn.getParam('missing')).toBeUndefined()
  })

  it('Should handle URL-encoded query parameters', () => {
    const conn = new Connection('http://localhost/api?name=John%20Doe&city=New%20York')
    expect(conn.getParam('name')).toBe('John Doe')
    expect(conn.getParam('city')).toBe('New York')
  })

  it('Should set and get query parameters', () => {
    const conn = new Connection('http://localhost')
    conn.setParam('key', 'value')
    expect(conn.getParam('key')).toBe('value')
    expect(conn.hasParam('key')).toBe(true)
  })

  it('Should support method chaining for setParam', () => {
    const conn = new Connection('http://localhost')
    const result = conn.setParam('a', '1').setParam('b', '2')
    expect(result).toBe(conn)
    expect(conn.getParam('a')).toBe('1')
    expect(conn.getParam('b')).toBe('2')
  })

  it('Should delete query parameters', () => {
    const conn = new Connection('http://localhost?foo=bar&baz=qux')
    expect(conn.hasParam('foo')).toBe(true)
    conn.deleteParam('foo')
    expect(conn.hasParam('foo')).toBe(false)
    expect(conn.getParam('foo')).toBeUndefined()
    expect(conn.getParam('baz')).toBe('qux')
  })

  it('Should include query parameters in toUrl()', () => {
    const conn = new Connection('http://localhost')
    conn.setParam('key', 'value')
    conn.setParam('other', 'param')
    const url = conn.toUrl()
    expect(url).toContain('?')
    expect(url).toContain('key=value')
    expect(url).toContain('other=param')
  })

  it('Should get all params with getParams()', () => {
    const conn = new Connection('http://localhost?a=1&b=2&c=3')
    const params = conn.getParams()
    expect(params).toEqual({ a: '1', b: '2', c: '3' })
  })

  it('Should return empty object when no params exist', () => {
    const conn = new Connection('http://localhost')
    expect(conn.getParams()).toEqual({})
  })

  it('Should handle empty query parameter values', () => {
    const conn = new Connection('http://localhost?empty=')
    expect(conn.getParam('empty')).toBe('')
  })
})

describe('IPv6 support', () => {
  it('Should parse IPv6 address in brackets', () => {
    const conn = new Connection('http://[::1]:8080/path')
    expect(conn.connection.hostname).toBe('::1')
    expect(conn.connection.port).toBe(8080)
    expect(conn.connection.path).toBe('/path')
    expect(conn.connection.ipVersion).toBe(6)
  })

  it('Should parse full IPv6 address', () => {
    const conn = new Connection('http://[2001:db8:85a3::8a2e:370:7334]:3000')
    expect(conn.connection.hostname).toBe('2001:db8:85a3::8a2e:370:7334')
    expect(conn.connection.port).toBe(3000)
    expect(conn.connection.ipVersion).toBe(6)
  })

  it('Should parse IPv6 with auth credentials', () => {
    const conn = new Connection('http://user:pass@[::1]:8080/db')
    expect(conn.auth.username).toBe('user')
    expect(conn.auth.password).toBe('pass')
    expect(conn.connection.hostname).toBe('::1')
    expect(conn.connection.port).toBe(8080)
    expect(conn.connection.ipVersion).toBe(6)
  })

  it('Should output IPv6 address with brackets in toUrl()', () => {
    const conn = new Connection('http://[::1]:8080')
    const url = conn.toUrl()
    expect(url).toBe('http://[::1]:8080')
  })

  it('Should set ipVersion to 4 for IPv4 addresses', () => {
    const conn = new Connection('http://192.168.1.1:8080')
    expect(conn.connection.ipVersion).toBe(4)
  })

  it('Should not set ipVersion for hostnames', () => {
    const conn = new Connection('http://localhost:8080')
    expect(conn.connection.ipVersion).toBeUndefined()
  })
})

describe('Builder pattern', () => {
  it('Should create connection using builder', () => {
    const conn = Connection.builder()
      .protocol('https')
      .hostname('example.com')
      .port(443)
      .path('/api')
      .username('admin')
      .password('secret')
      .build()

    expect(conn.connection.protocol).toBe('https')
    expect(conn.connection.hostname).toBe('example.com')
    expect(conn.connection.port).toBe(443)
    expect(conn.connection.path).toBe('/api')
    expect(conn.auth.username).toBe('admin')
    expect(conn.auth.password).toBe('secret')
  })

  it('Should support host alias for hostname', () => {
    const conn = Connection.builder()
      .host('myhost.com')
      .build()

    expect(conn.connection.hostname).toBe('myhost.com')
  })

  it('Should support user alias for username', () => {
    const conn = Connection.builder()
      .user('myuser')
      .build()

    expect(conn.auth.username).toBe('myuser')
  })

  it('Should support database alias for path', () => {
    const conn = Connection.builder()
      .protocol('postgres')
      .hostname('localhost')
      .database('mydb')
      .build()

    expect(conn.connection.path).toBe('/mydb')
  })

  it('Should add query parameters via builder', () => {
    const conn = Connection.builder()
      .hostname('localhost')
      .param('ssl', 'true')
      .param('timeout', '30')
      .build()

    expect(conn.getParam('ssl')).toBe('true')
    expect(conn.getParam('timeout')).toBe('30')
  })

  it('Should add multiple params at once', () => {
    const conn = Connection.builder()
      .hostname('localhost')
      .params({ a: '1', b: '2', c: '3' })
      .build()

    expect(conn.getParams()).toEqual({ a: '1', b: '2', c: '3' })
  })

  it('Should use default values when not specified', () => {
    const conn = Connection.builder().build()

    expect(conn.connection.protocol).toBe('http')
    expect(conn.connection.hostname).toBe('localhost')
    expect(conn.connection.path).toBe('')
  })

  it('Should support method chaining', () => {
    const builder = Connection.builder()
    expect(builder.protocol('http')).toBe(builder)
    expect(builder.hostname('test')).toBe(builder)
    expect(builder.port(8080)).toBe(builder)
    expect(builder.path('/api')).toBe(builder)
    expect(builder.username('user')).toBe(builder)
    expect(builder.password('pass')).toBe(builder)
    expect(builder.secure(true)).toBe(builder)
    expect(builder.param('k', 'v')).toBe(builder)
  })

  it('Should normalize path to start with /', () => {
    const conn = Connection.builder()
      .path('api/v1')
      .build()

    expect(conn.connection.path).toBe('/api/v1')
  })
})

describe('Clone and immutability', () => {
  it('Should create a deep copy with clone()', () => {
    const original = new Connection('http://user:pass@localhost:8080/db?key=value')
    const cloned = original.clone()

    expect(cloned).not.toBe(original)
    expect(cloned.toUrl()).toBe(original.toUrl())
    expect(cloned.connection).not.toBe(original.connection)
    expect(cloned.auth).not.toBe(original.auth)
  })

  it('Should not affect original when modifying clone', () => {
    const original = new Connection('http://localhost:8080')
    const cloned = original.clone()

    cloned.setParam('new', 'param')
    cloned.connection.port = 9090

    expect(original.hasParam('new')).toBe(false)
    expect(original.connection.port).toBe(8080)
  })

  it('Should return new connection with withAuth()', () => {
    const original = new Connection('http://localhost')
    const withAuth = original.withAuth('newuser', 'newpass')

    expect(withAuth).not.toBe(original)
    expect(withAuth.auth.username).toBe('newuser')
    expect(withAuth.auth.password).toBe('newpass')
    expect(original.auth.username).toBe('')
    expect(original.auth.password).toBe('')
  })

  it('Should return new connection with withPort()', () => {
    const original = new Connection('http://localhost:8080')
    const withPort = original.withPort(9090)

    expect(withPort).not.toBe(original)
    expect(withPort.connection.port).toBe(9090)
    expect(original.connection.port).toBe(8080)
  })

  it('Should return new connection with withHostname()', () => {
    const original = new Connection('http://localhost')
    const withHostname = original.withHostname('newhost.com')

    expect(withHostname).not.toBe(original)
    expect(withHostname.connection.hostname).toBe('newhost.com')
    expect(original.connection.hostname).toBe('localhost')
  })

  it('Should return new connection with withPath()', () => {
    const original = new Connection('http://localhost/old')
    const withPath = original.withPath('/new')

    expect(withPath).not.toBe(original)
    expect(withPath.connection.path).toBe('/new')
    expect(original.connection.path).toBe('/old')
  })

  it('Should normalize path in withPath()', () => {
    const original = new Connection('http://localhost')
    const withPath = original.withPath('api/v1')

    expect(withPath.connection.path).toBe('/api/v1')
  })

  it('Should return new connection with withProtocol()', () => {
    const original = new Connection('http://localhost')
    const withProtocol = original.withProtocol('https')

    expect(withProtocol).not.toBe(original)
    expect(withProtocol.connection.protocol).toBe('https')
    expect(original.connection.protocol).toBe('http')
  })

  it('Should return new connection with withParam()', () => {
    const original = new Connection('http://localhost')
    const withParam = original.withParam('key', 'value')

    expect(withParam).not.toBe(original)
    expect(withParam.getParam('key')).toBe('value')
    expect(original.hasParam('key')).toBe(false)
  })

  it('Should chain immutable methods', () => {
    const original = new Connection('http://localhost')
    const modified = original
      .withAuth('user', 'pass')
      .withPort(9000)
      .withPath('/api')
      .withParam('ssl', 'true')

    expect(modified).not.toBe(original)
    expect(modified.auth.username).toBe('user')
    expect(modified.connection.port).toBe(9000)
    expect(modified.connection.path).toBe('/api')
    expect(modified.getParam('ssl')).toBe('true')

    // Original unchanged
    expect(original.auth.username).toBe('')
    expect(original.connection.port).toBe(80)
    expect(original.connection.path).toBe('')
    expect(original.hasParam('ssl')).toBe(false)
  })
})

describe('Connection comparison', () => {
  it('Should return true for equal connections', () => {
    const conn1 = new Connection('http://user:pass@localhost:8080/db')
    const conn2 = new Connection('http://user:pass@localhost:8080/db')

    expect(conn1.equals(conn2)).toBe(true)
    expect(conn2.equals(conn1)).toBe(true)
  })

  it('Should return false for different connections', () => {
    const conn1 = new Connection('http://localhost:8080')
    const conn2 = new Connection('http://localhost:9090')

    expect(conn1.equals(conn2)).toBe(false)
  })

  it('Should return false when comparing to non-Connection', () => {
    const conn = new Connection('http://localhost')

    expect(conn.equals(null)).toBe(false)
    expect(conn.equals(undefined)).toBe(false)
    expect(conn.equals('http://localhost')).toBe(false)
    expect(conn.equals({})).toBe(false)
  })

  it('Should return true for similar connections (same protocol, host, port)', () => {
    const conn1 = new Connection('http://user:pass@localhost:8080/db1')
    const conn2 = new Connection('http://other:other@localhost:8080/db2')

    expect(conn1.isSimilar(conn2)).toBe(true)
  })

  it('Should return false for connections with different ports', () => {
    const conn1 = new Connection('http://localhost:8080')
    const conn2 = new Connection('http://localhost:9090')

    expect(conn1.isSimilar(conn2)).toBe(false)
  })

  it('Should return false for connections with different protocols', () => {
    const conn1 = new Connection('http://localhost:443')
    const conn2 = new Connection('https://localhost:443')

    expect(conn1.isSimilar(conn2)).toBe(false)
  })

  it('Should return false for connections with different hostnames', () => {
    const conn1 = new Connection('http://host1:8080')
    expect(conn1.isSimilar(new Connection('http://host2:8080'))).toBe(false)
  })

  it('Should return false when comparing isSimilar to non-Connection', () => {
    const conn = new Connection('http://localhost')

    expect(conn.isSimilar(null)).toBe(false)
    expect(conn.isSimilar('http://localhost')).toBe(false)
  })
})
