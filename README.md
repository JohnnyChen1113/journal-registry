# journal-registry

Auto-maintained, open registry of scientific journals (evolution / genomics /
molecular biology + medicine). Single source of truth: `data/registry.json`.
Regenerated weekly from OpenAlex with deterministic RSS health-checks.

- `data/registry.json` — full entries
- `data/index.json` — slim list
- `data/by-field/<field>.json` — sharded by field
- `data/journals/<issn_l>.json` — one file per journal
- `derivatives/registry.csv`, `derivatives/registry.opml`

License: CC0-1.0 (public domain).

## Regeneration

`node scripts/build.js` rebuilds all data from `seeds/seed-journals.json`:
resolves each seed against OpenAlex, health-checks its RSS feed, and writes
`data/` + `derivatives/`. CI runs this weekly (`.github/workflows/refresh.yml`)
and commits any changes. Set the `OPENALEX_MAILTO` secret to use OpenAlex's
faster "polite pool".

## Backends

Each journal lists fetch backends in priority order: `rss` (only when the feed
is `live`), then `crossref` and `openalex` (whenever an ISSN is known). A
journal with no working RSS feed is still fully usable via the APIs.
