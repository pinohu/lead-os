# Real ROI and Revenue Tracking

## Purpose

Replace lead-volume proxy metrics with actual closed-deal and revenue-based performance tracking.

## Core Entities

- leads
- deals
- deal_events
- subscriptions

## Core Rule

ROI should be based on real outcomes wherever possible:
- booked jobs
- closed deals
- attributed revenue

## Minimal Model

Each lead can progress through pipeline states:
- new
- contacted
- booked
- closed
- lost

Closed leads should record:
- revenue amount
- closed_at timestamp
- optional notes

## Derived Metrics

- close rate
- booked rate
- revenue by territory
- revenue by provider
- actual ROI versus subscription cost
