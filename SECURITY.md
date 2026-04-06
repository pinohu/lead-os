# Security Policy

## Supported Versions

| Project | Version | Supported |
|---------|---------|-----------|
| lead-os-hosted-runtime-wt-hybrid | 0.1.x | Yes |
| erie-pro | 0.1.x | Yes |
| neatcircle-beta | 0.1.x | Yes |
| lead-os-hosted-runtime-wt-public | 0.1.x | Yes |

## Reporting a Vulnerability

If you discover a security vulnerability in this project, please report it responsibly.

**Do NOT open a public GitHub issue for security vulnerabilities.**

Instead, please email security concerns to the repository owner. Include:

1. Description of the vulnerability
2. Steps to reproduce
3. Potential impact
4. Suggested fix (if any)

We aim to acknowledge reports within 48 hours and provide a fix within 7 days for critical issues.

## Security Practices

This project follows these security practices:

- Strict TypeScript with all strictness flags enabled
- Parameterized SQL queries (zero string interpolation in queries)
- Zod validation on all API route inputs
- SHA-pinned GitHub Actions to prevent supply chain attacks
- Timing-safe secret comparisons using `crypto.timingSafeEqual`
- SSRF protection with private IP blocklists
- Security headers (HSTS, X-Frame-Options, CSP, etc.)
- No hardcoded secrets — all sourced from environment variables
