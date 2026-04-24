# Lead OS Incident Response Runbook

> **Scope:** Internal procedures for teams operating a Lead OS deployment. **Customer-facing emails, Slack channels, and phone trees are yours to configure.** Replace `YOUR_SUPPORT_EMAIL` in templates. Admin-style HTTP routes (`/api/admin/*`) require appropriate authentication in production — verify against OpenAPI (`/api/docs/openapi.json`) before relying on them in an incident.

## 1. Severity Levels

| Level | Description | Response Time | Escalation |
|-------|-------------|---------------|------------|
| **P1 - Critical** | Complete service outage, data breach, or security compromise affecting all tenants | 15 minutes | Immediate page to on-call + engineering lead + CTO |
| **P2 - High** | Partial outage, degraded performance >50% of requests, single-tenant data issue | 30 minutes | Page on-call + engineering lead |
| **P3 - Medium** | Non-critical feature failure, elevated error rates <10%, single integration down | 2 hours | Slack alert to engineering channel |
| **P4 - Low** | Cosmetic issues, non-urgent bugs, monitoring false positives | Next business day | Ticket in issue tracker |

## 2. Response Procedures

### 2.1 Detection

- **Automated**: Health check failures (`/api/health/deep`), error rate spikes, latency alerts
- **Manual**: Customer reports, team observations, third-party status pages
- **Audit trail**: Anomalous patterns in `/api/admin/traces` or compliance reports

### 2.2 Triage (First 15 Minutes)

1. Confirm the incident is real (not a false positive)
2. Assess severity level using the table above
3. Open an incident channel (Slack: `#incident-YYYY-MM-DD-NNN`)
4. Assign an Incident Commander (IC)
5. Begin timeline documentation

### 2.3 Containment

- **API issues**: Enable maintenance mode via feature flag or environment variable
- **Security breach**: Rotate all affected credentials, revoke compromised sessions
- **Data corruption**: Isolate affected tenant, halt writes to affected tables
- **Rate limiting**: Tighten endpoint limits via `ENDPOINT_LIMITS` configuration
- **Dependency failure**: Activate circuit breakers, switch to fallback providers

### 2.4 Resolution

1. Identify root cause through logs (`/api/admin/traces`), audit trail, and metrics
2. Implement fix (hotfix branch for P1/P2, standard PR for P3/P4)
3. Deploy fix with monitoring enabled
4. Verify resolution via health checks and affected user confirmation
5. Stand down incident channel

### 2.5 Post-Mortem (Within 48 Hours)

1. Document timeline of events with timestamps
2. Identify root cause and contributing factors
3. List action items with owners and deadlines
4. Review detection gaps and improve monitoring
5. Share post-mortem with stakeholders

## 3. Communication Templates

### Internal Alert

```
INCIDENT [P1/P2/P3/P4]: [Brief description]
Time detected: [ISO timestamp]
Impact: [Number of affected tenants/requests]
Status: [Investigating / Identified / Monitoring / Resolved]
IC: [Name]
Channel: #incident-[date]-[number]
```

### Customer Notification

```
Subject: [Service Disruption / Maintenance] - Lead OS

We are aware of an issue affecting [description of impact].

Current status: [Investigating / Working on fix / Monitoring]
Started: [Time]
Estimated resolution: [Time or "Investigating"]

We will provide updates every [30 minutes / 1 hour].

For urgent inquiries, contact YOUR_SUPPORT_EMAIL (from `NEXT_PUBLIC_SUPPORT_EMAIL` or your ticketing system).
```

### Post-Mortem Summary

```
Incident: [Title]
Date: [Date]
Duration: [Start - End]
Severity: [P1-P4]
Impact: [Quantified impact]

Root cause: [1-2 sentence summary]
Resolution: [What was done to fix it]

Action items:
- [ ] [Action] - Owner: [Name] - Due: [Date]
```

## 4. Escalation Matrix

| Trigger | Action |
|---------|--------|
| P1 not acknowledged in 15 min | Auto-escalate to CTO |
| P2 not acknowledged in 30 min | Auto-escalate to engineering lead |
| Any incident open >4 hours | Notify leadership |
| Data breach confirmed | Notify legal, begin breach protocol |
| Third consecutive P1 in 30 days | Trigger architecture review |

## 5. Recovery Procedures

### Database Recovery

1. Identify last known good state from WAL logs
2. Create point-in-time recovery target
3. Restore to isolated instance for verification
4. Swap traffic after validation
5. Verify data integrity via compliance reports (`/api/admin/compliance?report=access-review`)

### Service Restart

1. Check health endpoint: `GET /api/health/deep`
2. Review recent deployments for regression
3. Rolling restart of application instances
4. Monitor error rates for 15 minutes post-restart
5. Confirm resolution via deep health check

### Rollback

1. Identify target deployment version
2. Execute rollback via deployment platform
3. Verify rollback success with health checks
4. Monitor for 30 minutes
5. Document rollback in incident timeline

## 6. Contact Information

| Role | Primary | Backup |
|------|---------|--------|
| Incident Commander | [Configure in environment] | [Configure in environment] |
| Engineering Lead | [Configure in environment] | [Configure in environment] |
| Security Lead | [Configure in environment] | [Configure in environment] |
| Communications | [Configure in environment] | [Configure in environment] |

Update contacts in your deployment environment variables or team directory.
