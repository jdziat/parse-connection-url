/**
 * Connection properties for a parsed connection.
 */
declare namespace Connection {
  interface Host {
    hostname: string;
    port: number;
  }

  interface ConnectionSchema {
    /** For connection-strings there is a prefix in the url. Example: jdbc or odbc. */
    prefix: string;
    /** The hostname for the connection. */
    hostname: string;
    /** The port used by the service. */
    port: number;
    /** The path is a string that can reference a specific resource like an api endpoint or a database. */
    path: string;
    /** Whether or not the connection is secured via TLS/SSL. */
    secure: boolean;
    /** The protocol used for the connection. */
    protocol?: string;
    /** The type of connection (http, sql, ftp, tcp, udp, zookeeper, connectionString). */
    type?: string;
    /** Query parameters parsed from the URL. */
    params?: Record<string, string>;
    /** IP version (4 for IPv4, 6 for IPv6). */
    ipVersion?: 4 | 6;
    /** URL fragment (hash). */
    fragment?: string;
    /** Replica set hosts for multi-host connections. */
    hosts?: Host[];
  }

  interface AuthSchema {
    /** The username used for authentication purposes. */
    username: string;
    /** The password used for authentication purposes. */
    password: string;
  }

  interface UnifiedConnectionSchema {
    connection: ConnectionSchema;
    auth: AuthSchema;
  }

  interface ConnectionOptions {
    /** An array of strings to be used to determine if a protocol is marked as secure. */
    secureConnectionProtocols?: string[];
  }

  interface ConnectionInput {
    url?: string;
    uri?: string;
    jdbcUrl?: string;
    jdbcurl?: string;
    hostname?: string;
    host?: string;
    port?: number;
    protocol?: string;
    path?: string;
    database?: string;
    prefix?: string;
    type?: string;
    username?: string;
    user?: string;
    principal?: string;
    password?: string;
    pass?: string;
    auth?: Partial<AuthSchema> & { user?: string; principal?: string; pass?: string };
    connection?: Partial<ConnectionSchema>;
  }

  interface KnexConnection {
    host: string;
    user: string;
    password: string;
    port: number;
    database: string;
  }

  interface SolrConnection {
    host: string;
    username: string;
    password: string;
    port: number;
    bigint: boolean;
    secure: boolean;
    path: string;
  }

  interface StandardConnection {
    url: string;
    username: string;
    password: string;
  }

  interface SequelizeConfig {
    dialect: string;
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
    dialectOptions?: Record<string, string>;
  }

  interface TypeORMConfig {
    type: string;
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
    extra?: Record<string, string>;
  }

  interface MongoOptions {
    authSource: string;
    replicaSet?: string;
    ssl: boolean;
    auth?: {
      username: string;
      password: string;
    };
    [key: string]: any;
  }

  interface RedisOptions {
    host: string;
    port: number;
    db: number;
    password?: string;
    username?: string;
    tls?: {};
  }

  interface JSONOutput {
    url: string;
    connection: ConnectionSchema;
    auth: {
      username: string;
      password: string;
    };
  }
}

/**
 * Base error class for connection-related errors.
 */
declare class ConnectionError extends Error {
  code: string;
  details: Record<string, any>;
  constructor(code: string, message: string, details?: Record<string, any>);
}

/**
 * Error thrown when validation fails.
 */
declare class ValidationError extends ConnectionError {
  constructor(field: string, value: any, message: string);
}

/**
 * Error thrown when URL parsing fails.
 */
declare class ParseError extends ConnectionError {
  constructor(url: string, message: string);
}

/**
 * Error thrown when protocol is invalid for an operation.
 */
declare class ProtocolError extends ConnectionError {
  constructor(protocol: string, expected: string[], message: string);
}

/**
 * Fluent builder for creating Connection instances.
 */
declare class ConnectionBuilder {
  /** Sets the protocol. */
  protocol(protocol: string): ConnectionBuilder;
  /** Sets the hostname. */
  hostname(hostname: string): ConnectionBuilder;
  /** Alias for hostname. */
  host(host: string): ConnectionBuilder;
  /** Sets the port number. */
  port(port: number): ConnectionBuilder;
  /** Sets the path. */
  path(path: string): ConnectionBuilder;
  /** Sets the database (alias for path). */
  database(database: string): ConnectionBuilder;
  /** Sets the username. */
  username(username: string): ConnectionBuilder;
  /** Alias for username. */
  user(user: string): ConnectionBuilder;
  /** Sets the password. */
  password(password: string): ConnectionBuilder;
  /** Sets whether the connection is secure. */
  secure(secure: boolean): ConnectionBuilder;
  /** Sets a query parameter. */
  param(key: string, value: string): ConnectionBuilder;
  /** Sets multiple query parameters. */
  params(params: Record<string, string>): ConnectionBuilder;
  /** Builds and returns a new Connection instance. */
  build(): Connection;
}

