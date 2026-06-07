'use strict'

const Connection = require('../src/index')

describe('New Features', function () {
  // ============================================
  // Static Factory Methods
  // ============================================
  describe('Static Factory Methods', function () {
    describe('Connection.from()', function () {
      it('should create a Connection from a URL string', function () {
        const conn = Connection.from('postgres://user:pass@localhost:5432/mydb')
        expect(conn).toBeInstanceOf(Connection)
        expect(conn.auth.username).toBe('user')
        expect(conn.auth.password).toBe('pass')
        expect(conn.connection.hostname).toBe('localhost')
        expect(conn.connection.port).toBe(5432)
      })

      it('should create a Connection from an object', function () {
        const conn = Connection.from({
          hostname: 'localhost',
          port: 3306,
          username: 'admin',
          password: 'secret'
        })
        expect(conn).toBeInstanceOf(Connection)
        expect(conn.auth.username).toBe('admin')
      })

      it('should pass options to the constructor', function () {
        const conn = Connection.from('custom://localhost', {
          secureConnectionProtocols: ['custom']
        })
        expect(conn.connection.secure).toBe(true)
      })
    })

    describe('Connection.parse()', function () {
      it('should return a plain object with auth and connection properties', function () {
        const result = Connection.parse('mysql://root:pass@db:3306/app')
        expect(typeof result).toBe('object')
        expect(result.username).toBe('root')
        expect(result.password).toBe('pass')
        expect(result.hostname).toBe('db')
        expect(result.port).toBe(3306)
        expect(result.path).toBe('/app')
      })
    })

    describe('Connection.isValid()', function () {
      it('should return true for valid URLs', function () {
        expect(Connection.isValid('http://localhost')).toBe(true)
        expect(Connection.isValid('postgres://user:pass@host:5432/db')).toBe(true)
      })

      it('should return false for invalid inputs', function () {
        expect(Connection.isValid(null)).toBe(false)
        expect(Connection.isValid(undefined)).toBe(false)
        expect(Connection.isValid(123)).toBe(false)
      })

      it('should return true for valid objects', function () {
        expect(Connection.isValid({ hostname: 'localhost', port: 80 })).toBe(true)
      })
    })

    describe('Connection.fromEnv()', function () {
      it('should create a Connection from an environment variable', function () {
        process.env.TEST_DB_URL = 'postgres://user:pass@localhost/testdb'
        const conn = Connection.fromEnv('TEST_DB_URL')
        expect(conn.auth.username).toBe('user')
        expect(conn.connection.hostname).toBe('localhost')
        delete process.env.TEST_DB_URL
      })

      it('should throw if environment variable is not defined', function () {
        expect(() => Connection.fromEnv('NONEXISTENT_VAR')).toThrow()
      })
    })

    describe('Connection.tryFromEnv()', function () {
      it('should return Connection if env var exists', function () {
        process.env.TEST_URL = 'http://example.com'
        const conn = Connection.tryFromEnv('TEST_URL')
        expect(conn).toBeInstanceOf(Connection)
        delete process.env.TEST_URL
      })

      it('should return null if env var does not exist', function () {
        const conn = Connection.tryFromEnv('NONEXISTENT_VAR_2')
        expect(conn).toBeNull()
      })
    })
  })

  // ============================================
  // Database Export Methods
  // ============================================
  describe('Database Export Methods', function () {
    const pgConn = new Connection('postgres://admin:secret@dbhost:5432/myapp')

    describe('toSequelize()', function () {
      it('should return Sequelize-compatible config', function () {
        const config = pgConn.toSequelize()
        expect(config.dialect).toBe('postgres')
        expect(config.host).toBe('dbhost')
        expect(config.port).toBe(5432)
        expect(config.database).toBe('myapp')
        expect(config.username).toBe('admin')
        expect(config.password).toBe('secret')
      })

      it('should include dialectOptions for query params', function () {
        const conn = new Connection('mysql://user:pass@host:3306/db?ssl=true&charset=utf8')
        const config = conn.toSequelize()
        expect(config.dialectOptions).toEqual({ ssl: 'true', charset: 'utf8' })
      })
    })

    describe('toTypeORM()', function () {
      it('should return TypeORM-compatible config', function () {
        const config = pgConn.toTypeORM()
        expect(config.type).toBe('postgres')
        expect(config.host).toBe('dbhost')
        expect(config.port).toBe(5432)
        expect(config.database).toBe('myapp')
        expect(config.username).toBe('admin')
        expect(config.password).toBe('secret')
      })

      it('should include extra for query params', function () {
        const conn = new Connection('postgres://user:pass@host/db?ssl=true')
        const config = conn.toTypeORM()
        expect(config.extra).toEqual({ ssl: 'true' })
      })
    })

    describe('toPrisma()', function () {
      it('should return Prisma-compatible URL string', function () {
        const url = pgConn.toPrisma()
        // Default ports are omitted from the URL
        expect(url).toBe('postgres://admin:secret@dbhost/myapp')
      })

      it('should include non-default ports', function () {
        const conn = new Connection('postgres://user:pass@host:5433/db')
        expect(conn.toPrisma()).toBe('postgres://user:pass@host:5433/db')
      })
    })

    describe('toMongo()', function () {
      it('should return MongoDB-compatible options', function () {
        const conn = new Connection('mongodb://user:pass@localhost:27017/mydb?authSource=admin&replicaSet=rs0')
        const opts = conn.toMongo()
        expect(opts.authSource).toBe('admin')
        expect(opts.replicaSet).toBe('rs0')
        expect(opts.ssl).toBe(false)
        expect(opts.auth).toEqual({ username: 'user', password: 'pass' })
      })

      it('should handle secure connections', function () {
        const conn = new Connection('mongodb+srv://user:pass@cluster.example.com/db')
        const opts = conn.toMongo()
        expect(opts.ssl).toBe(true)
      })

      it('should not include auth if no credentials', function () {
        const conn = new Connection('mongodb://localhost/test')
        const opts = conn.toMongo()
        expect(opts.auth).toBeUndefined()
      })
    })

    describe('toRedis()', function () {
      it('should return Redis-compatible options', function () {
        const conn = new Connection('redis://user:mypass@redis:6379/2')
        const opts = conn.toRedis()
        expect(opts.host).toBe('redis')
        expect(opts.port).toBe(6379)
        expect(opts.db).toBe(2)
        expect(opts.username).toBe('user')
        expect(opts.password).toBe('mypass')
      })

      it('should handle secure Redis connections', function () {
        const conn = new Connection('rediss://localhost:6380/0')
        const opts = conn.toRedis()
        expect(opts.tls).toEqual({})
      })

      it('should default db to 0', function () {
        const conn = new Connection('redis://localhost:6379')
        const opts = conn.toRedis()
        expect(opts.db).toBe(0)
      })
    })

    describe('toKnex() alias', function () {
      it('should be an alias for toKnexConnection()', function () {
        const conn = new Connection('postgres://user:pass@host:5432/db')
        expect(conn.toKnex()).toEqual(conn.toKnexConnection())
      })
    })

    describe('toSolr() alias', function () {
      it('should be an alias for toSolrConnection()', function () {
        const conn = new Connection('http://localhost:8983/solr')
        expect(conn.toSolr()).toEqual(conn.toSolrConnection())
      })
    })

    describe('toJSON()', function () {
      it('should return JSON-serializable object', function () {
        const conn = new Connection('http://user:pass@example.com:8080/api')
        const json = conn.toJSON()
        expect(json.url).toBe('http://user:***@example.com:8080/api')
        expect(typeof json.connection).toBe('object')
        expect(json.auth.username).toBe('user')
        expect(json.auth.password).toBe('***')
      })

      it('should work with JSON.stringify', function () {
        const conn = new Connection('http://localhost')
        const str = JSON.stringify(conn)
        expect(() => JSON.parse(str)).not.toThrow()
      })
    })

    describe('toString()', function () {
      it('should return the URL string', function () {
        const conn = new Connection('http://localhost:8080/path')
        expect(conn.toString()).toBe('http://localhost:8080/path')
      })
    })
  })

  // ============================================
  // Fragment Support
  // ============================================
  describe('Fragment Support', function () {
    describe('parsing fragments', function () {
      it('should parse fragment from URL', function () {
        const conn = new Connection('http://example.com/page#section1')
        expect(conn.connection.fragment).toBe('section1')
      })

      it('should handle URL without fragment', function () {
        const conn = new Connection('http://example.com/page')
        expect(conn.connection.fragment).toBe('')
      })

      it('should handle fragment with query string', function () {
        const conn = new Connection('http://example.com/page?foo=bar#anchor')
        expect(conn.connection.fragment).toBe('anchor')
        expect(conn.connection.params.foo).toBe('bar')
      })
    })

    describe('getFragment()', function () {
      it('should return the fragment', function () {
        const conn = new Connection('http://example.com#test')
        expect(conn.getFragment()).toBe('test')
      })
    })

    describe('setFragment()', function () {
      it('should set the fragment', function () {
        const conn = new Connection('http://example.com')
        conn.setFragment('newFragment')
        expect(conn.connection.fragment).toBe('newFragment')
      })

      it('should return this for chaining', function () {
        const conn = new Connection('http://example.com')
        expect(conn.setFragment('test')).toBe(conn)
      })
    })

    describe('hasFragment()', function () {
      it('should return true when fragment exists', function () {
        const conn = new Connection('http://example.com#frag')
        expect(conn.hasFragment()).toBe(true)
      })

      it('should return false when no fragment', function () {
        const conn = new Connection('http://example.com')
        expect(conn.hasFragment()).toBe(false)
      })
    })

    describe('withFragment()', function () {
      it('should return new Connection with fragment', function () {
        const conn = new Connection('http://example.com')
        const newConn = conn.withFragment('section')
        expect(newConn).not.toBe(conn)
        expect(newConn.connection.fragment).toBe('section')
        expect(conn.connection.fragment).toBe('')
      })
    })

    describe('toUrl() with fragment', function () {
      it('should include fragment in URL', function () {
        const conn = new Connection('http://example.com')
        conn.setFragment('anchor')
        expect(conn.toUrl()).toBe('http://example.com#anchor')
      })

      it('should place fragment after query string', function () {
        const conn = new Connection('http://example.com?foo=bar')
        conn.setFragment('section')
        expect(conn.toUrl()).toBe('http://example.com?foo=bar#section')
      })
    })
  })

  // ============================================
  // Replica Set Support
  // ============================================
  describe('Replica Set Support', function () {
    describe('getHosts()', function () {
      it('should return primary host when no replica set defined', function () {
        const conn = new Connection('mongodb://localhost:27017/db')
        // getHosts() always returns at least the primary host
        expect(conn.getHosts()).toEqual([{ hostname: 'localhost', port: 27017 }])
      })

      it('should return internal hosts array directly for inspection', function () {
        const conn = new Connection('mongodb://localhost:27017/db')
        // The internal hosts array is empty until addHost is called
        expect(conn.connection.hosts).toEqual([])
      })
    })

    describe('addHost()', function () {
      it('should add a host to the hosts array (including primary)', function () {
        const conn = new Connection('mongodb://localhost:27017/db')
        conn.addHost('mongo2', 27017)
        // First addHost also adds the primary host
        expect(conn.connection.hosts).toHaveLength(2)
        expect(conn.connection.hosts[0]).toEqual({ hostname: 'localhost', port: 27017 })
        expect(conn.connection.hosts[1]).toEqual({ hostname: 'mongo2', port: 27017 })
        // getHosts returns all hosts
        expect(conn.getHosts()).toHaveLength(2)
      })

      it('should use connection port as default', function () {
        const conn = new Connection('mongodb://localhost:27017/db')
        conn.addHost('mongo2')
        // Primary is at index 0, added host is at index 1
        expect(conn.connection.hosts[1].port).toBe(27017)
      })

      it('should return this for chaining', function () {
        const conn = new Connection('mongodb://localhost/db')
        expect(conn.addHost('host2', 27017)).toBe(conn)
      })

      it('should support chaining multiple hosts', function () {
        const conn = new Connection('mongodb://localhost:27017/db')
        conn.addHost('mongo2', 27017).addHost('mongo3', 27017)
        // Primary + 2 added hosts = 3 total
        expect(conn.connection.hosts).toHaveLength(3)
        expect(conn.getHosts()).toHaveLength(3)
      })
    })

    describe('setHosts()', function () {
      it('should replace all hosts', function () {
        const conn = new Connection('mongodb://localhost/db')
        conn.addHost('oldhost', 27017)
        conn.setHosts([
          { hostname: 'host1', port: 27017 },
          { hostname: 'host2', port: 27018 }
        ])
        expect(conn.connection.hosts).toHaveLength(2)
        expect(conn.connection.hosts[0].hostname).toBe('host1')
      })

      it('should return this for chaining', function () {
        const conn = new Connection('mongodb://localhost/db')
        expect(conn.setHosts([])).toBe(conn)
      })
    })

    describe('isReplicaSet()', function () {
      it('should return false when no additional hosts', function () {
        const conn = new Connection('mongodb://localhost/db')
        expect(conn.isReplicaSet()).toBe(false)
      })

      it('should return true when hosts are configured', function () {
        const conn = new Connection('mongodb://localhost/db')
        conn.addHost('mongo2', 27017)
        expect(conn.isReplicaSet()).toBe(true)
      })
    })

    describe('withHosts()', function () {
      it('should return new Connection with hosts', function () {
        const conn = new Connection('mongodb://localhost/db')
        // isReplicaSet() requires 2+ hosts
        const hosts = [
          { hostname: 'host1', port: 27017 },
          { hostname: 'host2', port: 27017 }
        ]
        const newConn = conn.withHosts(hosts)
        expect(newConn).not.toBe(conn)
        expect(newConn.connection.hosts).toHaveLength(2)
        expect(newConn.isReplicaSet()).toBe(true)
        expect(conn.connection.hosts).toHaveLength(0)
        expect(conn.isReplicaSet()).toBe(false)
      })
    })

    describe('clone() preserves hosts', function () {
      it('should clone hosts array', function () {
        const conn = new Connection('mongodb://localhost/db')
        conn.addHost('mongo2', 27017)
        const cloned = conn.clone()
        expect(cloned.connection.hosts).toEqual(conn.connection.hosts)
        expect(cloned.connection.hosts).not.toBe(conn.connection.hosts)
      })
    })
  })

  // ============================================
  // Error Classes
  // ============================================
  describe('Error Classes', function () {
    describe('ConnectionError', function () {
      it('should be accessible from Connection class', function () {
        expect(typeof Connection.ConnectionError).toBe('function')
      })

      it('should have code and details properties', function () {
        const err = new Connection.ConnectionError('TEST_CODE', 'Test message', { foo: 'bar' })
        expect(err.code).toBe('TEST_CODE')
        expect(err.message).toBe('Test message')
        expect(err.details).toEqual({ foo: 'bar' })
      })
    })

    describe('ValidationError', function () {
      it('should be accessible from Connection class', function () {
        expect(typeof Connection.ValidationError).toBe('function')
      })

      it('should extend ConnectionError', function () {
        const err = new Connection.ValidationError('field', 'value', 'Invalid')
        expect(err).toBeInstanceOf(Connection.ConnectionError)
        expect(err.code).toBe('VALIDATION_ERROR')
      })
    })

    describe('ParseError', function () {
      it('should be accessible from Connection class', function () {
        expect(typeof Connection.ParseError).toBe('function')
      })

      it('should extend ConnectionError', function () {
        const err = new Connection.ParseError('bad-url', 'Failed to parse')
        expect(err).toBeInstanceOf(Connection.ConnectionError)
        expect(err.code).toBe('PARSE_ERROR')
      })
    })

    describe('ProtocolError', function () {
      it('should be accessible from Connection class', function () {
        expect(typeof Connection.ProtocolError).toBe('function')
      })

      it('should extend ConnectionError', function () {
        const err = new Connection.ProtocolError('ftp', ['http', 'https'], 'Wrong protocol')
        expect(err).toBeInstanceOf(Connection.ConnectionError)
        expect(err.code).toBe('PROTOCOL_ERROR')
      })
    })
  })

  // ============================================
  // Builder Pattern
  // ============================================
  describe('Builder Pattern', function () {
    describe('Connection.builder()', function () {
      it('should return a ConnectionBuilder', function () {
        const builder = Connection.builder()
        expect(typeof builder).toBe('object')
        expect(typeof builder.build).toBe('function')
      })

      it('should build a complete connection', function () {
        const conn = Connection.builder()
          .protocol('postgres')
          .hostname('localhost')
          .port(5432)
          .database('mydb')
          .username('admin')
          .password('secret')
          .secure(false)
          .build()

        expect(conn).toBeInstanceOf(Connection)
        expect(conn.connection.protocol).toBe('postgres')
        expect(conn.connection.hostname).toBe('localhost')
        expect(conn.connection.port).toBe(5432)
        expect(conn.connection.path).toBe('/mydb')
        expect(conn.auth.username).toBe('admin')
        expect(conn.auth.password).toBe('secret')
      })

      it('should support host() alias', function () {
        const conn = Connection.builder()
          .host('myhost')
          .build()
        expect(conn.connection.hostname).toBe('myhost')
      })

      it('should support user() alias', function () {
        const conn = Connection.builder()
          .user('myuser')
          .build()
        expect(conn.auth.username).toBe('myuser')
      })

      it('should support param() for query parameters', function () {
        const conn = Connection.builder()
          .hostname('localhost')
          .param('ssl', 'true')
          .param('timeout', '30')
          .build()
        expect(conn.connection.params).toEqual({ ssl: 'true', timeout: '30' })
      })

      it('should support params() for multiple parameters', function () {
        const conn = Connection.builder()
          .hostname('localhost')
          .params({ foo: 'bar', baz: 'qux' })
          .build()
        expect(conn.connection.params).toEqual({ foo: 'bar', baz: 'qux' })
      })
    })
  })

  // ============================================
  // Modern Protocol Support
  // ============================================
  describe('Modern Protocol Support', function () {
    const protocols = [
      { protocol: 'cockroachdb', port: 26257 },
      { protocol: 'timescaledb', port: 5432 },
      { protocol: 'clickhouse', port: 8123 },
      { protocol: 'pulsar', port: 6650 },
      { protocol: 'mqtt', port: 1883 },
      { protocol: 'meilisearch', port: 7700 },
      { protocol: 'typesense', port: 8108 },
      { protocol: 'etcd', port: 2379 },
      { protocol: 'consul', port: 8500 },
      { protocol: 'vault', port: 8200 }
    ]

    protocols.forEach(({ protocol, port }) => {
      it(`should handle ${protocol} protocol with default port ${port}`, function () {
        const conn = new Connection(`${protocol}://localhost`)
        expect(conn.connection.port).toBe(port)
        expect(conn.connection.protocol).toBe(protocol)
      })
    })
  })

  // ============================================
  // Immutable Operations
  // ============================================
  describe('Immutable Operations', function () {
    describe('withAuth()', function () {
      it('should return new Connection with updated auth', function () {
        const conn = new Connection('http://localhost')
        const newConn = conn.withAuth('user', 'pass')
        expect(newConn).not.toBe(conn)
        expect(newConn.auth.username).toBe('user')
        expect(newConn.auth.password).toBe('pass')
        expect(conn.auth.username).toBe('')
      })
    })

    describe('withPort()', function () {
      it('should return new Connection with updated port', function () {
        const conn = new Connection('http://localhost:8080')
        const newConn = conn.withPort(3000)
        expect(newConn).not.toBe(conn)
        expect(newConn.connection.port).toBe(3000)
        expect(conn.connection.port).toBe(8080)
      })
    })

    describe('withHostname()', function () {
      it('should return new Connection with updated hostname', function () {
        const conn = new Connection('http://localhost')
        const newConn = conn.withHostname('example.com')
        expect(newConn).not.toBe(conn)
        expect(newConn.connection.hostname).toBe('example.com')
        expect(conn.connection.hostname).toBe('localhost')
      })
    })

    describe('withPath()', function () {
      it('should return new Connection with updated path', function () {
        const conn = new Connection('http://localhost/old')
        const newConn = conn.withPath('/new')
        expect(newConn).not.toBe(conn)
        expect(newConn.connection.path).toBe('/new')
        expect(conn.connection.path).toBe('/old')
      })
    })

    describe('withProtocol()', function () {
      it('should return new Connection with updated protocol', function () {
        const conn = new Connection('http://localhost')
        const newConn = conn.withProtocol('https')
        expect(newConn).not.toBe(conn)
        expect(newConn.connection.protocol).toBe('https')
        expect(conn.connection.protocol).toBe('http')
      })
    })

    describe('withParam()', function () {
      it('should return new Connection with updated param', function () {
        const conn = new Connection('http://localhost')
        const newConn = conn.withParam('key', 'value')
        expect(newConn).not.toBe(conn)
        expect(newConn.connection.params.key).toBe('value')
        expect(conn.connection.params.key).toBeUndefined()
      })
    })
  })

  // ============================================
  // Comparison Methods
  // ============================================
  describe('Comparison Methods', function () {
    describe('equals()', function () {
      it('should return true for identical connections', function () {
        const conn1 = new Connection('postgres://user:pass@host:5432/db')
        const conn2 = new Connection('postgres://user:pass@host:5432/db')
        expect(conn1.equals(conn2)).toBe(true)
      })

      it('should return false for different connections', function () {
        const conn1 = new Connection('postgres://user:pass@host:5432/db')
        const conn2 = new Connection('postgres://user:pass@host:5432/other')
        expect(conn1.equals(conn2)).toBe(false)
      })
    })

    describe('isSimilar()', function () {
      it('should return true for same protocol, host, port', function () {
        const conn1 = new Connection('postgres://user1:pass1@host:5432/db1')
        const conn2 = new Connection('postgres://user2:pass2@host:5432/db2')
        expect(conn1.isSimilar(conn2)).toBe(true)
      })

      it('should return false for different hosts', function () {
        const conn1 = new Connection('postgres://user:pass@host1:5432/db')
        const conn2 = new Connection('postgres://user:pass@host2:5432/db')
        expect(conn1.isSimilar(conn2)).toBe(false)
      })
    })
  })
})
