// test/discover-script.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import { selectCandidates, toReviewEntries } from '../scripts/discover.js';

test('selectCandidates keeps above-threshold sources not already known', () => {
  const groups = [{ sourceId: 'S1', count: 500 }, { sourceId: 'S2', count: 50 }, { sourceId: 'S3', count: 900 }];
  const out = selectCandidates(groups, { knownSourceIds: ['S3'], minCount: 100 });
  assert.deepEqual(out.map((g) => g.sourceId), ['S1']);
});

test('toReviewEntries builds pending review entries with suggested tags', () => {
  const src = { id: 'https://openalex.org/S1', display_name: 'New Journal', issn_l: '1111-2222', issn: ['1111-2222'], is_oa: true, counts_by_year: [{ works_count: 300 }], topics: [{ display_name: 'Genomics' }, { display_name: 'Evolutionary Biology' }] };
  const [e] = toReviewEntries([src], '2026-05-31');
  assert.equal(e.issn_l, '1111-2222');
  assert.equal(e.status, 'pending');
  assert.equal(e.discovered_at, '2026-05-31');
  assert.deepEqual(e.suggested_field_tags, ['genomics', 'evolutionary biology']);
});
