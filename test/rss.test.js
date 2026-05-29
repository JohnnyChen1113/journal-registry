import test from 'node:test';
import assert from 'node:assert/strict';
import { parseFeed, assessFeedHealth } from '../lib/rss.js';

const FEED = (date) => `<?xml version="1.0"?><rss><channel>
  <item><title>Recent paper</title><link>https://x/1</link><pubDate>${date}</pubDate></item>
</channel></rss>`;

const NOW = Date.parse('2026-05-29T00:00:00Z');

test('parseFeed extracts items from RSS', () => {
  const items = parseFeed(FEED('Tue, 27 May 2026 00:00:00 GMT'));
  assert.equal(items.length, 1);
  assert.equal(items[0].title, 'Recent paper');
  assert.equal(items[0].link, 'https://x/1');
});

test('parseFeed extracts items from Atom entries', () => {
  const atom = `<?xml version="1.0"?><feed>
    <entry><title>Atom paper</title><link href="https://x/atom1"/><published>2026-05-20T00:00:00Z</published></entry>
  </feed>`;
  const items = parseFeed(atom);
  assert.equal(items.length, 1);
  assert.equal(items[0].title, 'Atom paper');
  assert.equal(items[0].link, 'https://x/atom1');
  assert.equal(items[0].pubDate, '2026-05-20T00:00:00Z');
});

test('assessFeedHealth = live when newest item is recent', () => {
  const h = assessFeedHealth(FEED('Tue, 27 May 2026 00:00:00 GMT'), NOW);
  assert.equal(h.status, 'live');
  assert.equal(h.lastItemDate, '2026-05-27');
});

test('assessFeedHealth = dead when newest item is stale', () => {
  const h = assessFeedHealth(FEED('Tue, 01 Jan 2020 00:00:00 GMT'), NOW);
  assert.equal(h.status, 'dead');
});

test('assessFeedHealth = dead when no items', () => {
  const h = assessFeedHealth('<rss><channel></channel></rss>', NOW);
  assert.equal(h.status, 'dead');
  assert.equal(h.lastItemDate, null);
});

test('assessFeedHealth = unknown when items have no parseable dates', () => {
  const feed = '<rss><channel><item><title>x</title><link>https://x/1</link></item></channel></rss>';
  const h = assessFeedHealth(feed, NOW);
  assert.equal(h.status, 'unknown');
  assert.equal(h.lastItemDate, null);
});
