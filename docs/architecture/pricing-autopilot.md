# Pricing Autopilot

## Purpose

Allow the system to auto-approve and auto-apply pricing changes only when strict safety conditions are met.

## Core Rules

- default is manual review
- only low-risk recommendations may be auto-approved
- only bounded price changes may be auto-applied
- grandfathered accounts are never auto-applied
- every autonomous decision must be logged

## Suggested Safe Thresholds

- churn risk must be LOW
- ROI must be >= 5
- lead volume must be >= 25
- price increase must be <= 20 percent from current price
- no auto-apply on price decreases without an explicit rescue policy

## States

- proposed
- auto_approved
- approved
- auto_applied
- applied
- rejected
- failed

## Required Audit Data

- recommendation id
- node id
- owner id
- current price
- new price
- mode
- trigger reason
- autonomous decision type
- timestamp
