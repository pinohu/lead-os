# Provider Authentication

## Purpose

Restrict provider dashboard access to authenticated users and map each authenticated provider to the territories they own.

## Core Flow

1. provider account exists
2. provider logs in
3. session cookie is issued
4. dashboard resolves owner identity from session
5. dashboard only shows leads for that owner

## Core Rule

A provider may only access dashboards and lead data associated with their ownerId.

## Initial Implementation

- local provider account store
- local session store
- cookie-based session lookup
- dashboard guard

## Future Extension

- replace local accounts with managed auth provider
- tie claims and billing to provider identity
- add role-based operator/admin access
