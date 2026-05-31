// test/promote.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import { partitionReviewed, toSeed } from '../scripts/promote.js';

test('partitionReviewed splits approved from the rest', () => {
  const q = [{ name: 'A', status: 'approved' }, { name: 'B', status: 'pending' }, { name: 'C', status: 'rejected' }];
  const { approved, remaining } = partitionReviewed(q);
  assert.deepEqual(approved.map((e) => e.name), ['A']);
  assert.deepEqual(remaining.map((e) => e.name), ['B', 'C']);
});

test('toSeed maps an approved review entry to a seed (issn pinned, rss optional)', () => {
  const seed = toSeed({ name: 'A', issn_l: '1111-2222', domain: 'core-bio', field_tags: ['genomics'], tier: 'specialist', rss: { url: 'https://x/feed', status: 'live' } });
  assert.deepEqual(seed, { name: 'A', issn: '1111-2222', domain: 'core-bio', field_tags: ['genomics'], tier: 'specialist', rss_url: 'https://x/feed' });
});

test('toSeed falls back to suggested_field_tags and default tier, omits rss when absent', () => {
  const seed = toSeed({ name: 'B', issn_l: '3333-4444', domain: 'core-bio', suggested_field_tags: ['evolution'] });
  assert.deepEqual(seed, { name: 'B', issn: '3333-4444', domain: 'core-bio', field_tags: ['evolution'], tier: 'specialist' });
});
