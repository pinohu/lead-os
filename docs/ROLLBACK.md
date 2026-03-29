# Rollback Strategy

This document describes how to roll back Lead OS deployments when a release introduces critical issues.

## Decision Criteria

Roll back immediately if any of the following occur after deployment:

- Error rate exceeds 5% of requests.
- Core user flows (campaign creation, lead capture, payment) are broken.
- Data corruption or loss is detected.
- Security vulnerability is exposed.

Do not roll back for cosmetic issues or non-critical bugs. File an issue and fix forward instead.

## Vercel Rollback

Vercel maintains immutable deployments for every commit. Rolling back takes seconds.

1. Open the Vercel dashboard for the Lead OS project.
2. Navigate to **Deployments**.
3. Find the last known good deployment (green checkmark, prior to the bad release).
4. Click the three-dot menu on that deployment and select **Promote to Production**.
5. Verify the rollback by checking the production URL.

**CLI alternative:**

```bash
vercel ls                          # list recent deployments
vercel promote <deployment-url>    # promote a specific deployment to production
```

## Railway Rollback

Railway supports instant rollback to any previous deployment.

1. Open the Railway dashboard for the Lead OS service.
2. Navigate to **Deployments**.
3. Click on the last known good deployment.
4. Click **Rollback** to restore that deployment as the active release.

**CLI alternative:**

```bash
railway status                     # check current deployment
railway rollback                   # roll back to the previous deployment
```

## Docker Rollback

If running Lead OS in a Docker-based environment (self-hosted, ECS, Cloud Run):

1. Identify the last known good image tag:

   ```bash
   docker images lead-os --format "{{.Tag}} {{.CreatedAt}}" | head -10
   ```

2. Tag the previous image as the current release:

   ```bash
   docker tag lead-os:<previous-tag> lead-os:latest
   ```

3. Restart the container with the rolled-back image:

   ```bash
   docker compose down
   docker compose up -d
   ```

4. Verify the container is healthy:

   ```bash
   docker compose ps
   curl -f http://localhost:3000/api/health
   ```

For orchestrated environments (Kubernetes, ECS), update the image tag in the deployment manifest and apply:

```bash
kubectl set image deployment/lead-os lead-os=lead-os:<previous-tag>
kubectl rollout status deployment/lead-os
```

## Database Rollback

Database changes require more caution than application rollbacks. Never roll back a migration without understanding the data impact.

### Running Migration Down Scripts

If the release included database migrations and the down migration is safe:

```bash
npm run migrate:down                # rolls back the most recent migration
```

### When Down Migrations Are Not Safe

If the migration added data, renamed columns, or dropped tables:

1. Do not run the down migration automatically.
2. Assess the impact manually by reviewing the migration file.
3. If data was dropped, restore from the most recent backup (see Emergency Procedures below).
4. Apply a corrective migration that fixes the schema without data loss.

### Point-in-Time Recovery

If the database supports point-in-time recovery (Railway Postgres, AWS RDS, Cloud SQL):

1. Identify the timestamp just before the bad migration ran.
2. Create a new database instance restored to that point in time.
3. Update the application connection string to point to the restored instance.
4. Verify data integrity before routing production traffic.

## Emergency Procedures

### Full Environment Restore

If the entire environment is compromised:

1. **Stop all traffic.** Put the application in maintenance mode or update DNS to a static maintenance page.
2. **Assess the damage.** Determine which components are affected: application, database, third-party integrations.
3. **Restore the application.** Roll back using the platform-specific method above.
4. **Restore the database.** Use the most recent backup or point-in-time recovery.
5. **Verify integrations.** Check Stripe webhooks, email providers, and any external API connections.
6. **Resume traffic.** Remove maintenance mode and monitor closely for 30 minutes.

### Communication During Incidents

1. Post an initial status update within 15 minutes of detection.
2. Update every 30 minutes until resolved.
3. Publish a post-mortem within 48 hours covering: timeline, root cause, impact, remediation, prevention.

### Backup Schedule

| Resource | Frequency | Retention | Method |
|---|---|---|---|
| PostgreSQL | Daily automated | 30 days | Platform managed (Railway/RDS) |
| PostgreSQL | Before each migration | 7 days | Manual `pg_dump` |
| Environment variables | On change | Indefinite | Secrets manager versioning |
| Application state | Every deployment | 90 days | Platform deployment history |

### Restore Verification

Test backup restores monthly:

1. Restore the latest backup to a staging environment.
2. Run the application test suite against the restored database.
3. Verify row counts on critical tables match production within the backup window.
4. Document the restore time (RTO) and data freshness (RPO).
