import test from 'node:test';
import assert from 'node:assert/strict';
import { candidateFeedUrls, probeEntry } from '../scripts/probe-rss.js';

const NOW = Date.parse('2026-05-29T00:00:00Z');
const LIVE_FEED = '<rss><channel><item><title>x</title><pubDate>Tue, 27 May 2026 00:00:00 GMT</pubDate></item></channel></rss>';

test('candidateFeedUrls returns the seed url when present, else empty', () => {
  assert.deepEqual(candidateFeedUrls({ rss: { url: 'https://x/feed' } }), ['https://x/feed']);
  assert.deepEqual(candidateFeedUrls({ rss: null }), []);
});

test('probeEntry marks live and computes backends when feed is healthy', async () => {
  const entry = { issn_l: '1476-4687', name: 'Nature', rss: { url: 'https://x/feed', status: 'none' } };
  const out = await probeEntry(entry, { now: NOW, fetchText: async () => LIVE_FEED });
  assert.equal(out.rss.status, 'live');
  assert.equal(out.rss.last_item_date, '2026-05-27');
  assert.deepEqual(out.backends, ['rss', 'crossref', 'openalex']);
});

test('probeEntry marks dead on fetch error but keeps api backends', async () => {
  const entry = { issn_l: '1476-4687', name: 'Nature', rss: { url: 'https://x/feed', status: 'none' } };
  const out = await probeEntry(entry, { now: NOW, fetchText: async () => { throw new Error('HTTP 404'); } });
  assert.equal(out.rss.status, 'dead');
  assert.deepEqual(out.backends, ['crossref', 'openalex']);
});

test('probeEntry with no rss keeps rss none and api backends', async () => {
  const entry = { issn_l: '0098-7484', name: 'JAMA', rss: null };
  const out = await probeEntry(entry, { now: NOW, fetchText: async () => LIVE_FEED });
  assert.equal(out.rss.status, 'none');
  assert.deepEqual(out.backends, ['crossref', 'openalex']);
});
