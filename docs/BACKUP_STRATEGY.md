# Backup Strategy

## PostgreSQL Backups

### Automated Daily Backups

```bash
# pg_dump with compression
pg_dump -Fc -Z 9 "$DATABASE_URL" > "backup_$(date +%Y%m%d_%H%M%S).dump"

# Upload to S3 or equivalent
aws s3 cp backup_*.dump s3://lead-os-backups/daily/
```

### Point-in-Time Recovery (PITR)

For production deployments, enable WAL archiving:

```
# postgresql.conf
wal_level = replica
archive_mode = on
archive_command = 'aws s3 cp %p s3://lead-os-wal/%f'
```

### Managed Platform Backups

| Platform | Backup Method | Retention |
|----------|--------------|-----------|
| Railway | Automatic daily snapshots | 7 days |
| Vercel Postgres | Automatic daily | 7 days (Pro), 30 days (Enterprise) |
| AWS RDS | Automated backups + snapshots | Configurable (1-35 days) |

## Restore Procedures

### From pg_dump

```bash
pg_restore -d "$DATABASE_URL" --clean --if-exists backup.dump
```

### From WAL (Point-in-Time)

```bash
pg_restore -d "$DATABASE_URL" base_backup.dump
# Set recovery_target_time in recovery.conf
# Replay WAL files up to target time
```

### From Railway

```bash
railway db:restore --snapshot <snapshot-id>
```

## Backup Verification

- **Weekly:** Restore latest backup to a test database, run health check queries
- **Monthly:** Full restore drill — verify data integrity, row counts, and application startup
- **Quarterly:** Document restore time and update this runbook

## Data Retention

| Data Type | Retention | Backup Frequency |
|-----------|-----------|-----------------|
| Lead data | 2 years | Daily |
| Session data | 30 days | Not backed up (ephemeral) |
| Audit logs | 1 year | Daily |
| Configuration | Indefinite | With every deployment |
| Metrics | 90 days | Weekly aggregates |

## Emergency Contacts

- Database issues: Check Railway/Vercel status page first
- Data recovery: Follow restore procedure above
- Escalation: Open GitHub issue with `priority:critical` label
