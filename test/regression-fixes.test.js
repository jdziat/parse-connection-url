'use strict'
const Connection = require('../src/index.js')

describe('Credential encoding round-trips (F1/F2)', () => {
  it('Round-trips an encoded @ in the password through toUrl', () => {
    const url = 'postgres://user:p%40ss@db.example.com:5433/mydb'
    const conn = new Connection(url)
    expect(conn.auth.password).toBe('p@ss')
    expect(conn.toUrl()).toBe(url)
    const reparsed = new Connection(conn.toUrl())
    expect(reparsed.auth).toEqual({ username: 'user', password: 'p@ss' })
  })

  it.each([
    ['colon', 'pa:ss'],
    ['slash', 'pa/ss'],
    ['hash', 'pa#ss'],
    ['percent', 'pa%ss'],
    ['space', 'pa ss'],
    ['unicode', 'pä∑s'],
    ['at and colon', 'p@s:s']
  ])('Round-trips a password containing %s via the setter', (_desc, raw) => {
    const conn = new Connection('http://example.com')
    conn.username('user').password(raw)
    expect(conn.password()).toBe(raw)
    expect(conn.auth.password).toBe(raw)
    const reparsed = new Connection(conn.toUrl())
    expect(reparsed.auth.password).toBe(raw)
    expect(reparsed.auth.username).toBe('user')
  })

  it('Parses a literal @ in the password (last @ before path wins)', () => {
    const conn = new Connection('http://user:p@ss@example.com/path')
    expect(conn.auth.username).toBe('user')
    expect(conn.auth.password).toBe('p@ss')
    expect(conn.connection.hostname).toBe('example.com')
    expect(conn.toUrl()).toBe('http://user:p%40ss@example.com/path')
  })

  it('Parses a password containing both raw @ and :', () => {
    const conn = new Connection('http://user:p@s:s@example.com')
    expect(conn.auth.username).toBe('user')
    expect(conn.auth.password).toBe('p@s:s')
    expect(conn.connection.hostname).toBe('example.com')
    expect(conn.toUrl()).toBe('http://user:p%40s%3As@example.com')
  })

  it('Round-trips a username-only connection (exact string)', () => {
    const conn = new Connection('http://bob@example.com')
    expect(conn.auth).toEqual({ username: 'bob', password: '' })
    expect(conn.toUrl()).toBe('http://bob:@example.com')
    const reparsed = new Connection(conn.toUrl())
    expect(reparsed.auth).toEqual({ username: 'bob', password: '' })
  })

  it('Round-trips a password-only connection (exact string)', () => {
    const conn = new Connection('http://:secret@example.com')
    expect(conn.auth).toEqual({ username: '', password: 'secret' })
    expect(conn.toUrl()).toBe('http://:secret@example.com')
    const reparsed = new Connection(conn.toUrl())
    expect(reparsed.auth).toEqual({ username: '', password: 'secret' })
  })

  it('Exporters receive raw (decoded) credentials from both creation paths', () => {
    const parsed = new Connection('postgres://user:p%40ss@db.example.com:5433/mydb')
    expect(parsed.toKnexConnection().password).toBe('p@ss')
    expect(parsed.toSequelize().password).toBe('p@ss')

    const set = new Connection('postgres://db.example.com:5433/mydb').username('user').password('p@ss')
    expect(set.toKnexConnection().password).toBe('p@ss')
    expect(set.toSequelize().password).toBe('p@ss')
  })

  it('getAuthString returns URI-encoded credentials', () => {
    const conn = new Connection('http://example.com').username('us er').password('p@ss')
    expect(conn.getAuthString()).toBe('us%20er:p%40ss')
  })
})

describe('toJSON masking (F3)', () => {
  it('Does not mangle the hostname when the password is a substring of it', () => {
    const conn = new Connection('redis://admin:example@redis.example.com:1234/0')
    expect(conn.toJSON().url).toBe('redis://admin:***@redis.example.com:1234/0')
  })

  it('Masks sensitive query parameter values in the URL and params copy', () => {
    const conn = new Connection('http://example.com/path?token=abc123&x=1')
    const json = conn.toJSON()
    expect(json.url).toBe('http://example.com/path?token=***&x=1')
    expect(json.connection.params.token).toBe('***')
    expect(json.connection.params.x).toBe('1')
    // The live instance must not be mutated by masking
    expect(conn.getParam('token')).toBe('abc123')
    expect(conn.toUrl()).toBe('http://example.com/path?token=abc123&x=1')
  })

  it('Leaves URLs without credentials unmasked', () => {
    const conn = new Connection('http://example.com/path?x=1')
    expect(conn.toJSON().url).toBe('http://example.com/path?x=1')
  })
})

