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
