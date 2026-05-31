// scripts/discover.js
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { worksByTopicGroupUrl, parseSourceGroups, aggregateTopics } from '../lib/discover.js';
import { sourceByIssnUrl, sourceToEntry } from '../lib/openalex.js';
import { fetchJson as realFetchJson } from '../lib/http.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MIN_COUNT = 60;   // min works in the topic window to be worth reviewing

export function selectCandidates(groups, { knownSourceIds, minCount }) {
  const known = new Set(knownSourceIds);
  return groups.filter((g) => g.count >= minCount && !known.has(g.sourceId));
}

export function toReviewEntries(sources, discoveredAt) {
  return sources.map((src) => ({
    ...sourceToEntry(src),
    suggested_field_tags: (src.topics || []).slice(0, 3).map((t) => (t.display_name || '').toLowerCase()),
    status: 'pending',
    discovered_at: discoveredAt,
  }));
}

async function run() {
  const mailto = process.env.OPENALEX_MAILTO || undefined;
  const today = new Date().toISOString().slice(0, 10);
  const fromDate = `${new Date().getUTCFullYear() - 1}-01-01`;
  const registry = JSON.parse(await readFile(join(ROOT, 'data', 'registry.json'), 'utf-8'));
  const knownSourceIds = registry.map((e) => e.openalex_source_id).filter(Boolean);

  // 1. Topic fingerprint: fetch each known source, aggregate its topics.
  const knownSources = [];
  for (const e of registry) {
    if (!e.issn_l) continue;
    try { knownSources.push(await realFetchJson(sourceByIssnUrl(e.issn_l, mailto))); }
    catch { /* skip unresolvable */ }
  }
  const topicIds = aggregateTopics(knownSources, 25);

  // 2. Works in those topics, grouped by source.
  const groups = parseSourceGroups(await realFetchJson(worksByTopicGroupUrl({ topicIds, fromDate, mailto })));
  const candidates = selectCandidates(groups, { knownSourceIds, minCount: MIN_COUNT });

  // 3. Fetch candidate metadata, build pending review entries.
  const sources = [];
  for (const c of candidates.slice(0, 100)) {
    try { sources.push(await realFetchJson(`https://api.openalex.org/sources/${c.sourceId}${mailto ? `?mailto=${mailto}` : ''}`)); }
    catch { /* skip */ }
  }
  const entries = toReviewEntries(sources.filter((s) => s.issn_l), today);

  await mkdir(join(ROOT, 'review'), { recursive: true });
  await writeFile(join(ROOT, 'review', 'boundary-review.json'), JSON.stringify(entries, null, 2) + '\n');
  process.stderr.write(`discover: ${entries.length} candidates queued for review\n`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run().catch((e) => { process.stderr.write(`discover failed: ${e.stack}\n`); process.exit(1); });
}
