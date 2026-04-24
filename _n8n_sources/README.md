# `_n8n_sources/` — vendored upstream reference trees

This directory contains **third-party template repositories, MCP servers, and workflow collections** copied for offline reference. They are **not** first-party Lead OS product code.

## Maintenance policy

- **Do not** treat README metrics inside these subtrees (test counts, “100% pass”, marketing numbers) as statements about the Lead OS kernel unless explicitly cross-linked from `lead-os-hosted-runtime-wt-hybrid/docs/`.
- When auditing Lead OS itself, start under **`lead-os-hosted-runtime-wt-hybrid/`**, **`erie-pro/`**, **`neatcircle-beta/`**, and top-level **`docs/`** — not here.
- Upgrading or removing a subtree should be a deliberate decision (licenses, size, security); record the upstream commit or tag when you vendor updates.
