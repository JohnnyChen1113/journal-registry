// scripts/promote.js
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

export function partitionReviewed(queue) {
  return {
    approved: queue.filter((e) => e.status === 'approved'),
    remaining: queue.filter((e) => e.status !== 'approved'),
  };
}

export function toSeed(e) {
  const seed = {
    name: e.name,
    issn: e.issn_l,
    domain: e.domain,
    field_tags: e.field_tags || e.suggested_field_tags || [],
    tier: e.tier || 'specialist',
  };
  if (e.rss && e.rss.url) seed.rss_url = e.rss.url;
  return seed;
}

async function run() {
  const queuePath = join(ROOT, 'review', 'boundary-review.json');
  const seedsPath = join(ROOT, 'seeds', 'seed-journals.json');
  const queue = JSON.parse(await readFile(queuePath, 'utf-8'));
  const seeds = JSON.parse(await readFile(seedsPath, 'utf-8'));
  const { approved, remaining } = partitionReviewed(queue);
  const known = new Set(seeds.map((s) => s.issn).filter(Boolean));
  let added = 0;
  for (const e of approved) {
    if (e.issn_l && known.has(e.issn_l)) continue;
    seeds.push(toSeed(e));
    added++;
  }
  await writeFile(seedsPath, JSON.stringify(seeds, null, 2) + '\n');
  await writeFile(queuePath, JSON.stringify(remaining, null, 2) + '\n');
  process.stderr.write(`promote: added ${added} approved journals to seeds; ${remaining.length} left in queue\n`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run().catch((e) => { process.stderr.write(`promote failed: ${e.stack}\n`); process.exit(1); });
}
