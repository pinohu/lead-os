# Territory Ownership System

## Purpose

Control who owns monetization rights for a node and ensure exclusive provider assignment where required.

## Ownership States

- unclaimed
- claimed_pending
- active_exclusive
- active_backup
- at_risk
- replacement_needed

## Core Rule

A directory node may expose only partner monetization and should enforce exclusivity at the node level when an active exclusive owner exists.

## Claim Flow

1. partner submits claim
2. system records pending claim
3. operator approves or rejects
4. approved claim becomes active owner
5. leads route to active owner

## Data Requirements

Each node ownership record should track:
- nodeId
- ownerId
- state
- billing status
- start date
- optional backup owner
