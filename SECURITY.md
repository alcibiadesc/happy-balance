# Security Policy

## 🔒 Our Commitment

Happy Balance takes security seriously. As a privacy-focused personal finance application, we understand the critical importance of protecting your financial data.

## 🛡️ Security Features

- **Local-first**: All data stays on your infrastructure
- **No telemetry**: Zero tracking or analytics
- **Encrypted passwords**: bcrypt hashing for all passwords
- **JWT authentication**: Secure token-based authentication
- **CORS protection**: Configured CORS policies
- **SQL injection prevention**: Prisma ORM with parameterized queries
- **Input validation**: Zod schemas for all user inputs

## 🚨 Reporting a Vulnerability

We appreciate your help in making Happy Balance more secure. If you discover a security vulnerability, please:

1. **DO NOT** create a public GitHub issue
2. Instead, please report it through:
   - GitHub Security Advisory: [Report a vulnerability](https://github.com/alcibiadesc/happy-balance/security/advisories/new)
   - Or email us (when available)

### What to Include

Please provide:
- Description of the vulnerability
- Steps to reproduce the issue
- Potential impact
- Any suggested fixes (if you have them)

## ⚡ Response Time

- **Critical vulnerabilities**: Within 24 hours
- **High severity**: Within 3 days
- **Medium/Low severity**: Within 7 days

## 🎯 Scope

The following are in scope for security reports:

- Authentication/authorization issues
- Data exposure or leakage
- SQL injection vulnerabilities
- XSS (Cross-Site Scripting)
- CSRF (Cross-Site Request Forgery)
- Remote Code Execution
- Privilege escalation

## 🚫 Out of Scope

- Denial of Service (DoS) attacks
- Social engineering
- Physical attacks
- Attacks requiring physical access to user's device

## 📋 Security Best Practices for Users

1. **Change default credentials immediately**
2. **Use strong, unique passwords**
3. **Keep your instance updated**
4. **Use HTTPS in production**
5. **Restrict database access**
6. **Regular backups**
7. **Monitor access logs**

## 🔄 Updates

Security updates will be released as soon as possible after a vulnerability is confirmed. We recommend:

- Following our releases page
- Updating promptly when security updates are available
- Subscribing to security advisories

## 🏅 Recognition

We appreciate security researchers who help us keep Happy Balance secure. With your permission, we'll acknowledge your contribution in our security hall of fame.

---

Thank you for helping keep Happy Balance secure for everyone! 🔐