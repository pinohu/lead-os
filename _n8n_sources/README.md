# `_n8n_sources/` — vendored upstream reference trees

This directory contains **third-party template repositories, MCP servers, and workflow collections** copied for offline reference. They are **not** first-party Lead OS product code.

> Security notice: some upstream examples include runnable `.env`, Docker, and compose files with intentionally weak demo defaults. Do not run anything in this directory against a public network without reviewing and replacing every credential, auth setting, exposed port, and webhook target first.

> Windows checkout notice: several upstream filenames are long. Clone close to the drive root or enable `git config --global core.longpaths true` before checkout on Windows.

## Maintenance policy

- **Do not** treat README metrics inside these subtrees (test counts, “100% pass”, marketing numbers) as statements about the Lead OS kernel unless explicitly cross-linked from `lead-os-hosted-runtime-wt-hybrid/docs/`.
- When auditing Lead OS itself, start under **`lead-os-hosted-runtime-wt-hybrid/`**, **`erie-pro/`**, **`neatcircle-beta/`**, and top-level **`docs/`** — not here.
- Upgrading or removing a subtree should be a deliberate decision (licenses, size, security); record the upstream commit or tag when you vendor updates.
