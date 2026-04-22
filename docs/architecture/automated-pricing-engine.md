# Automated Pricing Engine

## Purpose

Adjust territory pricing based on real marketplace conditions instead of static flat pricing.

## Inputs

- lead volume by territory
- closed revenue by territory
- provider ROI
- active subscription state
- churn risk

## Core Rules

- high demand + high ROI territories should support price increases
- low demand + low ROI territories should be discounted or flagged for intervention
- pricing changes should be recommendation-first before becoming automatic

## Pricing Bands

- starter
- standard
- premium
- dominant

## Example Heuristics

- if territory lead volume is high and provider ROI > 5x → raise price band
- if lead volume is low and churn risk is high → lower price band or apply rescue offer
- if territory is unclaimed but lead volume is high → mark as premium acquisition target
