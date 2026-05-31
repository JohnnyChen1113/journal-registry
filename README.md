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

## Growing the registry

Two deterministic CI passes keep the registry fresh (no LLM, no API keys):

- **`node scripts/backfill-rss.js`** — finds real RSS feeds for journals currently
  served only by API (probes homepage `<link rel=alternate>` + publisher patterns,
  health-checks them) and writes discovered feed URLs back into the seeds.
- **`node scripts/discover.js`** — derives the registry's topic fingerprint from its
  own journals, asks OpenAlex which sources publish heavily in those topics, and
  queues in-scope newcomers into `review/boundary-review.json` (`status: pending`).

Curation is on-demand and human-approved: follow `prompts/curate-candidates.md` to
mark entries `approved`/`rejected`, then `node scripts/promote.js` appends approved
journals to the seeds and `node scripts/build.js` regenerates. The seed file stays
the single source of truth.
