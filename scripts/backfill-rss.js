// scripts/backfill-rss.js
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { extractFeedLinks, patternFeedUrls } from '../lib/rss-discover.js';
import { assessFeedHealth } from '../lib/rss.js';
import { computeBackends } from '../lib/schema.js';
import { normalizeIssn } from '../lib/issn.js';
import { fetchText as realFetchText } from '../lib/http.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const dateStr = (now) => new Date(now).toISOString().slice(0, 10);

// Candidate feed URLs to try for an entry lacking a live feed.
export function backfillCandidates(entry) {
  const c = [];
  if (entry.rss && entry.rss.url) c.push(entry.rss.url);
  c.push(...patternFeedUrls(entry));
  return [...new Set(c)];
}

// Try to find a live feed; returns an updated entry (or the same entry unchanged).
export async function backfillEntry(entry, { now, fetchText = realFetchText } = {}) {
  if (entry.rss && entry.rss.status === 'live') return entry;
  const candidates = backfillCandidates(entry);
  if (entry.homepage) {
    try { candidates.push(...extractFeedLinks(await fetchText(entry.homepage), entry.homepage)); }
    catch { /* homepage unreachable; rely on patterns */ }
  }
  for (const url of [...new Set(candidates)]) {
    try {
      const health = assessFeedHealth(await fetchText(url), now);
      if (health.status === 'live') {
        const updated = { ...entry, rss: { url, status: 'live', last_item_date: health.lastItemDate, last_checked: dateStr(now) } };
        return { ...updated, backends: computeBackends(updated) };
      }
    } catch { /* try next candidate */ }
  }
  return entry;
}

// Real run: backfill the live registry, write any newly-found feed URLs back to seeds.
async function run() {
  const now = Date.now();
  const registry = JSON.parse(await readFile(join(ROOT, 'data', 'registry.json'), 'utf-8'));
  const seedsPath = join(ROOT, 'seeds', 'seed-journals.json');
  const seeds = JSON.parse(await readFile(seedsPath, 'utf-8'));
  const seedByKey = new Map(seeds.map((s) => [normalizeIssn(s.issn) || s.name, s]));

  let found = 0;
  for (const entry of registry) {
    if (entry.rss && entry.rss.status === 'live') continue;
    const updated = await backfillEntry(entry, { now });
    if (updated.rss && updated.rss.status === 'live') {
      const seed = seedByKey.get(normalizeIssn(entry.issn_l) || entry.name);
      if (seed) { seed.rss_url = updated.rss.url; found++; }
    }
  }
  await writeFile(seedsPath, JSON.stringify(seeds, null, 2) + '\n');
  process.stderr.write(`backfill-rss: found ${found} new feeds (written to seeds)\n`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run().catch((e) => { process.stderr.write(`backfill-rss failed: ${e.stack}\n`); process.exit(1); });
}
