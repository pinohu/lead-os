# Lead OS SOC 2 Controls Mapping

> **Governance note:** This mapping is a **design-time control catalog** for engineering and auditors. It is **not** a certificate, attestation report, or guarantee that every referenced file path exists in every deployment variant. Validate each control against the branch you ship before customer-facing claims.

This document maps Lead OS platform features to SOC 2 Type II Trust Service Criteria.

## CC6.1 - Logical Access Security

**Requirement**: The entity implements logical access security measures to protect against unauthorized access.

| Control | Implementation | Location |
|---------|---------------|----------|
| Role-Based Access Control | Four-tier RBAC (owner, admin, member, viewer) with permission checks on every API route | `src/lib/auth-system.ts`, `src/lib/auth-middleware.ts` |
| API Key Authentication | Scoped API keys with `los_` prefix, SHA-256 hashed storage, per-key permission grants | `src/lib/auth-system.ts` |
| Session Management | Cryptographic session tokens (`sess_` prefix) with configurable TTL and secure cookie binding | `src/lib/auth-middleware.ts` |
| Two-Factor Authentication | TOTP-based 2FA with backup codes, zero external dependencies (Node.js crypto only) | `src/lib/totp.ts`, `src/app/api/auth/2fa/` |
| Operator Authentication | Magic-link email login with HMAC-SHA256 token verification | `src/lib/operator-auth.ts` |
| IP Allowlisting | CIDR-aware IP restriction per tenant with IPv4 parsing and subnet matching | `src/lib/ip-allowlist.ts` |

## CC6.2 - Credential Management

**Requirement**: Prior to issuing system credentials, the entity registers and authorizes new users and manages credentials.

| Control | Implementation | Location |
|---------|---------------|----------|
| Credential Vault | AES-256-GCM encrypted credential storage with SCRYPT key derivation | `src/lib/credential-vault.ts` |
| API Key Rotation | Key creation with automatic prefix-based identification, revocation support | `src/lib/auth-system.ts` |
| Secret Management | Environment-based secrets with validation at startup, no plaintext storage | `src/lib/tenant.ts`, `.env` configuration |
| Password-Free Auth | Magic link authentication eliminates password-related vulnerabilities | `src/lib/operator-auth.ts` |

## CC6.3 - Least Privilege

**Requirement**: The entity authorizes, modifies, or removes access in accordance with least privilege.

| Control | Implementation | Location |
|---------|---------------|----------|
| Permission-Based API Keys | API keys scoped to specific permissions (read:leads, write:leads, etc.) | `src/lib/auth-system.ts` |
| Role Hierarchy | Graduated permissions: viewer < member < admin < owner | `src/lib/auth-system.ts` |
| Route-Level Authorization | `requireAuth(request, permission)` enforces minimum permission per endpoint | `src/lib/auth-middleware.ts` |
| Tenant Isolation | All data access filtered by `tenantId`, preventing cross-tenant access | `src/lib/tenant.ts` |

## CC7.1 - System Monitoring

**Requirement**: The entity monitors system components to detect anomalies indicative of malicious acts.

| Control | Implementation | Location |
|---------|---------------|----------|
| Audit Trail | Comprehensive logging of all auth events, agent actions, and configuration changes | `src/lib/agent-audit-log.ts` |
| Request Tracing | Distributed trace IDs on all API requests with timing and status capture | `src/app/api/admin/traces/` |
| Health Monitoring | Multi-level health checks (basic, deep) with dependency status reporting | `src/app/api/health/` |
| Compliance Reports | On-demand generation of access reviews, encryption audits, session reports, retention reports | `src/lib/compliance.ts` |

## CC7.2 - Incident Detection

**Requirement**: The entity monitors for, and detects, anomalies that could indicate incidents.

| Control | Implementation | Location |
|---------|---------------|----------|
| Rate Limiting | Per-endpoint, per-tenant, and per-IP rate limiting with sliding window algorithm | `src/lib/rate-limiter.ts` |
| Anomaly Alerts | High failure rate detection (>10%) and spend alerts in audit summaries | `src/lib/agent-audit-log.ts` |
| Security Headers | CSP, HSTS, X-Frame-Options, X-Content-Type-Options on all responses | `next.config.ts` middleware |
| Incident Response | Documented runbook with severity levels, escalation matrix, and recovery procedures | `docs/INCIDENT-RESPONSE.md` |

## CC8.1 - Change Management

**Requirement**: The entity authorizes, designs, develops, configures, documents, tests, approves, and implements changes.

| Control | Implementation | Location |
|---------|---------------|----------|
| Configuration Audit | All tenant configuration changes logged with before/after state | `src/lib/agent-audit-log.ts` |
| Database Migrations | Versioned SQL migrations with rollback support | `src/lib/migrations.ts` |
| API Versioning | Date-based API versioning (2026-03-30) with OpenAPI 3.1.0 specification | `src/lib/openapi-spec.ts` |
| Feature Flags | A/B experiment framework for controlled feature rollout | `src/app/api/experiments/` |

## CC9.1 - Risk Assessment

**Requirement**: The entity identifies, analyzes, and manages risks.

| Control | Implementation | Location |
|---------|---------------|----------|
| Encryption Verification | Automated checks for vault encryption, DB SSL, cookie security, HSTS, API key hashing | `src/lib/compliance.ts` |
| Access Reviews | Automated user activity analysis with 90-day inactivity flagging | `src/lib/compliance.ts` |
| Data Retention | Configurable retention policy with automated expired-entry identification | `src/lib/compliance.ts` |
| Session Auditing | Login/logout/2FA event tracking with recent event reporting | `src/lib/compliance.ts` |

## Audit Evidence Endpoints

| Endpoint | Report Type | Access |
|----------|-------------|--------|
| `GET /api/admin/compliance?report=encryption` | Encryption controls status | `read:settings` |
| `GET /api/admin/compliance?report=access-review` | User access review | `read:settings` |
| `GET /api/admin/compliance?report=sessions` | Authentication events | `read:settings` |
| `GET /api/admin/compliance?report=retention` | Data retention status | `read:settings` |
| `GET /api/admin/traces` | Request trace log | `read:settings` |
| `GET /api/docs/openapi.json` | API specification | Public |