/**
 * Connection class that parses connection strings and objects into various formats.
 */
declare class Connection {
  /** The parsed connection properties. */
  connection: Connection.ConnectionSchema;
  /** The parsed authentication properties. */
  auth: Connection.AuthSchema;

  /** Error class for connection-related errors. */
  static ConnectionError: typeof ConnectionError;
  /** Error class for validation errors. */
  static ValidationError: typeof ValidationError;
  /** Error class for parse errors. */
  static ParseError: typeof ParseError;
  /** Error class for protocol errors. */
  static ProtocolError: typeof ProtocolError;

  /**
   * Creates a Connection object that can parse objects or url string to a number of different formats.
   * @param urlOrObject - A URL string or configuration object.
   * @param options - Optional configuration options.
   * @throws {TypeError} If urlOrObject is null, undefined, or an invalid type.
   */
  constructor(urlOrObject: string | Connection.ConnectionInput, options?: Connection.ConnectionOptions);

  /**
   * Creates a new ConnectionBuilder for fluent connection building.
   */
  static builder(): ConnectionBuilder;

  /**
   * Creates a new Connection from a URL or configuration object.
   */
  static from(urlOrObject: string | Connection.ConnectionInput, options?: Connection.ConnectionOptions): Connection;

  /**
   * Parses a URL or configuration object and returns a plain object.
   */
  static parse(urlOrObject: string | Connection.ConnectionInput, options?: Connection.ConnectionOptions): Connection.AuthSchema & Connection.ConnectionSchema;

  /**
   * Checks if a URL or configuration object is valid.
   */
  static isValid(urlOrObject: string | Connection.ConnectionInput, options?: Connection.ConnectionOptions): boolean;

  /**
   * Creates a new Connection from an environment variable.
   * @throws {Error} If the environment variable is not defined.
   */
  static fromEnv(key: string, options?: Connection.ConnectionOptions): Connection;

  /**
   * Creates a new Connection from an environment variable, or returns null if not defined.
   */
  static tryFromEnv(key: string, options?: Connection.ConnectionOptions): Connection | null;

  /**
   * Returns true if either a username or password is present.
   */
  hasAuth(): boolean;

  /**
   * Returns true if a username is present.
   */
  hasUsername(): boolean;

  /**
   * Returns true if a password is present.
   */
  hasPassword(): boolean;

  /**
   * Returns a URI encoded auth string of username:password.
   * If username and password are not present returns an empty string.
   */
  getAuthString(): string;

  /**
   * Gets or sets the username. Stored decoded (raw); URI-encoded only when serialized to a URL.
   * @param username - If provided, sets the username.
   * @returns The current (decoded) username when called without arguments, or this for chaining when setting.
   * @throws {Error} If username is provided but not a string.
   */
  username(): string;
  username(username: string): this;

  /**
   * Gets or sets the password. Stored decoded (raw); URI-encoded only when serialized to a URL.
   * @param password - If provided, sets the password.
   * @returns The current (decoded) password when called without arguments, or this for chaining when setting.
   * @throws {Error} If password is provided but not a string.
   */
  password(): string;
  password(password: string): this;

  /**
   * Gets a query parameter value.
   * @param key - The parameter key.
   * @returns The parameter value or undefined if not found.
   */
  getParam(key: string): string | undefined;

  /**
   * Sets a query parameter value.
   * @param key - The parameter key.
   * @param value - The parameter value.
   * @returns This connection instance for chaining.
   */
  setParam(key: string, value: string): this;

  /**
   * Checks if a query parameter exists.
   * @param key - The parameter key.
   * @returns True if the parameter exists.
   */
  hasParam(key: string): boolean;

  /**
   * Deletes a query parameter.
   * @param key - The parameter key to delete.
   * @returns This connection instance for chaining.
   */
  deleteParam(key: string): this;

  /**
   * Gets all query parameters.
   * @returns Object containing all query parameters.
   */
  getParams(): Record<string, string>;

  /**
   * Gets the URL fragment (hash).
   */
  getFragment(): string;

  /**
   * Sets the URL fragment (hash).
   * @param fragment - The fragment value (without #).
   * @returns This connection instance for chaining.
   */
  setFragment(fragment: string): this;

  /**
   * Checks if a fragment exists.
   */
  hasFragment(): boolean;

  /**
   * Gets all hosts for replica set connections.
   */
  getHosts(): Connection.Host[];

  /**
   * Adds a host to the replica set.
   * @param hostname - The hostname.
   * @param port - The port number (optional, defaults to connection port).
   * @returns This connection instance for chaining.
   */
  addHost(hostname: string, port?: number): this;

