import { sourcesSearchUrl, sourceByIssnUrl, sourceToEntry, pickBestSource } from '../lib/openalex.js';
import { fetchJson as realFetchJson } from '../lib/http.js';

// Build a full (un-probed) registry entry from a seed + its OpenAlex source.
export function mergeSeedAndSource(seed, src) {
  const base = sourceToEntry(src);
  return {
    ...base,
    name: seed.name || base.name,
    domain: seed.domain,
    field_tags: seed.field_tags || [],
    tier: seed.tier || 'specialist',
    rss: seed.rss_url
      ? { url: seed.rss_url, status: 'none', last_item_date: null, last_checked: null }
      : null,
    backends: [],
    quirks: seed.quirks || null,
    curation: { by: 'seed', verified_at: null },
    added_at: null,
    updated_at: null,
  };
}

// Resolve a seed to its authoritative OpenAlex source. Prefer ISSN lookup
// (deterministic); fall back to name search when the seed has no issn.
export async function resolveSource(seed, { fetchJson = realFetchJson, mailto } = {}) {
  if (seed.issn) {
    const src = await fetchJson(sourceByIssnUrl(seed.issn, mailto));
    if (!src || src.error || !src.id) {
      throw new Error(`no OpenAlex source for issn ${seed.issn} (seed: ${seed.name})`);
    }
    return src;
  }
  const data = await fetchJson(sourcesSearchUrl(seed.name, mailto));
  const best = pickBestSource(data.results || [], seed.name);
  if (!best) throw new Error(`no OpenAlex source for seed: ${seed.name}`);
  return best;
}
