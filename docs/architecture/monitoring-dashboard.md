# Monitoring Dashboard

## Purpose

Provide operators with a real-time view of marketplace health, delivery reliability, billing-risk states, and territory coverage.

## Core Panels

- delivery health
- queue depth
- dead-letter jobs
- ownership status summary
- subscription status summary
- lead throughput

## Core Rule

Operators should be able to detect system degradation within one page view.

## Data Sources

- delivery_jobs
- delivery_events
- dead_letter_jobs
- node_ownership
- subscriptions
- leads

## Initial Scope

- summary counts
- recent failures
- recent dead-letter jobs
- basic throughput numbers

## Future Scope

- charts
- SLA trends
- alert acknowledgment
- replay actions
