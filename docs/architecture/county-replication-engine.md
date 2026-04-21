# County Replication Engine

## Purpose

Convert the Erie county model into a portable, data-driven system that can be replicated across every county in the United States.

## Core Principle

Nothing county-specific should be hardcoded in page logic. County behavior should come from data and overrides.

## Replication Layers

1. National niche authority layer
2. State niche hub layer
3. County hub layer
4. City/service node layer

## County Profile Requirements

Each county profile should define:
- county name
- state
- FIPS or stable county identifier
- population band
- major cities
- service seasonality
- trust signals
- regulatory/licensing notes
- content overrides
- monetization priority

## Engine Outputs

For each county and niche combination:
- county hub record
- city/service nodes
- template family
- AI config
- partner monetization profile
- affiliate allowance policy

## Monetization Rule

- county and city nodes prioritize partner acquisition and exclusive provider monetization
- authority properties monetize affiliates at scale
- post-lead flows can enable hybrid offers
