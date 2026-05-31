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

// Merge freshly-discovered entries into an existing review queue: keep all existing
// entries (preserving curation status, incl. 'rejected' tombstones) and append only
// candidates whose issn_l is not already queued.
export function mergeReviewQueue(existing, fresh) {
  const queued = new Set(existing.map((e) => e.issn_l).filter(Boolean));
  const added = fresh.filter((e) => e.issn_l && !queued.has(e.issn_l));
  return [...existing, ...added];
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
    catch (err) { process.stderr.write(`discover: skipping topics for ${e.issn_l} — ${err.message}\n`); }
  }
  const topicIds = aggregateTopics(knownSources, 25);

  // 2. Works in those topics, grouped by source.
  const groups = parseSourceGroups(await realFetchJson(worksByTopicGroupUrl({ topicIds, fromDate, mailto })));
  const candidates = selectCandidates(groups, { knownSourceIds, minCount: MIN_COUNT });

  // 3. Fetch candidate metadata, build pending review entries.
  const sources = [];
  if (candidates.length > 100) process.stderr.write(`discover: ${candidates.length} candidates, capping at 100\n`);
  for (const c of candidates.slice(0, 100)) {
    try { sources.push(await realFetchJson(`https://api.openalex.org/sources/${c.sourceId}${mailto ? `?mailto=${mailto}` : ''}`)); }
    catch (err) { process.stderr.write(`discover: skipping source ${c.sourceId} — ${err.message}\n`); }
  }
  const fresh = toReviewEntries(sources.filter((s) => s.issn_l), today);

  const reviewPath = join(ROOT, 'review', 'boundary-review.json');
  let existing = [];
  try { existing = JSON.parse(await readFile(reviewPath, 'utf-8')); }
  catch (e) { if (e.code !== 'ENOENT') throw e; }
  const merged = mergeReviewQueue(existing, fresh);

  await mkdir(join(ROOT, 'review'), { recursive: true });
  await writeFile(reviewPath, JSON.stringify(merged, null, 2) + '\n');
  process.stderr.write(`discover: ${merged.length - existing.length} new candidates queued (${merged.length} total)\n`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run().catch((e) => { process.stderr.write(`discover failed: ${e.stack}\n`); process.exit(1); });
}
