import test from 'node:test';
import assert from 'node:assert/strict';
import { assembleRegistry } from '../scripts/build.js';

const NOW = Date.parse('2026-05-29T00:00:00Z');
const SEEDS = [
  { name: 'Nature', rss_url: 'https://x/nature.rss', domain: 'core-bio', field_tags: ['genomics'], tier: 'flagship' },
  { name: 'JAMA', domain: 'medicine', field_tags: ['clinical'], tier: 'flagship' },
];

test('assembleRegistry resolves, enriches, probes, validates, and stamps dates', async () => {
  const fakeResolve = async (seed) => ({
    id: `https://openalex.org/S-${seed.name}`,
    display_name: seed.name,
    issn_l: seed.name === 'Nature' ? '1476-4687' : '0098-7484',
    issn: [], host_organization_name: 'Pub', is_oa: false, counts_by_year: [{ works_count: 1000 }],
  });
  const fakeProbe = async (entry) => ({
    ...entry,
    rss: entry.rss ? { ...entry.rss, status: 'live', last_item_date: '2026-05-27' } : { url: null, status: 'none' },
    backends: entry.rss ? ['rss', 'crossref', 'openalex'] : ['crossref', 'openalex'],
  });

  const entries = await assembleRegistry({ seeds: SEEDS, now: NOW, resolveSource: fakeResolve, probeEntry: fakeProbe });

  assert.equal(entries.length, 2);
  const nature = entries.find((e) => e.name === 'Nature');
  assert.equal(nature.issn_l, '1476-4687');
  assert.equal(nature.rss.status, 'live');
  assert.deepEqual(nature.backends, ['rss', 'crossref', 'openalex']);
  assert.equal(nature.added_at, '2026-05-29');
  assert.equal(nature.updated_at, '2026-05-29');
});

test('assembleRegistry throws if any entry fails validation', async () => {
  const badResolve = async () => ({ id: 'https://openalex.org/S1', display_name: '', issn_l: null, issn: [] });
  const probe = async (e) => ({ ...e, backends: [] });
  await assert.rejects(
    () => assembleRegistry({ seeds: [{ name: 'X', domain: 'core-bio' }], now: NOW, resolveSource: badResolve, probeEntry: probe }),
    /validation failed/
  );
});
