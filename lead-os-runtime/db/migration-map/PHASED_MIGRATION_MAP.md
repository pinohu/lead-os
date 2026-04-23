## Phased migration map

This map aligns the requested phase names to the canonical executable migration files in `db/migrations`.

| Requested phase file | Canonical executable migration |
|---|---|
| `001_init_core.sql` | `001_initial_schema.sql` |
| `002_nodes.sql` | `006_pricing_production.sql` |
| `003_routing_delivery.sql` | `003_additional_tables.sql` |
| `004_tenants.sql` | `002_multi_tenant.sql` |
| `005_billing.sql` | `007_billing_entitlements_audit.sql` |
| `006_pricing_foundation.sql` | `005_pricing_autopilot.sql` + `006_pricing_production.sql` |
| `007_operator_audit.sql` | `007_billing_entitlements_audit.sql` (`operator_audit_log`) |
| `008_idempotency.sql` | `008_idempotency_records.sql` |
| `009_stripe_webhooks.sql` | `009_stripe_webhook_idempotency_billing_cols.sql` |
| `010_erie_directory_seed.sql` | `010_erie_directory_seed.sql` |
| `011_gtm_use_case_statuses.sql` | `011_gtm_use_case_statuses.sql` |