  /**
   * Sets all hosts for replica set connections.
   * @param hosts - Array of host objects.
   * @returns This connection instance for chaining.
   */
  setHosts(hosts: Connection.Host[]): this;

  /**
   * Checks if this connection is configured as a replica set.
   */
  isReplicaSet(): boolean;

  /**
   * Creates a deep copy of this connection via a structural copy (no URL round-trip),
   * preserving all properties including those that do not serialize to a URL.
   * @returns A new Connection instance with the same values.
   */
  clone(): Connection;

  /**
   * Returns a new Connection with the specified auth credentials (immutable).
   * Omitted (undefined) arguments leave the cloned connection's existing credentials unchanged.
   * @param username - The username.
   * @param password - The password.
   * @returns A new Connection instance with the updated auth.
   */
  withAuth(username?: string, password?: string): Connection;

  /**
   * Returns a new Connection with the specified port (immutable).
   * @param port - The port number.
   * @returns A new Connection instance with the updated port.
   */
  withPort(port: number): Connection;

  /**
   * Returns a new Connection with the specified hostname (immutable).
   * @param hostname - The hostname.
   * @returns A new Connection instance with the updated hostname.
   */
  withHostname(hostname: string): Connection;

  /**
   * Returns a new Connection with the specified path (immutable).
   * @param path - The path.
   * @returns A new Connection instance with the updated path.
   */
  withPath(path: string): Connection;

  /**
   * Returns a new Connection with the specified protocol (immutable).
   * @param protocol - The protocol.
   * @returns A new Connection instance with the updated protocol.
   */
  withProtocol(protocol: string): Connection;

  /**
   * Returns a new Connection with the specified query parameter (immutable).
   * @param key - The parameter key.
   * @param value - The parameter value.
   * @returns A new Connection instance with the updated parameter.
   */
  withParam(key: string, value: string): Connection;

  /**
   * Returns a new Connection with the specified fragment (immutable).
   * @param fragment - The fragment value.
   * @returns A new Connection instance with the updated fragment.
   */
  withFragment(fragment: string): Connection;

  /**
   * Returns a new Connection with the specified hosts (immutable).
   * @param hosts - Array of host objects.
   * @returns A new Connection instance with the updated hosts.
   */
  withHosts(hosts: Connection.Host[]): Connection;

  /**
   * Checks if this connection equals another connection.
   * @param other - The other connection to compare.
   * @returns True if the connections are equal.
   */
  equals(other: Connection): boolean;

  /**
   * Checks if this connection is similar to another (same protocol, hostname, port).
   * @param other - The other connection to compare.
   * @returns True if the connections are similar.
   */
  isSimilar(other: Connection): boolean;

  /**
   * Returns a string representation of this connection as a URL. Credentials are URI-encoded.
   * When multiple hosts are set (replica sets), all hosts are serialized comma-separated,
   * each with its port when known.
   */
  toUrl(): string;

  /**
   * Returns a string representation of this connection (alias for toUrl).
   */
  toString(): string;

  /**
   * Returns a JSON-serializable representation of this connection.
   */
  toJSON(): Connection.JSONOutput;

  /**
   * Returns a string representation of this connection if the protocol is http or https.
   * @throws {Error} If the protocol is not http or https.
   */
  toHttpUrl(): string;

  /**
   * Returns an object that conforms to the Knex.js connection format.
   */
  toKnexConnection(): Connection.KnexConnection;

  /**
   * Alias for toKnexConnection.
   */
  toKnex(): Connection.KnexConnection;

  /**
   * Returns an object that conforms to the Solr connection format.
   * @throws {Error} If the protocol is not http or https.
   */
  toSolrConnection(): Connection.SolrConnection;

  /**
   * Alias for toSolrConnection.
   */
  toSolr(): Connection.SolrConnection;

  /**
   * Returns a standard connection object with URL and credentials.
   */
  toStandardConnection(): Connection.StandardConnection;

  /**
   * Returns a merged object containing all auth and connection properties.
   */
  toObject(): Connection.AuthSchema & Connection.ConnectionSchema;

  /**
   * Returns an object that conforms to the Sequelize ORM connection format.
   */
  toSequelize(): Connection.SequelizeConfig;

  /**
   * Returns an object that conforms to the TypeORM connection format.
   */
  toTypeORM(): Connection.TypeORMConfig;

  /**
   * Returns the connection URL in Prisma-compatible format.
   */
  toPrisma(): string;

  /**
   * Returns an object that conforms to the MongoDB native driver options format.
   */
  toMongo(): Connection.MongoOptions;

  /**
   * Returns an object that conforms to the Redis client options format.
   */
  toRedis(): Connection.RedisOptions;
}

export = Connection;
