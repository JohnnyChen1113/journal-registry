// test/backfill-rss.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import { backfillCandidates, backfillEntry } from '../scripts/backfill-rss.js';

const NOW = Date.parse('2026-05-31T00:00:00Z');
const LIVE = '<rss><channel><item><title>x</title><pubDate>Thu, 29 May 2026 00:00:00 GMT</pubDate></item></channel></rss>';

test('backfillCandidates includes a dead url to retry plus publisher patterns', () => {
  const c = backfillCandidates({ rss: { url: 'https://x/old', status: 'dead' }, homepage: 'https://www.nature.com/nbt/' });
  assert.ok(c.includes('https://x/old'));
  assert.ok(c.includes('https://www.nature.com/nbt.rss'));
});

test('backfillEntry sets a live feed found via candidates and recomputes backends', async () => {
  const entry = { issn_l: '1087-0156', name: 'Nature Biotechnology', homepage: 'https://www.nature.com/nbt/', rss: { url: null, status: 'none' }, backends: ['crossref', 'openalex'] };
  const fetchText = async (url) => (url === 'https://www.nature.com/nbt.rss' ? LIVE : (() => { throw new Error('HTTP 404'); })());
  const out = await backfillEntry(entry, { now: NOW, fetchText });
  assert.equal(out.rss.status, 'live');
  assert.equal(out.rss.url, 'https://www.nature.com/nbt.rss');
  assert.deepEqual(out.backends, ['rss', 'crossref', 'openalex']);
});

test('backfillEntry leaves entry unchanged when no live feed found', async () => {
  const entry = { issn_l: '0305-1048', name: 'NAR', homepage: 'https://academic.oup.com/nar', rss: { url: null, status: 'none' }, backends: ['crossref', 'openalex'] };
  const out = await backfillEntry(entry, { now: NOW, fetchText: async () => { throw new Error('HTTP 404'); } });
  assert.equal(out.rss.status, 'none');
  assert.deepEqual(out.backends, ['crossref', 'openalex']);
});

test('backfillEntry skips entries that already have a live feed', async () => {
  const entry = { rss: { url: 'https://x/feed', status: 'live' }, backends: ['rss', 'crossref', 'openalex'] };
  let called = false;
  const out = await backfillEntry(entry, { now: NOW, fetchText: async () => { called = true; return LIVE; } });
  assert.equal(called, false);
  assert.equal(out, entry);
});
