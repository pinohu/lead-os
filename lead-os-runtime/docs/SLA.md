# Lead OS Service Level Agreement (SLA)

**Effective Date:** March 30, 2026
**Last Updated:** March 30, 2026
**Version:** 1.0

---

## 1. Service Level Commitment

Lead OS commits to a **99.9% monthly uptime** for all production services, measured as the percentage of time the platform's core API endpoints respond successfully within each calendar month.

### 1.1 Uptime Calculation

```
Monthly Uptime % = ((Total Minutes - Downtime Minutes) / Total Minutes) * 100
```

- **Total Minutes**: All minutes in the calendar month.
- **Downtime Minutes**: Minutes during which the platform returns HTTP 5xx errors or is unreachable from two or more monitoring regions, **excluding** Scheduled Maintenance Windows.

### 1.2 Covered Services

| Service              | Endpoint                | SLA Target |
| -------------------- | ----------------------- | ---------- |
| Core API             | `/api/*`                | 99.9%      |
| Dashboard            | `/dashboard`            | 99.9%      |
| Webhook Delivery     | Outbound webhook POST   | 99.5%      |
| Agent Execution      | Background agent runs   | 99.5%      |

---

## 2. Scheduled Maintenance

- **Window**: Tuesdays, 02:00 - 04:00 UTC
- **Advance Notice**: Minimum 72 hours via email and status page
- **Emergency Maintenance**: May occur outside windows with best-effort advance notice (minimum 4 hours)
- Scheduled maintenance is **excluded** from downtime calculations.

---

## 3. Service Credits

If Lead OS fails to meet the monthly uptime commitment, eligible customers may request a service credit applied to the next billing cycle.

| Monthly Uptime       | Credit (% of Monthly Fee) |
| -------------------- | ------------------------- |
| 99.0% -- 99.9%       | 10%                       |
| 95.0% -- 99.0%       | 25%                       |
| Below 95.0%          | 50%                       |

### 3.1 Credit Request Process

1. Submit a request within 30 days of the affected month.
2. Include dates, times (UTC), and affected services.
3. Credits are reviewed and applied within 15 business days.
4. Maximum credit per month: 50% of that month's fees.

---

## 4. Exclusions

This SLA does **not** apply to downtime caused by:

- **Force Majeure**: Natural disasters, war, government actions, pandemics.
- **Customer Actions**: Misconfiguration, exceeding rate limits, or abuse.
- **Third-Party Services**: Outages of upstream providers (DNS, CDN, payment processors) unless Lead OS fails to activate documented failover mechanisms.
- **Alpha/Beta Features**: Services explicitly marked as preview or experimental.
- **Scheduled Maintenance**: As defined in Section 2.

---

## 5. Monitoring and Reporting

### 5.1 Synthetic Monitoring

- **Frequency**: Every 60 seconds
- **Regions**: US-East, EU-West, AP-Southeast (minimum 3)
- **Protocol**: HTTPS GET to `/api/health` and `/api/health/deep`
- **Alerting Threshold**: 2 consecutive failures from 2+ regions triggers an incident

### 5.2 Status Page

- **Public URL**: `https://status.leadgen-os.com`
- Real-time component status, uptime history (30-day and 90-day), and incident timeline.
- Subscribers receive email/SMS notifications for status changes.

---

## 6. Incident Response

### 6.1 Severity Levels

| Priority | Definition                                       | Response Time | Update Frequency |
| -------- | ------------------------------------------------ | ------------- | ---------------- |
| P1       | Complete service outage or data loss risk         | 15 minutes    | Every 30 minutes |
| P2       | Major feature degraded, no workaround             | 1 hour        | Every 2 hours    |
| P3       | Minor feature degraded, workaround available      | 4 hours       | Every 8 hours    |
| P4       | Cosmetic issue or documentation question          | 24 hours      | Best effort      |

### 6.2 Incident Communication

- P1/P2 incidents are posted to the status page within the response time above.
- A post-incident report (PIR) is published within 5 business days of P1 resolution.
- PIR includes root cause, timeline, impact scope, and preventive measures.

---

## 7. Performance SLA

| Metric                     | Target              |
| -------------------------- | ------------------- |
| API Response Time (p50)    | < 200 ms            |
| API Response Time (p95)    | < 500 ms            |
| API Response Time (p99)    | < 1,500 ms          |
| Webhook Delivery (p95)     | < 5 seconds         |
| Dashboard Load (p95)       | < 3 seconds         |

Performance targets are measured across all monitoring regions and exclude client-side network latency.

---

## 8. Data Protection

- **Backup Frequency**: Continuous WAL streaming with daily full snapshots.
- **Recovery Point Objective (RPO)**: < 1 hour.
- **Recovery Time Objective (RTO)**: < 4 hours.
- **Retention**: 30-day backup retention with geographic redundancy.

---

## 9. Contact

- **Support Portal**: https://support.leadgen-os.com
- **Email**: support@leadgen-os.com
- **Emergency Hotline**: Available to Enterprise plan customers (details in onboarding pack).

---

*This SLA is subject to the Lead OS Terms of Service. In the event of conflict, the Terms of Service prevail.*
