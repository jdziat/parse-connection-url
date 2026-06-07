# Security Policy

## Supported Versions

We actively support the following versions with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 1.3.x   | :white_check_mark: |
| 1.2.x   | :white_check_mark: |
| < 1.2   | :x:                |

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security issue, please follow these steps:

### How to Report

**DO NOT** open a public GitHub issue for security vulnerabilities.

Instead, please report security vulnerabilities to:
- **Email:** jordan@dziat.com
- **Subject:** [SECURITY] parse-connection-url vulnerability

### What to Include

Please include the following information in your report:
- Description of the vulnerability
- Steps to reproduce the issue
- Potential impact
- Suggested fix (if available)
- Your contact information

### Response Timeline

- **Initial Response:** Within 48 hours
- **Status Update:** Within 5 business days
- **Fix Timeline:** Depends on severity (critical issues within 7 days)

### Security Update Process

1. We will confirm receipt of your report
2. We will investigate and validate the vulnerability
3. We will develop and test a fix
4. We will release a security patch
5. We will publicly disclose the vulnerability (with credit to reporter if desired)

## Security Best Practices

When using this library:

### Input Validation
Always validate connection strings from untrusted sources:

```javascript
try {
  const conn = new Connection(untrustedInput)
  // Additional validation here
} catch (err) {
  // Handle invalid input
  console.error('Invalid connection string:', err.message)
}
```

### Credential Handling
Never log or expose connection objects that contain credentials:

```javascript
// BAD - exposes credentials
console.log(conn.toUrl())

// GOOD - redact credentials
const safeUrl = conn.toUrl().replace(/:\/\/[^@]+@/, '://***:***@')
console.log(safeUrl)
```

### Length Limits
Be aware of potential DoS via extremely long connection strings. Consider implementing length limits:

```javascript
const MAX_URL_LENGTH = 2048

if (urlString.length > MAX_URL_LENGTH) {
  throw new Error('Connection string exceeds maximum length')
}

const conn = new Connection(urlString)
```

### Special Characters
The library handles URL encoding/decoding, but be aware of special characters in credentials:

```javascript
// Automatically handled
const conn = new Connection('http://user:p@ss:w0rd@localhost')
// Password is properly URL-encoded
```

## Known Security Considerations

### 1. Dev Dependencies
This package has zero runtime dependencies. Security vulnerabilities in devDependencies do not affect production usage.

### 2. Input Validation
The library validates connection strings, but applications should implement additional business logic validation as needed.

### 3. Credential Storage
This library parses connection strings but does not store credentials securely. Applications should:
- Use environment variables for sensitive data
- Never commit credentials to version control
- Use secret management systems in production

### 4. Regular Expression Denial of Service (ReDoS)
The library uses regular expressions for parsing. While we've designed them to be safe, extremely malformed input could potentially cause performance issues. Implement timeouts or length limits for untrusted input.

## Security Updates

Security updates will be released as patch versions (e.g., 1.3.5) and announced via:
- GitHub Security Advisories
- NPM package updates
- Release notes

We recommend:
- Keep your dependencies up to date
- Monitor GitHub security advisories
- Use `npm audit` regularly
- Enable Dependabot alerts

## Acknowledgments

We appreciate the security research community's efforts in responsibly disclosing vulnerabilities. Security researchers will be acknowledged in release notes (unless they prefer to remain anonymous).

## Contact

For non-security related issues, please use:
- GitHub Issues: https://github.com/jdziat/parse-connection-url/issues

For security concerns only:
- Email: jordan@dziat.com

---

Last Updated: December 25, 2025
