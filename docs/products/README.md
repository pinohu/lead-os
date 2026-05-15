# Products

Marketing assets and release artifacts for digital products sold through Erie.pro's ThriveCart/ConvertBox infrastructure.

Each product gets its own subdirectory keyed by slug, with versioned subfolders for each release iteration.

## Current products

### `suitedash-good-parts/v1.0/`

The $47 SuiteDash configuration guide. First product in the Operator's Library series.

- `suitedash-good-parts-v1.0.pdf` — the deliverable (58 pages)
- `listing.md` — marketing description for the sales page and ThriveCart product description field
- `thrivecart-convertbox-setup.md` — operator spec: persona, ConvertBox copy variants, sales page copy, ThriveCart product config, post-purchase email, abandonment email, wiring sequence
- `chapter24-playbook.md` — the new closing chapter source (for use as a freebie / sample / lead magnet)

See `/docs/developer-handoff/05-SUITEDASH-PDF-RELEASE.md` for the full release plan and operational status.

**Source repo for the PDF:** `pinohu/SuiteDash` (private after launch). The same release v1.0 assets are mirrored there at `release/v1.0/` for source-of-truth purposes.

## Conventions

- One folder per product slug.
- Versioned subfolders (`v1.0/`, `v1.1/`, ...) for each release.
- The PDF (or other deliverable) lives at the top of its version folder.
- A `listing.md` with the canonical marketing copy is always present.
- A `setup.md` (or similar) with operational/wiring details is always present.