describe('Multi-host / replica set parsing (F4)', () => {
  it('Parses all hosts from a comma-separated mongodb URL', () => {
    const conn = new Connection('mongodb://h1:27017,h2:27018/db')
    expect(conn.getHosts()).toEqual([
      { hostname: 'h1', port: 27017 },
      { hostname: 'h2', port: 27018 }
    ])
    expect(conn.isReplicaSet()).toBe(true)
    expect(conn.connection.hostname).toBe('h1')
    expect(conn.connection.port).toBe(27017)
    expect(conn.connection.path).toBe('/db')
  })

  it('Round-trips a multi-host URL through toUrl (exact string, ports always emitted)', () => {
    const url = 'mongodb://h1:27017,h2:27018/db'
    const conn = new Connection(url)
    expect(conn.toUrl()).toBe(url)
    expect(new Connection(conn.toUrl()).getHosts()).toEqual(conn.getHosts())
  })

  it('Fills missing per-host ports from the protocol default and emits them explicitly', () => {
    const conn = new Connection('mongodb://h1,h2:27018/db')
    expect(conn.getHosts()).toEqual([
      { hostname: 'h1', port: 27017 },
      { hostname: 'h2', port: 27018 }
    ])
    expect(conn.toUrl()).toBe('mongodb://h1:27017,h2:27018/db')
  })

  it('Parses auth, params, and fragment alongside multiple hosts', () => {
    const conn = new Connection('mongodb://u:p@h1:27017,h2:27018/admin?replicaSet=rs0')
    expect(conn.auth).toEqual({ username: 'u', password: 'p' })
    expect(conn.getParam('replicaSet')).toBe('rs0')
    expect(conn.toUrl()).toBe('mongodb://u:p@h1:27017,h2:27018/admin?replicaSet=rs0')
  })

  it('Parses bracketed IPv6 entries in a host list', () => {
    const conn = new Connection('redis://[::1]:6380,[2001:db8::1]:6381/0')
    expect(conn.getHosts()).toEqual([
      { hostname: '::1', port: 6380 },
      { hostname: '2001:db8::1', port: 6381 }
    ])
    expect(conn.toUrl()).toBe('redis://[::1]:6380,[2001:db8::1]:6381/0')
  })

  it('Throws ValidationError for an invalid hostname in the list', () => {
    expect(() => new Connection('mongodb://h1,bad!host/db')).toThrow(Connection.ValidationError)
    expect(() => new Connection('mongodb://h1,/db')).toThrow(Connection.ValidationError)
  })

  it('addHost connections serialize all hosts via toUrl', () => {
    const conn = new Connection('mongodb://h1/db').addHost('h2', 27018)
    expect(conn.toUrl()).toBe('mongodb://h1:27017,h2:27018/db')
  })
})

describe('clone() and with* immutables (F6)', () => {
  it('clone works with special-character passwords', () => {
    const conn = new Connection('postgres://user:p%40ss@db.example.com:5433/mydb')
    const cloned = conn.clone()
    expect(cloned).toBeInstanceOf(Connection)
    expect(cloned.auth).toEqual(conn.auth)
    expect(cloned.toUrl()).toBe(conn.toUrl())
  })

  it('clone preserves all properties including non-URL-serializable ones', () => {
    const conn = new Connection('jdbc:postgres://u:p@h:5433/db?a=1#frag')
    const cloned = conn.clone()
    expect(cloned.connection).toEqual(conn.connection)
    expect(cloned.auth).toEqual(conn.auth)
    // prefix does not serialize to toUrl, but a structural clone keeps it
    expect(cloned.connection.prefix).toBe('jdbc')
    expect(cloned.connection.type).toBe(conn.connection.type)
    expect(cloned.connection.fragment).toBe('frag')
  })

  it('clone keeps the original input for provenance', () => {
    const url = 'http://user:pass@example.com'
    const conn = new Connection(url)
    expect(conn.clone()._original).toBe(url)
  })

  it('clone isolates params and hosts from the source', () => {
    const conn = new Connection('mongodb://h1:27017,h2:27018/db?a=1')
    const cloned = conn.clone()
    cloned.setParam('a', '2')
    cloned.addHost('h3', 27019)
    expect(conn.getParam('a')).toBe('1')
    expect(conn.getHosts()).toHaveLength(2)
  })

  it('with* methods work on connections with special-character passwords', () => {
    const conn = new Connection('postgres://user:p%40ss@db.example.com:5433/mydb')
    const moved = conn.withPort(9999).withHostname('other.example.com')
    expect(moved.connection.port).toBe(9999)
    expect(moved.connection.hostname).toBe('other.example.com')
    expect(moved.auth.password).toBe('p@ss')
    expect(conn.connection.port).toBe(5433)
  })

  it('withAuth leaves omitted credentials unchanged and rejects non-strings', () => {
    const conn = new Connection('http://user:pass@example.com')
    const userOnly = conn.withAuth('bob')
    expect(userOnly.auth).toEqual({ username: 'bob', password: 'pass' })
    const passOnly = conn.withAuth(undefined, 'newpass')
    expect(passOnly.auth).toEqual({ username: 'user', password: 'newpass' })
    expect(() => conn.withAuth(123)).toThrow(Connection.ValidationError)
  })
})

describe('parseObject input safety (F7) and port 0 (F8)', () => {
  it('Does not mutate the caller input object', () => {
    const input = Object.freeze({ url: 'http://example.com' })
    expect(() => new Connection(input)).not.toThrow()
    expect(Object.keys(input)).toEqual(['url'])
  })

  it('Honors an explicit port 0 in a configuration object', () => {
    const conn = new Connection({ protocol: 'http', hostname: 'example.com', port: 0 })
    expect(conn.connection.port).toBe(0)
    expect(conn.toUrl()).toBe('http://example.com:0')
  })

  it('Honors an explicit :0 port in a URL', () => {
    const conn = new Connection('http://example.com:0/x')
    expect(conn.connection.port).toBe(0)
    expect(conn.toUrl()).toBe('http://example.com:0/x')
  })

  it('Still applies the protocol default when no port is given', () => {
    const conn = new Connection({ protocol: 'postgres', hostname: 'example.com' })
    expect(conn.connection.port).toBe(5432)
  })
})

describe('Constructor options (F5)', () => {
  it('secureConnectionProtocols marks matching protocols as secure', () => {
    const conn = new Connection('foo://example.com', { secureConnectionProtocols: ['foo'] })
    expect(conn.connection.secure).toBe(true)
  })
})
