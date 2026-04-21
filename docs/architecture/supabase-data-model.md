# Supabase Data Model

## Tables

- providers
- nodes
- node_ownership
- subscriptions
- leads
- lead_events

## Identity

Supabase Auth user id should map directly to providers.id.

## Authorization

Use Row Level Security on exposed tables.

Core rule:
- providers can only read leads where leads.owner_id = auth.uid()
- providers can only read ownership rows where owner_id = auth.uid()

## Notes

This model replaces the in-memory lead, ownership, and subscription stores for production.
