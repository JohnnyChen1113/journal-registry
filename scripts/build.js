import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { mergeSeedAndSource, resolveSource as realResolveSource } from './enrich.js';
import { probeEntry as realProbeEntry } from './probe-rss.js';
import { validateEntry } from '../lib/schema.js';
import { writeAll } from './emit.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

function dateStr(now) { return new Date(now).toISOString().slice(0, 10); }

// Pure-ish orchestration with injected async deps (network-free in tests).
export async function assembleRegistry({ seeds, now, resolveSource, probeEntry, mailto }) {
  const entries = [];
  for (const seed of seeds) {
    const src = await resolveSource(seed, { mailto });
    const merged = mergeSeedAndSource(seed, src);
    const probed = await probeEntry(merged, { now, mailto });
    const stamped = { ...probed, added_at: dateStr(now), updated_at: dateStr(now) };
    const { ok, errors } = validateEntry(stamped);
    if (!ok) throw new Error(`validation failed for ${seed.name}: ${errors.join('; ')}`);
    entries.push(stamped);
  }
  return entries;
}

// Real run: wire live deps, read seeds, assemble, write artifacts.
async function run() {
  const mailto = process.env.OPENALEX_MAILTO || undefined;
  const now = Date.now();
  const seeds = JSON.parse(await readFile(join(ROOT, 'seeds', 'seed-journals.json'), 'utf-8'));
  const entries = await assembleRegistry({
    seeds, now, mailto,
    resolveSource: realResolveSource,
    probeEntry: realProbeEntry,
  });
  await writeAll(entries, { dataDir: join(ROOT, 'data'), derivDir: join(ROOT, 'derivatives') });
  process.stderr.write(`registry: wrote ${entries.length} journals\n`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run().catch((err) => { process.stderr.write(`build failed: ${err.stack}\n`); process.exit(1); });
}
